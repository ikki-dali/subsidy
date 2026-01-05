import { NextRequest, NextResponse } from 'next/server';
import { getAvailableSlots, CONSULTATION_CONFIG } from '@/lib/google-calendar';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 空き枠を取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json(
        { error: 'date parameter is required (YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    // 日付形式のバリデーション
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // 過去の日付チェック
    const targetDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (targetDate < today) {
      return NextResponse.json({
        date,
        slots: [],
        message: '過去の日付は選択できません',
      });
    }

    // 3ヶ月以上先はNG
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    if (targetDate > maxDate) {
      return NextResponse.json({
        date,
        slots: [],
        message: '3ヶ月以上先の日付は選択できません',
      });
    }

    // 空き枠を取得
    const slots = await getAvailableSlots(date);

    return NextResponse.json({
      date,
      slots,
      config: {
        durationMinutes: CONSULTATION_CONFIG.durationMinutes,
        businessHours: CONSULTATION_CONFIG.businessHours,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/consultation/availability:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

