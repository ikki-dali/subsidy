/**
 * 東京都内市区町村の主要補助金を追加するスクリプト
 *
 * 23特別区 + 26市 の補助金情報を登録
 *
 * 実行方法: npx tsx scripts/add-tokyo-municipalities-subsidies.ts
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
// 23特別区
// ========================================

// 千代田区
const CHIYODA_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'tokyo-chiyoda-001',
    name: '千代田区創業支援',
    title: '千代田区中小企業創業支援補助金',
    description: '千代田区内での創業を支援。都心での創業に必要な初期費用（オフィス賃料、設備費等）を補助します。',
    target_area: ['東京都', '千代田区'],
    industry: ['全業種'],
    max_amount: 2000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'tokyo-chiyoda-002',
    name: '千代田区IT導入支援',
    title: '千代田区中小企業IT化推進補助金',
    description: 'IT導入による業務効率化を支援。クラウドサービス、業務システム等の導入費用を補助します。',
    target_area: ['東京都', '千代田区'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '2/3',
    use_purpose: '設備整備・IT導入をしたい',
    is_active: true,
  },
];

// 中央区
const CHUO_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'tokyo-chuo-001',
    name: '中央区創業支援',
    title: '中央区創業支援事業補助金',
    description: '中央区内での創業を支援。銀座・日本橋エリアでの創業に必要な費用を補助します。',
    target_area: ['東京都', '中央区'],
    industry: ['全業種'],
    max_amount: 1500000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'tokyo-chuo-002',
    name: '中央区商店街支援',
    title: '中央区商店街活性化支援補助金',
    description: '区内商店街の活性化を支援。イベント開催、販促活動等の費用を補助します。',
    target_area: ['東京都', '中央区'],
    industry: ['卸売業、小売業'],
    max_amount: 3000000,
    subsidy_rate: '2/3',
    use_purpose: '販路拡大・海外展開をしたい',
    is_active: true,
  },
];

// 港区
const MINATO_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'tokyo-minato-001',
    name: '港区創業支援',
    title: '港区創業支援補助金',
    description: '港区内での創業を支援。六本木・赤坂エリア等での創業経費を補助します。',
    target_area: ['東京都', '港区'],
    industry: ['全業種'],
    max_amount: 2000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'tokyo-minato-002',
    name: '港区中小企業支援',
    title: '港区中小企業経営革新支援補助金',
    description: '経営革新に取り組む区内中小企業を支援。新製品開発、販路開拓等の費用を補助します。',
    target_area: ['東京都', '港区'],
    industry: ['全業種'],
    max_amount: 3000000,
    subsidy_rate: '1/2',
    use_purpose: '研究開発・実証事業を行いたい',
    is_active: true,
  },
];

// 新宿区
const SHINJUKU_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'tokyo-shinjuku-001',
    name: '新宿区創業支援',
    title: '新宿区創業支援補助金',
    description: '新宿区内での創業を支援。創業経費を補助します。',
    target_area: ['東京都', '新宿区'],
    industry: ['全業種'],
    max_amount: 1500000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'tokyo-shinjuku-002',
    name: '新宿区商店街支援',
    title: '新宿区商店街振興事業補助金',
    description: '区内商店街の振興を支援。イベント開催、設備整備等の費用を補助します。',
    target_area: ['東京都', '新宿区'],
    industry: ['卸売業、小売業'],
    max_amount: 2000000,
    subsidy_rate: '2/3',
    use_purpose: '販路拡大・海外展開をしたい',
    is_active: true,
  },
];

// 文京区
const BUNKYO_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'tokyo-bunkyo-001',
    name: '文京区創業支援',
    title: '文京区創業支援補助金',
    description: '文京区内での創業を支援。創業経費を補助します。',
    target_area: ['東京都', '文京区'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
];

// 台東区
const TAITO_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'tokyo-taito-001',
    name: '台東区創業支援',
    title: '台東区創業支援補助金',
    description: '台東区内での創業を支援。浅草・上野エリアでの創業経費を補助します。',
    target_area: ['東京都', '台東区'],
    industry: ['全業種'],
    max_amount: 1500000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'tokyo-taito-002',
    name: '台東区ものづくり支援',
    title: '台東区ものづくり産業支援補助金',
    description: '区内ものづくり企業を支援。伝統工芸、革製品等の製造業を支援します。',
    target_area: ['東京都', '台東区'],
    industry: ['製造業'],
    max_amount: 2000000,
    subsidy_rate: '1/2',
    use_purpose: '研究開発・実証事業を行いたい',
    is_active: true,
  },
];

// 墨田区
const SUMIDA_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'tokyo-sumida-001',
    name: '墨田区創業支援',
    title: '墨田区創業支援補助金',
    description: '墨田区内での創業を支援。創業経費を補助します。',
    target_area: ['東京都', '墨田区'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'tokyo-sumida-002',
    name: '墨田区ものづくり支援',
    title: 'すみだ中小企業ものづくり経営革新補助金',
    description: '区内製造業の技術革新を支援。新製品開発、生産性向上等の費用を補助します。',
    target_area: ['東京都', '墨田区'],
    industry: ['製造業'],
    max_amount: 3000000,
    subsidy_rate: '1/2',
    use_purpose: '研究開発・実証事業を行いたい',
    is_active: true,
  },
];

// 江東区
const KOTO_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'tokyo-koto-001',
    name: '江東区創業支援',
    title: '江東区創業支援補助金',
    description: '江東区内での創業を支援。創業経費を補助します。',
    target_area: ['東京都', '江東区'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'tokyo-koto-002',
    name: '江東区中小企業支援',
    title: '江東区中小企業設備投資支援補助金',
    description: '区内中小企業の設備投資を支援。生産性向上のための設備導入費用を補助します。',
    target_area: ['東京都', '江東区'],
    industry: ['製造業', '卸売業、小売業'],
    max_amount: 2000000,
    subsidy_rate: '1/2',
    use_purpose: '設備整備・IT導入をしたい',
    is_active: true,
  },
];

// 品川区
const SHINAGAWA_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'tokyo-shinagawa-001',
    name: '品川区創業支援',
    title: '品川区創業支援補助金',
    description: '品川区内での創業を支援。創業経費を補助します。',
    target_area: ['東京都', '品川区'],
    industry: ['全業種'],
    max_amount: 1500000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'tokyo-shinagawa-002',
    name: '品川区中小企業支援',
    title: '品川区中小企業経営革新支援補助金',
    description: '経営革新に取り組む区内中小企業を支援します。',
    target_area: ['東京都', '品川区'],
    industry: ['全業種'],
    max_amount: 2000000,
    subsidy_rate: '1/2',
    use_purpose: '研究開発・実証事業を行いたい',
    is_active: true,
  },
];

// 目黒区
const MEGURO_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'tokyo-meguro-001',
    name: '目黒区創業支援',
    title: '目黒区創業支援補助金',
    description: '目黒区内での創業を支援。創業経費を補助します。',
    target_area: ['東京都', '目黒区'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
];

// 大田区
const OTA_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'tokyo-ota-001',
    name: '大田区創業支援',
    title: '大田区創業支援補助金',
    description: '大田区内での創業を支援。創業経費を補助します。',
    target_area: ['東京都', '大田区'],
    industry: ['全業種'],
    max_amount: 1500000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'tokyo-ota-002',
    name: '大田区ものづくり支援',
    title: '大田区ものづくり中小企業経営革新補助金',
    description: '区内ものづくり企業の技術革新を支援。日本有数の町工場集積地として製造業を積極支援。',
    target_area: ['東京都', '大田区'],
    industry: ['製造業'],
    max_amount: 5000000,
    subsidy_rate: '1/2',
    use_purpose: '研究開発・実証事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'tokyo-ota-003',
    name: '大田区設備投資支援',
    title: '大田区中小企業設備投資支援補助金',
    description: '区内中小企業の設備投資を支援。生産設備、IT機器等の導入費用を補助します。',
    target_area: ['東京都', '大田区'],
    industry: ['製造業'],
    max_amount: 3000000,
    subsidy_rate: '1/3',
    use_purpose: '設備整備・IT導入をしたい',
    is_active: true,
  },
];

// 世田谷区
const SETAGAYA_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'tokyo-setagaya-001',
    name: '世田谷区創業支援',
    title: '世田谷区創業支援補助金',
    description: '世田谷区内での創業を支援。創業経費を補助します。',
    target_area: ['東京都', '世田谷区'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'tokyo-setagaya-002',
    name: '世田谷区商店街支援',
    title: '世田谷区商店街活性化支援補助金',
    description: '区内商店街の活性化を支援。イベント開催、販促活動等の費用を補助します。',
    target_area: ['東京都', '世田谷区'],
    industry: ['卸売業、小売業'],
    max_amount: 2000000,
    subsidy_rate: '2/3',
    use_purpose: '販路拡大・海外展開をしたい',
    is_active: true,
  },
];

// 渋谷区
const SHIBUYA_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'tokyo-shibuya-001',
    name: '渋谷区スタートアップ支援',
    title: '渋谷区スタートアップ支援補助金',
    description: '渋谷区内でのスタートアップ創業を支援。Shibuya Startup Deckと連携し、創業経費を補助します。',
    target_area: ['東京都', '渋谷区'],
    industry: ['全業種'],
    max_amount: 3000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'tokyo-shibuya-002',
    name: '渋谷区IT企業支援',
    title: '渋谷区IT・コンテンツ産業振興補助金',
    description: 'IT・コンテンツ企業の成長を支援。研究開発費、人材育成費等を補助します。',
    target_area: ['東京都', '渋谷区'],
    industry: ['情報通信業'],
    max_amount: 5000000,
    subsidy_rate: '1/2',
    use_purpose: '研究開発・実証事業を行いたい',
    is_active: true,
  },
];

// 中野区
const NAKANO_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'tokyo-nakano-001',
    name: '中野区創業支援',
    title: '中野区創業支援補助金',
    description: '中野区内での創業を支援。創業経費を補助します。',
    target_area: ['東京都', '中野区'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
];

// 杉並区
const SUGINAMI_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'tokyo-suginami-001',
    name: '杉並区創業支援',
    title: '杉並区創業支援補助金',
    description: '杉並区内での創業を支援。創業経費を補助します。',
    target_area: ['東京都', '杉並区'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'tokyo-suginami-002',
    name: '杉並区商店街支援',
    title: '杉並区商店街振興補助金',
    description: '区内商店街の振興を支援します。',
    target_area: ['東京都', '杉並区'],
    industry: ['卸売業、小売業'],
    max_amount: 2000000,
    subsidy_rate: '2/3',
    use_purpose: '販路拡大・海外展開をしたい',
    is_active: true,
  },
];

// 豊島区
const TOSHIMA_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'tokyo-toshima-001',
    name: '豊島区創業支援',
    title: '豊島区創業支援補助金',
    description: '豊島区内での創業を支援。池袋エリアでの創業経費を補助します。',
    target_area: ['東京都', '豊島区'],
    industry: ['全業種'],
    max_amount: 1500000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'tokyo-toshima-002',
    name: '豊島区文化産業支援',
    title: '豊島区文化・アート産業支援補助金',
    description: '文化・アート関連事業を支援。国際アートカルチャー都市としての事業を補助します。',
    target_area: ['東京都', '豊島区'],
    industry: ['生活関連サービス業、娯楽業', '教育、学習支援業'],
    max_amount: 2000000,
    subsidy_rate: '1/2',
    use_purpose: 'スポーツ・文化支援がほしい',
    is_active: true,
  },
];

// 北区
const KITA_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'tokyo-kita-001',
    name: '北区創業支援',
    title: '北区創業支援補助金',
    description: '北区内での創業を支援。創業経費を補助します。',
    target_area: ['東京都', '北区'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
];

// 荒川区
const ARAKAWA_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'tokyo-arakawa-001',
    name: '荒川区創業支援',
    title: '荒川区創業支援補助金',
    description: '荒川区内での創業を支援。創業経費を補助します。',
    target_area: ['東京都', '荒川区'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'tokyo-arakawa-002',
    name: '荒川区ものづくり支援',
    title: '荒川区ものづくり産業振興補助金',
    description: '区内ものづくり企業を支援します。',
    target_area: ['東京都', '荒川区'],
    industry: ['製造業'],
    max_amount: 2000000,
    subsidy_rate: '1/2',
    use_purpose: '研究開発・実証事業を行いたい',
    is_active: true,
  },
];

// 板橋区
const ITABASHI_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'tokyo-itabashi-001',
    name: '板橋区創業支援',
    title: '板橋区創業支援補助金',
    description: '板橋区内での創業を支援。創業経費を補助します。',
    target_area: ['東京都', '板橋区'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'tokyo-itabashi-002',
    name: '板橋区ものづくり支援',
    title: '板橋区ものづくり企業経営革新補助金',
    description: '区内製造業の技術革新を支援。光学・精密機械産業等を支援します。',
    target_area: ['東京都', '板橋区'],
    industry: ['製造業'],
    max_amount: 3000000,
    subsidy_rate: '1/2',
    use_purpose: '研究開発・実証事業を行いたい',
    is_active: true,
  },
];

// 練馬区
const NERIMA_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'tokyo-nerima-001',
    name: '練馬区創業支援',
    title: '練馬区創業支援補助金',
    description: '練馬区内での創業を支援。創業経費を補助します。',
    target_area: ['東京都', '練馬区'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'tokyo-nerima-002',
    name: '練馬区アニメ産業支援',
    title: '練馬区アニメ産業振興補助金',
    description: 'アニメ制作会社の事業を支援。日本有数のアニメ産業集積地として支援します。',
    target_area: ['東京都', '練馬区'],
    industry: ['情報通信業', '生活関連サービス業、娯楽業'],
    max_amount: 3000000,
    subsidy_rate: '1/2',
    use_purpose: 'スポーツ・文化支援がほしい',
    is_active: true,
  },
];

// 足立区
const ADACHI_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'tokyo-adachi-001',
    name: '足立区創業支援',
    title: '足立区創業支援補助金',
    description: '足立区内での創業を支援。創業経費を補助します。',
    target_area: ['東京都', '足立区'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'tokyo-adachi-002',
    name: '足立区中小企業支援',
    title: '足立区中小企業設備投資支援補助金',
    description: '区内中小企業の設備投資を支援します。',
    target_area: ['東京都', '足立区'],
    industry: ['製造業', '卸売業、小売業'],
    max_amount: 2000000,
    subsidy_rate: '1/2',
    use_purpose: '設備整備・IT導入をしたい',
    is_active: true,
  },
];

// 葛飾区
const KATSUSHIKA_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'tokyo-katsushika-001',
    name: '葛飾区創業支援',
    title: '葛飾区創業支援補助金',
    description: '葛飾区内での創業を支援。創業経費を補助します。',
    target_area: ['東京都', '葛飾区'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'tokyo-katsushika-002',
    name: '葛飾区ものづくり支援',
    title: '葛飾区ものづくり産業振興補助金',
    description: '区内ものづくり企業を支援。おもちゃ・玩具産業等を支援します。',
    target_area: ['東京都', '葛飾区'],
    industry: ['製造業'],
    max_amount: 2000000,
    subsidy_rate: '1/2',
    use_purpose: '研究開発・実証事業を行いたい',
    is_active: true,
  },
];

// 江戸川区
const EDOGAWA_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'tokyo-edogawa-001',
    name: '江戸川区創業支援',
    title: '江戸川区創業支援補助金',
    description: '江戸川区内での創業を支援。創業経費を補助します。',
    target_area: ['東京都', '江戸川区'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'tokyo-edogawa-002',
    name: '江戸川区中小企業支援',
    title: '江戸川区中小企業振興補助金',
    description: '区内中小企業の事業拡大を支援します。',
    target_area: ['東京都', '江戸川区'],
    industry: ['製造業', '卸売業、小売業'],
    max_amount: 2000000,
    subsidy_rate: '1/2',
    use_purpose: '設備整備・IT導入をしたい',
    is_active: true,
  },
];

// ========================================
// 多摩地域26市
// ========================================

// 八王子市
const HACHIOJI_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'tokyo-hachioji-001',
    name: '八王子市創業支援',
    title: '八王子市創業支援補助金',
    description: '八王子市内での創業を支援。サイバーシルクロード八王子と連携し、創業経費を補助します。',
    target_area: ['東京都', '八王子市'],
    industry: ['全業種'],
    max_amount: 1500000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'tokyo-hachioji-002',
    name: '八王子市中小企業支援',
    title: '八王子市中小企業経営革新支援補助金',
    description: '経営革新に取り組む市内中小企業を支援します。',
    target_area: ['東京都', '八王子市'],
    industry: ['製造業', '情報通信業'],
    max_amount: 3000000,
    subsidy_rate: '1/2',
    use_purpose: '研究開発・実証事業を行いたい',
    is_active: true,
  },
];

// 立川市
const TACHIKAWA_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'tokyo-tachikawa-001',
    name: '立川市創業支援',
    title: '立川市創業支援補助金',
    description: '立川市内での創業を支援。創業経費を補助します。',
    target_area: ['東京都', '立川市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
];

// 武蔵野市
const MUSASHINO_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'tokyo-musashino-001',
    name: '武蔵野市創業支援',
    title: '武蔵野市創業支援補助金',
    description: '武蔵野市内での創業を支援。吉祥寺エリア等での創業経費を補助します。',
    target_area: ['東京都', '武蔵野市'],
    industry: ['全業種'],
    max_amount: 1500000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'tokyo-musashino-002',
    name: '武蔵野市商店街支援',
    title: '武蔵野市商店街振興補助金',
    description: '市内商店街の振興を支援します。',
    target_area: ['東京都', '武蔵野市'],
    industry: ['卸売業、小売業'],
    max_amount: 2000000,
    subsidy_rate: '2/3',
    use_purpose: '販路拡大・海外展開をしたい',
    is_active: true,
  },
];

// 三鷹市
const MITAKA_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'tokyo-mitaka-001',
    name: '三鷹市創業支援',
    title: '三鷹市創業支援補助金',
    description: '三鷹市内での創業を支援。三鷹ネットワーク大学と連携し、創業経費を補助します。',
    target_area: ['東京都', '三鷹市'],
    industry: ['全業種'],
    max_amount: 1500000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'tokyo-mitaka-002',
    name: '三鷹市SOHO支援',
    title: '三鷹市SOHO・小規模事業者支援補助金',
    description: 'SOHO・小規模事業者の事業活動を支援します。',
    target_area: ['東京都', '三鷹市'],
    industry: ['情報通信業', 'サービス業(他に分類されないもの)'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '設備整備・IT導入をしたい',
    is_active: true,
  },
];

// 青梅市
const OME_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'tokyo-ome-001',
    name: '青梅市創業支援',
    title: '青梅市創業支援補助金',
    description: '青梅市内での創業を支援。創業経費を補助します。',
    target_area: ['東京都', '青梅市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
];

// 府中市
const FUCHU_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'tokyo-fuchu-001',
    name: '府中市創業支援',
    title: '府中市創業支援補助金',
    description: '府中市内での創業を支援。創業経費を補助します。',
    target_area: ['東京都', '府中市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'tokyo-fuchu-002',
    name: '府中市中小企業支援',
    title: '府中市中小企業振興補助金',
    description: '市内中小企業の事業拡大を支援します。',
    target_area: ['東京都', '府中市'],
    industry: ['製造業', '卸売業、小売業'],
    max_amount: 2000000,
    subsidy_rate: '1/2',
    use_purpose: '設備整備・IT導入をしたい',
    is_active: true,
  },
];

// 調布市
const CHOFU_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'tokyo-chofu-001',
    name: '調布市創業支援',
    title: '調布市創業支援補助金',
    description: '調布市内での創業を支援。創業経費を補助します。',
    target_area: ['東京都', '調布市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'tokyo-chofu-002',
    name: '調布市映画産業支援',
    title: '調布市映像産業振興補助金',
    description: '映像制作会社の事業を支援。映画のまち調布として映像産業を支援します。',
    target_area: ['東京都', '調布市'],
    industry: ['情報通信業', '生活関連サービス業、娯楽業'],
    max_amount: 2000000,
    subsidy_rate: '1/2',
    use_purpose: 'スポーツ・文化支援がほしい',
    is_active: true,
  },
];

// 町田市
const MACHIDA_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'tokyo-machida-001',
    name: '町田市創業支援',
    title: '町田市創業支援補助金',
    description: '町田市内での創業を支援。創業経費を補助します。',
    target_area: ['東京都', '町田市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'tokyo-machida-002',
    name: '町田市商業振興支援',
    title: '町田市商業活性化支援補助金',
    description: '市内商業の活性化を支援します。',
    target_area: ['東京都', '町田市'],
    industry: ['卸売業、小売業'],
    max_amount: 2000000,
    subsidy_rate: '1/2',
    use_purpose: '販路拡大・海外展開をしたい',
    is_active: true,
  },
];

// 小金井市
const KOGANEI_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'tokyo-koganei-001',
    name: '小金井市創業支援',
    title: '小金井市創業支援補助金',
    description: '小金井市内での創業を支援。創業経費を補助します。',
    target_area: ['東京都', '小金井市'],
    industry: ['全業種'],
    max_amount: 500000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
];

// 小平市
const KODAIRA_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'tokyo-kodaira-001',
    name: '小平市創業支援',
    title: '小平市創業支援補助金',
    description: '小平市内での創業を支援。創業経費を補助します。',
    target_area: ['東京都', '小平市'],
    industry: ['全業種'],
    max_amount: 500000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
];

// 日野市
const HINO_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'tokyo-hino-001',
    name: '日野市創業支援',
    title: '日野市創業支援補助金',
    description: '日野市内での創業を支援。創業経費を補助します。',
    target_area: ['東京都', '日野市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
];

// 東村山市
const HIGASHIMURAYAMA_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'tokyo-higashimurayama-001',
    name: '東村山市創業支援',
    title: '東村山市創業支援補助金',
    description: '東村山市内での創業を支援。創業経費を補助します。',
    target_area: ['東京都', '東村山市'],
    industry: ['全業種'],
    max_amount: 500000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
];

// 国分寺市
const KOKUBUNJI_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'tokyo-kokubunji-001',
    name: '国分寺市創業支援',
    title: '国分寺市創業支援補助金',
    description: '国分寺市内での創業を支援。創業経費を補助します。',
    target_area: ['東京都', '国分寺市'],
    industry: ['全業種'],
    max_amount: 500000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
];

// 国立市
const KUNITACHI_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'tokyo-kunitachi-001',
    name: '国立市創業支援',
    title: '国立市創業支援補助金',
    description: '国立市内での創業を支援。創業経費を補助します。',
    target_area: ['東京都', '国立市'],
    industry: ['全業種'],
    max_amount: 500000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
];

// 西東京市
const NISHITOKYO_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'tokyo-nishitokyo-001',
    name: '西東京市創業支援',
    title: '西東京市創業支援補助金',
    description: '西東京市内での創業を支援。創業経費を補助します。',
    target_area: ['東京都', '西東京市'],
    industry: ['全業種'],
    max_amount: 500000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
];

// 多摩市
const TAMA_CITY_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'tokyo-tama-001',
    name: '多摩市創業支援',
    title: '多摩市創業支援補助金',
    description: '多摩市内での創業を支援。多摩ニュータウンエリアでの創業経費を補助します。',
    target_area: ['東京都', '多摩市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
];

// 稲城市
const INAGI_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'tokyo-inagi-001',
    name: '稲城市創業支援',
    title: '稲城市創業支援補助金',
    description: '稲城市内での創業を支援。創業経費を補助します。',
    target_area: ['東京都', '稲城市'],
    industry: ['全業種'],
    max_amount: 500000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
];

// 昭島市
const AKISHIMA_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'tokyo-akishima-001',
    name: '昭島市創業支援',
    title: '昭島市創業支援補助金',
    description: '昭島市内での創業を支援。創業経費を補助します。',
    target_area: ['東京都', '昭島市'],
    industry: ['全業種'],
    max_amount: 500000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
];

// 福生市
const FUSSA_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'tokyo-fussa-001',
    name: '福生市創業支援',
    title: '福生市創業支援補助金',
    description: '福生市内での創業を支援。創業経費を補助します。',
    target_area: ['東京都', '福生市'],
    industry: ['全業種'],
    max_amount: 500000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
];

// 狛江市
const KOMAE_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'tokyo-komae-001',
    name: '狛江市創業支援',
    title: '狛江市創業支援補助金',
    description: '狛江市内での創業を支援。創業経費を補助します。',
    target_area: ['東京都', '狛江市'],
    industry: ['全業種'],
    max_amount: 300000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
];

// 東大和市
const HIGASHIYAMATO_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'tokyo-higashiyamato-001',
    name: '東大和市創業支援',
    title: '東大和市創業支援補助金',
    description: '東大和市内での創業を支援。創業経費を補助します。',
    target_area: ['東京都', '東大和市'],
    industry: ['全業種'],
    max_amount: 500000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
];

// 清瀬市
const KIYOSE_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'tokyo-kiyose-001',
    name: '清瀬市創業支援',
    title: '清瀬市創業支援補助金',
    description: '清瀬市内での創業を支援。創業経費を補助します。',
    target_area: ['東京都', '清瀬市'],
    industry: ['全業種'],
    max_amount: 300000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
];

// 東久留米市
const HIGASHIKURUME_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'tokyo-higashikurume-001',
    name: '東久留米市創業支援',
    title: '東久留米市創業支援補助金',
    description: '東久留米市内での創業を支援。創業経費を補助します。',
    target_area: ['東京都', '東久留米市'],
    industry: ['全業種'],
    max_amount: 300000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
];

// 武蔵村山市
const MUSASHIMURAYAMA_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'tokyo-musashimurayama-001',
    name: '武蔵村山市創業支援',
    title: '武蔵村山市創業支援補助金',
    description: '武蔵村山市内での創業を支援。創業経費を補助します。',
    target_area: ['東京都', '武蔵村山市'],
    industry: ['全業種'],
    max_amount: 300000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
];

// 羽村市
const HAMURA_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'tokyo-hamura-001',
    name: '羽村市創業支援',
    title: '羽村市創業支援補助金',
    description: '羽村市内での創業を支援。創業経費を補助します。',
    target_area: ['東京都', '羽村市'],
    industry: ['全業種'],
    max_amount: 500000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
];

// あきる野市
const AKIRUNO_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'tokyo-akiruno-001',
    name: 'あきる野市創業支援',
    title: 'あきる野市創業支援補助金',
    description: 'あきる野市内での創業を支援。創業経費を補助します。',
    target_area: ['東京都', 'あきる野市'],
    industry: ['全業種'],
    max_amount: 500000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
];

// ========================================
// 東京都商工会関連
// ========================================
const TOKYO_SHOKOKAI_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'tokyo-shokokai-001',
    name: '東京都商工会連合会支援',
    title: '東京都商工会小規模事業者持続化支援事業',
    description: '東京都内の小規模事業者の販路開拓・生産性向上を支援。商工会と連携して経営相談から補助金申請までサポートします。',
    target_area: ['東京都'],
    industry: ['全業種'],
    max_amount: 500000,
    subsidy_rate: '2/3',
    use_purpose: '販路拡大・海外展開をしたい',
    is_active: true,
  },
  {
    jgrants_id: 'tokyo-shokokai-002',
    name: '多摩地域商工会支援',
    title: '多摩地域商工会創業支援事業補助金',
    description: '多摩地域での創業を支援。各市町村の商工会が創業相談から事業開始までをサポートします。',
    target_area: ['東京都'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
];

// 全補助金を統合
const ALL_SUBSIDIES = [
  // 23区
  ...CHIYODA_SUBSIDIES,
  ...CHUO_SUBSIDIES,
  ...MINATO_SUBSIDIES,
  ...SHINJUKU_SUBSIDIES,
  ...BUNKYO_SUBSIDIES,
  ...TAITO_SUBSIDIES,
  ...SUMIDA_SUBSIDIES,
  ...KOTO_SUBSIDIES,
  ...SHINAGAWA_SUBSIDIES,
  ...MEGURO_SUBSIDIES,
  ...OTA_SUBSIDIES,
  ...SETAGAYA_SUBSIDIES,
  ...SHIBUYA_SUBSIDIES,
  ...NAKANO_SUBSIDIES,
  ...SUGINAMI_SUBSIDIES,
  ...TOSHIMA_SUBSIDIES,
  ...KITA_SUBSIDIES,
  ...ARAKAWA_SUBSIDIES,
  ...ITABASHI_SUBSIDIES,
  ...NERIMA_SUBSIDIES,
  ...ADACHI_SUBSIDIES,
  ...KATSUSHIKA_SUBSIDIES,
  ...EDOGAWA_SUBSIDIES,
  // 多摩26市
  ...HACHIOJI_SUBSIDIES,
  ...TACHIKAWA_SUBSIDIES,
  ...MUSASHINO_SUBSIDIES,
  ...MITAKA_SUBSIDIES,
  ...OME_SUBSIDIES,
  ...FUCHU_SUBSIDIES,
  ...CHOFU_SUBSIDIES,
  ...MACHIDA_SUBSIDIES,
  ...KOGANEI_SUBSIDIES,
  ...KODAIRA_SUBSIDIES,
  ...HINO_SUBSIDIES,
  ...HIGASHIMURAYAMA_SUBSIDIES,
  ...KOKUBUNJI_SUBSIDIES,
  ...KUNITACHI_SUBSIDIES,
  ...NISHITOKYO_SUBSIDIES,
  ...TAMA_CITY_SUBSIDIES,
  ...INAGI_SUBSIDIES,
  ...AKISHIMA_SUBSIDIES,
  ...FUSSA_SUBSIDIES,
  ...KOMAE_SUBSIDIES,
  ...HIGASHIYAMATO_SUBSIDIES,
  ...KIYOSE_SUBSIDIES,
  ...HIGASHIKURUME_SUBSIDIES,
  ...MUSASHIMURAYAMA_SUBSIDIES,
  ...HAMURA_SUBSIDIES,
  ...AKIRUNO_SUBSIDIES,
  // 商工会
  ...TOKYO_SHOKOKAI_SUBSIDIES,
];

async function main() {
  console.log('='.repeat(60));
  console.log('東京都内市区町村 補助金データ追加');
  console.log('実行日時:', new Date().toLocaleString('ja-JP'));
  console.log('='.repeat(60));

  console.log('\n追加予定:', ALL_SUBSIDIES.length + '件');
  console.log('  - 23特別区');
  console.log('  - 多摩地域26市');
  console.log('  - 東京都商工会関連');

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
