-- パスワードリセットトークンテーブル
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_company_id ON password_reset_tokens(company_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- RLS有効化
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- service_role のみアクセス可能
DROP POLICY IF EXISTS "Service role can do all on password_reset_tokens" ON password_reset_tokens;
CREATE POLICY "Service role can do all on password_reset_tokens" ON password_reset_tokens
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE password_reset_tokens IS 'パスワードリセット用の一時トークン';
COMMENT ON COLUMN password_reset_tokens.token IS 'リセットトークン（URLセーフなランダム文字列）';
COMMENT ON COLUMN password_reset_tokens.expires_at IS '有効期限（通常1時間）';
COMMENT ON COLUMN password_reset_tokens.used_at IS '使用日時（NULLなら未使用）';

