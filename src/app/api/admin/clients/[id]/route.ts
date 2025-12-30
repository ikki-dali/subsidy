/**
 * 管理画面クライアント詳細API
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // クライアント基本情報
    const { data: client, error: clientError } = await supabaseAdmin
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // 気になるリスト
    const { data: interests } = await supabaseAdmin
      .from('company_interests')
      .select('*')
      .eq('company_id', id)
      .order('created_at', { ascending: false });

    // 補助金情報を取得
    const subsidyIds = Array.from(new Set(interests?.map(i => i.subsidy_id) || []));
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

    // 気になるリストに補助金タイトルを追加
    const interestsWithTitles = (interests || []).map(i => ({
      ...i,
      subsidy_title: subsidiesMap[i.subsidy_id]?.title || '不明な補助金',
      subsidy_url: subsidiesMap[i.subsidy_id]?.official_url,
    }));

    // お気に入りリスト (company_favoritesテーブルが存在する場合)
    let favoritesWithTitles: Array<{
      id: string;
      subsidy_id: string;
      subsidy_title: string;
      subsidy_url: string | null;
      created_at: string;
    }> = [];

    try {
      const { data: favorites } = await supabaseAdmin
        .from('company_favorites')
        .select('*')
        .eq('company_id', id)
        .order('created_at', { ascending: false });

      if (favorites && favorites.length > 0) {
        const favSubsidyIds = Array.from(new Set(favorites.map(f => f.subsidy_id)));
        const { data: favSubsidies } = await supabaseAdmin
          .from('subsidies')
          .select('jgrants_id, title, official_url')
          .in('jgrants_id', favSubsidyIds);

        const favSubsidiesMap = (favSubsidies || []).reduce((acc, s) => {
          acc[s.jgrants_id] = { title: s.title, official_url: s.official_url };
          return acc;
        }, {} as Record<string, { title: string; official_url: string | null }>);

        favoritesWithTitles = favorites.map(f => ({
          id: f.id,
          subsidy_id: f.subsidy_id,
          subsidy_title: favSubsidiesMap[f.subsidy_id]?.title || '不明な補助金',
          subsidy_url: favSubsidiesMap[f.subsidy_id]?.official_url,
          created_at: f.created_at,
        }));
      }
    } catch {
      // テーブルがまだない場合は無視
    }

    return NextResponse.json({
      client,
      interests: interestsWithTitles,
      favorites: favoritesWithTitles,
    });
  } catch (error) {
    console.error('Client detail API error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
