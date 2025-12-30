# Phase 2-2: プロジェクト構造整備

**チケットID**: PHASE2-2
**複雑度**: Simple
**依存**: PHASE1-1
**担当**: Claude

---

## 概要
CLAUDE.md に記載のディレクトリ構造を作成し、基本ファイルを配置する。

## 成果物
- 整理されたディレクトリ構造
- 基本的なプレースホルダーファイル

## タスク

- [ ] ディレクトリ構造を作成
- [ ] 基本ファイルを配置
- [ ] パスエイリアス確認（`@/`）

## ディレクトリ構造

```
src/
├── app/
│   ├── page.tsx           # トップページ
│   ├── layout.tsx         # ルートレイアウト
│   ├── search/
│   │   └── page.tsx       # 検索結果ページ
│   ├── subsidies/
│   │   └── [id]/
│   │       └── page.tsx   # 補助金詳細ページ
│   ├── favorites/
│   │   └── page.tsx       # お気に入りページ
│   └── api/
│       └── health/
│           └── route.ts   # ヘルスチェック
├── components/
│   ├── ui/                # shadcn/ui（自動生成）
│   └── features/          # 機能別コンポーネント
│       └── .gitkeep
├── lib/
│   ├── supabase.ts        # Supabaseクライアント
│   ├── jgrants.ts         # JグランツAPI連携
│   └── utils.ts           # 汎用関数
└── types/
    ├── database.ts        # Supabase型定義
    └── jgrants.ts         # JグランツAPI型定義
```

## 完了条件
- 上記ディレクトリ構造が作成されている
- 各ファイルに最低限のプレースホルダーコードがある

## 備考
- `supabase/migrations/` は Phase 3 で作成
