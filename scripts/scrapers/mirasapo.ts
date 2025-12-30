// ミラサポplus スクレイパー
// https://mirasapo-plus.go.jp/

import * as cheerio from 'cheerio';
import { BaseScraper } from './base';
import type { ScrapedSubsidy } from './types';
import { cleanDescription, stripHtml } from './clean-description';

const BASE_URL = 'https://mirasapo-plus.go.jp';
const SEARCH_URL = `${BASE_URL}/subsidy/`;

export class MirasapoScraper extends BaseScraper {
  private region?: string;

  constructor(region?: string) {
    super(region ? `mirasapo:${region}` : 'mirasapo');
    this.region = region;
  }

  async scrape(): Promise<ScrapedSubsidy[]> {
    const subsidies: ScrapedSubsidy[] = [];

    try {
      // 検索ページを取得
      let url = SEARCH_URL;
      if (this.region) {
        url += `?area=${encodeURIComponent(this.region)}`;
      }

      console.log(`  Fetching: ${url}`);
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SubsidyBot/1.0)',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // 補助金リストを取得
      const items = $('.subsidy-list__item, .card-subsidy, [class*="subsidy"]');
      console.log(`  Found ${items.length} items`);

      items.each((_, element) => {
        try {
          const $el = $(element);
          const title = $el.find('h3, .title, [class*="title"]').first().text().trim();
          const link = $el.find('a').first().attr('href');
          const description = $el.find('.description, .summary, p').first().text().trim();

          if (title && link) {
            const fullUrl = link.startsWith('http') ? link : `${BASE_URL}${link}`;
            const sourceId = this.extractId(fullUrl);
            const cleanedDesc = cleanDescription(description);

            subsidies.push({
              source: 'mirasapo',
              source_id: sourceId,
              source_url: fullUrl,
              title,
              description: cleanedDesc || undefined,
              target_area: this.region ? [this.region] : ['全国'],
            });
          }
        } catch (e) {
          console.error('  Parse error:', e);
        }
      });

      // 詳細ページから追加情報を取得（最初の10件のみ）
      const detailLimit = Math.min(subsidies.length, 10);
      for (let i = 0; i < detailLimit; i++) {
        await this.sleep(1000); // レート制限
        try {
          await this.fetchDetail(subsidies[i]);
        } catch (e) {
          console.error(`  Detail fetch error: ${subsidies[i].title.slice(0, 20)}...`);
        }
      }

    } catch (error) {
      console.error('Mirasapo scrape error:', error);
    }

    return subsidies;
  }

  private extractId(url: string): string {
    const match = url.match(/\/subsidy\/(\d+)/);
    return match ? match[1] : url.replace(/[^a-zA-Z0-9]/g, '_').slice(-50);
  }

  private async fetchDetail(subsidy: ScrapedSubsidy): Promise<void> {
    const response = await fetch(subsidy.source_url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SubsidyBot/1.0)',
      },
    });

    if (!response.ok) return;

    const html = await response.text();
    const $ = cheerio.load(html);

    // ページ全体のテキストを取得
    const pageText = $('body').text();

    // 金額情報を抽出（テキストパターンマッチング）
    const amountPatterns = [
      /補助上限[額金]?[：:]\s*([0-9,]+(?:\.\d+)?)\s*(億|万)?円/,
      /上限[額金]?[：:]\s*([0-9,]+(?:\.\d+)?)\s*(億|万)?円/,
      /最大[：:]\s*([0-9,]+(?:\.\d+)?)\s*(億|万)?円/,
      /([0-9,]+(?:\.\d+)?)\s*(億|万)?円(?:まで|以内)/,
    ];
    
    for (const pattern of amountPatterns) {
      const match = pageText.match(pattern);
      if (match) {
        const num = parseFloat(match[1].replace(/,/g, ''));
        const unit = match[2];
        if (unit === '億') {
          subsidy.max_amount = num * 100000000;
        } else if (unit === '万') {
          subsidy.max_amount = num * 10000;
        } else {
          subsidy.max_amount = num;
        }
        break;
      }
    }

    // 補助率を抽出
    const ratePatterns = [
      /補助率[：:]\s*([0-9\/]+(?:～|〜|~)[0-9\/]+|[0-9\/]+)/,
      /([12]\/[23]|[0-9]+(?:\.[0-9]+)?%)/,
    ];
    
    for (const pattern of ratePatterns) {
      const match = pageText.match(pattern);
      if (match) {
        subsidy.subsidy_rate = match[1] || match[0];
        break;
      }
    }

    // 募集期間/締切日を抽出
    const datePatterns = [
      /募集[期終]?[間了]?[：:]\s*(?:.*?(?:まで|～|〜|~))?\s*(\d{4})[年\/\-](\d{1,2})[月\/\-](\d{1,2})日?/,
      /締[め切]?切[日り]?[：:]\s*(\d{4})[年\/\-](\d{1,2})[月\/\-](\d{1,2})日?/,
      /受付終了[：:]\s*(\d{4})[年\/\-](\d{1,2})[月\/\-](\d{1,2})日?/,
      /令和(\d+)年(\d{1,2})月(\d{1,2})日(?:まで|締切)/,
    ];
    
    for (const pattern of datePatterns) {
      const match = pageText.match(pattern);
      if (match) {
        let year = parseInt(match[1], 10);
        // 令和変換
        if (year < 100) {
          year = 2018 + year;
        }
        const month = match[2].padStart(2, '0');
        const day = match[3].padStart(2, '0');
        subsidy.end_date = `${year}-${month}-${day}`;
        break;
      }
    }

    // 募集開始日を抽出
    const startDatePatterns = [
      /募集開始[：:]\s*(\d{4})[年\/\-](\d{1,2})[月\/\-](\d{1,2})日?/,
      /受付開始[：:]\s*(\d{4})[年\/\-](\d{1,2})[月\/\-](\d{1,2})日?/,
    ];
    
    for (const pattern of startDatePatterns) {
      const match = pageText.match(pattern);
      if (match) {
        const month = match[2].padStart(2, '0');
        const day = match[3].padStart(2, '0');
        subsidy.start_date = `${match[1]}-${month}-${day}`;
        break;
      }
    }

    // 対象業種を抽出
    const industryMatch = pageText.match(/対象[業種]?[：:]\s*([^。\n]+)/);
    if (industryMatch) {
      subsidy.industry = industryMatch[1].split(/[、,／\/]/).map(s => s.trim()).filter(Boolean).slice(0, 10);
    }

    // 詳細説明（定型文を除去）
    const detail = $('[class*="detail"], .content, article, .main-content').text().trim();
    const cleanedDetail = cleanDescription(detail);
    if (cleanedDetail && cleanedDetail.length > (subsidy.description?.length || 0)) {
      subsidy.description = cleanedDetail.slice(0, 2000);
    }
  }
}
