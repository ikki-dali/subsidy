// おすすめ補助金取得API

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { Subsidy } from '@/types/database';
import { checkRateLimit, getRateLimitHeaders, getClientIp } from '@/lib/rate-limit';

function escapeForPostgrestJsonString(value: string): string {
  // `industry.cs.["..."]` に埋め込むため、JSON文字列として壊れないようにエスケープ
  return value
    .replace(/[\0\r\n]+/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .slice(0, 200);
}

// 業種名を正規化（表記揺れ対応）
function normalizeIndustry(industry: string): string[] {
  const mapping: Record<string, string[]> = {
    // Onboarding（コード値） -> DB/表示の揺れを吸収
    manufacturing: ['製造業', '製造'],
    construction: ['建設業', '建設'],
    it: ['IT・情報通信', 'IT・情報通信業', 'IT・情報サービス業', '情報通信業', 'IT', '情報サービス業', 'ソフトウェア'],
    retail: ['小売業', '商業', '卸売業・小売業'],
    wholesale: ['卸売業', '卸売業・小売業'],
    food: ['飲食業', '飲食', '飲食店', '宿泊業・飲食サービス業'],
    hospitality: ['観光・宿泊', '宿泊業', 'ホテル', '旅館'],
    transport: ['運輸・物流', '運輸業', '運輸', '運送業', '物流'],
    real_estate: ['不動産業', '不動産'],
    medical: ['医療・福祉', '医療', '福祉', 'ヘルスケア'],
    education: ['教育・学習支援', '教育'],
    agriculture: ['農林水産業', '農業', '林業', '水産業', '漁業'],
    other: ['全業種', 'その他'],

    '製造業': ['製造業', '製造'],
    // DBの業種タグ（scripts/tag-industries.ts）と揺れを吸収
    'IT・情報通信': ['IT・情報通信', 'IT・情報通信業', 'IT・情報サービス業', '情報通信業', 'IT', '情報サービス業', 'ソフトウェア'],
    '情報通信業': ['IT・情報通信', 'IT・情報通信業', 'IT・情報サービス業', '情報通信業', 'IT', '情報サービス業', 'ソフトウェア'],
    '卸売業・小売業': ['卸売業・小売業', '卸売業', '小売業', '商業'],
    '建設業': ['建設業', '建設'],
    'サービス業': ['サービス業', 'サービス'],
    '飲食業': ['飲食業', '飲食', '飲食店', '宿泊業・飲食サービス業'],
    '不動産業': ['不動産業', '不動産'],
    '運輸・物流': ['運輸・物流', '運輸業', '運輸', '運送業', '物流'],
    '運輸業': ['運輸・物流', '運輸業', '運輸', '運送業', '物流'],
    '医療・福祉': ['医療・福祉', '医療', '福祉', 'ヘルスケア'],
    '農林水産業': ['農林水産業', '農業', '林業', '水産業', '漁業'],
    'その他': ['その他', '全業種'],
    '全業種': ['全業種', 'その他'],
  };
  
  return mapping[industry] || [industry];
}

async function getSubsidies(
  orderBy: string,
  ascending: boolean,
  extraFilter?: (query: ReturnType<typeof supabase.from>) => ReturnType<typeof supabase.from>,
  limit = 6,
  onlyActive = true, // true: 募集中のみ / false: 募集終了も含む
  area?: string, // 地域フィルタ
  industry?: string // 業種フィルタ
): Promise<Subsidy[]> {
  const now = new Date().toISOString();
  const hasAreaFilter = area && area !== '全国';
  const hasIndustryFilter = industry && industry !== 'その他' && industry !== 'other';
  
  // フィルタが指定されている場合は、優先度付きで取得
  if (hasAreaFilter || hasIndustryFilter) {
    const results: Subsidy[] = [];
    const seenIds = new Set<string>();
    
    // 1. まず両方にマッチする補助金を取得
    if (hasAreaFilter && hasIndustryFilter) {
      let query = supabase
        .from('subsidies')
        .select('*')
        .contains('target_area', [area]);
      
      // 業種フィルタ（JGSONBの配列内検索）
      const industryVariants = normalizeIndustry(industry);
      // industry カラムがJSONB配列の場合、いずれかの業種名が含まれているかチェック
      query = query.or(industryVariants.map(v => `industry.cs.["${escapeForPostgrestJsonString(v)}"]`).join(','));

      if (onlyActive) {
        query = query.eq('is_active', true);
        query = query.or(`end_date.is.null,end_date.gte.${now}`);
      } else {
        // 募集終了も含める場合は、募集中を先に表示
        query = query.order('is_active', { ascending: false });
      }
      if (extraFilter) {
        query = extraFilter(query);
      }

      const { data } = await query.order(orderBy, { ascending }).limit(limit);
      for (const item of (data || []) as Subsidy[]) {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          results.push(item);
        }
      }
      
      if (results.length >= limit) {
        return results.slice(0, limit);
      }
    }

    // 2. 地域のみマッチする補助金を追加
    if (hasAreaFilter && results.length < limit) {
      let query = supabase
        .from('subsidies')
        .select('*')
        .contains('target_area', [area]);

      if (onlyActive) {
        query = query.eq('is_active', true);
        query = query.or(`end_date.is.null,end_date.gte.${now}`);
      } else {
        query = query.order('is_active', { ascending: false });
      }
      if (extraFilter) {
        query = extraFilter(query);
      }

      const { data } = await query.order(orderBy, { ascending }).limit(limit);
      for (const item of (data || []) as Subsidy[]) {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          results.push(item);
          if (results.length >= limit) break;
        }
      }
      
      if (results.length >= limit) {
        return results.slice(0, limit);
      }
    }

    // 3. 業種のみマッチする補助金を追加（全国対象）
    if (hasIndustryFilter && results.length < limit) {
      const industryVariants = normalizeIndustry(industry);
      let query = supabase
        .from('subsidies')
        .select('*')
        .or(industryVariants.map(v => `industry.cs.["${escapeForPostgrestJsonString(v)}"]`).join(','));

      if (onlyActive) {
        query = query.eq('is_active', true);
        query = query.or(`end_date.is.null,end_date.gte.${now}`);
      } else {
        query = query.order('is_active', { ascending: false });
      }
      if (extraFilter) {
        query = extraFilter(query);
      }

      const { data } = await query.order(orderBy, { ascending }).limit(limit);
      for (const item of (data || []) as Subsidy[]) {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          results.push(item);
          if (results.length >= limit) break;
        }
      }
      
      if (results.length >= limit) {
        return results.slice(0, limit);
      }
    }

    // 4. 全国対象の補助金で補完
    if (results.length < limit) {
      let query = supabase
        .from('subsidies')
        .select('*')
        .contains('target_area', ['全国']);

      if (onlyActive) {
        query = query.eq('is_active', true);
        query = query.or(`end_date.is.null,end_date.gte.${now}`);
      } else {
        query = query.order('is_active', { ascending: false });
      }
      if (extraFilter) {
        query = extraFilter(query);
      }

      const { data } = await query.order(orderBy, { ascending }).limit(limit);
      for (const item of (data || []) as Subsidy[]) {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          results.push(item);
          if (results.length >= limit) break;
        }
      }
    }

    return results.slice(0, limit);
  }

  // フィルタ指定がない場合は従来通り
  let query = supabase
    .from('subsidies')
    .select('*');

  if (onlyActive) {
    query = query.eq('is_active', true);
    query = query.or(`end_date.is.null,end_date.gte.${now}`);
  } else {
    query = query.order('is_active', { ascending: false });
  }

  if (extraFilter) {
    query = extraFilter(query);
  }

  const { data } = await query
    .order(orderBy, { ascending })
    .limit(limit);

  return (data || []) as Subsidy[];
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get('category') || 'all';
  const limit = parseInt(searchParams.get('limit') || '6', 10);
  const area = searchParams.get('area') || undefined;
  const industry = searchParams.get('industry') || undefined;
  // category=all のときのみ有効: active=true で募集中のみ
  const activeOnlyForAll = searchParams.get('active') === 'true';

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
    let subsidies: Subsidy[] = [];

    switch (category) {
      case 'ai_dx': {
        // 1) 手動ピン（募集終了も含む）を最優先で取得（パーソナライズはかけない＝全員に見せる）
        const pinned = await getSubsidies(
          'updated_at',
          false,
          (q) => q.eq('ai_dx_featured', true),
          limit,
          false,
          undefined,
          undefined
        );

        const remaining = Math.max(0, limit - pinned.length);
        if (remaining === 0) {
          subsidies = pinned.slice(0, limit);
          break;
        }

        // 2) 自動判定（募集中のみ）で残りを補完
        // AI/IT/DX系キーワード（効率化・省力化系も含む）
        const AI_DX_KEYWORDS = [
          // AI系
          'AI',
          '人工知能',
          '生成AI',
          'ChatGPT',
          '機械学習',
          // DX・デジタル系
          'DX',
          'IT導入',
          'IT補助',
          'ICT',
          'デジタル化',
          'デジタルトランスフォーメーション',
          // 効率化・省力化系
          '効率化',
          '省力化',
          '省人化',
          '自動化',
          '業務改善',
          // ツール・サービス系
          'RPA',
          'クラウド',
          'SaaS',
          'サイバーセキュリティ',
          'IoT',
          'OCR',
          'チャットボット',
          'ロボット',
          // 働き方系
          'テレワーク',
          'リモートワーク',
          'BCP',
          // Web系
          'EC構築',
          'ホームページ',
          'Webサイト',
          'ECサイト',
          // システム系
          'システム導入',
          'システム構築',
          '基幹システム',
          '情報システム',
        ] as const;

        // タイトルとキャッチフレーズのみで判定（業種タグは全業種向け補助金で誤マッチするため除外）
        const keywordFilters = AI_DX_KEYWORDS.flatMap((kw) => [
          `title.ilike.%${kw}%`,
          `catch_phrase.ilike.%${kw}%`,
        ]);

        const orFilter = keywordFilters.join(',');
        const excludeIds = pinned.map((s) => s.id);

        const auto = await getSubsidies(
          'end_date',
          true,
          (q) => {
            let qq = q.or(orFilter);
            if (excludeIds.length > 0) {
              qq = qq.not('id', 'in', `(${excludeIds.join(',')})`);
            }
            return qq;
          },
          remaining,
          true,
          area,
          industry
        );

        // 重複を除去（ピン→自動の順で並べる）
        const seen = new Set<string>();
        subsidies = [...pinned, ...auto]
          .filter((item) => {
            if (seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
          })
          .slice(0, limit);
        break;
      }

      case 'deadline': // 締切間近
        subsidies = await getSubsidies('end_date', true, undefined, limit, true, area, industry);
        break;

      case 'popular': // 高額補助
        subsidies = await getSubsidies(
          'max_amount',
          false,
          (q) => q.not('max_amount', 'is', null),
          limit,
          true,
          area,
          industry
        );
        break;

      case 'new': // 新着
        subsidies = await getSubsidies('created_at', false, undefined, limit, true, area, industry);
        break;

      case 'highrate': // 高補助率
        subsidies = await getSubsidies(
          'subsidy_rate',
          false,
          (q) => q.not('subsidy_rate', 'is', null),
          limit,
          true,
          area,
          industry
        );
        break;

      default: { // all: AI/IT/DX優先 + 各カテゴリから取得してマージ
        // AI/IT/DX系を常に上位に出す（サイトのコンセプト）
        // タイトルとキャッチフレーズのキーワードのみで判定（業種タグは全業種向け補助金で誤マッチするため除外）
        const AI_DX_KEYWORDS_ALL = [
          // AI系
          'AI', '人工知能', '生成AI', 'ChatGPT', '機械学習',
          // DX・デジタル系
          'DX', 'IT導入', 'IT補助', 'ICT', 'デジタル化', 'デジタルトランスフォーメーション',
          // 効率化・省力化系
          '効率化', '省力化', '省人化', '自動化', '業務改善',
          // ツール・サービス系
          'RPA', 'クラウド', 'SaaS', 'サイバーセキュリティ', 'IoT', 'OCR', 'チャットボット', 'ロボット',
          // 働き方系
          'テレワーク', 'リモートワーク', 'BCP',
          // Web系
          'EC構築', 'ホームページ', 'Webサイト', 'ECサイト',
          // システム系
          'システム導入', 'システム構築', '基幹システム', '情報システム',
        ];
        const keywordFiltersAll = AI_DX_KEYWORDS_ALL.flatMap((kw) => [
          `title.ilike.%${kw}%`,
          `catch_phrase.ilike.%${kw}%`,
        ]);
        const orFilterAll = keywordFiltersAll.join(',');

        // まずAI/IT/DX系を優先取得（最大半分）
        const aiDxCount = Math.ceil(limit / 2);
        const aiDxSubsidies = await getSubsidies(
          'end_date',
          true,
          (q) => q.or(orFilterAll),
          aiDxCount,
          true,
          area,
          industry
        );

        const seenAll = new Set<string>(aiDxSubsidies.map(s => s.id));
        const remainingAll = Math.max(0, limit - aiDxSubsidies.length);

        // 残りを締切間近・新着で補完
        const endedSlots = activeOnlyForAll ? 0 : Math.min(2, Math.floor(remainingAll / 3));
        const activeSlots = Math.max(0, remainingAll - endedSlots);
        const deadlineCount = Math.ceil(activeSlots / 2);
        const recentCount = Math.max(0, activeSlots - deadlineCount);

        const excludeIdsAll = [...seenAll];
        const [deadline, recent, ended] = await Promise.all([
          deadlineCount > 0
            ? getSubsidies('end_date', true, excludeIdsAll.length > 0 ? (q) => q.not('id', 'in', `(${excludeIdsAll.join(',')})`) : undefined, deadlineCount, true, area, industry)
            : Promise.resolve([] as Subsidy[]),
          recentCount > 0
            ? getSubsidies('created_at', false, excludeIdsAll.length > 0 ? (q) => q.not('id', 'in', `(${excludeIdsAll.join(',')})`) : undefined, recentCount, true, area, industry)
            : Promise.resolve([] as Subsidy[]),
          endedSlots > 0
            ? getSubsidies('updated_at', false, excludeIdsAll.length > 0 ? (q) => q.eq('is_active', false).not('id', 'in', `(${excludeIdsAll.join(',')})`) : (q) => q.eq('is_active', false), endedSlots, false, area, industry)
            : Promise.resolve([] as Subsidy[]),
        ]);

        // 重複を除去（AI/IT/DX優先→締切間近→新着→募集終了の順で並べる）
        for (const item of [...deadline, ...recent, ...ended]) {
          if (!seenAll.has(item.id)) {
            seenAll.add(item.id);
            aiDxSubsidies.push(item);
          }
        }
        subsidies = aiDxSubsidies.slice(0, limit);
        break;
      }
    }

    return NextResponse.json({
      subsidies,
      category,
      area,
      industry,
      activeOnly: category === 'all' ? activeOnlyForAll : true,
    });
  } catch (e) {
    console.error('API error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
