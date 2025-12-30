# Phase 3-1: Supabase テーブル構築

**チケットID**: PHASE3-1
**複雑度**: Medium
**依存**: PHASE1-2
**担当**: Claude

---

## 概要
REQUIREMENTS.md に基づき、4つのテーブル（subsidies, favorites, leads, notification_settings）を作成する。

## 成果物
- マイグレーション SQL ファイル
- Supabase 上にテーブル作成完了
- pg_trgm 拡張有効化

## タスク

- [ ] `supabase/migrations/` ディレクトリ作成
- [ ] マイグレーションファイル作成
  - `001_create_subsidies.sql`
  - `002_create_favorites.sql`
  - `003_create_leads.sql`
  - `004_create_notification_settings.sql`
- [ ] pg_trgm 拡張を有効化
- [ ] Supabase ダッシュボードでSQL実行
- [ ] テーブル作成確認

## テーブル一覧

### 1. subsidies（補助金）
主要フィールド:
- `id` (UUID, PK)
- `jgrants_id` (VARCHAR(18), UNIQUE)
- `title`, `description`, `catch_phrase`
- `target_area` (TEXT[])
- `industry` (JSONB)
- `max_amount` (BIGINT)
- `start_date`, `end_date` (TIMESTAMPTZ)
- `is_active` (BOOLEAN)

### 2. favorites（お気に入り）
- `user_id` → `auth.users(id)`
- `subsidy_id` → `subsidies(id)`
- UNIQUE(user_id, subsidy_id)

### 3. leads（リード）※フェーズ2用
- `subsidy_id` → `subsidies(id)`
- `company_name`, `contact_name`, `email`, `phone`, `message`
- `status` (new/contacted/converted/lost)

### 4. notification_settings（通知設定）※フェーズ2用
- `user_id` → `auth.users(id)`
- `slack_webhook_url`
- `watched_areas`, `watched_industries`

## SQL（subsidies テーブル例）

```sql
-- pg_trgm 拡張を有効化
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE subsidies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jgrants_id VARCHAR(18) UNIQUE NOT NULL,
  name VARCHAR(20),
  title TEXT NOT NULL,
  catch_phrase TEXT,
  description TEXT,
  target_area TEXT[],
  target_area_detail TEXT,
  industry JSONB,
  use_purpose TEXT,
  target_number_of_employees VARCHAR(50),
  max_amount BIGINT,
  subsidy_rate VARCHAR(50),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  project_end_deadline TIMESTAMPTZ,
  official_url TEXT,
  front_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_subsidies_jgrants_id ON subsidies(jgrants_id);
CREATE INDEX idx_subsidies_is_active ON subsidies(is_active);
CREATE INDEX idx_subsidies_end_date ON subsidies(end_date);
CREATE INDEX idx_subsidies_industry ON subsidies USING gin(industry);
CREATE INDEX idx_subsidies_title_trgm ON subsidies USING gin(title gin_trgm_ops);
```

## 完了条件
- 4テーブルが Supabase 上に作成されている
- インデックスが正しく設定されている
- Table Editor で確認できる

## 備考
- RLS（Row Level Security）ポリシーは後で設定
- leads, notification_settings はフェーズ2で使用
