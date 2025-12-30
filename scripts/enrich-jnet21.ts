/**
 * J-Net21データエンリッチメントスクリプト
 *
 * J-Net21の詳細ページから元記事URLを取得し、
 * 元記事から金額・補助率を抽出してDBを更新する
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import { amountExtractor } from './lib/amount-extractor';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// リトライ付きフェッチ
async function fetchWithRetry(url: string, retries = 2): Promise<string | null> {
  for (let i = 0; i <= retries; i++) {
    try {
      const timeout = 15000 + (i * 10000); // 15秒, 25秒, 35秒
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SubsidyBot/1.0)',
        },
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return await response.text();
      }
    } catch {
      if (i < retries) {
        await new Promise(r => setTimeout(r, 1000)); // 1秒待機してリトライ
      }
    }
  }
  return null;
}

// J-Net21詳細ページから元記事URL候補を抽出（複数返す）
async function extractSourceUrls(jnet21Url: string): Promise<string[]> {
  try {
    const html = await fetchWithRetry(jnet21Url);
    if (!html) {
      return [];
    }
    const $ = cheerio.load(html);

    // 外部リンクを探す（自治体サイト等へのリンク）
    const externalLinks: string[] = [];

    // 除外するドメイン
    const excludeDomains = [
      'j-net21.smrj.go.jp',
      'service.smrj.go.jp',
      'smrj.go.jp',
      'facebook.com',
      'twitter.com',
      'x.com',
      'youtube.com',
      'line.me',
    ];

    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (!href) return;

      // 除外ドメインをチェック
      const isExcluded = excludeDomains.some(d => href.includes(d));
      if (isExcluded) return;

      // javascript, #リンクを除外
      if (href.includes('javascript:') || href.startsWith('#')) return;

      // 自治体・省庁・公益法人サイトを対象
      const isGovernmentSite =
        href.includes('.lg.jp') ||
        href.includes('.go.jp') ||
        href.includes('.city.') ||
        href.includes('.town.') ||
        href.includes('.village.') ||
        href.includes('.pref.') ||
        href.includes('.or.jp') ||  // 公益法人
        href.includes('.ac.jp') ||  // 大学・研究機関
        href.includes('.cci.or.jp') || // 商工会議所
        href.match(/\.okinawa\.jp|\.hokkaido\.jp|\.tokyo\.jp/);

      if (isGovernmentSite) {
        externalLinks.push(href);
      }
    });

    // 優先度でソート（複数候補を返す）
    const prioritized = externalLinks.sort((a, b) => {
      const getScore = (url: string): number => {
        if (url.includes('.lg.jp')) return 6;
        if (url.includes('.city.')) return 5;
        if (url.includes('.town.')) return 5;
        if (url.includes('.village.')) return 5;
        if (url.includes('.pref.')) return 4;
        if (url.includes('.go.jp')) return 3;
        if (url.includes('.or.jp')) return 2;
        if (url.includes('.ac.jp')) return 1;
        return 0;
      };
      return getScore(b) - getScore(a);
    });

    // 上位3件を返す（複数試行用）
    return prioritized.slice(0, 3);
  } catch (error) {
    console.warn(`  [Warning] Failed to fetch ${jnet21Url}`);
    return [];
  }
}

// J-Net21詳細ページから説明文を抽出
async function extractDescriptionFromJNet21(jnet21Url: string): Promise<string | null> {
  try {
    const html = await fetchWithRetry(jnet21Url);
    if (!html) {
      return null;
    }
    const $ = cheerio.load(html);

    // 「実施機関からのお知らせ」セクションのテキストを取得
    let description = '';
    
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

    // フォールバック: og:descriptionメタタグから取得
    if (!description || description.length < 20) {
      const ogDesc = $('meta[property="og:description"]').attr('content');
      if (ogDesc && ogDesc.length > 30) {
        // 定型文を除去
        description = ogDesc
          .replace(/「.*」（支援情報ヘッドライン）」を掲載しています。/, '')
          .replace(/経営に役立つ最新情報を紹介しています。/, '')
          .trim();
      }
    }

    if (description && description.length > 20) {
      return description.slice(0, 2000);
    }
    return null;
  } catch (error) {
    console.warn(`  [Warning] Failed to extract description from ${jnet21Url}`);
    return null;
  }
}

// 元記事から金額・締切日情報を抽出（共通モジュール使用）
async function extractDataFromSource(sourceUrl: string): Promise<{
  maxAmount?: number;
  subsidyRate?: string;
  endDate?: string;
  startDate?: string;
  isEnded?: boolean;
}> {
  try {
    const html = await fetchWithRetry(sourceUrl);
    if (!html) {
      return {};
    }

    const $ = cheerio.load(html);

    // テキスト抽出（script, styleを除く）
    $('script, style, nav, header, footer').remove();
    const text = $('body').text();

    const result: {
      maxAmount?: number;
      subsidyRate?: string;
      endDate?: string;
      startDate?: string;
      isEnded?: boolean;
    } = {};

    // 募集終了検出（最優先でチェック）
    if (amountExtractor.isRecruitmentEnded(text)) {
      result.isEnded = true;
    }

    // 共通モジュールで金額抽出（複数パターン対応、最大値取得）
    const amount = amountExtractor.extractAmount(text);
    if (amount) {
      result.maxAmount = amount;
    }

    // 共通モジュールで補助率抽出
    const rate = amountExtractor.extractSubsidyRate(text);
    if (rate) {
      result.subsidyRate = rate;
    }

    // 締切日抽出
    const endDate = amountExtractor.extractDeadline(text);
    if (endDate) {
      result.endDate = endDate;
    }

    // 開始日抽出
    const startDate = amountExtractor.extractStartDate(text);
    if (startDate) {
      result.startDate = startDate;
    }

    return result;
  } catch (error) {
    console.warn(`  [Warning] Failed to fetch source: ${sourceUrl}`);
    return {};
  }
}

// メイン処理
async function main() {
  const args = process.argv.slice(2);
  const limit = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '50', 10);
  const dryRun = args.includes('--dry-run');

  console.log('='.repeat(60));
  console.log('J-Net21 データエンリッチメント');
  console.log('='.repeat(60));
  console.log(`対象: 金額なしまたは締切日なしのJ-Net21データ (最大${limit}件)`);
  console.log(`モード: ${dryRun ? 'ドライラン' : '本番'}`);
  console.log('');

  // 金額なし、締切日なし、または説明文なしのJ-Net21データを取得
  const { data: subsidies, error } = await supabase
    .from('subsidies')
    .select('id, jgrants_id, title, front_url, max_amount, subsidy_rate, end_date, description')
    .like('jgrants_id', 'jnet21:%')
    .or('max_amount.is.null,end_date.is.null,description.is.null')
    .not('front_url', 'is', null)
    .limit(limit);

  if (error || !subsidies) {
    console.error('データ取得エラー:', error);
    process.exit(1);
  }

  console.log(`対象データ: ${subsidies.length}件\n`);

  let enrichedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < subsidies.length; i++) {
    const subsidy = subsidies[i];
    console.log(`[${i + 1}/${subsidies.length}] ${subsidy.title.slice(0, 40)}...`);

    // 0. descriptionがない場合、J-Net21ページから説明文を取得
    let description: string | null = null;
    if (!subsidy.description) {
      description = await extractDescriptionFromJNet21(subsidy.front_url);
      if (description) {
        console.log(`  → 説明文: ${description.slice(0, 50)}...`);
      }
    }

    // 1. J-Net21詳細ページから元記事URL候補を取得（複数）
    const sourceUrls = await extractSourceUrls(subsidy.front_url);

    // 2. 複数の元記事URLを順次試行
    let extracted: { maxAmount?: number; subsidyRate?: string; endDate?: string; startDate?: string; isEnded?: boolean } = {};
    let successUrl: string | undefined;

    for (const url of sourceUrls) {
      console.log(`  → 試行: ${url.slice(0, 55)}...`);
      const result = await extractDataFromSource(url);
      if (result.maxAmount || result.subsidyRate || result.endDate || result.isEnded) {
        extracted = result;
        successUrl = url;
        break;
      }
    }

    // 3. 元記事URLが見つからないか抽出失敗の場合、J-Net21ページから直接抽出
    if (!extracted.maxAmount && !extracted.subsidyRate && !extracted.endDate && !extracted.isEnded) {
      console.log('  → J-Net21ページから直接抽出を試行...');
      const jnetResult = await extractDataFromSource(subsidy.front_url);
      if (jnetResult.maxAmount || jnetResult.subsidyRate || jnetResult.endDate || jnetResult.isEnded) {
        extracted = jnetResult;
        // J-Net21から直接抽出した場合はofficial_urlを設定しない
      }
    }

    // descriptionも含めて何か更新するものがあるかチェック
    const hasUpdate = extracted.maxAmount || extracted.subsidyRate || extracted.endDate || extracted.isEnded || description;
    if (!hasUpdate) {
      console.log(`  → 情報見つからず`);
      failedCount++;
      continue;
    }

    const sourceUrl = successUrl; // undefinedの場合もある

    console.log(`  → 金額: ${extracted.maxAmount ? amountExtractor.formatAmount(extracted.maxAmount) : '不明'}`);
    console.log(`  → 補助率: ${extracted.subsidyRate || '不明'}`);
    console.log(`  → 締切日: ${extracted.endDate || '不明'}`);
    if (extracted.startDate) {
      console.log(`  → 開始日: ${extracted.startDate}`);
    }
    if (extracted.isEnded) {
      console.log(`  → 【募集終了】`);
    }

    // 4. DB更新
    if (!dryRun) {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      // 元記事URLがある場合のみ設定
      if (sourceUrl) {
        updateData.official_url = sourceUrl;
      }

      if (extracted.maxAmount) {
        updateData.max_amount = extracted.maxAmount;
      }
      if (extracted.subsidyRate) {
        updateData.subsidy_rate = extracted.subsidyRate;
      }
      if (extracted.endDate) {
        updateData.end_date = extracted.endDate;
      }
      if (extracted.startDate) {
        updateData.start_date = extracted.startDate;
      }
      if (extracted.isEnded) {
        updateData.is_active = false;
      }
      if (description) {
        updateData.description = description;
      }

      const { error: updateError } = await supabase
        .from('subsidies')
        .update(updateData)
        .eq('id', subsidy.id);

      if (updateError) {
        console.log(`  → DB更新エラー: ${updateError.message}`);
        failedCount++;
        continue;
      }
    }

    console.log('  → 更新完了!');
    enrichedCount++;

    // レート制限
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n' + '='.repeat(60));
  console.log('完了');
  console.log(`  成功: ${enrichedCount}件`);
  console.log(`  失敗: ${failedCount}件`);
  console.log('='.repeat(60));
}

main().catch(console.error);
