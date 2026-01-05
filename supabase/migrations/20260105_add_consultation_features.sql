-- 招待特典・相談予約機能のためのマイグレーション

-- companiesテーブルに相談枠関連カラムを追加
ALTER TABLE companies ADD COLUMN IF NOT EXISTS free_consultation_slots INTEGER DEFAULT 0;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS total_successful_invites INTEGER DEFAULT 0;

COMMENT ON COLUMN companies.free_consultation_slots IS '無料相談枠の残り回数（上限2回）';
COMMENT ON COLUMN companies.total_successful_invites IS '招待成功の累計人数';

-- 相談予約テーブルの作成
CREATE TABLE IF NOT EXISTS consultation_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  preferred_date DATE NOT NULL,
  preferred_time_slot VARCHAR(20) NOT NULL CHECK (preferred_time_slot IN ('morning', 'afternoon', 'evening')),
  consultation_topic TEXT,
  contact_name VARCHAR(100),
  contact_phone VARCHAR(20),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  is_free BOOLEAN DEFAULT false,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_consultation_bookings_company ON consultation_bookings(company_id);
CREATE INDEX IF NOT EXISTS idx_consultation_bookings_status ON consultation_bookings(status);
CREATE INDEX IF NOT EXISTS idx_consultation_bookings_date ON consultation_bookings(preferred_date);

-- RLS有効化
ALTER TABLE consultation_bookings ENABLE ROW LEVEL SECURITY;

-- Service roleポリシー
CREATE POLICY "Service role can do all on consultation_bookings" ON consultation_bookings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- コメント
COMMENT ON TABLE consultation_bookings IS '相談予約テーブル';
COMMENT ON COLUMN consultation_bookings.preferred_date IS '希望日';
COMMENT ON COLUMN consultation_bookings.preferred_time_slot IS '希望時間帯: morning(午前), afternoon(午後), evening(夕方)';
COMMENT ON COLUMN consultation_bookings.consultation_topic IS '相談内容・トピック';
COMMENT ON COLUMN consultation_bookings.status IS 'pending:申込済, confirmed:確定, completed:完了, cancelled:キャンセル';
COMMENT ON COLUMN consultation_bookings.is_free IS '無料枠利用かどうか';
COMMENT ON COLUMN consultation_bookings.admin_notes IS '管理者メモ';

