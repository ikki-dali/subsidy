import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { getAdminFromRequest } from '@/lib/admin-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 予約一覧を取得
export async function GET(request: NextRequest) {
  // 管理者認証チェック
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    let query = supabaseAdmin
      .from('consultation_bookings')
      .select(`
        *,
        companies:company_id (
          id,
          name,
          email,
          contact_name,
          phone
        )
      `)
      .order('start_time', { ascending: true })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: bookings, error, count } = await query;

    if (error) {
      console.error('Error fetching consultations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch consultations' },
        { status: 500 }
      );
    }

    // 統計情報
    const { data: stats } = await supabaseAdmin
      .from('consultation_bookings')
      .select('status')
      .then(res => {
        const data = res.data || [];
        return {
          data: {
            total: data.length,
            pending: data.filter(b => b.status === 'pending').length,
            confirmed: data.filter(b => b.status === 'confirmed').length,
            completed: data.filter(b => b.status === 'completed').length,
            cancelled: data.filter(b => b.status === 'cancelled').length,
          }
        };
      });

    return NextResponse.json({
      bookings: bookings || [],
      stats,
      total: count,
    });
  } catch (error) {
    console.error('Error in GET /api/admin/consultations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 予約のステータスを更新
export async function PATCH(request: NextRequest) {
  // 管理者認証チェック
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: 'id and status are required' },
        { status: 400 }
      );
    }

    if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = { status };

    if (status === 'confirmed') {
      updateData.confirmed_at = new Date().toISOString();
    } else if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabaseAdmin
      .from('consultation_bookings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating consultation:', error);
      return NextResponse.json(
        { error: 'Failed to update consultation' },
        { status: 500 }
      );
    }

    return NextResponse.json({ booking: data });
  } catch (error) {
    console.error('Error in PATCH /api/admin/consultations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

