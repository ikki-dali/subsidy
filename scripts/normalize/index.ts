/**
 * データ正規化ユーティリティ
 * 
 * 補助金データの金額、日付、補助率などを統一フォーマットに変換する
 */

// 金額パターン（優先度順）
const AMOUNT_PATTERNS = [
  // 「上限1億円」「補助上限額：5,000万円」などの形式
  /(?:上限|補助[上限額金]?|最大|限度額)[：:は]?\s*([0-9,]+(?:\.\d+)?)\s*(億|万)?円/,
  // 「1億円まで」「5,000万円以内」などの形式
  /([0-9,]+(?:\.\d+)?)\s*(億|万)?円(?:まで|以内|を上限|が上限)/,
  // 「〜1億円」などの形式
  /(?:～|〜|~|から)\s*([0-9,]+(?:\.\d+)?)\s*(億|万)?円/,
  // 単純な金額表記（後から見つかった場合は大きい方を採用）
  /([0-9,]+(?:\.\d+)?)\s*(億|万)?円/g,
];

/**
 * 金額文字列を数値（円）に変換
 * 
 * @param text 金額を含む文字列
 * @returns 円単位の数値（見つからない場合はundefined）
 */
export function parseAmount(text: string | null | undefined): number | undefined {
  if (!text) return undefined;

  const cleaned = text.replace(/\s/g, '');
  let maxAmount = 0;

  // 各パターンでマッチを試行
  for (const pattern of AMOUNT_PATTERNS) {
    const isGlobal = pattern.flags.includes('g');
    
    if (isGlobal) {
      // グローバルマッチの場合、全ての金額を取得し最大値を返す
      const matches = Array.from(cleaned.matchAll(pattern));
      for (const match of matches) {
        const amount = convertToYen(match[1], match[2]);
        if (amount > maxAmount) {
          maxAmount = amount;
        }
      }
    } else {
      const match = cleaned.match(pattern);
      if (match) {
        const amount = convertToYen(match[1], match[2]);
        if (amount > maxAmount) {
          maxAmount = amount;
        }
        break; // 優先度の高いパターンでマッチしたらループを抜ける
      }
    }
  }

  return maxAmount > 0 ? maxAmount : undefined;
}

/**
 * 数値と単位を円に変換
 */
function convertToYen(numStr: string, unit: string | undefined): number {
  const num = parseFloat(numStr.replace(/,/g, ''));
  if (isNaN(num)) return 0;

  switch (unit) {
    case '億':
      return num * 100000000;
    case '万':
      return num * 10000;
    default:
      return num;
  }
}

// 日付パターン
const DATE_PATTERNS = [
  // 「令和7年1月15日」形式
  /令和(\d+)年(\d{1,2})月(\d{1,2})日/,
  // 「R7.1.15」形式
  /[RrＲ](\d+)[\.\/\-](\d{1,2})[\.\/\-](\d{1,2})/,
  // 「2025年1月15日」形式
  /(\d{4})年(\d{1,2})月(\d{1,2})日/,
  // 「2025/1/15」「2025-01-15」形式
  /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,
  // 「2025.1.15」形式
  /(\d{4})\.(\d{1,2})\.(\d{1,2})/,
];

/**
 * 日付文字列をISO形式（YYYY-MM-DD）に変換
 * 
 * @param text 日付を含む文字列
 * @returns ISO形式の日付文字列（見つからない場合はundefined）
 */
export function parseDate(text: string | null | undefined): string | undefined {
  if (!text) return undefined;

  for (const pattern of DATE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      let year = parseInt(match[1], 10);
      
      // 令和/R の場合は西暦に変換（令和1年 = 2019年）
      if (year < 100) {
        year = 2018 + year;
      }

      const month = match[2].padStart(2, '0');
      const day = match[3].padStart(2, '0');

      // 日付の妥当性をチェック
      const date = new Date(`${year}-${month}-${day}`);
      if (isNaN(date.getTime())) {
        continue;
      }

      return `${year}-${month}-${day}`;
    }
  }

  return undefined;
}

/**
 * 募集開始日と終了日を抽出
 * 
 * @param text 日付範囲を含む文字列
 * @returns { startDate, endDate }
 */
export function parseDateRange(text: string | null | undefined): { 
  startDate?: string; 
  endDate?: string;
} {
  if (!text) return {};

  // 開始日パターン
  const startPatterns = [
    /(?:募集開始|申請開始|受付開始|公募開始)[：:は]?\s*((?:令和)?\d+[年\.\/\-]\d{1,2}[月\.\/\-]\d{1,2}日?)/,
    /(\d{4}[年\/\-]\d{1,2}[月\/\-]\d{1,2}日?)(?:から|より|〜|～|~)/,
  ];

  // 終了日パターン
  const endPatterns = [
    /(?:募集終了|申請期限|締[め切]?切|受付終了|公募締切)[：:は]?\s*((?:令和)?\d+[年\.\/\-]\d{1,2}[月\.\/\-]\d{1,2}日?)/,
    /(?:まで|迄)[：:]\s*((?:令和)?\d+[年\.\/\-]\d{1,2}[月\.\/\-]\d{1,2}日?)/,
    /(?:〜|～|~|から)\s*((?:令和)?\d+[年\.\/\-]\d{1,2}[月\.\/\-]\d{1,2}日?)/,
    /((?:令和)?\d+[年\.\/\-]\d{1,2}[月\.\/\-]\d{1,2}日?)(?:まで|締切|迄)/,
  ];

  let startDate: string | undefined;
  let endDate: string | undefined;

  // 開始日を探す
  for (const pattern of startPatterns) {
    const match = text.match(pattern);
    if (match) {
      startDate = parseDate(match[1]);
      if (startDate) break;
    }
  }

  // 終了日を探す
  for (const pattern of endPatterns) {
    const match = text.match(pattern);
    if (match) {
      endDate = parseDate(match[1]);
      if (endDate) break;
    }
  }

  return { startDate, endDate };
}

// 補助率パターン
const RATE_PATTERNS = [
  // 「補助率：1/2」「補助率:2/3以内」
  /(?:補助率|助成率|交付率)[：:は]?\s*([0-9]+\/[0-9]+(?:～|〜|~|以内|以上)?[0-9\/]*)/,
  // 「1/2〜2/3」の形式
  /([0-9]+\/[0-9]+(?:～|〜|~)[0-9]+\/[0-9]+)/,
  // 「50%」「50〜75%」の形式
  /([0-9]+(?:\.[0-9]+)?(?:～|〜|~)?(?:[0-9]+(?:\.[0-9]+)?)?\s*[%％])/,
  // 単純な分数「1/2」「2/3」
  /([1234]\/[234])/,
];

/**
 * 補助率を統一フォーマットに変換
 * 
 * @param text 補助率を含む文字列
 * @returns 補助率文字列（見つからない場合はundefined）
 */
export function parseSubsidyRate(text: string | null | undefined): string | undefined {
  if (!text) return undefined;

  for (const pattern of RATE_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      let rate = match[1]
        .replace(/～/g, '〜')
        .replace(/~/g, '〜')
        .replace(/％/g, '%')
        .trim();
      
      // 「以内」を末尾に統一
      if (rate.includes('以内')) {
        rate = rate.replace(/以内/, '') + '以内';
      }
      
      return rate;
    }
  }

  // 「定額」「一律」などの表記
  if (/定額|一律/.test(text)) {
    return '定額';
  }

  return undefined;
}

/**
 * 対象従業員数を正規化
 * 
 * @param text 従業員数を含む文字列
 * @returns 正規化された従業員数範囲（'1-5', '6-20', '21-50', '51-100', '101-300', '301+'）
 */
export function normalizeEmployeeCount(text: string | null | undefined): string | undefined {
  if (!text) return undefined;

  const patterns = [
    { pattern: /(?:5|５)名?以下|小規模/, value: '1-5' },
    { pattern: /(?:20|２０)名?以下/, value: '6-20' },
    { pattern: /(?:50|５０)名?以下/, value: '21-50' },
    { pattern: /(?:100|１００)名?以下/, value: '51-100' },
    { pattern: /(?:300|３００)名?以下|中小企業/, value: '101-300' },
    { pattern: /(?:300|３００)名?(?:超|以上)|大企業/, value: '301+' },
  ];

  for (const { pattern, value } of patterns) {
    if (pattern.test(text)) {
      return value;
    }
  }

  return undefined;
}

/**
 * 業種を正規化
 * 
 * @param industries 業種文字列の配列
 * @returns 正規化された業種配列
 */
export function normalizeIndustries(industries: string[] | null | undefined): string[] {
  if (!industries || industries.length === 0) return [];

  // 業種マッピング
  const industryMap: Record<string, string> = {
    '製造': '製造業',
    '建設': '建設業',
    '運輸': '運輸業',
    '卸売': '卸売業',
    '小売': '小売業',
    '飲食': '飲食サービス業',
    '宿泊': '宿泊業',
    'IT': '情報サービス業',
    '情報': '情報サービス業',
    'サービス': 'サービス業',
    '農業': '農業',
    '林業': '林業',
    '水産': '水産業',
    '漁業': '水産業',
    '不動産': '不動産業',
    '金融': '金融業',
    '医療': '医療・福祉',
    '福祉': '医療・福祉',
    '介護': '医療・福祉',
    '教育': '教育',
  };

  return industries.map(industry => {
    const trimmed = industry.trim();
    
    // マッピングに完全一致する場合
    if (industryMap[trimmed]) {
      return industryMap[trimmed];
    }
    
    // 部分一致で変換
    for (const [key, value] of Object.entries(industryMap)) {
      if (trimmed.includes(key)) {
        return value;
      }
    }
    
    // マッピングにない場合はそのまま返す
    return trimmed;
  }).filter((v, i, a) => a.indexOf(v) === i); // 重複を除去
}

/**
 * 補助金データを正規化
 */
export interface NormalizedSubsidy {
  maxAmount?: number;
  subsidyRate?: string;
  startDate?: string;
  endDate?: string;
  targetEmployeeCount?: string;
  industries?: string[];
}

export function normalizeSubsidyData(data: {
  amountText?: string;
  rateText?: string;
  periodText?: string;
  employeeText?: string;
  industries?: string[];
}): NormalizedSubsidy {
  const { startDate, endDate } = parseDateRange(data.periodText);
  
  return {
    maxAmount: parseAmount(data.amountText),
    subsidyRate: parseSubsidyRate(data.rateText),
    startDate,
    endDate,
    targetEmployeeCount: normalizeEmployeeCount(data.employeeText),
    industries: normalizeIndustries(data.industries),
  };
}

