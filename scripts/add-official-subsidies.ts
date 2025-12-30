/**
 * 公式情報源から収集した主要補助金をデータベースに追加するスクリプト
 *
 * 実行方法: npx tsx scripts/add-official-subsidies.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

type SubsidyInput = {
  jgrants_id: string;
  name: string;
  title: string;
  description: string;
  max_amount: number | null;
  subsidy_rate: string | null;
  target_area: string[];
  industry: string[];
  start_date: string | null;
  end_date: string | null;
  front_url: string;
  is_active: boolean;
};

const officialSubsidies: SubsidyInput[] = [
  // ものづくり補助金
  {
    jgrants_id: 'official:mono-22',
    name: '全国中小企業団体中央会',
    title: 'ものづくり・商業・サービス生産性向上促進補助金（第22次公募）',
    description: '中小企業・小規模事業者が今後複数年にわたり相次いで直面する制度変更に対応するため、革新的サービス開発・試作品開発・生産プロセスの改善に必要な設備投資等を支援します。従業員数に応じて補助上限額が設定され、グローバル枠では最大4,000万円の補助が受けられます。大幅賃上げ特例を活用することで補助上限額がさらに引き上げられます。',
    max_amount: 40000000, // グローバル枠4,000万円
    subsidy_rate: '中小企業1/2、小規模企業者2/3',
    target_area: ['全国'],
    industry: ['製造業', '商業', 'サービス業', '全業種'],
    start_date: '2025-12-26',
    end_date: '2026-01-30',
    front_url: 'https://portal.monodukuri-hojo.jp/',
    is_active: true,
  },
  // IT導入補助金
  {
    jgrants_id: 'official:it-2025-normal',
    name: '中小機構',
    title: 'IT導入補助金2025（通常枠）',
    description: '中小企業・小規模事業者向けにITツール導入を支援する補助金制度です。業務効率化やDX推進のためのソフトウェア、クラウドサービス等の導入費用を補助します。2025年度は保守サポートやマニュアル作成などの導入関連費、IT活用の定着を促す導入後の活用支援費も補助対象に追加されました。',
    max_amount: 4500000, // 450万円
    subsidy_rate: '1/2（最低賃金近傍の事業者は2/3）',
    target_area: ['全国'],
    industry: ['全業種'],
    start_date: '2025-04-01',
    end_date: '2026-01-07',
    front_url: 'https://it-shien.smrj.go.jp/',
    is_active: true,
  },
  // IT導入補助金（インボイス枠）
  {
    jgrants_id: 'official:it-2025-invoice',
    name: '中小機構',
    title: 'IT導入補助金2025（インボイス枠）',
    description: 'インボイス制度対応のための会計ソフト、受発注ソフト、決済ソフト等の導入を支援します。インボイス対応類型と電子取引類型があり、安価なITツールでも申請可能です。',
    max_amount: 3500000, // 350万円
    subsidy_rate: '2/3〜4/5（小規模事業者）',
    target_area: ['全国'],
    industry: ['全業種'],
    start_date: '2025-04-01',
    end_date: '2026-01-07',
    front_url: 'https://it-shien.smrj.go.jp/',
    is_active: true,
  },
  // 小規模事業者持続化補助金
  {
    jgrants_id: 'official:jizokuka-18',
    name: '日本商工会議所',
    title: '小規模事業者持続化補助金（一般型・第18回）',
    description: '小規模事業者が販路開拓や生産性向上を目的として行う取り組みを支援する補助金です。新たな顧客獲得や売上向上を目指した広告宣伝、ECサイト構築、店舗改装、業務効率化のための設備導入などに活用できます。2025年度は「一般型」「創業型」「共同・協業型」「ビジネスコミュニティ型」の4つの支援類型があります。',
    max_amount: 2500000, // 250万円
    subsidy_rate: '2/3',
    target_area: ['全国'],
    industry: ['小売業', '飲食業', 'サービス業', '製造業', '全業種'],
    start_date: '2025-10-03',
    end_date: '2025-11-28',
    front_url: 'https://r6.jizokukahojokin.info/',
    is_active: false, // 締切済み
  },
  // 省力化投資補助金（カタログ注文型）
  {
    jgrants_id: 'official:shoryokuka-catalog',
    name: '中小機構',
    title: '中小企業省力化投資補助金（カタログ注文型）',
    description: '人手不足に悩む中小企業・小規模事業者等が、IoT・ロボット等の汎用製品を導入する経費を補助します。予めカタログに登録されている製品から選択して申請できます。大幅な賃上げを行う企業には補助金の上乗せがあり、最大1,500万円の補助を受けることが可能です。',
    max_amount: 15000000, // 1,500万円（賃上げ上乗せ時）
    subsidy_rate: '1/2',
    target_area: ['全国'],
    industry: ['全業種'],
    start_date: '2025-04-01',
    end_date: '2026-03-31',
    front_url: 'https://shoryokuka.smrj.go.jp/',
    is_active: true,
  },
  // 省力化投資補助金（一般型）
  {
    jgrants_id: 'official:shoryokuka-ippan-5',
    name: '中小機構',
    title: '中小企業省力化投資補助金（一般型・第5回）',
    description: '2025年から新設された補助金で、カタログに登録されていない設備も含め、幅広い省力化投資を支援します。補助上限額が最大1億円まで引き上げられ、大規模な設備投資にも対応可能です。1,500万円を超える部分は補助率1/3が適用されます。',
    max_amount: 100000000, // 1億円
    subsidy_rate: '1/2（1,500万円超は1/3）、小規模・再生事業者は2/3',
    target_area: ['全国'],
    industry: ['全業種'],
    start_date: '2026-02-01',
    end_date: '2026-02-28',
    front_url: 'https://shoryokuka.smrj.go.jp/ippan/',
    is_active: true,
  },
  // 新事業進出補助金
  {
    jgrants_id: 'official:shinjigyo-3',
    name: '中小企業庁',
    title: '中小企業新事業進出促進補助金（第3回）',
    description: '事業再構築補助金の後継として2025年度に新設された補助金です。中小企業・小規模事業者の成長につながる新事業進出・事業転換を重点的に支援します。付加価値額の年平均成長率4.0%以上、事業所内最低賃金が地域別最低賃金より30円以上高い水準であることが要件です。',
    max_amount: 90000000, // 9,000万円
    subsidy_rate: '1/2',
    target_area: ['全国'],
    industry: ['全業種'],
    start_date: '2026-01-01',
    end_date: '2026-03-26',
    front_url: 'https://jigyou-saikouchiku.go.jp/',
    is_active: true,
  },
  // 成長加速化補助金
  {
    jgrants_id: 'official:seichou-2',
    name: '中小企業庁',
    title: '成長加速化補助金（第2回）',
    description: '高い成長を目指す中小企業の設備投資を支援する補助金です。生産性向上や新分野展開に必要な設備投資等を補助します。',
    max_amount: 50000000, // 5,000万円（想定）
    subsidy_rate: '1/2',
    target_area: ['全国'],
    industry: ['全業種'],
    start_date: '2026-01-01',
    end_date: '2026-03-26',
    front_url: 'https://seisansei.smrj.go.jp/',
    is_active: true,
  },
  // 事業承継・M&A補助金
  {
    jgrants_id: 'official:jigyo-shoukei-14',
    name: '中小企業庁',
    title: '事業承継・M&A補助金（第14回）',
    description: '事業承継やM&Aを契機とした経営革新等への挑戦に要する費用を補助します。経営革新事業、専門家活用事業、廃業・再チャレンジ事業の3つの類型があります。',
    max_amount: 8000000, // 800万円
    subsidy_rate: '1/2〜2/3',
    target_area: ['全国'],
    industry: ['全業種'],
    start_date: '2026-01-01',
    end_date: '2026-03-31',
    front_url: 'https://jsh.go.jp/',
    is_active: true,
  },
  // キャリアアップ助成金（正社員化コース）
  {
    jgrants_id: 'official:career-up-seishain',
    name: '厚生労働省',
    title: 'キャリアアップ助成金（正社員化コース）',
    description: '有期雇用労働者、短時間労働者、派遣労働者などの非正規雇用労働者を正社員に転換した事業主に対して助成金を支給します。重点支援対象者（雇入れから3年以上継続就業者等）の場合は80万円、それ以外は40万円が支給されます。',
    max_amount: 800000, // 80万円
    subsidy_rate: null,
    target_area: ['全国'],
    industry: ['全業種'],
    start_date: '2025-04-01',
    end_date: '2026-03-31',
    front_url: 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/part_haken/jigyounushi/career.html',
    is_active: true,
  },
  // キャリアアップ助成金（賃金規定等改定コース）
  {
    jgrants_id: 'official:career-up-chingin',
    name: '厚生労働省',
    title: 'キャリアアップ助成金（賃金規定等改定コース）',
    description: '有期雇用労働者等の基本給の賃金規定等を増額改定し、昇給させた事業主に助成金を支給します。2025年度から賃金引き上げ率の区分が4段階に増え、6%以上の区分も新設されました。',
    max_amount: 65000, // 6.5万円/人
    subsidy_rate: null,
    target_area: ['全国'],
    industry: ['全業種'],
    start_date: '2025-04-01',
    end_date: '2026-03-31',
    front_url: 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/part_haken/jigyounushi/career.html',
    is_active: true,
  },
  // 新規就農者向け支援（経営開始資金）
  {
    jgrants_id: 'official:shinki-shunou-keiei',
    name: '農林水産省',
    title: '新規就農者育成総合対策（経営開始資金）',
    description: '新規就農者の経営開始を支援するための資金です。経営開始後3年間、月12.5万円（年間最大150万円、3年間で最大450万円）が交付されます。次世代を担う農業者となることについての強い意欲を有していることが要件です。',
    max_amount: 4500000, // 450万円（3年間）
    subsidy_rate: null,
    target_area: ['全国'],
    industry: ['農業'],
    start_date: '2025-04-01',
    end_date: '2026-03-31',
    front_url: 'https://www.maff.go.jp/j/new_farmer/n_syunou/roudou.html',
    is_active: true,
  },
  // 新規就農者向け支援（経営発展支援事業）
  {
    jgrants_id: 'official:shinki-shunou-hatten',
    name: '農林水産省',
    title: '新規就農者育成総合対策（経営発展支援事業）',
    description: '新規就農者が経営発展のために機械・施設等を導入する際の経費を支援します。補助上限額は1,000万円で、経営開始後に必要な農業機械や施設の導入費用を補助します。',
    max_amount: 10000000, // 1,000万円
    subsidy_rate: '1/2（国・都道府県）',
    target_area: ['全国'],
    industry: ['農業'],
    start_date: '2025-04-01',
    end_date: '2026-03-31',
    front_url: 'https://www.maff.go.jp/j/new_farmer/n_syunou/roudou.html',
    is_active: true,
  },
  // 強い農業づくり総合支援交付金
  {
    jgrants_id: 'official:tsuyoi-nougyo',
    name: '農林水産省',
    title: '強い農業づくり総合支援交付金',
    description: '食料システム構築に向け、生産から流通に至るまでの課題解決に向けた取り組みを支援します。産地基幹施設等の整備、卸売市場施設の整備、食肉等流通合理化等を支援します。',
    max_amount: 100000000, // 1億円（事業規模による）
    subsidy_rate: '1/2',
    target_area: ['全国'],
    industry: ['農業', '畜産業', '水産業'],
    start_date: '2025-04-01',
    end_date: '2026-03-31',
    front_url: 'https://www.maff.go.jp/j/seisan/suisin/tuyoi_nougyou/',
    is_active: true,
  },
  // 環境省関連補助金
  {
    jgrants_id: 'official:env-co2-sakugen',
    name: '環境省',
    title: '脱炭素化設備導入補助金（中小企業等向け）',
    description: '中小企業等の脱炭素化に向けた設備導入を支援します。高効率空調設備、LED照明、太陽光発電設備、蓄電池等の導入費用を補助します。省エネと再エネの導入により、CO2排出量の削減を目指す事業者が対象です。',
    max_amount: 30000000, // 3,000万円
    subsidy_rate: '1/3〜1/2',
    target_area: ['全国'],
    industry: ['全業種'],
    start_date: '2025-04-01',
    end_date: '2026-02-28',
    front_url: 'https://www.env.go.jp/earth/ondanka/biz_local.html',
    is_active: true,
  },
];

async function addOfficialSubsidies() {
  console.log('='.repeat(60));
  console.log('公式情報源から収集した補助金をデータベースに追加');
  console.log('='.repeat(60));
  console.log(`追加対象: ${officialSubsidies.length}件\n`);

  let successCount = 0;
  let updateCount = 0;
  let errorCount = 0;

  for (const subsidy of officialSubsidies) {
    const record = {
      ...subsidy,
      updated_at: new Date().toISOString(),
    };

    // upsert: jgrants_idが同じなら更新、なければ挿入
    const { error, data } = await supabase
      .from('subsidies')
      .upsert(record, { onConflict: 'jgrants_id' })
      .select();

    if (error) {
      console.error(`エラー: ${subsidy.title}`, error.message);
      errorCount++;
    } else {
      console.log(`✓ ${subsidy.title.substring(0, 50)}...`);
      successCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('完了');
  console.log(`  追加/更新: ${successCount}件`);
  console.log(`  エラー: ${errorCount}件`);
  console.log('='.repeat(60));

  // 現在のデータベース状態を確認
  const { count: total } = await supabase.from('subsidies').select('*', { count: 'exact', head: true });
  const { count: noDesc } = await supabase.from('subsidies').select('*', { count: 'exact', head: true }).is('description', null);
  const { count: noAmount } = await supabase.from('subsidies').select('*', { count: 'exact', head: true }).is('max_amount', null);
  const { count: active } = await supabase.from('subsidies').select('*', { count: 'exact', head: true }).eq('is_active', true);

  console.log('\n=== データベース状態 ===');
  console.log(`総件数: ${total}`);
  console.log(`概要あり: ${total! - noDesc!}件 (${Math.round((total! - noDesc!) / total! * 100)}%)`);
  console.log(`金額あり: ${total! - noAmount!}件 (${Math.round((total! - noAmount!) / total! * 100)}%)`);
  console.log(`募集中: ${active}件`);
}

addOfficialSubsidies();
