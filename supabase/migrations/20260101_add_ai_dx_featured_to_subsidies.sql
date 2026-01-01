-- subsidiesテーブルにAI/IT/DX特集ピン留めフラグを追加

ALTER TABLE subsidies
  ADD COLUMN IF NOT EXISTS ai_dx_featured BOOLEAN DEFAULT false;

COMMENT ON COLUMN subsidies.ai_dx_featured IS 'AI/IT/DX特集として手動ピン留めする（募集中以外でも表示可）';

-- ピン留め対象の抽出を高速化（少数想定だが安全側で付与）
CREATE INDEX IF NOT EXISTS idx_subsidies_ai_dx_featured ON subsidies(ai_dx_featured);


