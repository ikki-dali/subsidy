/**
 * 管理画面「気になる」リクエスト管理API
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// リクエスト一覧取得
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const status = searchParams.get('status'); // interested, contacted, applied, rejected
    const unreadOnly = searchParams.get('unread') === 'true';

    // company_interests と companies, subsidies をJOIN
    let query = supabaseAdmin
      .from('company_interests')
      .select(`
        id,
        subsidy_id,
        note,
        status,
        read_at,
        created_at,
        updated_at,
        companies!inner (
          id,
          name,
          contact_name,
          email,
          phone,
          industry,
          prefecture
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    // フィルター
    if (status) {
      query = query.eq('status', status);
    }
    if (unreadOnly) {
      query = query.is('read_at', null);
    }

    // ページネーション
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Interests fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 補助金情報を取得
    const subsidyIds = Array.from(new Set(data?.map(d => d.subsidy_id) || []));
    let subsidiesMap: Record<string, { title: string; official_url: string | null }> = {};
    
    if (subsidyIds.length > 0) {
      const { data: subsidies } = await supabaseAdmin
        .from('subsidies')
        .select('jgrants_id, title, official_url')
        .in('jgrants_id', subsidyIds);
      
      if (subsidies) {
        subsidiesMap = subsidies.reduce((acc, s) => {
          acc[s.jgrants_id] = { title: s.title, official_url: s.official_url };
          return acc;
        }, {} as typeof subsidiesMap);
      }
    }

    // レスポンス整形
    const interests = (data || []).map(item => ({
      id: item.id,
      subsidy_id: item.subsidy_id,
      subsidy_title: subsidiesMap[item.subsidy_id]?.title || '不明な補助金',
      subsidy_url: subsidiesMap[item.subsidy_id]?.official_url,
      note: item.note,
      status: item.status,
      read_at: item.read_at,
      created_at: item.created_at,
      updated_at: item.updated_at,
      company_id: (item.companies as { id: string }).id,
      company_name: (item.companies as { name: string }).name,
      contact_name: (item.companies as { contact_name: string }).contact_name,
      email: (item.companies as { email: string }).email,
      phone: (item.companies as { phone?: string }).phone,
      industry: (item.companies as { industry: string }).industry,
      prefecture: (item.companies as { prefecture: string }).prefecture,
    }));

    return NextResponse.json({
      interests,
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Interests API error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// ステータス更新・既読マーク
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, markAsRead } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const updateData: Record<string, string | Date> = {};
    
    if (status) {
      const validStatuses = ['interested', 'contacted', 'applied', 'rejected'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      updateData.status = status;
    }

    if (markAsRead) {
      updateData.read_at = new Date().toISOString();
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No update data provided' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('company_interests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Interest update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, interest: data });
  } catch (error) {
    console.error('Interest PATCH error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// 一括既読マーク
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ids } = body;

    if (action === 'mark_all_read') {
      // 全件既読
      const { error } = await supabaseAdmin
        .from('company_interests')
        .update({ read_at: new Date().toISOString() })
        .is('read_at', null);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'mark_read' && Array.isArray(ids)) {
      // 選択したものを既読
      const { error } = await supabaseAdmin
        .from('company_interests')
        .update({ read_at: new Date().toISOString() })
        .in('id', ids);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Interest POST error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
