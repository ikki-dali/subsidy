/**
 * 追加補助金データ（第2弾）
 *
 * カテゴリ:
 * 1. 追加都道府県（残り30県程度）
 * 2. 災害復旧・BCP関連
 * 3. スタートアップ・創業支援
 * 4. 文化・スポーツ関連
 * 5. 総務省・デジタル庁関連
 *
 * 実行方法: npx tsx scripts/add-comprehensive-subsidies-2.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

type SubsidyInput = {
  id: string;
  title: string;
  description: string;
  max_amount: number;
  subsidy_rate?: string;
  target_area: string[];
  industry: string[];
  use_purpose: string;
  target_employees?: string;
  start_date: string;
  end_date: string;
};

// ========================================
// 1. 追加都道府県補助金
// ========================================
const ADDITIONAL_PREFECTURE_SUBSIDIES: SubsidyInput[] = [
  // 青森県
  {
    id: 'pref-aomori-001',
    title: '青森県ものづくり産業振興事業',
    description: '県内製造業の技術力向上、新製品開発を支援。',
    max_amount: 5000000,
    subsidy_rate: '1/2',
    target_area: ['青森県'],
    industry: ['製造業'],
    use_purpose: '研究開発・実証事業を行いたい',
    target_employees: '300名以下',
    start_date: '2025-04-01',
    end_date: '2025-12-31',
  },
  // 岩手県
  {
    id: 'pref-iwate-001',
    title: '岩手県中小企業経営革新支援事業',
    description: '県内中小企業の経営革新、新事業展開を支援。',
    max_amount: 3000000,
    subsidy_rate: '1/2',
    target_area: ['岩手県'],
    industry: ['製造業', '卸売業、小売業', 'サービス業(他に分類されないもの)'],
    use_purpose: '新たな事業を行いたい',
    target_employees: '300名以下',
    start_date: '2025-04-01',
    end_date: '2025-12-31',
  },
  // 秋田県
  {
    id: 'pref-akita-001',
    title: '秋田県産業振興機構経営革新支援事業',
    description: '県内企業の販路開拓、商品開発を支援。',
    max_amount: 2000000,
    subsidy_rate: '1/2',
    target_area: ['秋田県'],
    industry: ['製造業', '農業、林業', '卸売業、小売業'],
    use_purpose: '販路拡大・海外展開をしたい',
    target_employees: '300名以下',
    start_date: '2025-04-01',
    end_date: '2025-12-31',
  },
  // 山形県
  {
    id: 'pref-yamagata-001',
    title: '山形県ものづくり産業応援事業',
    description: '県内製造業の設備投資、生産性向上を支援。',
    max_amount: 10000000,
    subsidy_rate: '1/3',
    target_area: ['山形県'],
    industry: ['製造業'],
    use_purpose: '設備整備・IT導入をしたい',
    target_employees: '300名以下',
    start_date: '2025-04-01',
    end_date: '2025-12-31',
  },
  // 福島県
  {
    id: 'pref-fukushima-001',
    title: '福島県ふくしま産業復興投資促進特区事業',
    description: '被災地域における設備投資、雇用創出を支援。',
    max_amount: 50000000,
    subsidy_rate: '10〜15%',
    target_area: ['福島県'],
    industry: ['製造業', '卸売業、小売業', 'サービス業(他に分類されないもの)'],
    use_purpose: '設備整備・IT導入をしたい',
    target_employees: '従業員数の制約なし',
    start_date: '2025-04-01',
    end_date: '2026-03-31',
  },
  // 茨城県
  {
    id: 'pref-ibaraki-001',
    title: '茨城県中小企業技術革新支援事業',
    description: '県内中小企業の技術開発、製品開発を支援。',
    max_amount: 5000000,
    subsidy_rate: '1/2',
    target_area: ['茨城県'],
    industry: ['製造業', '情報通信業'],
    use_purpose: '研究開発・実証事業を行いたい',
    target_employees: '300名以下',
    start_date: '2025-04-01',
    end_date: '2025-12-31',
  },
  // 栃木県
  {
    id: 'pref-tochigi-001',
    title: '栃木県産業振興センター経営革新支援事業',
    description: '県内中小企業の経営革新、生産性向上を支援。',
    max_amount: 3000000,
    subsidy_rate: '1/2',
    target_area: ['栃木県'],
    industry: ['製造業', '卸売業、小売業', 'サービス業(他に分類されないもの)'],
    use_purpose: '新たな事業を行いたい',
    target_employees: '300名以下',
    start_date: '2025-04-01',
    end_date: '2025-12-31',
  },
  // 群馬県
  {
    id: 'pref-gunma-001',
    title: '群馬県中小企業設備投資促進補助金',
    description: '県内中小企業の生産性向上のための設備投資を支援。',
    max_amount: 10000000,
    subsidy_rate: '1/3',
    target_area: ['群馬県'],
    industry: ['製造業'],
    use_purpose: '設備整備・IT導入をしたい',
    target_employees: '300名以下',
    start_date: '2025-04-01',
    end_date: '2025-12-31',
  },
  // 新潟県
  {
    id: 'pref-niigata-001',
    title: '新潟県ものづくり産業支援事業',
    description: '県内製造業の技術開発、販路開拓を支援。',
    max_amount: 5000000,
    subsidy_rate: '1/2',
    target_area: ['新潟県'],
    industry: ['製造業'],
    use_purpose: '研究開発・実証事業を行いたい',
    target_employees: '300名以下',
    start_date: '2025-04-01',
    end_date: '2025-12-31',
  },
  // 富山県
  {
    id: 'pref-toyama-001',
    title: '富山県中小企業ビヨンドコロナ補助金',
    description: '県内中小企業の事業転換、新分野進出を支援。',
    max_amount: 5000000,
    subsidy_rate: '2/3',
    target_area: ['富山県'],
    industry: ['製造業', '卸売業、小売業', 'サービス業(他に分類されないもの)'],
    use_purpose: '新たな事業を行いたい',
    target_employees: '300名以下',
    start_date: '2025-04-01',
    end_date: '2025-12-31',
  },
  // 石川県
  {
    id: 'pref-ishikawa-001',
    title: '石川県中小企業経営高度化支援事業',
    description: '県内中小企業の経営革新、DX推進を支援。',
    max_amount: 3000000,
    subsidy_rate: '1/2',
    target_area: ['石川県'],
    industry: ['製造業', '卸売業、小売業', 'サービス業(他に分類されないもの)'],
    use_purpose: '設備整備・IT導入をしたい',
    target_employees: '300名以下',
    start_date: '2025-04-01',
    end_date: '2025-12-31',
  },
  // 福井県
  {
    id: 'pref-fukui-001',
    title: '福井県中小企業チャレンジ応援事業',
    description: '県内中小企業の新商品開発、販路開拓を支援。',
    max_amount: 2000000,
    subsidy_rate: '1/2',
    target_area: ['福井県'],
    industry: ['製造業', '卸売業、小売業'],
    use_purpose: '新たな事業を行いたい',
    target_employees: '300名以下',
    start_date: '2025-04-01',
    end_date: '2025-12-31',
  },
  // 山梨県
  {
    id: 'pref-yamanashi-001',
    title: '山梨県中小企業応援ファンド事業',
    description: '県内中小企業の新事業展開、経営革新を支援。',
    max_amount: 3000000,
    subsidy_rate: '1/2',
    target_area: ['山梨県'],
    industry: ['製造業', '卸売業、小売業', 'サービス業(他に分類されないもの)'],
    use_purpose: '新たな事業を行いたい',
    target_employees: '300名以下',
    start_date: '2025-04-01',
    end_date: '2025-12-31',
  },
  // 長野県
  {
    id: 'pref-nagano-001',
    title: '長野県中小企業振興センター支援事業',
    description: '県内中小企業の技術開発、販路拡大を支援。',
    max_amount: 5000000,
    subsidy_rate: '1/2',
    target_area: ['長野県'],
    industry: ['製造業', '情報通信業', '卸売業、小売業'],
    use_purpose: '研究開発・実証事業を行いたい',
    target_employees: '300名以下',
    start_date: '2025-04-01',
    end_date: '2025-12-31',
  },
  // 岐阜県
  {
    id: 'pref-gifu-001',
    title: '岐阜県中小企業総合支援事業',
    description: '県内中小企業の経営革新、設備投資を支援。',
    max_amount: 5000000,
    subsidy_rate: '1/2',
    target_area: ['岐阜県'],
    industry: ['製造業', '卸売業、小売業', 'サービス業(他に分類されないもの)'],
    use_purpose: '設備整備・IT導入をしたい',
    target_employees: '300名以下',
    start_date: '2025-04-01',
    end_date: '2025-12-31',
  },
  // 静岡県
  {
    id: 'pref-shizuoka-001',
    title: '静岡県先端産業創出プロジェクト',
    description: '次世代自動車、医療機器等の先端産業分野への参入を支援。',
    max_amount: 10000000,
    subsidy_rate: '1/2',
    target_area: ['静岡県'],
    industry: ['製造業', '情報通信業'],
    use_purpose: '研究開発・実証事業を行いたい',
    target_employees: '300名以下',
    start_date: '2025-04-01',
    end_date: '2025-12-31',
  },
  // 三重県
  {
    id: 'pref-mie-001',
    title: '三重県中小企業経営革新支援事業',
    description: '県内中小企業の新製品開発、販路開拓を支援。',
    max_amount: 3000000,
    subsidy_rate: '1/2',
    target_area: ['三重県'],
    industry: ['製造業', '卸売業、小売業', 'サービス業(他に分類されないもの)'],
    use_purpose: '新たな事業を行いたい',
    target_employees: '300名以下',
    start_date: '2025-04-01',
    end_date: '2025-12-31',
  },
  // 滋賀県
  {
    id: 'pref-shiga-001',
    title: '滋賀県中小企業新事業応援補助金',
    description: '県内中小企業の新事業展開、経営革新を支援。',
    max_amount: 3000000,
    subsidy_rate: '1/2',
    target_area: ['滋賀県'],
    industry: ['製造業', '卸売業、小売業', 'サービス業(他に分類されないもの)'],
    use_purpose: '新たな事業を行いたい',
    target_employees: '300名以下',
    start_date: '2025-04-01',
    end_date: '2025-12-31',
  },
  // 京都府
  {
    id: 'pref-kyoto-001',
    title: '京都府中小企業技術センター支援事業',
    description: '府内中小企業の技術開発、品質向上を支援。',
    max_amount: 5000000,
    subsidy_rate: '1/2',
    target_area: ['京都府'],
    industry: ['製造業'],
    use_purpose: '研究開発・実証事業を行いたい',
    target_employees: '300名以下',
    start_date: '2025-04-01',
    end_date: '2025-12-31',
  },
  {
    id: 'pref-kyoto-002',
    title: '京都府伝統産業振興事業',
    description: '京都の伝統産業の振興、後継者育成を支援。',
    max_amount: 3000000,
    subsidy_rate: '2/3',
    target_area: ['京都府'],
    industry: ['製造業'],
    use_purpose: '人材育成を行いたい',
    target_employees: '300名以下',
    start_date: '2025-04-01',
    end_date: '2025-12-31',
  },
  // 奈良県
  {
    id: 'pref-nara-001',
    title: '奈良県中小企業支援センター経営革新支援事業',
    description: '県内中小企業の経営革新、販路開拓を支援。',
    max_amount: 2000000,
    subsidy_rate: '1/2',
    target_area: ['奈良県'],
    industry: ['製造業', '卸売業、小売業', 'サービス業(他に分類されないもの)'],
    use_purpose: '新たな事業を行いたい',
    target_employees: '300名以下',
    start_date: '2025-04-01',
    end_date: '2025-12-31',
  },
  // 和歌山県
  {
    id: 'pref-wakayama-001',
    title: '和歌山県中小企業融資制度・利子補給事業',
    description: '県内中小企業の設備投資、運転資金を支援。',
    max_amount: 5000000,
    subsidy_rate: '利子補給',
    target_area: ['和歌山県'],
    industry: ['製造業', '卸売業、小売業', 'サービス業(他に分類されないもの)'],
    use_purpose: '資金繰りを改善したい',
    target_employees: '300名以下',
    start_date: '2025-04-01',
    end_date: '2026-03-31',
  },
  // 鳥取県
  {
    id: 'pref-tottori-001',
    title: '鳥取県中小企業調査研究開発支援事業',
    description: '県内中小企業の調査研究、技術開発を支援。',
    max_amount: 3000000,
    subsidy_rate: '1/2',
    target_area: ['鳥取県'],
    industry: ['製造業', '情報通信業'],
    use_purpose: '研究開発・実証事業を行いたい',
    target_employees: '300名以下',
    start_date: '2025-04-01',
    end_date: '2025-12-31',
  },
  // 島根県
  {
    id: 'pref-shimane-001',
    title: '島根県産業振興財団中小企業支援事業',
    description: '県内中小企業の経営革新、販路開拓を支援。',
    max_amount: 2000000,
    subsidy_rate: '1/2',
    target_area: ['島根県'],
    industry: ['製造業', '卸売業、小売業', 'サービス業(他に分類されないもの)'],
    use_purpose: '新たな事業を行いたい',
    target_employees: '300名以下',
    start_date: '2025-04-01',
    end_date: '2025-12-31',
  },
  // 岡山県
  {
    id: 'pref-okayama-001',
    title: '岡山県中小企業団体中央会支援事業',
    description: '県内中小企業組合等の事業活性化を支援。',
    max_amount: 3000000,
    subsidy_rate: '1/2',
    target_area: ['岡山県'],
    industry: ['製造業', '卸売業、小売業', 'サービス業(他に分類されないもの)'],
    use_purpose: '新たな事業を行いたい',
    target_employees: '300名以下',
    start_date: '2025-04-01',
    end_date: '2025-12-31',
  },
  // 山口県
  {
    id: 'pref-yamaguchi-001',
    title: '山口県中小企業技術革新支援事業',
    description: '県内中小企業の技術開発、生産性向上を支援。',
    max_amount: 5000000,
    subsidy_rate: '1/2',
    target_area: ['山口県'],
    industry: ['製造業'],
    use_purpose: '研究開発・実証事業を行いたい',
    target_employees: '300名以下',
    start_date: '2025-04-01',
    end_date: '2025-12-31',
  },
  // 徳島県
  {
    id: 'pref-tokushima-001',
    title: '徳島県中小企業振興事業',
    description: '県内中小企業の経営革新、事業承継を支援。',
    max_amount: 2000000,
    subsidy_rate: '1/2',
    target_area: ['徳島県'],
    industry: ['製造業', '卸売業、小売業', 'サービス業(他に分類されないもの)'],
    use_purpose: '新たな事業を行いたい',
    target_employees: '300名以下',
    start_date: '2025-04-01',
    end_date: '2025-12-31',
  },
  // 香川県
  {
    id: 'pref-kagawa-001',
    title: '香川県産業振興財団中小企業支援事業',
    description: '県内中小企業の新事業展開、販路開拓を支援。',
    max_amount: 3000000,
    subsidy_rate: '1/2',
    target_area: ['香川県'],
    industry: ['製造業', '卸売業、小売業', 'サービス業(他に分類されないもの)'],
    use_purpose: '新たな事業を行いたい',
    target_employees: '300名以下',
    start_date: '2025-04-01',
    end_date: '2025-12-31',
  },
  // 愛媛県
  {
    id: 'pref-ehime-001',
    title: '愛媛県中小企業応援ファンド事業',
    description: '県内中小企業の新商品開発、販路開拓を支援。',
    max_amount: 5000000,
    subsidy_rate: '1/2',
    target_area: ['愛媛県'],
    industry: ['製造業', '卸売業、小売業', 'サービス業(他に分類されないもの)'],
    use_purpose: '新たな事業を行いたい',
    target_employees: '300名以下',
    start_date: '2025-04-01',
    end_date: '2025-12-31',
  },
  // 高知県
  {
    id: 'pref-kochi-001',
    title: '高知県産業振興センター中小企業支援事業',
    description: '県内中小企業の経営革新、生産性向上を支援。',
    max_amount: 2000000,
    subsidy_rate: '1/2',
    target_area: ['高知県'],
    industry: ['製造業', '卸売業、小売業', 'サービス業(他に分類されないもの)'],
    use_purpose: '新たな事業を行いたい',
    target_employees: '300名以下',
    start_date: '2025-04-01',
    end_date: '2025-12-31',
  },
  // 佐賀県
  {
    id: 'pref-saga-001',
    title: '佐賀県中小企業経営革新支援事業',
    description: '県内中小企業の経営革新、新事業展開を支援。',
    max_amount: 2000000,
    subsidy_rate: '1/2',
    target_area: ['佐賀県'],
    industry: ['製造業', '卸売業、小売業', 'サービス業(他に分類されないもの)'],
    use_purpose: '新たな事業を行いたい',
    target_employees: '300名以下',
    start_date: '2025-04-01',
    end_date: '2025-12-31',
  },
  // 長崎県
  {
    id: 'pref-nagasaki-001',
    title: '長崎県産業振興財団中小企業支援事業',
    description: '県内中小企業の販路開拓、技術開発を支援。',
    max_amount: 3000000,
    subsidy_rate: '1/2',
    target_area: ['長崎県'],
    industry: ['製造業', '卸売業、小売業', 'サービス業(他に分類されないもの)'],
    use_purpose: '販路拡大・海外展開をしたい',
    target_employees: '300名以下',
    start_date: '2025-04-01',
    end_date: '2025-12-31',
  },
  // 熊本県
  {
    id: 'pref-kumamoto-001',
    title: '熊本県中小企業振興事業',
    description: '県内中小企業の経営革新、設備投資を支援。',
    max_amount: 5000000,
    subsidy_rate: '1/2',
    target_area: ['熊本県'],
    industry: ['製造業', '卸売業、小売業', 'サービス業(他に分類されないもの)'],
    use_purpose: '設備整備・IT導入をしたい',
    target_employees: '300名以下',
    start_date: '2025-04-01',
    end_date: '2025-12-31',
  },
  // 大分県
  {
    id: 'pref-oita-001',
    title: '大分県産業創造機構中小企業支援事業',
    description: '県内中小企業の新事業展開、販路開拓を支援。',
    max_amount: 3000000,
    subsidy_rate: '1/2',
    target_area: ['大分県'],
    industry: ['製造業', '卸売業、小売業', 'サービス業(他に分類されないもの)'],
    use_purpose: '新たな事業を行いたい',
    target_employees: '300名以下',
    start_date: '2025-04-01',
    end_date: '2025-12-31',
  },
  // 宮崎県
  {
    id: 'pref-miyazaki-001',
    title: '宮崎県産業振興機構中小企業支援事業',
    description: '県内中小企業の経営革新、販路開拓を支援。',
    max_amount: 2000000,
    subsidy_rate: '1/2',
    target_area: ['宮崎県'],
    industry: ['製造業', '卸売業、小売業', 'サービス業(他に分類されないもの)'],
    use_purpose: '新たな事業を行いたい',
    target_employees: '300名以下',
    start_date: '2025-04-01',
    end_date: '2025-12-31',
  },
  // 鹿児島県
  {
    id: 'pref-kagoshima-001',
    title: '鹿児島県中小企業支援センター経営革新支援事業',
    description: '県内中小企業の経営革新、新事業展開を支援。',
    max_amount: 3000000,
    subsidy_rate: '1/2',
    target_area: ['鹿児島県'],
    industry: ['製造業', '卸売業、小売業', 'サービス業(他に分類されないもの)'],
    use_purpose: '新たな事業を行いたい',
    target_employees: '300名以下',
    start_date: '2025-04-01',
    end_date: '2025-12-31',
  },
];

// ========================================
// 2. 災害復旧・BCP関連
// ========================================
const DISASTER_SUBSIDIES: SubsidyInput[] = [
  {
    id: 'disaster-001',
    title: 'なりわい再建支援補助金（令和6年能登半島地震）',
    description: '令和6年能登半島地震で被災した中小企業等の施設・設備の復旧を支援。',
    max_amount: 150000000,
    subsidy_rate: '3/4',
    target_area: ['石川県', '富山県', '新潟県'],
    industry: ['製造業', '卸売業、小売業', 'サービス業(他に分類されないもの)'],
    use_purpose: '災害(自然災害、感染症等)支援がほしい',
    target_employees: '従業員数の制約なし',
    start_date: '2025-04-01',
    end_date: '2026-03-31',
  },
  {
    id: 'disaster-002',
    title: '中小企業防災・減災投資促進税制',
    description: '事業継続力強化計画に基づく防災・減災設備投資に対する税制優遇。',
    max_amount: 20000000,
    subsidy_rate: '特別償却18%等',
    target_area: ['全国'],
    industry: ['製造業', '卸売業、小売業', 'サービス業(他に分類されないもの)'],
    use_purpose: '安全・防災対策支援がほしい',
    target_employees: '300名以下',
    start_date: '2025-04-01',
    end_date: '2026-03-31',
  },
  {
    id: 'disaster-003',
    title: '中小企業BCP策定支援事業',
    description: '事業継続計画（BCP）の策定、見直しを支援。専門家派遣等。',
    max_amount: 500000,
    subsidy_rate: '定額',
    target_area: ['全国'],
    industry: ['製造業', '卸売業、小売業', 'サービス業(他に分類されないもの)'],
    use_purpose: '安全・防災対策支援がほしい',
    target_employees: '300名以下',
    start_date: '2025-04-01',
    end_date: '2026-03-31',
  },
  {
    id: 'disaster-004',
    title: '被災中小企業施設・設備復旧支援事業',
    description: '自然災害等で被災した中小企業の施設・設備復旧を支援。',
    max_amount: 30000000,
    subsidy_rate: '1/2〜2/3',
    target_area: ['全国'],
    industry: ['製造業', '卸売業、小売業', 'サービス業(他に分類されないもの)'],
    use_purpose: '災害(自然災害、感染症等)支援がほしい',
    target_employees: '300名以下',
    start_date: '2025-04-01',
    end_date: '2026-03-31',
  },
];

// ========================================
// 3. スタートアップ・創業支援
// ========================================
const STARTUP_SUBSIDIES: SubsidyInput[] = [
  {
    id: 'startup-001',
    title: 'スタートアップ創出促進保証制度',
    description: '創業5年未満のスタートアップへの信用保証を強化。無担保・無保証人で最大3,500万円。',
    max_amount: 35000000,
    subsidy_rate: '信用保証',
    target_area: ['全国'],
    industry: ['情報通信業', '製造業', 'サービス業(他に分類されないもの)'],
    use_purpose: '資金繰りを改善したい',
    target_employees: '50名以下',
    start_date: '2025-04-01',
    end_date: '2026-03-31',
  },
  {
    id: 'startup-002',
    title: 'J-Startup認定企業支援事業',
    description: 'J-Startup認定企業に対する海外展開、事業拡大支援。',
    max_amount: 50000000,
    subsidy_rate: '1/2〜定額',
    target_area: ['全国'],
    industry: ['情報通信業', '製造業', 'サービス業(他に分類されないもの)'],
    use_purpose: '販路拡大・海外展開をしたい',
    target_employees: '従業員数の制約なし',
    start_date: '2025-04-01',
    end_date: '2026-03-31',
  },
  {
    id: 'startup-003',
    title: 'ディープテックスタートアップ支援事業',
    description: '大学発ディープテックスタートアップの事業化を支援。',
    max_amount: 100000000,
    subsidy_rate: '2/3〜定額',
    target_area: ['全国'],
    industry: ['学術研究、専門・技術サービス業', '製造業', '情報通信業'],
    use_purpose: '研究開発・実証事業を行いたい',
    target_employees: '従業員数の制約なし',
    start_date: '2025-04-01',
    end_date: '2025-06-30',
  },
  {
    id: 'startup-004',
    title: '女性起業家支援事業',
    description: '女性による創業、起業を支援。創業計画策定、資金調達等。',
    max_amount: 2000000,
    subsidy_rate: '2/3',
    target_area: ['全国'],
    industry: ['製造業', '卸売業、小売業', 'サービス業(他に分類されないもの)'],
    use_purpose: '新たな事業を行いたい',
    target_employees: '50名以下',
    start_date: '2025-04-01',
    end_date: '2025-12-31',
  },
  {
    id: 'startup-005',
    title: 'ソーシャルビジネス支援事業',
    description: '社会課題解決を目指すソーシャルビジネスの創業・事業拡大を支援。',
    max_amount: 5000000,
    subsidy_rate: '2/3',
    target_area: ['全国'],
    industry: ['医療、福祉', '教育、学習支援業', 'サービス業(他に分類されないもの)'],
    use_purpose: '新たな事業を行いたい',
    target_employees: '従業員数の制約なし',
    start_date: '2025-04-01',
    end_date: '2025-12-31',
  },
];

// ========================================
// 4. 文化・スポーツ関連
// ========================================
const CULTURE_SUBSIDIES: SubsidyInput[] = [
  {
    id: 'culture-001',
    title: '文化芸術活動の継続支援事業',
    description: '文化芸術関係者の活動継続、感染症対策等を支援。',
    max_amount: 1500000,
    subsidy_rate: '定額',
    target_area: ['全国'],
    industry: ['生活関連サービス業、娯楽業', '教育、学習支援業'],
    use_purpose: 'スポーツ・文化支援がほしい',
    target_employees: '従業員数の制約なし',
    start_date: '2025-04-01',
    end_date: '2025-12-31',
  },
  {
    id: 'culture-002',
    title: 'スポーツ産業の成長促進事業',
    description: 'スポーツ関連ビジネスの創出、事業拡大を支援。',
    max_amount: 10000000,
    subsidy_rate: '1/2',
    target_area: ['全国'],
    industry: ['生活関連サービス業、娯楽業', '教育、学習支援業'],
    use_purpose: 'スポーツ・文化支援がほしい',
    target_employees: '従業員数の制約なし',
    start_date: '2025-04-01',
    end_date: '2025-12-31',
  },
  {
    id: 'culture-003',
    title: '地域文化財保存活用促進事業',
    description: '地域の文化財の保存、活用、観光資源化を支援。',
    max_amount: 10000000,
    subsidy_rate: '1/2',
    target_area: ['全国'],
    industry: ['生活関連サービス業、娯楽業', '宿泊業、飲食サービス業'],
    use_purpose: 'スポーツ・文化支援がほしい',
    target_employees: '従業員数の制約なし',
    start_date: '2025-04-01',
    end_date: '2025-12-31',
  },
];

// ========================================
// 5. 総務省・デジタル庁関連
// ========================================
const DIGITAL_SUBSIDIES: SubsidyInput[] = [
  {
    id: 'digital-001',
    title: 'デジタル田園都市国家構想交付金',
    description: '地方におけるデジタル実装、デジタル人材育成等を支援。',
    max_amount: 100000000,
    subsidy_rate: '1/2〜定額',
    target_area: ['全国'],
    industry: ['情報通信業', 'サービス業(他に分類されないもの)'],
    use_purpose: '設備整備・IT導入をしたい',
    target_employees: '従業員数の制約なし',
    start_date: '2025-04-01',
    end_date: '2026-03-31',
  },
  {
    id: 'digital-002',
    title: 'テレワーク導入支援事業',
    description: '中小企業等のテレワーク導入を支援。機器購入、システム構築等。',
    max_amount: 3000000,
    subsidy_rate: '1/2',
    target_area: ['全国'],
    industry: ['情報通信業', '製造業', '卸売業、小売業', 'サービス業(他に分類されないもの)'],
    use_purpose: '設備整備・IT導入をしたい',
    target_employees: '300名以下',
    start_date: '2025-04-01',
    end_date: '2025-12-31',
  },
  {
    id: 'digital-003',
    title: '地域IoT実装推進事業',
    description: '地域におけるIoT技術の実装、サービス開発を支援。',
    max_amount: 20000000,
    subsidy_rate: '1/2',
    target_area: ['全国'],
    industry: ['情報通信業', '製造業', 'サービス業(他に分類されないもの)'],
    use_purpose: '研究開発・実証事業を行いたい',
    target_employees: '従業員数の制約なし',
    start_date: '2025-04-01',
    end_date: '2025-12-31',
  },
  {
    id: 'digital-004',
    title: 'マイナンバーカード利活用促進事業',
    description: 'マイナンバーカードを活用したサービス開発、導入を支援。',
    max_amount: 5000000,
    subsidy_rate: '定額',
    target_area: ['全国'],
    industry: ['情報通信業', '医療、福祉', 'サービス業(他に分類されないもの)'],
    use_purpose: '設備整備・IT導入をしたい',
    target_employees: '従業員数の制約なし',
    start_date: '2025-04-01',
    end_date: '2025-12-31',
  },
  {
    id: 'digital-005',
    title: 'ローカル5G導入支援事業',
    description: '企業等のローカル5G導入を支援。',
    max_amount: 30000000,
    subsidy_rate: '1/2',
    target_area: ['全国'],
    industry: ['製造業', '運輸業、郵便業', '建設業'],
    use_purpose: '設備整備・IT導入をしたい',
    target_employees: '従業員数の制約なし',
    start_date: '2025-04-01',
    end_date: '2025-12-31',
  },
];

// ========================================
// メイン処理
// ========================================
async function main() {
  console.log('='.repeat(60));
  console.log('追加補助金データ（第2弾）');
  console.log('実行日時:', new Date().toLocaleString('ja-JP'));
  console.log('='.repeat(60));

  const allSubsidies = [
    ...ADDITIONAL_PREFECTURE_SUBSIDIES,
    ...DISASTER_SUBSIDIES,
    ...STARTUP_SUBSIDIES,
    ...CULTURE_SUBSIDIES,
    ...DIGITAL_SUBSIDIES,
  ];

  console.log(`\n追加予定: ${allSubsidies.length}件`);
  console.log(`  - 追加都道府県: ${ADDITIONAL_PREFECTURE_SUBSIDIES.length}件`);
  console.log(`  - 災害復旧・BCP: ${DISASTER_SUBSIDIES.length}件`);
  console.log(`  - スタートアップ: ${STARTUP_SUBSIDIES.length}件`);
  console.log(`  - 文化・スポーツ: ${CULTURE_SUBSIDIES.length}件`);
  console.log(`  - デジタル関連: ${DIGITAL_SUBSIDIES.length}件`);

  let successCount = 0;
  let errorCount = 0;

  for (const subsidy of allSubsidies) {
    const record = {
      jgrants_id: subsidy.id,
      name: subsidy.id,
      title: subsidy.title,
      description: subsidy.description,
      max_amount: subsidy.max_amount,
      subsidy_rate: subsidy.subsidy_rate || null,
      target_area: subsidy.target_area,
      industry: subsidy.industry,
      use_purpose: subsidy.use_purpose,
      target_number_of_employees: subsidy.target_employees || null,
      start_date: subsidy.start_date,
      end_date: subsidy.end_date,
      is_active: true,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('subsidies')
      .upsert(record, { onConflict: 'jgrants_id' });

    if (error) {
      console.error(`エラー: ${subsidy.title} - ${error.message}`);
      errorCount++;
    } else {
      successCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('追加完了');
  console.log(`  成功: ${successCount}件`);
  console.log(`  エラー: ${errorCount}件`);
  console.log('='.repeat(60));

  // 最終状態を確認
  const { count: total } = await supabase.from('subsidies').select('*', { count: 'exact', head: true });
  const { count: active } = await supabase.from('subsidies').select('*', { count: 'exact', head: true }).eq('is_active', true);
  const { count: noDesc } = await supabase.from('subsidies').select('*', { count: 'exact', head: true }).is('description', null);
  const { count: noAmount } = await supabase.from('subsidies').select('*', { count: 'exact', head: true }).is('max_amount', null);

  console.log('\n=== データベース最終状態 ===');
  console.log(`総件数: ${total}`);
  console.log(`募集中: ${active}件`);
  console.log(`概要あり: ${total! - noDesc!}件 (${Math.round((total! - noDesc!) / total! * 100)}%)`);
  console.log(`金額あり: ${total! - noAmount!}件 (${Math.round((total! - noAmount!) / total! * 100)}%)`);
}

main();
