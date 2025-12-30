import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// 業種カテゴリ定義
const INDUSTRY_CATEGORIES = {
  '製造業': [
    '製造', 'ものづくり', '工場', '生産', '加工', '部品', '機械', '金属',
    '化学', '食品製造', '繊維', '印刷', '木材', 'プラスチック',
  ],
  '小売業': [
    '小売', '販売', '店舗', '商店', '商業', 'EC', 'ネットショップ', '物販',
  ],
  '飲食業': [
    '飲食', 'レストラン', '食堂', 'カフェ', '居酒屋', '料理', '調理',
    'フード', '外食', '給食',
  ],
  'サービス業': [
    'サービス', 'コンサル', '清掃', '警備', '人材', '派遣', '理美容',
    'エステ', 'クリーニング', 'レンタル',
  ],
  'IT・情報通信': [
    'IT', 'DX', 'デジタル', 'ソフトウェア', 'システム', 'アプリ', 'Web',
    '情報通信', 'IoT', 'AI', 'クラウド', 'セキュリティ', 'プログラム',
  ],
  '建設業': [
    '建設', '建築', '土木', '工事', 'リフォーム', '設備', '電気工事',
    '塗装', '内装', '解体',
  ],
  '農林水産業': [
    '農業', '農家', '農産', '林業', '水産', '漁業', '畜産', '酪農',
    '養殖', '栽培', '収穫', '肥料', '農機', '鳥獣', '有害鳥獣',
  ],
  '医療・福祉': [
    '医療', '病院', 'クリニック', '介護', '福祉', '看護', '保育',
    'ヘルスケア', '障害', '高齢者', '訪問介護', '老人ホーム',
  ],
  '観光・宿泊': [
    '観光', '宿泊', 'ホテル', '旅館', '民泊', 'インバウンド', '旅行',
    'ツーリズム', 'サテライト',
  ],
  '運輸・物流': [
    '運送', '物流', '配送', '倉庫', 'トラック', '貨物', '運輸',
    'ドライバー', '輸送',
  ],
} as const;

// 全業種向けのキーワード
const ALL_INDUSTRIES_KEYWORDS = [
  '中小企業', '小規模事業者', '事業者', '創業', '起業', '新規開業',
  '経営', '生産性向上', '賃上げ', '省エネ', '脱炭素', 'カーボンニュートラル',
  '人材', '雇用', 'テレワーク', '販路開拓', '海外展開', '設備投資',
];

type IndustryCategory = keyof typeof INDUSTRY_CATEGORIES;

function detectIndustries(title: string, description: string | null): string[] {
  const text = `${title} ${description || ''}`.toLowerCase();
  const detected = new Set<string>();

  // 特定業種のキーワードチェック
  for (const [category, keywords] of Object.entries(INDUSTRY_CATEGORIES)) {
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        detected.add(category);
        break;
      }
    }
  }

  // 全業種向けキーワードがあり、特定業種が検出されなかった場合
  if (detected.size === 0) {
    const hasAllIndustryKeyword = ALL_INDUSTRIES_KEYWORDS.some(kw =>
      text.includes(kw.toLowerCase())
    );
    if (hasAllIndustryKeyword) {
      detected.add('全業種');
    }
  }

  // 何も検出されなかった場合も全業種とする
  if (detected.size === 0) {
    detected.add('全業種');
  }

  return Array.from(detected);
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const limit = parseInt(process.argv.find(a => a.startsWith('--limit='))?.split('=')[1] || '500', 10);

  console.log('='.repeat(60));
  console.log('業種タグ付け');
  console.log('='.repeat(60));
  console.log(`モード: ${dryRun ? 'ドライラン' : '本番'}`);
  console.log(`対象: 最大${limit}件\n`);

  // 全データ取得
  const { data: subsidies, error } = await supabase
    .from('subsidies')
    .select('id, title, description, industry')
    .limit(limit);

  if (error || !subsidies) {
    console.error('データ取得エラー:', error);
    return;
  }

  console.log(`取得件数: ${subsidies.length}件\n`);

  const stats: Record<string, number> = {};
  let updated = 0;

  for (const subsidy of subsidies) {
    const industries = detectIndustries(subsidy.title, subsidy.description);

    // 統計
    for (const ind of industries) {
      stats[ind] = (stats[ind] || 0) + 1;
    }

    // 既存と異なる場合のみ更新
    const currentIndustries = subsidy.industry || [];
    const needsUpdate = JSON.stringify(industries.sort()) !== JSON.stringify(currentIndustries.sort());

    if (needsUpdate) {
      if (!dryRun) {
        const { error: updateError } = await supabase
          .from('subsidies')
          .update({ industry: industries })
          .eq('id', subsidy.id);

        if (updateError) {
          console.error(`更新エラー [${subsidy.id}]:`, updateError);
        }
      }
      updated++;
    }
  }

  console.log('=== 業種別件数 ===');
  const sortedStats = Object.entries(stats).sort((a, b) => b[1] - a[1]);
  for (const [industry, count] of sortedStats) {
    console.log(`${industry}: ${count}件`);
  }

  console.log(`\n更新対象: ${updated}件`);
  console.log('='.repeat(60));
}

main().catch(console.error);
