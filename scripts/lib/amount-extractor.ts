/**
 * 金額・補助率抽出モジュール
 *
 * 補助金データから金額と補助率を抽出するための共通モジュール。
 * 複数のパターンに対応し、最大値を取得する。
 */

export type ExtractedAmount = {
  amount: number;
  unit: '円' | '万円' | '億円';
  rawMatch: string;
  isMonthly?: boolean;
  isYearly?: boolean;
  target?: string; // 個人、法人など
};

export type ExtractedRate = {
  rate: string;
  numerator?: number;
  denominator?: number;
  percentage?: number;
  rawMatch: string;
};

/**
 * 金額抽出パターン（優先度順）
 */
const AMOUNT_PATTERNS: Array<{
  pattern: RegExp;
  priority: number;
  type: string;
}> = [
  // 1. 明示的な上限額（最優先）
  {
    pattern: /(?:上限|最大|限度額|補助上限|交付上限)[額金]?[：:は]?\s*([0-9,]+(?:\.[0-9]+)?)\s*(億|万)?円/g,
    priority: 100,
    type: 'explicit_limit',
  },
  // 2. 補助金額の明示
  {
    pattern: /補助(?:金)?(?:額)?[：:は]?\s*(?:上限)?([0-9,]+(?:\.[0-9]+)?)\s*(億|万)?円/g,
    priority: 95,
    type: 'subsidy_amount',
  },
  // 3. 億円表記（大型補助金）
  {
    pattern: /([0-9,]+(?:\.[0-9]+)?)\s*億円(?:以内|まで|を上限|が上限)?/g,
    priority: 90,
    type: 'oku_yen',
  },
  // 4. 範囲表記の最大値（〜以降）
  {
    pattern: /(?:～|〜|~|から|－)\s*([0-9,]+(?:\.[0-9]+)?)\s*(億|万)?円/g,
    priority: 85,
    type: 'range_max',
  },
  // 5. 対象者別上限（法人優先）
  {
    pattern: /(?:法人|企業|事業者)[：:]\s*([0-9,]+(?:\.[0-9]+)?)\s*(億|万)?円/g,
    priority: 80,
    type: 'target_corporation',
  },
  // 6. 対象者別上限（個人）
  {
    pattern: /(?:個人|個人事業主)[：:]\s*([0-9,]+(?:\.[0-9]+)?)\s*(億|万)?円/g,
    priority: 75,
    type: 'target_individual',
  },
  // 7. 月額・年額
  {
    pattern: /(?:月額|年額)[：:は]?\s*([0-9,]+(?:\.[0-9]+)?)\s*(億|万)?円/g,
    priority: 70,
    type: 'periodic',
  },
  // 8. 「〇〇円以内」「〇〇円まで」
  {
    pattern: /([0-9,]+(?:\.[0-9]+)?)\s*(億|万)?円(?:以内|まで|を上限|が上限)/g,
    priority: 65,
    type: 'limit_suffix',
  },
  // 9. 柔軟な補助額パターン（補助額の後に数字がくるケース）
  {
    pattern: /(?:補助額|助成額|交付額|支援額)[^\d]{0,10}([0-9,]+(?:\.[0-9]+)?)\s*(億|万)?円/g,
    priority: 62,
    type: 'flexible_amount',
  },
  // 10. 最大支給・交付限度
  {
    pattern: /(?:最大支給|交付限度|支給限度)[額金]?\s*([0-9,]+(?:\.[0-9]+)?)\s*(億|万)?円/g,
    priority: 60,
    type: 'payment_limit',
  },
  // 11. 括弧内の金額（「100万円」など）
  {
    pattern: /[「『]([0-9,]+(?:\.[0-9]+)?)\s*(億|万)?円[」』]/g,
    priority: 55,
    type: 'quoted_amount',
  },
  // 12. 一般的な金額（最後のフォールバック）
  {
    pattern: /([0-9,]+(?:\.[0-9]+)?)\s*(億|万)?円/g,
    priority: 50,
    type: 'general',
  },
];

/**
 * 補助率抽出パターン（優先度順）
 */
const RATE_PATTERNS: Array<{
  pattern: RegExp;
  priority: number;
  type: string;
}> = [
  // 1. 明示的な補助率
  {
    pattern: /(?:補助率|助成率|交付率)[：:は]?\s*([0-9]+)[/／]([0-9]+)(?:以内)?/g,
    priority: 100,
    type: 'explicit_fraction',
  },
  // 2. 分数形式（日本語）「3分の1」
  {
    pattern: /([0-9]+)分の([0-9]+)(?:以内)?/g,
    priority: 95,
    type: 'japanese_fraction',
  },
  // 3. 分数形式（スラッシュ）- 日付を除外するため境界チェック付き
  {
    pattern: /(?<![0-9])([1-9])[/／]([2-9]|10)(?![0-9])(?:以内)?/g,
    priority: 90,
    type: 'slash_fraction',
  },
  // 4. 明示的な補助率（パーセント）
  {
    pattern: /(?:補助率|助成率|交付率)[：:は]?\s*([0-9]+(?:\.[0-9]+)?)\s*[%％]/g,
    priority: 85,
    type: 'explicit_percentage',
  },
  // 5. パーセント形式
  {
    pattern: /([0-9]+(?:\.[0-9]+)?)\s*[%％](?:以内)?/g,
    priority: 80,
    type: 'percentage',
  },
  // 6. 定額表記
  {
    pattern: /定額(?:支給|交付)?/g,
    priority: 75,
    type: 'fixed_amount',
  },
];

/**
 * 金額抽出クラス
 */
export class AmountExtractor {
  /**
   * 全角数字を半角に変換
   */
  private normalizeFullWidthNumbers(text: string): string {
    return text.replace(/[０-９]/g, (char) => {
      return String.fromCharCode(char.charCodeAt(0) - 0xFF10 + 0x30);
    });
  }

  /**
   * テキストの前処理（改行・空白の正規化、全角数字の変換）
   */
  private preprocessText(text: string): string {
    return this.normalizeFullWidthNumbers(text)
      .replace(/[\n\r\t]+/g, ' ')     // 改行・タブ→スペース
      .replace(/\s+/g, ' ')           // 複数スペース→1つ
      .replace(/[　]/g, ' ')          // 全角スペース→半角
      .trim();
  }

  /**
   * テキストから金額を抽出（最大値を返す）
   */
  extractAmount(text: string): number | null {
    const amounts = this.extractAllAmounts(text);
    if (amounts.length === 0) return null;

    // 優先度が高いものから評価し、同一優先度なら金額が大きいものを選択
    amounts.sort((a, b) => {
      // 優先度が同じなら金額で比較
      return b.amount - a.amount;
    });

    return amounts[0].amount;
  }

  /**
   * テキストから全ての金額を抽出
   */
  extractAllAmounts(text: string): ExtractedAmount[] {
    const normalizedText = this.preprocessText(text);
    const results: ExtractedAmount[] = [];

    for (const { pattern, type } of AMOUNT_PATTERNS) {
      // パターンをリセット
      pattern.lastIndex = 0;

      let match;
      while ((match = pattern.exec(normalizedText)) !== null) {
        const numStr = match[1].replace(/,/g, '');
        const unit = match[2] as '億' | '万' | undefined;

        let amount = parseFloat(numStr);
        let unitLabel: '円' | '万円' | '億円' = '円';

        if (unit === '億') {
          amount *= 100000000;
          unitLabel = '億円';
        } else if (unit === '万') {
          amount *= 10000;
          unitLabel = '万円';
        }

        // 異常値を除外（0円、1000億円以上）
        if (amount <= 0 || amount >= 100000000000) continue;

        results.push({
          amount,
          unit: unitLabel,
          rawMatch: match[0],
          isMonthly: type === 'periodic' && match[0].includes('月額'),
          isYearly: type === 'periodic' && match[0].includes('年額'),
          target: type === 'target_corporation' ? '法人' : type === 'target_individual' ? '個人' : undefined,
        });
      }
    }

    return results;
  }

  /**
   * 対象者別の金額を抽出
   */
  extractAmountsByTarget(text: string): Map<string, number> {
    const result = new Map<string, number>();
    const amounts = this.extractAllAmounts(text);

    for (const amount of amounts) {
      if (amount.target) {
        const existing = result.get(amount.target);
        if (!existing || amount.amount > existing) {
          result.set(amount.target, amount.amount);
        }
      }
    }

    return result;
  }

  /**
   * 補助率を抽出
   */
  extractSubsidyRate(text: string): string | null {
    const rates = this.extractAllRates(text);
    if (rates.length === 0) return null;

    // 優先度順でソート
    rates.sort((a, b) => b.priority - a.priority);

    return rates[0].rate;
  }

  /**
   * 全ての補助率を抽出
   */
  extractAllRates(text: string): Array<ExtractedRate & { priority: number }> {
    const normalizedText = this.preprocessText(text);
    const results: Array<ExtractedRate & { priority: number }> = [];

    for (const { pattern, priority, type } of RATE_PATTERNS) {
      pattern.lastIndex = 0;

      let match;
      while ((match = pattern.exec(normalizedText)) !== null) {
        if (type === 'fixed_amount') {
          results.push({
            rate: '定額',
            rawMatch: match[0],
            priority,
          });
        } else if (type === 'japanese_fraction') {
          // 「3分の1」→ 「1/3」に変換
          const denominator = parseInt(match[1], 10);
          const numerator = parseInt(match[2], 10);
          results.push({
            rate: `${numerator}/${denominator}`,
            numerator,
            denominator,
            rawMatch: match[0],
            priority,
          });
        } else if (type.includes('fraction')) {
          const numerator = parseInt(match[1], 10);
          const denominator = parseInt(match[2], 10);
          results.push({
            rate: `${numerator}/${denominator}`,
            numerator,
            denominator,
            rawMatch: match[0],
            priority,
          });
        } else if (type.includes('percentage')) {
          const percentage = parseFloat(match[1]);
          // 異常値を除外（0%以下、100%超）
          if (percentage <= 0 || percentage > 100) continue;
          results.push({
            rate: `${percentage}%`,
            percentage,
            rawMatch: match[0],
            priority,
          });
        }
      }
    }

    return results;
  }

  /**
   * 金額を人間が読みやすい形式にフォーマット
   */
  formatAmount(amount: number): string {
    if (amount >= 100000000) {
      return `${(amount / 100000000).toFixed(amount % 100000000 === 0 ? 0 : 1)}億円`;
    } else if (amount >= 10000) {
      return `${(amount / 10000).toFixed(amount % 10000 === 0 ? 0 : 1)}万円`;
    } else {
      return `${amount.toLocaleString()}円`;
    }
  }

  /**
   * 締切日を抽出
   */
  extractDeadline(text: string): string | null {
    const normalizedText = this.preprocessText(text);
    const today = new Date();
    const currentYear = today.getFullYear();

    // 締切日パターン（優先度順）
    const deadlinePatterns = [
      // 「令和○年○月○日まで」「令和○年○月○日締切」
      /(?:申請|募集|受付)?(?:期限|締切|締め切り|〆切)[：:は]?\s*令和\s*(\d+)\s*年\s*(\d+)\s*月\s*(\d+)\s*日/g,
      /令和\s*(\d+)\s*年\s*(\d+)\s*月\s*(\d+)\s*日\s*(?:まで|締切|締め切り|〆切|必着)/g,
      // 「○年○月○日まで」（西暦）
      /(?:申請|募集|受付)?(?:期限|締切|締め切り)[：:は]?\s*(20\d{2})\s*年\s*(\d+)\s*月\s*(\d+)\s*日/g,
      /(20\d{2})\s*年\s*(\d+)\s*月\s*(\d+)\s*日\s*(?:まで|締切|締め切り|〆切|必着)/g,
      // 「○月○日まで」（年なし、今年か来年と推定）
      /(?:申請|募集|受付)?(?:期限|締切|締め切り)[：:は]?\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/g,
      /(\d{1,2})\s*月\s*(\d{1,2})\s*日\s*(?:まで|締切|締め切り|〆切|必着)/g,
      // 「○/○まで」形式
      /(?:申請|募集|受付)?(?:期限|締切)[：:は]?\s*(\d{1,2})[/／](\d{1,2})\s*(?:まで)?/g,
    ];

    for (const pattern of deadlinePatterns) {
      pattern.lastIndex = 0;
      const match = pattern.exec(normalizedText);
      if (match) {
        let year: number;
        let month: number;
        let day: number;

        if (match[0].includes('令和')) {
          // 令和年を西暦に変換
          const reiwaYear = parseInt(match[1], 10);
          year = 2018 + reiwaYear;
          month = parseInt(match[2], 10);
          day = parseInt(match[3], 10);
        } else if (match[1].startsWith('20')) {
          // 西暦
          year = parseInt(match[1], 10);
          month = parseInt(match[2], 10);
          day = parseInt(match[3], 10);
        } else {
          // 年なし（月/日のみ）
          month = parseInt(match[1], 10);
          day = parseInt(match[2], 10);
          // 今年か来年を推定
          const testDate = new Date(currentYear, month - 1, day);
          if (testDate < today) {
            year = currentYear + 1;
          } else {
            year = currentYear;
          }
        }

        // 日付が有効かチェック
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
          const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          return dateStr;
        }
      }
    }

    return null;
  }

  /**
   * 募集開始日を抽出
   */
  extractStartDate(text: string): string | null {
    const normalizedText = this.preprocessText(text);
    const currentYear = new Date().getFullYear();

    // 開始日パターン
    const startPatterns = [
      /(?:募集|受付)?(?:開始|期間)[：:は]?\s*令和\s*(\d+)\s*年\s*(\d+)\s*月\s*(\d+)\s*日/g,
      /令和\s*(\d+)\s*年\s*(\d+)\s*月\s*(\d+)\s*日\s*(?:から|より|開始)/g,
      /(?:募集|受付)?(?:開始|期間)[：:は]?\s*(20\d{2})\s*年\s*(\d+)\s*月\s*(\d+)\s*日/g,
      /(20\d{2})\s*年\s*(\d+)\s*月\s*(\d+)\s*日\s*(?:から|より|開始)/g,
    ];

    for (const pattern of startPatterns) {
      pattern.lastIndex = 0;
      const match = pattern.exec(normalizedText);
      if (match) {
        let year: number;
        let month: number;
        let day: number;

        if (match[0].includes('令和')) {
          const reiwaYear = parseInt(match[1], 10);
          year = 2018 + reiwaYear;
          month = parseInt(match[2], 10);
          day = parseInt(match[3], 10);
        } else {
          year = parseInt(match[1], 10);
          month = parseInt(match[2], 10);
          day = parseInt(match[3], 10);
        }

        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
          return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
      }
    }

    return null;
  }

  /**
   * 募集が終了しているかを検出
   */
  isRecruitmentEnded(text: string): boolean {
    const normalizedText = this.preprocessText(text);

    // 募集終了パターン
    const endedPatterns = [
      /申請受付[はが]?終了/,
      /募集[はが]?終了/,
      /受付[はが]?終了/,
      /募集を?終了しました/,
      /受付を?終了しました/,
      /申請[はが]?終了/,
      /公募[はが]?終了/,
      /(?:本|当)事業[はの]?(?:募集|受付|申請)[はが]?終了/,
      /(?:令和|平成)\d+年度.*(?:募集|受付|申請)[はが]?終了/,
      /終了しました/,
      /締め?切りました/,
      /受付.*(?:終了|締切)/,
    ];

    for (const pattern of endedPatterns) {
      if (pattern.test(normalizedText)) {
        return true;
      }
    }

    return false;
  }
}

// シングルトンインスタンスをエクスポート
export const amountExtractor = new AmountExtractor();
