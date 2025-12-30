-- 通知設定テーブル作成（フェーズ2用）

CREATE TABLE notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  slack_webhook_url TEXT,
  email_notifications BOOLEAN DEFAULT true,
  watched_areas TEXT[],                -- ウォッチ地域
  watched_industries TEXT[],           -- ウォッチ業種
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notification_settings_user ON notification_settings(user_id);
