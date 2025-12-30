/**
 * 主要な補助金のサンプルデータを追加/更新するスクリプト
 * 
 * 実行方法: npx tsx scripts/add-sample-data.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('環境変数が設定されていません');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// 主要補助金のサンプルデータ
const POPULAR_SUBSIDIES = [
  {
    jgrants_id: 'sample:monodukuri',
    name: 'monodukuri',
    title: 'ものづくり補助金（19次締切）',
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
    max_amount: 40000000, // 4,000万円
    subsidy_rate: '1/2〜2/3',
    start_date: '2024-12-01',
    end_date: '2026-03-28', // 次回締切
    front_url: 'https://portal.monodukuri-hojo.jp/',
    is_active: true,
  },
  {
    jgrants_id: 'sample:it-hojo',
    name: 'it-hojo',
    title: 'IT導入補助金2025',
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
    max_amount: 4500000, // 450万円
    subsidy_rate: '1/2〜3/4',
    start_date: '2024-12-01',
    end_date: '2026-10-31', // 通年募集
    front_url: 'https://it-shien.smrj.go.jp/',
    is_active: true,
  },
  {
    jgrants_id: 'sample:jizokuka',
    name: 'jizokuka',
    title: '小規模事業者持続化補助金（第17回）',
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
    max_amount: 2000000, // 200万円
    subsidy_rate: '2/3',
    start_date: '2024-12-01',
    end_date: '2026-05-14', // 次回締切予定
    front_url: 'https://r3.jizokukahojokin.info/',
    is_active: true,
  },
  {
    jgrants_id: 'sample:shorikika',
    name: 'shorikika',
    title: '中小企業省力化投資補助金',
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
    max_amount: 15000000, // 1,500万円
    subsidy_rate: '1/2',
    start_date: '2024-12-01',
    end_date: '2026-09-30',
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
    max_amount: 6000000, // 600万円
    subsidy_rate: '1/2〜2/3',
    start_date: '2024-12-01',
    end_date: '2026-12-31',
    front_url: 'https://jsh.go.jp/',
    is_active: true,
  },
];

async function main() {
  console.log('サンプルデータを追加/更新中...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const subsidy of POPULAR_SUBSIDIES) {
    const record = {
      ...subsidy,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('subsidies')
      .upsert(record, { onConflict: 'jgrants_id' });

    if (error) {
      console.error(`✗ ${subsidy.title}: ${error.message}`);
      errorCount++;
    } else {
      console.log(`✓ ${subsidy.title}`);
      successCount++;
    }
  }

  console.log(`\n完了: 成功 ${successCount}件, エラー ${errorCount}件`);
}

main().catch(console.error);

