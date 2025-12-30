/**
 * 日次データ同期スクリプト
 * 
 * 以下の処理を順番に実行します：
 * 1. 主要補助金のサンプルデータを更新
 * 2. スクレイピングでデータを取得
 * 3. 重複データをクリーンアップ
 * 
 * 実行方法: npm run sync:daily
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';
import {
  getTodaysTargets,
  DAY_NAMES,
  DEEP_CRAWL_TIMEOUT,
  DEEP_CRAWL_CONFIG,
} from './crawler/config/daily-targets';
import { createDeepCrawler, DEEP_CRAWL_TARGETS } from './scrapers/deep-crawler';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('環境変数が設定されていません');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// 主要補助金のデータ（最新情報に更新が必要な場合はここを修正）
const POPULAR_SUBSIDIES = [
  {
    jgrants_id: 'sample:monodukuri',
    name: 'monodukuri',
    title: 'ものづくり補助金',
    catch_phrase: '中小企業等の革新的なサービス・製品開発や生産プロセスの改善を支援',
    description: `事業目的
新しい製品やサービスの開発、海外への販路拡大などに取り組むための設備投資を支援し、生産性を高めて、賃上げや地域経済の活性化につなげます。

補助金のポイント
高付加価値化枠とグローバル枠の2種類があります。
高付加価値化枠は新製品・新サービスの開発投資を支援します。
グローバル枠は海外事業にともなう設備・システム投資を支援します。

対象者
中小企業、小規模事業者等`,
    target_area: ['全国'],
    industry: ['製造業', 'サービス業', '全業種'],
    max_amount: 40000000,
    subsidy_rate: '1/2〜2/3',
    start_date: '2025-01-10',
    end_date: '2025-03-31',
    front_url: 'https://portal.monodukuri-hojo.jp/',
    is_active: true,
  },
  {
    jgrants_id: 'sample:it-hojo',
    name: 'it-hojo',
    title: 'IT導入補助金',
    catch_phrase: '中小企業・小規模事業者のITツール導入を支援',
    description: `事業目的
中小企業・小規模事業者等が自社の課題やニーズに合ったITツールを導入する経費の一部を補助することで、業務効率化・売上アップをサポートします。

補助金のポイント
通常枠、セキュリティ対策推進枠、デジタル化基盤導入枠等があります。
会計ソフト、受発注ソフト、決済ソフト、ECサイトの導入などが対象です。

対象者
中小企業、小規模事業者`,
    target_area: ['全国'],
    industry: ['全業種'],
    max_amount: 4500000,
    subsidy_rate: '1/2〜3/4',
    start_date: '2025-02-01',
    end_date: '2025-12-31',
    front_url: 'https://it-shien.smrj.go.jp/',
    is_active: true,
  },
  {
    jgrants_id: 'sample:jizokuka',
    name: 'jizokuka',
    title: '小規模事業者持続化補助金',
    catch_phrase: '小規模事業者の販路開拓等の取り組みを支援',
    description: `事業目的
小規模事業者が自社の経営を見直し、自らが持続的な経営に向けた経営計画を作成した上で行う、販路開拓や生産性向上の取組を支援します。

補助金のポイント
通常枠と特別枠（賃金引上げ枠、卒業枠等）があります。
ウェブサイト構築、チラシ作成、展示会出展等が対象です。

対象者
小規模事業者（商業・サービス業：従業員5人以下、製造業その他：従業員20人以下）`,
    target_area: ['全国'],
    industry: ['全業種'],
    max_amount: 2000000,
    subsidy_rate: '2/3',
    start_date: '2025-01-15',
    end_date: '2025-06-30',
    front_url: 'https://r3.jizokukahojokin.info/',
    is_active: true,
  },
  {
    jgrants_id: 'sample:shorikika',
    name: 'shorikika',
    title: '省力化投資補助金',
    catch_phrase: '人手不足解消に向けた省力化投資を支援',
    description: `事業目的
中小企業等が人手不足解消に向けて、IoT・ロボット等の汎用製品を導入することで、付加価値や生産性の向上を図り、賃上げにつなげていくことを支援します。

補助金のポイント
製品カタログから選んで導入できるシンプルな仕組みです。
製造業、飲食業、宿泊業、小売業等の省力化に効果的です。

対象者
中小企業、小規模事業者`,
    target_area: ['全国'],
    industry: ['製造業', '飲食業', '宿泊業', '小売業', '全業種'],
    max_amount: 15000000,
    subsidy_rate: '1/2',
    start_date: '2025-01-20',
    end_date: '2025-09-30',
    front_url: 'https://shoryokuka.smrj.go.jp/',
    is_active: true,
  },
  {
    jgrants_id: 'sample:jigyoshoukei',
    name: 'jigyoshoukei',
    title: '事業承継・M&A補助金',
    catch_phrase: '事業承継やM&Aを契機とした新たな取組を支援',
    description: `事業目的
事業承継やM&Aを契機として経営革新等に挑戦する中小企業・小規模事業者に対して、その取組に要する経費の一部を補助します。

補助金のポイント
経営革新事業、専門家活用事業、廃業・再チャレンジ事業の3つの事業類型があります。
事業承継やM&A後の設備投資、販路開拓等が対象です。

対象者
事業承継・M&Aを実施した（または実施予定の）中小企業、小規模事業者`,
    target_area: ['全国'],
    industry: ['全業種'],
    max_amount: 6000000,
    subsidy_rate: '1/2〜2/3',
    start_date: '2025-02-01',
    end_date: '2025-12-31',
    front_url: 'https://jsh.go.jp/',
    is_active: true,
  },
];

// 非補助金パターン
const NON_SUBSIDY_PATTERNS = [
  /あなたに合った/,
  /探しましょう/,
  /相談室/,
  /お知らせ/,
  /募集のご案内/,
  /説明会/,
  /セミナー/,
  /イベント/,
  /について$/,
  /のお願い$/,
  /ページ一覧/,
  /お役立ち情報/,
  /返済が負担/,
  /支援施策$/,
  /選定事業決定/,
  /特別相談/,
  /審議会/,
  /キャラバン/,
  /のご案内$/,
];

function calculateCompleteness(subsidy: any): number {
  let score = 0;
  if (subsidy.max_amount) score += 30;
  if (subsidy.subsidy_rate) score += 20;
  if (subsidy.start_date) score += 15;
  if (subsidy.end_date) score += 15;
  if (subsidy.description && subsidy.description.length > 100) score += 10;
  if (subsidy.catch_phrase) score += 5;
  if (subsidy.industry && subsidy.industry.length > 0) score += 5;
  if (subsidy.front_url) score += 5;
  if (subsidy.jgrants_id?.startsWith('sample:')) score += 50;
  return score;
}

async function updateSampleData() {
  console.log('\n📥 主要補助金データを更新中...');
  
  let success = 0;
  for (const subsidy of POPULAR_SUBSIDIES) {
    const { error } = await supabase
      .from('subsidies')
      .upsert({ ...subsidy, updated_at: new Date().toISOString() }, { onConflict: 'jgrants_id' });
    
    if (!error) success++;
  }
  
  console.log(`   ✓ ${success}/${POPULAR_SUBSIDIES.length}件を更新`);
}

async function runScraper() {
  console.log('\n🔍 スクレイピング実行中...');
  
  try {
    // 今日の曜日に対応する地域のみスクレイピング（負荷分散）
    const dayOfWeek = new Date().getDay();
    execSync(`npx tsx scripts/scrape-all.ts --day ${dayOfWeek}`, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
  } catch (error) {
    console.error('   スクレイピングでエラーが発生しましたが、処理を続行します');
  }
}

async function runDeepCrawl() {
  const dayOfWeek = new Date().getDay();
  const targets = getTodaysTargets();
  const dayName = DAY_NAMES[dayOfWeek];

  console.log(`\n🕷️ ディープクロール実行中... (${dayName})`);

  if (targets.length === 0) {
    console.log('   今日はディープクロール対象がありません');
    return;
  }

  console.log(`   対象: ${targets.join(', ')}`);

  for (const targetName of targets) {
    console.log(`\n   [${targetName}] クロール開始...`);

    const startTime = Date.now();

    try {
      // タイムアウト付きでクロール実行
      const crawler = createDeepCrawler(targetName);

      if (!crawler) {
        console.log(`   [${targetName}] ターゲットが見つかりません`);
        continue;
      }

      // 日次同期用の控えめな設定を適用
      crawler['engine']['config'] = {
        ...crawler['engine']['config'],
        ...DEEP_CRAWL_CONFIG,
      };

      // タイムアウト制御
      const timeoutPromise = new Promise<null>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), DEEP_CRAWL_TIMEOUT);
      });

      const result = await Promise.race([
        crawler.run(),
        timeoutPromise,
      ]);

      if (result) {
        const duration = Math.round((Date.now() - startTime) / 1000);
        console.log(`   [${targetName}] 完了: ${result.count}件取得 (${duration}秒)`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message === 'Timeout') {
        console.log(`   [${targetName}] タイムアウト (${DEEP_CRAWL_TIMEOUT / 60000}分経過)`);
      } else {
        console.error(`   [${targetName}] エラー:`, message);
      }
      // エラーでも続行
    }
  }
}

async function cleanupDuplicates() {
  console.log('\n🧹 重複データをクリーンアップ中...');
  
  const { data: allSubsidies, error } = await supabase
    .from('subsidies')
    .select('*')
    .order('title');

  if (error || !allSubsidies) {
    console.error('   データ取得エラー:', error);
    return;
  }

  // 非補助金データを検出
  const nonSubsidyIds: string[] = [];
  for (const subsidy of allSubsidies) {
    for (const pattern of NON_SUBSIDY_PATTERNS) {
      if (pattern.test(subsidy.title)) {
        nonSubsidyIds.push(subsidy.id);
        break;
      }
    }
  }

  // 重複を検出
  const titleMap = new Map<string, any[]>();
  for (const subsidy of allSubsidies) {
    if (nonSubsidyIds.includes(subsidy.id)) continue;
    const normalizedTitle = subsidy.title.trim().toLowerCase();
    if (!titleMap.has(normalizedTitle)) {
      titleMap.set(normalizedTitle, []);
    }
    titleMap.get(normalizedTitle)!.push(subsidy);
  }

  const duplicateIds: string[] = [];
  for (const [_, subsidies] of Array.from(titleMap)) {
    if (subsidies.length > 1) {
      subsidies.sort((a: Record<string, unknown>, b: Record<string, unknown>) => 
        calculateCompleteness(b) - calculateCompleteness(a));
      for (let i = 1; i < subsidies.length; i++) {
        duplicateIds.push(subsidies[i].id as string);
      }
    }
  }

  const allDeleteIds = Array.from(new Set([...nonSubsidyIds, ...duplicateIds]));
  
  if (allDeleteIds.length > 0) {
    const { error: deleteError } = await supabase
      .from('subsidies')
      .delete()
      .in('id', allDeleteIds);

    if (!deleteError) {
      console.log(`   ✓ ${allDeleteIds.length}件を削除`);
    }
  } else {
    console.log('   ✓ 削除対象なし');
  }
}

async function main() {
  const startTime = new Date();
  console.log('='.repeat(60));
  console.log('📊 日次データ同期');
  console.log('='.repeat(60));
  console.log(`開始時刻: ${startTime.toLocaleString('ja-JP')}`);

  try {
    // 1. サンプルデータを更新
    await updateSampleData();

    // 2. スクレイピング実行
    await runScraper();

    // 3. ディープクロール実行（曜日別ターゲット）
    await runDeepCrawl();

    // 4. 重複クリーンアップ
    await cleanupDuplicates();

    const endTime = new Date();
    const duration = Math.round((endTime.getTime() - startTime.getTime()) / 1000);

    console.log('\n' + '='.repeat(60));
    console.log(`✅ 完了 (所要時間: ${duration}秒)`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ エラーが発生しました:', error);
    process.exit(1);
  }
}

main();

