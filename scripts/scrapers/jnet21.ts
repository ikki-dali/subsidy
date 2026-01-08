/**
 * J-Net21 スクレイパー（強化版）
 * https://j-net21.smrj.go.jp/
 * 
 * 中小企業基盤整備機構が運営する支援情報ヘッドライン
 * 全国の補助金・助成金情報を集約（約3,600件以上）
 * 
 * 改善点:
 * - 詳細ページから金額・補助率・説明を取得
 * - タイムアウト付きfetchを使用
 * - ページ数上限を拡張（最大50ページ = 5,000件）
 */

import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';
import { BaseScraper } from './base';
import type { ScrapedSubsidy } from './types';
import { cleanDescription } from './clean-description';

const BASE_URL = 'https://j-net21.smrj.go.jp';
const SEARCH_URL = `${BASE_URL}/snavi/articles`;

// 47都道府県コード
const PREFECTURE_CODES: Record<string, string> = {
  '北海道': '01', '青森県': '02', '岩手県': '03', '宮城県': '04', '秋田県': '05',
  '山形県': '06', '福島県': '07', '茨城県': '08', '栃木県': '09', '群馬県': '10',
  '埼玉県': '11', '千葉県': '12', '東京都': '13', '神奈川県': '14', '新潟県': '15',
  '富山県': '16', '石川県': '17', '福井県': '18', '山梨県': '19', '長野県': '20',
  '岐阜県': '21', '静岡県': '22', '愛知県': '23', '三重県': '24', '滋賀県': '25',
  '京都府': '26', '大阪府': '27', '兵庫県': '28', '奈良県': '29', '和歌山県': '30',
  '鳥取県': '31', '島根県': '32', '岡山県': '33', '広島県': '34', '山口県': '35',
  '徳島県': '36', '香川県': '37', '愛媛県': '38', '高知県': '39', '福岡県': '40',
  '佐賀県': '41', '長崎県': '42', '熊本県': '43', '大分県': '44', '宮崎県': '45',
  '鹿児島県': '46', '沖縄県': '47',
};

export class JNet21Scraper extends BaseScraper {
  private prefectures: string[];
  private maxPages: number;
  private fetchDetails: boolean;
  private detailLimit: number;

  constructor(options: {
    prefectures?: string[];
    maxPages?: number;
    fetchDetails?: boolean;
    detailLimit?: number;
  } = {}) {
    super('jnet21');
    this.prefectures = options.prefectures || [];
    this.maxPages = options.maxPages || 50; // 最大50ページ
    this.fetchDetails = options.fetchDetails ?? true; // デフォルトで詳細取得有効
    this.detailLimit = options.detailLimit || 100; // 詳細取得は最大100件
  }

  async scrape(): Promise<ScrapedSubsidy[]> {
    const allSubsidies: ScrapedSubsidy[] = [];

    if (this.prefectures.length === 0) {
      // 全国の補助金を取得
      const subsidies = await this.scrapeByParams({});
      allSubsidies.push(...subsidies);
    } else {
      // 指定された都道府県ごとにスクレイプ
      for (const pref of this.prefectures) {
        const code = PREFECTURE_CODES[pref];
        if (code) {
          console.log(`  [J-Net21] ${pref} をスクレイプ中...`);
          const subsidies = await this.scrapeByParams({ pref: code });
          allSubsidies.push(...subsidies);
          await this.sleep(2000); // レート制限
        }
      }
    }

    // 詳細情報を取得（最初のN件のみ）
    if (this.fetchDetails && allSubsidies.length > 0) {
      console.log(`  [J-Net21] 詳細ページから情報を取得中（最大${this.detailLimit}件）...`);
      let detailCount = 0;
      
      for (const subsidy of allSubsidies) {
        if (detailCount >= this.detailLimit) break;
        
        // 金額情報がないもののみ詳細を取得
        if (!subsidy.max_amount && !subsidy.subsidy_rate && !subsidy.description) {
          await this.fetchDetail(subsidy);
          detailCount++;
          await this.sleep(1000); // レート制限
        }
      }
      
      console.log(`  [J-Net21] ${detailCount}件の詳細を取得完了`);
    }

    return allSubsidies;
  }

  private async scrapeByParams(params: Record<string, string>): Promise<ScrapedSubsidy[]> {
    const subsidies: ScrapedSubsidy[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= this.maxPages) {
      try {
        // ページネーションパラメータを使用
        const url = `${SEARCH_URL}?order=DESC&perPage=100&page=${page}`;
        
        console.log(`    Page ${page}: ${url}`);

        // タイムアウト付きfetchを使用
        const response = await this.fetchWithRetry(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'ja',
        },
        }, 3, 30000);

      if (!response.ok) {
          console.error(`    HTTP ${response.status}`);
          break;
      }

      const html = await response.text();
      const $ = cheerio.load(html);

        // 結果リストを取得
        const items = $('ul.HL-resultList > li');
        
        if (items.length === 0) {
          hasMore = false;
          break;
        }

        console.log(`    ${items.length}件のアイテムを検出`);

      items.each((_, element) => {
        try {
          const $el = $(element);
            const subsidy = this.parseItem($, $el);
            if (subsidy) {
              subsidies.push(subsidy);
          }
        } catch (e) {
          // Skip invalid items
        }
      });

        // 次のページがあるかチェック
        const nextLink = $('a:contains("次へ")').attr('href');
        hasMore = !!nextLink && items.length >= 10;
        page++;

        await this.sleep(1500); // レート制限

    } catch (error) {
        console.error(`    Error on page ${page}:`, error);
        break;
      }
    }

    return subsidies;
  }

  private parseItem($: cheerio.CheerioAPI, $el: cheerio.Cheerio<AnyNode>): ScrapedSubsidy | null {
    // タイトルとURL
    const $titleLink = $el.find('a.title');
    const title = $titleLink.text().trim();
    const href = $titleLink.attr('href');

    if (!title || !href) return null;

    // URLを正規化
    const sourceUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;
    
    // IDを抽出（/snavi/articles/172749 → 172749）
    const idMatch = href.match(/\/articles\/(\d+)/);
    const sourceId = idMatch ? idMatch[1] : href.replace(/[^a-zA-Z0-9]/g, '').slice(-20);

    // 日付を取得
    const dateText = $el.find('.date-electric').text().trim();

    // メタ情報を取得
    const $meta = $el.find('dl.meta');
    let region = '全国';
    let organization = '';
    let periodText = '';

    $meta.find('dt').each((_, dt) => {
      const $dt = $(dt);
      const label = $dt.text().trim();
      const value = $dt.next('dd').text().trim();

      switch (label) {
        case '地域':
          region = value;
          break;
        case '実施機関':
          organization = value;
          break;
        case '開催期間':
          periodText = value;
          break;
      }
    });

    // 期間をパース（2026年02月24日～2026年03月26日）
    let startDate: string | undefined;
    let endDate: string | undefined;

    if (periodText) {
      const dates = periodText.match(/(\d{4})年(\d{2})月(\d{2})日/g);
      if (dates && dates.length >= 1) {
        startDate = this.parseJapaneseDate(dates[0]);
      }
      if (dates && dates.length >= 2) {
        endDate = this.parseJapaneseDate(dates[1]);
      } else if (dates && dates.length === 1 && periodText.includes('～')) {
        // 終了日のみの場合
        endDate = startDate;
        startDate = undefined;
      }
    }

    // タイトルをクリーンアップ（「補助金・助成金：」プレフィックスを除去）
    const cleanTitle = title
      .replace(/^補助金・助成金[：:]/, '')
      .replace(/^「/, '')
      .replace(/」$/, '')
      .trim();

    // 地域を配列に変換
    const targetArea = region === '全国' ? ['全国'] : [region];

    return {
      source: 'jnet21',
      source_id: sourceId,
      source_url: sourceUrl,
      title: cleanTitle,
      target_area: targetArea,
      organization,
      start_date: startDate,
      end_date: endDate,
    };
  }

  private parseJapaneseDate(dateStr: string): string | undefined {
    const match = dateStr.match(/(\d{4})年(\d{2})月(\d{2})日/);
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
    return undefined;
  }

  /**
   * 詳細ページから追加情報を取得
   * 重要: 元ソースURL（公式サイト）を抽出し、source_urlを更新する
   */
  async fetchDetail(subsidy: ScrapedSubsidy): Promise<void> {
    try {
      // J-Net21のURLを保存
      const jnet21Url = subsidy.source_url;
      
      const response = await this.fetchWithTimeout(jnet21Url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SubsidyBot/1.0)',
        },
      }, 20000);

      if (!response.ok) return;

      const html = await response.text();
      const $ = cheerio.load(html);

      // ★重要: 「詳細情報を見る」セクションから元ソースURLを抽出
      let originalSourceUrl: string | undefined;
      
      // 方法1: h2「詳細情報を見る」の次のaタグ
      const detailSection = $('h2:contains("詳細情報を見る")');
      if (detailSection.length > 0) {
        const nextLink = detailSection.next('a').attr('href');
        if (nextLink && nextLink.startsWith('http')) {
          originalSourceUrl = nextLink;
        }
      }
      
      // 方法2: 詳細情報セクション内のリンク
      if (!originalSourceUrl) {
        $('a[target="_blank"]').each((_, el) => {
          const href = $(el).attr('href');
          // J-Net21以外の外部リンクを探す
          if (href && href.startsWith('http') && 
              !href.includes('j-net21.smrj.go.jp') && 
              !href.includes('smrj.go.jp/org') &&
              !href.includes('facebook.com') &&
              !href.includes('twitter.com')) {
            originalSourceUrl = href;
            return false; // break
          }
        });
      }
      
      // 元ソースURLが見つかった場合、URLを更新
      if (originalSourceUrl) {
        subsidy.original_source_url = originalSourceUrl;
        subsidy.aggregator_url = jnet21Url;
        subsidy.source_url = originalSourceUrl; // メインURLを元ソースに変更
      }

      // 詳細説明を取得（J-Net21の構造に合わせて修正）
      // 「実施機関からのお知らせ」セクションのテキストを取得
      let description = '';
      
      // 方法1: h3の後のpタグを取得
      $('section').each((_, section) => {
        const $section = $(section);
        const h3Text = $section.find('h3').text().trim();
        if (h3Text.includes('実施機関からのお知らせ') || h3Text.includes('概要')) {
          const paragraphs = $section.find('p').map((_, p) => $(p).text().trim()).get();
          if (paragraphs.length > 0) {
            description = paragraphs.join('\n');
          }
        }
      });

      // 方法2: フォールバック - メインコンテンツエリアを取得
      if (!description) {
        const mainContent = $('.ly_main, .main-content, #main').first();
        if (mainContent.length) {
          // section内のpタグを取得（ナビゲーション以外）
          description = mainContent.find('section p').map((_, p) => $(p).text().trim()).get()
            .filter(text => text.length > 20) // 短すぎるテキストを除外
            .join('\n');
        }
      }

      // 方法3: og:descriptionメタタグから取得
      if (!description) {
        const ogDesc = $('meta[property="og:description"]').attr('content');
        if (ogDesc && ogDesc.length > 30) {
          // 定型文を除去
          description = ogDesc
            .replace(/「.*」（支援情報ヘッドライン）」を掲載しています。/, '')
            .replace(/経営に役立つ最新情報を紹介しています。/, '')
            .trim();
        }
      }

      if (description) {
        subsidy.description = cleanDescription(description)?.slice(0, 2000);
      }

      // 全ページテキストから情報を抽出
      const pageText = $('body').text();
      
      // 金額情報を抽出（複数のパターンに対応）
      const amountPatterns = [
        /(?:補助金額|上限額|補助上限|助成額|最大)[：:\s]*([0-9,]+(?:万円|円|億円))/,
        /([0-9,]+(?:万円|円|億円))(?:以内|まで|を上限)/,
        /最大([0-9,]+(?:万円|円|億円))/,
      ];
      
      for (const pattern of amountPatterns) {
        const amountMatch = pageText.match(pattern);
        if (amountMatch) {
          const amount = this.parseAmount(amountMatch[1]);
          if (amount) {
            subsidy.max_amount = amount;
            break;
          }
        }
      }

      // 補助率を抽出
      const ratePatterns = [
        /(?:補助率|助成率)[：:\s]*([0-9\/]+(?:以内)?)/,
        /(?:補助率|助成率)[：:\s]*(\d+(?:\.\d+)?%)/,
        /([1-9]\/[0-9]+)(?:以内)?/,
      ];
      
      for (const pattern of ratePatterns) {
        const rateMatch = pageText.match(pattern);
        if (rateMatch) {
          subsidy.subsidy_rate = this.parseRate(rateMatch[1]) || rateMatch[1];
          break;
        }
      }

      // 対象業種を抽出
      const industryMatch = pageText.match(/(?:対象業種|対象者|対象事業者)[：:\s]*([^。\n]+)/);
      if (industryMatch && !subsidy.industry) {
        const industries = industryMatch[1]
          .split(/[、,／\/]/)
          .map(s => s.trim())
          .filter(s => s.length > 0 && s.length < 30)
          .slice(0, 10);
        if (industries.length > 0) {
          subsidy.industry = industries;
        }
      }

      // 従業員数を抽出
      const employeeMatch = pageText.match(/(?:従業員|社員)[：:\s]*(\d+)人(?:以下|未満|まで)/);
      if (employeeMatch) {
        subsidy.target_number_of_employees = employeeMatch[1] + '人以下';
      }

    } catch (error) {
      // Ignore detail fetch errors
      console.warn(`    詳細取得エラー: ${subsidy.source_id}`);
    }
  }
}

// 全47都道府県のリストをエクスポート
export const ALL_PREFECTURES = Object.keys(PREFECTURE_CODES);
