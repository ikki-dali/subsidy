// スクレイピング共通型定義

export type ScrapedSubsidy = {
  // 識別子
  source: string;           // データソース（'mirasapo', 'jnet21', 'tokyo', etc.）
  source_id: string;        // ソース内でのユニークID
  source_url: string;       // 元ページURL

  // 基本情報
  title: string;
  catch_phrase?: string;
  description?: string;

  // 対象条件
  target_area: string[];    // 対象地域
  target_area_detail?: string;
  industry?: string[];      // 対象業種
  target_number_of_employees?: string;

  // 金額
  max_amount?: number;
  subsidy_rate?: string;

  // 期間
  start_date?: string;
  end_date?: string;

  // 追加情報
  organization?: string;    // 実施機関
  use_purpose?: string;
};

export type ScraperResult = {
  source: string;
  success: boolean;
  count: number;
  subsidies: ScrapedSubsidy[];
  errors: string[];
  scrapedAt: string;
};

export type ScraperConfig = {
  name: string;
  region?: string;          // 地域（都道府県名など）
  enabled: boolean;
  schedule?: {
    dayOfWeek: number;      // 0=日曜, 1=月曜, ..., 6=土曜
  };
};

// 地域グループ（曜日分散用）
export const REGION_GROUPS: Record<number, string[]> = {
  0: ['北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県'],  // 日曜
  1: ['茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県'], // 月曜
  2: ['新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県'],  // 火曜
  3: ['静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県'],  // 水曜
  4: ['奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県'], // 木曜
  5: ['徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県'],  // 金曜
  6: ['熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県', '全国'],           // 土曜
};
