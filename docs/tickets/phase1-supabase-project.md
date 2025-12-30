# Phase 1-2: Supabase プロジェクト作成

**チケットID**: PHASE1-2
**複雑度**: Simple
**依存**: なし
**担当**: ユーザー（手動作業）

---

## 概要
Supabase ダッシュボードで新規プロジェクトを作成し、接続情報を取得する。

## 成果物
- Supabase プロジェクト
- 接続情報（URL, Anon Key, Service Role Key）

## タスク

- [ ] [Supabase](https://supabase.com) にログイン
- [ ] 新規プロジェクト作成
  - プロジェクト名: `hojokin-navi`（推奨）
  - リージョン: `Northeast Asia (Tokyo)` 推奨
  - データベースパスワード: 安全なパスワードを設定
- [ ] プロジェクト作成完了を待つ（1-2分）
- [ ] 接続情報を取得
  - Settings → API から以下を取得:
    - Project URL
    - `anon` public キー
    - `service_role` キー（サーバーサイド用）

## 取得する情報

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
```

## 完了条件
- Supabase プロジェクトが作成されている
- 3つの接続情報を Claude に共有

## 備考
- Service Role Key は絶対に公開しないこと
- 無料プランで十分（500MB DB、50,000 月間アクティブユーザー）
