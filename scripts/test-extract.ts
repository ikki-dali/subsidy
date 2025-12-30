import { config } from 'dotenv';
config({ path: '.env.local' });

import * as cheerio from 'cheerio';
import { AmountExtractor } from './lib/amount-extractor';

const amountExtractor = new AmountExtractor();

async function fetchWithRetry(url: string, retries = 2): Promise<string | null> {
  for (let i = 0; i <= retries; i++) {
    try {
      const timeout = 15000 + (i * 10000);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SubsidyBot/1.0)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ja,en;q=0.5',
        },
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return await response.text();
      }
    } catch (error) {
      if (i < retries) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }
  return null;
}

async function testExtraction(url: string, name: string) {
  console.log(`\n=== ${name} ===`);
  console.log(`URL: ${url}`);

  const html = await fetchWithRetry(url);
  if (!html) {
    console.log('Failed to fetch');
    return;
  }

  const $ = cheerio.load(html);
  $('script, style, nav, header, footer').remove();
  const text = $('body').text();

  // テキストの一部を表示
  console.log('\n--- Text sample (1000 chars) ---');
  console.log(text.replace(/\s+/g, ' ').slice(0, 1000));

  // 金額抽出
  const amount = amountExtractor.extractAmount(text);
  console.log(`\n金額: ${amount ? amount.toLocaleString() + '円' : '見つからず'}`);

  // 補助率抽出
  const rate = amountExtractor.extractSubsidyRate(text);
  console.log(`補助率: ${rate || '見つからず'}`);

  // パターン検出テスト
  const patterns = [
    /(\d{1,3}(?:,\d{3})*)\s*(億|万)?円/g,
    /[0-9０-９]+\s*万円/g,
    /[0-9０-９]+\s*円/g,
    /[１２３４５６７８９０]+\s*万円/g,
  ];

  console.log('\n--- パターンマッチ ---');
  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) {
      console.log(`${pattern}: ${matches.slice(0, 5).join(', ')}`);
    }
  }
}

async function main() {
  // 鳴門市
  await testExtraction('https://www.city.naruto.tokushima.jp/docs/2025110600016/', '鳴門市');
}

main().catch(console.error);
