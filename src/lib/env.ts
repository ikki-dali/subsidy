/**
 * 環境変数の型安全なアクセスと検証
 */

type EnvConfig = {
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  
  // JWT（必須）
  JWT_SECRET: string;
  
  // Slack (optional)
  SLACK_WEBHOOK_URL?: string;
  
  // App
  NEXT_PUBLIC_BASE_URL?: string;
  NODE_ENV: 'development' | 'production' | 'test';
};

// 必須環境変数のリスト
const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'JWT_SECRET',
] as const;

// 環境変数のキャッシュ
let envCache: EnvConfig | null = null;

/**
 * 環境変数を取得・検証
 */
export function getEnv(): EnvConfig {
  if (envCache) {
    return envCache;
  }

  // 必須環境変数のチェック
  const missingVars: string[] = [];
  
  for (const varName of REQUIRED_ENV_VARS) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`
    );
  }

  envCache = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    JWT_SECRET: process.env.JWT_SECRET!,
    SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    NODE_ENV: (process.env.NODE_ENV as EnvConfig['NODE_ENV']) || 'development',
  };

  return envCache;
}

/**
 * 個別の環境変数を安全に取得
 */
export function getSupabaseUrl(): string {
  return getEnv().NEXT_PUBLIC_SUPABASE_URL;
}

export function getSupabaseAnonKey(): string {
  return getEnv().NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

export function getSupabaseServiceKey(): string {
  return getEnv().SUPABASE_SERVICE_ROLE_KEY;
}

export function getJwtSecret(): string {
  return getEnv().JWT_SECRET;
}

export function getSlackWebhookUrl(): string | undefined {
  return getEnv().SLACK_WEBHOOK_URL;
}

export function getBaseUrl(): string {
  return getEnv().NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
}

export function isProduction(): boolean {
  return getEnv().NODE_ENV === 'production';
}

/**
 * 起動時の環境変数チェック（サーバー側のみ）
 */
export function validateEnvOnStartup(): void {
  try {
    getEnv();
    console.log('✓ Environment variables validated successfully');
  } catch (error) {
    console.error('✗ Environment validation failed:', error);
    if (isProduction()) {
      process.exit(1);
    }
  }
}

