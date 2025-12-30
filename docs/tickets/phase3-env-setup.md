# Phase 3-2: 環境変数設定

**チケットID**: PHASE3-2
**複雑度**: Simple
**依存**: PHASE1-2
**担当**: Claude + ユーザー

---

## 概要
`.env.local` に Supabase 接続情報を設定し、`.env.local.example` テンプレートを作成する。

## 成果物
- `.env.local` ファイル（Supabase 接続情報）
- `.env.local.example` ファイル（テンプレート）
- `.gitignore` に `.env.local` が含まれていることを確認

## タスク

- [ ] `.env.local.example` テンプレート作成
- [ ] `.gitignore` 確認（`.env.local` が除外されていること）
- [ ] ユーザーから Supabase 接続情報を受け取り `.env.local` 作成
- [ ] 環境変数が正しく読み込まれることを確認

## ファイル内容

### .env.local.example

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-jwt-secret

# Slack（フェーズ2で使用）
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### .env.local（実際の値）

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
JWT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 環境変数の説明

| 変数名 | 用途 | 公開範囲 |
|--------|------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクトURL | クライアント |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 匿名キー（RLS適用） | クライアント |
| `SUPABASE_SERVICE_ROLE_KEY` | 管理者キー（RLSバイパス） | サーバーのみ |
| `JWT_SECRET` | JWT署名用の秘密鍵（十分に長いランダム値） | サーバーのみ |
| `SLACK_WEBHOOK_URL` | Slack 通知用 | サーバーのみ |
| `NEXT_PUBLIC_APP_URL` | アプリURL | クライアント |

## 完了条件
- `.env.local` が作成されている
- `.env.local.example` がリポジトリに含まれている
- `.env.local` が `.gitignore` で除外されている

## 備考
- `NEXT_PUBLIC_` プレフィックスはクライアントサイドで使用可能
- `SUPABASE_SERVICE_ROLE_KEY` は絶対に公開しない
- `JWT_SECRET` は別の値を使用し、十分に長いランダム値にする（例: 32バイト以上）
