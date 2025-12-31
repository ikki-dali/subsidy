// 補助金検索API（強化版）

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { checkRateLimit, getRateLimitHeaders, getClientIp } from '@/lib/rate-limit';

function sanitizeOrFilterValue(value: string, maxLength = 100): string {
  // PostgREST の `or()` フィルタ文字列注入を避けるため、予約文字を除去
  return value
    .replace(/[\0\r\n]+/g, ' ')
    .replace(/[(),]/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function sanitizePgArrayElement(value: string, maxLength = 50): string {
  // `filter(..., 'ov', '{a,b}')` の配列リテラルに埋め込むため、危険文字を除去
  // 対象は都道府県名などを想定
  return value
    .replace(/[\0\r\n]+/g, ' ')
    .replace(/[^0-9A-Za-zぁ-んァ-ン一-龯々〆〤ー・]/g, '')
    .slice(0, maxLength);
}

function escapeForPostgrestJsonString(value: string, maxLength = 200): string {
  // `industry.cs.["..."]` に埋め込むため、JSON文字列として壊れないようにエスケープ
  return value
    .replace(/[\0\r\n]+/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .slice(0, maxLength);
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  // 検索パラメータ
  const keyword = sanitizeOrFilterValue(searchParams.get('keyword') || '', 100);
  const area = sanitizePgArrayElement(searchParams.get('area') || '', 50);
  const industry = sanitizeOrFilterValue(searchParams.get('industry') || '', 100);
  const minAmount = searchParams.get('minAmount');
  const maxAmount = searchParams.get('maxAmount');
  const sortByRaw = searchParams.get('sort') || 'deadline';
  const sortBy = ['deadline', 'amount_desc', 'amount_asc', 'newest'].includes(sortByRaw) ? sortByRaw : 'deadline';
  // active=true で募集中のみ、active=false で全件（デフォルト）
  const activeOnly = searchParams.get('active') === 'true';
  const limitParam = parseInt(searchParams.get('limit') || '20', 10);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 100) : 20; // 最大100件
  const offsetParam = parseInt(searchParams.get('offset') || '0', 10);
  const offset = Number.isFinite(offsetParam) && offsetParam >= 0 ? offsetParam : 0;

  // Rate Limiting（公開API）
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(ip, request.nextUrl.pathname);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'リクエストが多すぎます。しばらくしてからお試しください。' },
      {
        status: 429,
        headers: getRateLimitHeaders(rateLimit),
      }
    );
  }

  try {
    let query = supabase
      .from('subsidies')
      .select('*', { count: 'exact' });

    // 募集中のみフィルター
    if (activeOnly) {
      query = query.eq('is_active', true);
      // 締切日が未来または未設定のものを取得
      const today = new Date().toISOString().split('T')[0];
      query = query.or(`end_date.gte.${today},end_date.is.null`);
    }

    // キーワード検索（タイトルとキャッチフレーズと説明文）
    if (keyword) {
      query = query.or(
        `title.ilike.%${keyword}%,catch_phrase.ilike.%${keyword}%,description.ilike.%${keyword}%`
      );
    }

    // 地域フィルター（指定地域 + 全国対象の補助金を表示）
    // target_areaはtext[]配列なので、overlaps (ov) オペレータを使用
    if (area && area !== '全国') {
      // 指定地域または全国を含むものを表示
      query = query.filter('target_area', 'ov', `{${area},全国}`);
    }

    // 業種フィルター（配列カラムでフィルタリング）
    // JSONB配列なので、cs (contains) オペレータにはJSON配列構文を使用
    if (industry) {
      if (industry === '全業種') {
        // 全業種タグを持つもの、またはタグが空/nullのものを表示
        query = query.or('industry.cs.["全業種"],industry.is.null,industry.eq.[]');
      } else {
        // 指定業種を含む、または全業種タグを持つものを表示
        const safeIndustry = escapeForPostgrestJsonString(industry);
        query = query.or(`industry.cs.["${safeIndustry}"],industry.cs.["全業種"]`);
      }
    }

    // 金額範囲フィルター（max_amountがnullでないレコードのみ）
    if (minAmount || maxAmount) {
      // まずmax_amountがnullでないことを確認
      query = query.not('max_amount', 'is', null);
      
      if (minAmount) {
        const min = parseInt(minAmount, 10);
        if (!isNaN(min)) {
          query = query.gte('max_amount', min);
        }
      }
      if (maxAmount) {
        const max = parseInt(maxAmount, 10);
        if (!isNaN(max)) {
          query = query.lte('max_amount', max);
        }
      }
    }

    // ソート（募集中を優先）
    // まずis_activeでソート（trueが先）
    query = query.order('is_active', { ascending: false });
    
    switch (sortBy) {
      case 'deadline':
        query = query.order('end_date', { ascending: true, nullsFirst: false });
        break;
      case 'amount_desc':
        query = query.order('max_amount', { ascending: false, nullsFirst: true });
        break;
      case 'amount_asc':
        query = query.order('max_amount', { ascending: true, nullsFirst: true });
        break;
      case 'newest':
        query = query.order('updated_at', { ascending: false });
        break;
      default:
        query = query.order('end_date', { ascending: true, nullsFirst: false });
    }

    // ページネーション
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase error:', error);
      console.error('Query params:', { keyword, area, industry, minAmount, maxAmount, sortBy, activeOnly, limit, offset });
      return NextResponse.json({ 
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error : undefined
      }, { status: 500 });
    }

    return NextResponse.json({
      subsidies: data || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (e) {
    console.error('API error:', e);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? String(e) : undefined
    }, { status: 500 });
  }
}
