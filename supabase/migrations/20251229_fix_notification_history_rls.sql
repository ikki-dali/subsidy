-- notification_history のRLSポリシー修正
-- 既存ポリシーが PUBLIC に適用されていると anon key から閲覧・更新できる危険があるため
-- 明示的に service_role のみに限定する

ALTER TABLE IF EXISTS notification_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can do all on notification_history" ON notification_history;

CREATE POLICY "Service role can do all on notification_history" ON notification_history
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);



