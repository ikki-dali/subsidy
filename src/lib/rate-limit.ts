/**
 * Rate Limiting（Redisベース）
 * 
 * Upstash Redisを使用した分散環境対応のRate Limiting
 * Redis未設定時はメモリベースのフォールバックを使用
 */

import { redis, isRedisAvailable } from './redis';

export interface RateLimitConfig {
  // 許可するリクエスト数
  limit: number;
  // ウィンドウ期間（秒）
  windowSec: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

// デフォルト設定
const DEFAULT_CONFIG: RateLimitConfig = {
  limit: 100,     // 100リクエスト
  windowSec: 60,  // 1分あたり
};

// エンドポイント別の設定
const ENDPOINT_CONFIGS: Record<string, RateLimitConfig> = {
  '/api/companies': {
    limit: 5,       // 5リクエスト
    windowSec: 60,  // 1分あたり（登録は制限を厳しく）
  },
  '/api/interests': {
    limit: 30,      // 30リクエスト
    windowSec: 60,  // 1分あたり
  },
  '/api/subsidies': {
    limit: 200,     // 200リクエスト
    windowSec: 60,  // 1分あたり（公開APIなので緩め）
  },
  '/api/auth/login': {
    limit: 10,      // 10リクエスト
    windowSec: 60,  // 1分あたり（ブルートフォース対策）
  },
  '/api/auth/reset-password': {
    limit: 5,       // 5リクエスト
    windowSec: 60,  // 1分あたり
  },
};

// メモリベースのフォールバック用ストア
interface MemoryEntry {
  count: number;
  resetAt: number;
}
const memoryStore = new Map<string, MemoryEntry>();

// メモリストアのクリーンアップ（1分ごと）
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of memoryStore.entries()) {
      if (entry.resetAt < now) {
        memoryStore.delete(key);
      }
    }
  }, 60000);
}

/**
 * エンドポイントのベースパスを取得
 */
function getBasePath(endpoint: string): string {
  return '/' + endpoint.split('/').slice(1, 3).join('/');
}

/**
 * IPアドレスとエンドポイントからキーを生成
 */
function generateKey(ip: string, endpoint: string): string {
  const basePath = getBasePath(endpoint);
  return `rate:${ip}:${basePath}`;
}

/**
 * エンドポイントの設定を取得
 */
function getConfig(endpoint: string): RateLimitConfig {
  const basePath = getBasePath(endpoint);
  return ENDPOINT_CONFIGS[basePath] || DEFAULT_CONFIG;
}

/**
 * メモリベースのRate Limit（フォールバック用）
 */
function checkRateLimitMemory(ip: string, endpoint: string): RateLimitResult {
  const key = generateKey(ip, endpoint);
  const config = getConfig(endpoint);
  const now = Date.now();

  let entry = memoryStore.get(key);

  // エントリがない、または期限切れの場合は新規作成
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 1,
      resetAt: now + config.windowSec * 1000,
    };
    memoryStore.set(key, entry);

    return {
      success: true,
      remaining: config.limit - 1,
      resetAt: entry.resetAt,
    };
  }

  // カウントをインクリメント
  entry.count++;

  // 制限を超えた場合
  if (entry.count > config.limit) {
    return {
      success: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  return {
    success: true,
    remaining: config.limit - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * RedisベースのRate Limit
 */
async function checkRateLimitRedis(ip: string, endpoint: string): Promise<RateLimitResult> {
  const key = generateKey(ip, endpoint);
  const config = getConfig(endpoint);
  const now = Date.now();

  // Redisでカウントをインクリメント
  const count = await redis.incr(key);
  
  if (count === null) {
    // Redisエラー時はメモリフォールバック
    return checkRateLimitMemory(ip, endpoint);
  }

  // 最初のリクエストの場合、TTLを設定
  if (count === 1) {
    await redis.expire(key, config.windowSec);
  }

  const resetAt = now + config.windowSec * 1000;

  // 制限を超えた場合
  if (count > config.limit) {
    return {
      success: false,
      remaining: 0,
      resetAt,
    };
  }

  return {
    success: true,
    remaining: config.limit - count,
    resetAt,
  };
}

/**
 * Rate Limitをチェック（async版）
 * 
 * Redisが利用可能な場合はRedisを使用、そうでない場合はメモリフォールバック
 */
export async function checkRateLimit(ip: string, endpoint: string): Promise<RateLimitResult> {
  if (isRedisAvailable()) {
    return checkRateLimitRedis(ip, endpoint);
  }
  return checkRateLimitMemory(ip, endpoint);
}

/**
 * Rate Limitヘッダーを生成
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetAt / 1000).toString(),
  };
}

/**
 * IPアドレスを取得（プロキシ対応）
 */
export function getClientIp(request: Request): string {
  // Vercel/Cloudflare等のプロキシヘッダーをチェック
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // ローカル開発用
  return '127.0.0.1';
}
