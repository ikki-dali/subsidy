// 曜日別ディープクロールターゲット設定
// 東京都・埼玉県特化スケジュール

// 曜日（0=日曜, 1=月曜, ..., 6=土曜）ごとのクロールターゲット
export const DAILY_DEEP_CRAWL_TARGETS: Record<number, string[]> = {
  0: [],                                          // 日曜: 休止
  1: ['jgrants-kanto'],                           // 月曜: JGrants API同期（東京・埼玉）
  2: ['jnet21-kanto', 'mhlw'],                    // 火曜: J-Net21 + 厚労省
  3: ['tokyo-kosha', 'saitama-j'],                // 水曜: 東京都振興公社 + 埼玉県振興公社
  4: ['tokyo-metro', 'saitama-pref'],             // 木曜: 東京都産業労働局 + 埼玉県庁
  5: ['tokyo-shokokai', 'saitama-shokokai'],      // 金曜: 商工会（東京・埼玉）
  6: [],                                          // 土曜: 重複排除・整合性チェック
};

// 特殊処理タスク（ディープクローラー以外）
export const DAILY_SPECIAL_TASKS: Record<number, string[]> = {
  0: [],
  1: ['sync-jgrants-kanto'],      // JGrants API同期スクリプト
  2: ['sync-jnet21', 'sync-mhlw'], // J-Net21 + 厚労省スクレイパー
  3: [],
  4: [],
  5: [],
  6: ['cleanup-duplicates', 'check-integrity'], // データ整合性チェック
};

// 曜日の日本語名
export const DAY_NAMES: Record<number, string> = {
  0: '日曜日',
  1: '月曜日',
  2: '火曜日',
  3: '水曜日',
  4: '木曜日',
  5: '金曜日',
  6: '土曜日',
};

// ディープクロールのタイムアウト設定（ミリ秒）
export const DEEP_CRAWL_TIMEOUT = 30 * 60 * 1000;  // 30分

// ディープクロールの設定
export const DEEP_CRAWL_CONFIG = {
  // 日次同期時は控えめな設定
  maxPages: 50,
  maxDepth: 2,
  requestDelay: 2000,
  concurrency: 1,
};

// 今日のターゲットを取得
export function getTodaysTargets(): string[] {
  const dayOfWeek = new Date().getDay();
  return DAILY_DEEP_CRAWL_TARGETS[dayOfWeek] || [];
}

// 特定の曜日のターゲットを取得
export function getTargetsForDay(dayOfWeek: number): string[] {
  return DAILY_DEEP_CRAWL_TARGETS[dayOfWeek] || [];
}

// ターゲットがあるかどうか
export function hasTargetsToday(): boolean {
  return getTodaysTargets().length > 0;
}

// 曜日別スケジュールを表示
export function printSchedule(): void {
  console.log('Deep Crawl Schedule:');
  console.log('');
  for (let day = 0; day < 7; day++) {
    const targets = DAILY_DEEP_CRAWL_TARGETS[day];
    const dayName = DAY_NAMES[day];
    if (targets.length > 0) {
      console.log(`  ${dayName}: ${targets.join(', ')}`);
    } else {
      console.log(`  ${dayName}: (休止)`);
    }
  }
}
