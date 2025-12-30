// ディープクローラー設定・パターン定義

import type { CrawlerConfig, PageType } from './types';
import { DEFAULT_CONFIG } from './types';

// 設定をマージ
export function mergeConfig(partial: Partial<CrawlerConfig>): CrawlerConfig {
  return { ...DEFAULT_CONFIG, ...partial };
}

// ========================================
// 抽出パターン定義
// ========================================

// 詳細リンク検出パターン
export const DETAIL_LINK_PATTERNS = {
  // テキストベース
  textPatterns: [
    '詳細',
    '詳しく',
    'もっと見る',
    '続きを読む',
    'more',
    '→',
    '＞＞',
    'こちら',
    '募集要項',
    '公募情報',
    '申請',
  ],

  // CSSセレクタ
  selectors: [
    'a[href*="detail"]',
    'a[href*="view"]',
    'a[href*="show"]',
    '.detail-link',
    '.more-link',
    '[class*="detail"]',
    '[class*="more"]',
  ],

  // 補助金特有
  subsidySelectors: [
    'a[href*="subsidy"]',
    'a[href*="hojo"]',
    'a[href*="josei"]',
    'a[href*="shien"]',
    'a[href*="koubo"]',
    'a[href*="boshu"]',
  ],
};

// 補助金情報抽出パターン
export const SUBSIDY_EXTRACTION = {
  // タイトル（優先順）
  titleSelectors: [
    'h1',
    '.page-title',
    '.entry-title',
    '#page-title',
    '[class*="title"]:not(head title)',
    'article h2:first-of-type',
  ],

  // 金額パターン
  amountPatterns: [
    /(?:補助|助成)(?:金)?(?:額|上限)[：:\s]*([0-9,]+(?:\.[0-9]+)?)(億|万)?円/,
    /(?:上限|最大|限度額)[：:\s]*([0-9,]+(?:\.[0-9]+)?)(億|万)?円/,
    /([0-9,]+(?:\.[0-9]+)?)(億|万)?円(?:まで|以内|を上限)/,
    /補助金額[：:\s]*([0-9,]+(?:\.[0-9]+)?)(億|万)?円/,
    /([0-9,]+(?:\.[0-9]+)?)(億|万)?円(?:\/件|以下)/,
  ],

  // 締切パターン
  deadlinePatterns: [
    /(?:募集|申請|受付)期(?:間|限)[：:\s]*(.+?)(?:\n|$)/,
    /(?:締切|〆切)[：:\s]*(.+?)(?:\n|$)/,
    /(令和\d+年\d{1,2}月\d{1,2}日)/,
    /(\d{4}[年\/\-]\d{1,2}[月\/\-]\d{1,2}日?)/,
    /～\s*(\d{4}[年\/\-]\d{1,2}[月\/\-]\d{1,2}日?)/,
  ],

  // 補助率パターン
  subsidyRatePatterns: [
    /(?:補助率|助成率)[：:\s]*([\d\/]+(?:～|〜|~|以内)?[\d\/]*)/,
    /([1234]\/[234])(?:以内)?/,
    /(\d{1,3})%(?:以内)?/,
    /(?:補助率|助成率)[：:\s]*(\d{1,3}(?:\.\d+)?%)/,
  ],

  // 対象者パターン
  targetPatterns: [
    /(?:対象|該当)(?:者|事業者)?[：:\s]*([^。\n]{10,200})/,
    /(?:申請|応募)(?:資格|要件)[：:\s]*([^。\n]{10,200})/,
    /(?:補助対象)[：:\s]*([^。\n]{10,200})/,
  ],

  // 補助金ページ判定キーワード
  subsidyIndicators: [
    '補助金',
    '助成金',
    '補助率',
    '上限額',
    '交付',
    '公募',
    '募集要項',
    '申請',
    '支援事業',
  ],
};

// サイト別カスタムパターン
export const SITE_PATTERNS: Record<string, SitePattern> = {
  'tokyo-kosha.or.jp': {
    name: '東京都中小企業振興公社',
    listSelectors: ['.support-list li', '.josei-list li', '.subsidy-list li'],
    detailSelectors: ['.detail-content', '.main-content', '#content'],
    titleSelector: 'h1, .page-title',
    subsidyIndicators: ['助成', '補助', '支援事業'],
  },
  'metro.tokyo.lg.jp': {
    name: '東京都',
    listSelectors: ['.news-list a', '.link-list a', '.article-list li'],
    detailSelectors: ['.detail-content', '.main-content', '#main'],
    titleSelector: 'h1, .page-title, #page-title',
    subsidyIndicators: ['助成', '補助', '支援'],
  },
  'meti.go.jp': {
    name: '経済産業省',
    listSelectors: ['.news-list a', '.card a', '.link-list li'],
    detailSelectors: ['.main-content', '#content', 'article'],
    titleSelector: 'h1',
    pdfSelectors: ['a[href$=".pdf"]'],
    subsidyIndicators: ['補助金', '支援', '公募'],
  },
  'j-net21.smrj.go.jp': {
    name: 'J-Net21',
    listSelectors: ['ul.HL-resultList > li', '.article-list .item'],
    detailSelectors: ['.article-detail', '.main-content'],
    titleSelector: 'h1, .title, a.title',
    subsidyIndicators: ['補助金', '助成金', '融資'],
  },
  'mirasapo-plus.go.jp': {
    name: 'ミラサポplus',
    listSelectors: ['.subsidy-list li', '.card-list .card'],
    detailSelectors: ['.subsidy-detail', '.main-content'],
    titleSelector: 'h1, .subsidy-title',
    subsidyIndicators: ['補助金', '支援制度'],
  },
};

export type SitePattern = {
  name: string;
  listSelectors: string[];
  detailSelectors: string[];
  titleSelector: string;
  pdfSelectors?: string[];
  subsidyIndicators: string[];
  customExtractor?: (html: string, url: string) => Record<string, unknown>;
};

// サイトパターンを取得
export function getSitePattern(url: string): SitePattern | undefined {
  try {
    const hostname = new URL(url).hostname;
    for (const [domain, pattern] of Object.entries(SITE_PATTERNS)) {
      if (hostname.includes(domain)) {
        return pattern;
      }
    }
  } catch {
    // URL解析エラーは無視
  }
  return undefined;
}

// ========================================
// ページ種別判定
// ========================================

export function detectPageType(html: string, url: string): PageType {
  const lowerHtml = html.toLowerCase();
  const lowerUrl = url.toLowerCase();

  // URL から判定
  if (lowerUrl.includes('detail') || lowerUrl.includes('view') || lowerUrl.includes('show')) {
    return 'detail';
  }
  if (lowerUrl.includes('search') || lowerUrl.includes('kensaku')) {
    return 'search';
  }
  if (lowerUrl.includes('list') || lowerUrl.includes('ichiran')) {
    return 'list';
  }

  // コンテンツから判定
  const hasSubsidyKeywords =
    lowerHtml.includes('補助率') ||
    lowerHtml.includes('補助上限') ||
    lowerHtml.includes('申請方法') ||
    lowerHtml.includes('募集要項');

  if (hasSubsidyKeywords) {
    return 'detail';
  }

  // 一覧ページ判定
  const listIndicators = [
    /<table[^>]*>[\s\S]*?<tr>[\s\S]*?<\/tr>[\s\S]*?<tr>/,
    /<ul[^>]*class="[^"]*list[^"]*">/,
    /class="[^"]*news-list[^"]*"/,
  ];

  for (const pattern of listIndicators) {
    if (pattern.test(html)) {
      return 'list';
    }
  }

  // 検索フォーム判定
  if (/<form[^>]*>[\s\S]*?<input[^>]*type="search"/.test(html) ||
      /<input[^>]*name="[^"]*keyword[^"]*"/.test(html)) {
    return 'search';
  }

  return 'other';
}

// ========================================
// 動的ページ判定
// ========================================

export const DYNAMIC_PAGE_PATTERNS = [
  /id="__next"/,          // Next.js
  /id="__nuxt"/,          // Nuxt.js
  /id="app"/,             // Vue.js
  /ng-app/,               // AngularJS
  /data-reactroot/,       // React
  /<noscript>[\s\S]*?JavaScript/,  // JS必須メッセージ
  /window\.__NUXT__/,     // Nuxt.js
  /window\.__NEXT_DATA__/,// Next.js
];

export function needsDynamicRendering(html: string): boolean {
  for (const pattern of DYNAMIC_PAGE_PATTERNS) {
    if (pattern.test(html)) {
      return true;
    }
  }

  // コンテンツが極端に少ない場合もJS実行が必要かも
  const textContent = html.replace(/<[^>]*>/g, '').trim();
  if (textContent.length < 500 && html.includes('<script')) {
    return true;
  }

  return false;
}

// ========================================
// 除外パターン
// ========================================

export const EXCLUDE_URL_PATTERNS = [
  /\/login\/?$/i,
  /\/logout\/?$/i,
  /\/signup\/?$/i,
  /\/register\/?$/i,
  /\/contact\/?$/i,
  /\/faq\/?$/i,
  /\/privacy\/?$/i,
  /\/terms\/?$/i,
  /\/sitemap/i,
  /\/rss/i,
  /\/feed/i,
  /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar)$/i,
  /\.(jpg|jpeg|png|gif|svg|webp|ico)$/i,
  /\.(css|js|json|xml)$/i,
];

export function shouldExcludeUrl(url: string): boolean {
  for (const pattern of EXCLUDE_URL_PATTERNS) {
    if (pattern.test(url)) {
      return true;
    }
  }
  return false;
}
