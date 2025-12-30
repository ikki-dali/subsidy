// クローラーエンジン

import type {
  CrawlerConfig,
  CrawlResult,
  CrawlStats,
  CrawlError,
  CrawlerEvent,
  CrawlerEventListener,
  RenderedPage,
  ExtractedSubsidyInfo,
} from '../types';
import type { ScrapedSubsidy } from '../../scrapers/types';
import { DEFAULT_CONFIG } from '../types';
import type { CacheConfig } from '../types';
import { UrlQueue, calculatePriority, isDetailLink } from './url-queue';
import { RateLimiter } from './rate-limiter';
import { RobotsParser } from './robots-parser';
import { ResponseCache } from './response-cache';
import { CheckpointManager } from './checkpoint-manager';
import { SubsidyExtractor } from '../extractors/subsidy-extractor';
import { LinkExtractor } from '../extractors/link-extractor';
import { PdfExtractor } from '../extractors/pdf-extractor';
import { StaticRenderer } from '../renderers/static-renderer';
import { DynamicRenderer, needsDynamicRendering } from '../renderers/dynamic-renderer';
import { detectPageType } from '../config';
import type { PdfConfig } from '../types';

export class CrawlerEngine {
  private config: CrawlerConfig;
  private cacheConfig: CacheConfig;
  private pdfConfig: PdfConfig;
  private queue: UrlQueue;
  private rateLimiter: RateLimiter;
  private robotsParser: RobotsParser;
  private responseCache: ResponseCache;
  private checkpointManager: CheckpointManager;
  private subsidyExtractor: SubsidyExtractor;
  private linkExtractor: LinkExtractor;
  private pdfExtractor: PdfExtractor;
  private staticRenderer: StaticRenderer;
  private dynamicRenderer: DynamicRenderer;

  private subsidies: ScrapedSubsidy[] = [];
  private errors: CrawlError[] = [];
  private stats: CrawlStats & { cacheHits?: number };
  private eventListeners: CrawlerEventListener[] = [];
  private isRunning = false;
  private robotsCheckedDomains: Set<string> = new Set();
  private currentDepth = 0;
  private crawlName = '';

  constructor(
    config: Partial<CrawlerConfig> = {},
    cacheConfig?: Partial<CacheConfig>,
    pdfConfig?: Partial<PdfConfig>
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.cacheConfig = {
      maxSize: cacheConfig?.maxSize ?? 500,
      defaultTTL: cacheConfig?.defaultTTL ?? 3600000,
      enableDiskCache: cacheConfig?.enableDiskCache ?? false,
      persistPath: cacheConfig?.persistPath,
    };
    this.pdfConfig = {
      enabled: pdfConfig?.enabled ?? false,
      maxFileSize: pdfConfig?.maxFileSize ?? 10 * 1024 * 1024,
      timeout: pdfConfig?.timeout ?? 30000,
    };

    this.queue = new UrlQueue();
    this.rateLimiter = new RateLimiter({
      requestDelay: this.config.requestDelay,
      concurrency: this.config.concurrency,
    });
    this.robotsParser = new RobotsParser({
      userAgent: this.config.userAgent,
      respectRobotsTxt: this.config.respectRobotsTxt,
    });
    this.responseCache = new ResponseCache(this.cacheConfig);
    this.checkpointManager = new CheckpointManager();
    this.subsidyExtractor = new SubsidyExtractor();
    this.linkExtractor = new LinkExtractor();
    this.pdfExtractor = new PdfExtractor(this.pdfConfig);
    this.staticRenderer = new StaticRenderer(this.config);
    this.dynamicRenderer = new DynamicRenderer(this.config);

    this.stats = this.createInitialStats();
  }

  // チェックポイントから再開
  async resumeCrawl(checkpointId: string): Promise<CrawlResult> {
    if (this.isRunning) {
      throw new Error('Crawler is already running');
    }

    const checkpoint = await this.checkpointManager.load(checkpointId);
    if (!checkpoint) {
      throw new Error(`Checkpoint not found: ${checkpointId}`);
    }

    console.log(`[CrawlerEngine] Resuming from checkpoint: ${checkpointId}`);
    console.log(`  Visited: ${checkpoint.state.visitedUrls.length}`);
    console.log(`  Queued: ${checkpoint.state.queuedItems.length}`);
    console.log(`  Subsidies: ${checkpoint.results.subsidies.length}`);

    this.isRunning = true;
    this.crawlName = checkpoint.name;

    // 状態を復元
    this.config = { ...this.config, ...checkpoint.config };
    this.queue.import(checkpoint.state);
    this.subsidies = checkpoint.results.subsidies;
    this.errors = checkpoint.results.errors;
    this.stats = {
      ...checkpoint.results.stats,
      startTime: new Date(), // 再開時刻を更新
    };
    this.currentDepth = checkpoint.state.currentDepth;

    // 自動保存を開始
    this.checkpointManager.startAutoSave(() => this.getCheckpointState(), this.crawlName);

    this.emit({ type: 'start', urls: [] });

    // クロールループを再開
    await this.runCrawlLoop();

    // 完了処理
    this.checkpointManager.stopAutoSave();
    await this.cleanup();

    this.stats.endTime = new Date();
    this.stats.durationMs = this.stats.endTime.getTime() - this.stats.startTime.getTime();
    this.isRunning = false;

    this.emit({ type: 'complete', stats: this.stats });
    console.log(`[CrawlerEngine] Completed: ${this.stats.subsidiesFound} subsidies found`);

    return {
      subsidies: this.subsidies,
      stats: this.stats,
      errors: this.errors,
    };
  }

  // チェックポイント状態を取得
  private getCheckpointState() {
    const queueState = this.queue.export();
    return {
      config: this.config,
      visitedUrls: queueState.visitedUrls,
      queuedItems: queueState.queuedItems,
      currentDepth: this.currentDepth,
      subsidies: this.subsidies,
      stats: this.stats,
      errors: this.errors,
    };
  }

  // クロール実行
  async crawl(entryUrls: string[], name?: string): Promise<CrawlResult> {
    if (this.isRunning) {
      throw new Error('Crawler is already running');
    }

    this.isRunning = true;
    this.reset();
    this.crawlName = name || 'crawl';

    this.emit({ type: 'start', urls: entryUrls });
    console.log(`[CrawlerEngine] Starting crawl with ${entryUrls.length} entry URLs`);

    // エントリーURLをキューに追加
    for (const url of entryUrls) {
      this.queue.enqueue({
        url,
        depth: 0,
        priority: 100,
        sourceUrl: url,
        pageType: 'list',
      });
    }

    // 自動保存を開始
    this.checkpointManager.startAutoSave(() => this.getCheckpointState(), this.crawlName);

    // クロールループ
    await this.runCrawlLoop();

    // 完了処理
    this.checkpointManager.stopAutoSave();
    await this.cleanup();

    this.stats.endTime = new Date();
    this.stats.durationMs = this.stats.endTime.getTime() - this.stats.startTime.getTime();
    this.isRunning = false;

    this.emit({ type: 'complete', stats: this.stats });
    console.log(`[CrawlerEngine] Completed: ${this.stats.subsidiesFound} subsidies found`);

    return {
      subsidies: this.subsidies,
      stats: this.stats,
      errors: this.errors,
    };
  }

  // クロールループ（共通処理）
  private async runCrawlLoop(): Promise<void> {
    while (!this.queue.isEmpty() && this.stats.visitedUrls < this.config.maxPages) {
      const item = this.queue.dequeue();
      if (!item) break;

      // 深さ制限チェック
      if (item.depth > this.config.maxDepth) {
        this.emit({ type: 'skip', url: item.url, reason: 'max depth exceeded' });
        continue;
      }

      this.currentDepth = item.depth;

      try {
        await this.processUrl(item.url, item.depth, item.sourceUrl);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.errors.push({
          url: item.url,
          message,
          timestamp: new Date(),
        });
        this.emit({ type: 'error', url: item.url, error: message });

        // リトライ可能ならキューに戻す
        if (item.retryCount < this.config.maxRetries) {
          this.queue.requeueForRetry(item);
        }
      }
    }
  }

  // 単一URLを処理
  private async processUrl(url: string, depth: number, sourceUrl: string): Promise<void> {
    // robots.txtチェック
    if (this.config.respectRobotsTxt) {
      const allowed = await this.checkRobotsAndApplyDelay(url);
      if (!allowed) {
        this.emit({ type: 'skip', url, reason: 'blocked by robots.txt' });
        console.log(`  [Depth ${depth}] ${url} - BLOCKED by robots.txt`);
        this.stats.skippedUrls++;
        return;
      }
    }

    this.emit({ type: 'fetch', url, depth });
    console.log(`  [Depth ${depth}] ${url}`);

    // レート制限待機
    await this.rateLimiter.waitForSlot(url);

    try {
      // PDF処理
      if (PdfExtractor.isPdfUrl(url)) {
        if (this.pdfConfig.enabled) {
          const pdfResult = await this.pdfExtractor.extract(url);
          if (pdfResult && pdfResult.subsidy && pdfResult.subsidy.title) {
            const subsidy = this.convertToScrapedSubsidy(pdfResult.subsidy);
            this.subsidies.push(subsidy);
            this.stats.subsidiesFound++;
            this.emit({ type: 'extract', url, found: true });
            console.log(`    → Found (PDF): ${pdfResult.subsidy.title.slice(0, 50)}...`);
          } else {
            this.emit({ type: 'extract', url, found: false });
          }
        } else {
          this.emit({ type: 'skip', url, reason: 'PDF extraction disabled' });
        }
        this.queue.markVisited(url);
        this.stats.visitedUrls++;
        return;
      }

      // ページ取得
      const page = await this.fetchPage(url);
      if (!page) {
        this.queue.markVisited(url);
        this.rateLimiter.release();
        return;
      }

      this.queue.markVisited(page.url);
      this.stats.visitedUrls++;

      // ページ種別判定
      const pageType = detectPageType(page.html, page.url);

      // 補助金情報抽出
      if (pageType === 'detail' || pageType === 'other') {
        const subsidyInfo = this.subsidyExtractor.extract(page.html, page.url);
        if (subsidyInfo && subsidyInfo.title) {
          const subsidy = this.convertToScrapedSubsidy(subsidyInfo);
          this.subsidies.push(subsidy);
          this.stats.subsidiesFound++;
          this.emit({ type: 'extract', url: page.url, found: true });
          console.log(`    → Found: ${subsidyInfo.title.slice(0, 50)}...`);
        } else {
          this.emit({ type: 'extract', url: page.url, found: false });
        }
      }

      // リンク抽出（深さ制限内なら）
      if (depth < this.config.maxDepth) {
        const links = this.linkExtractor.extract(page.html, page.url, {
          stayInDomain: this.config.stayInDomain,
          allowedDomains: this.config.allowedDomains,
          maxLinks: 50,
        });

        const addedCount = this.queue.enqueueLinks(links, page.url, depth);
        if (addedCount > 0) {
          console.log(`    → Added ${addedCount} links to queue`);
        }

        // ページネーションリンクも追加
        const paginationLinks = this.linkExtractor.extractPaginationLinks(page.html, page.url);
        for (const link of paginationLinks) {
          this.queue.enqueue({
            url: link.url,
            depth: depth,  // ページネーションは同じ深さ
            priority: link.priority,
            sourceUrl: page.url,
            pageType: 'list',
          });
        }

        // PDF抽出が有効な場合、PDFリンクも追加
        if (this.pdfConfig.enabled) {
          const pdfLinks = this.linkExtractor.extractPdfLinks(page.html, page.url);
          for (const pdfLink of pdfLinks) {
            this.queue.enqueue({
              url: pdfLink.url,
              depth: depth + 1,
              priority: pdfLink.priority,
              sourceUrl: page.url,
              pageType: 'detail',
            });
          }
        }
      }
    } finally {
      this.rateLimiter.release();
    }
  }

  // robots.txtチェック＆Crawl-Delay適用
  private async checkRobotsAndApplyDelay(url: string): Promise<boolean> {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;

      // 新しいドメインの場合、Crawl-Delayを確認して適用
      if (!this.robotsCheckedDomains.has(domain)) {
        this.robotsCheckedDomains.add(domain);

        const crawlDelay = await this.robotsParser.getCrawlDelay(domain);
        if (crawlDelay !== undefined && crawlDelay > this.config.requestDelay) {
          console.log(`  [RobotsParser] Applying Crawl-Delay: ${crawlDelay}ms for ${domain}`);
          this.rateLimiter.setCrawlDelay(domain, crawlDelay);
        }
      }

      // URLが許可されているかチェック
      return await this.robotsParser.isAllowed(url);
    } catch (error) {
      console.warn(`[RobotsParser] Error checking ${url}:`, error);
      return true; // エラー時は許可
    }
  }

  // ページ取得（静的/動的自動選択）
  private async fetchPage(url: string): Promise<RenderedPage | null> {
    // キャッシュチェック
    const cached = this.responseCache.get(url);
    if (cached) {
      console.log(`    → Cache HIT`);
      this.stats.cacheHits = (this.stats.cacheHits || 0) + 1;
      return cached;
    }

    // まず静的レンダリング
    const staticResult = await this.staticRenderer.render(url);
    if (!staticResult) {
      return null;
    }

    let result: RenderedPage = staticResult;

    // 動的レンダリングが必要かチェック
    if (this.config.useHeadlessBrowser === 'auto') {
      if (needsDynamicRendering(staticResult.html)) {
        console.log(`    → Switching to dynamic rendering`);
        const dynamicResult = await this.dynamicRenderer.render(url);
        result = dynamicResult || staticResult;
      }
    } else if (this.config.useHeadlessBrowser === true) {
      const dynamicResult = await this.dynamicRenderer.render(url);
      if (dynamicResult) {
        result = dynamicResult;
      }
    }

    // キャッシュに保存
    this.responseCache.set(url, result);

    return result;
  }

  // ExtractedSubsidyInfo → ScrapedSubsidy 変換
  private convertToScrapedSubsidy(info: ExtractedSubsidyInfo): ScrapedSubsidy {
    return {
      source: info.source || 'deep-crawler',
      source_id: info.source_id || this.generateId(info.sourceUrl, info.title || ''),
      source_url: info.sourceUrl,
      title: info.title || '',
      catch_phrase: info.catch_phrase,
      description: info.description,
      target_area: info.target_area || ['全国'],
      target_area_detail: info.target_area_detail,
      industry: info.industry,
      target_number_of_employees: info.target_number_of_employees,
      max_amount: info.max_amount,
      subsidy_rate: info.subsidy_rate,
      start_date: info.start_date,
      end_date: info.end_date,
      organization: info.organization,
      use_purpose: info.use_purpose,
    };
  }

  // ID生成
  private generateId(url: string, title: string): string {
    let hash = 0;
    const str = url + title;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  // 初期統計
  private createInitialStats(): CrawlStats & { cacheHits?: number } {
    return {
      totalUrls: 0,
      visitedUrls: 0,
      skippedUrls: 0,
      subsidiesFound: 0,
      startTime: new Date(),
      cacheHits: 0,
    };
  }

  // リセット
  private reset(): void {
    this.queue.reset();
    this.rateLimiter.reset();
    this.robotsParser.clearCache();
    this.robotsCheckedDomains.clear();
    // キャッシュはリセットしない（再利用のため）
    this.subsidies = [];
    this.errors = [];
    this.stats = this.createInitialStats();
  }

  // キャッシュをクリア
  clearCache(): void {
    this.responseCache.clear();
  }

  // キャッシュ統計を取得
  getCacheStats() {
    return this.responseCache.getStats();
  }

  // キャッシュを永続化
  async persistCache(filePath?: string): Promise<void> {
    await this.responseCache.persist(filePath);
  }

  // キャッシュを読み込み
  async loadCache(filePath?: string): Promise<void> {
    await this.responseCache.load(filePath);
  }

  // チェックポイント一覧を取得
  async listCheckpoints() {
    return this.checkpointManager.list();
  }

  // チェックポイントを削除
  async deleteCheckpoint(id: string): Promise<boolean> {
    return this.checkpointManager.delete(id);
  }

  // 古いチェックポイントをクリーンアップ
  async cleanupOldCheckpoints(maxAge?: number): Promise<number> {
    return this.checkpointManager.cleanup(maxAge);
  }

  // 現在のチェックポイントIDを取得
  getCurrentCheckpointId(): string | null {
    return this.checkpointManager.getCurrentCheckpointId();
  }

  // クリーンアップ
  private async cleanup(): Promise<void> {
    await this.dynamicRenderer.cleanup();
  }

  // イベントリスナー登録
  on(listener: CrawlerEventListener): void {
    this.eventListeners.push(listener);
  }

  // イベント発火
  private emit(event: CrawlerEvent): void {
    for (const listener of this.eventListeners) {
      try {
        listener(event);
      } catch {
        // リスナーエラーは無視
      }
    }
  }

  // 設定を更新
  updateConfig(config: Partial<CrawlerConfig>): void {
    if (this.isRunning) {
      throw new Error('Cannot update config while running');
    }
    this.config = { ...this.config, ...config };
  }

  // 現在のキュー統計
  getQueueStats(): ReturnType<UrlQueue['getStats']> {
    return this.queue.getStats();
  }

  // 現在の統計
  getStats(): CrawlStats {
    return { ...this.stats };
  }
}
