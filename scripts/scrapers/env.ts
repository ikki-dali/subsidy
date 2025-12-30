// 環境省 補助金スクレイパー
// https://www.env.go.jp/

import * as cheerio from 'cheerio';
import { BaseScraper } from './base';
import type { ScrapedSubsidy } from './types';
import { cleanDescription } from './clean-description';

const BASE_URL = 'https://www.env.go.jp';

// 環境省の主要補助金一覧
const ENV_SUBSIDIES = [
  {
    id: 'shoene-setsubi',
    title: '省エネルギー設備導入支援補助金',
    url: '/earth/ondanka/biz_local/01_01.html',
    description: '中小企業等が省エネルギー設備を導入する際の費用を補助する制度です。高効率照明、空調設備、ボイラー等の導入を支援します。',
    maxAmount: 100000000, // 1億円
    subsidyRate: '1/3〜1/2',
    industry: ['全業種'],
  },
  {
    id: 'ev-charger',
    title: '電気自動車等充電インフラ整備補助金',
    url: '/air/car/jidosha.html',
    description: '電気自動車（EV）やプラグインハイブリッド車（PHV）の普及促進のため、充電インフラの整備を支援する制度です。',
    maxAmount: 5000000, // 500万円
    subsidyRate: '1/2以内',
    industry: ['全業種'],
  },
  {
    id: 'cev-hojo',
    title: 'クリーンエネルギー自動車導入促進補助金（CEV補助金）',
    url: '/air/car/mitigateclimatechange/cev.html',
    description: '電気自動車（EV）、プラグインハイブリッド車（PHV）、燃料電池自動車（FCV）等のクリーンエネルギー自動車の購入を支援する制度です。',
    maxAmount: 850000, // EV最大85万円
    subsidyRate: '定額',
    industry: ['全業種'],
  },
  {
    id: 'taiyoko-jika',
    title: '太陽光発電設備導入支援補助金',
    url: '/earth/ondanka/biz_local/01_03.html',
    description: '中小企業等が太陽光発電設備を自家消費目的で導入する際の費用を補助する制度です。蓄電池との組み合わせも対象となります。',
    maxAmount: 200000000, // 2億円
    subsidyRate: '1/3〜1/2',
    industry: ['全業種'],
  },
  {
    id: 'zeb-zeh',
    title: 'ZEB・ZEH支援事業',
    url: '/earth/ondanka/biz_local/01_04.html',
    description: 'ネット・ゼロ・エネルギー・ビル（ZEB）やネット・ゼロ・エネルギー・ハウス（ZEH）の普及を促進するための支援事業です。',
    maxAmount: 500000000, // 5億円
    subsidyRate: '1/3〜2/3',
    industry: ['全業種', '建設業', '不動産業'],
  },
  {
    id: 'datsutanso-senkou',
    title: '脱炭素先行地域づくり事業',
    url: '/earth/ondanka/datsutanso/index.html',
    description: '脱炭素先行地域において、2030年度までに民生部門（家庭部門及び業務その他部門）の電力消費に伴うCO2排出の実質ゼロを実現する取組を支援する制度です。',
    maxAmount: 5000000000, // 50億円
    subsidyRate: '2/3以内',
    industry: ['全業種'],
  },
  {
    id: 'junkan-keizai',
    title: '循環経済ビジネス推進事業',
    url: '/recycle/circul/index.html',
    description: '廃棄物の発生抑制、リユース、リサイクル等の3Rを推進し、循環型社会の形成に資する事業を支援する制度です。',
    maxAmount: 300000000, // 3億円
    subsidyRate: '1/2以内',
    industry: ['全業種', '製造業', '廃棄物処理業'],
  },
  {
    id: 'co2-sakugen',
    title: '工場・事業場におけるCO2削減支援事業',
    url: '/earth/ondanka/biz_local/01_02.html',
    description: '工場・事業場において、先進的な脱炭素技術の導入によりCO2排出量を大幅に削減する取組を支援する制度です。',
    maxAmount: 500000000, // 5億円
    subsidyRate: '1/3〜1/2',
    industry: ['製造業', '全業種'],
  },
  {
    id: 'f-gas',
    title: 'フロン類対策支援事業',
    url: '/earth/ozone/hcfc.html',
    description: '冷凍空調機器等の使用時におけるフロン類の漏えい防止や、低GWP・ノンフロン機器への転換を支援する制度です。',
    maxAmount: 50000000, // 5,000万円
    subsidyRate: '1/3以内',
    industry: ['全業種'],
  },
  {
    id: 'shizen-kyosei',
    title: '自然共生サイト認定支援事業',
    url: '/nature/biodic/30by30alliance/oecm.html',
    description: '「自然共生サイト」の認定取得や、生物多様性の保全・回復に向けた取組を支援する制度です。',
    maxAmount: 30000000, // 3,000万円
    subsidyRate: '1/2以内',
    industry: ['全業種'],
  },
];

export class ENVScraper extends BaseScraper {
  constructor() {
    super('env');
  }

  async scrape(): Promise<ScrapedSubsidy[]> {
    const subsidies: ScrapedSubsidy[] = [];

    for (const subsidyDef of ENV_SUBSIDIES) {
      try {
        const fullUrl = `${BASE_URL}${subsidyDef.url}`;
        console.log(`  Fetching: ${subsidyDef.title}`);

        const subsidy: ScrapedSubsidy = {
          source: 'env',
          source_id: subsidyDef.id,
          source_url: fullUrl,
          title: subsidyDef.title,
          description: subsidyDef.description,
          target_area: ['全国'],
          industry: subsidyDef.industry,
          max_amount: subsidyDef.maxAmount,
          subsidy_rate: subsidyDef.subsidyRate,
          organization: '環境省',
        };

        // 詳細ページから追加情報を取得
        await this.fetchDetail(subsidy);
        subsidies.push(subsidy);

        // レート制限
        await this.sleep(1000);
      } catch (error) {
        console.error(`  Error fetching ${subsidyDef.title}:`, error);
      }
    }

    return subsidies;
  }

  private async fetchDetail(subsidy: ScrapedSubsidy): Promise<void> {
    try {
      const response = await fetch(subsidy.source_url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SubsidyBot/1.0)',
        },
      });

      if (!response.ok) {
        console.log(`    Page not found (${response.status}), using default data`);
        return;
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // ページ全体のテキストを取得
      const pageText = $('body').text();

      // より詳細な説明を取得
      const mainContent = $('.contents, .main-content, article, #contents, .page-content').text().trim();
      if (mainContent && mainContent.length > (subsidy.description?.length || 0)) {
        const cleaned = cleanDescription(mainContent);
        if (cleaned && cleaned.length > 100) {
          subsidy.description = cleaned.slice(0, 2000);
        }
      }

      // 金額情報を更新
      const amountPatterns = [
        /上限[額金]?[：:]\s*([0-9,]+(?:\.\d+)?)\s*(億|万)?円/,
        /補助金額[：:]\s*([0-9,]+(?:\.\d+)?)\s*(億|万)?円/,
        /補助上限[：:]\s*([0-9,]+(?:\.\d+)?)\s*(億|万)?円/,
        /([0-9,]+(?:\.\d+)?)\s*(億|万)?円(?:まで|以内|を上限)/,
      ];
      
      for (const pattern of amountPatterns) {
        const match = pageText.match(pattern);
        if (match) {
          const num = parseFloat(match[1].replace(/,/g, ''));
          const unit = match[2];
          let amount = num;
          if (unit === '億') {
            amount = num * 100000000;
          } else if (unit === '万') {
            amount = num * 10000;
          }
          if (amount > (subsidy.max_amount || 0)) {
            subsidy.max_amount = amount;
          }
          break;
        }
      }

      // 補助率を更新
      const ratePatterns = [
        /補助率[：:]\s*([0-9\/]+(?:～|〜|~|以内)[0-9\/]*|[0-9\/]+)/,
      ];
      
      for (const pattern of ratePatterns) {
        const match = pageText.match(pattern);
        if (match && match[1]) {
          subsidy.subsidy_rate = match[1];
          break;
        }
      }

      // 申請期間を抽出
      const datePatterns = [
        /公募期間[：:]\s*(?:.*?(?:まで|～|〜|~))?\s*(\d{4})[年\/\-](\d{1,2})[月\/\-](\d{1,2})日?/,
        /申請[期終]?[間了限]?[：:]\s*(?:.*?(?:まで|～|〜|~))?\s*(\d{4})[年\/\-](\d{1,2})[月\/\-](\d{1,2})日?/,
        /令和(\d+)年(\d{1,2})月(\d{1,2})日(?:まで|締切)/,
      ];
      
      for (const pattern of datePatterns) {
        const match = pageText.match(pattern);
        if (match) {
          let year = parseInt(match[1], 10);
          if (year < 100) {
            year = 2018 + year; // 令和変換
          }
          const month = match[2].padStart(2, '0');
          const day = match[3].padStart(2, '0');
          subsidy.end_date = `${year}-${month}-${day}`;
          break;
        }
      }

    } catch (error) {
      console.log(`    Error fetching detail: ${error}`);
    }
  }
}

