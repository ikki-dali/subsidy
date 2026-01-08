/**
 * Upstash Redis クライアント
 * 
 * キャッシュとRate Limiting用のRedis接続を提供
 * 環境変数未設定時はフォールバック（開発環境用）
 */

import { Redis } from '@upstash/redis';

// Redisクライアントのシングルトン
let redisClient: Redis | null = null;

/**
 * Redisクライアントを取得
 * 環境変数が設定されていない場合はnullを返す
 */
export function getRedis(): Redis | null {
  if (redisClient) {
    return redisClient;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    // 開発環境では警告を出すが、動作は継続
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Redis] UPSTASH_REDIS_REST_URL または UPSTASH_REDIS_REST_TOKEN が未設定です');
    }
    return null;
  }

  redisClient = new Redis({
    url,
    token,
  });

  return redisClient;
}

/**
 * Redisが利用可能かどうかをチェック
 */
export function isRedisAvailable(): boolean {
  return getRedis() !== null;
}

/**
 * Redis接続をテスト
 */
export async function testRedisConnection(): Promise<boolean> {
  const redis = getRedis();
  if (!redis) {
    return false;
  }

  try {
    await redis.ping();
    return true;
  } catch (error) {
    console.error('[Redis] 接続テスト失敗:', error);
    return false;
  }
}

// 便利なエクスポート（null安全版）
export const redis = {
  /**
   * キーの値を取得
   */
  async get<T>(key: string): Promise<T | null> {
    const client = getRedis();
    if (!client) return null;
    try {
      return await client.get<T>(key);
    } catch (error) {
      console.error('[Redis] GET error:', error);
      return null;
    }
  },

  /**
   * キーに値をセット（TTL付き）
   */
  async setex(key: string, seconds: number, value: unknown): Promise<boolean> {
    const client = getRedis();
    if (!client) return false;
    try {
      await client.setex(key, seconds, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('[Redis] SETEX error:', error);
      return false;
    }
  },

  /**
   * キーに値をセット
   */
  async set(key: string, value: unknown): Promise<boolean> {
    const client = getRedis();
    if (!client) return false;
    try {
      await client.set(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('[Redis] SET error:', error);
      return false;
    }
  },

  /**
   * キーをインクリメント（Rate Limiting用）
   */
  async incr(key: string): Promise<number | null> {
    const client = getRedis();
    if (!client) return null;
    try {
      return await client.incr(key);
    } catch (error) {
      console.error('[Redis] INCR error:', error);
      return null;
    }
  },

  /**
   * キーに有効期限を設定
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    const client = getRedis();
    if (!client) return false;
    try {
      await client.expire(key, seconds);
      return true;
    } catch (error) {
      console.error('[Redis] EXPIRE error:', error);
      return false;
    }
  },

  /**
   * キーを削除
   */
  async del(...keys: string[]): Promise<number> {
    const client = getRedis();
    if (!client) return 0;
    try {
      return await client.del(...keys);
    } catch (error) {
      console.error('[Redis] DEL error:', error);
      return 0;
    }
  },

  /**
   * パターンにマッチするキーを取得
   * 注意: プロダクションでは SCAN を使うべきだが、Upstash では keys が推奨
   */
  async keys(pattern: string): Promise<string[]> {
    const client = getRedis();
    if (!client) return [];
    try {
      return await client.keys(pattern);
    } catch (error) {
      console.error('[Redis] KEYS error:', error);
      return [];
    }
  },

  /**
   * 複数のキーを一括取得
   */
  async mget<T>(...keys: string[]): Promise<(T | null)[]> {
    const client = getRedis();
    if (!client) return keys.map(() => null);
    try {
      return await client.mget<T[]>(...keys);
    } catch (error) {
      console.error('[Redis] MGET error:', error);
      return keys.map(() => null);
    }
  },
};


