/**
 * キャッシュヘルパー
 * 
 * Redisを使用したAPIレスポンスキャッシュ
 * Redis未設定時はキャッシュをスキップしてDBに直接アクセス
 */

import { redis, isRedisAvailable } from './redis';

// キャッシュキーのプレフィックス
const CACHE_PREFIX = {
  SUBSIDIES_SEARCH: 'cache:subsidies:search:',
  SUBSIDIES_RECOMMENDED: 'cache:subsidies:recommended:',
  SUBSIDIES_DETAIL: 'cache:subsidies:detail:',
} as const;

// デフォルトTTL（秒）
const DEFAULT_TTL = {
  SEARCH: 300,        // 検索結果: 5分
  RECOMMENDED: 900,   // おすすめ: 15分
  DETAIL: 1800,       // 詳細: 30分
} as const;

/**
 * クエリパラメータからキャッシュキーを生成
 * パラメータをソートして正規化することで、同じクエリには同じキーを返す
 */
export function generateCacheKey(prefix: string, params: Record<string, string | null | undefined>): string {
  const sortedEntries = Object.entries(params)
    .filter(([, v]) => v != null && v !== '')
    .sort(([a], [b]) => a.localeCompare(b));
  
  const queryString = sortedEntries
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  
  return `${prefix}${queryString || 'default'}`;
}

/**
 * キャッシュからデータを取得、なければfetcherを実行してキャッシュに保存
 * 
 * @param key キャッシュキー
 * @param fetcher データ取得関数
 * @param ttlSeconds キャッシュの有効期間（秒）
 * @returns キャッシュまたは新規取得したデータ
 */
export async function getCachedOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  // Redis未設定の場合はキャッシュをスキップ
  if (!isRedisAvailable()) {
    return fetcher();
  }

  try {
    // キャッシュを確認
    const cached = await redis.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // キャッシュミス: データを取得してキャッシュに保存
    const data = await fetcher();
    
    // バックグラウンドでキャッシュに保存（レスポンスを遅延させない）
    redis.setex(key, ttlSeconds, data).catch((err) => {
      console.error('[Cache] Failed to set cache:', err);
    });

    return data;
  } catch (error) {
    // Redisエラー時はフォールバック
    console.error('[Cache] Redis error, falling back to fetcher:', error);
    return fetcher();
  }
}

/**
 * 検索結果のキャッシュキーを生成
 */
export function getSearchCacheKey(params: {
  keyword?: string | null;
  area?: string | null;
  industry?: string | null;
  minAmount?: string | null;
  maxAmount?: string | null;
  sort?: string | null;
  active?: string | null;
  limit?: string | null;
  offset?: string | null;
}): string {
  return generateCacheKey(CACHE_PREFIX.SUBSIDIES_SEARCH, params);
}

/**
 * おすすめのキャッシュキーを生成
 */
export function getRecommendedCacheKey(params: {
  category?: string | null;
  limit?: string | null;
  area?: string | null;
  industry?: string | null;
  active?: string | null;
}): string {
  return generateCacheKey(CACHE_PREFIX.SUBSIDIES_RECOMMENDED, params);
}

/**
 * 補助金詳細のキャッシュキーを生成
 */
export function getDetailCacheKey(id: string): string {
  return `${CACHE_PREFIX.SUBSIDIES_DETAIL}${id}`;
}

/**
 * 検索結果をキャッシュ付きで取得
 */
export async function getCachedSearchResults<T>(
  params: Parameters<typeof getSearchCacheKey>[0],
  fetcher: () => Promise<T>
): Promise<T> {
  const key = getSearchCacheKey(params);
  return getCachedOrFetch(key, fetcher, DEFAULT_TTL.SEARCH);
}

/**
 * おすすめをキャッシュ付きで取得
 */
export async function getCachedRecommended<T>(
  params: Parameters<typeof getRecommendedCacheKey>[0],
  fetcher: () => Promise<T>
): Promise<T> {
  const key = getRecommendedCacheKey(params);
  return getCachedOrFetch(key, fetcher, DEFAULT_TTL.RECOMMENDED);
}

/**
 * 補助金詳細をキャッシュ付きで取得
 */
export async function getCachedSubsidyDetail<T>(
  id: string,
  fetcher: () => Promise<T>
): Promise<T> {
  const key = getDetailCacheKey(id);
  return getCachedOrFetch(key, fetcher, DEFAULT_TTL.DETAIL);
}

/**
 * キャッシュを無効化（パターンマッチ）
 * 日次同期時などに使用
 */
export async function invalidateCache(pattern?: string): Promise<number> {
  if (!isRedisAvailable()) {
    return 0;
  }

  try {
    const searchPattern = pattern || 'cache:subsidies:*';
    const keys = await redis.keys(searchPattern);
    
    if (keys.length === 0) {
      return 0;
    }

    return await redis.del(...keys);
  } catch (error) {
    console.error('[Cache] Failed to invalidate cache:', error);
    return 0;
  }
}

/**
 * 特定の補助金のキャッシュを無効化
 */
export async function invalidateSubsidyCache(subsidyId: string): Promise<void> {
  if (!isRedisAvailable()) {
    return;
  }

  try {
    const detailKey = getDetailCacheKey(subsidyId);
    await redis.del(detailKey);
    
    // 検索結果とおすすめのキャッシュも無効化（補助金が更新された場合）
    await invalidateCache('cache:subsidies:search:*');
    await invalidateCache('cache:subsidies:recommended:*');
  } catch (error) {
    console.error('[Cache] Failed to invalidate subsidy cache:', error);
  }
}

// エクスポート: TTL定数
export const CACHE_TTL = DEFAULT_TTL;
export const CACHE_KEYS = CACHE_PREFIX;


