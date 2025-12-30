/**
 * J-Grants APIから詳細情報を取得して既存レコードを更新するスクリプト
 * 
 * 実行方法: npm run enrich:jgrants
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const JGRANTS_BASE_URL = 'https://api.jgrants-portal.go.jp/exp/v1/public';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// HTMLタグを除去してテキストを抽出
function cleanHtml(html: string | null): string | null {
  if (!html) return null;
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchDetail(jgrantsId: string): Promise<{
  detail: string | null;
  max_amount: number | null;
  subsidy_rate: string | null;
} | null> {
  try {
    const res = await fetch(`${JGRANTS_BASE_URL}/subsidies/id/${jgrantsId}`);
    if (!res.ok) return null;
    
    const data = await res.json();
    if (!data.result || !data.result[0]) return null;
    
    const s = data.result[0];
    return {
      detail: s.detail || null,
      max_amount: s.subsidy_max_limit || null,
      subsidy_rate: s.subsidy_rate || null,
    };
  } catch {
    return null;
  }
}

async function main() {
  // 詳細未取得のレコードを取得（J-Grants API由来のa0Wで始まるIDのみ対象）
  const { data: subsidies, error } = await supabase
    .from('subsidies')
    .select('id, jgrants_id, title')
    .like('jgrants_id', 'a0W%')
    .is('description', null)
    .limit(500);  // 一度に処理する件数を制限
  
  if (error) {
    console.error('DB取得エラー:', error.message);
    process.exit(1);
  }
  
  console.log(`詳細未取得の補助金: ${subsidies?.length || 0}件`);
  
  if (!subsidies || subsidies.length === 0) {
    console.log('処理対象がありません');
    return;
  }
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < subsidies.length; i++) {
    const subsidy = subsidies[i];
    
    // 進捗表示
    if ((i + 1) % 50 === 0 || i === subsidies.length - 1) {
      console.log(`進捗: ${i + 1}/${subsidies.length}件 (成功: ${successCount}, エラー: ${errorCount})`);
    }
    
    const detail = await fetchDetail(subsidy.jgrants_id!);
    
    if (detail) {
      const { error: updateError } = await supabase
        .from('subsidies')
        .update({
          description: cleanHtml(detail.detail),
          max_amount: detail.max_amount,
          subsidy_rate: detail.subsidy_rate,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subsidy.id);
      
      if (updateError) {
        errorCount++;
      } else {
        successCount++;
      }
    } else {
      errorCount++;
    }
    
    // レート制限対策: 50msの間隔
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  console.log(`\n完了: 成功 ${successCount}件, エラー ${errorCount}件`);
  
  // 残りの件数を確認（J-Grants API由来のもののみ）
  const { count } = await supabase
    .from('subsidies')
    .select('*', { count: 'exact', head: true })
    .like('jgrants_id', 'a0W%')
    .is('description', null);
  
  console.log(`残り詳細未取得: ${count}件`);
}

main();
