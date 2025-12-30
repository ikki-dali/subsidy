# ディープクローラー実装計画

## 概要
SKILL.mdで定義された再帰的ディープクローラーを実装し、既存スクレイパーと統合する。

## ファイル構成

```
scripts/
├── crawler/                    # 新規ディレクトリ
│   ├── index.ts               # エクスポート
│   ├── types.ts               # 型定義
│   ├── config.ts              # パターン・設定
│   ├── core/
│   │   ├── url-queue.ts       # 優先度付きURLキュー
│   │   ├── crawler-engine.ts  # メインエンジン
│   │   └── rate-limiter.ts    # レート制限
│   ├── extractors/
│   │   ├── subsidy-extractor.ts  # 補助金情報抽出
│   │   └── link-extractor.ts     # リンク検出
│   └── renderers/
│       ├── static-renderer.ts    # Cheerio
│       └── dynamic-renderer.ts   # Playwright
└── scrapers/
    └── deep-crawler.ts        # BaseScraper統合ラッパー
```

## 実装フェーズ

### Phase 1: 型定義・キュー（Day 1）
**作成ファイル:**
- `scripts/crawler/types.ts`
- `scripts/crawler/core/url-queue.ts`
- `scripts/crawler/core/rate-limiter.ts`

**主要型:**
```typescript
type UrlQueueItem = {
  url: string;
  depth: number;
  priority: number;
  sourceUrl: string;
  pageType: 'list' | 'detail' | 'search' | 'other';
};

type CrawlerConfig = {
  maxDepth: number;        // default: 3
  maxPages: number;        // default: 100
  requestDelay: number;    // default: 1500ms
  concurrency: number;     // default: 2
  timeout: number;         // default: 30000ms
  allowedDomains: string[];
};
```

### Phase 2: 抽出ロジック（Day 2）
**作成ファイル:**
- `scripts/crawler/config.ts`
- `scripts/crawler/extractors/subsidy-extractor.ts`
- `scripts/crawler/extractors/link-extractor.ts`
- `scripts/crawler/renderers/static-renderer.ts`

**config.ts パターン定義（patterns.mdベース）:**
```typescript
const PATTERNS = {
  detailLinkText: ['詳細', '詳しく', '募集要項', '申請', 'こちら'],
  amount: [/上限[：:\s]*([0-9,]+)万?円/, /([0-9,]+)万?円(?:まで|以内)/],
  deadline: [/締切[：:\s]*(.+?)(?:\n|$)/, /令和\d+年\d{1,2}月\d{1,2}日/],
  subsidyRate: [/補助率[：:\s]*([\d\/]+|[\d]+%)/],
};
```

### Phase 3: エンジン統合（Day 3）
**作成ファイル:**
- `scripts/crawler/core/crawler-engine.ts`
- `scripts/crawler/index.ts`
- `scripts/scrapers/deep-crawler.ts`

**crawler-engine.ts 主要フロー:**
```
1. エントリーURL → キュー追加
2. ループ: キューから取得 → レート待機 → fetch → 抽出 → リンク追加
3. 深さ/ページ数チェック → 終了判定
4. 結果をScrapedSubsidy[]で返却
```

**deep-crawler.ts（BaseScraper継承）:**
```typescript
class DeepCrawlerScraper extends BaseScraper {
  private engine: CrawlerEngine;

  async scrape(): Promise<ScrapedSubsidy[]> {
    return this.engine.crawl(this.entryUrls);
  }
}
```

### Phase 4: 動的ページ対応（Day 3-4 並行）
**作成ファイル:**
- `scripts/crawler/renderers/dynamic-renderer.ts`

**Note:** 静的レンダラーと同時に実装（Playwright対応を最初から含める）

**動的ページ判定:**
```typescript
const DYNAMIC_PATTERNS = [
  /id="__next"/,      // Next.js
  /id="app"/,         // Vue
  /ng-app/,           // Angular
  /<noscript>/,       // JS必須示唆
];
```

### Phase 5: 統合・テスト（Day 5）
**修正ファイル:**
- `scripts/scrape-all.ts` - `--deep` オプション追加
- `package.json` - 新規スクリプト追加

**新規コマンド:**
```bash
npm run crawl:deep              # ディープクロール実行
npm run crawl:deep -- --dry-run # ドライラン
npm run crawl:deep -- --target tokyo-kosha  # 特定サイト
```

## 重要ファイル（参照用）

| ファイル | 役割 |
|---------|------|
| `scripts/scrapers/base.ts` | 継承元クラス、saveToDatabase等 |
| `scripts/scrapers/types.ts` | ScrapedSubsidy型定義 |
| `scripts/normalize/index.ts` | 金額・日付正規化 |
| `scripts/scrapers/clean-description.ts` | テキストクリーニング |

## 設計原則

1. **既存互換**: BaseScraper継承でscrape-all.tsと統合
2. **段階的実装**: 静的→動的の順で対応
3. **設定可能**: maxDepth, requestDelay等を外部から設定
4. **ロギング**: 進捗・エラーを詳細に出力
5. **安全性**: robots.txt遵守、レート制限厳守

## 初期クロール対象

エンジン完成後に決定。候補：
- 東京都産業労働局 (metro.tokyo.lg.jp)
- 東京都中小企業振興公社 (tokyo-kosha.or.jp)
- 経済産業省 (meti.go.jp)
- その他自治体ポータル

## 決定事項

- **Playwright対応**: 最初から実装（Phase 2-4 で静的・動的を並行開発）
- **対象サイト**: エンジン完成後にテストしながら選定
