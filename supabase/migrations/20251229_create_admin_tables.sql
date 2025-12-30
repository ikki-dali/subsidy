-- 管理画面用テーブル作成

-- ======================
-- 1. 管理者テーブル
-- ======================
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'admin', -- 'admin', 'super_admin'
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active);

-- RLS設定
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can do all on admin_users" ON admin_users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 更新トリガー
CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE admin_users IS '管理者ユーザー';
COMMENT ON COLUMN admin_users.role IS '権限: admin(通常管理者), super_admin(スーパー管理者)';

-- ======================
-- 2. 会社お気に入りテーブル（localStorageからDB移行用）
-- ======================
CREATE TABLE IF NOT EXISTS company_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  subsidy_id TEXT NOT NULL, -- subsidies.jgrants_id を参照
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, subsidy_id)
);

CREATE INDEX IF NOT EXISTS idx_company_favorites_company_id ON company_favorites(company_id);
CREATE INDEX IF NOT EXISTS idx_company_favorites_subsidy_id ON company_favorites(subsidy_id);
CREATE INDEX IF NOT EXISTS idx_company_favorites_created_at ON company_favorites(created_at DESC);

-- RLS設定
ALTER TABLE company_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can do all on company_favorites" ON company_favorites
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE company_favorites IS '企業のお気に入り補助金';

-- ======================
-- 3. company_interestsにread_at追加（未読/既読管理）
-- ======================
ALTER TABLE company_interests ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_company_interests_read_at ON company_interests(read_at);

COMMENT ON COLUMN company_interests.read_at IS '管理者が確認した日時（未読=NULL）';
