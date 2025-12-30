-- 閲覧履歴テーブル
CREATE TABLE IF NOT EXISTS browsing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  subsidy_id UUID NOT NULL REFERENCES subsidies(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, subsidy_id)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_browsing_history_company_id ON browsing_history(company_id);
CREATE INDEX IF NOT EXISTS idx_browsing_history_viewed_at ON browsing_history(viewed_at DESC);

-- コメント
COMMENT ON TABLE browsing_history IS '補助金閲覧履歴';
COMMENT ON COLUMN browsing_history.company_id IS '企業ID';
COMMENT ON COLUMN browsing_history.subsidy_id IS '補助金ID';
COMMENT ON COLUMN browsing_history.viewed_at IS '閲覧日時';

-- 検索履歴テーブル
CREATE TABLE IF NOT EXISTS search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  filters JSONB,
  searched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_search_history_company_id ON search_history(company_id);
CREATE INDEX IF NOT EXISTS idx_search_history_searched_at ON search_history(searched_at DESC);

-- コメント
COMMENT ON TABLE search_history IS '検索履歴';
COMMENT ON COLUMN search_history.company_id IS '企業ID';
COMMENT ON COLUMN search_history.keyword IS '検索キーワード';
COMMENT ON COLUMN search_history.filters IS '検索フィルター（JSON）';
COMMENT ON COLUMN search_history.searched_at IS '検索日時';

-- プッシュ通知購読テーブル
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, endpoint)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_company_id ON push_subscriptions(company_id);

-- コメント
COMMENT ON TABLE push_subscriptions IS 'プッシュ通知購読';
COMMENT ON COLUMN push_subscriptions.company_id IS '企業ID';
COMMENT ON COLUMN push_subscriptions.endpoint IS 'プッシュ通知エンドポイント';
COMMENT ON COLUMN push_subscriptions.p256dh IS '公開鍵';
COMMENT ON COLUMN push_subscriptions.auth IS '認証キー';

