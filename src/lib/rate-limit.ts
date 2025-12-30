/**
 * シンプルなメモリベースのRate Limiting
 * 
 * プロダクション環境ではRedisベースの実装を推奨
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// メモリ内のレート制限ストア
const rateLimitStore = new Map<string, RateLimitEntry>();

// 定期的にクリーンアップ（1分ごと）
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    const entries = Array.from(rateLimitStore.entries());
    entries.forEach(([key, entry]) => {
      if (entry.resetAt < now) {
        rateLimitStore.delete(key);
      }
    });
  }, 60000);
}

export interface RateLimitConfig {
  // 許可するリクエスト数
  limit: number;
  // ウィンドウ期間（ミリ秒）
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

// デフォルト設定
const DEFAULT_CONFIG: RateLimitConfig = {
  limit: 100,      // 100リクエスト
  windowMs: 60000, // 1分あたり
};

// エンドポイント別の設定
const ENDPOINT_CONFIGS: Record<string, RateLimitConfig> = {
  '/api/companies': {
    limit: 5,        // 5リクエスト
    windowMs: 60000, // 1分あたり（登録は制限を厳しく）
  },
  '/api/interests': {
    limit: 30,       // 30リクエスト
    windowMs: 60000, // 1分あたり
  },
  '/api/subsidies': {
    limit: 200,      // 200リクエスト
    windowMs: 60000, // 1分あたり（公開APIなので緩め）
  },
};

/**
 * IPアドレスとエンドポイントからキーを生成
 */
function generateKey(ip: string, endpoint: string): string {
  // エンドポイントのベースパスを取得
  const basePath = '/' + endpoint.split('/').slice(1, 3).join('/');
  return `${ip}:${basePath}`;
}

/**
 * エンドポイントの設定を取得
 */
function getConfig(endpoint: string): RateLimitConfig {
  const basePath = '/' + endpoint.split('/').slice(1, 3).join('/');
  return ENDPOINT_CONFIGS[basePath] || DEFAULT_CONFIG;
}

/**
 * Rate Limitをチェック
 */
export function checkRateLimit(ip: string, endpoint: string): RateLimitResult {
  const key = generateKey(ip, endpoint);
  const config = getConfig(endpoint);
  const now = Date.now();

  let entry = rateLimitStore.get(key);

  // エントリがない、または期限切れの場合は新規作成
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 1,
      resetAt: now + config.windowMs,
    };
    rateLimitStore.set(key, entry);

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

