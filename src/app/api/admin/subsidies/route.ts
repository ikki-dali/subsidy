/**
 * 管理画面補助金一覧API
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const search = searchParams.get('search') || '';
    const filter = searchParams.get('filter') || ''; // no_amount, active, inactive
    const sortBy = searchParams.get('sort') || 'updated_at';
    const sortOrder = searchParams.get('order') === 'asc' ? true : false;

    let query = supabaseAdmin
      .from('subsidies')
      .select('id, jgrants_id, title, max_amount, subsidy_rate, is_active, end_date, official_url, created_at, updated_at', { count: 'exact' });

    // 検索
    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    // フィルター
    if (filter === 'no_amount') {
      query = query.is('max_amount', null);
    } else if (filter === 'active') {
      query = query.eq('is_active', true);
    } else if (filter === 'inactive') {
      query = query.eq('is_active', false);
    }

    // ソート
    const validSortFields = ['updated_at', 'created_at', 'title', 'max_amount', 'end_date'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'updated_at';
    query = query.order(sortField, { ascending: sortOrder, nullsFirst: false });

    // ページネーション
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Subsidies fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      subsidies: data || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Subsidies API error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
