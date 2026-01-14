// 補助金検索API（強化版）

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { checkRateLimit, getRateLimitHeaders, getClientIp } from '@/lib/rate-limit';
import { getCachedSearchResults } from '@/lib/cache';

function sanitizeOrFilterValue(value: string, maxLength = 100): string {
  // PostgREST の `or()` フィルタ文字列注入を避けるため、予約文字を除去
  return value
    .replace(/[\0\r\n]+/g, ' ')
    .replace(/[(),]/g, ' ')
    .trim()
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
  // 足立区特化: 地域フィルターはデフォルトで足立区・東京都・全国
  const industry = sanitizeOrFilterValue(searchParams.get('industry') || '', 100);
  // MECE分類: 実施主体フィルター (adachi, tokyo, national, other, all)
  const sourceRaw = searchParams.get('source') || 'all';
  const source = ['adachi', 'tokyo', 'national', 'other', 'all'].includes(sourceRaw) ? sourceRaw : 'all';
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
  const rateLimit = await checkRateLimit(ip, request.nextUrl.pathname);
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
    // キャッシュキー用のパラメータ（足立区特化: 地域は固定）
    const cacheParams = {
      keyword: keyword || null,
      area: 'adachi', // 足立区特化のキャッシュキー
      source, // MECE分類: 実施主体
      industry: industry || null,
      minAmount,
      maxAmount,
      sort: sortBy,
      active: activeOnly ? 'true' : null,
      limit: String(limit),
      offset: String(offset),
    };

    // キャッシュ付きでデータを取得
    const result = await getCachedSearchResults(cacheParams, async () => {
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

      // MECE分類: 実施主体別フィルター
      // target_areaはtext[]配列なので、contains (cs) と overlaps (ov) を使用
      switch (source) {
        case 'adachi':
          // 足立区: target_areaに「足立区」を含む
          query = query.contains('target_area', ['足立区']);
          break;
        case 'tokyo':
          // 東京都: target_areaに「東京都」を含む AND 「足立区」を含まない
          query = query.contains('target_area', ['東京都']);
          query = query.not('target_area', 'cs', '{足立区}');
          break;
        case 'national':
          // 国（全国）: target_areaに「全国」を含む AND 「足立区」「東京都」を含まない
          query = query.contains('target_area', ['全国']);
          query = query.not('target_area', 'cs', '{足立区}');
          query = query.not('target_area', 'cs', '{東京都}');
          break;
        case 'other':
          // その他: 足立区、東京都、全国のいずれも含まない
          query = query.not('target_area', 'ov', '{足立区,東京都,全国}');
          break;
        case 'all':
        default:
          // 全て: 足立区・東京都・全国対象の補助金を表示
          query = query.filter('target_area', 'ov', '{足立区,東京都,全国}');
          break;
      }

      // セミナー・説明会・相談会系を除外
      query = query
        .not('title', 'ilike', '%セミナー%')
        .not('title', 'ilike', '%説明会%')
        .not('title', 'ilike', '%相談会%')
        .not('title', 'ilike', '%勉強会%')
        .not('title', 'ilike', '%講座%')
        .not('title', 'ilike', '%研修%');

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
        console.error('Query params:', { keyword, industry, minAmount, maxAmount, sortBy, activeOnly, limit, offset });
        throw error;
      }

      // AI/IT/DX関連を優先表示（スコアリング）- 明確なキーワードのみ
      const AI_PRIORITY_KEYWORDS = [
        'AI', '人工知能', '生成AI', 'ChatGPT', '機械学習',
        'DX', 'IT導入', 'IT補助', 'ICT', 'デジタル化',
        'RPA', 'クラウド', 'SaaS', 'IoT',
        'テレワーク', 'EC構築', 'ホームページ', 'Webサイト', 'ECサイト',
        'サイバーセキュリティ', 'OCR', 'チャットボット',
      ];

      const getAiScore = (subsidy: { title?: string | null; catch_phrase?: string | null }) => {
        const text = `${subsidy.title || ''} ${subsidy.catch_phrase || ''}`.toLowerCase();
        let score = 0;
        for (const kw of AI_PRIORITY_KEYWORDS) {
          if (text.includes(kw.toLowerCase())) {
            score += 10;
          }
        }
        return score;
      };

      // セミナー系をJavaScriptでも除外（DBクエリで漏れる場合の保険）
      const SEMINAR_KEYWORDS = ['セミナー', '説明会', '相談会', '勉強会', '講座', '研修'];
      const filteredData = (data || []).filter((item) => {
        const title = item.title || '';
        return !SEMINAR_KEYWORDS.some(kw => title.includes(kw));
      });

      // AI関連スコアで並び替え（同スコア内は元の順序を維持）
      const sortedData = [...filteredData].sort((a, b) => {
        const scoreA = getAiScore(a);
        const scoreB = getAiScore(b);
        return scoreB - scoreA; // スコア高い順
      });

      return {
        subsidies: sortedData,
        total: count || 0, // 元の件数を維持（セミナー除外前）
        limit,
        offset,
      };
    });

    return NextResponse.json(result);
  } catch (e) {
    console.error('API error:', e);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? String(e) : undefined
    }, { status: 500 });
  }
}
