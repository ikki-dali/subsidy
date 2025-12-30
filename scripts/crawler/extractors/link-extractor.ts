// リンク抽出

import * as cheerio from 'cheerio';
import type { ExtractedLink } from '../types';
import { DETAIL_LINK_PATTERNS, getSitePattern, shouldExcludeUrl } from '../config';
import { calculatePriority, isDetailLink, PRIORITY } from '../core/url-queue';

export class LinkExtractor {
  // ページからリンクを抽出
  extract(html: string, baseUrl: string, options: ExtractOptions = {}): ExtractedLink[] {
    const $ = cheerio.load(html);
    const links: ExtractedLink[] = [];
    const seen = new Set<string>();
    const baseDomain = this.extractDomain(baseUrl);

    const sitePattern = getSitePattern(baseUrl);

    // <a>タグからリンク抽出
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim();

      if (!href) return;

      // 絶対URLに変換
      const absoluteUrl = this.resolveUrl(href, baseUrl);
      if (!absoluteUrl) return;

      // 重複チェック
      const normalizedUrl = this.normalizeUrl(absoluteUrl);
      if (seen.has(normalizedUrl)) return;

      // 除外チェック
      if (shouldExcludeUrl(absoluteUrl)) return;

      // ドメイン制限チェック
      if (options.stayInDomain) {
        const linkDomain = this.extractDomain(absoluteUrl);
        if (linkDomain !== baseDomain) return;
      }

      // 許可ドメインチェック
      if (options.allowedDomains && options.allowedDomains.length > 0) {
        const linkDomain = this.extractDomain(absoluteUrl);
        const isAllowed = options.allowedDomains.some(d => linkDomain.includes(d));
        if (!isAllowed) return;
      }

      seen.add(normalizedUrl);

      // 優先度計算
      const priority = calculatePriority(absoluteUrl, text);
      const isDetail = isDetailLink(absoluteUrl, text);

      links.push({
        url: absoluteUrl,
        text: text.slice(0, 200),
        priority,
        isDetailLink: isDetail,
      });
    });

    // ボタン要素もチェック（SPA対応）
    $('button[data-href], [role="link"][data-href]').each((_, el) => {
      const href = $(el).attr('data-href') || $(el).attr('data-url');
      if (!href) return;

      const absoluteUrl = this.resolveUrl(href, baseUrl);
      if (!absoluteUrl) return;

      const normalizedUrl = this.normalizeUrl(absoluteUrl);
      if (seen.has(normalizedUrl)) return;

      if (shouldExcludeUrl(absoluteUrl)) return;

      seen.add(normalizedUrl);

      const text = $(el).text().trim();
      const priority = calculatePriority(absoluteUrl, text);

      links.push({
        url: absoluteUrl,
        text: text.slice(0, 200),
        priority,
        isDetailLink: isDetailLink(absoluteUrl, text),
      });
    });

    // サイト固有セレクタからも抽出
    if (sitePattern) {
      for (const selector of sitePattern.listSelectors) {
        $(selector).find('a[href]').each((_, el) => {
          const href = $(el).attr('href');
          if (!href) return;

          const absoluteUrl = this.resolveUrl(href, baseUrl);
          if (!absoluteUrl) return;

          const normalizedUrl = this.normalizeUrl(absoluteUrl);
          if (seen.has(normalizedUrl)) return;

          if (shouldExcludeUrl(absoluteUrl)) return;

          seen.add(normalizedUrl);

          const text = $(el).text().trim();

          // サイト固有セレクタからのリンクは優先度を上げる
          links.push({
            url: absoluteUrl,
            text: text.slice(0, 200),
            priority: PRIORITY.HIGH,
            isDetailLink: true,
          });
        });
      }
    }

    // 優先度でソート（高い順）
    links.sort((a, b) => b.priority - a.priority);

    // 最大件数制限
    const maxLinks = options.maxLinks ?? 100;
    return links.slice(0, maxLinks);
  }

  // ページネーションリンクを抽出
  extractPaginationLinks(html: string, baseUrl: string): ExtractedLink[] {
    const $ = cheerio.load(html);
    const links: ExtractedLink[] = [];
    const seen = new Set<string>();

    // ページネーション要素を探す
    const paginationSelectors = [
      '.pagination a',
      '.pager a',
      '[class*="page"] a',
      'nav[aria-label*="ページ"] a',
      'nav[aria-label*="pagination"] a',
    ];

    for (const selector of paginationSelectors) {
      $(selector).each((_, el) => {
        const href = $(el).attr('href');
        const text = $(el).text().trim();

        if (!href) return;

        // 数字または「次へ」系のリンクのみ
        if (!/^\d+$/.test(text) && !/次|next|＞|→/i.test(text)) return;

        const absoluteUrl = this.resolveUrl(href, baseUrl);
        if (!absoluteUrl) return;

        const normalizedUrl = this.normalizeUrl(absoluteUrl);
        if (seen.has(normalizedUrl)) return;

        seen.add(normalizedUrl);

        links.push({
          url: absoluteUrl,
          text,
          priority: PRIORITY.MEDIUM,
          isDetailLink: false,
        });
      });
    }

    return links;
  }

  // 詳細リンクのみ抽出
  extractDetailLinks(html: string, baseUrl: string): ExtractedLink[] {
    const $ = cheerio.load(html);
    const links: ExtractedLink[] = [];
    const seen = new Set<string>();

    // セレクタベースで抽出
    for (const selector of DETAIL_LINK_PATTERNS.selectors) {
      $(selector).each((_, el) => {
        const href = $(el).attr('href');
        if (!href) return;

        const absoluteUrl = this.resolveUrl(href, baseUrl);
        if (!absoluteUrl) return;

        const normalizedUrl = this.normalizeUrl(absoluteUrl);
        if (seen.has(normalizedUrl)) return;

        seen.add(normalizedUrl);

        const text = $(el).text().trim();

        links.push({
          url: absoluteUrl,
          text: text.slice(0, 200),
          priority: PRIORITY.HIGHEST,
          isDetailLink: true,
        });
      });
    }

    // テキストベースで抽出
    $('a[href]').each((_, el) => {
      const text = $(el).text().trim().toLowerCase();
      const matched = DETAIL_LINK_PATTERNS.textPatterns.some(
        pattern => text.includes(pattern.toLowerCase())
      );

      if (!matched) return;

      const href = $(el).attr('href');
      if (!href) return;

      const absoluteUrl = this.resolveUrl(href, baseUrl);
      if (!absoluteUrl) return;

      const normalizedUrl = this.normalizeUrl(absoluteUrl);
      if (seen.has(normalizedUrl)) return;

      seen.add(normalizedUrl);

      links.push({
        url: absoluteUrl,
        text: $(el).text().trim().slice(0, 200),
        priority: PRIORITY.HIGHEST,
        isDetailLink: true,
      });
    });

    // 補助金特有セレクタ
    for (const selector of DETAIL_LINK_PATTERNS.subsidySelectors) {
      $(selector).each((_, el) => {
        const href = $(el).attr('href');
        if (!href) return;

        const absoluteUrl = this.resolveUrl(href, baseUrl);
        if (!absoluteUrl) return;

        const normalizedUrl = this.normalizeUrl(absoluteUrl);
        if (seen.has(normalizedUrl)) return;

        seen.add(normalizedUrl);

        const text = $(el).text().trim();

        links.push({
          url: absoluteUrl,
          text: text.slice(0, 200),
          priority: PRIORITY.HIGH,
          isDetailLink: true,
        });
      });
    }

    return links;
  }

  // PDFリンクを抽出
  extractPdfLinks(html: string, baseUrl: string): ExtractedLink[] {
    const $ = cheerio.load(html);
    const links: ExtractedLink[] = [];
    const seen = new Set<string>();

    $('a[href$=".pdf"], a[href*=".pdf?"]').each((_, el) => {
      const href = $(el).attr('href');
      if (!href) return;

      const absoluteUrl = this.resolveUrl(href, baseUrl);
      if (!absoluteUrl) return;

      const normalizedUrl = this.normalizeUrl(absoluteUrl);
      if (seen.has(normalizedUrl)) return;

      seen.add(normalizedUrl);

      const text = $(el).text().trim();

      // 補助金関連のキーワードがあれば優先度を上げる
      const subsidyKeywords = ['補助', '助成', '募集', '要項', '申請', '公募'];
      const hasSubsidyKeyword = subsidyKeywords.some(kw => text.includes(kw));

      links.push({
        url: absoluteUrl,
        text: text.slice(0, 200) || 'PDF',
        priority: hasSubsidyKeyword ? PRIORITY.HIGH : PRIORITY.MEDIUM,
        isDetailLink: true,
      });
    });

    return links;
  }

  // URLを解決（相対→絶対）
  private resolveUrl(href: string, baseUrl: string): string | null {
    try {
      // プロトコル相対URLの処理
      if (href.startsWith('//')) {
        const baseProtocol = new URL(baseUrl).protocol;
        href = baseProtocol + href;
      }

      const resolved = new URL(href, baseUrl);

      // httpとhttpsのみ許可
      if (!['http:', 'https:'].includes(resolved.protocol)) {
        return null;
      }

      return resolved.href;
    } catch {
      return null;
    }
  }

  // URL正規化
  private normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      // ハッシュを除去
      urlObj.hash = '';
      // 末尾スラッシュを統一
      let normalized = urlObj.href;
      if (normalized.endsWith('/') && urlObj.pathname !== '/') {
        normalized = normalized.slice(0, -1);
      }
      return normalized;
    } catch {
      return url;
    }
  }

  // ドメイン抽出
  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  }
}

export type ExtractOptions = {
  stayInDomain?: boolean;
  allowedDomains?: string[];
  maxLinks?: number;
};

// シングルトンインスタンス
export const linkExtractor = new LinkExtractor();
