# CLAUDE.md - 補助金ナビ プロジェクト

このファイルはClaudeにプロジェクトのコンテキストを提供します。

## プロジェクト概要

**補助金ナビ** - 補助金検索プラットフォーム

- **目的**: 補助金情報の集約・検索、リード獲得の効率化
- **特徴**: JグランツAPIに加え、各省庁の一次情報源からデータを収集

### データソース戦略
1. **J-Grants API** - 基本データソース
2. **各省庁直接スクレイピング**
   - 経済産業省（ものづくり補助金等）
   - 厚生労働省（雇用関係助成金）
   - 農林水産省（農業関連補助金）
   - 環境省（環境関連補助金）
3. **地方自治体ポータル**
   - ミラサポplus
   - J-Net21
   - 都道府県独自ポータル

### 会員制システム
- **招待制/会員制**: サイト閲覧には事前登録が必要
- **オンボーディング**: 会社名、業種、従業員数、年商、所在地を登録
- **パーソナライズ**: 登録情報を基にレコメンデーション

## 技術スタック

| レイヤー | 技術 | バージョン |
|---------|------|-----------|
| Framework | Next.js | 14.x (App Router) |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 3.x |
| UI Components | shadcn/ui | latest |
| Backend | Supabase | - |
| Database | PostgreSQL | 15.x |
| Hosting | Vercel | - |
| 通知 | Slack Webhook | - |

## ディレクトリ構造

```
hojokin-navi/
├── CLAUDE.md              # このファイル
├── SKILL.md               # 開発スキル定義
├── requirements.md        # 要件定義書
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── page.tsx       # トップページ
│   │   ├── onboarding/    # オンボーディング（会社登録）
│   │   ├── search/        # 検索結果ページ
│   │   ├── subsidies/     # 補助金詳細ページ
│   │   └── api/           # API Routes
│   │       ├── companies/ # 会社登録API
│   │       └── interests/ # 「気になる」API + Slack通知
│   ├── components/        # UIコンポーネント
│   │   ├── ui/            # shadcn/ui
│   │   ├── features/      # 機能別コンポーネント
│   │   └── interest-button.tsx  # 「気になる」ボタン
│   ├── lib/               # ユーティリティ
│   │   ├── supabase.ts    # Supabaseクライアント
│   │   ├── jgrants.ts     # JグランツAPI連携
│   │   ├── clean-description.ts  # テキストクリーニング
│   │   └── utils.ts       # 汎用関数
│   ├── middleware.ts      # アクセス制御（会員制）
│   └── types/             # 型定義
├── supabase/
│   └── migrations/        # DBマイグレーション
│       └── 20241227_create_companies_table.sql
├── scripts/               # バッチ・ユーティリティ
│   ├── scrapers/          # 各種スクレイパー
│   │   ├── base.ts        # 基底クラス
│   │   ├── mirasapo.ts    # ミラサポplus
│   │   ├── jnet21.ts      # J-Net21
│   │   ├── mhlw.ts        # 厚生労働省
│   │   ├── maff.ts        # 農林水産省
│   │   ├── env.ts         # 環境省
│   │   └── prefecture.ts  # 都道府県ポータル
│   ├── normalize/         # データ正規化
│   ├── scrape-all.ts      # 統合スクレイピング
│   ├── daily-sync.ts      # 日次同期
│   └── cleanup-duplicates.ts  # 重複削除
└── .github/
    └── workflows/
        └── daily-sync.yml  # 自動データ更新
```

## コーディング規約

### TypeScript
- `strict: true` 必須
- `any` 禁止、型定義を明示
- interfaceよりtypeを優先（一貫性のため）

### コンポーネント
- 関数コンポーネント + hooks
- Server Components優先、必要時のみ`"use client"`
- Props型は`ComponentNameProps`で定義

### 命名規則
- ファイル: kebab-case (`subsidy-card.tsx`)
- コンポーネント: PascalCase (`SubsidyCard`)
- 関数・変数: camelCase (`fetchSubsidies`)
- 定数: UPPER_SNAKE_CASE (`API_BASE_URL`)

### インポート順序
1. React/Next.js
2. 外部ライブラリ
3. 内部モジュール（`@/`エイリアス使用）
4. 型定義

## 環境変数

```bash
# 必須
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# サーバーサイドのみ
SUPABASE_SERVICE_ROLE_KEY=
JWT_SECRET=
SLACK_WEBHOOK_URL=

# オプション
NEXT_PUBLIC_APP_URL=
```

## 主要コマンド

```bash
# 開発
npm run dev          # 開発サーバー起動
npm run build        # ビルド
npm run lint         # ESLint実行

# データベース
npx supabase db push # マイグレーション適用
npx supabase gen types typescript --local > src/types/database.ts

# データ同期
npm run sync:subsidies  # J-GrantsAPI同期
npm run scrape          # 今日の曜日に対応する地域をスクレイプ
npm run scrape:all      # 全地域スクレイプ
npm run scrape:region 東京都  # 特定地域のみ
npm run add-sample-data # 主要補助金サンプルデータ追加
npm run cleanup         # 重複・不要データ削除
npm run cleanup:dry     # 削除対象の確認のみ
npm run sync:daily      # 日次同期（サンプル→スクレイプ→クリーンアップ）
```

## 外部API

### JグランツAPI
- **Base URL**: `https://api.jgrants-portal.go.jp/exp/v1/public`
- **認証**: 不要
- **レート制限**: なし（常識的な範囲で）
- **詳細**: `SKILL.md` 参照

## 重要な注意点

1. **HTMLサニタイズ**: `detail`フィールドはHTMLを含む。XSS対策必須
2. **業種データ**: `/`区切り文字列 → JSONBに変換して保存
3. **PDF**: base64で巨大。DBには保存せずURLのみ管理
4. **日本語検索**: pg_trgmまたはLIKE検索で対応（pgroongaは後回し）
5. **データ品質**: スクレイピングデータはクリーニング必須（`clean-description.ts`）
6. **会員制**: 全ページはオンボーディング完了後のみアクセス可能

## 「気になる」ボタン機能

1. 補助金詳細ページに「この補助金が気になる」ボタンを設置
2. クリック時にモーダル表示（コメント入力可）
3. 送信時に以下を実行：
   - `company_interests`テーブルにレコード追加
   - Slack Webhook経由で運営者に通知
4. 将来的にSlackからの返信機能を検討

## 関連ドキュメント

- [要件定義書](./requirements.md)
- [JグランツAPIドキュメント](https://developers.digital.go.jp/documents/jgrants/api/)
- [Supabase Docs](https://supabase.com/docs)
