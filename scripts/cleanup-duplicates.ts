/**
 * 重複データをクリーンアップするスクリプト
 * 
 * 以下の処理を行います：
 * 1. タイトルが重複しているデータを検出（類似度マッチング）
 * 2. 情報が充実している方を残し、そうでない方を削除
 * 3. 不要なデータ（補助金情報ではないもの）を削除
 * 4. データの正規化（地域名、日付など）
 * 
 * 実行方法: npx tsx scripts/cleanup-duplicates.ts [--dry-run]
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

// 補助金データの型
interface SubsidyData {
  id: string;
  jgrants_id: string;
  title: string;
  description: string | null;
  max_amount: number | null;
  subsidy_rate: string | null;
  start_date: string | null;
  end_date: string | null;
  target_area: string[] | null;
  industry: string[] | null;
  catch_phrase?: string | null;
  front_url?: string | null;
  created_at?: string;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('環境変数が設定されていません');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ソースの優先順位（高い方が優先）
const SOURCE_PRIORITY: Record<string, number> = {
  'sample': 100,        // サンプルデータ
  'jgrants': 80,        // J-Grants API
  'jnet21': 70,         // J-Net21
  'mirasapo': 60,       // ミラサポplus
  'pref': 50,           // 都道府県
  'city': 45,           // 政令指定都市
  'mhlw': 40,           // 厚生労働省
  'maff': 40,           // 農林水産省
  'env': 40,            // 環境省
  'default': 10,
};

// 補助金ではない可能性が高いタイトルのパターン
const NON_SUBSIDY_PATTERNS = [
  /あなたに合った/,
  /探しましょう/,
  /相談室/,
  /お知らせ$/,
  /募集のご案内$/,
  /説明会(?:のご案内)?$/,
  /イベント(?:のご案内)?$/,
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
  /窓口案内/,
  /^ホーム$/,
  /^トップ$/,
  /FAQ/,
  /よくある質問/,
  /メールマガジン/,
  /お問い合わせ/,
  /アクセス/,
  /採用情報/,
  /職員募集/,
  /入札情報/,
  /入札公告/,
  /パブリックコメント/,
  // J-Net21の非補助金コンテンツ
  /^セミナー・イベント[：:]/,
  /^相談窓口[：:]/,
  /^表彰[：:]/,
  /^展示会情報[：:]/,
  /^支援情報[：:]/,
  /^認定制度[：:]/,
  /^専門家派遣[：:]/,
  /^情報提供[：:]/,
  /^人材募集[：:]/,
  /^施設入居[：:]/,
  /CAD/i,
  /PLC制御/,
  /溶接技術/,
  /マシニングセンタ/,
  /シーケンス制御/,
  /HDL.*回路/,
  /フォーラム/,
];

// タイトルの類似度を計算（Jaccard係数）
function calculateSimilarity(title1: string, title2: string): number {
  const normalize = (s: string) => s
    .replace(/[【】\[\]「」『』（）()]/g, '')
    .replace(/\s+/g, '')
    .replace(/第\d+回|第\d+次|令和\d+年度|20\d{2}年度/g, '')
    .toLowerCase();

  const s1 = normalize(title1);
  const s2 = normalize(title2);

  if (s1 === s2) return 1;

  // N-gramベースの類似度計算
  const createNgrams = (s: string, n: number = 2) => {
    const ngrams = new Set<string>();
    for (let i = 0; i <= s.length - n; i++) {
      ngrams.add(s.slice(i, i + n));
    }
    return ngrams;
  };

  const ngrams1 = createNgrams(s1);
  const ngrams2 = createNgrams(s2);

  let intersection = 0;
  Array.from(ngrams1).forEach((gram) => {
    if (ngrams2.has(gram)) intersection++;
  });

  const union = ngrams1.size + ngrams2.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// ソースの優先度を取得
function getSourcePriority(jgrantsId: string): number {
  if (jgrantsId.startsWith('sample:')) return SOURCE_PRIORITY['sample'];
  if (jgrantsId.startsWith('jnet21:')) return SOURCE_PRIORITY['jnet21'];
  if (jgrantsId.startsWith('mirasapo:')) return SOURCE_PRIORITY['mirasapo'];
  if (jgrantsId.startsWith('pref:')) return SOURCE_PRIORITY['pref'];
  if (jgrantsId.startsWith('city:')) return SOURCE_PRIORITY['city'];
  if (jgrantsId.startsWith('mhlw:')) return SOURCE_PRIORITY['mhlw'];
  if (jgrantsId.startsWith('maff:')) return SOURCE_PRIORITY['maff'];
  if (jgrantsId.startsWith('env:')) return SOURCE_PRIORITY['env'];
  if (/^[A-Z0-9]+$/.test(jgrantsId)) return SOURCE_PRIORITY['jgrants']; // J-Grants ID
  return SOURCE_PRIORITY['default'];
}

// データの「充実度」を計算
function calculateCompleteness(subsidy: SubsidyData): number {
  let score = 0;

  // ソースの優先度
  score += getSourcePriority(subsidy.jgrants_id);

  // 重要なフィールドにスコアを付与
  if (subsidy.max_amount) score += 25;
  if (subsidy.subsidy_rate) score += 20;
  if (subsidy.start_date) score += 15;
  if (subsidy.end_date) score += 15;
  if (subsidy.description) {
    const descLength = subsidy.description.length;
    if (descLength > 500) score += 15;
    else if (descLength > 200) score += 10;
    else if (descLength > 50) score += 5;
  }
  if (subsidy.catch_phrase) score += 5;
  if (subsidy.industry && subsidy.industry.length > 0) score += 5;
  if (subsidy.front_url) score += 5;
  if (subsidy.target_area && subsidy.target_area.length > 0) score += 3;

  return score;
}

// 地域名を正規化
function normalizeRegion(region: string): string {
  const mappings: Record<string, string> = {
    '東京': '東京都',
    '大阪': '大阪府',
    '京都': '京都府',
    '北海': '北海道',
  };

  for (const [short, full] of Object.entries(mappings)) {
    if (region === short) return full;
  }

  // 県がついていない場合は追加
  if (!/[都道府県市]$/.test(region) && region.length <= 3) {
    return region + '県';
  }

  return region;
}

async function main() {
  console.log('='.repeat(60));
  console.log('重複データ クリーンアップ & 正規化');
  console.log('='.repeat(60));
  console.log('');

  // 1. 全データを取得
  const { data: allSubsidies, error } = await supabase
    .from('subsidies')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !allSubsidies) {
    console.error('データ取得エラー:', error);
    process.exit(1);
  }

  console.log(`総データ数: ${allSubsidies.length}件`);
  console.log('');

  const toDelete: string[] = [];
  const toUpdate: Array<{ id: string; updates: Partial<SubsidyData> }> = [];

  // 2. 補助金ではないデータを検出
  console.log('--- 補助金ではないデータの検出 ---');

  for (const subsidy of allSubsidies) {
    for (const pattern of NON_SUBSIDY_PATTERNS) {
      if (pattern.test(subsidy.title)) {
        console.log(`  ✗ ${subsidy.title.slice(0, 50)}...`);
        toDelete.push(subsidy.id);
        break;
      }
    }
  }

  console.log(`検出数: ${toDelete.length}件`);
  console.log('');

  // 3. 重複を検出（類似度ベース）
  console.log('--- 重複データの検出 ---');

  const remaining = allSubsidies.filter(s => !toDelete.includes(s.id));
  const processed = new Set<string>();

  for (let i = 0; i < remaining.length; i++) {
    const subsidy1 = remaining[i];
    if (processed.has(subsidy1.id)) continue;

    const duplicates: SubsidyData[] = [subsidy1];

    for (let j = i + 1; j < remaining.length; j++) {
      const subsidy2 = remaining[j];
      if (processed.has(subsidy2.id)) continue;

      const similarity = calculateSimilarity(subsidy1.title, subsidy2.title);
      if (similarity > 0.75) { // 75%以上の類似度
        duplicates.push(subsidy2);
        processed.add(subsidy2.id);
      }
    }

    if (duplicates.length > 1) {
      // 充実度でソート
      duplicates.sort((a, b) => calculateCompleteness(b) - calculateCompleteness(a));

      console.log(`  "${duplicates[0].title.slice(0, 40)}..." (${duplicates.length}件重複)`);

      // 最も充実したデータ以外を削除
      for (let k = 1; k < duplicates.length; k++) {
        console.log(`    - 削除: ${duplicates[k].jgrants_id} (score: ${calculateCompleteness(duplicates[k])})`);
        toDelete.push(duplicates[k].id);
      }
      console.log(`    ✓ 残す: ${duplicates[0].jgrants_id} (score: ${calculateCompleteness(duplicates[0])})`);
    }

    processed.add(subsidy1.id);
  }

  console.log(`重複数: ${toDelete.filter((id, index) => toDelete.indexOf(id) === index).length - toDelete.length}件`);
  console.log('');

  // 4. データ正規化
  console.log('--- データ正規化 ---');

  for (const subsidy of remaining) {
    if (toDelete.includes(subsidy.id)) continue;

    const updates: Partial<SubsidyData> = {};

    // 地域名の正規化
    if (subsidy.target_area && subsidy.target_area.length > 0) {
      const normalized = subsidy.target_area.map(normalizeRegion);
      if (JSON.stringify(normalized) !== JSON.stringify(subsidy.target_area)) {
        updates.target_area = normalized;
      }
    }

    // 日付の正規化（無効な日付を null に）
    if (subsidy.start_date && !/^\d{4}-\d{2}-\d{2}$/.test(subsidy.start_date)) {
      updates.start_date = null;
    }
    if (subsidy.end_date && !/^\d{4}-\d{2}-\d{2}$/.test(subsidy.end_date)) {
      updates.end_date = null;
    }

    if (Object.keys(updates).length > 0) {
      toUpdate.push({ id: subsidy.id, updates });
    }
  }

  console.log(`正規化対象: ${toUpdate.length}件`);
  console.log('');

  // 5. 実行
  const uniqueDeleteIds = Array.from(new Set(toDelete));

  console.log('--- 処理実行 ---');
  console.log(`削除: ${uniqueDeleteIds.length}件`);
  console.log(`更新: ${toUpdate.length}件`);

  const isDryRun = process.argv.includes('--dry-run');

  if (isDryRun) {
    console.log('(ドライラン - 実際には処理しません)');
  } else {
    // 削除
    if (uniqueDeleteIds.length > 0) {
      const { error: deleteError } = await supabase
        .from('subsidies')
        .delete()
        .in('id', uniqueDeleteIds);

      if (deleteError) {
        console.error('削除エラー:', deleteError);
      } else {
        console.log(`✓ ${uniqueDeleteIds.length}件を削除しました`);
      }
    }

    // 更新
    for (const { id, updates } of toUpdate) {
      const { error: updateError } = await supabase
        .from('subsidies')
        .update(updates)
        .eq('id', id);

      if (updateError) {
        console.error(`更新エラー (${id}):`, updateError);
      }
    }

    if (toUpdate.length > 0) {
      console.log(`✓ ${toUpdate.length}件を正規化しました`);
    }
  }

  console.log('');
  console.log('完了');
}

main().catch(console.error);
