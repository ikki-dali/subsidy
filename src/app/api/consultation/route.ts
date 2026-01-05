import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { getCompanyIdFromToken } from '@/lib/auth';
import { createCalendarEvent, getAvailableSlots } from '@/lib/google-calendar';
import { notifyNewConsultationBooking } from '@/lib/slack';
import { sendConsultationConfirmationEmail } from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = supabaseAdmin as any;

// 相談予約一覧を取得
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    const companyId = await getCompanyIdFromToken(token);

    if (!companyId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: bookings, error } = await supabase
      .from('consultation_bookings')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching consultation bookings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch bookings' },
        { status: 500 }
      );
    }

    return NextResponse.json({ bookings: bookings || [] });
  } catch (error) {
    console.error('Error in GET /api/consultation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 新しい相談予約を作成（空き枠選択方式）
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    const companyId = await getCompanyIdFromToken(token);

    if (!companyId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      date,           // YYYY-MM-DD
      startTime,      // HH:mm (例: "10:00")
      consultationTopic, 
      contactName, 
      contactPhone, 
      useFreeSlot 
    } = body;

    // バリデーション
    if (!date || !startTime) {
      return NextResponse.json(
        { error: '日付と時間は必須です' },
        { status: 400 }
      );
    }

    // 日付形式チェック
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: '無効な日付形式です' },
        { status: 400 }
      );
    }

    // 時間形式チェック
    if (!/^\d{2}:\d{2}$/.test(startTime)) {
      return NextResponse.json(
        { error: '無効な時間形式です' },
        { status: 400 }
      );
    }

    // 過去の日付チェック
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(date);
    if (selectedDate < today) {
      return NextResponse.json(
        { error: '過去の日付は選択できません' },
        { status: 400 }
      );
    }

    // 空き枠の再確認（競合防止）
    const availableSlots = await getAvailableSlots(date);
    const isSlotAvailable = availableSlots.some(slot => slot.start === startTime);
    
    if (!isSlotAvailable) {
      return NextResponse.json(
        { error: 'この時間枠は既に予約されています' },
        { status: 409 }
      );
    }

    // 会社情報を取得
    const { data: company } = await supabase
      .from('companies')
      .select('name, email, free_consultation_slots')
      .eq('id', companyId)
      .single();

    if (!company) {
      return NextResponse.json(
        { error: '会社情報が見つかりません' },
        { status: 404 }
      );
    }

    // 無料枠を使う場合、残り枠数をチェック
    let isFree = false;
    if (useFreeSlot) {
      if ((company.free_consultation_slots || 0) < 1) {
        return NextResponse.json(
          { error: '無料相談枠がありません' },
          { status: 400 }
        );
      }
      isFree = true;
    }

    // Google Calendarにイベントを作成
    const calendarResult = await createCalendarEvent({
      date,
      startTime,
      companyName: company.name,
      contactName: contactName || undefined,
      consultationTopic: consultationTopic || undefined,
    });

    // 開始・終了時刻を計算
    const [hour, minute] = startTime.split(':').map(Number);
    const startDateTime = new Date(date);
    startDateTime.setHours(hour, minute, 0, 0);
    
    const endDateTime = new Date(date);
    endDateTime.setHours(hour + 1, minute, 0, 0); // バッファ込みで1時間

    // 予約を作成
    const { data: booking, error } = await supabase
      .from('consultation_bookings')
      .insert({
        company_id: companyId,
        preferred_date: date,
        preferred_time_slot: 'custom', // 新方式では使わないがNOT NULL制約のため
        consultation_topic: consultationTopic || null,
        contact_name: contactName || null,
        contact_phone: contactPhone || null,
        is_free: isFree,
        status: 'confirmed', // 空き枠選択方式では即確定
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        google_event_id: calendarResult?.eventId || null,
        meet_link: calendarResult?.meetLink || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating consultation booking:', error);
      return NextResponse.json(
        { error: 'Failed to create booking' },
        { status: 500 }
      );
    }

    // 無料枠を使用した場合、残り枠数を減らす
    if (isFree) {
      await supabase
        .from('companies')
        .update({
          free_consultation_slots: Math.max(0, (company.free_consultation_slots || 1) - 1),
        })
        .eq('id', companyId);
    }

    // Slack通知を送信
    await notifyNewConsultationBooking({
      companyName: company.name,
      contactName: contactName || undefined,
      contactPhone: contactPhone || undefined,
      date,
      startTime,
      consultationTopic: consultationTopic || undefined,
      meetLink: calendarResult?.meetLink || undefined,
      isFree,
    });

    // 予約確定メールを送信
    if (company.email) {
      await sendConsultationConfirmationEmail({
        to: company.email,
        companyName: company.name,
        contactName: contactName || undefined,
        date,
        startTime,
        consultationTopic: consultationTopic || undefined,
        meetLink: calendarResult?.meetLink || undefined,
        isFree,
      });
    }

    return NextResponse.json({
      success: true,
      booking: {
        ...booking,
        meetLink: calendarResult?.meetLink || null,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/consultation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
