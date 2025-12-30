# Phase 5-1: 接続確認テスト

**チケットID**: PHASE5-1
**複雑度**: Simple
**依存**: PHASE4-1
**担当**: Claude

---

## 概要
Supabase への接続が正しく動作することを確認するテストを実施する。

## 成果物
- `/api/health` ヘルスチェックエンドポイント
- トップページでの接続確認表示
- 動作確認完了

## タスク

- [ ] `/api/health` エンドポイント作成
- [ ] subsidies テーブルからのデータ取得テスト
- [ ] トップページに接続ステータス表示（開発用）
- [ ] エラーハンドリング確認
- [ ] `npm run dev` で動作確認

## ファイル内容

### src/app/api/health/route.ts

```typescript
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function GET() {
  try {
    // subsidies テーブルのカウント取得
    const { count, error } = await supabaseAdmin
      .from('subsidies')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return NextResponse.json(
        { status: 'error', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      subsidies_count: count ?? 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: 'Database connection failed' },
      { status: 500 }
    );
  }
}
```

### 確認方法

```bash
# 開発サーバー起動
npm run dev

# ヘルスチェック
curl http://localhost:3000/api/health

# 期待されるレスポンス
{
  "status": "ok",
  "database": "connected",
  "subsidies_count": 0,
  "timestamp": "2025-12-27T..."
}
```

## テスト項目

| テスト | 期待結果 |
|--------|----------|
| `/api/health` アクセス | `status: "ok"` が返る |
| DB接続エラー時 | `status: "error"` と適切なメッセージ |
| 環境変数未設定時 | エラーが発生しクラッシュしない |

## 完了条件
- `/api/health` で `status: "ok"` が返る
- `subsidies_count: 0` が表示される（テーブルは空）
- エラー時も適切なレスポンスが返る

## 備考
- 本番環境では `/api/health` を非公開にするか認証をかける
- 接続確認後、開発用の表示は削除しても良い
