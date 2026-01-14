/**
 * AI/IT/DX関連補助金を追加するスクリプト
 *
 * 実行方法: npx tsx scripts/add-it-dx-subsidies.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('環境変数が設定されていません');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// IT導入補助金の各枠
const IT_SUBSIDIES = [
  {
    jgrants_id: 'it2025:normal',
    name: 'IT導入補助金2025（通常枠）',
    title: 'IT導入補助金2025（通常枠）',
    catch_phrase: '業務プロセスを保有するソフトウェア導入を支援',
    description: `【IT導入補助金2025 通常枠】

■対象
中小企業・小規模事業者等

■補助対象
1種類以上の業務プロセスを保有するソフトウェアの導入
・会計ソフト、販売管理、在庫管理、顧客管理（CRM）
・人事・給与・勤怠管理、グループウェア
・生産管理、原価管理
・受発注、予約システム

■補助額
A類型：5万円〜150万円未満
B類型：150万円〜450万円以下

■補助率
1/2（条件により2/3に引上げ）

■申請期間
通年募集（2025年度）

■ポイント
・導入関連費（活用支援、保守サポート）も対象に
・インボイス枠との併用不可`,
    target_area: ['全国'],
    industry: ['全業種'],
    max_amount: 4500000,
    subsidy_rate: '1/2〜2/3',
    start_date: '2025-01-01',
    end_date: '2026-03-31',
    front_url: 'https://it-shien.smrj.go.jp/applicant/subsidy/normal/',
    is_active: true,
    ai_dx_featured: true,
  },
  {
    jgrants_id: 'it2025:invoice',
    name: 'IT導入補助金2025（インボイス枠・インボイス対応類型）',
    title: 'IT導入補助金2025（インボイス枠・インボイス対応類型）',
    catch_phrase: 'インボイス制度対応の会計・受発注・決済ソフト導入を支援',
    description: `【IT導入補助金2025 インボイス枠（インボイス対応類型）】

■対象
中小企業・小規模事業者等

■補助対象
インボイス制度に対応した「会計」「受発注」「決済」機能を有するソフトウェア
・会計ソフト（インボイス対応）
・受発注システム
・決済ソフト
・PC・ハードウェア

■補助額
ITツール：〜350万円
PC等：〜10万円
レジ等：〜20万円

■補助率
50万円以下：3/4（小規模事業者4/5）
50万円超：2/3

■申請期間
通年募集（2025年度）

■ポイント
・インボイス制度への対応を支援
・ハードウェアも補助対象`,
    target_area: ['全国'],
    industry: ['全業種'],
    max_amount: 3500000,
    subsidy_rate: '2/3〜4/5',
    start_date: '2025-01-01',
    end_date: '2026-03-31',
    front_url: 'https://it-shien.smrj.go.jp/applicant/subsidy/digitalbase/',
    is_active: true,
    ai_dx_featured: true,
  },
  {
    jgrants_id: 'it2025:electronic',
    name: 'IT導入補助金2025（インボイス枠・電子取引類型）',
    title: 'IT導入補助金2025（インボイス枠・電子取引類型）',
    catch_phrase: '受発注ソフトを取引先へ供与する場合の導入支援',
    description: `【IT導入補助金2025 インボイス枠（電子取引類型）】

■対象
中小企業・小規模事業者等と受発注の取引を行っている事業者（大企業含む）

■補助対象
インボイス制度対応のITツール（受発注ソフト）を導入し、
受注者である中小企業・小規模事業者等に対して当該ITツールを供与する場合

■補助額
〜350万円

■補助率
2/3

■申請期間
通年募集（2025年度）

■ポイント
・取引先への受発注システム供与を支援
・発注側企業（大企業含む）が申請可能`,
    target_area: ['全国'],
    industry: ['全業種'],
    max_amount: 3500000,
    subsidy_rate: '2/3',
    start_date: '2025-01-01',
    end_date: '2026-03-31',
    front_url: 'https://it-shien.smrj.go.jp/applicant/subsidy/digitalbased_invoice/',
    is_active: true,
    ai_dx_featured: true,
  },
  {
    jgrants_id: 'it2025:security',
    name: 'IT導入補助金2025（セキュリティ対策推進枠）',
    title: 'IT導入補助金2025（セキュリティ対策推進枠）',
    catch_phrase: 'サイバーセキュリティ対策を支援',
    description: `【IT導入補助金2025 セキュリティ対策推進枠】

■対象
中小企業・小規模事業者等

■補助対象
サイバーインシデントのリスク低減のためのセキュリティサービス
・UTM（統合脅威管理）
・エンドポイントセキュリティ
・ファイアウォール
・セキュリティ監視サービス
・脆弱性診断

■補助額
5万円〜100万円

■補助率
1/2

■申請期間
通年募集（2025年度）

■ポイント
・サイバー攻撃対策に特化
・「サイバーセキュリティお助け隊サービス」の利用`,
    target_area: ['全国'],
    industry: ['全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2',
    start_date: '2025-01-01',
    end_date: '2026-03-31',
    front_url: 'https://it-shien.smrj.go.jp/applicant/subsidy/security/',
    is_active: true,
    ai_dx_featured: true,
  },
  {
    jgrants_id: 'it2025:multiple',
    name: 'IT導入補助金2025（複数社連携IT導入枠）',
    title: 'IT導入補助金2025（複数社連携IT導入枠）',
    catch_phrase: '複数企業が連携してのIT導入を支援',
    description: `【IT導入補助金2025 複数社連携IT導入枠】

■対象
複数の中小企業・小規模事業者が連携する取組

■補助対象
複数社が連携してITツールおよびハードウェアを導入
・地域DXの推進
・商店街・商業集積地のキャッシュレス化
・複数社での受発注システム共同導入

■補助額
基盤導入経費：〜3,000万円
消費動向等分析経費：〜50万円

■補助率
2/3〜3/4

■申請期間
通年募集（2025年度）

■ポイント
・地域全体のDX推進を支援
・幹事社を中心とした連携申請`,
    target_area: ['全国'],
    industry: ['全業種'],
    max_amount: 30000000,
    subsidy_rate: '2/3〜3/4',
    start_date: '2025-01-01',
    end_date: '2026-03-31',
    front_url: 'https://it-shien.smrj.go.jp/applicant/subsidy/multiple/',
    is_active: true,
    ai_dx_featured: true,
  },
];

// その他のDX関連補助金
const DX_SUBSIDIES = [
  {
    jgrants_id: 'dx:monodukuri-digital',
    name: 'ものづくり補助金（デジタル枠）',
    title: 'ものづくり補助金2025（デジタル枠）',
    catch_phrase: 'DX・デジタル技術を活用した革新的製品・サービス開発を支援',
    description: `【ものづくり補助金 デジタル枠】

■対象
中小企業、小規模事業者等

■補助対象
DXに資する革新的な製品・サービスの開発
・AI・IoT・ロボット等を活用した製品開発
・デジタル技術を活用した生産プロセス改善
・自動化・省人化システムの構築

■補助額
750万円〜1,250万円

■補助率
1/2〜2/3

■申請期間
公募回による

■ポイント
・デジタル技術を活用した革新的取組が対象
・設備投資が主な対象`,
    target_area: ['全国'],
    industry: ['製造業', 'サービス業', '全業種'],
    max_amount: 12500000,
    subsidy_rate: '1/2〜2/3',
    start_date: '2025-01-01',
    end_date: '2026-03-31',
    front_url: 'https://portal.monodukuri-hojo.jp/',
    is_active: true,
    ai_dx_featured: true,
  },
  {
    jgrants_id: 'dx:jigyou-saikouchiku-dx',
    name: '事業再構築補助金（DX関連）',
    title: '事業再構築補助金2025（成長枠・DX関連投資）',
    catch_phrase: 'DX投資による新分野展開・業態転換を支援',
    description: `【事業再構築補助金 成長枠（DX関連）】

■対象
中小企業、中堅企業等

■補助対象
新分野展開、業態転換、事業再編等におけるDX投資
・EC事業への進出
・オンラインサービス展開
・デジタル技術を活用した新事業

■補助額
100万円〜7,000万円

■補助率
1/2〜2/3

■申請期間
公募回による

■ポイント
・大規模なDX投資が可能
・新事業への挑戦を支援`,
    target_area: ['全国'],
    industry: ['全業種'],
    max_amount: 70000000,
    subsidy_rate: '1/2〜2/3',
    start_date: '2025-01-01',
    end_date: '2026-03-31',
    front_url: 'https://jigyou-saikouchiku.go.jp/',
    is_active: true,
    ai_dx_featured: true,
  },
  {
    jgrants_id: 'dx:shorikika-iot',
    name: '中小企業省力化投資補助金（IoT・ロボット）',
    title: '中小企業省力化投資補助金2025',
    catch_phrase: 'IoT・ロボット等の導入による人手不足解消を支援',
    description: `【中小企業省力化投資補助金】

■対象
中小企業、小規模事業者等

■補助対象
人手不足解消に向けたIoT・ロボット等の汎用製品導入
・産業用ロボット
・協働ロボット
・IoTセンサー
・自動化設備
・RPA

■補助額
200万円〜1,500万円

■補助率
1/2

■申請期間
通年募集

■ポイント
・カタログ掲載製品から選択
・簡素な申請手続き`,
    target_area: ['全国'],
    industry: ['製造業', '建設業', '運輸業', 'サービス業', '全業種'],
    max_amount: 15000000,
    subsidy_rate: '1/2',
    start_date: '2025-01-01',
    end_date: '2026-03-31',
    front_url: 'https://shoryokuka.smrj.go.jp/',
    is_active: true,
    ai_dx_featured: true,
  },
  {
    jgrants_id: 'dx:ai-challenge',
    name: 'AI・データ活用促進事業補助金',
    title: 'AI・データ活用促進事業補助金',
    catch_phrase: '中小企業のAI・データ活用を支援',
    description: `【AI・データ活用促進事業補助金】

■対象
中小企業、小規模事業者等

■補助対象
AI・データを活用した業務改善・新サービス開発
・生成AIの業務活用
・AIを活用した需要予測
・画像認識AIによる検品自動化
・チャットボット導入
・データ分析基盤構築

■補助額
50万円〜500万円

■補助率
1/2〜2/3

■申請期間
自治体により異なる

■ポイント
・AI導入の専門家支援あり
・PoC（実証実験）も対象`,
    target_area: ['全国'],
    industry: ['全業種'],
    max_amount: 5000000,
    subsidy_rate: '1/2〜2/3',
    start_date: '2025-01-01',
    end_date: '2026-03-31',
    front_url: 'https://www.meti.go.jp/policy/it_policy/jinzai/',
    is_active: true,
    ai_dx_featured: true,
  },
  {
    jgrants_id: 'dx:telework',
    name: 'テレワーク導入促進補助金',
    title: 'テレワーク導入促進助成金2025',
    catch_phrase: 'テレワーク環境構築を支援',
    description: `【テレワーク導入促進助成金】

■対象
中小企業、小規模事業者等

■補助対象
テレワーク環境構築に必要な機器・ソフトウェア等
・ノートPC、タブレット
・Web会議システム
・VPN構築
・クラウドサービス
・勤怠管理システム

■補助額
〜250万円

■補助率
1/2〜2/3

■申請期間
自治体により異なる

■ポイント
・働き方改革を推進
・東京都など独自制度あり`,
    target_area: ['全国'],
    industry: ['全業種'],
    max_amount: 2500000,
    subsidy_rate: '1/2〜2/3',
    start_date: '2025-01-01',
    end_date: '2026-03-31',
    front_url: 'https://www.shigotozaidan.or.jp/',
    is_active: true,
    ai_dx_featured: true,
  },
  {
    jgrants_id: 'dx:ec-support',
    name: 'ECサイト構築支援補助金',
    title: 'ECサイト・ネット販売支援補助金',
    catch_phrase: 'EC・ネット通販事業の立ち上げを支援',
    description: `【ECサイト構築支援補助金】

■対象
中小企業、小規模事業者等

■補助対象
ECサイト構築・運営に必要な費用
・ECサイト構築費
・ショッピングモール出店費
・決済システム導入
・物流システム連携
・Web広告費（一部）

■補助額
〜100万円

■補助率
1/2〜2/3

■申請期間
自治体により異なる

■ポイント
・オンライン販路拡大を支援
・持続化補助金との組み合わせも可能`,
    target_area: ['全国'],
    industry: ['小売業', '製造業', 'サービス業', '全業種'],
    max_amount: 1000000,
    subsidy_rate: '1/2〜2/3',
    start_date: '2025-01-01',
    end_date: '2026-03-31',
    front_url: 'https://r3.jizokukahojokin.info/',
    is_active: true,
    ai_dx_featured: true,
  },
  {
    jgrants_id: 'dx:cyber-security',
    name: 'サイバーセキュリティ対策補助金',
    title: 'サイバーセキュリティ対策補助金',
    catch_phrase: '中小企業のサイバーセキュリティ強化を支援',
    description: `【サイバーセキュリティ対策補助金】

■対象
中小企業、小規模事業者等

■補助対象
サイバーセキュリティ対策に必要な費用
・セキュリティソフト導入
・ファイアウォール設置
・脆弱性診断
・セキュリティ研修
・ISMS認証取得

■補助額
〜200万円

■補助率
1/2〜2/3

■申請期間
通年（自治体により異なる）

■ポイント
・サプライチェーンセキュリティ対策
・取引先からの要請にも対応`,
    target_area: ['全国'],
    industry: ['全業種'],
    max_amount: 2000000,
    subsidy_rate: '1/2〜2/3',
    start_date: '2025-01-01',
    end_date: '2026-03-31',
    front_url: 'https://www.ipa.go.jp/security/otasuketai/',
    is_active: true,
    ai_dx_featured: true,
  },
];

// 東京都のDX関連補助金
const TOKYO_DX_SUBSIDIES = [
  {
    jgrants_id: 'tokyo:dx-promotion',
    name: '東京都中小企業DX推進支援事業',
    title: '東京都中小企業DX推進支援事業',
    catch_phrase: '都内中小企業のDX推進を総合的に支援',
    description: `【東京都中小企業DX推進支援事業】

■対象
東京都内に主たる事業所を有する中小企業

■補助対象
DX推進に必要な経費
・システム開発・導入費
・クラウドサービス利用料
・専門家活用費
・研修費

■補助額
〜1,500万円

■補助率
2/3

■申請期間
年度内随時

■ポイント
・東京都独自の手厚い支援
・専門家によるハンズオン支援あり`,
    target_area: ['東京都'],
    industry: ['全業種'],
    max_amount: 15000000,
    subsidy_rate: '2/3',
    start_date: '2025-04-01',
    end_date: '2026-03-31',
    front_url: 'https://www.tokyo-kosha.or.jp/',
    is_active: true,
    ai_dx_featured: true,
  },
  {
    jgrants_id: 'tokyo:telework',
    name: '東京都テレワーク定着強化奨励金',
    title: '令和7年度テレワーク定着強化奨励金',
    catch_phrase: 'テレワークの定着・拡大を奨励金で支援',
    description: `【東京都テレワーク定着強化奨励金】

■対象
東京都内に本社または事業所を有する中小企業等

■支援内容
テレワーク実施状況に応じた奨励金
・週3日以上実施：最大100万円
・週4日以上実施：最大120万円

■要件
・テレワーク規程の整備
・テレワーク環境の整備
・一定期間のテレワーク実施

■申請期間
令和7年度内

■ポイント
・テレワーク実績に応じた奨励金
・働き方改革推進企業への支援`,
    target_area: ['東京都'],
    industry: ['全業種'],
    max_amount: 1200000,
    subsidy_rate: '定額',
    start_date: '2025-04-01',
    end_date: '2026-03-31',
    front_url: 'https://www.shigotozaidan.or.jp/',
    is_active: true,
    ai_dx_featured: true,
  },
];

async function main() {
  console.log('=== AI/IT/DX関連補助金の追加開始 ===\n');

  const allSubsidies = [...IT_SUBSIDIES, ...DX_SUBSIDIES, ...TOKYO_DX_SUBSIDIES];
  let added = 0;
  let updated = 0;
  let errors = 0;

  for (const subsidy of allSubsidies) {
    try {
      // 既存チェック
      const { data: existing } = await supabase
        .from('subsidies')
        .select('id')
        .eq('jgrants_id', subsidy.jgrants_id)
        .single();

      if (existing) {
        // 更新
        const { error } = await supabase
          .from('subsidies')
          .update({
            ...subsidy,
            updated_at: new Date().toISOString(),
          })
          .eq('jgrants_id', subsidy.jgrants_id);

        if (error) throw error;
        console.log(`更新: ${subsidy.title}`);
        updated++;
      } else {
        // 新規追加
        const { error } = await supabase
          .from('subsidies')
          .insert({
            id: crypto.randomUUID(),
            ...subsidy,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (error) throw error;
        console.log(`追加: ${subsidy.title}`);
        added++;
      }
    } catch (e) {
      console.error(`エラー: ${subsidy.title}`, e);
      errors++;
    }
  }

  console.log('\n=== 完了 ===');
  console.log(`追加: ${added}件`);
  console.log(`更新: ${updated}件`);
  console.log(`エラー: ${errors}件`);
}

main().catch(console.error);
