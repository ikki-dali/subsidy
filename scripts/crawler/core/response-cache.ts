// レスポンスキャッシュ（LRU方式）

import * as fs from 'fs/promises';
import * as path from 'path';
import type { CacheEntry, CacheStats, CacheConfig, RenderedPage } from '../types';

const DEFAULT_CACHE_CONFIG: CacheConfig = {
  maxSize: 500,           // 最大500エントリ
  defaultTTL: 3600000,    // 1時間
  enableDiskCache: false,
};

export class ResponseCache {
  private memory: Map<string, CacheEntry> = new Map();
  private accessOrder: string[] = [];  // LRU追跡
  private config: CacheConfig;
  private stats = {
    hits: 0,
    misses: 0,
  };

  constructor(config?: Partial<CacheConfig>) {
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
  }

  // キャッシュから取得
  get(url: string): RenderedPage | null {
    const normalizedUrl = this.normalizeUrl(url);
    const entry = this.memory.get(normalizedUrl);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // TTLチェック
    if (this.isExpired(entry)) {
      this.memory.delete(normalizedUrl);
      this.removeFromAccessOrder(normalizedUrl);
      this.stats.misses++;
      return null;
    }

    // アクセス順序を更新（LRU）
    this.updateAccessOrder(normalizedUrl);
    this.stats.hits++;

    return {
      html: entry.html,
      url: entry.url,
      status: entry.status,
      contentType: entry.contentType,
      loadTime: 0,  // キャッシュからなので0
    };
  }

  // キャッシュに保存
  set(url: string, page: RenderedPage, ttl?: number): void {
    const normalizedUrl = this.normalizeUrl(url);

    // 最大サイズを超える場合、古いエントリを削除
    while (this.memory.size >= this.config.maxSize) {
      this.evictOldest();
    }

    const entry: CacheEntry = {
      html: page.html,
      url: page.url,
      status: page.status,
      contentType: page.contentType,
      cachedAt: new Date(),
      ttl: ttl || this.config.defaultTTL,
      size: page.html.length,
    };

    this.memory.set(normalizedUrl, entry);
    this.updateAccessOrder(normalizedUrl);
  }

  // キャッシュを持っているかチェック（有効期限も確認）
  has(url: string): boolean {
    const normalizedUrl = this.normalizeUrl(url);
    const entry = this.memory.get(normalizedUrl);
    if (!entry) return false;
    if (this.isExpired(entry)) {
      this.memory.delete(normalizedUrl);
      this.removeFromAccessOrder(normalizedUrl);
      return false;
    }
    return true;
  }

  // キャッシュを削除
  delete(url: string): boolean {
    const normalizedUrl = this.normalizeUrl(url);
    this.removeFromAccessOrder(normalizedUrl);
    return this.memory.delete(normalizedUrl);
  }

  // キャッシュをクリア
  clear(): void {
    this.memory.clear();
    this.accessOrder = [];
    this.stats = { hits: 0, misses: 0 };
  }

  // 統計情報
  getStats(): CacheStats {
    let totalSize = 0;
    this.memory.forEach((entry) => {
      totalSize += entry.size;
    });

    const total = this.stats.hits + this.stats.misses;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: totalSize,
      entries: this.memory.size,
      hitRate: total > 0 ? this.stats.hits / total : 0,
    };
  }

  // ディスクに永続化
  async persist(filePath?: string): Promise<void> {
    if (!this.config.enableDiskCache) return;

    const persistPath = filePath || this.config.persistPath;
    if (!persistPath) {
      throw new Error('No persist path configured');
    }

    const data = {
      entries: Array.from(this.memory.entries()),
      accessOrder: this.accessOrder,
      stats: this.stats,
      savedAt: new Date().toISOString(),
    };

    const dir = path.dirname(persistPath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(persistPath, JSON.stringify(data), 'utf-8');
    console.log(`[ResponseCache] Persisted ${this.memory.size} entries to ${persistPath}`);
  }

  // ディスクから読み込み
  async load(filePath?: string): Promise<void> {
    if (!this.config.enableDiskCache) return;

    const persistPath = filePath || this.config.persistPath;
    if (!persistPath) {
      throw new Error('No persist path configured');
    }

    try {
      const content = await fs.readFile(persistPath, 'utf-8');
      const data = JSON.parse(content);

      // 有効期限切れのエントリをフィルタリング
      const now = Date.now();
      let loadedCount = 0;

      for (const [key, entry] of data.entries) {
        const parsedEntry = {
          ...entry,
          cachedAt: new Date(entry.cachedAt),
        } as CacheEntry;

        if (!this.isExpired(parsedEntry)) {
          this.memory.set(key, parsedEntry);
          loadedCount++;
        }
      }

      this.accessOrder = data.accessOrder.filter((url: string) => this.memory.has(url));
      this.stats = data.stats || { hits: 0, misses: 0 };

      console.log(`[ResponseCache] Loaded ${loadedCount} entries from ${persistPath}`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        console.log('[ResponseCache] No cache file found, starting fresh');
      } else {
        console.warn('[ResponseCache] Failed to load cache:', error);
      }
    }
  }

  // URLを正規化
  private normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      // トレイリングスラッシュを統一
      if (urlObj.pathname.endsWith('/') && urlObj.pathname !== '/') {
        urlObj.pathname = urlObj.pathname.slice(0, -1);
      }
      // ハッシュを除去
      urlObj.hash = '';
      return urlObj.href;
    } catch {
      return url;
    }
  }

  // 有効期限チェック
  private isExpired(entry: CacheEntry): boolean {
    const age = Date.now() - entry.cachedAt.getTime();
    return age > entry.ttl;
  }

  // アクセス順序を更新
  private updateAccessOrder(url: string): void {
    this.removeFromAccessOrder(url);
    this.accessOrder.push(url);
  }

  // アクセス順序から削除
  private removeFromAccessOrder(url: string): void {
    const index = this.accessOrder.indexOf(url);
    if (index !== -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  // 最も古いエントリを削除（LRU）
  private evictOldest(): void {
    const oldest = this.accessOrder.shift();
    if (oldest) {
      this.memory.delete(oldest);
    }
  }
}

// シングルトンインスタンス
let responseCacheInstance: ResponseCache | null = null;

export function getResponseCache(config?: Partial<CacheConfig>): ResponseCache {
  if (!responseCacheInstance) {
    responseCacheInstance = new ResponseCache(config);
  }
  return responseCacheInstance;
}

export function resetResponseCache(): void {
  if (responseCacheInstance) {
    responseCacheInstance.clear();
  }
  responseCacheInstance = null;
}
