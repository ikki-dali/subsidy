// ディープクローラー型定義

import type { ScrapedSubsidy } from '../scrapers/types';

// ページ種別
export type PageType = 'list' | 'detail' | 'search' | 'other';

// URLキューアイテム
export type UrlQueueItem = {
  url: string;
  depth: number;
  priority: number;
  sourceUrl: string;
  pageType: PageType;
  retryCount: number;
  addedAt: Date;
  context?: Record<string, unknown>;
};

// 抽出されたリンク
export type ExtractedLink = {
  url: string;
  text: string;
  priority: number;
  isDetailLink: boolean;
  context?: Record<string, unknown>;
};

// クローラー設定
export type CrawlerConfig = {
  // 深さ・ページ制限
  maxDepth: number;
  maxPages: number;

  // レート制限
  requestDelay: number;
  concurrency: number;

  // タイムアウト・リトライ
  timeout: number;
  maxRetries: number;
  retryDelay: number;

  // ドメイン制限
  stayInDomain: boolean;
  allowedDomains: string[];

  // レンダリング
  useHeadlessBrowser: boolean | 'auto';

  // robots.txt
  respectRobotsTxt: boolean;

  // ユーザーエージェント
  userAgent: string;

  // ドライラン（DB保存しない）
  dryRun: boolean;
};

// デフォルト設定
export const DEFAULT_CONFIG: CrawlerConfig = {
  maxDepth: 3,
  maxPages: 100,
  requestDelay: 1500,
  concurrency: 2,
  timeout: 30000,
  maxRetries: 3,
  retryDelay: 2000,
  stayInDomain: true,
  allowedDomains: [],
  useHeadlessBrowser: 'auto',
  respectRobotsTxt: true,
  userAgent: 'Mozilla/5.0 (compatible; SubsidyBot/1.0)',
  dryRun: false,
};

// クロール結果
export type CrawlResult = {
  subsidies: ScrapedSubsidy[];
  stats: CrawlStats;
  errors: CrawlError[];
};

// クロール統計
export type CrawlStats = {
  totalUrls: number;
  visitedUrls: number;
  skippedUrls: number;
  subsidiesFound: number;
  startTime: Date;
  endTime?: Date;
  durationMs?: number;
};

// クロールエラー
export type CrawlError = {
  url: string;
  message: string;
  code?: string;
  timestamp: Date;
};

// レンダラーインターフェース
export interface Renderer {
  render(url: string): Promise<RenderedPage | null>;
  cleanup(): Promise<void>;
}

// レンダリング結果
export type RenderedPage = {
  html: string;
  url: string;
  status: number;
  contentType: string;
  loadTime: number;
};

// 補助金抽出結果（部分的）
export type ExtractedSubsidyInfo = Partial<ScrapedSubsidy> & {
  sourceUrl: string;
  rawText?: string;
  confidence: number;
};

// クローラーイベント
export type CrawlerEvent =
  | { type: 'start'; urls: string[] }
  | { type: 'fetch'; url: string; depth: number }
  | { type: 'extract'; url: string; found: boolean }
  | { type: 'queue'; url: string; priority: number }
  | { type: 'skip'; url: string; reason: string }
  | { type: 'error'; url: string; error: string }
  | { type: 'complete'; stats: CrawlStats };

// イベントリスナー
export type CrawlerEventListener = (event: CrawlerEvent) => void;

// ========================================
// Phase 1: robots.txt 関連型
// ========================================

// robots.txt ルール
export type RobotsRule = {
  userAgent: string;
  allow: string[];
  disallow: string[];
  crawlDelay?: number;
};

// robots.txt キャッシュエントリ
export type RobotsCache = {
  rules: RobotsRule[];
  fetchedAt: Date;
  ttl: number;
};

// robots.txt 設定
export type RobotsConfig = {
  cacheTTL: number;       // デフォルト: 3600000（1時間）
  userAgent: string;
  respectRobotsTxt: boolean;
};

// ========================================
// Phase 2: キャッシュ関連型
// ========================================

// キャッシュエントリ
export type CacheEntry = {
  html: string;
  url: string;
  status: number;
  contentType: string;
  cachedAt: Date;
  ttl: number;
  size: number;
};

// キャッシュ統計
export type CacheStats = {
  hits: number;
  misses: number;
  size: number;
  entries: number;
  hitRate: number;
};

// キャッシュ設定
export type CacheConfig = {
  maxSize: number;        // デフォルト: 500
  defaultTTL: number;     // デフォルト: 3600000（1時間）
  persistPath?: string;
  enableDiskCache: boolean;
};

// ========================================
// Phase 3: チェックポイント関連型
// ========================================

// チェックポイント
export type CrawlCheckpoint = {
  id: string;
  name: string;
  config: CrawlerConfig;
  state: {
    visitedUrls: string[];
    queuedItems: UrlQueueItem[];
    currentDepth: number;
  };
  results: {
    subsidies: ScrapedSubsidy[];
    stats: CrawlStats;
    errors: CrawlError[];
  };
  createdAt: Date;
  updatedAt: Date;
};

// チェックポイントサマリー
export type CheckpointSummary = {
  id: string;
  name: string;
  visitedCount: number;
  queuedCount: number;
  subsidiesCount: number;
  createdAt: Date;
  updatedAt: Date;
};

// チェックポイント設定
export type CheckpointConfig = {
  savePath: string;       // デフォルト: '.crawl-checkpoints'
  saveInterval: number;   // デフォルト: 60000（1分）
  autoSave: boolean;
};

// ========================================
// Phase 5: PDF関連型
// ========================================

// PDF抽出結果
export type PdfExtractionResult = {
  url: string;
  text: string;
  pageCount: number;
  subsidy: ExtractedSubsidyInfo | null;
  isImageOnly: boolean;
};

// PDF設定
export type PdfConfig = {
  enabled: boolean;
  maxFileSize: number;    // デフォルト: 10MB
  timeout: number;        // デフォルト: 30000
};
