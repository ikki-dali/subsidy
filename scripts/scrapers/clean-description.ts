// 説明文のクリーニングユーティリティ

// 政府サイトの定型文パターン
const BOILERPLATE_PATTERNS = [
  // 政府公式サイト説明
  /「\.go\.jp」は政府公式サイトです。[\s\S]*?確認してください。/g,
  /政府公式サイトのドメインの多くは[\s\S]*?確認してください。/g,
  
  // SSL/セキュリティ説明
  /このサイトは安全です。[\s\S]*?ご利用ください。/g,
  /URLが「https:\/\/」で始まるサイトは[\s\S]*?ご利用ください。/g,
  /SSL\(Secure Sockets Layer\)技術[\s\S]*?ご利用ください。/g,
  
  // ナビゲーション要素
  /トップページ\s*>\s*[\s\S]*?現在のページ/g,
  /ホーム\s*>\s*[\s\S]*?一覧/g,
  
  // フッター要素
  /プライバシーポリシー[\s\S]*?お問い合わせ/g,
  /Copyright[\s\S]*?All Rights Reserved\.?/gi,
  /©\s*\d{4}[\s\S]*?$/gm,
  
  // ソーシャルシェア
  /Twitter\s*で\s*シェア[\s\S]*?シェア/g,
  /この記事をシェアする[\s\S]*?$/g,
  
  // 広告・バナー関連
  /広告[：:].*/g,
  /PR[：:].*/g,
  
  // サイト固有の定型文
  /重要なお知らせ[\s\n\t]*\d{4}年\d{1,2}月\d{1,2}日/g,
];

// 除去すべきフレーズ（単純なマッチング）
const PHRASES_TO_REMOVE = [
  '「.go.jp」は政府公式サイトです。',
  'このサイトは安全です。',
  '電子申請等をされる際、政府公式サイトであることを確認してください。',
  'SSL技術タイプのブラウザをご利用ください。',
  '政府公式サイトのドメインの多くは「**.go.jp」で終わります。',
  'URLが「https://」で始まるサイトは、セキュリティ確保のためSSL(Secure Sockets Layer)技術を利用しています。',
  '当サイトを利用の際には、SSL技術タイプのブラウザをご利用ください。',
  '当サイトを利用の際には、',
  'ホーム',
  '人気の補助金',
];

// ナビゲーション・パンくず要素のパターン
const NAVIGATION_PATTERNS = [
  /^ホーム$/gm,
  /^人気の補助金$/gm,
  /^トップ$/gm,
  /^メニュー$/gm,
  /^サイトマップ$/gm,
];

/**
 * 説明文から不要な定型文を除去する
 */
export function cleanDescription(description: string | null | undefined): string | null {
  if (!description) return null;
  
  let cleaned = description;
  
  // 定型フレーズを除去
  for (const phrase of PHRASES_TO_REMOVE) {
    cleaned = cleaned.split(phrase).join('');
  }
  
  // 正規表現パターンで除去
  for (const pattern of BOILERPLATE_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }
  
  // ナビゲーションパターンを除去
  for (const pattern of NAVIGATION_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }
  
  // 過剰なタブ/空白を整理
  cleaned = cleaned
    .replace(/\t+/g, ' ')           // タブを空白に
    .replace(/ {2,}/g, ' ')         // 連続空白を1つに
    .replace(/\n{3,}/g, '\n\n')     // 連続改行を2つまでに
    .trim();
  
  // 重複行を除去
  const lines = cleaned.split('\n');
  const uniqueLines: string[] = [];
  const seen = new Set<string>();
  
  for (const line of lines) {
    const trimmed = line.trim();
    // 空行は許可、短すぎる行は無視、重複は除去
    if (trimmed === '') {
      uniqueLines.push('');
    } else if (trimmed.length >= 3 && !seen.has(trimmed)) {
      seen.add(trimmed);
      uniqueLines.push(trimmed);
    }
  }
  
  cleaned = uniqueLines.join('\n').trim();
  
  // 内容が空または非常に短い場合はnullを返す
  if (cleaned.length < 10) return null;
  
  return cleaned;
}

/**
 * HTMLタグを除去してプレーンテキストにする
 */
export function stripHtml(html: string | null | undefined): string | null {
  if (!html) return null;
  
  // HTMLタグを除去
  const text = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');
  
  return cleanDescription(text);
}

/**
 * 説明文を整形して表示用にする
 */
export function formatDescription(description: string | null | undefined, maxLength: number = 500): string | null {
  const cleaned = cleanDescription(description);
  if (!cleaned) return null;
  
  // 長すぎる場合は切り詰める
  if (cleaned.length > maxLength) {
    return cleaned.slice(0, maxLength - 3) + '...';
  }
  
  return cleaned;
}

