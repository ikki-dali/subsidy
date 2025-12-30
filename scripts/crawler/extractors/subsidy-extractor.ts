// 補助金情報抽出

import * as cheerio from 'cheerio';
import type { ExtractedSubsidyInfo, PageType } from '../types';
import { SUBSIDY_EXTRACTION, getSitePattern, detectPageType } from '../config';
import { cleanDescription, stripHtml } from '../../scrapers/clean-description';
import {
  parseAmount,
  parseDate,
  parseSubsidyRate,
} from '../../normalize';

export class SubsidyExtractor {
  // ページから補助金情報を抽出
  extract(html: string, url: string): ExtractedSubsidyInfo | null {
    const $ = cheerio.load(html);
    const pageText = $('body').text();

    // 補助金ページかどうか判定
    if (!this.isSubsidyPage(pageText)) {
      return null;
    }

    const sitePattern = getSitePattern(url);

    // タイトル抽出
    const title = this.extractTitle($, sitePattern);
    if (!title) {
      return null;
    }

    // 各種情報抽出
    const amount = this.extractAmount(pageText);
    const deadline = this.extractDeadline(pageText);
    const subsidyRate = this.extractSubsidyRate(pageText);
    const targetAudience = this.extractTargetAudience(pageText);
    const description = this.extractDescription($, pageText, title);
    const pdfUrls = this.extractPdfUrls($, url);
    const applicationUrl = this.extractApplicationUrl($, url);

    // 信頼度スコア計算
    const confidence = this.calculateConfidence({
      title,
      amount,
      deadline,
      subsidyRate,
      description,
    });

    return {
      title,
      source: this.extractSource(url),
      source_id: this.generateSourceId(url, title),
      sourceUrl: url,
      max_amount: amount,
      subsidy_rate: subsidyRate,
      end_date: deadline,
      description: description || undefined,
      target_area: this.extractTargetArea(pageText, url),
      rawText: pageText.slice(0, 5000),
      confidence,
    };
  }

  // ページ種別を判定
  detectPageType(html: string, url: string): PageType {
    return detectPageType(html, url);
  }

  // 補助金ページかどうか判定
  private isSubsidyPage(text: string): boolean {
    let matchCount = 0;
    for (const indicator of SUBSIDY_EXTRACTION.subsidyIndicators) {
      if (text.includes(indicator)) {
        matchCount++;
      }
    }
    // 2つ以上のキーワードがあれば補助金ページと判定
    return matchCount >= 2;
  }

  // タイトル抽出
  private extractTitle($: cheerio.CheerioAPI, sitePattern?: ReturnType<typeof getSitePattern>): string | null {
    const selectors = sitePattern?.titleSelector
      ? [sitePattern.titleSelector, ...SUBSIDY_EXTRACTION.titleSelectors]
      : SUBSIDY_EXTRACTION.titleSelectors;

    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        const text = element.text().trim();
        if (text.length > 5 && text.length < 200) {
          return text;
        }
      }
    }

    // <title>タグからフォールバック
    const titleTag = $('title').text().trim();
    if (titleTag) {
      // サイト名を除去
      const cleaned = titleTag
        .replace(/\s*[|\-–—]\s*.+$/, '')
        .replace(/\s*[:：]\s*.+$/, '')
        .trim();
      if (cleaned.length > 5) {
        return cleaned;
      }
    }

    return null;
  }

  // 金額抽出
  private extractAmount(text: string): number | undefined {
    for (const pattern of SUBSIDY_EXTRACTION.amountPatterns) {
      const match = text.match(pattern);
      if (match) {
        const numStr = match[1].replace(/,/g, '');
        const unit = match[2];
        let amount = parseFloat(numStr);

        if (unit === '億') {
          amount *= 100000000;
        } else if (unit === '万') {
          amount *= 10000;
        }

        if (amount > 0 && amount < 100000000000) { // 1000億未満
          return amount;
        }
      }
    }

    // フォールバック: normalize関数を使用
    const simpleMatch = text.match(/([0-9,]+(?:\.[0-9]+)?)(億|万)?円/);
    if (simpleMatch) {
      return parseAmount(simpleMatch[0]);
    }

    return undefined;
  }

  // 締切抽出
  private extractDeadline(text: string): string | undefined {
    for (const pattern of SUBSIDY_EXTRACTION.deadlinePatterns) {
      const match = text.match(pattern);
      if (match) {
        const dateStr = match[1] || match[0];
        const parsed = parseDate(dateStr);
        if (parsed) {
          return parsed;
        }
      }
    }
    return undefined;
  }

  // 補助率抽出
  private extractSubsidyRate(text: string): string | undefined {
    for (const pattern of SUBSIDY_EXTRACTION.subsidyRatePatterns) {
      const match = text.match(pattern);
      if (match) {
        const rateStr = match[1];
        const parsed = parseSubsidyRate(rateStr);
        if (parsed) {
          return parsed;
        }
        return rateStr;
      }
    }
    return undefined;
  }

  // 対象者抽出
  private extractTargetAudience(text: string): string | undefined {
    for (const pattern of SUBSIDY_EXTRACTION.targetPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    return undefined;
  }

  // 説明文抽出
  private extractDescription(
    $: cheerio.CheerioAPI,
    pageText: string,
    title: string
  ): string | null {
    // メインコンテンツを探す
    const mainSelectors = [
      '.main-content',
      '#main',
      'article',
      '.content',
      '.detail-content',
    ];

    let content = '';
    for (const selector of mainSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        content = element.text().trim();
        if (content.length > 100) {
          break;
        }
      }
    }

    if (!content) {
      content = pageText;
    }

    // タイトルを除去して先頭部分を取得
    const cleaned = cleanDescription(content);
    if (!cleaned) {
      return null;
    }

    // タイトル部分を除去
    let description = cleaned.replace(title, '').trim();

    // 最初の1000文字を取得
    if (description.length > 1000) {
      description = description.slice(0, 1000) + '...';
    }

    return description || null;
  }

  // PDF URL抽出
  private extractPdfUrls($: cheerio.CheerioAPI, baseUrl: string): string[] {
    const pdfUrls: string[] = [];
    const seen = new Set<string>();

    $('a[href$=".pdf"]').each((_, el) => {
      const href = $(el).attr('href');
      if (href) {
        try {
          const absoluteUrl = new URL(href, baseUrl).href;
          if (!seen.has(absoluteUrl)) {
            seen.add(absoluteUrl);
            pdfUrls.push(absoluteUrl);
          }
        } catch {
          // URL解析エラーは無視
        }
      }
    });

    return pdfUrls;
  }

  // 申請ページURL抽出
  private extractApplicationUrl($: cheerio.CheerioAPI, baseUrl: string): string | undefined {
    const applicationKeywords = ['申請', '応募', '申し込み', 'apply', 'application'];

    for (const keyword of applicationKeywords) {
      const link = $(`a:contains("${keyword}")`).first();
      if (link.length > 0) {
        const href = link.attr('href');
        if (href) {
          try {
            return new URL(href, baseUrl).href;
          } catch {
            // URL解析エラーは無視
          }
        }
      }
    }

    return undefined;
  }

  // 対象地域抽出
  private extractTargetArea(text: string, url: string): string[] {
    const areas: string[] = [];

    // URLから地域を推測
    const prefectures = [
      '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
      '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
      '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県',
      '岐阜県', '静岡県', '愛知県', '三重県',
      '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県',
      '鳥取県', '島根県', '岡山県', '広島県', '山口県',
      '徳島県', '香川県', '愛媛県', '高知県',
      '福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
    ];

    // テキストから地域を検出
    for (const pref of prefectures) {
      if (text.includes(pref) || url.includes(pref.replace('県', '').replace('府', '').replace('都', ''))) {
        areas.push(pref);
      }
    }

    // 「全国」の検出
    if (text.includes('全国') || areas.length === 0) {
      if (url.includes('.go.jp') && !url.includes('pref.') && !url.includes('city.')) {
        areas.push('全国');
      }
    }

    return areas.length > 0 ? areas : ['全国'];
  }

  // ソース名抽出
  private extractSource(url: string): string {
    try {
      const hostname = new URL(url).hostname;
      // ドメインからソース名を生成
      const parts = hostname.split('.');
      if (parts.length >= 2) {
        return parts[parts.length - 2];
      }
      return hostname;
    } catch {
      return 'unknown';
    }
  }

  // ソースID生成
  private generateSourceId(url: string, title: string): string {
    try {
      const urlObj = new URL(url);
      const pathHash = this.simpleHash(urlObj.pathname);
      const titleHash = this.simpleHash(title.slice(0, 50));
      return `${pathHash}-${titleHash}`;
    } catch {
      return this.simpleHash(url + title);
    }
  }

  // シンプルなハッシュ関数
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  // 信頼度スコア計算
  private calculateConfidence(data: {
    title: string | null;
    amount?: number;
    deadline?: string;
    subsidyRate?: string;
    description: string | null;
  }): number {
    let score = 0;

    if (data.title) score += 30;
    if (data.amount) score += 20;
    if (data.deadline) score += 15;
    if (data.subsidyRate) score += 15;
    if (data.description && data.description.length > 50) score += 20;

    return Math.min(100, score);
  }
}

// シングルトンインスタンス
export const subsidyExtractor = new SubsidyExtractor();
