-- RLS の厳格化
-- 会社関連データを anon/authenticated から操作できないよう service_role のみに限定する

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'company_alert_settings',
    'deadline_alert_history',
    'notification_history',
    'browsing_history',
    'search_history',
    'push_subscriptions'
  ]
  LOOP
    IF to_regclass('public.' || tbl) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "Service role can do all on %1$s" ON %1$I', tbl);
      EXECUTE format($f$
        CREATE POLICY "Service role can do all on %1$s" ON %1$I
          FOR ALL
          TO service_role
          USING (true)
          WITH CHECK (true);
      $f$, tbl);
    END IF;
  END LOOP;
END;
$$;
