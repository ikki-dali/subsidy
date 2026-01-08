/**
 * サンプルデータ削除スクリプト
 *
 * ハードコードされたサンプルデータ（tokyo-*, saitama-*, pref-*）を削除し、
 * 実データへの置換を準備する。
 *
 * 実行方法: npx tsx scripts/cleanup-sample-data.ts
 *
 * 注意: このスクリプトは本番データを削除します。実行前に確認してください。
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// 削除対象のjgrants_idパターン
const SAMPLE_DATA_PATTERNS = [
  'tokyo-chiyoda-%',
  'tokyo-chuo-%',
  'tokyo-minato-%',
  'tokyo-shinjuku-%',
  'tokyo-bunkyo-%',
  'tokyo-taito-%',
  'tokyo-sumida-%',
  'tokyo-koto-%',
  'tokyo-shinagawa-%',
  'tokyo-meguro-%',
  'tokyo-ota-%',
  'tokyo-setagaya-%',
  'tokyo-shibuya-%',
  'tokyo-nakano-%',
  'tokyo-suginami-%',
  'tokyo-toshima-%',
  'tokyo-kita-%',
  'tokyo-arakawa-%',
  'tokyo-itabashi-%',
  'tokyo-nerima-%',
  'tokyo-adachi-%',
  'tokyo-katsushika-%',
  'tokyo-edogawa-%',
  'tokyo-hachioji-%',
  'tokyo-tachikawa-%',
  'tokyo-musashino-%',
  'tokyo-mitaka-%',
  'tokyo-ome-%',
  'tokyo-fuchu-%',
  'tokyo-chofu-%',
  'tokyo-machida-%',
  'tokyo-koganei-%',
  'tokyo-kodaira-%',
  'tokyo-hino-%',
  'tokyo-higashimurayama-%',
  'tokyo-kokubunji-%',
  'tokyo-kunitachi-%',
  'tokyo-nishitokyo-%',
  'tokyo-tama-%',
  'tokyo-inagi-%',
  'tokyo-akishima-%',
  'tokyo-fussa-%',
  'tokyo-komae-%',
  'tokyo-higashiyamato-%',
  'tokyo-kiyose-%',
  'tokyo-higashikurume-%',
  'tokyo-musashimurayama-%',
  'tokyo-hamura-%',
  'tokyo-akiruno-%',
  'tokyo-shokokai-%',
  'saitama-kawagoe-%',
  'saitama-kawaguchi-%',
  'saitama-koshigaya-%',
  'saitama-saitama-%',
  'pref-tokyo-%',
  'pref-saitama-%',
];

async function main() {
  console.log('='.repeat(60));
  console.log('サンプルデータ削除スクリプト');
  console.log('実行日時:', new Date().toLocaleString('ja-JP'));
  console.log('='.repeat(60));

  // 現在のデータ状態を確認
  const { count: totalBefore } = await supabase
    .from('subsidies')
    .select('*', { count: 'exact', head: true });

  console.log(`\n現在の総件数: ${totalBefore}件`);

  // 削除対象のカウント
  let sampleCount = 0;
  for (const pattern of SAMPLE_DATA_PATTERNS) {
    const { count } = await supabase
      .from('subsidies')
      .select('*', { count: 'exact', head: true })
      .like('jgrants_id', pattern);
    sampleCount += count || 0;
  }

  console.log(`削除対象のサンプルデータ: ${sampleCount}件`);

  if (sampleCount === 0) {
    console.log('\n削除対象のサンプルデータはありません。');
    return;
  }

  // ドライラン確認
  const isDryRun = process.argv.includes('--dry-run');
  if (isDryRun) {
    console.log('\n[DRY RUN] 削除は実行されません。');
    
    // サンプルデータの一覧を表示
    console.log('\n削除予定のデータ:');
    for (const pattern of SAMPLE_DATA_PATTERNS) {
      const { data } = await supabase
        .from('subsidies')
        .select('jgrants_id, title')
        .like('jgrants_id', pattern)
        .limit(5);
      
      if (data && data.length > 0) {
        for (const item of data) {
          console.log(`  - ${item.jgrants_id}: ${item.title?.substring(0, 40)}...`);
        }
      }
    }
    return;
  }

  // 実際の削除
  console.log('\n削除を実行中...');
  let deletedCount = 0;

  for (const pattern of SAMPLE_DATA_PATTERNS) {
    const { error, count } = await supabase
      .from('subsidies')
      .delete()
      .like('jgrants_id', pattern);

    if (error) {
      console.error(`  Error deleting ${pattern}: ${error.message}`);
    } else if (count && count > 0) {
      deletedCount += count;
      console.log(`  Deleted: ${pattern} (${count}件)`);
    }
  }

  // 結果確認
  const { count: totalAfter } = await supabase
    .from('subsidies')
    .select('*', { count: 'exact', head: true });

  console.log('\n' + '='.repeat(60));
  console.log('削除完了');
  console.log(`  削除件数: ${deletedCount}件`);
  console.log(`  削除前: ${totalBefore}件`);
  console.log(`  削除後: ${totalAfter}件`);
  console.log('='.repeat(60));

  // JGrants/実データの状態を確認
  const { count: jgrantsCount } = await supabase
    .from('subsidies')
    .select('*', { count: 'exact', head: true })
    .like('jgrants_id', 'a0W%'); // JGrantsのIDはa0Wで始まる

  const { count: tokyoCount } = await supabase
    .from('subsidies')
    .select('*', { count: 'exact', head: true })
    .contains('target_area', ['東京都']);

  const { count: saitamaCount } = await supabase
    .from('subsidies')
    .select('*', { count: 'exact', head: true })
    .contains('target_area', ['埼玉県']);

  console.log('\n=== 残データ状態 ===');
  console.log(`JGrants由来: ${jgrantsCount}件`);
  console.log(`東京都対象: ${tokyoCount}件`);
  console.log(`埼玉県対象: ${saitamaCount}件`);
}

main().catch(console.error);

