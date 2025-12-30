# 補助金検索プラットフォーム 要件定義書 v2.0

**作成日**: 2025年12月27日  
**更新日**: 2025年12月27日（API検証完了後更新）

---

## 1. プロジェクト概要

### 1.1 プロジェクト名
補助金検索プラットフォーム（仮称：補助金ナビ）

### 1.2 目的
全国の補助金情報を一元的に集約・検索できるWebアプリケーションを構築し、以下を実現する：

1. 自分自身の事業に活用できる補助金を効率的に探す
2. 補助金を活用できる見込み客への営業アクションを効率化する
3. 将来的にサービスとして展開し、マネタイズを目指す

### 1.3 ターゲットユーザー
- 中小企業の経営者・担当者
- 創業予定者・スタートアップ
- 補助金を活用したサービス提供者（コンサル、士業等）

### 1.4 クライアント
未定 個人利用スタートを検討中

---

## 2. JグランツAPI 仕様（検証済み）

### 2.1 概要
デジタル庁が2024年10月に公開した公式API。**無料・認証不要**で利用可能。

- **ベースURL**: `https://api.jgrants-portal.go.jp/exp/v1/public`
- **レート制限**: なし（ただし常識的な範囲で）
- **データ形式**: JSON

### 2.2 エンドポイント一覧

| エンドポイント | メソッド | 説明 |
|---------------|---------|------|
| `/subsidies` | GET | 補助金一覧検索 |
| `/subsidies/id/{id}` | GET | 補助金詳細取得 |

### 2.3 一覧API（/subsidies）

#### リクエスト例
```bash
curl -s "https://api.jgrants-portal.go.jp/exp/v1/public/subsidies" \
  -G --data-urlencode 'request={"acceptance":1,"keyword":"IT"}'
```

#### レスポンスフィールド（一覧）

| フィールド | 型 | 説明 |
|-----------|-----|------|
| id | string(18) | 補助金ID（例：a0WJ200000CDWaWMAX） |
| name | string | 管理番号（例：S-00007689） |
| title | string | 補助金タイトル |
| target_area_search | string | 対象地域 |
| subsidy_max_limit | number | 補助上限額（円） |
| acceptance_start_datetime | datetime | 募集開始日時 |
| acceptance_end_datetime | datetime | 募集終了日時 |
| target_number_of_employees | string | 対象従業員数 |

### 2.4 詳細API（/subsidies/id/{id}）【✅ 検証済み】

#### リクエスト例
```bash
curl -s "https://api.jgrants-portal.go.jp/exp/v1/public/subsidies/id/a0WJ200000CDWaWMAX" \
  | python3 -m json.tool
```

#### レスポンスフィールド（詳細API固有）

| フィールド | 型 | 説明 | 例 |
|-----------|-----|------|-----|
| subsidy_catch_phrase | string | キャッチフレーズ | 「社員のDXスキル向上を支援！」 |
| detail | string | 詳細説明（**HTMLタグ含む**） | `<p><strong>...` |
| use_purpose | string | 利用目的 | 「人材育成を行いたい」 |
| industry | string | 対象業種（複数、`/`区切り） | 製造業/建設業/情報通信業 |
| target_area_detail | string | 地域条件詳細 | 「堺市内に事業所を有すること」 |
| subsidy_rate | string | 補助率 | 「1/2以内」 |
| project_end_deadline | datetime | 事業終了期限 | null or 日付 |
| request_reception_presence | string | 事前受付有無 | 「無」「有」 |
| is_enable_multiple_request | boolean | 複数申請可否 | true/false |
| front_subsidy_detail_page_url | string | Jグランツ詳細ページURL | https://www.jgrants-portal.go.jp/... |
| application_guidelines | array | 募集要領PDF（base64） | [{name, data}] |
| application_form | array | 申請書類PDF | [] |

#### 重要な技術的考慮点

1. **detailフィールド**
   - HTMLタグ（`<p>`, `<strong>`, `<br>`等）が含まれる
   - 表示時にサニタイズまたはパースが必要
   - `dangerouslySetInnerHTML`使用時はXSS対策必須

2. **application_guidelines**
   - PDFがbase64エンコードで含まれる（数MB）
   - **DBには保存せず、必要時にAPIから取得**を推奨
   - または`front_subsidy_detail_page_url`でJグランツに誘導

3. **industry**
   - `/`区切りの文字列
   - 検索用にパースしてJSONB配列化を検討

---

## 3. 技術スタック

| レイヤー | 技術 | 理由 |
|---------|------|------|
| フロントエンド | Next.js 14 + TypeScript | App Router、SSR対応、SEO対策 |
| スタイリング | Tailwind CSS | 高速開発、shadcn/ui併用可能 |
| バックエンド | Supabase | 認証・DB・APIがセット、無料枠あり |
| データベース | PostgreSQL (Supabase) | 全文検索、JSONB対応 |
| バッチ処理 | Vercel Cron / GAS | 週次でAPI取得→DB更新 |
| ホスティング | Vercel | Next.jsとの親和性、無料枠 |
| 通知 | Slack Webhook | 新着補助金通知、リード通知 |

---

## 4. データベース設計（更新版）

### 4.1 subsidies（補助金）テーブル

```sql
CREATE TABLE subsidies (
  -- 主キー・識別子
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jgrants_id VARCHAR(18) UNIQUE NOT NULL,        -- JグランツAPI上のID
  name VARCHAR(20),                               -- 管理番号（S-00007689）
  
  -- 基本情報
  title TEXT NOT NULL,                            -- 補助金タイトル
  catch_phrase TEXT,                              -- キャッチフレーズ ← NEW
  description TEXT,                               -- 詳細説明（HTMLサニタイズ後）
  
  -- 対象条件
  target_area TEXT[],                             -- 対象地域（配列）
  target_area_detail TEXT,                        -- 地域条件詳細 ← NEW
  industry JSONB,                                 -- 対象業種（配列） ← JSONB化
  use_purpose TEXT,                               -- 利用目的 ← NEW
  target_number_of_employees VARCHAR(50),         -- 対象従業員数
  
  -- 金額・補助率
  max_amount BIGINT,                              -- 補助上限額
  subsidy_rate VARCHAR(50),                       -- 補助率 ← NEW
  
  -- 期間
  start_date TIMESTAMPTZ,                         -- 募集開始日
  end_date TIMESTAMPTZ,                           -- 募集終了日
  project_end_deadline TIMESTAMPTZ,               -- 事業終了期限
  
  -- URL・参照
  official_url TEXT,                              -- 公式ページURL
  front_url TEXT,                                 -- Jグランツ詳細ページURL ← NEW
  
  -- ステータス・メタ
  is_active BOOLEAN DEFAULT true,                 -- 募集中フラグ
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- インデックス
CREATE INDEX idx_subsidies_jgrants_id ON subsidies(jgrants_id);
CREATE INDEX idx_subsidies_is_active ON subsidies(is_active);
CREATE INDEX idx_subsidies_end_date ON subsidies(end_date);
CREATE INDEX idx_subsidies_industry ON subsidies USING gin(industry);

-- 全文検索用（日本語対応はpgroonga等が必要、まずはLIKE検索で代用）
CREATE INDEX idx_subsidies_title_trgm ON subsidies USING gin(title gin_trgm_ops);
```

### 4.2 favorites（お気に入り）テーブル

```sql
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subsidy_id UUID REFERENCES subsidies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, subsidy_id)
);

CREATE INDEX idx_favorites_user ON favorites(user_id);
```

### 4.3 leads（リード）テーブル ※フェーズ2

```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subsidy_id UUID REFERENCES subsidies(id),
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  status VARCHAR(20) DEFAULT 'new',  -- new/contacted/converted/lost
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created ON leads(created_at DESC);
```

### 4.4 notification_settings（通知設定）テーブル ※フェーズ2

```sql
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
```

### 4.5 companies（企業情報）テーブル

```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                              -- 会社名
  industry TEXT NOT NULL,                          -- 業種
  employee_count TEXT NOT NULL,                    -- 従業員数区分
  annual_revenue TEXT,                             -- 年商区分
  prefecture TEXT NOT NULL,                        -- 所在地（都道府県）
  contact_name TEXT NOT NULL,                      -- 担当者名
  email TEXT UNIQUE NOT NULL,                      -- メールアドレス
  invited_by UUID REFERENCES companies(id),        -- 招待元企業ID
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_companies_email ON companies(email);
CREATE INDEX idx_companies_industry ON companies(industry);
CREATE INDEX idx_companies_prefecture ON companies(prefecture);
```

### 4.6 company_interests（企業の興味）テーブル

```sql
CREATE TABLE company_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  subsidy_id TEXT NOT NULL,                        -- subsidies.jgrants_id を参照
  note TEXT,                                       -- ユーザーからのコメント
  status TEXT DEFAULT 'interested',                -- interested/contacted/applied/rejected
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, subsidy_id)
);

CREATE INDEX idx_company_interests_company_id ON company_interests(company_id);
CREATE INDEX idx_company_interests_subsidy_id ON company_interests(subsidy_id);
```

---

## 5. 機能要件

### 5.1 フェーズ1（MVP）- 2週間

#### 5.1.1 補助金検索
- [x] キーワード検索（タイトル、説明文）
- [x] 地域フィルター（都道府県、全国）
- [x] 業種フィルター
- [x] 補助金額フィルター（〜100万、〜500万、〜1000万、1000万〜）
- [x] 募集状況フィルター（募集中のみ表示）

#### 5.1.2 補助金一覧表示
- [x] カード形式での一覧表示
- [x] 補助金額、締切日、対象地域の表示
- [x] 残り日数の表示（締切間近の強調）
- [x] ページネーション

#### 5.1.3 補助金詳細表示
- [x] 全フィールドの表示
- [x] HTML形式の詳細説明のレンダリング
- [x] 公式ページ・Jグランツページへのリンク
- [x] SNSシェアボタン

#### 5.1.4 お気に入り機能
- [x] 補助金のお気に入り登録（ローカルストレージ）
- [x] お気に入り一覧表示

### 5.2 フェーズ2（サービス展開）- 2週間

#### 5.2.1 会員制システム（オンボーディング）
- [x] オンボーディングページ（会社情報入力フォーム）
- [x] 必須入力項目: 会社名、メールアドレス
- [x] 任意入力項目: 業種、従業員数、年商、所在地、担当者名
- [x] アクセス制御Middleware（未登録ユーザーはオンボーディングへリダイレクト）
- [x] companiesテーブル作成
- [ ] Supabase Auth連携（マジックリンク認証）
- [ ] 招待制機能（invited_byカラム活用）

#### 5.2.2 「この補助金が気になる」ボタン機能
- [x] 補助金詳細ページにボタン設置
- [x] クリック時にモーダルフォーム表示（コメント入力可）
- [x] company_interestsテーブルへの保存
- [x] Slack Webhook通知
- [ ] Slackからの返信機能（将来）

#### 5.2.3 データ品質向上
- [x] 各省庁直接スクレイパー
  - [x] 厚生労働省（雇用関係助成金）
  - [x] 農林水産省（農業関連補助金）
  - [x] 環境省（環境関連補助金）
- [x] データ正規化パイプライン（金額・日付・補助率）
- [x] 重複データクリーンアップ機能
- [x] 日次自動同期（GitHub Actions）

#### 5.2.4 通知機能
- [ ] 週次の新着補助金Slack通知
- [ ] ウォッチ条件に合致する補助金の通知

---

## 5.3 データ収集戦略

### 5.3.1 データソース優先度
1. **J-Grants API** - 基本データソース（不安定な場合がある）
2. **サンプルデータ** - 主要補助金の構造化データ（手動管理）
3. **省庁直接スクレイピング**
   - 経済産業省（METI）
   - 厚生労働省（MHLW）
   - 農林水産省（MAFF）
   - 環境省（ENV）
4. **ポータルサイト**
   - ミラサポplus
   - J-Net21
   - 都道府県独自ポータル

### 5.3.2 データ正規化
- **金額**: 「1億円」「5,000万円」→ 数値（円単位）
- **日付**: 「令和7年1月1日」「2025/1/1」→ ISO 8601形式
- **補助率**: 「50%」→「1/2」、「2/3」はそのまま

### 5.3.3 自動同期スケジュール
- **日次**: GitHub Actionsで毎日06:00 JST実行
- **処理順序**: サンプルデータ → スクレイピング → クリーンアップ
- **地域分散**: 曜日ごとに異なる地域をスクレイプ

---

## 6. システム構成図

```
┌─────────────────────────────────────────────────────────────┐
│                    データ収集層（週1バッチ）                   │
│                                                             │
│  JグランツAPI ──→ Vercel Cron/GAS ──→ Supabase PostgreSQL   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                       Webアプリ層                            │
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  Next.js 14  │◄──►│   Supabase   │◄──►│    Vercel    │  │
│  │  (Frontend)  │    │ (Auth + DB)  │    │  (Hosting)   │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                        通知層                               │
│                                                             │
│  新着補助金 ──→ Slack Webhook ──→ Forest Dali チャンネル     │
│  リード獲得 ──→ Slack Webhook ──→ 営業チャンネル             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. 画面設計

### 7.1 画面一覧

| 画面名 | URL | 説明 |
|-------|-----|------|
| トップページ | `/` | 検索フォーム、人気の補助金 |
| 検索結果 | `/search` | 補助金一覧、フィルター |
| 補助金詳細 | `/subsidies/[id]` | 詳細情報、「使いたい」ボタン |
| お気に入り | `/favorites` | お気に入り一覧 |
| ログイン | `/login` | ログインフォーム |
| マイページ | `/mypage` | プロフィール、通知設定 |

### 7.2 ワイヤーフレーム（トップページ）

```
┌────────────────────────────────────────────────────────────┐
│  🔍 補助金ナビ                              [ログイン]      │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │                                                      │ │
│  │  あなたの事業に使える補助金を見つけよう               │ │
│  │                                                      │ │
│  │  [          キーワードを入力          ] [🔍 検索]   │ │
│  │                                                      │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  地域: [全国      ▼]  業種: [すべて  ▼]  金額: [指定なし▼] │
│                                                            │
├────────────────────────────────────────────────────────────┤
│  📌 締切間近の補助金                                        │
│                                                            │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ │
│  │ IT導入補助金   │ │ ものづくり補助金│ │ 小規模持続化   │ │
│  │                │ │                │ │                │ │
│  │ 最大450万円    │ │ 最大1億円      │ │ 最大250万円    │ │
│  │ 締切: 1/31     │ │ 締切: 2/15     │ │ 締切: 2/28     │ │
│  │ ⚠️ 残り35日    │ │ 残り50日       │ │ 残り63日       │ │
│  │ [詳細を見る]   │ │ [詳細を見る]   │ │ [詳細を見る]   │ │
│  └────────────────┘ └────────────────┘ └────────────────┘ │
│                                                            │
├────────────────────────────────────────────────────────────┤
│  🆕 新着補助金                                 [もっと見る→]│
│  ・令和7年度 中小企業DXリスキリング補助金（堺市）           │
│  ・地域企業デジタル化支援事業費補助金（東京都）             │
│  ・...                                                     │
└────────────────────────────────────────────────────────────┘
```

---

## 8. 開発スケジュール（4週間）

### Week 1: 基盤構築
| 日 | タスク | 成果物 |
|----|-------|--------|
| Day 1-2 | Supabase環境構築、テーブル作成 | DB環境 |
| Day 3-4 | Next.jsプロジェクト作成、基本構成 | プロジェクト雛形 |
| Day 5 | データ取得バッチ作成（GAS or Vercel Cron） | 自動データ同期 |

### Week 2: MVP機能実装
| 日 | タスク | 成果物 |
|----|-------|--------|
| Day 1-2 | 検索機能・フィルター実装 | 検索ページ |
| Day 3 | 詳細ページ実装 | 詳細表示 |
| Day 4 | お気に入り機能（ローカル） | お気に入り |
| Day 5 | Vercelデプロイ、動作確認 | **MVP公開** |

### Week 3: サービス機能
| 日 | タスク | 成果物 |
|----|-------|--------|
| Day 1-2 | Supabase Auth実装 | ログイン機能 |
| Day 3 | お気に入りクラウド同期 | データ永続化 |
| Day 4-5 | 「使いたい」ボタン・リードフォーム | リード獲得 |

### Week 4: 通知・改善
| 日 | タスク | 成果物 |
|----|-------|--------|
| Day 1-2 | Slack通知実装（新着・リード） | 通知機能 |
| Day 3-4 | UI改善、レスポンシブ対応 | 品質向上 |
| Day 5 | テスト、ドキュメント整備 | **正式リリース** |

---

## 9. API連携コード例

### 9.1 データ取得バッチ（TypeScript）

```typescript
// lib/jgrants.ts
const JGRANTS_BASE_URL = 'https://api.jgrants-portal.go.jp/exp/v1/public';

interface JGrantsSubsidy {
  id: string;
  name: string;
  title: string;
  subsidy_catch_phrase?: string;
  detail?: string;
  target_area_search?: string;
  target_area_detail?: string;
  industry?: string;
  use_purpose?: string;
  subsidy_max_limit?: number;
  subsidy_rate?: string;
  acceptance_start_datetime?: string;
  acceptance_end_datetime?: string;
  front_subsidy_detail_page_url?: string;
}

// 募集中の補助金一覧を取得
export async function fetchActiveSubsidies(keyword?: string): Promise<JGrantsSubsidy[]> {
  const request = {
    acceptance: 1,  // 募集中のみ
    ...(keyword && { keyword }),
  };
  
  const url = new URL(`${JGRANTS_BASE_URL}/subsidies`);
  url.searchParams.set('request', JSON.stringify(request));
  
  const res = await fetch(url.toString());
  const data = await res.json();
  
  return data.result || [];
}

// 補助金詳細を取得
export async function fetchSubsidyDetail(id: string): Promise<JGrantsSubsidy | null> {
  const res = await fetch(`${JGRANTS_BASE_URL}/subsidies/id/${id}`);
  const data = await res.json();
  
  return data.result?.[0] || null;
}

// HTMLサニタイズ（簡易版）
export function sanitizeHtml(html: string): string {
  // 許可するタグのみ残す
  const allowedTags = ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li'];
  // 本番ではDOMPurifyなどのライブラリを使用
  return html;
}

// 業種文字列を配列に変換
export function parseIndustry(industry: string): string[] {
  if (!industry) return [];
  return industry.split('/').map(s => s.trim()).filter(Boolean);
}
```

### 9.2 Supabase連携

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 補助金をDBに保存（Upsert）
export async function upsertSubsidy(subsidy: JGrantsSubsidy) {
  const { error } = await supabase
    .from('subsidies')
    .upsert({
      jgrants_id: subsidy.id,
      name: subsidy.name,
      title: subsidy.title,
      catch_phrase: subsidy.subsidy_catch_phrase,
      description: sanitizeHtml(subsidy.detail || ''),
      target_area: [subsidy.target_area_search].filter(Boolean),
      target_area_detail: subsidy.target_area_detail,
      industry: parseIndustry(subsidy.industry || ''),
      use_purpose: subsidy.use_purpose,
      max_amount: subsidy.subsidy_max_limit,
      subsidy_rate: subsidy.subsidy_rate,
      start_date: subsidy.acceptance_start_datetime,
      end_date: subsidy.acceptance_end_datetime,
      front_url: subsidy.front_subsidy_detail_page_url,
      is_active: true,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'jgrants_id',
    });
    
  if (error) throw error;
}
```

---

## 10. 環境変数

```bash
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...  # サーバーサイドのみ

# Slack
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# App
NEXT_PUBLIC_APP_URL=https://hojokin-navi.vercel.app
```

---

## 11. 次のアクション

### ✅ 完了
1. [x] JグランツAPI調査
2. [x] 一覧API動作確認
3. [x] 詳細API動作確認（ローカル環境で検証済み）
4. [x] DBスキーマ設計（詳細API対応版）
5. [x] 技術スタック選定
6. [x] 開発スケジュール策定

### 📋 次のステップ
1. [ ] **Supabase環境構築**（プロジェクト作成、テーブル作成）
2. [ ] **Next.jsプロジェクト作成**（基本構成）
3. [ ] **データ取得バッチ作成**
4. [ ] **検索UI実装**

---

## 参考リンク

- [JグランツAPIドキュメント](https://developers.digital.go.jp/documents/jgrants/api/)
- [Supabase Docs](https://supabase.com/docs)
- [Next.js 14 Docs](https://nextjs.org/docs)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)

---

*― 以上 ―*
