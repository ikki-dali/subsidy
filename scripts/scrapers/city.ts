/**
 * 政令指定都市スクレイパー
 * 20政令指定都市の独自補助金情報をスクレイピング
 */

import * as cheerio from 'cheerio';
import { BaseScraper } from './base';
import type { ScrapedSubsidy } from './types';
import { cleanDescription } from './clean-description';

// 政令指定都市情報
interface DesignatedCity {
  name: string;
  prefecture: string;
  urls: {
    main?: string;
    industry?: string;
    startup?: string;
  };
}

export const DESIGNATED_CITIES: DesignatedCity[] = [
  {
    name: '札幌市',
    prefecture: '北海道',
    urls: {
      main: 'https://www.city.sapporo.jp/keizai/',
      industry: 'https://www.city.sapporo.jp/keizai/shien/',
    },
  },
  {
    name: '仙台市',
    prefecture: '宮城県',
    urls: {
      main: 'https://www.city.sendai.jp/kikaku/',
      industry: 'https://www.sendai-resilience.jp/',
    },
  },
  {
    name: 'さいたま市',
    prefecture: '埼玉県',
    urls: {
      main: 'https://www.city.saitama.jp/005/001/',
      industry: 'https://www.city.saitama.jp/004/006/',
    },
  },
  {
    name: '千葉市',
    prefecture: '千葉県',
    urls: {
      main: 'https://www.city.chiba.jp/keizainosei/',
      industry: 'https://www.city.chiba.jp/keizainosei/keizai/kigyoritchi/',
    },
  },
  {
    name: '横浜市',
    prefecture: '神奈川県',
    urls: {
      main: 'https://www.city.yokohama.lg.jp/business/',
      industry: 'https://www.idec.or.jp/',
      startup: 'https://www.city.yokohama.lg.jp/business/kigyoshien/',
    },
  },
  {
    name: '川崎市',
    prefecture: '神奈川県',
    urls: {
      main: 'https://www.city.kawasaki.jp/jigyou/',
      industry: 'https://www.kawasaki-net.ne.jp/',
    },
  },
  {
    name: '相模原市',
    prefecture: '神奈川県',
    urls: {
      main: 'https://www.city.sagamihara.kanagawa.jp/sangyo/',
    },
  },
  {
    name: '新潟市',
    prefecture: '新潟県',
    urls: {
      main: 'https://www.city.niigata.lg.jp/business/',
      industry: 'https://www.city.niigata.lg.jp/business/shokogyo/',
    },
  },
  {
    name: '静岡市',
    prefecture: '静岡県',
    urls: {
      main: 'https://www.city.shizuoka.lg.jp/sangyo/',
      industry: 'https://www.city.shizuoka.lg.jp/sangyo/keizai/',
    },
  },
  {
    name: '浜松市',
    prefecture: '静岡県',
    urls: {
      main: 'https://www.city.hamamatsu.shizuoka.jp/sangyo/',
      industry: 'https://www.hai.or.jp/',
    },
  },
  {
    name: '名古屋市',
    prefecture: '愛知県',
    urls: {
      main: 'https://www.city.nagoya.jp/shisei/category/68-0-0-0-0-0-0-0-0-0.html',
      industry: 'https://www.nipc.city.nagoya.jp/',
    },
  },
  {
    name: '京都市',
    prefecture: '京都府',
    urls: {
      main: 'https://www.city.kyoto.lg.jp/sankan/',
      industry: 'https://www.city.kyoto.lg.jp/sankan/page/0000000074.html',
    },
  },
  {
    name: '大阪市',
    prefecture: '大阪府',
    urls: {
      main: 'https://www.city.osaka.lg.jp/keizaisenryaku/',
      industry: 'https://www.sansokan.jp/',
    },
  },
  {
    name: '堺市',
    prefecture: '大阪府',
    urls: {
      main: 'https://www.city.sakai.lg.jp/sangyo/',
      industry: 'https://www.sakai-ipc.jp/',
    },
  },
  {
    name: '神戸市',
    prefecture: '兵庫県',
    urls: {
      main: 'https://www.city.kobe.lg.jp/a31812/',
      industry: 'https://www.kobe-ipc.or.jp/',
    },
  },
  {
    name: '岡山市',
    prefecture: '岡山県',
    urls: {
      main: 'https://www.city.okayama.jp/sangyo/',
      industry: 'https://www.city.okayama.jp/sangyo/category/17-0-0-0-0-0-0-0-0-0.html',
    },
  },
  {
    name: '広島市',
    prefecture: '広島県',
    urls: {
      main: 'https://www.city.hiroshima.lg.jp/life/3/',
      industry: 'https://www.city.hiroshima.lg.jp/site/keizai/',
    },
  },
  {
    name: '北九州市',
    prefecture: '福岡県',
    urls: {
      main: 'https://www.city.kitakyushu.lg.jp/san-kei/',
      industry: 'https://www.kitaq-kigyou.jp/',
    },
  },
  {
    name: '福岡市',
    prefecture: '福岡県',
    urls: {
      main: 'https://www.city.fukuoka.lg.jp/keizai/',
      industry: 'https://www.city.fukuoka.lg.jp/keizai/r-support/',
      startup: 'https://startup.fukuoka.jp/',
    },
  },
  {
    name: '熊本市',
    prefecture: '熊本県',
    urls: {
      main: 'https://www.city.kumamoto.jp/sangyo/',
      industry: 'https://www.city.kumamoto.jp/hpkiji/pub/List.aspx?c_id=5&class_set_id=2&class_id=2557',
    },
  },
];

// 補助金関連キーワード
const SUBSIDY_KEYWORDS = [
  '補助金', '助成金', '支援金', '給付金', '奨励金',
  '補助事業', '助成事業', '支援事業', '補助制度',
  '中小企業支援', '創業支援', '販路開拓',
  '設備投資', '雇用支援',
];

// 除外キーワード
const EXCLUDE_KEYWORDS = [
  'ログイン', 'お問い合わせ', 'サイトマップ', 'プライバシー',
  '採用情報', '入札情報', 'アクセス', 'メールマガジン',
];

export class CityScraper extends BaseScraper {
  private city: DesignatedCity;

  constructor(cityName: string) {
    super(`city:${cityName}`);
    const city = DESIGNATED_CITIES.find(c => c.name === cityName);
    if (!city) {
      throw new Error(`Unknown city: ${cityName}`);
    }
    this.city = city;
  }

  async scrape(): Promise<ScrapedSubsidy[]> {
    const subsidies: ScrapedSubsidy[] = [];
    const visitedUrls = new Set<string>();

    const urls = [
      this.city.urls.main,
      this.city.urls.industry,
      this.city.urls.startup,
    ].filter((url): url is string => !!url);

    for (const url of urls) {
      try {
        console.log(`  [${this.city.name}] スクレイプ中: ${url}`);
        const items = await this.scrapeUrl(url, visitedUrls);
        subsidies.push(...items);
        await this.sleep(2000);
      } catch (error) {
        console.error(`  [${this.city.name}] エラー (${url}):`, error);
      }
    }

    const uniqueSubsidies = this.removeDuplicates(subsidies);
    console.log(`  [${this.city.name}] ${uniqueSubsidies.length}件取得`);

    return uniqueSubsidies;
  }

  private async scrapeUrl(url: string, visitedUrls: Set<string>): Promise<ScrapedSubsidy[]> {
    if (visitedUrls.has(url)) {
      return [];
    }
    visitedUrls.add(url);

    const subsidies: ScrapedSubsidy[] = [];

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'ja,en;q=0.9',
        },
      });

      if (!response.ok) {
        return [];
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      $('a').each((_, el) => {
        const $el = $(el);
        const text = $el.text().trim();
        const href = $el.attr('href');

        if (!href || !text) return;
        if (text.length < 5 || text.length > 200) return;
        if (!this.isSubsidyRelated(text)) return;
        if (this.isExcluded(text)) return;

        const fullUrl = this.resolveUrl(href, url);
        if (!fullUrl.startsWith('http')) return;
        if (this.isFileLink(fullUrl)) return;

        const sourceId = this.generateId(fullUrl, text);

        subsidies.push({
          source: `city:${this.city.name}`,
          source_id: sourceId,
          source_url: fullUrl,
          title: this.cleanTitle(text),
          target_area: [this.city.name, this.city.prefecture],
        });
      });

    } catch (error) {
      // Ignore errors
    }

    return subsidies;
  }

  private isSubsidyRelated(text: string): boolean {
    return SUBSIDY_KEYWORDS.some(kw => text.includes(kw));
  }

  private isExcluded(text: string): boolean {
    return EXCLUDE_KEYWORDS.some(kw => text.includes(kw));
  }

  private isFileLink(url: string): boolean {
    const fileExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.zip'];
    return fileExtensions.some(ext => url.toLowerCase().includes(ext));
  }

  private cleanTitle(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/【.+?】/g, '')
      .replace(/\[.+?\]/g, '')
      .replace(/^・/, '')
      .trim();
  }

  private resolveUrl(href: string, baseUrl: string): string {
    if (href.startsWith('http')) return href;
    if (href.startsWith('//')) return 'https:' + href;
    if (href.startsWith('/')) {
      const base = new URL(baseUrl);
      return `${base.protocol}//${base.host}${href}`;
    }
    if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return '';
    }
    const base = baseUrl.substring(0, baseUrl.lastIndexOf('/') + 1);
    return base + href;
  }

  private generateId(url: string, title: string): string {
    const urlHash = url.replace(/[^a-zA-Z0-9]/g, '').slice(-20);
    const titleHash = Buffer.from(title).toString('base64').slice(0, 10).replace(/[^a-zA-Z0-9]/g, '');
    return `${urlHash}_${titleHash}`;
  }

  private removeDuplicates(subsidies: ScrapedSubsidy[]): ScrapedSubsidy[] {
    const seen = new Set<string>();
    return subsidies.filter(s => {
      if (seen.has(s.source_id)) return false;
      seen.add(s.source_id);
      return true;
    });
  }

  /**
   * 詳細ページから追加情報を取得
   */
  async fetchDetail(subsidy: ScrapedSubsidy): Promise<void> {
    try {
      const response = await fetch(subsidy.source_url, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
      });

      if (!response.ok) return;

      const html = await response.text();
      const $ = cheerio.load(html);

      const content = $('article, .content, main, #content').text().trim();
      if (content) {
        const cleaned = cleanDescription(content);
        if (cleaned && cleaned.length > (subsidy.description?.length || 0)) {
          subsidy.description = cleaned.slice(0, 2000);
        }
      }

      const pageText = $('body').text();
      const amountMatch = pageText.match(/(?:補助金額|上限額|補助上限)[：:]\s*([0-9,]+(?:万円|円|億円))/);
      if (amountMatch) {
        subsidy.max_amount = this.parseAmount(amountMatch[1]);
      }

      const rateMatch = pageText.match(/(?:補助率)[：:]\s*([0-9\/]+(?:以内)?)/);
      if (rateMatch) {
        subsidy.subsidy_rate = rateMatch[1];
      }

    } catch (error) {
      // Ignore errors
    }
  }
}

// サポートされている政令指定都市リスト
export const SUPPORTED_CITIES = DESIGNATED_CITIES.map(c => c.name);

