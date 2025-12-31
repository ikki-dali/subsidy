// Supabase クライアント（Anon / RLS 適用）
//
// NOTE:
// Route Handler などサーバー側から import されることもあるため、
// モジュールトップレベルで `createClient(...)` を実行しない（遅延初期化）

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const missing: string[] = [];
  if (!supabaseUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseAnonKey) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');

  if (missing.length > 0) {
    throw new Error(
      `Supabase環境変数が設定されていません: ${missing.join(', ')}`
    );
  }

  return createClient<Database, 'public'>(supabaseUrl!, supabaseAnonKey!);
}

type SupabaseAnonClient = ReturnType<typeof createSupabaseClient>;

let cachedClient: SupabaseAnonClient | null = null;

export function getSupabase(): SupabaseAnonClient {
  if (!cachedClient) {
    cachedClient = createSupabaseClient();
  }
  return cachedClient;
}

// 既存コードとの互換のため `supabase.from(...)` 形式は維持（初回アクセス時に初期化）
export const supabase = new Proxy({} as SupabaseAnonClient, {
  get(_target, prop) {
    const client = getSupabase();
    const value = (client as unknown as Record<PropertyKey, unknown>)[prop];
    if (typeof value === 'function') {
      return (value as (...args: unknown[]) => unknown).bind(client);
    }
    return value;
  },
});
