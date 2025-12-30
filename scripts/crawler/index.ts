// ディープクローラー エクスポート

// 型定義
export type {
  PageType,
  UrlQueueItem,
  ExtractedLink,
  CrawlerConfig,
  CrawlResult,
  CrawlStats,
  CrawlError,
  Renderer,
  RenderedPage,
  ExtractedSubsidyInfo,
  CrawlerEvent,
  CrawlerEventListener,
  // Phase 1: robots.txt
  RobotsRule,
  RobotsCache,
  RobotsConfig,
  // Phase 2: キャッシュ
  CacheEntry,
  CacheStats,
  CacheConfig,
  // Phase 3: チェックポイント
  CrawlCheckpoint,
  CheckpointSummary,
  CheckpointConfig,
  // Phase 5: PDF
  PdfExtractionResult,
  PdfConfig,
} from './types';

export { DEFAULT_CONFIG } from './types';

// コア
export { CrawlerEngine } from './core/crawler-engine';
export { UrlQueue, calculatePriority, isDetailLink, PRIORITY } from './core/url-queue';
export { RateLimiter, throttle, parallelMap } from './core/rate-limiter';
export { RobotsParser, getRobotsParser, resetRobotsParser } from './core/robots-parser';
export { ResponseCache, getResponseCache, resetResponseCache } from './core/response-cache';
export { CheckpointManager, getCheckpointManager, resetCheckpointManager } from './core/checkpoint-manager';

// 抽出
export { SubsidyExtractor, subsidyExtractor } from './extractors/subsidy-extractor';
export { LinkExtractor, linkExtractor } from './extractors/link-extractor';
export { PdfExtractor, getPdfExtractor, resetPdfExtractor } from './extractors/pdf-extractor';

// レンダラー
export { StaticRenderer, getStaticRenderer } from './renderers/static-renderer';
export {
  DynamicRenderer,
  getDynamicRenderer,
  needsDynamicRendering,
  autoSelectRenderer,
} from './renderers/dynamic-renderer';

// 設定
export {
  mergeConfig,
  DETAIL_LINK_PATTERNS,
  SUBSIDY_EXTRACTION,
  SITE_PATTERNS,
  getSitePattern,
  detectPageType,
  DYNAMIC_PAGE_PATTERNS,
  EXCLUDE_URL_PATTERNS,
  shouldExcludeUrl,
} from './config';

// 日次同期ターゲット設定
export {
  DAILY_DEEP_CRAWL_TARGETS,
  DAY_NAMES,
  DEEP_CRAWL_TIMEOUT,
  DEEP_CRAWL_CONFIG,
  getTodaysTargets,
  getTargetsForDay,
  hasTargetsToday,
  printSchedule,
} from './config/daily-targets';

// 便利な関数
export async function crawl(
  urls: string[],
  config?: Partial<import('./types').CrawlerConfig>
): Promise<import('./types').CrawlResult> {
  const { CrawlerEngine } = await import('./core/crawler-engine');
  const engine = new CrawlerEngine(config);
  return engine.crawl(urls);
}
