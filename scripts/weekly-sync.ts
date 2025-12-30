/**
 * 週次補助金データ同期スクリプト
 *
 * J-Grants APIから複数キーワードで募集中の補助金を取得し、
 * 詳細情報を補完してデータベースに保存します。
 *
 * 実行方法: npm run sync:weekly
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const JGRANTS_BASE_URL = 'https://api.jgrants-portal.go.jp/exp/v1/public';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('環境変数が設定されていません');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// 検索キーワードリスト（幅広く募集中の補助金を取得）
const KEYWORDS = [
  '補助金',
  '事業',
  '助成',
  '支援',
  '中小企業',
  '雇用',
  '創業',
  '設備',
  '投資',
  'IT',
  'デジタル',
  'エネルギー',
  '省エネ',
  '環境',
  '観光',
  '農業',
  '研究開発',
  'ものづくり',
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

// J-Grants APIからキーワードで検索
async function searchSubsidies(keyword: string): Promise<JGrantsSubsidy[]> {
  const params = new URLSearchParams({
    keyword,
    sort: 'acceptance_end_datetime',
    order: 'ASC',
    acceptance: '1', // 募集中のみ
  });

  const url = `${JGRANTS_BASE_URL}/subsidies?${params.toString()}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`  キーワード「${keyword}」検索エラー: ${res.status}`);
      return [];
    }

    const data = await res.json();
    return data.result || [];
  } catch (error) {
    console.error(`  キーワード「${keyword}」検索例外:`, error);
    return [];
  }
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

// 募集終了した補助金を非アクティブ化
async function deactivateExpired(): Promise<number> {
  const today = new Date().toISOString().split('T')[0];

  const { count, error } = await supabase
    .from('subsidies')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .lt('end_date', today)
    .eq('is_active', true);

  if (error) {
    console.error('非アクティブ化エラー:', error.message);
    return 0;
  }

  return count || 0;
}

async function main() {
  console.log('='.repeat(60));
  console.log('週次補助金データ同期');
  console.log('実行日時:', new Date().toLocaleString('ja-JP'));
  console.log('='.repeat(60));

  try {
    // 1. 全キーワードで検索してユニークな補助金を収集
    const allSubsidies = new Map<string, JGrantsSubsidy>();

    console.log('\n【フェーズ1】キーワード検索');
    for (const keyword of KEYWORDS) {
      const results = await searchSubsidies(keyword);
      console.log(`  「${keyword}」: ${results.length}件`);

      for (const subsidy of results) {
        if (!allSubsidies.has(subsidy.id)) {
          allSubsidies.set(subsidy.id, subsidy);
        }
      }

      // レート制限対策
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`\n  ユニーク件数: ${allSubsidies.size}件`);

    // 2. 各補助金の詳細を取得してDBに保存
    console.log('\n【フェーズ2】詳細取得＆DB保存');

    const subsidies = Array.from(allSubsidies.values());
    let successCount = 0;
    let errorCount = 0;
    let enrichedCount = 0;

    for (let i = 0; i < subsidies.length; i++) {
      const subsidy = subsidies[i];

      // 進捗表示
      if ((i + 1) % 20 === 0 || i === subsidies.length - 1) {
        console.log(`  進捗: ${i + 1}/${subsidies.length}件 (成功: ${successCount}, エラー: ${errorCount})`);
      }

      // 詳細を取得
      const detail = await fetchDetail(subsidy.id);
      if (detail) enrichedCount++;
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
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`\n同期完了: 成功 ${successCount}件, エラー ${errorCount}件`);
    console.log(`詳細取得成功: ${enrichedCount}件`);

    // 3. 募集終了した補助金を非アクティブ化
    const deactivated = await deactivateExpired();
    console.log(`非アクティブ化: ${deactivated}件`);

    // 4. 最終状態を確認
    const { count: total } = await supabase.from('subsidies').select('*', { count: 'exact', head: true });
    const { count: active } = await supabase.from('subsidies').select('*', { count: 'exact', head: true }).eq('is_active', true);
    const { count: noDesc } = await supabase.from('subsidies').select('*', { count: 'exact', head: true }).is('description', null);
    const { count: noAmount } = await supabase.from('subsidies').select('*', { count: 'exact', head: true }).is('max_amount', null);

    console.log('\n' + '='.repeat(60));
    console.log('データベース状態');
    console.log('='.repeat(60));
    console.log(`総件数: ${total}`);
    console.log(`募集中: ${active}件`);
    console.log(`概要あり: ${total! - noDesc!}件 (${Math.round((total! - noDesc!) / total! * 100)}%)`);
    console.log(`金額あり: ${total! - noAmount!}件 (${Math.round((total! - noAmount!) / total! * 100)}%)`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('エラーが発生しました:', error);
    process.exit(1);
  }
}

main();
