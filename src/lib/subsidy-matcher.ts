/**
 * 補助金の類似度判定ロジック
 * 
 * 以下の基準で類似度を計算:
 * - 業種の一致
 * - 地域の一致
 * - 金額帯の類似
 * - キーワードの類似
 */

export type SubsidyForMatching = {
  id: string;
  title: string;
  description?: string | null;
  industry?: string[] | null;
  target_area?: string[] | null;
  max_amount?: number | null;
  category?: string | null;
};

export type SimilarityResult = {
  subsidyId: string;
  score: number;
  reasons: string[];
};

// 類似度スコアの閾値
const SIMILARITY_THRESHOLD = 0.4; // 40%以上で類似と判定

/**
 * 2つの補助金の類似度を計算
 */
export function calculateSimilarity(
  source: SubsidyForMatching,
  target: SubsidyForMatching
): SimilarityResult {
  const reasons: string[] = [];
  let totalScore = 0;
  let maxPossibleScore = 0;

  // 1. 業種の一致 (重み: 30%)
  const industryScore = calculateArrayOverlap(source.industry, target.industry);
  if (industryScore > 0) {
    reasons.push(`業種一致: ${Math.round(industryScore * 100)}%`);
  }
  totalScore += industryScore * 0.3;
  maxPossibleScore += 0.3;

  // 2. 地域の一致 (重み: 25%)
  const areaScore = calculateAreaMatch(source.target_area, target.target_area);
  if (areaScore > 0) {
    reasons.push(`地域一致: ${Math.round(areaScore * 100)}%`);
  }
  totalScore += areaScore * 0.25;
  maxPossibleScore += 0.25;

  // 3. 金額帯の類似 (重み: 20%)
  const amountScore = calculateAmountSimilarity(source.max_amount, target.max_amount);
  if (amountScore > 0) {
    reasons.push(`金額帯類似: ${Math.round(amountScore * 100)}%`);
  }
  totalScore += amountScore * 0.2;
  maxPossibleScore += 0.2;

  // 4. キーワード類似 (重み: 25%)
  const keywordScore = calculateKeywordSimilarity(
    `${source.title} ${source.description || ''}`,
    `${target.title} ${target.description || ''}`
  );
  if (keywordScore > 0) {
    reasons.push(`キーワード類似: ${Math.round(keywordScore * 100)}%`);
  }
  totalScore += keywordScore * 0.25;
  maxPossibleScore += 0.25;

  // 正規化スコア
  const normalizedScore = maxPossibleScore > 0 ? totalScore / maxPossibleScore : 0;

  return {
    subsidyId: target.id,
    score: normalizedScore,
    reasons,
  };
}

/**
 * 配列の重複率を計算
 */
function calculateArrayOverlap(arr1?: string[] | null, arr2?: string[] | null): number {
  if (!arr1?.length || !arr2?.length) return 0;

  const set1 = new Set(arr1.map(s => s.toLowerCase()));
  const set2 = new Set(arr2.map(s => s.toLowerCase()));

  let matchCount = 0;
  Array.from(set1).forEach(item => {
    if (set2.has(item)) {
      matchCount++;
    }
  });

  // Jaccard類似度
  const unionSize = new Set([...Array.from(set1), ...Array.from(set2)]).size;
  return unionSize > 0 ? matchCount / unionSize : 0;
}

/**
 * 地域の一致度を計算（全国対応含む）
 */
function calculateAreaMatch(area1?: string[] | null, area2?: string[] | null): number {
  // どちらかが全国の場合は一致とみなす
  if (area1?.includes('全国') || area2?.includes('全国')) {
    return 1.0;
  }
  return calculateArrayOverlap(area1, area2);
}

/**
 * 金額帯の類似度を計算
 */
function calculateAmountSimilarity(amount1?: number | null, amount2?: number | null): number {
  // どちらかがnullの場合は判定不能
  if (!amount1 || !amount2) return 0.5; // 中立スコア

  // 対数スケールで比較（桁が近いほど高スコア）
  const log1 = Math.log10(amount1);
  const log2 = Math.log10(amount2);
  const diff = Math.abs(log1 - log2);

  // 1桁以内の差なら高スコア
  if (diff <= 0.5) return 1.0;
  if (diff <= 1.0) return 0.7;
  if (diff <= 1.5) return 0.4;
  if (diff <= 2.0) return 0.2;
  return 0;
}

/**
 * キーワードの類似度を計算（簡易TF-IDF風）
 */
function calculateKeywordSimilarity(text1: string, text2: string): number {
  const keywords1 = extractKeywords(text1);
  const keywords2 = extractKeywords(text2);

  if (keywords1.size === 0 || keywords2.size === 0) return 0;

  let matchCount = 0;
  Array.from(keywords1).forEach(keyword => {
    if (keywords2.has(keyword)) {
      matchCount++;
    }
  });

  // Jaccard類似度
  const unionSize = new Set([...Array.from(keywords1), ...Array.from(keywords2)]).size;
  return unionSize > 0 ? matchCount / unionSize : 0;
}

/**
 * テキストからキーワードを抽出
 */
function extractKeywords(text: string): Set<string> {
  // 補助金関連の重要キーワード
  const importantPatterns = [
    // 事業タイプ
    /設備投資/g, /人材育成/g, /研究開発/g, /販路開拓/g, /IT導入/g,
    /デジタル化/g, /省エネ/g, /脱炭素/g, /環境/g, /創業/g, /起業/g,
    /事業承継/g, /雇用/g, /採用/g, /賃上げ/g, /生産性向上/g,
    // 対象
    /中小企業/g, /小規模事業者/g, /個人事業主/g, /スタートアップ/g,
    /製造業/g, /飲食/g, /小売/g, /サービス業/g, /建設業/g, /農業/g,
    /観光/g, /宿泊/g, /運輸/g, /医療/g, /介護/g, /福祉/g,
    // 補助金名によく出る
    /ものづくり/g, /持続化/g, /事業再構築/g, /IT/g, /DX/g,
  ];

  const keywords = new Set<string>();

  for (const pattern of importantPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      for (const match of matches) {
        keywords.add(match.toLowerCase());
      }
    }
  }

  // 2文字以上の漢字・カタカナの連続も抽出
  const wordMatches = text.match(/[一-龯ァ-ヶー]{2,}/g);
  if (wordMatches) {
    for (const word of wordMatches) {
      // ストップワードを除外
      if (!isStopWord(word)) {
        keywords.add(word.toLowerCase());
      }
    }
  }

  return keywords;
}

/**
 * ストップワード判定
 */
function isStopWord(word: string): boolean {
  const stopWords = new Set([
    'について', 'における', 'に関する', 'のための', 'によって',
    'および', 'または', 'ただし', 'なお', 'その他',
    '事業', '補助金', '助成金', '支援', '制度', '申請', '募集',
    '対象', '期間', '金額', '上限', '下限', '以上', '以下',
    '令和', '年度', '実施', '概要', '詳細', '情報',
  ]);
  return stopWords.has(word);
}

/**
 * 類似補助金を検索
 */
export function findSimilarSubsidies(
  source: SubsidyForMatching,
  candidates: SubsidyForMatching[],
  options: {
    threshold?: number;
    maxResults?: number;
    excludeIds?: string[];
  } = {}
): SimilarityResult[] {
  const {
    threshold = SIMILARITY_THRESHOLD,
    maxResults = 10,
    excludeIds = [],
  } = options;

  const excludeSet = new Set([source.id, ...excludeIds]);

  const results: SimilarityResult[] = [];

  for (const candidate of candidates) {
    // 除外対象はスキップ
    if (excludeSet.has(candidate.id)) continue;

    const similarity = calculateSimilarity(source, candidate);

    if (similarity.score >= threshold) {
      results.push(similarity);
    }
  }

  // スコア降順でソート
  results.sort((a, b) => b.score - a.score);

  // 上位N件を返す
  return results.slice(0, maxResults);
}
