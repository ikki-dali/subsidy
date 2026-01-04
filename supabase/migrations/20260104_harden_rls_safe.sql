-- RLS強化をテーブルが存在する場合にのみ安全に適用する

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
      -- ポリシーの再作成（存在しない場合も考慮）
      BEGIN
        EXECUTE format('DROP POLICY IF EXISTS "Service role can do all on %s" ON %I', tbl, tbl);
      EXCEPTION WHEN undefined_table THEN
        -- テーブルが無ければスキップ
        NULL;
      END;
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
