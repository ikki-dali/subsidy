# Phase 4-1: Supabase クライアント実装

**チケットID**: PHASE4-1
**複雑度**: Simple
**依存**: PHASE3-1, PHASE3-2
**担当**: Claude

---

## 概要
`src/lib/supabase.ts` に型安全な Supabase クライアントを実装する。

## 成果物
- `@supabase/supabase-js` パッケージインストール
- Supabase クライアント（クライアントサイド用）
- Supabase クライアント（サーバーサイド用）
- データベース型定義

## タスク

- [ ] `@supabase/supabase-js` インストール
- [ ] `src/lib/supabase.ts` 作成（クライアント用）
- [ ] `src/lib/supabase-server.ts` 作成（サーバー用）
- [ ] `src/types/database.ts` 型定義作成
- [ ] 型の自動生成設定（オプション）

## コマンド

```bash
npm install @supabase/supabase-js

# 型自動生成（オプション、Supabase CLI必要）
npx supabase gen types typescript --project-id your-project-id > src/types/database.ts
```

## ファイル内容

### src/lib/supabase.ts（クライアント用）

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
```

### src/lib/supabase-server.ts（サーバー用）

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
```

### src/types/database.ts（型定義）

```typescript
export type Database = {
  public: {
    Tables: {
      subsidies: {
        Row: {
          id: string;
          jgrants_id: string;
          name: string | null;
          title: string;
          catch_phrase: string | null;
          description: string | null;
          target_area: string[] | null;
          target_area_detail: string | null;
          industry: string[] | null;
          use_purpose: string | null;
          target_number_of_employees: string | null;
          max_amount: number | null;
          subsidy_rate: string | null;
          start_date: string | null;
          end_date: string | null;
          project_end_deadline: string | null;
          official_url: string | null;
          front_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: { ... };
        Update: { ... };
      };
      // favorites, leads, notification_settings も同様
    };
  };
};

export type Subsidy = Database['public']['Tables']['subsidies']['Row'];
```

## 完了条件
- `supabase` クライアントがインポートして使用できる
- 型補完が効く
- サーバー用とクライアント用が分離されている

## 備考
- 型定義は手動作成でも良いが、`supabase gen types` で自動生成推奨
- Next.js 14 の Server Components では `supabaseAdmin` を使用
