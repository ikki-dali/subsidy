-- パスワードリセットトークンを平文保存しないようハッシュ化する

-- pgcrypto でハッシュ化
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- すでに64桁のhexで保存されているものは除外し、それ以外をSHA-256でハッシュ化
UPDATE password_reset_tokens
SET token = encode(digest(token, 'sha256'), 'hex')
WHERE token IS NOT NULL
  AND token !~ '^[0-9a-f]{64}$';

COMMENT ON COLUMN password_reset_tokens.token IS 'リセットトークンのSHA-256ハッシュ（平文は保存しない）';
