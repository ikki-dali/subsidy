// 動的レンダラー（Playwright ベース）

import type { Browser, Page, BrowserContext } from 'playwright';
import type { Renderer, RenderedPage, CrawlerConfig } from '../types';
import { DEFAULT_CONFIG } from '../types';

export class DynamicRenderer implements Renderer {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private config: Pick<CrawlerConfig, 'timeout' | 'userAgent'>;
  private isInitialized = false;

  constructor(config?: Partial<CrawlerConfig>) {
    this.config = {
      timeout: config?.timeout ?? DEFAULT_CONFIG.timeout,
      userAgent: config?.userAgent ?? DEFAULT_CONFIG.userAgent,
    };
  }

  // ブラウザを初期化
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // 動的インポート（Playwrightがインストールされていない場合に備える）
      const { chromium } = await import('playwright');

      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      });

      this.context = await this.browser.newContext({
        userAgent: this.config.userAgent,
        locale: 'ja-JP',
        viewport: { width: 1280, height: 800 },
      });

      this.isInitialized = true;
      console.log('[DynamicRenderer] Playwright browser initialized');
    } catch (error) {
      console.error('[DynamicRenderer] Failed to initialize Playwright:', error);
      throw new Error('Playwright initialization failed. Is playwright installed?');
    }
  }

  // ページをレンダリング
  async render(url: string): Promise<RenderedPage | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.context) {
      throw new Error('Browser context not initialized');
    }

    const startTime = Date.now();
    let page: Page | null = null;

    try {
      page = await this.context.newPage();

      // ページ読み込み
      const response = await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: this.config.timeout,
      });

      if (!response) {
        return null;
      }

      const status = response.status();
      if (status >= 400) {
        return null;
      }

      // 動的コンテンツの読み込みを待機
      await this.waitForContent(page);

      // HTML取得
      const html = await page.content();
      const loadTime = Date.now() - startTime;
      const finalUrl = page.url();

      return {
        html,
        url: finalUrl,
        status,
        contentType: 'text/html',
        loadTime,
      };
    } catch (error) {
      console.error(`[DynamicRenderer] Error rendering ${url}:`, error);
      return null;
    } finally {
      if (page) {
        await page.close().catch(() => {});
      }
    }
  }

  // コンテンツの読み込みを待機
  private async waitForContent(page: Page): Promise<void> {
    try {
      // 主要なコンテンツセレクタを待つ
      await Promise.race([
        page.waitForSelector('main', { timeout: 5000 }).catch(() => {}),
        page.waitForSelector('article', { timeout: 5000 }).catch(() => {}),
        page.waitForSelector('.content', { timeout: 5000 }).catch(() => {}),
        page.waitForSelector('#content', { timeout: 5000 }).catch(() => {}),
        this.sleep(3000), // 最低3秒待機
      ]);

      // 追加で少し待機（遅延ロードに対応）
      await this.sleep(1000);
    } catch {
      // タイムアウトは無視
    }
  }

  // クリーンアップ
  async cleanup(): Promise<void> {
    if (this.context) {
      await this.context.close().catch(() => {});
      this.context = null;
    }
    if (this.browser) {
      await this.browser.close().catch(() => {});
      this.browser = null;
    }
    this.isInitialized = false;
    console.log('[DynamicRenderer] Playwright browser closed');
  }

  // スリープ
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// シングルトンインスタンス
let dynamicRendererInstance: DynamicRenderer | null = null;

export function getDynamicRenderer(config?: Partial<CrawlerConfig>): DynamicRenderer {
  if (!dynamicRendererInstance) {
    dynamicRendererInstance = new DynamicRenderer(config);
  }
  return dynamicRendererInstance;
}

// 動的レンダリングが必要かどうか判定
export function needsDynamicRendering(html: string): boolean {
  // SPAフレームワーク検出
  const spaIndicators = [
    /id="__next"/,            // Next.js
    /id="__nuxt"/,            // Nuxt.js
    /id="app"[^>]*>/,         // Vue.js (data-v- 属性がないかも)
    /ng-app/,                 // AngularJS
    /data-reactroot/,         // React
    /<noscript>[\s\S]*?JavaScript/,// JS必須メッセージ
    /window\.__NUXT__/,       // Nuxt.js
    /window\.__NEXT_DATA__/,  // Next.js
  ];

  for (const pattern of spaIndicators) {
    if (pattern.test(html)) {
      return true;
    }
  }

  // コンテンツが極端に少ない場合（JS実行が必要かも）
  const textContent = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  if (textContent.length < 500 && html.includes('<script')) {
    return true;
  }

  return false;
}

// レンダラーを自動選択
export async function autoSelectRenderer(
  url: string,
  staticRenderer: Renderer,
  dynamicRenderer: DynamicRenderer,
  forceStatic = false
): Promise<RenderedPage | null> {
  // まず静的レンダリングを試行
  const staticResult = await staticRenderer.render(url);

  if (!staticResult) {
    return null;
  }

  // 強制静的モードまたはJSが不要な場合はそのまま返す
  if (forceStatic || !needsDynamicRendering(staticResult.html)) {
    return staticResult;
  }

  // 動的レンダリングが必要な場合
  console.log(`  [AutoRenderer] Switching to dynamic rendering for ${url}`);
  return dynamicRenderer.render(url);
}
