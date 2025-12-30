/**
 * 金額がnullの補助金を修正するスクリプト
 *
 * - 大型研究開発案件 → max_amount = -1（個別審査）
 * - 報告・手続き系 → is_active = false（補助金ではない）
 * - 具体的な補助金 → 適切な金額を設定
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// max_amount = -1 は「個別審査・プロジェクト規模による」を意味する
// UI側で -1 の場合は「個別相談」と表示する

// 個別審査型の補助金（大型研究開発など）
const INDIVIDUAL_REVIEW_IDS = [
  'a0WJ200000CDW1BMAX', // GX分野スタートアップ連携
  'a0WJ200000CDWSCMA5', // カーボンリサイクル技術開発
  'a0WJ200000CDW07MAH', // カーボンリサイクル産業間連携
  'a0WJ200000CDW1VMAX', // ディープテック・スタートアップ
  'a0WJ200000CDW16MAH', // ポスト5G先端半導体（委託）
  'a0WJ200000CDWAcMAP', // 生成AI基盤モデル開発
  'a0WJ200000CDW57MAH', // ポスト5G情報通信システム（助成）
  'a0WJ200000CDWRYMA5', // ポスト5G先端半導体（助成）
  'a0WJ200000CDW3TMAX', // ディープテック・オープンイノベーション
  'a0WJ200000CDW0CMAX', // 洋上風況マップ改定
  'a0WJ200000CDU53MAH', // 次期航空機開発事前着手
  'a0WJ200000CDUATMA5', // 次期航空機主要構造体
  'a0WJ200000CDWemMAH', // 中堅・中小賃上げ省力化投資
];

// 報告・手続き系（補助金申請ではない）→ 非アクティブ化
const NOT_SUBSIDY_IDS = [
  'a0WJ2000008Av8bMAC', // デジタル技術活用推進助成金 状況報告
  'a0WJ200000CDW2EMAX', // 地域医療勤務環境改善 仕入控除税額報告
];

// 具体的な金額が判明している補助金
const KNOWN_AMOUNTS: Record<string, { amount: number; rate?: string }> = {
  // 国土交通省系
  'a0WJ200000CDW5pMAH': { amount: 5000000, rate: '1/2' }, // 自動車運送事業安全対策（R6補正）
  'a0WJ200000CDW2oMAH': { amount: 5000000, rate: '1/2' }, // 自動車運送事業安全対策（R7）

  // 環境省系
  'a0WJ200000CDWBgMAP': { amount: 2000000, rate: '1/2〜2/3' }, // 断熱窓改修促進

  // 東京都系
  'a0WJ200000CDNhQMAX': { amount: 100000000000 }, // 100億宣言（100億円）
  'a0WJ200000CDPJQMA5': { amount: 50000000, rate: '1/2' }, // 臨海副都心にぎわい
  'a0WJ200000CDRBpMAP': { amount: 50000000, rate: '1/2〜2/3' }, // 既存非住宅省エネ改修
  'a0WJ200000CDTq3MAH': { amount: 30000000, rate: '1/2' }, // 構造木質化スプリンクラー

  // 医療系
  'a0W5h00000GMoxsEAD': { amount: 10000000, rate: '定額' }, // 病院勤務者環境改善（R5）
  'a0WJ200000CDVu7MAH': { amount: 10000000, rate: '定額' }, // 勤務環境改善医師派遣（R7）
  'a0WJ200000CDVoZMAX': { amount: 50000000, rate: '1/2' }, // 救命救急センター整備
  'a0WJ200000CDVm7MAH': { amount: 10000000, rate: '定額' }, // 病院勤務者環境改善（R7）
  'a0WJ200000CDVdPMAX': { amount: 5000000, rate: '定額' }, // 臨床研修費（歯科医師）
  'a0WJ200000CDNibMAH': { amount: 3000000, rate: '定額' }, // 訪問看護代替職員確保

  // 埼玉県
  'a0WJ200000CDOKSMA5': { amount: 360000, rate: '定額（月3万円×12ヶ月）' }, // 奨学金返還支援

  // その他自治体
  'a0WJ200000CDW8rMAH': { amount: 500000, rate: '1/2' }, // 知立市カーボンニュートラル
  'a0WJ200000CDWY2MAP': { amount: 1000000, rate: '1/2' }, // 長野市温室効果ガス見える化

  // 農林水産系
  'a0W2x000007CStOEAW': { amount: 1000000, rate: '1/2' }, // 水産認証取得支援
  'a0W2x000007CStEEAW': { amount: 1000000, rate: '1/2' }, // 農家認証取得支援

  // 携帯電話エリア整備
  'a0WJ200000CDOsKMAX': { amount: 100000000, rate: '1/2〜2/3' }, // 携帯電話エリア整備
};

async function main() {
  console.log('='.repeat(60));
  console.log('金額null補助金の修正');
  console.log('実行日時:', new Date().toLocaleString('ja-JP'));
  console.log('='.repeat(60));

  let updatedCount = 0;
  let deactivatedCount = 0;
  let individualCount = 0;

  // 1. 個別審査型を max_amount = -1 に設定
  console.log('\n【1】個別審査型の設定（max_amount = -1）');
  for (const id of INDIVIDUAL_REVIEW_IDS) {
    const { error } = await supabase
      .from('subsidies')
      .update({
        max_amount: -1,
        subsidy_rate: '個別審査',
        updated_at: new Date().toISOString()
      })
      .eq('jgrants_id', id);

    if (!error) {
      individualCount++;
      console.log(`  ✓ ${id}`);
    } else {
      console.log(`  ✗ ${id}: ${error.message}`);
    }
  }

  // 2. 報告・手続き系を非アクティブ化
  console.log('\n【2】報告・手続き系の非アクティブ化');
  for (const id of NOT_SUBSIDY_IDS) {
    const { error } = await supabase
      .from('subsidies')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('jgrants_id', id);

    if (!error) {
      deactivatedCount++;
      console.log(`  ✓ ${id}`);
    } else {
      console.log(`  ✗ ${id}: ${error.message}`);
    }
  }

  // 3. 具体的な金額を設定
  console.log('\n【3】具体的な金額の設定');
  for (const [id, info] of Object.entries(KNOWN_AMOUNTS)) {
    const updateData: Record<string, unknown> = {
      max_amount: info.amount,
      updated_at: new Date().toISOString()
    };
    if (info.rate) {
      updateData.subsidy_rate = info.rate;
    }

    const { error } = await supabase
      .from('subsidies')
      .update(updateData)
      .eq('jgrants_id', id);

    if (!error) {
      updatedCount++;
      const amountStr = info.amount >= 100000000
        ? `${info.amount / 100000000}億円`
        : info.amount >= 10000
          ? `${info.amount / 10000}万円`
          : `${info.amount}円`;
      console.log(`  ✓ ${id}: ${amountStr}`);
    } else {
      console.log(`  ✗ ${id}: ${error.message}`);
    }
  }

  // 結果確認
  const { count: stillNull } = await supabase
    .from('subsidies')
    .select('*', { count: 'exact', head: true })
    .is('max_amount', null)
    .eq('is_active', true);

  const { count: total } = await supabase
    .from('subsidies')
    .select('*', { count: 'exact', head: true });

  const { count: active } = await supabase
    .from('subsidies')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  const { count: withAmount } = await supabase
    .from('subsidies')
    .select('*', { count: 'exact', head: true })
    .not('max_amount', 'is', null)
    .eq('is_active', true);

  const { count: individualReview } = await supabase
    .from('subsidies')
    .select('*', { count: 'exact', head: true })
    .eq('max_amount', -1)
    .eq('is_active', true);

  console.log('\n' + '='.repeat(60));
  console.log('修正完了');
  console.log('='.repeat(60));
  console.log(`個別審査型に設定: ${individualCount}件`);
  console.log(`非アクティブ化: ${deactivatedCount}件`);
  console.log(`金額設定: ${updatedCount}件`);
  console.log('');
  console.log('=== データベース最終状態 ===');
  console.log(`総件数: ${total}件`);
  console.log(`募集中: ${active}件`);
  console.log(`金額あり: ${withAmount}件 (${Math.round(withAmount! / active! * 100)}%)`);
  console.log(`  - 具体的金額: ${withAmount! - individualReview!}件`);
  console.log(`  - 個別審査: ${individualReview}件`);
  console.log(`金額なし（残り）: ${stillNull}件`);
}

main();
