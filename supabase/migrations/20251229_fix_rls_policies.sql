-- RLSポリシー修正（companies / company_interests）
-- 既存ポリシーが PUBLIC に適用されていると、anon key から会社情報が閲覧・更新できる危険があるため
-- 明示的に service_role のみに限定する

DROP POLICY IF EXISTS "Service role can do all on companies" ON companies;
DROP POLICY IF EXISTS "Service role can do all on company_interests" ON company_interests;

CREATE POLICY "Service role can do all on companies" ON companies
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do all on company_interests" ON company_interests
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- フェーズ2テーブルも、現状はクライアントから直接触らせない前提で service_role のみに制限
ALTER TABLE IF EXISTS favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notification_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can do all on favorites" ON favorites;
DROP POLICY IF EXISTS "Service role can do all on leads" ON leads;
DROP POLICY IF EXISTS "Service role can do all on notification_settings" ON notification_settings;

CREATE POLICY "Service role can do all on favorites" ON favorites
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do all on leads" ON leads
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do all on notification_settings" ON notification_settings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);



