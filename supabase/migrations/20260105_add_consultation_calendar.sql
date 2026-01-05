-- 相談予約のカレンダー連携機能のためのマイグレーション

-- 担当者テーブルの作成
CREATE TABLE IF NOT EXISTS consultation_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  google_calendar_id VARCHAR(255), -- カレンダーID（通常はメールアドレス）
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_consultation_staff_email ON consultation_staff(email);
CREATE INDEX IF NOT EXISTS idx_consultation_staff_active ON consultation_staff(is_active);

-- RLS有効化
ALTER TABLE consultation_staff ENABLE ROW LEVEL SECURITY;

-- Service roleポリシー
CREATE POLICY "Service role can do all on consultation_staff" ON consultation_staff
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- コメント
COMMENT ON TABLE consultation_staff IS '相談担当者テーブル';
COMMENT ON COLUMN consultation_staff.google_calendar_id IS 'Google Calendar ID（通常はメールアドレス）';

-- consultation_bookingsテーブルにカラム追加
ALTER TABLE consultation_bookings ADD COLUMN IF NOT EXISTS staff_id UUID REFERENCES consultation_staff(id);
ALTER TABLE consultation_bookings ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ;
ALTER TABLE consultation_bookings ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ;
ALTER TABLE consultation_bookings ADD COLUMN IF NOT EXISTS google_event_id VARCHAR(255);
ALTER TABLE consultation_bookings ADD COLUMN IF NOT EXISTS meet_link VARCHAR(500);

-- インデックス追加
CREATE INDEX IF NOT EXISTS idx_consultation_bookings_staff ON consultation_bookings(staff_id);
CREATE INDEX IF NOT EXISTS idx_consultation_bookings_start_time ON consultation_bookings(start_time);

-- コメント追加
COMMENT ON COLUMN consultation_bookings.staff_id IS '担当者ID';
COMMENT ON COLUMN consultation_bookings.start_time IS '予約開始時刻';
COMMENT ON COLUMN consultation_bookings.end_time IS '予約終了時刻（バッファ込み）';
COMMENT ON COLUMN consultation_bookings.google_event_id IS 'Google CalendarのイベントID';
COMMENT ON COLUMN consultation_bookings.meet_link IS 'Google Meetリンク';

-- デフォルト担当者を1人追加（後で更新する）
-- INSERT INTO consultation_staff (name, email, google_calendar_id)
-- VALUES ('担当者', 'staff@example.com', 'staff@example.com');

