# Phase 1-1: Next.js プロジェクト初期化

**チケットID**: PHASE1-1
**複雑度**: Simple
**依存**: なし
**担当**: Claude

---

## 概要
Next.js 14 (App Router) + TypeScript + Tailwind CSS でプロジェクトを作成する。

## 成果物
- 動作する Next.js プロジェクト雛形
- 基本的な設定ファイル（tsconfig.json, tailwind.config.ts, etc.）

## タスク

- [ ] `create-next-app` で Next.js 14 プロジェクト作成
  - App Router 使用
  - TypeScript 有効
  - Tailwind CSS 有効
  - ESLint 有効
  - `src/` ディレクトリ使用
- [ ] 不要なボイラープレートコードを削除
- [ ] `tsconfig.json` の `strict: true` 確認

## コマンド

```bash
npx create-next-app@14 hojokin-navi \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"
```

## 完了条件
- `npm run dev` でローカルサーバーが起動する
- `http://localhost:3000` でページが表示される

## 備考
- shadcn/ui は Phase 1-2 で追加
