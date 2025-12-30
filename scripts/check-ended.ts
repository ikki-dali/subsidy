/**
 * 募集終了チェックスクリプト
 * 
 * 全ての補助金の元記事ページをチェックし、
 * 募集終了しているものをis_active=falseに更新する
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
      const timeout = 15000 + (i * 10000);
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
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }
  return null;
}

// ページから募集終了を検出
async function checkIfEnded(url: string): Promise<boolean> {
  try {
    const html = await fetchWithRetry(url);
    if (!html) {
      return false;
    }

    const $ = cheerio.load(html);
    $('script, style, nav, header, footer').remove();
    const text = $('body').text();

    return amountExtractor.isRecruitmentEnded(text);
  } catch {
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const limit = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '100', 10);
  const dryRun = args.includes('--dry-run');

  console.log('='.repeat(60));
  console.log('募集終了チェック');
  console.log('='.repeat(60));
  console.log(`対象: アクティブな補助金 (最大${limit}件)`);
  console.log(`モード: ${dryRun ? 'ドライラン' : '本番'}`);
  console.log('');

  // アクティブな補助金で元記事URLがあるものを取得
  const { data: subsidies, error } = await supabase
    .from('subsidies')
    .select('id, title, front_url, official_url')
    .eq('is_active', true)
    .not('front_url', 'is', null)
    .limit(limit);

  if (error || !subsidies) {
    console.error('データ取得エラー:', error);
    process.exit(1);
  }

  console.log(`対象データ: ${subsidies.length}件\n`);

  let endedCount = 0;
  let checkedCount = 0;

  for (let i = 0; i < subsidies.length; i++) {
    const subsidy = subsidies[i];
    const shortTitle = subsidy.title.slice(0, 45);
    
    // official_urlがあればそちらを優先、なければfront_url
    const checkUrl = subsidy.official_url || subsidy.front_url;
    
    const isEnded = await checkIfEnded(checkUrl);
    checkedCount++;

    if (isEnded) {
      console.log(`[${i + 1}/${subsidies.length}] ${shortTitle}...`);
      console.log(`  → 【募集終了検出】`);
      
      if (!dryRun) {
        const { error: updateError } = await supabase
          .from('subsidies')
          .update({ 
            is_active: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', subsidy.id);

        if (updateError) {
          console.log(`  → DB更新エラー: ${updateError.message}`);
        } else {
          console.log(`  → is_active=false に更新`);
          endedCount++;
        }
      } else {
        endedCount++;
      }
    }

    // 進捗表示（100件ごと）
    if (i > 0 && i % 100 === 0) {
      console.log(`... ${i}件チェック完了 (終了検出: ${endedCount}件)`);
    }

    // レート制限
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n' + '='.repeat(60));
  console.log('完了');
  console.log(`  チェック: ${checkedCount}件`);
  console.log(`  募集終了: ${endedCount}件`);
  console.log('='.repeat(60));
}

main().catch(console.error);
