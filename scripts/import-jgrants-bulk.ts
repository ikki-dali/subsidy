/**
 * J-Grants APIから取得した大量データをインポートするスクリプト
 *
 * 実行方法: npx tsx scripts/import-jgrants-bulk.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const JGRANTS_BASE_URL = 'https://api.jgrants-portal.go.jp/exp/v1/public';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

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
    .substring(0, 5000); // 長すぎる場合はカット
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

// 詳細情報を取得
async function fetchDetail(jgrantsId: string): Promise<JGrantsSubsidy | null> {
  try {
    const res = await fetch(`${JGRANTS_BASE_URL}/subsidies/id/${jgrantsId}`);
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
  console.log('J-Grants大量データインポート');
  console.log('実行日時:', new Date().toLocaleString('ja-JP'));
  console.log('='.repeat(60));

  // データ読み込み
  const rawData = fs.readFileSync('/tmp/jgrants-data.json', 'utf-8');
  const data = JSON.parse(rawData);
  const subsidies: JGrantsSubsidy[] = data.subsidies;

  console.log(`読み込み件数: ${subsidies.length}件`);

  // 締切日が今日以降のものだけフィルタ
  const today = new Date().toISOString();
  const activeSubsidies = subsidies.filter(s => {
    if (!s.acceptance_end_datetime) return true;
    return s.acceptance_end_datetime > today;
  });

  console.log(`締切が未来のもの: ${activeSubsidies.length}件`);

  let successCount = 0;
  let errorCount = 0;
  let enrichedCount = 0;

  for (let i = 0; i < activeSubsidies.length; i++) {
    const subsidy = activeSubsidies[i];

    // 進捗表示
    if ((i + 1) % 50 === 0 || i === activeSubsidies.length - 1) {
      console.log(`進捗: ${i + 1}/${activeSubsidies.length}件 (成功: ${successCount}, エラー: ${errorCount})`);
    }

    // 詳細を取得（概要を補完）
    let detail: JGrantsSubsidy | null = null;
    if (!subsidy.detail) {
      detail = await fetchDetail(subsidy.id);
      if (detail) enrichedCount++;
    }

    const finalSubsidy = detail || subsidy;

    const record = {
      jgrants_id: finalSubsidy.id,
      name: finalSubsidy.name,
      title: finalSubsidy.title?.substring(0, 200),
      catch_phrase: finalSubsidy.subsidy_catch_phrase || null,
      description: cleanHtml(finalSubsidy.detail) || null,
      target_area: parseArea(finalSubsidy.target_area_search),
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
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('subsidies')
      .upsert(record, { onConflict: 'jgrants_id' });

    if (error) {
      errorCount++;
    } else {
      successCount++;
    }

    // レート制限対策
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  console.log('\n' + '='.repeat(60));
  console.log('インポート完了');
  console.log(`  成功: ${successCount}件`);
  console.log(`  エラー: ${errorCount}件`);
  console.log(`  詳細取得: ${enrichedCount}件`);
  console.log('='.repeat(60));

  // 最終状態を確認
  const { count: total } = await supabase.from('subsidies').select('*', { count: 'exact', head: true });
  const { count: active } = await supabase.from('subsidies').select('*', { count: 'exact', head: true }).eq('is_active', true);
  const { count: noDesc } = await supabase.from('subsidies').select('*', { count: 'exact', head: true }).is('description', null);
  const { count: noAmount } = await supabase.from('subsidies').select('*', { count: 'exact', head: true }).is('max_amount', null);

  console.log('\n=== データベース状態 ===');
  console.log(`総件数: ${total}`);
  console.log(`募集中: ${active}件`);
  console.log(`概要あり: ${total! - noDesc!}件 (${Math.round((total! - noDesc!) / total! * 100)}%)`);
  console.log(`金額あり: ${total! - noAmount!}件 (${Math.round((total! - noAmount!) / total! * 100)}%)`);
}

main();
