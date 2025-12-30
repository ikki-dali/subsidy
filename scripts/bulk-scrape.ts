/**
 * 一括スクレイピングスクリプト
 * 
 * 全てのスクレイパーを実行して、大量の補助金データを収集します。
 * 主にバッチ処理（夜間実行など）での利用を想定しています。
 * 
 * 実行方法:
 *   npx tsx scripts/bulk-scrape.ts [--phase <1|2|3|all>] [--skip-jnet21] [--dry-run]
 * 
 * オプション:
 *   --phase <n>: 実行するフェーズを指定 (1, 2, 3, all)
 *     Phase 1: J-Net21（集約サイト）
 *     Phase 2: 47都道府県
 *     Phase 3: 政令指定都市
 *   --skip-jnet21: J-Net21をスキップ
 *   --dry-run: データベースへの保存をスキップ
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import { JNet21Scraper, ALL_PREFECTURES } from './scrapers/jnet21';
import { PrefectureScraper, SUPPORTED_PREFECTURES } from './scrapers/prefecture';
import { CityScraper, SUPPORTED_CITIES } from './scrapers/city';
import type { ScrapedSubsidy } from './scrapers/types';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('環境変数が設定されていません');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// コマンドライン引数をパース
const args = process.argv.slice(2);
const phaseArg = args.includes('--phase') ? args[args.indexOf('--phase') + 1] : 'all';
const skipJNet21 = args.includes('--skip-jnet21');
const dryRun = args.includes('--dry-run');

// Phase 1: J-Net21からの収集
async function runPhase1(): Promise<ScrapedSubsidy[]> {
  console.log('\n' + '='.repeat(60));
  console.log('Phase 1: J-Net21（集約サイト）');
  console.log('='.repeat(60));

  if (skipJNet21) {
    console.log('スキップ (--skip-jnet21)');
    return [];
  }

  const scraper = new JNet21Scraper({ maxPages: 30, fetchDetails: true, detailLimit: 50 }); // 全国、最大30ページ
  const result = await scraper.run();

  console.log(`\nPhase 1 完了: ${result.count}件収集`);
  return result.subsidies;
}

// Phase 2: 47都道府県からの収集
async function runPhase2(): Promise<ScrapedSubsidy[]> {
  console.log('\n' + '='.repeat(60));
  console.log('Phase 2: 47都道府県公式ポータル');
  console.log('='.repeat(60));

  const allSubsidies: ScrapedSubsidy[] = [];
  let successCount = 0;
  let errorCount = 0;

  for (const prefecture of SUPPORTED_PREFECTURES) {
    console.log(`\n[${SUPPORTED_PREFECTURES.indexOf(prefecture) + 1}/${SUPPORTED_PREFECTURES.length}] ${prefecture}`);

    try {
      const scraper = new PrefectureScraper(prefecture);
      if (dryRun) {
        const subsidies = await scraper.scrape();
        allSubsidies.push(...subsidies);
      } else {
        const result = await scraper.run();
        allSubsidies.push(...result.subsidies);
      }

      successCount++;
    } catch (error) {
      console.error(`  エラー: ${error}`);
      errorCount++;
    }

    // レート制限
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  console.log(`\nPhase 2 完了: ${allSubsidies.length}件収集 (成功: ${successCount}, 失敗: ${errorCount})`);
  return allSubsidies;
}

// Phase 3: 政令指定都市からの収集
async function runPhase3(): Promise<ScrapedSubsidy[]> {
  console.log('\n' + '='.repeat(60));
  console.log('Phase 3: 政令指定都市');
  console.log('='.repeat(60));

  const allSubsidies: ScrapedSubsidy[] = [];
  let successCount = 0;
  let errorCount = 0;

  for (const cityName of SUPPORTED_CITIES) {
    console.log(`\n[${SUPPORTED_CITIES.indexOf(cityName) + 1}/${SUPPORTED_CITIES.length}] ${cityName}`);

    try {
      const scraper = new CityScraper(cityName);
      if (dryRun) {
        const subsidies = await scraper.scrape();
        allSubsidies.push(...subsidies);
      } else {
        const result = await scraper.run();
        allSubsidies.push(...result.subsidies);
      }

      successCount++;
    } catch (error) {
      console.error(`  エラー: ${error}`);
      errorCount++;
    }

    // レート制限
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  console.log(`\nPhase 3 完了: ${allSubsidies.length}件収集 (成功: ${successCount}, 失敗: ${errorCount})`);
  return allSubsidies;
}

// 重複クリーンアップ
async function cleanup(): Promise<void> {
  console.log('\n' + '='.repeat(60));
  console.log('クリーンアップ（重複排除）');
  console.log('='.repeat(60));

  if (dryRun) {
    console.log('スキップ (--dry-run)');
    return;
  }

  // cleanup-duplicates.ts の実行
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);

  try {
    const { stdout, stderr } = await execAsync('npx tsx scripts/cleanup-duplicates.ts');
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
  } catch (error) {
    console.error('クリーンアップエラー:', error);
  }
}

// メイン処理
async function main() {
  const startTime = Date.now();

  console.log('='.repeat(60));
  console.log('一括スクレイピング');
  console.log('='.repeat(60));
  console.log(`実行フェーズ: ${phaseArg}`);
  console.log(`J-Net21: ${skipJNet21 ? 'スキップ' : '実行'}`);
  console.log(`モード: ${dryRun ? 'ドライラン' : '本番'}`);
  console.log('');

  let totalSubsidies: ScrapedSubsidy[] = [];

  // フェーズ実行
  if (phaseArg === '1' || phaseArg === 'all') {
    const subsidies = await runPhase1();
    totalSubsidies.push(...subsidies);
  }

  if (phaseArg === '2' || phaseArg === 'all') {
    const subsidies = await runPhase2();
    totalSubsidies.push(...subsidies);
  }

  if (phaseArg === '3' || phaseArg === 'all') {
    const subsidies = await runPhase3();
    totalSubsidies.push(...subsidies);
  }

  // クリーンアップ
  if (phaseArg === 'all') {
    await cleanup();
  }

  // 結果サマリー
  const duration = Math.round((Date.now() - startTime) / 1000);
  console.log('\n' + '='.repeat(60));
  console.log('完了');
  console.log('='.repeat(60));
  console.log(`収集件数: ${totalSubsidies.length}件`);
  console.log(`実行時間: ${Math.floor(duration / 60)}分${duration % 60}秒`);

  // データベースの件数を取得
  if (!dryRun) {
    const { count } = await supabase
      .from('subsidies')
      .select('*', { count: 'exact', head: true });
    console.log(`データベース総件数: ${count}件`);
  }
}

main().catch(error => {
  console.error('エラー:', error);
  process.exit(1);
});

