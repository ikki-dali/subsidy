/**
 * JGrants API 東京都・埼玉県専用同期スクリプト
 *
 * 東京都・埼玉県の補助金情報をJGrants APIから取得し、
 * AI/IT/DX系補助金を優先フラグ付きでDBに保存する。
 *
 * 実行方法: npx tsx scripts/sync-jgrants-kanto.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const JGRANTS_BASE_URL = 'https://api.jgrants-portal.go.jp/exp/v1/public';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// 対象地域（東京都・埼玉県に特化）
const TARGET_AREAS = ['東京都', '埼玉県'];

// AI/IT/DX関連キーワード（優先表示用）
const AI_IT_DX_KEYWORDS = [
  'AI', '人工知能', 'DX', 'デジタル', 'IT', 'ICT',
  'クラウド', 'IoT', 'RPA', 'テレワーク', 'リモートワーク',
  'EC', 'オンライン', 'システム', 'ソフトウェア',
  'データ', 'セキュリティ', 'サイバー', '自動化',
  'ロボット', '電子', 'デジタルトランスフォーメーション',
];

type JGrantsSubsidy = {
  id: string;
  name: string;
  title: string;
  subsidy_catch_phrase?: string;
  detail?: string;
  target_area_search?: string;
  target_area_detail?: string;
  industry?: string;
  use_purpose?: string;
  subsidy_max_limit?: number;
  subsidy_rate?: string;
  target_number_of_employees?: string;
  acceptance_start_datetime?: string;
  acceptance_end_datetime?: string;
  project_end_deadline?: string;
  front_subsidy_detail_page_url?: string;
};

type JGrantsListResponse = {
  result: JGrantsSubsidy[];
  metadata?: {
    resultset: {
      count: number;
    };
  };
};

// HTMLタグを除去
function cleanHtml(html: string | null | undefined): string | null {
  if (!html) return null;
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 5000);
}

// 業種文字列を配列に変換
function parseIndustry(industry?: string): string[] {
  if (!industry) return [];
  return industry.split('/').map(s => s.trim()).filter(Boolean);
}

// 地域文字列を配列に変換
function parseArea(area?: string): string[] {
  if (!area) return [];
  return area.split(/[,\\/／]/).map(s => s.trim()).filter(Boolean);
}

// AI/IT/DX関連かどうかを判定
function isAiItDxRelated(subsidy: JGrantsSubsidy): boolean {
  const searchText = [
    subsidy.title || '',
    subsidy.subsidy_catch_phrase || '',
    subsidy.detail || '',
    subsidy.use_purpose || '',
  ].join(' ').toLowerCase();

  return AI_IT_DX_KEYWORDS.some(keyword =>
    searchText.includes(keyword.toLowerCase())
  );
}

// JGrants APIから補助金一覧を取得
async function fetchSubsidiesForArea(area: string): Promise<JGrantsSubsidy[]> {
  const request = {
    acceptance: 1, // 募集中のみ
    area: area,
  };

  const url = new URL(`${JGRANTS_BASE_URL}/subsidies`);
  url.searchParams.set('request', JSON.stringify(request));

  console.log(`  Fetching: ${area}...`);

  const res = await fetch(url.toString(), {
    headers: {
      'User-Agent': 'SubsidyNavi/1.0',
    },
  });

  if (!res.ok) {
    console.error(`  Error: ${res.status} ${res.statusText}`);
    return [];
  }

  const data: JGrantsListResponse = await res.json();
  console.log(`  Found: ${data.result?.length || 0}件`);
  return data.result || [];
}

// 詳細情報を取得
async function fetchDetail(jgrantsId: string): Promise<JGrantsSubsidy | null> {
  try {
    const res = await fetch(`${JGRANTS_BASE_URL}/subsidies/id/${jgrantsId}`, {
      headers: {
        'User-Agent': 'SubsidyNavi/1.0',
      },
    });
    if (!res.ok) return null;

    const data = await res.json();
    if (!data.result || !data.result[0]) return null;

    return data.result[0];
  } catch {
    return null;
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('JGrants API 東京都・埼玉県同期');
  console.log('実行日時:', new Date().toLocaleString('ja-JP'));
  console.log('='.repeat(60));

  const allSubsidies: JGrantsSubsidy[] = [];

  // 各地域の補助金を取得
  for (const area of TARGET_AREAS) {
    const subsidies = await fetchSubsidiesForArea(area);
    allSubsidies.push(...subsidies);
    // レート制限対策
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // 重複を排除（IDベース）
  const uniqueSubsidies = Array.from(
    new Map(allSubsidies.map(s => [s.id, s])).values()
  );

  console.log(`\n合計: ${uniqueSubsidies.length}件（重複排除後）`);

  let successCount = 0;
  let errorCount = 0;
  let enrichedCount = 0;
  let aiItDxCount = 0;

  for (let i = 0; i < uniqueSubsidies.length; i++) {
    const subsidy = uniqueSubsidies[i];

    // 進捗表示
    if ((i + 1) % 20 === 0 || i === uniqueSubsidies.length - 1) {
      console.log(`進捗: ${i + 1}/${uniqueSubsidies.length}件`);
    }

    // 詳細を取得（概要がない場合）
    let finalSubsidy = subsidy;
    if (!subsidy.detail) {
      const detail = await fetchDetail(subsidy.id);
      if (detail) {
        finalSubsidy = detail;
        enrichedCount++;
      }
      // レート制限対策
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // AI/IT/DX関連判定
    const isAiItDx = isAiItDxRelated(finalSubsidy);
    if (isAiItDx) aiItDxCount++;

    // 地域を配列に変換
    const targetAreas = parseArea(finalSubsidy.target_area_search);
    
    // 東京都または埼玉県を含むことを確認
    const hasTargetArea = targetAreas.some(area =>
      TARGET_AREAS.some(target => area.includes(target))
    );

    // 全国対象も含める
    const isNationwide = targetAreas.includes('全国') || targetAreas.length === 0;

    if (!hasTargetArea && !isNationwide) {
      continue; // スキップ
    }

    const record = {
      jgrants_id: finalSubsidy.id,
      name: finalSubsidy.name,
      title: finalSubsidy.title?.substring(0, 200),
      catch_phrase: finalSubsidy.subsidy_catch_phrase || null,
      description: cleanHtml(finalSubsidy.detail) || null,
      target_area: targetAreas.length > 0 ? targetAreas : ['全国'],
      target_area_detail: finalSubsidy.target_area_detail || null,
      industry: parseIndustry(finalSubsidy.industry),
      use_purpose: finalSubsidy.use_purpose || null,
      target_number_of_employees: finalSubsidy.target_number_of_employees || null,
      max_amount: finalSubsidy.subsidy_max_limit || null,
      subsidy_rate: finalSubsidy.subsidy_rate || null,
      start_date: finalSubsidy.acceptance_start_datetime || null,
      end_date: finalSubsidy.acceptance_end_datetime || null,
      project_end_deadline: finalSubsidy.project_end_deadline || null,
      front_url: finalSubsidy.front_subsidy_detail_page_url || null,
      is_active: true,
      is_ai_it_dx: isAiItDx, // AI/IT/DX関連フラグ
      source: 'jgrants',
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('subsidies')
      .upsert(record, { onConflict: 'jgrants_id' });

    if (error) {
      errorCount++;
      if (errorCount <= 5) {
        console.error(`  Error: ${error.message}`);
      }
    } else {
      successCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('同期完了');
  console.log(`  成功: ${successCount}件`);
  console.log(`  エラー: ${errorCount}件`);
  console.log(`  詳細取得: ${enrichedCount}件`);
  console.log(`  AI/IT/DX関連: ${aiItDxCount}件`);
  console.log('='.repeat(60));

  // 最終状態を確認
  const { count: total } = await supabase
    .from('subsidies')
    .select('*', { count: 'exact', head: true });

  const { count: tokyo } = await supabase
    .from('subsidies')
    .select('*', { count: 'exact', head: true })
    .contains('target_area', ['東京都']);

  const { count: saitama } = await supabase
    .from('subsidies')
    .select('*', { count: 'exact', head: true })
    .contains('target_area', ['埼玉県']);

  console.log('\n=== データベース状態 ===');
  console.log(`総件数: ${total}`);
  console.log(`東京都: ${tokyo}件`);
  console.log(`埼玉県: ${saitama}件`);
}

main().catch(console.error);

