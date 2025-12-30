-- 補助金テーブル作成
-- pg_trgm 拡張を有効化（全文検索用）
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE subsidies (
  -- 主キー・識別子
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jgrants_id VARCHAR(18) UNIQUE NOT NULL,        -- JグランツAPI上のID
  name VARCHAR(20),                               -- 管理番号（S-00007689）

  -- 基本情報
  title TEXT NOT NULL,                            -- 補助金タイトル
  catch_phrase TEXT,                              -- キャッチフレーズ
  description TEXT,                               -- 詳細説明（HTMLサニタイズ後）

  -- 対象条件
  target_area TEXT[],                             -- 対象地域（配列）
  target_area_detail TEXT,                        -- 地域条件詳細
  industry JSONB,                                 -- 対象業種（配列）
  use_purpose TEXT,                               -- 利用目的
  target_number_of_employees VARCHAR(50),         -- 対象従業員数

  -- 金額・補助率
  max_amount BIGINT,                              -- 補助上限額
  subsidy_rate VARCHAR(50),                       -- 補助率

  -- 期間
  start_date TIMESTAMPTZ,                         -- 募集開始日
  end_date TIMESTAMPTZ,                           -- 募集終了日
  project_end_deadline TIMESTAMPTZ,               -- 事業終了期限

  -- URL・参照
  official_url TEXT,                              -- 公式ページURL
  front_url TEXT,                                 -- Jグランツ詳細ページURL

  -- ステータス・メタ
  is_active BOOLEAN DEFAULT true,                 -- 募集中フラグ
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- インデックス
CREATE INDEX idx_subsidies_jgrants_id ON subsidies(jgrants_id);
CREATE INDEX idx_subsidies_is_active ON subsidies(is_active);
CREATE INDEX idx_subsidies_end_date ON subsidies(end_date);
CREATE INDEX idx_subsidies_industry ON subsidies USING gin(industry);

-- 全文検索用（日本語対応はpgroongaが理想だが、まずはpg_trgmで対応）
CREATE INDEX idx_subsidies_title_trgm ON subsidies USING gin(title gin_trgm_ops);
