-- 通知履歴テーブル（重複通知防止用）
CREATE TABLE IF NOT EXISTS notification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  interest_id UUID NOT NULL REFERENCES company_interests(id) ON DELETE CASCADE,
  notified_subsidy_id TEXT NOT NULL, -- 通知した補助金のID
  similarity_score DECIMAL(3,2), -- 類似度スコア
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(interest_id, notified_subsidy_id)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_notification_history_company_id ON notification_history(company_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_interest_id ON notification_history(interest_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_sent_at ON notification_history(sent_at DESC);

-- RLS
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can do all on notification_history" ON notification_history
  FOR ALL
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE notification_history IS '類似補助金通知の送信履歴';
