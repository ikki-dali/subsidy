// 農林水産省 補助金スクレイパー
// https://www.maff.go.jp/

import * as cheerio from 'cheerio';
import { BaseScraper } from './base';
import type { ScrapedSubsidy } from './types';
import { cleanDescription } from './clean-description';

const BASE_URL = 'https://www.maff.go.jp';

// 農林水産省の主要補助金一覧
const MAFF_SUBSIDIES = [
  {
    id: 'keiei-keizoku',
    title: '農業経営基盤強化資金（スーパーL資金）',
    url: '/j/keiei/support/keieikyoka/super-l.html',
    description: '認定農業者が農業経営改善計画を達成するために必要な資金を長期・低利で融資する制度です。農地取得、施設・機械の整備、長期運転資金等に利用できます。',
    maxAmount: 300000000, // 個人3億円、法人10億円
    subsidyRate: '融資',
    industry: ['農業'],
  },
  {
    id: 'nougyou-kinyu',
    title: '農業近代化資金',
    url: '/j/keiei/support/kinyu/kindaika.html',
    description: '農業者等が農業経営の近代化のために必要な資金を融資する制度です。施設の改良・造成・取得、農機具の取得、果樹等の植栽等に利用できます。',
    maxAmount: 180000000, // 個人1,800万円、法人2億円
    subsidyRate: '融資',
    industry: ['農業'],
  },
  {
    id: 'next-farm',
    title: '新規就農者育成総合対策（経営開始資金）',
    url: '/j/new_farmer/n_syunou/roudou.html',
    description: '次世代を担う農業者となることを志向する新規就農者に対し、就農直後の経営確立に資する資金を交付する制度です。',
    maxAmount: 1500000, // 年間150万円（最長3年間）
    subsidyRate: '定額',
    industry: ['農業'],
  },
  {
    id: 'jigyou-keisyou',
    title: '農業人材力強化総合支援事業',
    url: '/j/keiei/support/jinzai/index.html',
    description: '農業の担い手育成・確保のための総合的な支援事業です。雇用就農資金、経営継承・発展等支援事業などがあります。',
    maxAmount: 1200000, // 年間120万円
    subsidyRate: '定額',
    industry: ['農業'],
  },
  {
    id: 'rokujika',
    title: '６次産業化支援対策',
    url: '/j/shokusan/sanki/6jika.html',
    description: '農林漁業者等が農林水産物等の生産・加工・販売を一体的に行う６次産業化の取組を総合的に支援する制度です。',
    maxAmount: 500000000, // 5億円
    subsidyRate: '1/2以内',
    industry: ['農業', '林業', '水産業', '食品製造業'],
  },
  {
    id: 'smart-agri',
    title: 'スマート農業推進事業',
    url: '/j/kanbo/smart/index.html',
    description: 'ロボット、AI、IoT等の先端技術を活用したスマート農業の社会実装を加速化するための実証・普及を支援する制度です。',
    maxAmount: 150000000, // 実証地区1.5億円
    subsidyRate: '定額',
    industry: ['農業'],
  },
  {
    id: 'kankyo-hozen',
    title: '環境保全型農業直接支払交付金',
    url: '/j/seisan/kankyo/hozen_type/index.html',
    description: '化学肥料・化学合成農薬を原則5割以上低減する取組と合わせて行う地球温暖化防止や生物多様性保全等に効果の高い営農活動を支援する制度です。',
    maxAmount: 12000, // 10aあたり最大12,000円
    subsidyRate: '定額',
    industry: ['農業'],
  },
  {
    id: 'chusankan',
    title: '中山間地域等直接支払交付金',
    url: '/j/nousin/tyusan/siharai_seido/index.html',
    description: '中山間地域等において、農業生産条件の不利を補正するため、農業生産活動を継続する農業者等に対して交付金を直接支払う制度です。',
    maxAmount: 21000, // 急傾斜田10aあたり21,000円
    subsidyRate: '定額',
    industry: ['農業'],
  },
  {
    id: 'suisan-kinyu',
    title: '漁業近代化資金',
    url: '/j/budget/yosan_kansi/sikkou/tokutyu_r4/attach/pdf/R4_tokutyu-147.pdf',
    description: '漁業者等が漁業経営の近代化のために必要な資金を融資する制度です。漁船の建造・取得、漁業用施設の改良等に利用できます。',
    maxAmount: 900000000, // 9億円（大臣認定）
    subsidyRate: '融資',
    industry: ['水産業'],
  },
  {
    id: 'ringyo-seichouka',
    title: '林業・木材産業成長産業化促進対策',
    url: '/j/ringyou/kikou/hojokin/hojo_seichou.html',
    description: '林業・木材産業の成長産業化を図るため、川上から川下までの取組を総合的に支援する制度です。高性能林業機械の導入、木材加工流通施設の整備等を支援します。',
    maxAmount: 500000000, // 5億円
    subsidyRate: '1/2以内',
    industry: ['林業', '木材産業'],
  },
];

export class MAFFScraper extends BaseScraper {
  constructor() {
    super('maff');
  }

  async scrape(): Promise<ScrapedSubsidy[]> {
    const subsidies: ScrapedSubsidy[] = [];

    for (const subsidyDef of MAFF_SUBSIDIES) {
      try {
        const fullUrl = `${BASE_URL}${subsidyDef.url}`;
        console.log(`  Fetching: ${subsidyDef.title}`);

        const subsidy: ScrapedSubsidy = {
          source: 'maff',
          source_id: subsidyDef.id,
          source_url: fullUrl,
          title: subsidyDef.title,
          description: subsidyDef.description,
          target_area: ['全国'],
          industry: subsidyDef.industry,
          max_amount: subsidyDef.maxAmount,
          subsidy_rate: subsidyDef.subsidyRate,
          organization: '農林水産省',
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
      // PDFの場合はスキップ
      if (subsidy.source_url.endsWith('.pdf')) {
        console.log(`    Skipping PDF: ${subsidy.source_url}`);
        return;
      }

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
      const mainContent = $('.contents, .main, article, #main').text().trim();
      if (mainContent && mainContent.length > (subsidy.description?.length || 0)) {
        const cleaned = cleanDescription(mainContent);
        if (cleaned && cleaned.length > 100) {
          subsidy.description = cleaned.slice(0, 2000);
        }
      }

      // 金額情報を更新
      const amountPatterns = [
        /上限[額金]?[：:]\s*([0-9,]+(?:\.\d+)?)\s*(億|万)?円/,
        /融資限度額[：:]\s*([0-9,]+(?:\.\d+)?)\s*(億|万)?円/,
        /交付金額[：:]\s*([0-9,]+(?:\.\d+)?)\s*(億|万)?円/,
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
        /交付率[：:]\s*([0-9\/]+(?:～|〜|~|以内)[0-9\/]*|[0-9\/]+)/,
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
        /募集期間[：:]\s*(?:.*?(?:まで|～|〜|~))?\s*(\d{4})[年\/\-](\d{1,2})[月\/\-](\d{1,2})日?/,
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

