-- 会社テーブル
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  industry TEXT NOT NULL,
  employee_count TEXT NOT NULL, -- '1-5', '6-20', '21-50', '51-100', '101-300', '301+'
  annual_revenue TEXT, -- 'under_10m', '10m_50m', '50m_100m', '100m_500m', '500m_1b', 'over_1b'
  prefecture TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  invited_by UUID REFERENCES companies(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 会社と補助金の興味関連テーブル
CREATE TABLE IF NOT EXISTS company_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  subsidy_id TEXT NOT NULL, -- subsidies.jgrants_id を参照
  note TEXT, -- ユーザーからのコメント
  status TEXT DEFAULT 'interested', -- 'interested', 'contacted', 'applied', 'rejected'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, subsidy_id)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_companies_email ON companies(email);
CREATE INDEX IF NOT EXISTS idx_companies_industry ON companies(industry);
CREATE INDEX IF NOT EXISTS idx_companies_prefecture ON companies(prefecture);
CREATE INDEX IF NOT EXISTS idx_company_interests_company_id ON company_interests(company_id);
CREATE INDEX IF NOT EXISTS idx_company_interests_subsidy_id ON company_interests(subsidy_id);
CREATE INDEX IF NOT EXISTS idx_company_interests_created_at ON company_interests(created_at DESC);

-- RLS (Row Level Security) ポリシー
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_interests ENABLE ROW LEVEL SECURITY;

-- サービスロールは全アクセス可能
CREATE POLICY "Service role can do all on companies" ON companies
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do all on company_interests" ON company_interests
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 更新時にupdated_atを自動更新するトリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_interests_updated_at
  BEFORE UPDATE ON company_interests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- コメント
COMMENT ON TABLE companies IS '登録企業情報';
COMMENT ON COLUMN companies.employee_count IS '従業員数区分: 1-5, 6-20, 21-50, 51-100, 101-300, 301+';
COMMENT ON COLUMN companies.annual_revenue IS '年商区分: under_10m, 10m_50m, 50m_100m, 100m_500m, 500m_1b, over_1b';

COMMENT ON TABLE company_interests IS '企業が興味を持った補助金';
COMMENT ON COLUMN company_interests.status IS 'ステータス: interested(興味あり), contacted(連絡済), applied(申請済), rejected(不採用)';

