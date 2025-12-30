/**
 * 汎用補助金データエンリッチメントスクリプト
 *
 * 複数のデータソースに対応した金額・補助率抽出エンジン
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import { amountExtractor } from './lib/amount-extractor';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// 対応データソース
type EnrichTarget = 'jnet21' | 'mirasapo' | 'pref' | 'all';

// データソース設定
const SOURCE_CONFIG: Record<string, {
  prefix: string;
  name: string;
  extractSourceUrl: boolean; // 詳細ページから元記事URLを抽出するか
  excludeDomains: string[];
  governmentDomains: string[];
}> = {
  jnet21: {
    prefix: 'jnet21:',
    name: 'J-Net21',
    extractSourceUrl: true,
    excludeDomains: [
      'j-net21.smrj.go.jp',
      'service.smrj.go.jp',
      'smrj.go.jp',
      'facebook.com',
      'twitter.com',
      'x.com',
      'youtube.com',
      'line.me',
    ],
    governmentDomains: [
      '.lg.jp', '.go.jp', '.city.', '.town.', '.village.', '.pref.',
      '.or.jp', '.ac.jp', '.cci.or.jp', '.jfc.go.jp',
    ],
  },
  mirasapo: {
    prefix: 'mirasapo:',
    name: 'ミラサポplus',
    extractSourceUrl: true,
    excludeDomains: [
      'mirasapo-plus.go.jp',
      'mirasapo.jp',
      'facebook.com',
      'twitter.com',
      'x.com',
    ],
    governmentDomains: [
      '.lg.jp', '.go.jp', '.city.', '.town.', '.pref.',
      '.meti.go.jp', '.mhlw.go.jp', '.or.jp', '.ac.jp', '.cci.or.jp',
    ],
  },
  pref: {
    prefix: 'pref:',
    name: '都道府県ポータル',
    extractSourceUrl: true, // 元記事URLを追跡して金額抽出
    excludeDomains: [
      // 都道府県ポータル自身を除外（無限ループ防止）
      'hkd.meti.go.jp',
      'smrj.go.jp',
      '21aomori.or.jp',
      'joho-iwate.or.jp',
      'aki-sangyo.or.jp',
      'f-iic.or.jp',
      'iis.or.jp',
      'sapporo-cci.or.jp',
      'tochigi-iin.or.jp',
      'ynet.or.jp',
      // SNS除外
      'facebook.com',
      'twitter.com',
      'x.com',
    ],
    governmentDomains: [
      '.lg.jp',
      '.go.jp',
      '.city.',
      '.town.',
      '.village.',
      '.pref.',
      '.cci.or.jp', // 商工会議所
    ],
  },
};

// ページ取得
async function fetchPage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SubsidyBot/1.0)',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

// 外部リンク抽出
function extractExternalLinks(
  html: string,
  config: (typeof SOURCE_CONFIG)[string]
): string[] {
  const $ = cheerio.load(html);
  const links: string[] = [];

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;

    // 除外ドメインをチェック
    if (config.excludeDomains.some(d => href.includes(d))) return;

    // javascript, #リンクを除外
    if (href.includes('javascript:') || href.startsWith('#')) return;

    // 政府サイトかチェック
    const isGovernmentSite = config.governmentDomains.some(d => href.includes(d));
    if (isGovernmentSite) {
      links.push(href);
    }
  });

  // 優先度でソート
  return links.sort((a, b) => {
    const getScore = (url: string): number => {
      if (url.includes('.lg.jp')) return 5;
      if (url.includes('.city.')) return 4;
      if (url.includes('.town.')) return 4;
      if (url.includes('.pref.')) return 3;
      if (url.includes('.go.jp')) return 2;
      return 1;
    };
    return getScore(b) - getScore(a);
  });
}

// テキストから金額情報を抽出
function extractFromText(text: string): {
  maxAmount?: number;
  subsidyRate?: string;
} {
  const result: {
    maxAmount?: number;
    subsidyRate?: string;
  } = {};

  const amount = amountExtractor.extractAmount(text);
  if (amount) {
    result.maxAmount = amount;
  }

  const rate = amountExtractor.extractSubsidyRate(text);
  if (rate) {
    result.subsidyRate = rate;
  }

  return result;
}

// データソースの処理
async function enrichSubsidy(
  subsidy: { id: string; front_url: string; title: string },
  sourceType: string
): Promise<{
  success: boolean;
  maxAmount?: number;
  subsidyRate?: string;
  sourceUrl?: string;
}> {
  const config = SOURCE_CONFIG[sourceType];
  if (!config) {
    return { success: false };
  }

  // 1. 詳細ページを取得
  const detailHtml = await fetchPage(subsidy.front_url);
  if (!detailHtml) {
    return { success: false };
  }

  const $ = cheerio.load(detailHtml);
  $('script, style, nav, header, footer').remove();
  const detailText = $('body').text();

  // 2. 詳細ページから直接抽出を試みる
  let extracted = extractFromText(detailText);

  // 3. 金額が取れなければ、元記事URLを探す
  let sourceUrl: string | undefined;
  if (!extracted.maxAmount && config.extractSourceUrl) {
    const links = extractExternalLinks(detailHtml, config);
    if (links.length > 0) {
      sourceUrl = links[0];

      // 元記事を取得して抽出
      const sourceHtml = await fetchPage(sourceUrl);
      if (sourceHtml) {
        const $source = cheerio.load(sourceHtml);
        $source('script, style, nav, header, footer').remove();
        const sourceText = $source('body').text();
        extracted = extractFromText(sourceText);
      }
    }
  }

  if (!extracted.maxAmount && !extracted.subsidyRate) {
    return { success: false };
  }

  return {
    success: true,
    ...extracted,
    sourceUrl,
  };
}

// メイン処理
async function main() {
  const args = process.argv.slice(2);
  const targetArg = args.find(a => a.startsWith('--target='))?.split('=')[1] || 'jnet21';
  const limit = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '50', 10);
  const dryRun = args.includes('--dry-run');

  const targets: string[] = targetArg === 'all'
    ? Object.keys(SOURCE_CONFIG)
    : [targetArg];

  console.log('='.repeat(60));
  console.log('補助金データ エンリッチメント');
  console.log('='.repeat(60));
  console.log(`対象ソース: ${targets.join(', ')}`);
  console.log(`最大件数: ${limit}件`);
  console.log(`モード: ${dryRun ? 'ドライラン' : '本番'}`);
  console.log('');

  let totalEnriched = 0;
  let totalFailed = 0;

  for (const target of targets) {
    const config = SOURCE_CONFIG[target];
    if (!config) {
      console.log(`[Warning] Unknown target: ${target}`);
      continue;
    }

    console.log(`\n--- ${config.name} ---`);

    // 金額なしデータを取得
    const { data: subsidies, error } = await supabase
      .from('subsidies')
      .select('id, jgrants_id, title, front_url')
      .like('jgrants_id', `${config.prefix}%`)
      .is('max_amount', null)
      .not('front_url', 'is', null)
      .limit(limit);

    if (error || !subsidies) {
      console.error('データ取得エラー:', error);
      continue;
    }

    console.log(`対象データ: ${subsidies.length}件\n`);

    let enrichedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < subsidies.length; i++) {
      const subsidy = subsidies[i];
      console.log(`[${i + 1}/${subsidies.length}] ${subsidy.title.slice(0, 40)}...`);

      const result = await enrichSubsidy(subsidy, target);

      if (!result.success) {
        console.log('  → 抽出失敗');
        failedCount++;
        continue;
      }

      console.log(`  → 金額: ${result.maxAmount ? amountExtractor.formatAmount(result.maxAmount) : '不明'}`);
      console.log(`  → 補助率: ${result.subsidyRate || '不明'}`);
      if (result.sourceUrl) {
        console.log(`  → 元記事: ${result.sourceUrl.slice(0, 50)}...`);
      }

      // DB更新
      if (!dryRun) {
        const updateData: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
        };

        if (result.maxAmount) {
          updateData.max_amount = result.maxAmount;
        }
        if (result.subsidyRate) {
          updateData.subsidy_rate = result.subsidyRate;
        }
        if (result.sourceUrl) {
          updateData.official_url = result.sourceUrl;
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

    console.log(`\n${config.name}: 成功 ${enrichedCount}件 / 失敗 ${failedCount}件`);
    totalEnriched += enrichedCount;
    totalFailed += failedCount;
  }

  console.log('\n' + '='.repeat(60));
  console.log('完了');
  console.log(`  総成功: ${totalEnriched}件`);
  console.log(`  総失敗: ${totalFailed}件`);
  console.log('='.repeat(60));
}

main().catch(console.error);
