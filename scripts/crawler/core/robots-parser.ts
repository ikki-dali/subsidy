// robots.txt パーサー

import type { RobotsRule, RobotsCache, RobotsConfig } from '../types';

const DEFAULT_ROBOTS_CONFIG: RobotsConfig = {
  cacheTTL: 3600000, // 1時間
  userAgent: 'SubsidyBot',
  respectRobotsTxt: true,
};

export class RobotsParser {
  private cache: Map<string, RobotsCache> = new Map();
  private config: RobotsConfig;
  private fetchPromises: Map<string, Promise<RobotsRule[]>> = new Map();

  constructor(config?: Partial<RobotsConfig>) {
    this.config = { ...DEFAULT_ROBOTS_CONFIG, ...config };
  }

  // robots.txtを取得してパース
  async fetch(domain: string): Promise<RobotsRule[]> {
    // キャッシュチェック
    const cached = this.cache.get(domain);
    if (cached && Date.now() - cached.fetchedAt.getTime() < cached.ttl) {
      return cached.rules;
    }

    // 既存のフェッチが進行中なら待機
    const existingPromise = this.fetchPromises.get(domain);
    if (existingPromise) {
      return existingPromise;
    }

    // 新規フェッチ
    const fetchPromise = this.doFetch(domain);
    this.fetchPromises.set(domain, fetchPromise);

    try {
      const rules = await fetchPromise;
      return rules;
    } finally {
      this.fetchPromises.delete(domain);
    }
  }

  private async doFetch(domain: string): Promise<RobotsRule[]> {
    const robotsUrl = `https://${domain}/robots.txt`;

    try {
      const response = await fetch(robotsUrl, {
        headers: {
          'User-Agent': this.config.userAgent,
        },
        signal: AbortSignal.timeout(10000), // 10秒タイムアウト
      });

      if (!response.ok) {
        // robots.txtが存在しない場合は全て許可
        const rules: RobotsRule[] = [];
        this.cacheRules(domain, rules);
        return rules;
      }

      const content = await response.text();
      const rules = this.parse(content);
      this.cacheRules(domain, rules);
      return rules;
    } catch (error) {
      console.warn(`[RobotsParser] Failed to fetch robots.txt for ${domain}:`, error);
      // エラー時も空のルールをキャッシュ（全て許可）
      const rules: RobotsRule[] = [];
      this.cacheRules(domain, rules);
      return rules;
    }
  }

  private cacheRules(domain: string, rules: RobotsRule[]): void {
    this.cache.set(domain, {
      rules,
      fetchedAt: new Date(),
      ttl: this.config.cacheTTL,
    });
  }

  // robots.txtをパース
  parse(content: string): RobotsRule[] {
    const rules: RobotsRule[] = [];
    const lines = content.split('\n');

    let currentRule: RobotsRule | null = null;

    for (const rawLine of lines) {
      const line = rawLine.trim();

      // コメントと空行をスキップ
      if (line === '' || line.startsWith('#')) {
        continue;
      }

      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) {
        continue;
      }

      const key = line.substring(0, colonIndex).trim().toLowerCase();
      const value = line.substring(colonIndex + 1).trim();

      switch (key) {
        case 'user-agent':
          // 新しいUser-Agentブロック開始
          if (currentRule) {
            rules.push(currentRule);
          }
          currentRule = {
            userAgent: value.toLowerCase(),
            allow: [],
            disallow: [],
          };
          break;

        case 'allow':
          if (currentRule && value) {
            currentRule.allow.push(value);
          }
          break;

        case 'disallow':
          if (currentRule && value) {
            currentRule.disallow.push(value);
          }
          break;

        case 'crawl-delay':
          if (currentRule) {
            const delay = parseFloat(value);
            if (!isNaN(delay) && delay > 0) {
              currentRule.crawlDelay = delay * 1000; // 秒→ミリ秒
            }
          }
          break;
      }
    }

    // 最後のルールを追加
    if (currentRule) {
      rules.push(currentRule);
    }

    return rules;
  }

  // URLがクロール許可されているか判定
  async isAllowed(url: string, userAgent?: string): Promise<boolean> {
    if (!this.config.respectRobotsTxt) {
      return true;
    }

    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      const path = urlObj.pathname;

      const rules = await this.fetch(domain);
      return this.checkPath(rules, path, userAgent || this.config.userAgent);
    } catch (error) {
      console.warn(`[RobotsParser] Error checking URL ${url}:`, error);
      return true; // エラー時は許可
    }
  }

  // 同期版（キャッシュがある場合のみ使用可能）
  isAllowedSync(url: string, userAgent?: string): boolean | null {
    if (!this.config.respectRobotsTxt) {
      return true;
    }

    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      const path = urlObj.pathname;

      const cached = this.cache.get(domain);
      if (!cached) {
        return null; // キャッシュなし
      }

      return this.checkPath(cached.rules, path, userAgent || this.config.userAgent);
    } catch {
      return true;
    }
  }

  private checkPath(rules: RobotsRule[], path: string, userAgent: string): boolean {
    // 該当するルールを探す（具体的なUser-Agent優先、なければ*）
    const ua = userAgent.toLowerCase();
    let applicableRule: RobotsRule | null = null;

    // まず完全一致を探す
    for (const rule of rules) {
      if (rule.userAgent === ua) {
        applicableRule = rule;
        break;
      }
    }

    // なければ部分一致
    if (!applicableRule) {
      for (const rule of rules) {
        if (ua.includes(rule.userAgent) || rule.userAgent.includes(ua)) {
          applicableRule = rule;
          break;
        }
      }
    }

    // なければワイルドカード
    if (!applicableRule) {
      for (const rule of rules) {
        if (rule.userAgent === '*') {
          applicableRule = rule;
          break;
        }
      }
    }

    // ルールなし = 全て許可
    if (!applicableRule) {
      return true;
    }

    // パスマッチングを行う
    // より具体的なルール（長いパス）が優先
    let allowMatch = '';
    let disallowMatch = '';

    for (const pattern of applicableRule.allow) {
      if (this.pathMatches(path, pattern) && pattern.length > allowMatch.length) {
        allowMatch = pattern;
      }
    }

    for (const pattern of applicableRule.disallow) {
      if (this.pathMatches(path, pattern) && pattern.length > disallowMatch.length) {
        disallowMatch = pattern;
      }
    }

    // Allow/Disallowの優先順位
    // 1. より長いパスが優先
    // 2. 同じ長さならAllowが優先
    if (allowMatch.length > disallowMatch.length) {
      return true;
    }
    if (disallowMatch.length > allowMatch.length) {
      return false;
    }
    if (allowMatch.length === disallowMatch.length && allowMatch.length > 0) {
      return true; // 同じ長さならAllow優先
    }

    // マッチなし = 許可
    return true;
  }

  private pathMatches(path: string, pattern: string): boolean {
    // 空パターン = 全てにマッチしない
    if (!pattern) {
      return false;
    }

    // ワイルドカード対応
    // * = 任意の文字列
    // $ = 文字列末尾

    let regexStr = '';
    for (let i = 0; i < pattern.length; i++) {
      const char = pattern[i];
      if (char === '*') {
        regexStr += '.*';
      } else if (char === '$' && i === pattern.length - 1) {
        regexStr += '$';
      } else {
        // 正規表現の特殊文字をエスケープ
        regexStr += char.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
      }
    }

    // パターンの先頭は必ず ^
    // 末尾に $ がない場合は前方一致
    const regex = new RegExp(`^${regexStr}`);
    return regex.test(path);
  }

  // ドメインのCrawl-Delayを取得
  async getCrawlDelay(domain: string, userAgent?: string): Promise<number | undefined> {
    const rules = await this.fetch(domain);
    const ua = (userAgent || this.config.userAgent).toLowerCase();

    // 該当するルールを探す
    for (const rule of rules) {
      if (rule.userAgent === ua || rule.userAgent === '*') {
        return rule.crawlDelay;
      }
    }

    return undefined;
  }

  // 同期版（キャッシュがある場合のみ）
  getCrawlDelaySync(domain: string, userAgent?: string): number | undefined | null {
    const cached = this.cache.get(domain);
    if (!cached) {
      return null;
    }

    const ua = (userAgent || this.config.userAgent).toLowerCase();

    for (const rule of cached.rules) {
      if (rule.userAgent === ua || rule.userAgent === '*') {
        return rule.crawlDelay;
      }
    }

    return undefined;
  }

  // キャッシュをクリア
  clearCache(): void {
    this.cache.clear();
  }

  // 特定ドメインのキャッシュをクリア
  clearCacheFor(domain: string): void {
    this.cache.delete(domain);
  }

  // キャッシュ状態を取得
  getCacheStats(): { domains: string[]; size: number } {
    return {
      domains: Array.from(this.cache.keys()),
      size: this.cache.size,
    };
  }
}

// シングルトンインスタンス
let robotsParserInstance: RobotsParser | null = null;

export function getRobotsParser(config?: Partial<RobotsConfig>): RobotsParser {
  if (!robotsParserInstance) {
    robotsParserInstance = new RobotsParser(config);
  }
  return robotsParserInstance;
}

export function resetRobotsParser(): void {
  robotsParserInstance = null;
}
