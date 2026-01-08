-- companies テーブルにパスワードハッシュを追加
-- 認証をメールのみから「メール＋パスワード」に変更するため

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS password_hash TEXT;

COMMENT ON COLUMN companies.password_hash IS 'bcryptハッシュ化されたパスワード';



