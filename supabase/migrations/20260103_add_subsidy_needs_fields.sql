-- Step 3 & Step 4 用のフィールド追加（補助金ニーズ・課題）

-- 補助金利用経験
-- 'experienced_many': ある（何度も利用している）
-- 'experienced_few': ある（1-2回利用したことがある）
-- 'inexperienced_interested': ない（申請したいが方法がわからない）
-- 'inexperienced_not_interested': ない（興味がない/必要を感じていない）
ALTER TABLE companies ADD COLUMN IF NOT EXISTS subsidy_experience TEXT;

-- 補助金利用用途（複数選択可）
-- 'it_dx': IT導入・DX推進
-- 'equipment': 設備投資・機械導入
-- 'new_business': 新規事業・事業拡大
-- 'training': 人材育成・研修
-- 'marketing': 販路開拓・マーケティング
-- 'eco': 省エネ・環境対策
-- 'succession': 事業承継・M&A
-- 'other': その他
ALTER TABLE companies ADD COLUMN IF NOT EXISTS subsidy_purposes TEXT[] DEFAULT '{}';

-- その他の用途（自由記述）
ALTER TABLE companies ADD COLUMN IF NOT EXISTS subsidy_purpose_other TEXT;

-- 現在の課題（複数選択可）
-- 'efficiency': 業務効率化・工数削減
-- 'digitalization': IT化・デジタル化の遅れ
-- 'labor_shortage': 人手不足・採用難
-- 'revenue_decline': 売上・利益の低下
-- 'customer_acquisition': 新規顧客の獲得
-- 'productivity': 生産性向上
-- 'subsidy_knowhow': 補助金申請のノウハウ不足
-- 'none': 特になし
-- 'other': その他
ALTER TABLE companies ADD COLUMN IF NOT EXISTS current_challenges TEXT[] DEFAULT '{}';

-- その他の課題（自由記述）
ALTER TABLE companies ADD COLUMN IF NOT EXISTS challenge_other TEXT;

-- リードスコア（自動計算）
ALTER TABLE companies ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0;

-- コメント追加
COMMENT ON COLUMN companies.subsidy_experience IS '補助金利用経験: experienced_many, experienced_few, inexperienced_interested, inexperienced_not_interested';
COMMENT ON COLUMN companies.subsidy_purposes IS '補助金利用用途: it_dx, equipment, new_business, training, marketing, eco, succession, other';
COMMENT ON COLUMN companies.subsidy_purpose_other IS '補助金利用用途（その他）の自由記述';
COMMENT ON COLUMN companies.current_challenges IS '現在の課題: efficiency, digitalization, labor_shortage, revenue_decline, customer_acquisition, productivity, subsidy_knowhow, none, other';
COMMENT ON COLUMN companies.challenge_other IS '現在の課題（その他）の自由記述';
COMMENT ON COLUMN companies.lead_score IS 'リードスコア（0-100）';

-- インデックス追加（スコアリング用）
CREATE INDEX IF NOT EXISTS idx_companies_lead_score ON companies(lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_companies_subsidy_experience ON companies(subsidy_experience);
