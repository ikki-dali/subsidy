-- companiesテーブルに電話番号カラムを追加
ALTER TABLE companies ADD COLUMN IF NOT EXISTS phone TEXT;

-- コメント
COMMENT ON COLUMN companies.phone IS '担当者電話番号';

