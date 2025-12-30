import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 不要データのパターン（カテゴリページ、情報ページ等）
const JUNK_PATTERNS = [
  '問い合わせ',
  'お知らせ',
  'ニュース',
  '一覧',
  'トップ',
  '事業者向け',
  'パンフレット',
  'チラシ',
  '入札結果',
  '公表',
  '相談',
  'カテゴリ',
  '創業塾',
  '事業者の方',
  '人気の補助金',
  '創業、ベンチャー',
  '助成・補助金$',
  '助成・給付金・融資$',
  '中小企業支援・融資制度$',
  '補助金・助成金・支援金$',
  '補助事業・制度資金$',
  '事業者等選定',
  '審査委員',
  '公募説明会',
  // 追加パターン
  '中小企業総合振興資金',
  '事業者団体',
  '北海道の中小企業向け融資制度',
  'コーディネーターの募集',
  '専門家向け公募',
  '融資制度$',
  '中小企業への融資制度',
  '金融対策$',
  '利子補給$',
  '保証料補給$',
  '創業支援事業計画',
  '審査員',
  '相談窓口',
  '説明会$',
  '企業化状況報告',
  // 融資・貸付は補助金ではない（補助金額が異なる形式）
  '】融資・貸付：',
  '融資あっせん',
  '近代化基金融資',
  '中小企業振興資金融資',
  '小規模企業融資',
  '制度融資',
  // 支援情報・募集も補助金ではないケースが多い
  '】支援情報：',
  '募集：「光の祭典',
  '募集：「トキの放鳥',
  // 研修・講座系
  '安全運転研修',
  '人材確保等支援助成',
  '適性診断活用講座',
  '高齢運転者安全教育',
  '安全装置等導入促進助成',
  // その他削除候補
  '緊急対策として支援金を交付',
  '持続化補助金（共同・協業型）',
  '新事業進出補助金（第',
  'プロジェクションマッピング',
  // 追加：融資系（金額形式が異なる）
  '】融資・貸付：',
  '振興資金融資',
  '特別融資利子',
  '融資あっせん',
  // 追加：イベント・展示会系
  'イベント出展',
  '展示会',
  'EXPO',
  // その他
  '山梨みらいファンド',
  '認証制度',
  'スマート農業機器',
  // 追加: 融資・貸付系
  '融資あっせん',
  '融資あっ旋',
  '制度融資',
  '融資制度',
  '】融資・貸付：',
  '振興資金',
  // 追加: 支援情報系
  '】支援情報：',
  'サポートデスク',
  // 追加: 研修・セミナー・講座系
  'セミナーを開催',
  '講座受講',
  '講習手数料',
  '安全教育訓練',
  '受診料助成',
  '手数料助成',
  '検査助成',
  // 追加: ファンド系
  '応援ファンド',
  'みらいファンド',
  // 追加: 専門家支援
  '専門家による支援',
  // 追加: ビジネスプラン・イベント
  'ビジネスプラン募集',
  'イベント出展',
  '出展者募集',
  // 追加: その他
  '利子補給',
  '信用保証料',
  '保証料補給',
  // 追加: セミナー・イベント系
  'セミナーを開催します',
  '女性のための起業応援セミナー',
  '起業応援セミナーを開催',
  // 追加: 融資制度
  '中小企業者向け融資制度',
  '融資制度$',
  // 追加: 東京ハイヤータクシー協会の会員向け助成（一般向けではない）
  'テールゲートリフター導入促進助成',
  'ドライブレコーダー機器導入促進助成',
  'アルコール検知器導入促進助成',
  '血圧計導入促進助成',
  '初任運転者安全教育受講助成',
  '熱中症予防対策空調付き作業着等購入助成事業',
  '免許取得に係る助成',
  '環境マネジメントシステム認証取得促進助成',
  'エコタイヤ等導入促進助成',
  '環境対応車導入促進助成',
  // mirasapo カテゴリページ
  '省エネ診断・省エネ・非化石転換補助金',
];

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  console.log('='.repeat(60));
  console.log('不要データクリーンアップ');
  console.log('='.repeat(60));
  console.log(`モード: ${dryRun ? 'ドライラン' : '本番'}\n`);

  // 金額なしデータを取得
  const { data: items, error } = await supabase
    .from('subsidies')
    .select('id, title, jgrants_id')
    .is('max_amount', null);

  if (error || !items) {
    console.error('データ取得エラー:', error);
    return;
  }

  console.log(`金額なしデータ: ${items.length}件\n`);

  const toDelete: typeof items = [];
  const toKeep: typeof items = [];

  // J-Net21の【市名】形式でも補助金ではないカテゴリ
  const JNET21_NON_SUBSIDY_TYPES = [
    '】融資・貸付：',
    '】融資・貸付 ：',  // スペース入りパターン
    '】支援情報：',
    '】支援情報 ：',    // スペース入りパターン
    '】募集：',
    '】専門家による支援：',
    '】イベント出展者募集：',
  ];

  // 【市名】形式でも削除対象となるキーワード
  const JNET21_JUNK_KEYWORDS = [
    '利子補給',
    '融資制度',
    '信用保証料',
  ];

  for (const item of items) {
    const title = item.title || '';

    // 【日付】形式（例：【令和8年2月5日】）はJ-Net21形式ではないので通常のパターンチェックへ
    const isDateFormat = /^【令和\d+年/.test(title);

    // 【市名】形式のJ-Net21データでも、補助金ではないカテゴリは削除
    if (!isDateFormat && title.startsWith('【') && title.includes('】')) {
      const isNonSubsidy = JNET21_NON_SUBSIDY_TYPES.some(type => title.includes(type));
      if (isNonSubsidy) {
        toDelete.push(item);
        continue;
      }
      // タイトル内に削除対象キーワードが含まれる場合も削除
      const hasJunkKeyword = JNET21_JUNK_KEYWORDS.some(kw => title.includes(kw));
      if (hasJunkKeyword) {
        toDelete.push(item);
        continue;
      }
      toKeep.push(item);
      continue;
    }

    // 不要パターンチェック
    const isJunk = JUNK_PATTERNS.some(pattern => {
      if (pattern.endsWith('$')) {
        // 完全一致に近いパターン
        return title === pattern.slice(0, -1) || title.endsWith(pattern.slice(0, -1));
      }
      return title.includes(pattern);
    });

    if (isJunk) {
      toDelete.push(item);
    } else {
      toKeep.push(item);
    }
  }

  console.log(`削除対象: ${toDelete.length}件`);
  console.log(`保持: ${toKeep.length}件\n`);

  console.log('=== 削除対象 ===');
  toDelete.slice(0, 15).forEach((item, i) => {
    console.log(`${i + 1}. ${item.title?.slice(0, 50)}`);
  });
  if (toDelete.length > 15) {
    console.log(`... 他 ${toDelete.length - 15}件`);
  }

  if (!dryRun && toDelete.length > 0) {
    console.log('\n削除実行中...');
    const ids = toDelete.map(item => item.id);

    const { error: deleteError } = await supabase
      .from('subsidies')
      .delete()
      .in('id', ids);

    if (deleteError) {
      console.error('削除エラー:', deleteError);
    } else {
      console.log(`${toDelete.length}件を削除しました`);
    }
  }

  console.log('\n' + '='.repeat(60));
}

main().catch(console.error);
