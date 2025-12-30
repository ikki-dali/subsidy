// 優先度付きURLキュー

import type { UrlQueueItem, PageType, ExtractedLink } from '../types';

// 優先度定数
export const PRIORITY = {
  HIGHEST: 100,  // 補助金詳細ページ
  HIGH: 80,      // 補助金関連リンク
  MEDIUM: 60,    // 一覧・検索ページ
  LOW: 40,       // その他
  LOWEST: 20,    // ナビゲーション等
} as const;

// 優先度判定キーワード
const PRIORITY_KEYWORDS = {
  highest: ['詳細', '募集要項', '申請', '公募', 'detail', 'subsidy'],
  high: ['補助金', '助成', '支援', '交付', 'hojo', 'josei', 'shien'],
  medium: ['一覧', '検索', 'list', 'search', '事業'],
  low: ['お知らせ', 'news', '更新'],
  exclude: ['ログイン', 'login', 'お問い合わせ', 'contact', 'faq', 'よくある質問'],
};

export class UrlQueue {
  private queue: UrlQueueItem[] = [];
  private visited: Set<string> = new Set();
  private pending: Set<string> = new Set();

  constructor() {}

  // キューにアイテムを追加
  enqueue(item: Omit<UrlQueueItem, 'addedAt' | 'retryCount'>): boolean {
    const normalizedUrl = this.normalizeUrl(item.url);

    // 既に訪問済みまたは処理中なら追加しない
    if (this.visited.has(normalizedUrl) || this.pending.has(normalizedUrl)) {
      return false;
    }

    // 除外キーワードチェック
    if (this.shouldExclude(item.url, item.sourceUrl)) {
      return false;
    }

    const queueItem: UrlQueueItem = {
      ...item,
      url: normalizedUrl,
      retryCount: 0,
      addedAt: new Date(),
    };

    // 優先度順に挿入
    const insertIndex = this.findInsertIndex(queueItem.priority);
    this.queue.splice(insertIndex, 0, queueItem);
    this.pending.add(normalizedUrl);

    return true;
  }

  // リンクから複数追加
  enqueueLinks(links: ExtractedLink[], sourceUrl: string, currentDepth: number): number {
    let added = 0;
    for (const link of links) {
      const success = this.enqueue({
        url: link.url,
        depth: currentDepth + 1,
        priority: link.priority,
        sourceUrl,
        pageType: link.isDetailLink ? 'detail' : 'other',
        context: link.context,
      });
      if (success) added++;
    }
    return added;
  }

  // キューから次のアイテムを取得
  dequeue(): UrlQueueItem | null {
    const item = this.queue.shift();
    if (item) {
      this.pending.delete(item.url);
    }
    return item ?? null;
  }

  // 訪問済みとしてマーク
  markVisited(url: string): void {
    const normalizedUrl = this.normalizeUrl(url);
    this.visited.add(normalizedUrl);
    this.pending.delete(normalizedUrl);
  }

  // リトライのためにキューに戻す
  requeueForRetry(item: UrlQueueItem): boolean {
    if (item.retryCount >= 3) {
      return false;
    }

    const retryItem: UrlQueueItem = {
      ...item,
      retryCount: item.retryCount + 1,
      priority: item.priority - 10, // 優先度を下げる
    };

    // 末尾に近い位置に追加
    this.queue.push(retryItem);
    this.pending.add(item.url);
    return true;
  }

  // キューが空かどうか
  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  // キューのサイズ
  size(): number {
    return this.queue.length;
  }

  // 訪問済みURL数
  visitedCount(): number {
    return this.visited.size;
  }

  // 統計情報
  getStats(): { queued: number; visited: number; pending: number } {
    return {
      queued: this.queue.length,
      visited: this.visited.size,
      pending: this.pending.size,
    };
  }

  // キューをクリア
  clear(): void {
    this.queue = [];
    this.pending.clear();
  }

  // 全てリセット
  reset(): void {
    this.queue = [];
    this.visited.clear();
    this.pending.clear();
  }

  // 状態をエクスポート（チェックポイント用）
  export(): { visitedUrls: string[]; queuedItems: UrlQueueItem[] } {
    return {
      visitedUrls: Array.from(this.visited),
      queuedItems: [...this.queue],
    };
  }

  // 状態をインポート（チェックポイントから復元）
  import(data: { visitedUrls: string[]; queuedItems: UrlQueueItem[] }): void {
    this.reset();

    // 訪問済みURLを復元
    for (const url of data.visitedUrls) {
      this.visited.add(url);
    }

    // キューを復元
    for (const item of data.queuedItems) {
      this.queue.push({
        ...item,
        addedAt: item.addedAt instanceof Date ? item.addedAt : new Date(item.addedAt),
      });
      this.pending.add(item.url);
    }

    // 優先度順に再ソート
    this.queue.sort((a, b) => b.priority - a.priority);
  }

  // URL正規化
  private normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      // ハッシュを除去
      urlObj.hash = '';
      // 末尾スラッシュを統一
      let normalized = urlObj.href;
      if (normalized.endsWith('/') && urlObj.pathname !== '/') {
        normalized = normalized.slice(0, -1);
      }
      return normalized;
    } catch {
      return url;
    }
  }

  // 優先度に基づく挿入位置を見つける
  private findInsertIndex(priority: number): number {
    // 二分探索で挿入位置を見つける
    let left = 0;
    let right = this.queue.length;

    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (this.queue[mid].priority >= priority) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }

    return left;
  }

  // 除外すべきURLかチェック
  private shouldExclude(url: string, _sourceUrl: string): boolean {
    const lowerUrl = url.toLowerCase();

    // 除外キーワードチェック
    for (const keyword of PRIORITY_KEYWORDS.exclude) {
      if (lowerUrl.includes(keyword.toLowerCase())) {
        return true;
      }
    }

    // ファイル拡張子チェック
    const excludeExtensions = [
      '.pdf', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp',
      '.css', '.js', '.zip', '.doc', '.docx', '.xls', '.xlsx',
    ];
    for (const ext of excludeExtensions) {
      if (lowerUrl.endsWith(ext)) {
        return true;
      }
    }

    // プロトコルチェック
    if (lowerUrl.startsWith('javascript:') ||
        lowerUrl.startsWith('mailto:') ||
        lowerUrl.startsWith('tel:')) {
      return true;
    }

    return false;
  }
}

// URLとテキストから優先度を計算
export function calculatePriority(url: string, linkText: string): number {
  const lowerUrl = url.toLowerCase();
  const lowerText = linkText.toLowerCase();

  // 最高優先度: 補助金詳細ページ
  for (const keyword of PRIORITY_KEYWORDS.highest) {
    if (lowerText.includes(keyword) || lowerUrl.includes(keyword)) {
      return PRIORITY.HIGHEST;
    }
  }

  // 高優先度: 補助金関連リンク
  for (const keyword of PRIORITY_KEYWORDS.high) {
    if (lowerText.includes(keyword) || lowerUrl.includes(keyword)) {
      return PRIORITY.HIGH;
    }
  }

  // 中優先度: 一覧・検索ページ
  for (const keyword of PRIORITY_KEYWORDS.medium) {
    if (lowerText.includes(keyword) || lowerUrl.includes(keyword)) {
      return PRIORITY.MEDIUM;
    }
  }

  // 低優先度: お知らせ等
  for (const keyword of PRIORITY_KEYWORDS.low) {
    if (lowerText.includes(keyword) || lowerUrl.includes(keyword)) {
      return PRIORITY.LOW;
    }
  }

  // デフォルト
  return PRIORITY.LOWEST;
}

// 詳細リンクかどうか判定
export function isDetailLink(url: string, linkText: string): boolean {
  const lowerText = linkText.toLowerCase();
  const lowerUrl = url.toLowerCase();

  const detailKeywords = [
    '詳細', '詳しく', 'もっと見る', '続きを読む',
    'more', 'detail', 'view',
    '募集要項', '申請', '公募情報',
  ];

  for (const keyword of detailKeywords) {
    if (lowerText.includes(keyword) || lowerUrl.includes(keyword)) {
      return true;
    }
  }

  return false;
}
