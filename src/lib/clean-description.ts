// 説明文のクリーニングユーティリティ（フロントエンド用）

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
  
  // 重要なお知らせ系
  /重要なお知らせ[\s\n\t]*\d{4}年\d{1,2}月\d{1,2}日/g,
];

// 除去すべきフレーズ
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
  // ナビゲーション・UI要素
  'メインコンテンツへスキップ',
  'コンテンツへスキップ',
  'Skip to content',
  'Skip to main content',
  'MENU',
  'メニュー',
  'グローバルナビゲーション',
  'フッターナビゲーション',
  'サイドバー',
  // 一般的なサイトナビ
  '中小公社早わかりガイド',
  '採用情報',
  'お問い合わせ',
  'サイトマップ',
  'アクセシビリティ',
  'プライバシーポリシー',
  '個人情報保護方針',
  '利用規約',
  'よくある質問',
  'FAQ',
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
  
  let text = html;
  
  // エスケープされたHTMLタグを元に戻す（&lt;iframe&gt; → <iframe>）
  text = text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'");
  
  // 危険なタグを完全に除去
  text = text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<iframe[^>]*\/>/gi, '')  // 自己終了タグ
    .replace(/<iframe[^>]*>/gi, '');   // 閉じタグなしのiframe
  
  // Google Tag Manager等の特定パターンを除去
  text = text.replace(/<iframe[^>]*googletagmanager[^>]*>[^<]*<\/iframe>/gi, '');
  text = text.replace(/\[if[^\]]*\][\s\S]*?\[endif\]/gi, ''); // IEコンディショナルコメント
  
  // 残りのHTMLタグを除去
  text = text
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ');
  
  // HTMLタグがテキストとして残っている場合も除去（< で始まり > で終わる）
  text = text.replace(/<[a-zA-Z][^>]*>/g, ' ');
  text = text.replace(/<\/[a-zA-Z]+>/g, ' ');
  
  return cleanDescription(text);
}

/**
 * 説明文を段落に分割して配列で返す
 * @param text 説明文
 * @param title タイトル（指定された場合、タイトルと同じ行は除去）
 */
export function splitIntoParagraphs(text: string | null | undefined, title?: string | null): string[] {
  // まずHTMLをストリップしてからクリーニング
  const cleaned = stripHtml(text);
  if (!cleaned) return [];
  
  const titleLower = title?.toLowerCase().trim();
  
  // ナビゲーション要素として除去すべきパターン（行単位）
  const navPatterns = [
    /^(ホーム|トップ|メニュー|MENU|TOP|HOME)$/i,
    /^(English|日本語|中文|한국어)$/i,
    /^文字サイズ$/,
    /^(大|中|小)$/,
    /^(ログイン|ログアウト|会員登録|新規登録)$/,
    /^(よくある(ご)?質問|FAQ|Q&A)$/i,
    /^(お問い合わせ|問い合わせ|連絡先|アクセス)$/,
    /^(サイトマップ|サイト内検索|検索)$/,
    /^(プライバシーポリシー|個人情報|利用規約|免責事項)$/,
    /^(採用情報|会社概要|会社情報|事業概要)$/,
    /^(前のページ|次のページ|戻る|進む)$/,
    /^(シェア|共有|ツイート|いいね)$/,
    /^(更新日|掲載日|公開日)[:：]?\s*\d*/,
    /^>\s*.+$/,  // パンくずリスト（> で始まる）
    /^[>＞]\s*/,  // パンくず
    /^(目的|キーワード|事業名)から探す$/,
    /^(公社|事業|支援)(の概要|について|一覧)$/,
    /^(ポータル|事例)(サイト)?(一覧)?$/,
    /^.{1,3}$/,  // 3文字以下の短い行
    /^[\s\-_=・]+$/,  // 区切り線のみ
    /^(ネット)?クラブ(ログイン)?$/,
    /^その他のサービス$/,
    /^契約・入札情報$/,
    /^貸会議室.*$/,
    /^公社の.*$/,
    /^事業別.*$/,
    /^アクセス・.*$/,
  ];
  
  return cleaned
    .split(/\n+/)
    .map(p => p.trim())
    .filter(p => {
      if (p.length === 0) return false;
      // タイトルと同じ内容は除去
      if (titleLower && p.toLowerCase() === titleLower) return false;
      // ナビゲーション要素を除去
      for (const pattern of navPatterns) {
        if (pattern.test(p)) return false;
      }
      return true;
    });
}

