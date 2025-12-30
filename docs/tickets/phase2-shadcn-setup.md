# Phase 2-1: shadcn/ui セットアップ

**チケットID**: PHASE2-1
**複雑度**: Simple
**依存**: PHASE1-1
**担当**: Claude

---

## 概要
shadcn/ui を初期化し、基本コンポーネントをインストールする。

## 成果物
- shadcn/ui 設定完了
- 基本 UI コンポーネント（Button, Card, Input 等）

## タスク

- [ ] shadcn/ui 初期化
- [ ] 基本コンポーネントをインストール
  - Button
  - Card
  - Input
  - Select
  - Badge
  - Dialog
  - Skeleton
- [ ] `components.json` 設定確認

## コマンド

```bash
# 初期化
npx shadcn@latest init

# コンポーネント追加
npx shadcn@latest add button card input select badge dialog skeleton
```

## 設定オプション（init時）

```
Style: Default
Base color: Slate
CSS variables: Yes
```

## 完了条件
- `src/components/ui/` に各コンポーネントが生成されている
- コンポーネントがインポートして使用できる

## 備考
- 追加コンポーネントは必要に応じて後から追加可能
