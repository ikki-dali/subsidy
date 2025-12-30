// 曜日別ディープクロールターゲット設定

// 曜日（0=日曜, 1=月曜, ..., 6=土曜）ごとのクロールターゲット
export const DAILY_DEEP_CRAWL_TARGETS: Record<number, string[]> = {
  0: [],                        // 日曜: 休止
  1: ['tokyo-kosha'],           // 月曜: 東京都中小企業振興公社
  2: ['tokyo-metro'],           // 火曜: 東京都
  3: ['meti'],                  // 水曜: 経済産業省
  4: [],                        // 木曜: （予備日/他の処理用）
  5: [],                        // 金曜: （予備日/他の処理用）
  6: [],                        // 土曜: 休止
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
