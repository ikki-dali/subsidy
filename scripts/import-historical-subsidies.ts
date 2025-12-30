/**
 * 過去の補助金データをインポートするスクリプト
 *
 * /tmp/jgrants-data.json から過去の補助金を読み込み、
 * 年度更新型としてDBに保存します。
 *
 * 実行方法: npx tsx scripts/import-historical-subsidies.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('環境変数が設定されていません');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

type JGrantsSubsidy = {
  id: string;
  name: string;
  title: string;
  target_area_search?: string;
  subsidy_max_limit?: number;
  acceptance_start_datetime?: string;
  acceptance_end_datetime?: string;
  target_number_of_employees?: string;
};

// 地域文字列を配列に変換
function parseArea(area?: string): string[] {
  if (!area) return [];
  return area.split(/[,\\/／]/).map(s => s.trim()).filter(Boolean);
}

async function main() {
  console.log('='.repeat(60));
  console.log('過去補助金データインポート');
  console.log('実行日時:', new Date().toLocaleString('ja-JP'));
  console.log('='.repeat(60));

  // JSONファイル読み込み
  const dataPath = '/tmp/jgrants-data.json';
  if (!fs.existsSync(dataPath)) {
    console.error('データファイルが見つかりません:', dataPath);
    process.exit(1);
  }

  const rawData = fs.readFileSync(dataPath, 'utf-8');
  const jsonData = JSON.parse(rawData);
  const subsidies: JGrantsSubsidy[] = jsonData.subsidies || [];

  console.log(`\n読み込み件数: ${subsidies.length}件`);

  // 既存のjgrants_idを取得
  const { data: existing } = await supabase
    .from('subsidies')
    .select('jgrants_id');

  const existingIds = new Set(existing?.map(e => e.jgrants_id) || []);
  console.log(`既存件数: ${existingIds.size}件`);

  // 新規のみフィルタリング
  const newSubsidies = subsidies.filter(s => !existingIds.has(s.id));
  console.log(`新規追加対象: ${newSubsidies.length}件`);

  if (newSubsidies.length === 0) {
    console.log('\n新規追加対象がありません');
    return;
  }

  // バッチ処理でインポート
  const BATCH_SIZE = 50;
  let successCount = 0;
  let errorCount = 0;

  console.log('\n【インポート中】');

  for (let i = 0; i < newSubsidies.length; i += BATCH_SIZE) {
    const batch = newSubsidies.slice(i, i + BATCH_SIZE);

    const records = batch.map(subsidy => ({
      jgrants_id: subsidy.id,
      name: subsidy.name,
      title: subsidy.title?.substring(0, 200),
      target_area: parseArea(subsidy.target_area_search),
      target_number_of_employees: subsidy.target_number_of_employees || null,
      max_amount: subsidy.subsidy_max_limit || null,
      start_date: subsidy.acceptance_start_datetime || null,
      end_date: subsidy.acceptance_end_datetime || null,
      is_active: true, // 年度更新型として残す
      updated_at: new Date().toISOString(),
    }));

    const { error, count } = await supabase
      .from('subsidies')
      .upsert(records, { onConflict: 'jgrants_id' });

    if (error) {
      errorCount += batch.length;
      console.error(`  バッチエラー (${i}-${i + batch.length}):`, error.message);
    } else {
      successCount += batch.length;
    }

    // 進捗表示
    if ((i + BATCH_SIZE) % 200 === 0 || i + BATCH_SIZE >= newSubsidies.length) {
      console.log(`  進捗: ${Math.min(i + BATCH_SIZE, newSubsidies.length)}/${newSubsidies.length}件`);
    }

    // レート制限対策
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // 結果確認
  const { count: total } = await supabase
    .from('subsidies')
    .select('*', { count: 'exact', head: true });

  const { count: active } = await supabase
    .from('subsidies')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  const { count: recruiting } = await supabase
    .from('subsidies')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
    .gte('end_date', new Date().toISOString());

  const { count: withAmount } = await supabase
    .from('subsidies')
    .select('*', { count: 'exact', head: true })
    .not('max_amount', 'is', null);

  console.log('\n' + '='.repeat(60));
  console.log('インポート完了');
  console.log('='.repeat(60));
  console.log(`成功: ${successCount}件`);
  console.log(`エラー: ${errorCount}件`);
  console.log('');
  console.log('=== データベース最終状態 ===');
  console.log(`総補助金データ: ${total}件`);
  console.log(`アクティブ: ${active}件`);
  console.log(`募集中: ${recruiting}件`);
  console.log(`金額情報あり: ${withAmount}件 (${Math.round(withAmount! / total! * 100)}%)`);
}

main();
