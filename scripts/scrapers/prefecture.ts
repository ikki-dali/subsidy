/**
 * 都道府県補助金ポータル スクレイパー
 * 各都道府県の公式補助金情報ページをスクレイピング
 */

import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';
import { BaseScraper } from './base';
import type { ScrapedSubsidy } from './types';
import { PREFECTURE_PORTALS, getPrefecturePortal, getAllPrefectureNames, type PrefecturePortal } from './prefecture-urls';
import { cleanDescription } from './clean-description';

// 補助金関連キーワード
const SUBSIDY_KEYWORDS = [
  '補助金', '助成金', '支援金', '給付金', '奨励金',
  '補助事業', '助成事業', '支援事業', '補助制度',
  '中小企業支援', '事業者支援', '創業支援', '販路開拓',
  '設備投資', '人材育成', '雇用支援',
];

// 除外キーワード
const EXCLUDE_KEYWORDS = [
  'ログイン', 'お問い合わせ', 'サイトマップ', 'プライバシー',
  '採用情報', '職員募集', '入札情報', '入札公告',
  'アクセス', '交通案内', 'よくある質問', 'FAQ',
  'メールマガジン', '登録', 'RSS',
];

export class PrefectureScraper extends BaseScraper {
  private prefecture: string;
  private portal: PrefecturePortal | undefined;
  private maxDepth: number;

  constructor(prefecture: string, maxDepth: number = 2) {
    super(`pref:${prefecture}`);
    this.prefecture = prefecture;
    this.portal = getPrefecturePortal(prefecture);
    this.maxDepth = maxDepth;
  }

  async scrape(): Promise<ScrapedSubsidy[]> {
    const subsidies: ScrapedSubsidy[] = [];
    const visitedUrls = new Set<string>();

    if (!this.portal) {
      console.log(`  [${this.prefecture}] ポータル情報がありません`);
      return subsidies;
    }

    // 各URLソースからスクレイプ
    const urls = [
      this.portal.urls.main,
      this.portal.urls.sme,
      this.portal.urls.industry,
      this.portal.urls.startup,
    ].filter((url): url is string => !!url);

    for (const url of urls) {
      try {
        console.log(`  [${this.prefecture}] スクレイプ中: ${url}`);
        const items = await this.scrapeUrl(url, visitedUrls, 0);
        subsidies.push(...items);
        await this.sleep(2000);
      } catch (error) {
        console.error(`  [${this.prefecture}] エラー (${url}):`, error);
      }
    }

    // 重複除去
    const uniqueSubsidies = this.removeDuplicates(subsidies);
    console.log(`  [${this.prefecture}] ${uniqueSubsidies.length}件取得`);

    return uniqueSubsidies;
  }

  private async scrapeUrl(
    url: string,
    visitedUrls: Set<string>,
    depth: number
  ): Promise<ScrapedSubsidy[]> {
    if (depth > this.maxDepth || visitedUrls.has(url)) {
      return [];
    }
    visitedUrls.add(url);

    const subsidies: ScrapedSubsidy[] = [];

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ja,en;q=0.9',
        },
      });

      if (!response.ok) {
        return [];
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // カスタムセレクターがある場合は使用
      if (this.portal?.selectors?.listItem) {
        const items = $(this.portal.selectors.listItem);
        items.each((_, el) => {
          const subsidy = this.parseListItem($, $(el), url);
          if (subsidy) {
            subsidies.push(subsidy);
          }
        });
      } else {
        // デフォルトのスクレイピングロジック
        $('a').each((_, el) => {
          const subsidy = this.parseLink($, $(el), url);
          if (subsidy) {
            subsidies.push(subsidy);
          }
        });
      }

      // 補助金一覧ページへのリンクを再帰的に辿る
      if (depth < this.maxDepth) {
        const listPageLinks: string[] = [];
        $('a').each((_, el) => {
          const href = $(el).attr('href');
          const text = $(el).text().trim();
          if (href && this.isListPageLink(text, href)) {
            const fullUrl = this.resolveUrl(href, url);
            if (!visitedUrls.has(fullUrl) && fullUrl.startsWith('http')) {
              listPageLinks.push(fullUrl);
            }
          }
        });

        // 最大3ページまで
        for (const pageUrl of listPageLinks.slice(0, 3)) {
          await this.sleep(1500);
          const items = await this.scrapeUrl(pageUrl, visitedUrls, depth + 1);
          subsidies.push(...items);
        }
      }

    } catch (error) {
      // Ignore errors for individual URLs
    }

    return subsidies;
  }

  private parseLink($: cheerio.CheerioAPI, $el: cheerio.Cheerio<AnyNode>, baseUrl: string): ScrapedSubsidy | null {
    const text = $el.text().trim();
    const href = $el.attr('href');

    if (!href || !text) return null;
    if (text.length < 5 || text.length > 200) return null;
    if (!this.isSubsidyRelated(text)) return null;
    if (this.isExcluded(text)) return null;

    const fullUrl = this.resolveUrl(href, baseUrl);
    if (!fullUrl.startsWith('http')) return null;

    // PDFやその他のファイルは除外
    if (this.isFileLink(fullUrl)) return null;

    const sourceId = this.generateId(fullUrl, text);

    return {
      source: `pref:${this.prefecture}`,
      source_id: sourceId,
      source_url: fullUrl,
      title: this.cleanTitle(text),
      target_area: [this.prefecture],
    };
  }

  private parseListItem(
    $: cheerio.CheerioAPI,
    $el: cheerio.Cheerio<AnyNode>,
    baseUrl: string
  ): ScrapedSubsidy | null {
    const titleSelector = this.portal?.selectors?.title || 'a, h2, h3, .title';
    const linkSelector = this.portal?.selectors?.link || 'a';

    const title = $el.find(titleSelector).first().text().trim();
    const href = $el.find(linkSelector).first().attr('href');

    if (!title || !href) return null;
    if (title.length < 5 || title.length > 200) return null;
    if (!this.isSubsidyRelated(title)) return null;
    if (this.isExcluded(title)) return null;

    const fullUrl = this.resolveUrl(href, baseUrl);
    if (!fullUrl.startsWith('http')) return null;
    if (this.isFileLink(fullUrl)) return null;

    const sourceId = this.generateId(fullUrl, title);

    // 説明文がある場合は取得
    const description = $el.find('.description, .summary, p').first().text().trim();

    return {
      source: `pref:${this.prefecture}`,
      source_id: sourceId,
      source_url: fullUrl,
      title: this.cleanTitle(title),
      description: cleanDescription(description) || undefined,
      target_area: [this.prefecture],
    };
  }

  private isSubsidyRelated(text: string): boolean {
    return SUBSIDY_KEYWORDS.some(kw => text.includes(kw));
  }

  private isExcluded(text: string): boolean {
    return EXCLUDE_KEYWORDS.some(kw => text.includes(kw));
  }

  private isListPageLink(text: string, href: string): boolean {
    const listKeywords = ['一覧', '補助金', '助成金', '支援制度', '支援事業'];
    return listKeywords.some(kw => text.includes(kw) || href.includes(kw));
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
      const key = s.source_id;
      if (seen.has(key)) return false;
      seen.add(key);
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
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (!response.ok) return;

      const html = await response.text();
      const $ = cheerio.load(html);

      // 説明文
      const content = $('article, .content, main, #content').text().trim();
      if (content) {
        const cleaned = cleanDescription(content);
        if (cleaned && cleaned.length > (subsidy.description?.length || 0)) {
          subsidy.description = cleaned.slice(0, 2000);
        }
      }

      // 金額情報を抽出
      const pageText = $('body').text();
      const amountMatch = pageText.match(/(?:補助金額|上限額|補助上限)[：:]\s*([0-9,]+(?:万円|円|億円))/);
      if (amountMatch) {
        subsidy.max_amount = this.parseAmount(amountMatch[1]);
      }

      // 補助率を抽出
      const rateMatch = pageText.match(/(?:補助率)[：:]\s*([0-9\/]+(?:以内)?)/);
      if (rateMatch) {
        subsidy.subsidy_rate = rateMatch[1];
      }

      // 募集期間を抽出
      const dateMatch = pageText.match(/(?:募集期間|申請期間)[：:]\s*.*?(\d{4})[年\/\-](\d{1,2})[月\/\-](\d{1,2})日?/);
      if (dateMatch) {
        const month = dateMatch[2].padStart(2, '0');
        const day = dateMatch[3].padStart(2, '0');
        subsidy.end_date = `${dateMatch[1]}-${month}-${day}`;
      }

    } catch (error) {
      // Ignore detail fetch errors
    }
  }
}

// サポートされている都道府県リスト
export const SUPPORTED_PREFECTURES = getAllPrefectureNames();

// 全都道府県ポータル情報をエクスポート
export { PREFECTURE_PORTALS };
