// レート制限

export type RateLimiterConfig = {
  requestDelay: number;     // リクエスト間隔（ミリ秒）
  concurrency: number;      // 同時リクエスト数
  perDomainDelay?: number;  // ドメイン別の追加遅延
};

type DomainState = {
  lastRequestTime: number;
  requestCount: number;
  crawlDelay?: number;  // robots.txtから取得した遅延
};

export class RateLimiter {
  private config: RateLimiterConfig;
  private domainStates: Map<string, DomainState> = new Map();
  private activeRequests: number = 0;
  private waitQueue: Array<() => void> = [];

  constructor(config: RateLimiterConfig) {
    this.config = config;
  }

  // リクエスト前に待機
  async waitForSlot(url: string): Promise<void> {
    const domain = this.extractDomain(url);

    // 同時リクエスト数制限
    while (this.activeRequests >= this.config.concurrency) {
      await this.waitForRelease();
    }

    // ドメイン別レート制限
    const state = this.getDomainState(domain);
    const now = Date.now();
    const minDelay = state.crawlDelay || this.config.requestDelay;
    const elapsed = now - state.lastRequestTime;

    if (elapsed < minDelay) {
      const waitTime = minDelay - elapsed;
      await this.sleep(waitTime);
    }

    // リクエスト開始
    this.activeRequests++;
    state.lastRequestTime = Date.now();
    state.requestCount++;
  }

  // リクエスト完了
  release(): void {
    this.activeRequests = Math.max(0, this.activeRequests - 1);

    // 待機中のリクエストを解放
    const resolver = this.waitQueue.shift();
    if (resolver) {
      resolver();
    }
  }

  // ドメインのcrawl-delayを設定（ミリ秒単位で受け取る）
  setCrawlDelay(domain: string, delayMs: number): void {
    const state = this.getDomainState(domain);
    state.crawlDelay = delayMs;
  }

  // 統計情報
  getStats(): {
    activeRequests: number;
    waitingRequests: number;
    domains: number;
  } {
    return {
      activeRequests: this.activeRequests,
      waitingRequests: this.waitQueue.length,
      domains: this.domainStates.size,
    };
  }

  // ドメイン別の統計
  getDomainStats(domain: string): DomainState | undefined {
    return this.domainStates.get(domain);
  }

  // リセット
  reset(): void {
    this.domainStates.clear();
    this.activeRequests = 0;
    this.waitQueue = [];
  }

  // ドメイン抽出
  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return 'unknown';
    }
  }

  // ドメイン状態を取得（なければ作成）
  private getDomainState(domain: string): DomainState {
    let state = this.domainStates.get(domain);
    if (!state) {
      state = {
        lastRequestTime: 0,
        requestCount: 0,
      };
      this.domainStates.set(domain, state);
    }
    return state;
  }

  // 並列制限の解放を待つ
  private waitForRelease(): Promise<void> {
    return new Promise((resolve) => {
      this.waitQueue.push(resolve);
    });
  }

  // スリープ
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// シンプルなスロットル関数
export function throttle<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  delay: number
): T {
  let lastCall = 0;

  return (async (...args: Parameters<T>) => {
    const now = Date.now();
    const elapsed = now - lastCall;

    if (elapsed < delay) {
      await new Promise((resolve) => setTimeout(resolve, delay - elapsed));
    }

    lastCall = Date.now();
    return fn(...args);
  }) as T;
}

// 並列実行制限付きマップ
export async function parallelMap<T, R>(
  items: T[],
  fn: (item: T, index: number) => Promise<R>,
  concurrency: number
): Promise<R[]> {
  const results: R[] = [];
  const executing: Promise<void>[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    const p = fn(item, i).then((result) => {
      results[i] = result;
    });

    executing.push(p as unknown as Promise<void>);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
      // 完了したPromiseを削除
      const completedIndex = await Promise.race(
        executing.map((p, idx) => p.then(() => idx))
      );
      executing.splice(completedIndex, 1);
    }
  }

  await Promise.all(executing);
  return results;
}
