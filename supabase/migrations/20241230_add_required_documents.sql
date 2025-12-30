-- subsidiesテーブルに必要書類カラムを追加
ALTER TABLE subsidies ADD COLUMN IF NOT EXISTS required_documents TEXT[];

-- コメント
COMMENT ON COLUMN subsidies.required_documents IS '申請に必要な書類リスト';

-- サンプルデータ更新（一般的な補助金の必要書類）
-- 実際の運用では、各補助金ごとに適切な書類リストを設定してください

