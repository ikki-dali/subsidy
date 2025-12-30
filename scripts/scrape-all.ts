/**
 * 補助金データ スクレイピング統合スクリプト
 * 
 * 使用方法:
 *   npm run scrape              # 今日の曜日に対応する地域をスクレイプ
 *   npm run scrape -- --all     # 全地域をスクレイプ
 *   npm run scrape -- --region 東京都  # 特定地域のみ
 *   npm run scrape -- --jnet21-only   # J-Net21のみ
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { MirasapoScraper } from './scrapers/mirasapo';
import { JNet21Scraper, ALL_PREFECTURES } from './scrapers/jnet21';
import { PrefectureScraper, SUPPORTED_PREFECTURES } from './scrapers/prefecture';
import { CityScraper, SUPPORTED_CITIES } from './scrapers/city';
import { MHLWScraper } from './scrapers/mhlw';
import { MAFFScraper } from './scrapers/maff';
import { ENVScraper } from './scrapers/env';
import { REGION_GROUPS, type ScraperResult } from './scrapers/types';

async function main() {
  const args = process.argv.slice(2);
  const isAll = args.includes('--all');
  const regionIndex = args.indexOf('--region');
  const specificRegion = regionIndex >= 0 ? args[regionIndex + 1] : null;
  const dayIndex = args.indexOf('--day');
  const specifiedDay = dayIndex >= 0 ? parseInt(args[dayIndex + 1], 10) : null;
  const jnet21Only = args.includes('--jnet21-only');
  const includeCity = args.includes('--city');

  console.log('='.repeat(60));
  console.log('補助金データ スクレイピング開始');
  console.log('='.repeat(60));
  console.log(`開始時刻: ${new Date().toLocaleString('ja-JP')}`);

  // 対象地域を決定
  let targetRegions: string[];

  if (specificRegion) {
    targetRegions = [specificRegion];
    console.log(`対象地域: ${specificRegion}`);
  } else if (isAll) {
    targetRegions = Object.values(REGION_GROUPS).flat();
    console.log('対象: 全地域');
  } else {
    const dayOfWeek = specifiedDay !== null ? specifiedDay : new Date().getDay();
    targetRegions = REGION_GROUPS[dayOfWeek] || [];
    console.log(`対象曜日: ${['日', '月', '火', '水', '木', '金', '土'][dayOfWeek]}曜日`);
    console.log(`対象地域: ${targetRegions.join(', ')}`);
  }

  console.log('');

  const results: ScraperResult[] = [];

  // J-Net21のみモード
  if (jnet21Only) {
    console.log('--- J-Net21 集約データ収集 ---');
    
    // 全国データを取得（ページネーション対応）
    const jnet21 = new JNet21Scraper({ maxPages: 20 }); // 最大20ページ
    results.push(await jnet21.run());
    
    printSummary(results);
    return;
  }

  // 1. 全国共通ソース（J-Net21、ミラサポplus）
  console.log('--- 全国共通ソース ---');
  
  if (targetRegions.includes('全国') || isAll) {
    // J-Net21（全国データ）
    try {
      console.log('\n[J-Net21]');
      const jnet21 = new JNet21Scraper({ maxPages: 10 }); // 全国、最大10ページ
      results.push(await jnet21.run());
      await sleep(3000);
    } catch (e) {
      console.error(`  J-Net21 エラー: ${e}`);
    }

    // ミラサポplus
    try {
    const mirasapo = new MirasapoScraper();
    results.push(await mirasapo.run());
      await sleep(3000);
    } catch (e) {
      console.error(`  ミラサポplus エラー: ${e}`);
    }
  }

  // 省庁系スクレイパー（毎回実行）
  console.log('\n--- 省庁系ソース ---');
  
  // 厚生労働省（雇用関係助成金）
  try {
    const mhlw = new MHLWScraper();
    results.push(await mhlw.run());
    await sleep(3000);
  } catch (e) {
    console.error(`  厚生労働省 エラー: ${e}`);
  }

  // 農林水産省
  try {
    const maff = new MAFFScraper();
    results.push(await maff.run());
    await sleep(3000);
  } catch (e) {
    console.error(`  農林水産省 エラー: ${e}`);
  }

  // 環境省
  try {
    const env = new ENVScraper();
    results.push(await env.run());
    await sleep(3000);
  } catch (e) {
    console.error(`  環境省 エラー: ${e}`);
  }

  // 2. 地域別ソース
  console.log('\n--- 地域別ソース ---');

  for (const region of targetRegions) {
    if (region === '全国') continue;

    console.log(`\n[${region}]`);

    // J-Net21（地域指定）
    if (ALL_PREFECTURES.includes(region)) {
      try {
        const jnet21 = new JNet21Scraper({ prefectures: [region], maxPages: 5 });
        results.push(await jnet21.run());
        await sleep(2000);
      } catch (e) {
        console.error(`  J-Net21 エラー: ${e}`);
      }
    }

    // 地域指定でミラサポplus
    try {
      const mirasapo = new MirasapoScraper(region);
      results.push(await mirasapo.run());
      await sleep(2000);
    } catch (e) {
      console.error(`  ミラサポplus エラー: ${e}`);
    }

    // 都道府県ポータル
    if (SUPPORTED_PREFECTURES.includes(region)) {
      try {
        const pref = new PrefectureScraper(region);
        results.push(await pref.run());
        await sleep(2000);
      } catch (e) {
        console.error(`  都道府県ポータル エラー: ${e}`);
      }
    }
  }

  // 3. 政令指定都市（オプション）
  if (includeCity) {
    console.log('\n--- 政令指定都市 ---');

    for (const cityName of SUPPORTED_CITIES) {
      console.log(`\n[${cityName}]`);
      try {
        const city = new CityScraper(cityName);
        results.push(await city.run());
        await sleep(2000);
      } catch (e) {
        console.error(`  ${cityName} エラー: ${e}`);
      }
    }
  }

  printSummary(results);
}

function printSummary(results: ScraperResult[]) {
  // サマリー出力
  console.log('\n' + '='.repeat(60));
  console.log('スクレイピング完了');
  console.log('='.repeat(60));

  let totalCount = 0;
  let successSources = 0;
  let errorSources = 0;

  for (const result of results) {
    const status = result.success ? '✓' : '✗';
    console.log(`${status} ${result.source}: ${result.count}件`);
    totalCount += result.count;
    if (result.success) {
      successSources++;
    } else {
      errorSources++;
      result.errors.forEach(e => console.log(`  - ${e}`));
    }
  }

  console.log('-'.repeat(60));
  console.log(`合計: ${totalCount}件`);
  console.log(`ソース: 成功${successSources}, エラー${errorSources}`);
  console.log(`終了時刻: ${new Date().toLocaleString('ja-JP')}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main().catch(console.error);
