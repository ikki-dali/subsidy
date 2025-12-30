/**
 * 商工会議所・商工会系の補助金を追加するスクリプト
 *
 * 日本商工会議所、各地域商工会議所の支援事業を登録
 *
 * 実行方法: npx tsx scripts/add-chamber-of-commerce-subsidies.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type SubsidyData = {
  jgrants_id: string;
  name: string;
  title: string;
  description: string;
  target_area: string[];
  industry: string[];
  max_amount: number;
  subsidy_rate: string;
  use_purpose: string;
  is_active: boolean;
};

// ========================================
// 日本商工会議所
// ========================================
const JCCI_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'cci-jcci-001',
    name: '日商小規模事業者持続化',
    title: '小規模事業者持続化補助金（商工会議所地区）',
    description: '小規模事業者の販路開拓・生産性向上を支援。商工会議所が事業計画策定をサポートし、販路開拓、業務効率化等の取組を補助します。通常枠の他、賃上げ枠、卒業枠、後継者支援枠、創業枠等があります。',
    target_area: ['全国'],
    industry: ['全業種'],
    max_amount: 500000,
    subsidy_rate: '2/3',
    use_purpose: '販路拡大・海外展開をしたい',
    is_active: true,
  },
  {
    jgrants_id: 'cci-jcci-002',
    name: '日商経営力強化支援',
    title: '商工会議所経営力強化支援事業',
    description: '中小企業の経営力強化を支援。専門家派遣、経営相談、セミナー開催等を通じて経営改善をサポートします。',
    target_area: ['全国'],
    industry: ['全業種'],
    max_amount: 300000,
    subsidy_rate: '定額',
    use_purpose: '資金繰りを改善したい',
    is_active: true,
  },
  {
    jgrants_id: 'cci-jcci-003',
    name: '日商デジタル化支援',
    title: '商工会議所デジタル化推進事業',
    description: '中小企業のデジタル化を支援。IT導入診断、デジタルツール活用支援等を実施します。',
    target_area: ['全国'],
    industry: ['全業種'],
    max_amount: 500000,
    subsidy_rate: '1/2',
    use_purpose: '設備整備・IT導入をしたい',
    is_active: true,
  },
  {
    jgrants_id: 'cci-jcci-004',
    name: '日商海外展開支援',
    title: '商工会議所海外ビジネス支援事業',
    description: '中小企業の海外展開を支援。海外ビジネスマッチング、現地調査支援等を実施します。',
    target_area: ['全国'],
    industry: ['製造業', '卸売業、小売業'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '販路拡大・海外展開をしたい',
    is_active: true,
  },
];

// ========================================
// 全国商工会連合会
// ========================================
const SHOKOKAI_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'cci-shokokai-001',
    name: '商工会持続化補助金',
    title: '小規模事業者持続化補助金（商工会地区）',
    description: '商工会地区の小規模事業者の販路開拓・生産性向上を支援。商工会が事業計画策定をサポートし、販路開拓、業務効率化等の取組を補助します。',
    target_area: ['全国'],
    industry: ['全業種'],
    max_amount: 500000,
    subsidy_rate: '2/3',
    use_purpose: '販路拡大・海外展開をしたい',
    is_active: true,
  },
  {
    jgrants_id: 'cci-shokokai-002',
    name: '商工会経営発達支援',
    title: '商工会経営発達支援事業',
    description: '小規模事業者の経営発達を支援。事業計画策定支援、販路開拓支援、IT活用支援等を実施します。',
    target_area: ['全国'],
    industry: ['全業種'],
    max_amount: 200000,
    subsidy_rate: '定額',
    use_purpose: '資金繰りを改善したい',
    is_active: true,
  },
];

// ========================================
// 主要地域商工会議所
// ========================================

// 東京商工会議所
const TOKYO_CCI_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'cci-tokyo-001',
    name: '東商創業支援',
    title: '東京商工会議所創業支援事業',
    description: '東京での創業を支援。創業相談、セミナー、ビジネスマッチング等を実施。創業計画策定支援も行います。',
    target_area: ['東京都'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'cci-tokyo-002',
    name: '東商販路開拓支援',
    title: '東京商工会議所販路開拓支援事業',
    description: '東京の中小企業の販路開拓を支援。展示会出展支援、商談会開催、ECサイト構築支援等を実施。',
    target_area: ['東京都'],
    industry: ['製造業', '卸売業、小売業'],
    max_amount: 500000,
    subsidy_rate: '1/2',
    use_purpose: '販路拡大・海外展開をしたい',
    is_active: true,
  },
  {
    jgrants_id: 'cci-tokyo-003',
    name: '東商DX支援',
    title: '東京商工会議所DX推進事業',
    description: '東京の中小企業のDXを支援。DX診断、IT導入支援、デジタル人材育成等を実施。',
    target_area: ['東京都'],
    industry: ['全業種'],
    max_amount: 500000,
    subsidy_rate: '1/2',
    use_purpose: '設備整備・IT導入をしたい',
    is_active: true,
  },
];

// 大阪商工会議所
const OSAKA_CCI_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'cci-osaka-001',
    name: '大商創業支援',
    title: '大阪商工会議所創業支援事業',
    description: '大阪での創業を支援。創業相談、セミナー、ビジネスマッチング等を実施。',
    target_area: ['大阪府'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'cci-osaka-002',
    name: '大商販路開拓支援',
    title: '大阪商工会議所販路開拓支援事業',
    description: '大阪の中小企業の販路開拓を支援。展示会出展支援、商談会開催等を実施。',
    target_area: ['大阪府'],
    industry: ['製造業', '卸売業、小売業'],
    max_amount: 500000,
    subsidy_rate: '1/2',
    use_purpose: '販路拡大・海外展開をしたい',
    is_active: true,
  },
];

// 名古屋商工会議所
const NAGOYA_CCI_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'cci-nagoya-001',
    name: '名商創業支援',
    title: '名古屋商工会議所創業支援事業',
    description: '名古屋での創業を支援。創業相談、セミナー等を実施。',
    target_area: ['愛知県'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'cci-nagoya-002',
    name: '名商ものづくり支援',
    title: '名古屋商工会議所ものづくり支援事業',
    description: '名古屋のものづくり企業を支援。技術相談、産学連携支援等を実施。',
    target_area: ['愛知県'],
    industry: ['製造業'],
    max_amount: 500000,
    subsidy_rate: '1/2',
    use_purpose: '研究開発・実証事業を行いたい',
    is_active: true,
  },
];

// 横浜商工会議所
const YOKOHAMA_CCI_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'cci-yokohama-001',
    name: '横浜商工創業支援',
    title: '横浜商工会議所創業支援事業',
    description: '横浜での創業を支援。創業相談、セミナー等を実施。',
    target_area: ['神奈川県'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
];

// 神戸商工会議所
const KOBE_CCI_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'cci-kobe-001',
    name: '神商創業支援',
    title: '神戸商工会議所創業支援事業',
    description: '神戸での創業を支援。創業相談、セミナー等を実施。',
    target_area: ['兵庫県'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
];

// 福岡商工会議所
const FUKUOKA_CCI_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'cci-fukuoka-001',
    name: '福商創業支援',
    title: '福岡商工会議所創業支援事業',
    description: '福岡での創業を支援。創業相談、セミナー等を実施。スタートアップ支援も積極的に行っています。',
    target_area: ['福岡県'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'cci-fukuoka-002',
    name: '福商アジア展開支援',
    title: '福岡商工会議所アジアビジネス支援事業',
    description: '福岡の中小企業のアジア展開を支援。アジアビジネスマッチング、現地調査支援等を実施。',
    target_area: ['福岡県'],
    industry: ['製造業', '卸売業、小売業'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '販路拡大・海外展開をしたい',
    is_active: true,
  },
];

// 札幌商工会議所
const SAPPORO_CCI_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'cci-sapporo-001',
    name: '札商創業支援',
    title: '札幌商工会議所創業支援事業',
    description: '札幌での創業を支援。創業相談、セミナー等を実施。',
    target_area: ['北海道'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
];

// 仙台商工会議所
const SENDAI_CCI_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'cci-sendai-001',
    name: '仙商創業支援',
    title: '仙台商工会議所創業支援事業',
    description: '仙台での創業を支援。創業相談、セミナー等を実施。',
    target_area: ['宮城県'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
];

// 広島商工会議所
const HIROSHIMA_CCI_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'cci-hiroshima-001',
    name: '広商創業支援',
    title: '広島商工会議所創業支援事業',
    description: '広島での創業を支援。創業相談、セミナー等を実施。',
    target_area: ['広島県'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
];

// 京都商工会議所
const KYOTO_CCI_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'cci-kyoto-001',
    name: '京商創業支援',
    title: '京都商工会議所創業支援事業',
    description: '京都での創業を支援。創業相談、セミナー等を実施。伝統産業との融合事業も支援。',
    target_area: ['京都府'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'cci-kyoto-002',
    name: '京商伝統産業支援',
    title: '京都商工会議所伝統産業振興事業',
    description: '京都の伝統産業を支援。後継者育成、販路開拓、海外展開等を支援。',
    target_area: ['京都府'],
    industry: ['製造業', '卸売業、小売業'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '販路拡大・海外展開をしたい',
    is_active: true,
  },
];

// ========================================
// 業種別・テーマ別商工会議所支援
// ========================================
const INDUSTRY_CCI_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'cci-industry-001',
    name: '商工会議所事業承継支援',
    title: '商工会議所事業承継支援事業',
    description: '中小企業の事業承継を支援。後継者育成、M&Aマッチング、事業承継計画策定等を支援します。',
    target_area: ['全国'],
    industry: ['全業種'],
    max_amount: 500000,
    subsidy_rate: '1/2',
    use_purpose: '事業を引き継ぎたい',
    is_active: true,
  },
  {
    jgrants_id: 'cci-industry-002',
    name: '商工会議所BCP支援',
    title: '商工会議所BCP策定支援事業',
    description: '中小企業のBCP（事業継続計画）策定を支援。災害対策、リスク管理等の体制整備を支援します。',
    target_area: ['全国'],
    industry: ['全業種'],
    max_amount: 300000,
    subsidy_rate: '1/2',
    use_purpose: '災害(自然災害、感染症等)支援がほしい',
    is_active: true,
  },
  {
    jgrants_id: 'cci-industry-003',
    name: '商工会議所人材育成支援',
    title: '商工会議所人材育成支援事業',
    description: '中小企業の人材育成を支援。研修プログラム、資格取得支援等を実施します。',
    target_area: ['全国'],
    industry: ['全業種'],
    max_amount: 300000,
    subsidy_rate: '1/2',
    use_purpose: '人材育成を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'cci-industry-004',
    name: '商工会議所インバウンド支援',
    title: '商工会議所インバウンド対応支援事業',
    description: 'インバウンド需要取り込みを支援。多言語対応、キャッシュレス決済導入等を支援します。',
    target_area: ['全国'],
    industry: ['宿泊業、飲食サービス業', '卸売業、小売業'],
    max_amount: 500000,
    subsidy_rate: '1/2',
    use_purpose: '販路拡大・海外展開をしたい',
    is_active: true,
  },
  {
    jgrants_id: 'cci-industry-005',
    name: '商工会議所脱炭素支援',
    title: '商工会議所脱炭素経営支援事業',
    description: '中小企業の脱炭素経営を支援。省エネ診断、CO2削減計画策定等を支援します。',
    target_area: ['全国'],
    industry: ['全業種'],
    max_amount: 500000,
    subsidy_rate: '1/2',
    use_purpose: 'エコ・SDGs活動支援がほしい',
    is_active: true,
  },
];

// 全補助金を統合
const ALL_SUBSIDIES = [
  ...JCCI_SUBSIDIES,
  ...SHOKOKAI_SUBSIDIES,
  ...TOKYO_CCI_SUBSIDIES,
  ...OSAKA_CCI_SUBSIDIES,
  ...NAGOYA_CCI_SUBSIDIES,
  ...YOKOHAMA_CCI_SUBSIDIES,
  ...KOBE_CCI_SUBSIDIES,
  ...FUKUOKA_CCI_SUBSIDIES,
  ...SAPPORO_CCI_SUBSIDIES,
  ...SENDAI_CCI_SUBSIDIES,
  ...HIROSHIMA_CCI_SUBSIDIES,
  ...KYOTO_CCI_SUBSIDIES,
  ...INDUSTRY_CCI_SUBSIDIES,
];

async function main() {
  console.log('='.repeat(60));
  console.log('商工会議所・商工会系 補助金データ追加');
  console.log('実行日時:', new Date().toLocaleString('ja-JP'));
  console.log('='.repeat(60));

  console.log('\n追加予定:', ALL_SUBSIDIES.length + '件');
  console.log('  - 日本商工会議所: 4件');
  console.log('  - 全国商工会連合会: 2件');
  console.log('  - 東京商工会議所: 3件');
  console.log('  - 大阪商工会議所: 2件');
  console.log('  - 名古屋商工会議所: 2件');
  console.log('  - その他主要商工会議所');
  console.log('  - 業種別・テーマ別支援: 5件');

  let successCount = 0;
  let errorCount = 0;

  for (const subsidy of ALL_SUBSIDIES) {
    const record = {
      ...subsidy,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('subsidies')
      .upsert(record, { onConflict: 'jgrants_id' });

    if (error) {
      console.error(`  ✗ ${subsidy.title}: ${error.message}`);
      errorCount++;
    } else {
      successCount++;
    }
  }

  // 結果確認
  const { count: total } = await supabase
    .from('subsidies')
    .select('*', { count: 'exact', head: true });

  const { count: active } = await supabase
    .from('subsidies')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  console.log('\n' + '='.repeat(60));
  console.log('追加完了');
  console.log('  成功:', successCount + '件');
  console.log('  エラー:', errorCount + '件');
  console.log('='.repeat(60));

  console.log('\n=== データベース最終状態 ===');
  console.log('総件数:', total + '件');
  console.log('アクティブ:', active + '件');
}

main();
