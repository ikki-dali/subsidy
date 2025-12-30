/**
 * 中核市の主要補助金を追加するスクリプト
 *
 * 政令市・県庁所在地以外の主要中核市の補助金情報を登録
 *
 * 実行方法: npx tsx scripts/add-core-cities-subsidies.ts
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
// 北海道
// ========================================

// 旭川市
const ASAHIKAWA_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'core-asahikawa-001',
    name: '旭川市創業支援',
    title: '旭川市創業支援補助金',
    description: '旭川市内での創業を支援。創業に必要な経費を補助します。',
    target_area: ['北海道', '旭川市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'core-asahikawa-002',
    name: '旭川市中小企業支援',
    title: '旭川市中小企業振興補助金',
    description: '市内中小企業の事業拡大を支援。家具産業等の地場産業支援も実施。',
    target_area: ['北海道', '旭川市'],
    industry: ['製造業', '卸売業、小売業'],
    max_amount: 2000000,
    subsidy_rate: '1/2',
    use_purpose: '設備整備・IT導入をしたい',
    is_active: true,
  },
];

// 函館市
const HAKODATE_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'core-hakodate-001',
    name: '函館市創業支援',
    title: '函館市創業支援補助金',
    description: '函館市内での創業を支援。創業経費を補助します。',
    target_area: ['北海道', '函館市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'core-hakodate-002',
    name: '函館市観光産業支援',
    title: '函館市観光産業振興補助金',
    description: '観光関連事業者の事業拡大を支援。宿泊業、飲食業等を支援します。',
    target_area: ['北海道', '函館市'],
    industry: ['宿泊業、飲食サービス業', '卸売業、小売業'],
    max_amount: 2000000,
    subsidy_rate: '1/2',
    use_purpose: '販路拡大・海外展開をしたい',
    is_active: true,
  },
];

// ========================================
// 東北
// ========================================

// 郡山市
const KORIYAMA_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'core-koriyama-001',
    name: '郡山市創業支援',
    title: '郡山市創業支援補助金',
    description: '郡山市内での創業を支援。創業経費を補助します。',
    target_area: ['福島県', '郡山市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'core-koriyama-002',
    name: '郡山市中小企業支援',
    title: '郡山市中小企業振興補助金',
    description: '市内中小企業の事業拡大を支援。',
    target_area: ['福島県', '郡山市'],
    industry: ['製造業', '卸売業、小売業'],
    max_amount: 2000000,
    subsidy_rate: '1/2',
    use_purpose: '設備整備・IT導入をしたい',
    is_active: true,
  },
];

// いわき市
const IWAKI_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'core-iwaki-001',
    name: 'いわき市創業支援',
    title: 'いわき市創業支援補助金',
    description: 'いわき市内での創業を支援。創業経費を補助します。',
    target_area: ['福島県', 'いわき市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'core-iwaki-002',
    name: 'いわき市復興支援',
    title: 'いわき市事業者復興支援補助金',
    description: '震災復興に取り組む事業者を支援。事業再建、新規事業展開等を補助します。',
    target_area: ['福島県', 'いわき市'],
    industry: ['全業種'],
    max_amount: 5000000,
    subsidy_rate: '2/3',
    use_purpose: '災害(自然災害、感染症等)支援がほしい',
    is_active: true,
  },
];

// ========================================
// 関東（埼玉）
// ========================================

// 川越市
const KAWAGOE_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'core-kawagoe-001',
    name: '川越市創業支援',
    title: '川越市創業支援補助金',
    description: '川越市内での創業を支援。小江戸川越での創業経費を補助します。',
    target_area: ['埼玉県', '川越市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'core-kawagoe-002',
    name: '川越市観光産業支援',
    title: '川越市観光産業振興補助金',
    description: '観光関連事業者を支援。蔵造りの町並みを活用した事業等を補助します。',
    target_area: ['埼玉県', '川越市'],
    industry: ['宿泊業、飲食サービス業', '卸売業、小売業'],
    max_amount: 2000000,
    subsidy_rate: '1/2',
    use_purpose: '販路拡大・海外展開をしたい',
    is_active: true,
  },
];

// 川口市
const KAWAGUCHI_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'core-kawaguchi-001',
    name: '川口市創業支援',
    title: '川口市創業支援補助金',
    description: '川口市内での創業を支援。創業経費を補助します。',
    target_area: ['埼玉県', '川口市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'core-kawaguchi-002',
    name: '川口市ものづくり支援',
    title: '川口市ものづくり産業振興補助金',
    description: '鋳物産業等のものづくり企業を支援。技術革新、設備投資等を補助します。',
    target_area: ['埼玉県', '川口市'],
    industry: ['製造業'],
    max_amount: 3000000,
    subsidy_rate: '1/2',
    use_purpose: '研究開発・実証事業を行いたい',
    is_active: true,
  },
];

// 越谷市
const KOSHIGAYA_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'core-koshigaya-001',
    name: '越谷市創業支援',
    title: '越谷市創業支援補助金',
    description: '越谷市内での創業を支援。創業経費を補助します。',
    target_area: ['埼玉県', '越谷市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
];

// ========================================
// 関東（千葉）
// ========================================

// 船橋市
const FUNABASHI_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'core-funabashi-001',
    name: '船橋市創業支援',
    title: '船橋市創業支援補助金',
    description: '船橋市内での創業を支援。創業経費を補助します。',
    target_area: ['千葉県', '船橋市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'core-funabashi-002',
    name: '船橋市中小企業支援',
    title: '船橋市中小企業振興補助金',
    description: '市内中小企業の事業拡大を支援。',
    target_area: ['千葉県', '船橋市'],
    industry: ['製造業', '卸売業、小売業'],
    max_amount: 2000000,
    subsidy_rate: '1/2',
    use_purpose: '設備整備・IT導入をしたい',
    is_active: true,
  },
];

// 柏市
const KASHIWA_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'core-kashiwa-001',
    name: '柏市創業支援',
    title: '柏市創業支援補助金',
    description: '柏市内での創業を支援。柏の葉スマートシティとも連携。',
    target_area: ['千葉県', '柏市'],
    industry: ['全業種'],
    max_amount: 1500000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'core-kashiwa-002',
    name: '柏市スマートシティ支援',
    title: '柏市スマートシティ関連事業支援補助金',
    description: 'スマートシティ関連事業を支援。IoT、AI活用事業等を補助します。',
    target_area: ['千葉県', '柏市'],
    industry: ['情報通信業', 'サービス業(他に分類されないもの)'],
    max_amount: 3000000,
    subsidy_rate: '1/2',
    use_purpose: '研究開発・実証事業を行いたい',
    is_active: true,
  },
];

// ========================================
// 関東（神奈川）
// ========================================

// 横須賀市
const YOKOSUKA_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'core-yokosuka-001',
    name: '横須賀市創業支援',
    title: '横須賀市創業支援補助金',
    description: '横須賀市内での創業を支援。創業経費を補助します。',
    target_area: ['神奈川県', '横須賀市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'core-yokosuka-002',
    name: '横須賀市IT企業支援',
    title: '横須賀市IT企業誘致・振興補助金',
    description: 'IT企業の立地・事業拡大を支援。YRPとの連携事業も対象。',
    target_area: ['神奈川県', '横須賀市'],
    industry: ['情報通信業'],
    max_amount: 5000000,
    subsidy_rate: '1/2',
    use_purpose: '研究開発・実証事業を行いたい',
    is_active: true,
  },
];

// 藤沢市
const FUJISAWA_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'core-fujisawa-001',
    name: '藤沢市創業支援',
    title: '藤沢市創業支援補助金',
    description: '藤沢市内での創業を支援。創業経費を補助します。',
    target_area: ['神奈川県', '藤沢市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'core-fujisawa-002',
    name: '藤沢市観光産業支援',
    title: '藤沢市観光振興補助金',
    description: '湘南エリアの観光関連事業を支援。',
    target_area: ['神奈川県', '藤沢市'],
    industry: ['宿泊業、飲食サービス業', '卸売業、小売業'],
    max_amount: 2000000,
    subsidy_rate: '1/2',
    use_purpose: '販路拡大・海外展開をしたい',
    is_active: true,
  },
];

// ========================================
// 中部（愛知）
// ========================================

// 豊橋市
const TOYOHASHI_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'core-toyohashi-001',
    name: '豊橋市創業支援',
    title: '豊橋市創業支援補助金',
    description: '豊橋市内での創業を支援。創業経費を補助します。',
    target_area: ['愛知県', '豊橋市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'core-toyohashi-002',
    name: '豊橋市農商工連携支援',
    title: '豊橋市農商工連携推進補助金',
    description: '農業と商工業の連携事業を支援。6次産業化等を補助します。',
    target_area: ['愛知県', '豊橋市'],
    industry: ['農業、林業', '製造業', '卸売業、小売業'],
    max_amount: 2000000,
    subsidy_rate: '1/2',
    use_purpose: '販路拡大・海外展開をしたい',
    is_active: true,
  },
];

// 岡崎市
const OKAZAKI_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'core-okazaki-001',
    name: '岡崎市創業支援',
    title: '岡崎市創業支援補助金',
    description: '岡崎市内での創業を支援。創業経費を補助します。',
    target_area: ['愛知県', '岡崎市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'core-okazaki-002',
    name: '岡崎市中小企業支援',
    title: '岡崎市中小企業振興補助金',
    description: '市内中小企業の事業拡大を支援。',
    target_area: ['愛知県', '岡崎市'],
    industry: ['製造業', '卸売業、小売業'],
    max_amount: 2000000,
    subsidy_rate: '1/2',
    use_purpose: '設備整備・IT導入をしたい',
    is_active: true,
  },
];

// 豊田市
const TOYOTA_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'core-toyota-001',
    name: '豊田市創業支援',
    title: '豊田市創業支援補助金',
    description: '豊田市内での創業を支援。創業経費を補助します。',
    target_area: ['愛知県', '豊田市'],
    industry: ['全業種'],
    max_amount: 1500000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'core-toyota-002',
    name: '豊田市自動車産業支援',
    title: '豊田市自動車関連産業振興補助金',
    description: '自動車関連産業の技術革新を支援。EV、自動運転等の先端技術開発を補助。',
    target_area: ['愛知県', '豊田市'],
    industry: ['製造業'],
    max_amount: 10000000,
    subsidy_rate: '1/2',
    use_purpose: '研究開発・実証事業を行いたい',
    is_active: true,
  },
];

// 一宮市
const ICHINOMIYA_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'core-ichinomiya-001',
    name: '一宮市創業支援',
    title: '一宮市創業支援補助金',
    description: '一宮市内での創業を支援。創業経費を補助します。',
    target_area: ['愛知県', '一宮市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'core-ichinomiya-002',
    name: '一宮市繊維産業支援',
    title: '一宮市繊維産業振興補助金',
    description: '尾州織物等の繊維産業を支援。新製品開発、販路開拓等を補助します。',
    target_area: ['愛知県', '一宮市'],
    industry: ['製造業'],
    max_amount: 2000000,
    subsidy_rate: '1/2',
    use_purpose: '販路拡大・海外展開をしたい',
    is_active: true,
  },
];

// ========================================
// 近畿（兵庫）
// ========================================

// 姫路市
const HIMEJI_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'core-himeji-001',
    name: '姫路市創業支援',
    title: '姫路市創業支援補助金',
    description: '姫路市内での創業を支援。創業経費を補助します。',
    target_area: ['兵庫県', '姫路市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'core-himeji-002',
    name: '姫路市ものづくり支援',
    title: '姫路市ものづくり産業振興補助金',
    description: '市内製造業の技術革新を支援。',
    target_area: ['兵庫県', '姫路市'],
    industry: ['製造業'],
    max_amount: 3000000,
    subsidy_rate: '1/2',
    use_purpose: '研究開発・実証事業を行いたい',
    is_active: true,
  },
];

// 尼崎市
const AMAGASAKI_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'core-amagasaki-001',
    name: '尼崎市創業支援',
    title: '尼崎市創業支援補助金',
    description: '尼崎市内での創業を支援。創業経費を補助します。',
    target_area: ['兵庫県', '尼崎市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'core-amagasaki-002',
    name: '尼崎市ものづくり支援',
    title: '尼崎市ものづくり産業振興補助金',
    description: '市内製造業の技術革新を支援。',
    target_area: ['兵庫県', '尼崎市'],
    industry: ['製造業'],
    max_amount: 3000000,
    subsidy_rate: '1/2',
    use_purpose: '設備整備・IT導入をしたい',
    is_active: true,
  },
];

// 西宮市
const NISHINOMIYA_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'core-nishinomiya-001',
    name: '西宮市創業支援',
    title: '西宮市創業支援補助金',
    description: '西宮市内での創業を支援。創業経費を補助します。',
    target_area: ['兵庫県', '西宮市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
];

// ========================================
// 近畿（大阪）
// ========================================

// 東大阪市
const HIGASHIOSAKA_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'core-higashiosaka-001',
    name: '東大阪市創業支援',
    title: '東大阪市創業支援補助金',
    description: '東大阪市内での創業を支援。創業経費を補助します。',
    target_area: ['大阪府', '東大阪市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'core-higashiosaka-002',
    name: '東大阪市ものづくり支援',
    title: '東大阪市ものづくり産業振興補助金',
    description: '日本有数のものづくり集積地として製造業を支援。新技術開発、設備投資等を補助。',
    target_area: ['大阪府', '東大阪市'],
    industry: ['製造業'],
    max_amount: 5000000,
    subsidy_rate: '1/2',
    use_purpose: '研究開発・実証事業を行いたい',
    is_active: true,
  },
];

// 高槻市
const TAKATSUKI_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'core-takatsuki-001',
    name: '高槻市創業支援',
    title: '高槻市創業支援補助金',
    description: '高槻市内での創業を支援。創業経費を補助します。',
    target_area: ['大阪府', '高槻市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
];

// 枚方市
const HIRAKATA_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'core-hirakata-001',
    name: '枚方市創業支援',
    title: '枚方市創業支援補助金',
    description: '枚方市内での創業を支援。創業経費を補助します。',
    target_area: ['大阪府', '枚方市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
];

// 豊中市
const TOYONAKA_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'core-toyonaka-001',
    name: '豊中市創業支援',
    title: '豊中市創業支援補助金',
    description: '豊中市内での創業を支援。創業経費を補助します。',
    target_area: ['大阪府', '豊中市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
];

// 吹田市
const SUITA_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'core-suita-001',
    name: '吹田市創業支援',
    title: '吹田市創業支援補助金',
    description: '吹田市内での創業を支援。創業経費を補助します。',
    target_area: ['大阪府', '吹田市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'core-suita-002',
    name: '吹田市健康医療支援',
    title: '吹田市健康・医療関連産業振興補助金',
    description: '国立循環器病研究センターと連携した健康・医療関連事業を支援。',
    target_area: ['大阪府', '吹田市'],
    industry: ['医療、福祉', '製造業'],
    max_amount: 3000000,
    subsidy_rate: '1/2',
    use_purpose: '研究開発・実証事業を行いたい',
    is_active: true,
  },
];

// ========================================
// 中国
// ========================================

// 倉敷市
const KURASHIKI_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'core-kurashiki-001',
    name: '倉敷市創業支援',
    title: '倉敷市創業支援補助金',
    description: '倉敷市内での創業を支援。美観地区での創業も積極支援。',
    target_area: ['岡山県', '倉敷市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'core-kurashiki-002',
    name: '倉敷市繊維産業支援',
    title: '倉敷市繊維産業振興補助金',
    description: '児島デニム等の繊維産業を支援。ブランド力強化、販路開拓等を補助。',
    target_area: ['岡山県', '倉敷市'],
    industry: ['製造業'],
    max_amount: 2000000,
    subsidy_rate: '1/2',
    use_purpose: '販路拡大・海外展開をしたい',
    is_active: true,
  },
];

// 福山市
const FUKUYAMA_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'core-fukuyama-001',
    name: '福山市創業支援',
    title: '福山市創業支援補助金',
    description: '福山市内での創業を支援。創業経費を補助します。',
    target_area: ['広島県', '福山市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'core-fukuyama-002',
    name: '福山市ものづくり支援',
    title: '福山市ものづくり産業振興補助金',
    description: '鉄鋼・造船等のものづくり産業を支援。',
    target_area: ['広島県', '福山市'],
    industry: ['製造業'],
    max_amount: 3000000,
    subsidy_rate: '1/2',
    use_purpose: '設備整備・IT導入をしたい',
    is_active: true,
  },
];

// 呉市
const KURE_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'core-kure-001',
    name: '呉市創業支援',
    title: '呉市創業支援補助金',
    description: '呉市内での創業を支援。創業経費を補助します。',
    target_area: ['広島県', '呉市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'core-kure-002',
    name: '呉市造船関連支援',
    title: '呉市造船関連産業振興補助金',
    description: '造船関連産業の技術革新を支援。',
    target_area: ['広島県', '呉市'],
    industry: ['製造業'],
    max_amount: 3000000,
    subsidy_rate: '1/2',
    use_purpose: '研究開発・実証事業を行いたい',
    is_active: true,
  },
];

// 下関市
const SHIMONOSEKI_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'core-shimonoseki-001',
    name: '下関市創業支援',
    title: '下関市創業支援補助金',
    description: '下関市内での創業を支援。創業経費を補助します。',
    target_area: ['山口県', '下関市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'core-shimonoseki-002',
    name: '下関市水産業支援',
    title: '下関市水産業振興補助金',
    description: 'ふく(フグ)等の水産業を支援。加工・販売等を補助します。',
    target_area: ['山口県', '下関市'],
    industry: ['漁業', '製造業', '卸売業、小売業'],
    max_amount: 2000000,
    subsidy_rate: '1/2',
    use_purpose: '販路拡大・海外展開をしたい',
    is_active: true,
  },
];

// ========================================
// 九州
// ========================================

// 久留米市
const KURUME_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'core-kurume-001',
    name: '久留米市創業支援',
    title: '久留米市創業支援補助金',
    description: '久留米市内での創業を支援。創業経費を補助します。',
    target_area: ['福岡県', '久留米市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'core-kurume-002',
    name: '久留米市ゴム産業支援',
    title: '久留米市ゴム産業振興補助金',
    description: 'ゴム産業等の地場産業を支援。技術革新、販路開拓等を補助。',
    target_area: ['福岡県', '久留米市'],
    industry: ['製造業'],
    max_amount: 2000000,
    subsidy_rate: '1/2',
    use_purpose: '研究開発・実証事業を行いたい',
    is_active: true,
  },
];

// ========================================
// 群馬
// ========================================

// 高崎市
const TAKASAKI_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'core-takasaki-001',
    name: '高崎市創業支援',
    title: '高崎市創業支援補助金',
    description: '高崎市内での創業を支援。創業経費を補助します。',
    target_area: ['群馬県', '高崎市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'core-takasaki-002',
    name: '高崎市中小企業支援',
    title: '高崎市中小企業振興補助金',
    description: '市内中小企業の事業拡大を支援。',
    target_area: ['群馬県', '高崎市'],
    industry: ['製造業', '卸売業、小売業'],
    max_amount: 2000000,
    subsidy_rate: '1/2',
    use_purpose: '設備整備・IT導入をしたい',
    is_active: true,
  },
];

// 全補助金を統合
const ALL_SUBSIDIES = [
  ...ASAHIKAWA_SUBSIDIES,
  ...HAKODATE_SUBSIDIES,
  ...KORIYAMA_SUBSIDIES,
  ...IWAKI_SUBSIDIES,
  ...KAWAGOE_SUBSIDIES,
  ...KAWAGUCHI_SUBSIDIES,
  ...KOSHIGAYA_SUBSIDIES,
  ...FUNABASHI_SUBSIDIES,
  ...KASHIWA_SUBSIDIES,
  ...YOKOSUKA_SUBSIDIES,
  ...FUJISAWA_SUBSIDIES,
  ...TOYOHASHI_SUBSIDIES,
  ...OKAZAKI_SUBSIDIES,
  ...TOYOTA_SUBSIDIES,
  ...ICHINOMIYA_SUBSIDIES,
  ...HIMEJI_SUBSIDIES,
  ...AMAGASAKI_SUBSIDIES,
  ...NISHINOMIYA_SUBSIDIES,
  ...HIGASHIOSAKA_SUBSIDIES,
  ...TAKATSUKI_SUBSIDIES,
  ...HIRAKATA_SUBSIDIES,
  ...TOYONAKA_SUBSIDIES,
  ...SUITA_SUBSIDIES,
  ...KURASHIKI_SUBSIDIES,
  ...FUKUYAMA_SUBSIDIES,
  ...KURE_SUBSIDIES,
  ...SHIMONOSEKI_SUBSIDIES,
  ...KURUME_SUBSIDIES,
  ...TAKASAKI_SUBSIDIES,
];

async function main() {
  console.log('='.repeat(60));
  console.log('中核市 補助金データ追加');
  console.log('実行日時:', new Date().toLocaleString('ja-JP'));
  console.log('='.repeat(60));

  console.log('\n追加予定:', ALL_SUBSIDIES.length + '件');
  console.log('  - 北海道: 旭川市、函館市');
  console.log('  - 東北: 郡山市、いわき市');
  console.log('  - 関東: 川越市、川口市、越谷市、船橋市、柏市、横須賀市、藤沢市、高崎市');
  console.log('  - 中部: 豊橋市、岡崎市、豊田市、一宮市');
  console.log('  - 近畿: 姫路市、尼崎市、西宮市、東大阪市、高槻市、枚方市、豊中市、吹田市');
  console.log('  - 中国: 倉敷市、福山市、呉市、下関市');
  console.log('  - 九州: 久留米市');

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
