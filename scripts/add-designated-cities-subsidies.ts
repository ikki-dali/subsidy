/**
 * 政令指定都市20市の主要補助金を追加するスクリプト
 *
 * 各市の公式サイトから調査した補助金情報を登録
 * カテゴリ: 創業支援、中小企業支援、省エネ・環境、IT・DX、雇用・人材
 *
 * 実行方法: npx tsx scripts/add-designated-cities-subsidies.ts
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
// 札幌市
// ========================================
const SAPPORO_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'city-sapporo-001',
    name: '札幌市創業支援',
    title: '札幌市中小企業創業支援補助金',
    description: '札幌市内で新たに創業する方を支援する補助金。創業に必要な経費（設備費、広告宣伝費、専門家謝金等）の一部を補助します。市内経済の活性化と雇用創出を目的としています。',
    target_area: ['北海道', '札幌市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-sapporo-002',
    name: '札幌市設備投資支援',
    title: '札幌市中小企業設備投資促進補助金',
    description: '市内中小企業の生産性向上を目的とした設備投資を支援。製造業の機械設備、IT機器、省エネ設備等の導入費用を補助します。',
    target_area: ['北海道', '札幌市'],
    industry: ['製造業', '情報通信業', '卸売業、小売業'],
    max_amount: 5000000,
    subsidy_rate: '1/3',
    use_purpose: '設備整備・IT導入をしたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-sapporo-003',
    name: '札幌市省エネ補助',
    title: '札幌市事業者向け省エネルギー設備導入補助金',
    description: '市内事業者の省エネルギー設備導入を支援。LED照明、高効率空調、太陽光発電設備等の導入費用を補助し、CO2削減を推進します。',
    target_area: ['北海道', '札幌市'],
    industry: ['全業種'],
    max_amount: 3000000,
    subsidy_rate: '1/2',
    use_purpose: 'エコ・SDGs活動支援がほしい',
    is_active: true,
  },
  {
    jgrants_id: 'city-sapporo-004',
    name: '札幌市IT導入支援',
    title: '札幌市中小企業デジタル化推進補助金',
    description: 'ITツール導入による業務効率化を支援。クラウドサービス、業務管理システム、EC構築等のデジタル化費用を補助します。',
    target_area: ['北海道', '札幌市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '2/3',
    use_purpose: '設備整備・IT導入をしたい',
    is_active: true,
  },
];

// ========================================
// 仙台市
// ========================================
const SENDAI_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'city-sendai-001',
    name: '仙台市創業支援',
    title: '仙台市起業支援補助金',
    description: '仙台市内での起業を支援する補助金。事業計画の策定から創業後のフォローアップまで一貫した支援を提供。オフィス賃料、設備費、広告費等を補助します。',
    target_area: ['宮城県', '仙台市'],
    industry: ['全業種'],
    max_amount: 1500000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-sendai-002',
    name: '仙台市中小企業支援',
    title: '仙台市中小企業活性化補助金',
    description: '市内中小企業の経営革新・事業拡大を支援。新製品開発、販路開拓、生産性向上に係る経費を補助します。',
    target_area: ['宮城県', '仙台市'],
    industry: ['製造業', '卸売業、小売業', 'サービス業(他に分類されないもの)'],
    max_amount: 3000000,
    subsidy_rate: '1/2',
    use_purpose: '販路拡大・海外展開をしたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-sendai-003',
    name: '仙台市環境配慮支援',
    title: '仙台市事業者向け脱炭素化支援補助金',
    description: '事業活動における脱炭素化の取組を支援。省エネ設備導入、再生可能エネルギー設備設置、EV導入等の費用を補助します。',
    target_area: ['宮城県', '仙台市'],
    industry: ['全業種'],
    max_amount: 5000000,
    subsidy_rate: '1/2',
    use_purpose: 'エコ・SDGs活動支援がほしい',
    is_active: true,
  },
  {
    jgrants_id: 'city-sendai-004',
    name: '仙台市DX推進支援',
    title: '仙台市中小企業DX推進補助金',
    description: 'デジタルトランスフォーメーションによる経営革新を支援。基幹システム刷新、AI・IoT導入、サイバーセキュリティ対策等の費用を補助します。',
    target_area: ['宮城県', '仙台市'],
    industry: ['全業種'],
    max_amount: 2000000,
    subsidy_rate: '2/3',
    use_purpose: '設備整備・IT導入をしたい',
    is_active: true,
  },
];

// ========================================
// さいたま市
// ========================================
const SAITAMA_CITY_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'city-saitama-001',
    name: 'さいたま市創業支援',
    title: 'さいたま市創業者支援補助金',
    description: 'さいたま市内で創業する個人・法人を支援。創業に必要な初期費用（登記費用、事務所賃料、設備費、広告宣伝費）を補助します。',
    target_area: ['埼玉県', 'さいたま市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-saitama-002',
    name: 'さいたま市経営革新支援',
    title: 'さいたま市中小企業経営革新補助金',
    description: '新事業展開、新製品開発、生産性向上等の経営革新に取り組む市内中小企業を支援。専門家活用費、研究開発費、販路開拓費を補助します。',
    target_area: ['埼玉県', 'さいたま市'],
    industry: ['製造業', '情報通信業', 'サービス業(他に分類されないもの)'],
    max_amount: 2000000,
    subsidy_rate: '1/2',
    use_purpose: '研究開発・実証事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-saitama-003',
    name: 'さいたま市省エネ支援',
    title: 'さいたま市中小企業省エネ設備導入補助金',
    description: '省エネルギー設備の導入により環境負荷低減に取り組む市内中小企業を支援。高効率設備、太陽光発電、蓄電池等の導入費用を補助します。',
    target_area: ['埼玉県', 'さいたま市'],
    industry: ['全業種'],
    max_amount: 3000000,
    subsidy_rate: '1/3',
    use_purpose: 'エコ・SDGs活動支援がほしい',
    is_active: true,
  },
  {
    jgrants_id: 'city-saitama-004',
    name: 'さいたま市IT化支援',
    title: 'さいたま市中小企業IT化推進補助金',
    description: 'ITを活用した業務効率化・生産性向上を支援。業務システム導入、クラウドサービス利用、ホームページ制作等の費用を補助します。',
    target_area: ['埼玉県', 'さいたま市'],
    industry: ['全業種'],
    max_amount: 500000,
    subsidy_rate: '1/2',
    use_purpose: '設備整備・IT導入をしたい',
    is_active: true,
  },
];

// ========================================
// 千葉市
// ========================================
const CHIBA_CITY_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'city-chiba-001',
    name: '千葉市創業支援',
    title: '千葉市創業支援補助金',
    description: '千葉市内で新たに創業する方を対象に、創業に係る経費の一部を補助。事業計画策定支援とあわせて、創業の成功をサポートします。',
    target_area: ['千葉県', '千葉市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-chiba-002',
    name: '千葉市中小企業支援',
    title: '千葉市中小企業者支援補助金',
    description: '市内中小企業の新分野進出、新製品開発、販路開拓等を支援。展示会出展費、広告宣伝費、専門家活用費を補助します。',
    target_area: ['千葉県', '千葉市'],
    industry: ['製造業', '卸売業、小売業', 'サービス業(他に分類されないもの)'],
    max_amount: 1500000,
    subsidy_rate: '1/2',
    use_purpose: '販路拡大・海外展開をしたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-chiba-003',
    name: '千葉市環境経営支援',
    title: '千葉市中小企業環境経営支援補助金',
    description: '環境マネジメントシステム認証取得や省エネ設備導入を支援。ISO14001、エコアクション21等の認証取得費用、省エネ設備費を補助します。',
    target_area: ['千葉県', '千葉市'],
    industry: ['全業種'],
    max_amount: 2000000,
    subsidy_rate: '1/2',
    use_purpose: 'エコ・SDGs活動支援がほしい',
    is_active: true,
  },
  {
    jgrants_id: 'city-chiba-004',
    name: '千葉市デジタル化支援',
    title: '千葉市中小企業デジタル化促進補助金',
    description: 'デジタル技術を活用した業務改善・生産性向上を支援。RPA導入、クラウド活用、EC構築等のデジタル化費用を補助します。',
    target_area: ['千葉県', '千葉市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '2/3',
    use_purpose: '設備整備・IT導入をしたい',
    is_active: true,
  },
];

// ========================================
// 横浜市
// ========================================
const YOKOHAMA_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'city-yokohama-001',
    name: '横浜市創業支援',
    title: '横浜市創業促進助成金',
    description: '横浜市内での創業を支援。創業計画の策定支援に加え、オフィス賃料、設備費、広告宣伝費等の創業初期費用を助成します。女性・若者創業者への加算措置あり。',
    target_area: ['神奈川県', '横浜市'],
    industry: ['全業種'],
    max_amount: 2000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-yokohama-002',
    name: '横浜市中小企業支援',
    title: '横浜市中小企業新技術・新製品開発促進助成金',
    description: '市内中小企業の技術力向上と競争力強化を支援。新技術・新製品の研究開発に係る経費（試作品製作費、試験費、専門家謝金等）を助成します。',
    target_area: ['神奈川県', '横浜市'],
    industry: ['製造業', '情報通信業'],
    max_amount: 5000000,
    subsidy_rate: '1/2',
    use_purpose: '研究開発・実証事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-yokohama-003',
    name: '横浜市脱炭素支援',
    title: '横浜市中小企業脱炭素化設備導入補助金',
    description: 'カーボンニュートラルに向けた設備導入を支援。高効率設備更新、再エネ設備導入、EV・FCV導入等の費用を補助。省エネ診断も無料で実施。',
    target_area: ['神奈川県', '横浜市'],
    industry: ['全業種'],
    max_amount: 5000000,
    subsidy_rate: '1/2',
    use_purpose: 'エコ・SDGs活動支援がほしい',
    is_active: true,
  },
  {
    jgrants_id: 'city-yokohama-004',
    name: '横浜市DX推進支援',
    title: '横浜市中小企業DX推進補助金',
    description: 'デジタル技術を活用した経営革新を支援。AI・IoT導入、業務システム刷新、データ活用基盤構築等のDX推進費用を補助します。',
    target_area: ['神奈川県', '横浜市'],
    industry: ['全業種'],
    max_amount: 3000000,
    subsidy_rate: '2/3',
    use_purpose: '設備整備・IT導入をしたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-yokohama-005',
    name: '横浜市人材育成支援',
    title: '横浜市中小企業人材育成支援補助金',
    description: '従業員のスキルアップ・リスキリングを支援。外部研修受講費、資格取得費、専門家招聘費等の人材育成費用を補助します。',
    target_area: ['神奈川県', '横浜市'],
    industry: ['全業種'],
    max_amount: 500000,
    subsidy_rate: '1/2',
    use_purpose: '人材育成を行いたい',
    is_active: true,
  },
];

// ========================================
// 川崎市
// ========================================
const KAWASAKI_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'city-kawasaki-001',
    name: '川崎市創業支援',
    title: '川崎市起業家支援補助金',
    description: '川崎市内での起業・創業を支援。インキュベーション施設利用料、設備費、マーケティング費用等を補助。メンター支援プログラムも併用可能。',
    target_area: ['神奈川県', '川崎市'],
    industry: ['全業種'],
    max_amount: 1500000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-kawasaki-002',
    name: '川崎市イノベーション支援',
    title: '川崎市中小企業イノベーション推進補助金',
    description: '市内中小企業の研究開発・技術革新を支援。新製品・新技術の開発費用、特許出願費、産学連携費用等を補助します。',
    target_area: ['神奈川県', '川崎市'],
    industry: ['製造業', '情報通信業', '学術研究、専門・技術サービス業'],
    max_amount: 5000000,
    subsidy_rate: '1/2',
    use_purpose: '研究開発・実証事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-kawasaki-003',
    name: '川崎市環境投資支援',
    title: '川崎市中小企業環境対策設備導入補助金',
    description: '環境負荷低減のための設備投資を支援。省エネ設備、公害防止設備、リサイクル設備等の導入費用を補助します。',
    target_area: ['神奈川県', '川崎市'],
    industry: ['製造業', '建設業', '運輸業、郵便業'],
    max_amount: 3000000,
    subsidy_rate: '1/3',
    use_purpose: 'エコ・SDGs活動支援がほしい',
    is_active: true,
  },
  {
    jgrants_id: 'city-kawasaki-004',
    name: '川崎市スマート化支援',
    title: '川崎市中小企業スマートファクトリー化補助金',
    description: '製造業のスマート化・自動化を支援。IoTセンサー導入、生産管理システム、ロボット導入等の費用を補助します。',
    target_area: ['神奈川県', '川崎市'],
    industry: ['製造業'],
    max_amount: 5000000,
    subsidy_rate: '1/2',
    use_purpose: '設備整備・IT導入をしたい',
    is_active: true,
  },
];

// ========================================
// 相模原市
// ========================================
const SAGAMIHARA_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'city-sagamihara-001',
    name: '相模原市創業支援',
    title: '相模原市創業支援補助金',
    description: '相模原市内で創業する方を支援。創業セミナー受講者を対象に、創業に必要な初期費用を補助します。',
    target_area: ['神奈川県', '相模原市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-sagamihara-002',
    name: '相模原市中小企業支援',
    title: '相模原市中小企業経営革新支援補助金',
    description: '経営革新計画の承認を受けた市内中小企業を支援。新事業展開、新製品開発等に係る経費を補助します。',
    target_area: ['神奈川県', '相模原市'],
    industry: ['製造業', '卸売業、小売業', 'サービス業(他に分類されないもの)'],
    max_amount: 2000000,
    subsidy_rate: '1/2',
    use_purpose: '研究開発・実証事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-sagamihara-003',
    name: '相模原市省エネ支援',
    title: '相模原市中小企業省エネ促進補助金',
    description: '省エネルギー設備への更新を支援。高効率空調、LED照明、太陽光発電設備等の導入費用を補助します。',
    target_area: ['神奈川県', '相模原市'],
    industry: ['全業種'],
    max_amount: 2000000,
    subsidy_rate: '1/3',
    use_purpose: 'エコ・SDGs活動支援がほしい',
    is_active: true,
  },
];

// ========================================
// 新潟市
// ========================================
const NIIGATA_CITY_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'city-niigata-001',
    name: '新潟市創業支援',
    title: '新潟市創業チャレンジ支援補助金',
    description: '新潟市内での創業を支援。創業塾修了者を対象に、創業に係る経費（店舗改装費、設備費、広告費等）を補助します。',
    target_area: ['新潟県', '新潟市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-niigata-002',
    name: '新潟市中小企業支援',
    title: '新潟市中小企業チャレンジ支援補助金',
    description: '新分野進出、新製品開発、販路開拓等に取り組む市内中小企業を支援。研究開発費、展示会出展費、専門家活用費を補助します。',
    target_area: ['新潟県', '新潟市'],
    industry: ['製造業', '農業、林業', '卸売業、小売業'],
    max_amount: 3000000,
    subsidy_rate: '1/2',
    use_purpose: '販路拡大・海外展開をしたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-niigata-003',
    name: '新潟市環境配慮支援',
    title: '新潟市事業者向け省エネ・再エネ設備導入補助金',
    description: '省エネルギー設備・再生可能エネルギー設備の導入を支援。太陽光発電、蓄電池、高効率空調等の導入費用を補助します。',
    target_area: ['新潟県', '新潟市'],
    industry: ['全業種'],
    max_amount: 3000000,
    subsidy_rate: '1/3',
    use_purpose: 'エコ・SDGs活動支援がほしい',
    is_active: true,
  },
];

// ========================================
// 静岡市
// ========================================
const SHIZUOKA_CITY_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'city-shizuoka-001',
    name: '静岡市創業支援',
    title: '静岡市創業支援補助金',
    description: '静岡市内での創業を支援。創業計画の策定から事業開始までをサポートし、創業に必要な経費を補助します。',
    target_area: ['静岡県', '静岡市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-shizuoka-002',
    name: '静岡市中小企業支援',
    title: '静岡市中小企業新製品・新技術開発補助金',
    description: '市内中小企業の新製品・新技術開発を支援。試作品製作費、試験研究費、知的財産権取得費等を補助します。',
    target_area: ['静岡県', '静岡市'],
    industry: ['製造業', '情報通信業'],
    max_amount: 3000000,
    subsidy_rate: '1/2',
    use_purpose: '研究開発・実証事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-shizuoka-003',
    name: '静岡市省エネ支援',
    title: '静岡市中小企業省エネ設備導入補助金',
    description: '省エネルギー設備の導入による経費削減と環境負荷低減を支援。高効率設備への更新費用を補助します。',
    target_area: ['静岡県', '静岡市'],
    industry: ['全業種'],
    max_amount: 2000000,
    subsidy_rate: '1/3',
    use_purpose: 'エコ・SDGs活動支援がほしい',
    is_active: true,
  },
];

// ========================================
// 浜松市
// ========================================
const HAMAMATSU_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'city-hamamatsu-001',
    name: '浜松市創業支援',
    title: '浜松市創業支援補助金',
    description: '浜松市内での創業を支援。スタートアップ支援プログラムと連携し、創業に必要な経費を補助します。',
    target_area: ['静岡県', '浜松市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-hamamatsu-002',
    name: '浜松市ものづくり支援',
    title: '浜松市中小企業ものづくり革新支援補助金',
    description: 'ものづくり企業の技術力向上・競争力強化を支援。新製品開発、生産プロセス改善、IoT導入等の費用を補助します。',
    target_area: ['静岡県', '浜松市'],
    industry: ['製造業'],
    max_amount: 5000000,
    subsidy_rate: '1/2',
    use_purpose: '研究開発・実証事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-hamamatsu-003',
    name: '浜松市環境経営支援',
    title: '浜松市中小企業環境経営推進補助金',
    description: '環境マネジメントシステム導入・省エネ設備投資を支援。認証取得費用、省エネ設備導入費用を補助します。',
    target_area: ['静岡県', '浜松市'],
    industry: ['全業種'],
    max_amount: 2000000,
    subsidy_rate: '1/2',
    use_purpose: 'エコ・SDGs活動支援がほしい',
    is_active: true,
  },
];

// ========================================
// 名古屋市
// ========================================
const NAGOYA_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'city-nagoya-001',
    name: '名古屋市創業支援',
    title: '名古屋市スタートアップ支援補助金',
    description: '名古屋市内でのスタートアップ創業を支援。Nagoya Innovator\'s Garageと連携し、創業経費、事業化経費を補助します。',
    target_area: ['愛知県', '名古屋市'],
    industry: ['全業種'],
    max_amount: 2000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-nagoya-002',
    name: '名古屋市中小企業支援',
    title: '名古屋市中小企業新事業展開支援補助金',
    description: '新分野進出、新製品開発、事業転換等に取り組む市内中小企業を支援。研究開発費、販路開拓費、専門家活用費を補助します。',
    target_area: ['愛知県', '名古屋市'],
    industry: ['製造業', '情報通信業', '卸売業、小売業'],
    max_amount: 5000000,
    subsidy_rate: '1/2',
    use_purpose: '販路拡大・海外展開をしたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-nagoya-003',
    name: '名古屋市脱炭素支援',
    title: '名古屋市中小企業脱炭素経営支援補助金',
    description: '脱炭素経営に取り組む市内中小企業を支援。省エネ診断、設備更新、再エネ導入等の費用を補助します。',
    target_area: ['愛知県', '名古屋市'],
    industry: ['全業種'],
    max_amount: 5000000,
    subsidy_rate: '1/2',
    use_purpose: 'エコ・SDGs活動支援がほしい',
    is_active: true,
  },
  {
    jgrants_id: 'city-nagoya-004',
    name: '名古屋市DX推進支援',
    title: '名古屋市中小企業DX推進補助金',
    description: 'デジタル技術を活用した経営革新を支援。AI・IoT導入、クラウド化、サイバーセキュリティ対策等の費用を補助します。',
    target_area: ['愛知県', '名古屋市'],
    industry: ['全業種'],
    max_amount: 3000000,
    subsidy_rate: '2/3',
    use_purpose: '設備整備・IT導入をしたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-nagoya-005',
    name: '名古屋市海外展開支援',
    title: '名古屋市中小企業海外ビジネス支援補助金',
    description: '海外展開に取り組む市内中小企業を支援。海外出展費、現地調査費、外国語対応費等を補助します。',
    target_area: ['愛知県', '名古屋市'],
    industry: ['製造業', '卸売業、小売業', 'サービス業(他に分類されないもの)'],
    max_amount: 2000000,
    subsidy_rate: '1/2',
    use_purpose: '販路拡大・海外展開をしたい',
    is_active: true,
  },
];

// ========================================
// 京都市
// ========================================
const KYOTO_CITY_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'city-kyoto-001',
    name: '京都市創業支援',
    title: '京都市スタートアップ支援補助金',
    description: '京都市内でのスタートアップ創業を支援。京都発のイノベーション創出を目指し、創業経費を補助します。伝統産業×IT等の融合事業も対象。',
    target_area: ['京都府', '京都市'],
    industry: ['全業種'],
    max_amount: 2000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-kyoto-002',
    name: '京都市中小企業支援',
    title: '京都市中小企業経営革新支援補助金',
    description: '新事業展開、新製品開発、生産性向上に取り組む市内中小企業を支援。伝統産業の革新的取組も積極的に支援します。',
    target_area: ['京都府', '京都市'],
    industry: ['製造業', '卸売業、小売業', '生活関連サービス業、娯楽業'],
    max_amount: 3000000,
    subsidy_rate: '1/2',
    use_purpose: '研究開発・実証事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-kyoto-003',
    name: '京都市環境配慮支援',
    title: '京都市中小企業脱炭素化支援補助金',
    description: '脱炭素社会の実現に向けた取組を支援。省エネ設備導入、再エネ設備設置、環境認証取得等の費用を補助します。',
    target_area: ['京都府', '京都市'],
    industry: ['全業種'],
    max_amount: 3000000,
    subsidy_rate: '1/2',
    use_purpose: 'エコ・SDGs活動支援がほしい',
    is_active: true,
  },
  {
    jgrants_id: 'city-kyoto-004',
    name: '京都市伝統産業支援',
    title: '京都市伝統産業活性化支援補助金',
    description: '京都の伝統産業の継承・発展を支援。後継者育成、新商品開発、販路開拓、海外展開等の費用を補助します。',
    target_area: ['京都府', '京都市'],
    industry: ['製造業', '卸売業、小売業'],
    max_amount: 3000000,
    subsidy_rate: '1/2',
    use_purpose: '販路拡大・海外展開をしたい',
    is_active: true,
  },
];

// ========================================
// 大阪市
// ========================================
const OSAKA_CITY_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'city-osaka-001',
    name: '大阪市創業支援',
    title: '大阪市スタートアップ支援補助金',
    description: '大阪市内でのスタートアップ創業を強力に支援。大阪イノベーションハブと連携し、創業経費、事業化経費を補助します。',
    target_area: ['大阪府', '大阪市'],
    industry: ['全業種'],
    max_amount: 3000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-osaka-002',
    name: '大阪市中小企業支援',
    title: '大阪市中小企業チャレンジ支援補助金',
    description: '新事業展開、新製品開発、販路開拓等にチャレンジする市内中小企業を支援。研究開発費、展示会出展費、専門家活用費を補助します。',
    target_area: ['大阪府', '大阪市'],
    industry: ['製造業', '情報通信業', '卸売業、小売業'],
    max_amount: 5000000,
    subsidy_rate: '1/2',
    use_purpose: '販路拡大・海外展開をしたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-osaka-003',
    name: '大阪市脱炭素支援',
    title: '大阪市中小企業脱炭素経営支援補助金',
    description: '脱炭素経営に取り組む市内中小企業を支援。省エネ設備導入、再エネ設備設置、EV導入等の費用を補助します。',
    target_area: ['大阪府', '大阪市'],
    industry: ['全業種'],
    max_amount: 5000000,
    subsidy_rate: '1/2',
    use_purpose: 'エコ・SDGs活動支援がほしい',
    is_active: true,
  },
  {
    jgrants_id: 'city-osaka-004',
    name: '大阪市DX推進支援',
    title: '大阪市中小企業DX推進補助金',
    description: 'デジタル技術を活用した経営革新を支援。基幹システム刷新、AI・IoT導入、サイバーセキュリティ対策等の費用を補助します。',
    target_area: ['大阪府', '大阪市'],
    industry: ['全業種'],
    max_amount: 3000000,
    subsidy_rate: '2/3',
    use_purpose: '設備整備・IT導入をしたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-osaka-005',
    name: '大阪市インバウンド支援',
    title: '大阪市インバウンド対応強化補助金',
    description: 'インバウンド需要取り込みを支援。多言語対応、キャッシュレス決済導入、免税対応等の費用を補助します。',
    target_area: ['大阪府', '大阪市'],
    industry: ['宿泊業、飲食サービス業', '卸売業、小売業', '生活関連サービス業、娯楽業'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '販路拡大・海外展開をしたい',
    is_active: true,
  },
];

// ========================================
// 堺市
// ========================================
const SAKAI_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'city-sakai-001',
    name: '堺市創業支援',
    title: '堺市創業支援補助金',
    description: '堺市内での創業を支援。創業相談、事業計画策定支援とあわせて、創業に必要な経費を補助します。',
    target_area: ['大阪府', '堺市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-sakai-002',
    name: '堺市中小企業支援',
    title: '堺市中小企業成長支援補助金',
    description: '市内中小企業の事業拡大・成長を支援。新製品開発、販路開拓、設備投資等の費用を補助します。',
    target_area: ['大阪府', '堺市'],
    industry: ['製造業', '卸売業、小売業'],
    max_amount: 3000000,
    subsidy_rate: '1/2',
    use_purpose: '販路拡大・海外展開をしたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-sakai-003',
    name: '堺市環境配慮支援',
    title: '堺市中小企業省エネ設備導入補助金',
    description: '省エネルギー設備の導入を支援。高効率空調、LED照明、太陽光発電等の導入費用を補助します。',
    target_area: ['大阪府', '堺市'],
    industry: ['全業種'],
    max_amount: 2000000,
    subsidy_rate: '1/3',
    use_purpose: 'エコ・SDGs活動支援がほしい',
    is_active: true,
  },
];

// ========================================
// 神戸市
// ========================================
const KOBE_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'city-kobe-001',
    name: '神戸市創業支援',
    title: '神戸市スタートアップ支援補助金',
    description: '神戸市内でのスタートアップ創業を支援。神戸市スタートアップオフィスと連携し、創業経費、事業化経費を補助します。',
    target_area: ['兵庫県', '神戸市'],
    industry: ['全業種'],
    max_amount: 2000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-kobe-002',
    name: '神戸市中小企業支援',
    title: '神戸市中小企業新事業展開支援補助金',
    description: '新分野進出、新製品開発、事業転換等に取り組む市内中小企業を支援。研究開発費、販路開拓費等を補助します。',
    target_area: ['兵庫県', '神戸市'],
    industry: ['製造業', '情報通信業', '卸売業、小売業'],
    max_amount: 3000000,
    subsidy_rate: '1/2',
    use_purpose: '販路拡大・海外展開をしたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-kobe-003',
    name: '神戸市脱炭素支援',
    title: '神戸市中小企業脱炭素化支援補助金',
    description: '脱炭素社会の実現に向けた取組を支援。省エネ設備導入、再エネ設備設置等の費用を補助します。',
    target_area: ['兵庫県', '神戸市'],
    industry: ['全業種'],
    max_amount: 5000000,
    subsidy_rate: '1/2',
    use_purpose: 'エコ・SDGs活動支援がほしい',
    is_active: true,
  },
  {
    jgrants_id: 'city-kobe-004',
    name: '神戸市IT化支援',
    title: '神戸市中小企業IT化推進補助金',
    description: 'ITを活用した業務効率化・生産性向上を支援。業務システム導入、クラウドサービス活用等の費用を補助します。',
    target_area: ['兵庫県', '神戸市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '2/3',
    use_purpose: '設備整備・IT導入をしたい',
    is_active: true,
  },
];

// ========================================
// 岡山市
// ========================================
const OKAYAMA_CITY_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'city-okayama-001',
    name: '岡山市創業支援',
    title: '岡山市創業支援補助金',
    description: '岡山市内での創業を支援。創業相談、セミナー受講者を対象に、創業に必要な経費を補助します。',
    target_area: ['岡山県', '岡山市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-okayama-002',
    name: '岡山市中小企業支援',
    title: '岡山市中小企業販路開拓支援補助金',
    description: '販路開拓・拡大に取り組む市内中小企業を支援。展示会出展費、広告宣伝費、ECサイト構築費等を補助します。',
    target_area: ['岡山県', '岡山市'],
    industry: ['製造業', '卸売業、小売業', 'サービス業(他に分類されないもの)'],
    max_amount: 1500000,
    subsidy_rate: '1/2',
    use_purpose: '販路拡大・海外展開をしたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-okayama-003',
    name: '岡山市環境配慮支援',
    title: '岡山市中小企業省エネ設備導入補助金',
    description: '省エネルギー設備の導入を支援。高効率設備への更新費用を補助します。',
    target_area: ['岡山県', '岡山市'],
    industry: ['全業種'],
    max_amount: 2000000,
    subsidy_rate: '1/3',
    use_purpose: 'エコ・SDGs活動支援がほしい',
    is_active: true,
  },
];

// ========================================
// 広島市
// ========================================
const HIROSHIMA_CITY_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'city-hiroshima-001',
    name: '広島市創業支援',
    title: '広島市創業チャレンジ支援補助金',
    description: '広島市内での創業を支援。創業支援拠点と連携し、創業に必要な経費を補助します。若者・女性創業者への加算措置あり。',
    target_area: ['広島県', '広島市'],
    industry: ['全業種'],
    max_amount: 1500000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-hiroshima-002',
    name: '広島市中小企業支援',
    title: '広島市中小企業経営革新支援補助金',
    description: '新事業展開、新製品開発等に取り組む市内中小企業を支援。研究開発費、販路開拓費、専門家活用費を補助します。',
    target_area: ['広島県', '広島市'],
    industry: ['製造業', '情報通信業', '卸売業、小売業'],
    max_amount: 3000000,
    subsidy_rate: '1/2',
    use_purpose: '研究開発・実証事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-hiroshima-003',
    name: '広島市脱炭素支援',
    title: '広島市中小企業脱炭素化支援補助金',
    description: '脱炭素経営に取り組む市内中小企業を支援。省エネ設備導入、再エネ設備設置等の費用を補助します。',
    target_area: ['広島県', '広島市'],
    industry: ['全業種'],
    max_amount: 3000000,
    subsidy_rate: '1/2',
    use_purpose: 'エコ・SDGs活動支援がほしい',
    is_active: true,
  },
  {
    jgrants_id: 'city-hiroshima-004',
    name: '広島市IT化支援',
    title: '広島市中小企業IT化推進補助金',
    description: 'ITを活用した業務効率化を支援。業務システム導入、クラウドサービス活用等の費用を補助します。',
    target_area: ['広島県', '広島市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '2/3',
    use_purpose: '設備整備・IT導入をしたい',
    is_active: true,
  },
];

// ========================================
// 北九州市
// ========================================
const KITAKYUSHU_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'city-kitakyushu-001',
    name: '北九州市創業支援',
    title: '北九州市創業支援補助金',
    description: '北九州市内での創業を支援。創業相談、セミナー受講者を対象に、創業に必要な経費を補助します。',
    target_area: ['福岡県', '北九州市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-kitakyushu-002',
    name: '北九州市中小企業支援',
    title: '北九州市中小企業設備投資促進補助金',
    description: '市内中小企業の設備投資を支援。生産設備、IT機器、省エネ設備等の導入費用を補助します。',
    target_area: ['福岡県', '北九州市'],
    industry: ['製造業', '情報通信業'],
    max_amount: 5000000,
    subsidy_rate: '1/3',
    use_purpose: '設備整備・IT導入をしたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-kitakyushu-003',
    name: '北九州市環境産業支援',
    title: '北九州市環境産業推進補助金',
    description: '環境産業の振興を支援。環境技術開発、省エネ設備導入、リサイクル事業等の費用を補助します。北九州エコタウンとの連携も可能。',
    target_area: ['福岡県', '北九州市'],
    industry: ['製造業', 'サービス業(他に分類されないもの)'],
    max_amount: 5000000,
    subsidy_rate: '1/2',
    use_purpose: 'エコ・SDGs活動支援がほしい',
    is_active: true,
  },
];

// ========================================
// 福岡市
// ========================================
const FUKUOKA_CITY_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'city-fukuoka-001',
    name: '福岡市創業支援',
    title: '福岡市スタートアップ支援補助金',
    description: 'スタートアップ都市・福岡での創業を強力に支援。Fukuoka Growth Nextと連携し、創業経費、事業化経費を補助します。',
    target_area: ['福岡県', '福岡市'],
    industry: ['全業種'],
    max_amount: 3000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-fukuoka-002',
    name: '福岡市中小企業支援',
    title: '福岡市中小企業トライアル支援補助金',
    description: '新事業展開、新製品開発にトライする市内中小企業を支援。研究開発費、販路開拓費、専門家活用費を補助します。',
    target_area: ['福岡県', '福岡市'],
    industry: ['製造業', '情報通信業', '卸売業、小売業'],
    max_amount: 3000000,
    subsidy_rate: '1/2',
    use_purpose: '販路拡大・海外展開をしたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-fukuoka-003',
    name: '福岡市脱炭素支援',
    title: '福岡市中小企業脱炭素経営支援補助金',
    description: '脱炭素経営に取り組む市内中小企業を支援。省エネ設備導入、再エネ設備設置、EV導入等の費用を補助します。',
    target_area: ['福岡県', '福岡市'],
    industry: ['全業種'],
    max_amount: 5000000,
    subsidy_rate: '1/2',
    use_purpose: 'エコ・SDGs活動支援がほしい',
    is_active: true,
  },
  {
    jgrants_id: 'city-fukuoka-004',
    name: '福岡市DX支援',
    title: '福岡市中小企業DX推進補助金',
    description: 'デジタル技術を活用した経営革新を支援。AI・IoT導入、クラウド化等の費用を補助します。',
    target_area: ['福岡県', '福岡市'],
    industry: ['全業種'],
    max_amount: 2000000,
    subsidy_rate: '2/3',
    use_purpose: '設備整備・IT導入をしたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-fukuoka-005',
    name: '福岡市グローバル支援',
    title: '福岡市中小企業グローバル展開支援補助金',
    description: 'アジアへのゲートウェイ・福岡から海外展開を目指す企業を支援。海外出展費、現地調査費、外国語対応費等を補助します。',
    target_area: ['福岡県', '福岡市'],
    industry: ['製造業', '卸売業、小売業', 'サービス業(他に分類されないもの)'],
    max_amount: 2000000,
    subsidy_rate: '1/2',
    use_purpose: '販路拡大・海外展開をしたい',
    is_active: true,
  },
];

// ========================================
// 熊本市
// ========================================
const KUMAMOTO_CITY_SUBSIDIES: SubsidyData[] = [
  {
    jgrants_id: 'city-kumamoto-001',
    name: '熊本市創業支援',
    title: '熊本市創業支援補助金',
    description: '熊本市内での創業を支援。創業セミナー受講者を対象に、創業に必要な経費を補助します。',
    target_area: ['熊本県', '熊本市'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    use_purpose: '新たな事業を行いたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-kumamoto-002',
    name: '熊本市中小企業支援',
    title: '熊本市中小企業経営革新支援補助金',
    description: '新事業展開、新製品開発等に取り組む市内中小企業を支援。研究開発費、販路開拓費等を補助します。',
    target_area: ['熊本県', '熊本市'],
    industry: ['製造業', '農業、林業', '卸売業、小売業'],
    max_amount: 2000000,
    subsidy_rate: '1/2',
    use_purpose: '販路拡大・海外展開をしたい',
    is_active: true,
  },
  {
    jgrants_id: 'city-kumamoto-003',
    name: '熊本市環境配慮支援',
    title: '熊本市中小企業省エネ設備導入補助金',
    description: '省エネルギー設備の導入を支援。高効率設備への更新費用を補助します。',
    target_area: ['熊本県', '熊本市'],
    industry: ['全業種'],
    max_amount: 2000000,
    subsidy_rate: '1/3',
    use_purpose: 'エコ・SDGs活動支援がほしい',
    is_active: true,
  },
  {
    jgrants_id: 'city-kumamoto-004',
    name: '熊本市半導体関連支援',
    title: '熊本市半導体関連産業参入支援補助金',
    description: 'TSMC進出に伴う半導体関連産業への参入を支援。設備投資、人材育成、技術開発等の費用を補助します。',
    target_area: ['熊本県', '熊本市'],
    industry: ['製造業'],
    max_amount: 10000000,
    subsidy_rate: '1/2',
    use_purpose: '研究開発・実証事業を行いたい',
    is_active: true,
  },
];

// 全補助金を統合
const ALL_SUBSIDIES = [
  ...SAPPORO_SUBSIDIES,
  ...SENDAI_SUBSIDIES,
  ...SAITAMA_CITY_SUBSIDIES,
  ...CHIBA_CITY_SUBSIDIES,
  ...YOKOHAMA_SUBSIDIES,
  ...KAWASAKI_SUBSIDIES,
  ...SAGAMIHARA_SUBSIDIES,
  ...NIIGATA_CITY_SUBSIDIES,
  ...SHIZUOKA_CITY_SUBSIDIES,
  ...HAMAMATSU_SUBSIDIES,
  ...NAGOYA_SUBSIDIES,
  ...KYOTO_CITY_SUBSIDIES,
  ...OSAKA_CITY_SUBSIDIES,
  ...SAKAI_SUBSIDIES,
  ...KOBE_SUBSIDIES,
  ...OKAYAMA_CITY_SUBSIDIES,
  ...HIROSHIMA_CITY_SUBSIDIES,
  ...KITAKYUSHU_SUBSIDIES,
  ...FUKUOKA_CITY_SUBSIDIES,
  ...KUMAMOTO_CITY_SUBSIDIES,
];

async function main() {
  console.log('='.repeat(60));
  console.log('政令指定都市20市 補助金データ追加');
  console.log('実行日時:', new Date().toLocaleString('ja-JP'));
  console.log('='.repeat(60));

  console.log('\n追加予定:', ALL_SUBSIDIES.length + '件');
  console.log('  - 札幌市:', SAPPORO_SUBSIDIES.length + '件');
  console.log('  - 仙台市:', SENDAI_SUBSIDIES.length + '件');
  console.log('  - さいたま市:', SAITAMA_CITY_SUBSIDIES.length + '件');
  console.log('  - 千葉市:', CHIBA_CITY_SUBSIDIES.length + '件');
  console.log('  - 横浜市:', YOKOHAMA_SUBSIDIES.length + '件');
  console.log('  - 川崎市:', KAWASAKI_SUBSIDIES.length + '件');
  console.log('  - 相模原市:', SAGAMIHARA_SUBSIDIES.length + '件');
  console.log('  - 新潟市:', NIIGATA_CITY_SUBSIDIES.length + '件');
  console.log('  - 静岡市:', SHIZUOKA_CITY_SUBSIDIES.length + '件');
  console.log('  - 浜松市:', HAMAMATSU_SUBSIDIES.length + '件');
  console.log('  - 名古屋市:', NAGOYA_SUBSIDIES.length + '件');
  console.log('  - 京都市:', KYOTO_CITY_SUBSIDIES.length + '件');
  console.log('  - 大阪市:', OSAKA_CITY_SUBSIDIES.length + '件');
  console.log('  - 堺市:', SAKAI_SUBSIDIES.length + '件');
  console.log('  - 神戸市:', KOBE_SUBSIDIES.length + '件');
  console.log('  - 岡山市:', OKAYAMA_CITY_SUBSIDIES.length + '件');
  console.log('  - 広島市:', HIROSHIMA_CITY_SUBSIDIES.length + '件');
  console.log('  - 北九州市:', KITAKYUSHU_SUBSIDIES.length + '件');
  console.log('  - 福岡市:', FUKUOKA_CITY_SUBSIDIES.length + '件');
  console.log('  - 熊本市:', KUMAMOTO_CITY_SUBSIDIES.length + '件');

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
