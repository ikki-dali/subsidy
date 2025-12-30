// ディープクローラー - BaseScraper統合ラッパー

import { BaseScraper } from './base';
import type { ScrapedSubsidy, ScraperResult } from './types';
import { CrawlerEngine, type CrawlerConfig, type CrawlResult } from '../crawler';

type DeepCrawlerConfig = Partial<CrawlerConfig> & {
  entryUrls: string[];
};

export class DeepCrawlerScraper extends BaseScraper {
  private engine: CrawlerEngine;
  private entryUrls: string[];
  private crawlResult: CrawlResult | null = null;

  constructor(name: string, config: DeepCrawlerConfig) {
    super(name);
    this.entryUrls = config.entryUrls;
    this.engine = new CrawlerEngine({
      maxDepth: config.maxDepth ?? 3,
      maxPages: config.maxPages ?? 100,
      requestDelay: config.requestDelay ?? 1500,
      concurrency: config.concurrency ?? 2,
      timeout: config.timeout ?? 30000,
      stayInDomain: config.stayInDomain ?? true,
      allowedDomains: config.allowedDomains ?? [],
      useHeadlessBrowser: config.useHeadlessBrowser ?? 'auto',
      respectRobotsTxt: config.respectRobotsTxt ?? true,
      dryRun: config.dryRun ?? false,
    });

    // イベントリスナー設定
    this.engine.on((event) => {
      switch (event.type) {
        case 'start':
          console.log(`[${this.name}] Starting deep crawl with ${event.urls.length} URLs`);
          break;
        case 'complete':
          console.log(`[${this.name}] Completed: ${event.stats.subsidiesFound} subsidies found in ${event.stats.durationMs}ms`);
          break;
        case 'error':
          console.error(`[${this.name}] Error: ${event.url} - ${event.error}`);
          break;
      }
    });
  }

  // スクレイピング実行
  async scrape(): Promise<ScrapedSubsidy[]> {
    console.log(`[${this.name}] Deep crawling ${this.entryUrls.length} entry URLs...`);

    this.crawlResult = await this.engine.crawl(this.entryUrls);

    // 補助金データを正規化
    const subsidies = this.crawlResult.subsidies.map((subsidy) => ({
      ...subsidy,
      source: this.name,
      target_area: subsidy.target_area || ['全国'],
    }));

    console.log(`[${this.name}] Found ${subsidies.length} subsidies`);
    return subsidies;
  }

  // 実行結果の詳細を取得
  getResult(): CrawlResult | null {
    return this.crawlResult;
  }

  // 統計情報を取得
  getStats() {
    return this.engine.getStats();
  }
}

// 定義済みのディープクローラーターゲット
export const DEEP_CRAWL_TARGETS: DeepCrawlTarget[] = [
  {
    name: 'tokyo-kosha',
    displayName: '東京都中小企業振興公社',
    entryUrls: [
      'https://www.tokyo-kosha.or.jp/support/josei/',
    ],
    config: {
      maxDepth: 4,
      maxPages: 200,
      stayInDomain: true,
    },
  },
  {
    name: 'tokyo-metro',
    displayName: '東京都産業労働局',
    entryUrls: [
      'https://www.metro.tokyo.lg.jp/tosei/hodohappyo/press/index.html',
    ],
    config: {
      maxDepth: 3,
      maxPages: 150,
      stayInDomain: true,
    },
  },
  {
    name: 'meti',
    displayName: '経済産業省',
    entryUrls: [
      'https://www.meti.go.jp/main/yosan/index.html',
    ],
    config: {
      maxDepth: 3,
      maxPages: 100,
      stayInDomain: true,
    },
  },
];

export type DeepCrawlTarget = {
  name: string;
  displayName: string;
  entryUrls: string[];
  config: Partial<CrawlerConfig>;
};

// ターゲット名からクローラーを作成
export function createDeepCrawler(targetName: string): DeepCrawlerScraper | null {
  const target = DEEP_CRAWL_TARGETS.find((t) => t.name === targetName);
  if (!target) {
    return null;
  }

  return new DeepCrawlerScraper(target.name, {
    entryUrls: target.entryUrls,
    ...target.config,
  });
}

// カスタムURLでクローラーを作成
export function createCustomDeepCrawler(
  name: string,
  entryUrls: string[],
  config?: Partial<CrawlerConfig>
): DeepCrawlerScraper {
  return new DeepCrawlerScraper(name, {
    entryUrls,
    ...config,
  });
}
