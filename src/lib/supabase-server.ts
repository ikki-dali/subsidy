// Supabase クライアント（サーバーサイド用 / Service Role）
//
// NOTE:
// Next.js のビルド工程では Route Handler / Server Component を import して解析します。
// その際にモジュールトップレベルで `createClient(...)` を実行すると、
// 環境変数未設定の環境でビルドが落ちることがあるため、遅延初期化にしています。

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

function createSupabaseAdminClient() {
  // Vercel/Supabase 連携などで変数名が揺れるケースに備え、URLのみフォールバックを許容
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const missing: string[] = [];
  if (!supabaseUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseServiceKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');

  if (missing.length > 0) {
    throw new Error(
      `Supabase環境変数が設定されていません: ${missing.join(', ')}`
    );
  }

  return createClient<Database, 'public'>(supabaseUrl!, supabaseServiceKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

type SupabaseAdminClient = ReturnType<typeof createSupabaseAdminClient>;

let cachedAdminClient: SupabaseAdminClient | null = null;

export function getSupabaseAdmin(): SupabaseAdminClient {
  if (!cachedAdminClient) {
    cachedAdminClient = createSupabaseAdminClient();
  }
  return cachedAdminClient;
}

// 既存コードとの互換のため `supabaseAdmin.from(...)` 形式は維持（初回アクセス時に初期化）
export const supabaseAdmin = new Proxy({} as SupabaseAdminClient, {
  get(_target, prop) {
    const client = getSupabaseAdmin();
    const value = (client as unknown as Record<PropertyKey, unknown>)[prop];
    if (typeof value === 'function') {
      // `this` 依存のメソッド呼び出しを壊さないよう bind
      return (value as (...args: unknown[]) => unknown).bind(client);
    }
    return value;
  },
});
