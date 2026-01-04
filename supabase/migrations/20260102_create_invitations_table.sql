-- 招待テーブルの作成
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) UNIQUE NOT NULL,
  inviter_company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  invited_email VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'used', 'expired', 'cancelled')),
  used_by_company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  used_at TIMESTAMPTZ
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_invitations_code ON invitations(code);
CREATE INDEX IF NOT EXISTS idx_invitations_inviter ON invitations(inviter_company_id);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);

-- RLS有効化
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Service roleポリシー
CREATE POLICY "Service role can do all on invitations" ON invitations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- コメント
COMMENT ON TABLE invitations IS '招待リンク管理テーブル';
COMMENT ON COLUMN invitations.code IS '招待コード（URLに使用）';
COMMENT ON COLUMN invitations.inviter_company_id IS '招待した企業ID';
COMMENT ON COLUMN invitations.invited_email IS '招待先メールアドレス（任意）';
COMMENT ON COLUMN invitations.status IS 'pending:未使用, used:使用済み, expired:期限切れ, cancelled:キャンセル';
COMMENT ON COLUMN invitations.used_by_company_id IS '招待を使用した企業ID';
COMMENT ON COLUMN invitations.expires_at IS '有効期限';
