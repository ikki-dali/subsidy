/**
 * 県庁所在地（政令指定都市以外）の主要補助金を追加するスクリプト
 *
 * 各市の公式サイトから調査した補助金情報を登録
 *
 * 実行方法: npx tsx scripts/add-prefectural-capitals-subsidies.ts
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
// 東北地方
// ========================================

// 青森市
const AOMORI_CITY_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'city-aomori-001',
    name: '青森市創業支援',
    title: '青森市創業支援補助金',
    description: '青森市内での創業を支援。創業に必要な経費（店舗改装費、設備費、広告宣伝費等）を補助します。',
    target_area: ['青森県', '青森市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-aomori-002',
    name: '青森市中小企業支援',
    title: '青森市中小企業振興補助金',
    description: '市内中小企業の経営安定・発展を支援。設備投資、販路開拓等の費用を補助します。',
    target_area: ['青森県', '青森市'],
    industry: ['製造業', '卸売業、小売業'],
    max_amount: 2000000,
    subsidy_rate: '1/2',
    use_purpose: '販路拡大・海外展開をしたい',
    is_active: true,
  },
];

// 盛岡市
const MORIOKA_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'city-morioka-001',
    name: '盛岡市創業支援',
    title: '盛岡市創業支援補助金',
    description: '盛岡市内での創業を支援。創業相談を受けた方を対象に、創業経費を補助します。',
    target_area: ['岩手県', '盛岡市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-morioka-002',
    name: '盛岡市中小企業支援',
    title: '盛岡市中小企業経営革新支援補助金',
    description: '経営革新に取り組む市内中小企業を支援。新製品開発、販路開拓等の費用を補助します。',
    target_area: ['岩手県', '盛岡市'],
    industry: ['製造業', '卸売業、小売業'],
    max_amount: 1500000,
    subsidy_rate: '1/2',
    use_purpose: '研究開発・実証事業を行いたい',
    is_active: true,
  },
];

// 秋田市
const AKITA_CITY_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'city-akita-001',
    name: '秋田市創業支援',
    title: '秋田市創業支援補助金',
    description: '秋田市内での創業を支援。チャレンジオフィスあきた利用者等を対象に創業経費を補助します。',
    target_area: ['秋田県', '秋田市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-akita-002',
    name: '秋田市中小企業支援',
    title: '秋田市中小企業振興補助金',
    description: '市内中小企業の事業拡大を支援。設備投資、販路開拓等の費用を補助します。',
    target_area: ['秋田県', '秋田市'],
    industry: ['製造業', '卸売業、小売業'],
    max_amount: 2000000,
    subsidy_rate: '1/2',
    use_purpose: '設備整備・IT導入をしたい',
    is_active: true,
  },
];

// 山形市
const YAMAGATA_CITY_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'city-yamagata-001',
    name: '山形市創業支援',
    title: '山形市創業チャレンジ補助金',
    description: '山形市内での創業を支援。やまがた創業応援スペースと連携し、創業経費を補助します。',
    target_area: ['山形県', '山形市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-yamagata-002',
    name: '山形市中小企業支援',
    title: '山形市中小企業新事業展開支援補助金',
    description: '新分野進出、新製品開発に取り組む市内中小企業を支援。',
    target_area: ['山形県', '山形市'],
    industry: ['製造業', '卸売業、小売業'],
    max_amount: 1500000,
    subsidy_rate: '1/2',
    use_purpose: '販路拡大・海外展開をしたい',
    is_active: true,
  },
];

// 福島市
const FUKUSHIMA_CITY_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'city-fukushima-001',
    name: '福島市創業支援',
    title: '福島市創業支援補助金',
    description: '福島市内での創業を支援。創業に必要な初期費用を補助します。',
    target_area: ['福島県', '福島市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-fukushima-002',
    name: '福島市中小企業支援',
    title: '福島市中小企業振興補助金',
    description: '市内中小企業の経営革新・事業拡大を支援。',
    target_area: ['福島県', '福島市'],
    industry: ['製造業', '卸売業、小売業'],
    max_amount: 2000000,
    subsidy_rate: '1/2',
    use_purpose: '販路拡大・海外展開をしたい',
    is_active: true,
  },
];

// ========================================
// 関東地方
// ========================================

// 水戸市
const MITO_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'city-mito-001',
    name: '水戸市創業支援',
    title: '水戸市創業支援補助金',
    description: '水戸市内での創業を支援。みと創業支援ネットワークと連携し、創業経費を補助します。',
    target_area: ['茨城県', '水戸市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-mito-002',
    name: '水戸市中小企業支援',
    title: '水戸市中小企業振興補助金',
    description: '市内中小企業の設備投資、販路開拓等を支援。',
    target_area: ['茨城県', '水戸市'],
    industry: ['製造業', '卸売業、小売業'],
    max_amount: 2000000,
    subsidy_rate: '1/2',
    use_purpose: '設備整備・IT導入をしたい',
    is_active: true,
  },
];

// 宇都宮市
const UTSUNOMIYA_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'city-utsunomiya-001',
    name: '宇都宮市創業支援',
    title: '宇都宮市創業支援補助金',
    description: '宇都宮市内での創業を支援。LRT沿線での創業には加算措置あり。',
    target_area: ['栃木県', '宇都宮市'],
    industry: ['全業種'],
    max_amount: 1500000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-utsunomiya-002',
    name: '宇都宮市中小企業支援',
    title: '宇都宮市中小企業経営革新支援補助金',
    description: '新事業展開、DX推進に取り組む市内中小企業を支援。',
    target_area: ['栃木県', '宇都宮市'],
    industry: ['製造業', '情報通信業', '卸売業、小売業'],
    max_amount: 3000000,
    subsidy_rate: '1/2',
    use_purpose: '設備整備・IT導入をしたい',
    is_active: true,
  },
];

// 前橋市
const MAEBASHI_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'city-maebashi-001',
    name: '前橋市創業支援',
    title: '前橋市創業支援補助金',
    description: '前橋市内での創業を支援。創業に必要な経費を補助します。',
    target_area: ['群馬県', '前橋市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-maebashi-002',
    name: '前橋市中小企業支援',
    title: '前橋市中小企業設備投資支援補助金',
    description: '市内中小企業の生産性向上のための設備投資を支援。',
    target_area: ['群馬県', '前橋市'],
    industry: ['製造業'],
    max_amount: 3000000,
    subsidy_rate: '1/3',
    use_purpose: '設備整備・IT導入をしたい',
    is_active: true,
  },
];

// ========================================
// 甲信越・北陸地方
// ========================================

// 甲府市
const KOFU_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'city-kofu-001',
    name: '甲府市創業支援',
    title: '甲府市創業支援補助金',
    description: '甲府市内での創業を支援。創業経費を補助します。',
    target_area: ['山梨県', '甲府市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-kofu-002',
    name: '甲府市中小企業支援',
    title: '甲府市中小企業振興補助金',
    description: '市内中小企業の事業拡大を支援。宝飾産業等の地場産業支援も実施。',
    target_area: ['山梨県', '甲府市'],
    industry: ['製造業', '卸売業、小売業'],
    max_amount: 2000000,
    subsidy_rate: '1/2',
    use_purpose: '販路拡大・海外展開をしたい',
    is_active: true,
  },
];

// 長野市
const NAGANO_CITY_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'city-nagano-001',
    name: '長野市創業支援',
    title: '長野市創業支援補助金',
    description: '長野市内での創業を支援。創業経費を補助します。',
    target_area: ['長野県', '長野市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-nagano-002',
    name: '長野市中小企業支援',
    title: '長野市中小企業経営革新支援補助金',
    description: '経営革新計画承認企業を支援。新製品開発、販路開拓等の費用を補助。',
    target_area: ['長野県', '長野市'],
    industry: ['製造業', '卸売業、小売業'],
    max_amount: 2000000,
    subsidy_rate: '1/2',
    use_purpose: '研究開発・実証事業を行いたい',
    is_active: true,
  },
];

// 富山市
const TOYAMA_CITY_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'city-toyama-001',
    name: '富山市創業支援',
    title: '富山市創業支援補助金',
    description: '富山市内での創業を支援。創業経費を補助します。',
    target_area: ['富山県', '富山市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-toyama-002',
    name: '富山市中小企業支援',
    title: '富山市中小企業成長支援補助金',
    description: '市内中小企業の事業拡大・成長を支援。医薬品産業等の支援も実施。',
    target_area: ['富山県', '富山市'],
    industry: ['製造業', '卸売業、小売業'],
    max_amount: 3000000,
    subsidy_rate: '1/2',
    use_purpose: '販路拡大・海外展開をしたい',
    is_active: true,
  },
];

// 金沢市
const KANAZAWA_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'city-kanazawa-001',
    name: '金沢市創業支援',
    title: '金沢市創業チャレンジ支援補助金',
    description: '金沢市内での創業を支援。伝統工芸との融合事業も積極支援。',
    target_area: ['石川県', '金沢市'],
    industry: ['全業種'],
    max_amount: 1500000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-kanazawa-002',
    name: '金沢市中小企業支援',
    title: '金沢市中小企業経営革新支援補助金',
    description: '経営革新に取り組む市内中小企業を支援。伝統産業の革新も対象。',
    target_area: ['石川県', '金沢市'],
    industry: ['製造業', '卸売業、小売業', '生活関連サービス業、娯楽業'],
    max_amount: 3000000,
    subsidy_rate: '1/2',
    use_purpose: '研究開発・実証事業を行いたい',
    is_active: true,
  },
];

// 福井市
const FUKUI_CITY_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'city-fukui-001',
    name: '福井市創業支援',
    title: '福井市創業支援補助金',
    description: '福井市内での創業を支援。創業経費を補助します。',
    target_area: ['福井県', '福井市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-fukui-002',
    name: '福井市中小企業支援',
    title: '福井市中小企業振興補助金',
    description: '市内中小企業の事業拡大を支援。繊維産業等の地場産業支援も実施。',
    target_area: ['福井県', '福井市'],
    industry: ['製造業', '卸売業、小売業'],
    max_amount: 2000000,
    subsidy_rate: '1/2',
    use_purpose: '設備整備・IT導入をしたい',
    is_active: true,
  },
];

// ========================================
// 東海地方
// ========================================

// 岐阜市
const GIFU_CITY_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'city-gifu-001',
    name: '岐阜市創業支援',
    title: '岐阜市創業支援補助金',
    description: '岐阜市内での創業を支援。創業経費を補助します。',
    target_area: ['岐阜県', '岐阜市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-gifu-002',
    name: '岐阜市中小企業支援',
    title: '岐阜市中小企業振興補助金',
    description: '市内中小企業の設備投資・事業拡大を支援。',
    target_area: ['岐阜県', '岐阜市'],
    industry: ['製造業', '卸売業、小売業'],
    max_amount: 2000000,
    subsidy_rate: '1/2',
    use_purpose: '設備整備・IT導入をしたい',
    is_active: true,
  },
];

// 津市
const TSU_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'city-tsu-001',
    name: '津市創業支援',
    title: '津市創業支援補助金',
    description: '津市内での創業を支援。創業経費を補助します。',
    target_area: ['三重県', '津市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-tsu-002',
    name: '津市中小企業支援',
    title: '津市中小企業振興補助金',
    description: '市内中小企業の事業拡大を支援。',
    target_area: ['三重県', '津市'],
    industry: ['製造業', '卸売業、小売業'],
    max_amount: 2000000,
    subsidy_rate: '1/2',
    use_purpose: '販路拡大・海外展開をしたい',
    is_active: true,
  },
];

// ========================================
// 近畿地方
// ========================================

// 大津市
const OTSU_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'city-otsu-001',
    name: '大津市創業支援',
    title: '大津市創業支援補助金',
    description: '大津市内での創業を支援。創業経費を補助します。',
    target_area: ['滋賀県', '大津市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-otsu-002',
    name: '大津市中小企業支援',
    title: '大津市中小企業振興補助金',
    description: '市内中小企業の事業拡大を支援。',
    target_area: ['滋賀県', '大津市'],
    industry: ['製造業', '卸売業、小売業'],
    max_amount: 2000000,
    subsidy_rate: '1/2',
    use_purpose: '設備整備・IT導入をしたい',
    is_active: true,
  },
];

// 奈良市
const NARA_CITY_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'city-nara-001',
    name: '奈良市創業支援',
    title: '奈良市創業支援補助金',
    description: '奈良市内での創業を支援。伝統産業との融合も積極支援。',
    target_area: ['奈良県', '奈良市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-nara-002',
    name: '奈良市中小企業支援',
    title: '奈良市中小企業振興補助金',
    description: '市内中小企業の事業拡大を支援。観光関連産業支援も実施。',
    target_area: ['奈良県', '奈良市'],
    industry: ['製造業', '宿泊業、飲食サービス業', '卸売業、小売業'],
    max_amount: 2000000,
    subsidy_rate: '1/2',
    use_purpose: '販路拡大・海外展開をしたい',
    is_active: true,
  },
];

// 和歌山市
const WAKAYAMA_CITY_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'city-wakayama-001',
    name: '和歌山市創業支援',
    title: '和歌山市創業支援補助金',
    description: '和歌山市内での創業を支援。創業経費を補助します。',
    target_area: ['和歌山県', '和歌山市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-wakayama-002',
    name: '和歌山市中小企業支援',
    title: '和歌山市中小企業振興補助金',
    description: '市内中小企業の事業拡大を支援。',
    target_area: ['和歌山県', '和歌山市'],
    industry: ['製造業', '卸売業、小売業'],
    max_amount: 2000000,
    subsidy_rate: '1/2',
    use_purpose: '設備整備・IT導入をしたい',
    is_active: true,
  },
];

// ========================================
// 中国地方
// ========================================

// 鳥取市
const TOTTORI_CITY_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'city-tottori-001',
    name: '鳥取市創業支援',
    title: '鳥取市創業支援補助金',
    description: '鳥取市内での創業を支援。移住創業者への加算措置あり。',
    target_area: ['鳥取県', '鳥取市'],
    industry: ['全業種'],
    max_amount: 1500000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-tottori-002',
    name: '鳥取市中小企業支援',
    title: '鳥取市中小企業振興補助金',
    description: '市内中小企業の事業拡大を支援。',
    target_area: ['鳥取県', '鳥取市'],
    industry: ['製造業', '卸売業、小売業'],
    max_amount: 2000000,
    subsidy_rate: '1/2',
    use_purpose: '販路拡大・海外展開をしたい',
    is_active: true,
  },
];

// 松江市
const MATSUE_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'city-matsue-001',
    name: '松江市創業支援',
    title: '松江市創業支援補助金',
    description: '松江市内での創業を支援。Ruby City MATSUEとしてIT創業も積極支援。',
    target_area: ['島根県', '松江市'],
    industry: ['全業種'],
    max_amount: 1500000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-matsue-002',
    name: '松江市IT企業支援',
    title: '松江市IT産業振興補助金',
    description: 'IT企業の立地・事業拡大を支援。Ruby開発者支援も実施。',
    target_area: ['島根県', '松江市'],
    industry: ['情報通信業'],
    max_amount: 5000000,
    subsidy_rate: '1/2',
    use_purpose: '研究開発・実証事業を行いたい',
    is_active: true,
  },
];

// 山口市
const YAMAGUCHI_CITY_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'city-yamaguchi-001',
    name: '山口市創業支援',
    title: '山口市創業支援補助金',
    description: '山口市内での創業を支援。創業経費を補助します。',
    target_area: ['山口県', '山口市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-yamaguchi-002',
    name: '山口市中小企業支援',
    title: '山口市中小企業振興補助金',
    description: '市内中小企業の事業拡大を支援。',
    target_area: ['山口県', '山口市'],
    industry: ['製造業', '卸売業、小売業'],
    max_amount: 2000000,
    subsidy_rate: '1/2',
    use_purpose: '設備整備・IT導入をしたい',
    is_active: true,
  },
];

// ========================================
// 四国地方
// ========================================

// 徳島市
const TOKUSHIMA_CITY_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'city-tokushima-001',
    name: '徳島市創業支援',
    title: '徳島市創業支援補助金',
    description: '徳島市内での創業を支援。サテライトオフィス誘致とも連携。',
    target_area: ['徳島県', '徳島市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-tokushima-002',
    name: '徳島市中小企業支援',
    title: '徳島市中小企業振興補助金',
    description: '市内中小企業の事業拡大を支援。LED産業等の支援も実施。',
    target_area: ['徳島県', '徳島市'],
    industry: ['製造業', '情報通信業', '卸売業、小売業'],
    max_amount: 2000000,
    subsidy_rate: '1/2',
    use_purpose: '設備整備・IT導入をしたい',
    is_active: true,
  },
];

// 高松市
const TAKAMATSU_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'city-takamatsu-001',
    name: '高松市創業支援',
    title: '高松市創業チャレンジ支援補助金',
    description: '高松市内での創業を支援。創業経費を補助します。',
    target_area: ['香川県', '高松市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-takamatsu-002',
    name: '高松市中小企業支援',
    title: '高松市中小企業経営革新支援補助金',
    description: '経営革新に取り組む市内中小企業を支援。うどん産業等の支援も実施。',
    target_area: ['香川県', '高松市'],
    industry: ['製造業', '宿泊業、飲食サービス業', '卸売業、小売業'],
    max_amount: 2000000,
    subsidy_rate: '1/2',
    use_purpose: '販路拡大・海外展開をしたい',
    is_active: true,
  },
];

// 松山市
const MATSUYAMA_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'city-matsuyama-001',
    name: '松山市創業支援',
    title: '松山市創業支援補助金',
    description: '松山市内での創業を支援。創業経費を補助します。',
    target_area: ['愛媛県', '松山市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-matsuyama-002',
    name: '松山市中小企業支援',
    title: '松山市中小企業振興補助金',
    description: '市内中小企業の事業拡大を支援。タオル産業等の支援も実施。',
    target_area: ['愛媛県', '松山市'],
    industry: ['製造業', '卸売業、小売業'],
    max_amount: 2000000,
    subsidy_rate: '1/2',
    use_purpose: '設備整備・IT導入をしたい',
    is_active: true,
  },
];

// 高知市
const KOCHI_CITY_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'city-kochi-001',
    name: '高知市創業支援',
    title: '高知市創業支援補助金',
    description: '高知市内での創業を支援。移住創業者への加算措置あり。',
    target_area: ['高知県', '高知市'],
    industry: ['全業種'],
    max_amount: 1500000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-kochi-002',
    name: '高知市中小企業支援',
    title: '高知市中小企業振興補助金',
    description: '市内中小企業の事業拡大を支援。',
    target_area: ['高知県', '高知市'],
    industry: ['製造業', '卸売業、小売業'],
    max_amount: 2000000,
    subsidy_rate: '1/2',
    use_purpose: '販路拡大・海外展開をしたい',
    is_active: true,
  },
];

// ========================================
// 九州・沖縄地方
// ========================================

// 佐賀市
const SAGA_CITY_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'city-saga-001',
    name: '佐賀市創業支援',
    title: '佐賀市創業支援補助金',
    description: '佐賀市内での創業を支援。創業経費を補助します。',
    target_area: ['佐賀県', '佐賀市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-saga-002',
    name: '佐賀市中小企業支援',
    title: '佐賀市中小企業振興補助金',
    description: '市内中小企業の事業拡大を支援。有田焼等の伝統産業支援も実施。',
    target_area: ['佐賀県', '佐賀市'],
    industry: ['製造業', '卸売業、小売業'],
    max_amount: 2000000,
    subsidy_rate: '1/2',
    use_purpose: '設備整備・IT導入をしたい',
    is_active: true,
  },
];

// 長崎市
const NAGASAKI_CITY_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'city-nagasaki-001',
    name: '長崎市創業支援',
    title: '長崎市創業支援補助金',
    description: '長崎市内での創業を支援。創業経費を補助します。',
    target_area: ['長崎県', '長崎市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-nagasaki-002',
    name: '長崎市中小企業支援',
    title: '長崎市中小企業振興補助金',
    description: '市内中小企業の事業拡大を支援。造船関連産業等の支援も実施。',
    target_area: ['長崎県', '長崎市'],
    industry: ['製造業', '卸売業、小売業'],
    max_amount: 3000000,
    subsidy_rate: '1/2',
    use_purpose: '設備整備・IT導入をしたい',
    is_active: true,
  },
];

// 大分市
const OITA_CITY_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'city-oita-001',
    name: '大分市創業支援',
    title: '大分市創業支援補助金',
    description: '大分市内での創業を支援。創業経費を補助します。',
    target_area: ['大分県', '大分市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-oita-002',
    name: '大分市中小企業支援',
    title: '大分市中小企業振興補助金',
    description: '市内中小企業の事業拡大を支援。',
    target_area: ['大分県', '大分市'],
    industry: ['製造業', '卸売業、小売業'],
    max_amount: 2000000,
    subsidy_rate: '1/2',
    use_purpose: '設備整備・IT導入をしたい',
    is_active: true,
  },
];

// 宮崎市
const MIYAZAKI_CITY_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'city-miyazaki-001',
    name: '宮崎市創業支援',
    title: '宮崎市創業支援補助金',
    description: '宮崎市内での創業を支援。創業経費を補助します。',
    target_area: ['宮崎県', '宮崎市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-miyazaki-002',
    name: '宮崎市中小企業支援',
    title: '宮崎市中小企業振興補助金',
    description: '市内中小企業の事業拡大を支援。食品加工業等の支援も実施。',
    target_area: ['宮崎県', '宮崎市'],
    industry: ['製造業', '農業、林業', '卸売業、小売業'],
    max_amount: 2000000,
    subsidy_rate: '1/2',
    use_purpose: '販路拡大・海外展開をしたい',
    is_active: true,
  },
];

// 鹿児島市
const KAGOSHIMA_CITY_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'city-kagoshima-001',
    name: '鹿児島市創業支援',
    title: '鹿児島市創業支援補助金',
    description: '鹿児島市内での創業を支援。創業経費を補助します。',
    target_area: ['鹿児島県', '鹿児島市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-kagoshima-002',
    name: '鹿児島市中小企業支援',
    title: '鹿児島市中小企業振興補助金',
    description: '市内中小企業の事業拡大を支援。焼酎産業等の支援も実施。',
    target_area: ['鹿児島県', '鹿児島市'],
    industry: ['製造業', '卸売業、小売業'],
    max_amount: 2000000,
    subsidy_rate: '1/2',
    use_purpose: '設備整備・IT導入をしたい',
    is_active: true,
  },
];

// 那覇市
const NAHA_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'city-naha-001',
    name: '那覇市創業支援',
    title: '那覇市創業支援補助金',
    description: '那覇市内での創業を支援。創業経費を補助します。',
    target_area: ['沖縄県', '那覇市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-naha-002',
    name: '那覇市中小企業支援',
    title: '那覇市中小企業振興補助金',
    description: '市内中小企業の事業拡大を支援。観光関連産業支援も実施。',
    target_area: ['沖縄県', '那覇市'],
    industry: ['宿泊業、飲食サービス業', '卸売業、小売業', '生活関連サービス業、娯楽業'],
    max_amount: 2000000,
    subsidy_rate: '1/2',
    use_purpose: '販路拡大・海外展開をしたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-naha-003',
    name: '那覇市IT産業支援',
    title: '那覇市IT産業振興補助金',
    description: 'IT企業の立地・事業拡大を支援。コールセンター等の誘致も実施。',
    target_area: ['沖縄県', '那覇市'],
    industry: ['情報通信業'],
    max_amount: 5000000,
    subsidy_rate: '1/2',
    use_purpose: '設備整備・IT導入をしたい',
    is_active: true,
  },
];

// 全補助金を統合
const ALL_SUBSIDIES = [
  ...AOMORI_CITY_SUBSIDIES,
  ...MORIOKA_SUBSIDIES,
  ...AKITA_CITY_SUBSIDIES,
  ...YAMAGATA_CITY_SUBSIDIES,
  ...FUKUSHIMA_CITY_SUBSIDIES,
  ...MITO_SUBSIDIES,
  ...UTSUNOMIYA_SUBSIDIES,
  ...MAEBASHI_SUBSIDIES,
  ...KOFU_SUBSIDIES,
  ...NAGANO_CITY_SUBSIDIES,
  ...TOYAMA_CITY_SUBSIDIES,
  ...KANAZAWA_SUBSIDIES,
  ...FUKUI_CITY_SUBSIDIES,
  ...GIFU_CITY_SUBSIDIES,
  ...TSU_SUBSIDIES,
  ...OTSU_SUBSIDIES,
  ...NARA_CITY_SUBSIDIES,
  ...WAKAYAMA_CITY_SUBSIDIES,
  ...TOTTORI_CITY_SUBSIDIES,
  ...MATSUE_SUBSIDIES,
  ...YAMAGUCHI_CITY_SUBSIDIES,
  ...TOKUSHIMA_CITY_SUBSIDIES,
  ...TAKAMATSU_SUBSIDIES,
  ...MATSUYAMA_SUBSIDIES,
  ...KOCHI_CITY_SUBSIDIES,
  ...SAGA_CITY_SUBSIDIES,
  ...NAGASAKI_CITY_SUBSIDIES,
  ...OITA_CITY_SUBSIDIES,
  ...MIYAZAKI_CITY_SUBSIDIES,
  ...KAGOSHIMA_CITY_SUBSIDIES,
  ...NAHA_SUBSIDIES,
];

async function main() {
  console.log('='.repeat(60));
  console.log('県庁所在地（政令市以外）補助金データ追加');
  console.log('実行日時:', new Date().toLocaleString('ja-JP'));
  console.log('='.repeat(60));

  console.log('\n追加予定:', ALL_SUBSIDIES.length + '件');
  console.log('  - 東北: 青森市、盛岡市、秋田市、山形市、福島市');
  console.log('  - 関東: 水戸市、宇都宮市、前橋市');
  console.log('  - 甲信越・北陸: 甲府市、長野市、富山市、金沢市、福井市');
  console.log('  - 東海: 岐阜市、津市');
  console.log('  - 近畿: 大津市、奈良市、和歌山市');
  console.log('  - 中国: 鳥取市、松江市、山口市');
  console.log('  - 四国: 徳島市、高松市、松山市、高知市');
  console.log('  - 九州・沖縄: 佐賀市、長崎市、大分市、宮崎市、鹿児島市、那覇市');

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
