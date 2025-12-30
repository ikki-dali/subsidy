-- 締切アラート用テーブル

-- 通知設定テーブル（会社ごとの設定）
CREATE TABLE IF NOT EXISTS company_alert_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
  email_enabled BOOLEAN DEFAULT true,
  alert_days INTEGER[] DEFAULT ARRAY[7, 3, 1], -- 何日前に通知するか
  include_favorites BOOLEAN DEFAULT true,      -- お気に入りの締切通知
  include_viewed BOOLEAN DEFAULT true,         -- 閲覧済みの締切通知
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 送信済み通知の履歴（重複送信防止）
CREATE TABLE IF NOT EXISTS deadline_alert_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  subsidy_id UUID NOT NULL REFERENCES subsidies(id) ON DELETE CASCADE,
  days_before INTEGER NOT NULL,  -- 何日前の通知か（7, 3, 1）
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  email_id TEXT,                 -- Resendから返却されるID
  UNIQUE(company_id, subsidy_id, days_before)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_alert_settings_company_id ON company_alert_settings(company_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_company_id ON deadline_alert_history(company_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_subsidy_id ON deadline_alert_history(subsidy_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_sent_at ON deadline_alert_history(sent_at DESC);

-- RLSポリシー
ALTER TABLE company_alert_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE deadline_alert_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can do all on company_alert_settings" ON company_alert_settings
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do all on deadline_alert_history" ON deadline_alert_history
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 更新時のトリガー
CREATE TRIGGER update_company_alert_settings_updated_at
  BEFORE UPDATE ON company_alert_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- コメント
COMMENT ON TABLE company_alert_settings IS '企業ごとの締切アラート設定';
COMMENT ON COLUMN company_alert_settings.alert_days IS '通知タイミング（締切何日前）';
COMMENT ON COLUMN company_alert_settings.include_favorites IS 'お気に入り補助金の締切を通知するか';
COMMENT ON COLUMN company_alert_settings.include_viewed IS '閲覧済み補助金の締切を通知するか';

COMMENT ON TABLE deadline_alert_history IS '送信済み締切アラートの履歴';
COMMENT ON COLUMN deadline_alert_history.days_before IS '締切何日前の通知か';
COMMENT ON COLUMN deadline_alert_history.email_id IS 'Resendのメール送信ID';
