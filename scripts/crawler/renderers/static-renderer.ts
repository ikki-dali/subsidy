// 静的レンダラー（Cheerio/fetch ベース）

import type { Renderer, RenderedPage, CrawlerConfig } from '../types';
import { DEFAULT_CONFIG } from '../types';

export class StaticRenderer implements Renderer {
  private config: Pick<CrawlerConfig, 'timeout' | 'maxRetries' | 'retryDelay' | 'userAgent'>;

  constructor(config?: Partial<CrawlerConfig>) {
    this.config = {
      timeout: config?.timeout ?? DEFAULT_CONFIG.timeout,
      maxRetries: config?.maxRetries ?? DEFAULT_CONFIG.maxRetries,
      retryDelay: config?.retryDelay ?? DEFAULT_CONFIG.retryDelay,
      userAgent: config?.userAgent ?? DEFAULT_CONFIG.userAgent,
    };
  }

  // ページをレンダリング（取得）
  async render(url: string): Promise<RenderedPage | null> {
    const startTime = Date.now();
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        const response = await this.fetchWithTimeout(url);

        if (!response.ok) {
          if (response.status >= 500 && attempt < this.config.maxRetries) {
            console.warn(`  [StaticRenderer] Retry ${attempt}/${this.config.maxRetries}: HTTP ${response.status}`);
            await this.sleep(this.config.retryDelay * attempt);
            continue;
          }
          return null;
        }

        const contentType = response.headers.get('content-type') || 'text/html';

        // HTMLでない場合はスキップ
        if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
          return null;
        }

        const html = await response.text();
        const loadTime = Date.now() - startTime;

        return {
          html,
          url: response.url, // リダイレクト後のURL
          status: response.status,
          contentType,
          loadTime,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < this.config.maxRetries) {
          console.warn(`  [StaticRenderer] Retry ${attempt}/${this.config.maxRetries}: ${lastError.message}`);
          await this.sleep(this.config.retryDelay * attempt);
        }
      }
    }

    console.error(`  [StaticRenderer] Failed after ${this.config.maxRetries} attempts: ${url}`);
    return null;
  }

  // クリーンアップ（静的レンダラーでは不要）
  async cleanup(): Promise<void> {
    // 何もしない
  }

  // タイムアウト付きfetch
  private async fetchWithTimeout(url: string): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': this.config.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ja,en;q=0.9',
        },
        redirect: 'follow',
      });
      return response;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.config.timeout}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // スリープ
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// シングルトンインスタンス
let staticRendererInstance: StaticRenderer | null = null;

export function getStaticRenderer(config?: Partial<CrawlerConfig>): StaticRenderer {
  if (!staticRendererInstance) {
    staticRendererInstance = new StaticRenderer(config);
  }
  return staticRendererInstance;
}
