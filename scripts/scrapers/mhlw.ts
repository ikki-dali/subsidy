// 厚生労働省 雇用関係助成金スクレイパー
// https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/koyou/kyufukin/

import * as cheerio from 'cheerio';
import { BaseScraper } from './base';
import type { ScrapedSubsidy } from './types';
import { cleanDescription } from './clean-description';

const BASE_URL = 'https://www.mhlw.go.jp';

// 厚生労働省の主要雇用関係助成金一覧
// 手動でURLと基本情報を定義し、詳細はスクレイピングで取得
const MHLW_SUBSIDIES = [
  {
    id: 'career-up',
    title: 'キャリアアップ助成金',
    url: '/stf/seisakunitsuite/bunya/koyou_roudou/part_haken/jigyounushi/career.html',
    description: '有期雇用労働者、短時間労働者、派遣労働者といったいわゆる非正規雇用の労働者の企業内でのキャリアアップを促進するため、正社員化、処遇改善の取組を実施した事業主に対して助成する制度です。',
    maxAmount: 800000, // 正社員化コース: 80万円
    subsidyRate: '定額',
    industry: ['全業種'],
  },
  {
    id: 'koyo-chosei',
    title: '雇用調整助成金',
    url: '/stf/seisakunitsuite/bunya/koyou_roudou/koyou/kyufukin/pageL07.html',
    description: '経済上の理由により事業活動の縮小を余儀なくされた事業主が、労働者に対して一時的に休業、教育訓練又は出向を行い、労働者の雇用の維持を図った場合に、休業手当、賃金等の一部を助成する制度です。',
    maxAmount: 8370, // 1人1日あたり上限
    subsidyRate: '2/3〜3/4',
    industry: ['全業種'],
  },
  {
    id: 'tokutei-kyushoku',
    title: '特定求職者雇用開発助成金',
    url: '/stf/seisakunitsuite/bunya/koyou_roudou/koyou/kyufukin/tokutei.html',
    description: '高年齢者や障害者等の就職困難者をハローワーク等の紹介により、継続して雇用する労働者として雇い入れる事業主に対して助成する制度です。',
    maxAmount: 2400000, // 最大240万円
    subsidyRate: '定額',
    industry: ['全業種'],
  },
  {
    id: 'trial-koyo',
    title: 'トライアル雇用助成金',
    url: '/stf/seisakunitsuite/bunya/koyou_roudou/koyou/kyufukin/trial_koyou.html',
    description: '職業経験、技能、知識の不足等から安定的な就職が困難な求職者を、ハローワーク等の紹介により、一定期間試行雇用する事業主に対して助成する制度です。',
    maxAmount: 50000, // 月額最大5万円（最長3ヶ月）
    subsidyRate: '定額',
    industry: ['全業種'],
  },
  {
    id: 'ryoritsu-shien',
    title: '両立支援等助成金',
    url: '/stf/seisakunitsuite/bunya/koyou_roudou/koyou/kyufukin/ryouritsu.html',
    description: '仕事と家庭の両立支援、女性の活躍推進に取り組む事業主に対して助成する制度です。育児休業等支援コース、介護離職防止支援コースなどがあります。',
    maxAmount: 600000, // コースにより異なる
    subsidyRate: '定額',
    industry: ['全業種'],
  },
  {
    id: 'jinzai-kaihatsu',
    title: '人材開発支援助成金',
    url: '/stf/seisakunitsuite/bunya/koyou_roudou/jinzaikaihatsu/index.html',
    description: '事業主が雇用する労働者に対して、職務に関連した専門的な知識及び技能を習得させるための職業訓練等を計画に沿って実施した場合等に、訓練経費や訓練期間中の賃金の一部を助成する制度です。',
    maxAmount: 10000000, // 最大1,000万円
    subsidyRate: '30%〜75%',
    industry: ['全業種'],
  },
  {
    id: 'sanpo-hoken',
    title: '産業保健関係助成金',
    url: '/stf/seisakunitsuite/bunya/koyou_roudou/roudoukijun/anzen/anzeneisei02.html',
    description: '労働者の健康管理等のため、産業医等を選任した際の費用や、ストレスチェック、健康診断後の措置を実施した際の費用を助成する制度です。',
    maxAmount: 100000,
    subsidyRate: '定額',
    industry: ['全業種'],
  },
  {
    id: 'shogaisha-koyo',
    title: '障害者雇用関係助成金',
    url: '/stf/seisakunitsuite/bunya/koyou_roudou/koyou/shougaishakoyou/shisaku/jigyounushi/intro-joseikin.html',
    description: '障害者を雇用する事業主に対して、障害者の雇入れや雇用継続を図るための助成金です。障害者介助等助成金、職場適応援助者助成金などがあります。',
    maxAmount: 1200000, // コースにより異なる
    subsidyRate: '定額',
    industry: ['全業種'],
  },
  {
    id: '65-chokai',
    title: '65歳超雇用推進助成金',
    url: '/stf/seisakunitsuite/bunya/koyou_roudou/koyou/koureisha/topics/tp120903-1.html',
    description: '65歳以上への定年引上げ、定年の定めの廃止、希望者全員を66歳以上の年齢まで雇用する継続雇用制度の導入のいずれかを実施した事業主に対して助成する制度です。',
    maxAmount: 1600000, // 160万円
    subsidyRate: '定額',
    industry: ['全業種'],
  },
  {
    id: 'chiiki-koyo',
    title: '地域雇用開発助成金',
    url: '/stf/seisakunitsuite/bunya/koyou_roudou/koyou/chiiki_koyou/index.html',
    description: '雇用機会が不足している地域の事業主が、事業所の設置・整備を行い、地域に居住する求職者等を雇い入れた場合に助成する制度です。',
    maxAmount: 9600000, // 最大960万円（3回分合計）
    subsidyRate: '定額',
    industry: ['全業種'],
  },
];

export class MHLWScraper extends BaseScraper {
  constructor() {
    super('mhlw');
  }

  async scrape(): Promise<ScrapedSubsidy[]> {
    const subsidies: ScrapedSubsidy[] = [];

    for (const subsidyDef of MHLW_SUBSIDIES) {
      try {
        const fullUrl = `${BASE_URL}${subsidyDef.url}`;
        console.log(`  Fetching: ${subsidyDef.title}`);

        const subsidy: ScrapedSubsidy = {
          source: 'mhlw',
          source_id: subsidyDef.id,
          source_url: fullUrl,
          title: subsidyDef.title,
          description: subsidyDef.description,
          target_area: ['全国'],
          industry: subsidyDef.industry,
          max_amount: subsidyDef.maxAmount,
          subsidy_rate: subsidyDef.subsidyRate,
          organization: '厚生労働省',
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
      const mainContent = $('.contents, .main-content, article, #contents').text().trim();
      if (mainContent && mainContent.length > (subsidy.description?.length || 0)) {
        const cleaned = cleanDescription(mainContent);
        if (cleaned && cleaned.length > 100) {
          subsidy.description = cleaned.slice(0, 2000);
        }
      }

      // 金額情報を更新（より高い金額が見つかった場合）
      const amountPatterns = [
        /上限[額金]?[：:]\s*([0-9,]+(?:\.\d+)?)\s*(億|万)?円/,
        /最大[：:]\s*([0-9,]+(?:\.\d+)?)\s*(億|万)?円/,
        /([0-9,]+(?:\.\d+)?)\s*(億|万)?円(?:まで|以内)/,
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
        /補助率[：:]\s*([0-9\/]+(?:～|〜|~)[0-9\/]+|[0-9\/]+)/,
        /助成率[：:]\s*([0-9\/]+(?:～|〜|~)[0-9\/]+|[0-9\/]+)/,
      ];
      
      for (const pattern of ratePatterns) {
        const match = pageText.match(pattern);
        if (match && match[1]) {
          subsidy.subsidy_rate = match[1];
          break;
        }
      }

      // 申請締切日を抽出
      const datePatterns = [
        /申請[期終]?[間了限]?[：:]\s*(?:.*?(?:まで|～|〜|~))?\s*(\d{4})[年\/\-](\d{1,2})[月\/\-](\d{1,2})日?/,
        /締[め切]?切[日り]?[：:]\s*(\d{4})[年\/\-](\d{1,2})[月\/\-](\d{1,2})日?/,
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

