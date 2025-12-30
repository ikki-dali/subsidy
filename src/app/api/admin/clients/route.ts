/**
 * 管理画面クライアント一覧API
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function sanitizeOrFilterValue(value: string, maxLength = 100): string {
  // PostgREST の `or()` フィルタ文字列注入を避けるため、区切り文字等を除去
  return value
    .replace(/[\0\r\n]+/g, ' ')
    .replace(/[(),]/g, ' ')
    .trim()
    .slice(0, maxLength);
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const search = sanitizeOrFilterValue(searchParams.get('search') || '');
    const prefecture = searchParams.get('prefecture') || '';
    const industry = searchParams.get('industry') || '';
    const sortBy = searchParams.get('sort') || 'created_at';
    const sortOrder = searchParams.get('order') === 'asc' ? true : false;

    let query = supabaseAdmin
      .from('companies')
      .select('*', { count: 'exact' });

    // 検索
    if (search) {
      query = query.or(`name.ilike.%${search}%,contact_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // フィルター
    if (prefecture) {
      query = query.eq('prefecture', prefecture);
    }
    if (industry) {
      query = query.eq('industry', industry);
    }

    // ソート
    const validSortFields = ['created_at', 'name', 'prefecture', 'industry'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    query = query.order(sortField, { ascending: sortOrder });

    // ページネーション
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Clients fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 各クライアントの気になる・お気に入り数を取得
    const clientIds = data?.map(c => c.id) || [];
    
    let interestCounts: Record<string, number> = {};
    let favoriteCounts: Record<string, number> = {};

    if (clientIds.length > 0) {
      // 気になる数
      const { data: interests } = await supabaseAdmin
        .from('company_interests')
        .select('company_id')
        .in('company_id', clientIds);
      
      if (interests) {
        interestCounts = interests.reduce((acc, i) => {
          acc[i.company_id] = (acc[i.company_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
      }

      // お気に入り数 (company_favoritesテーブルが存在する場合)
      try {
        const { data: favorites } = await supabaseAdmin
          .from('company_favorites')
          .select('company_id')
          .in('company_id', clientIds);
        
        if (favorites) {
          favoriteCounts = favorites.reduce((acc, f) => {
            acc[f.company_id] = (acc[f.company_id] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
        }
      } catch {
        // テーブルがまだない場合は無視
      }
    }

    // レスポンス整形
    const clients = (data || []).map(client => ({
      ...client,
      interests_count: interestCounts[client.id] || 0,
      favorites_count: favoriteCounts[client.id] || 0,
    }));

    return NextResponse.json({
      clients,
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Clients API error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
