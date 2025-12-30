/**
 * 金額が設定されていない補助金を確認するスクリプト
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { data: noAmount, count } = await supabase
    .from('subsidies')
    .select('id, jgrants_id, title, max_amount', { count: 'exact' })
    .is('max_amount', null);

  console.log(`金額がnullの補助金: ${count}件`);
  console.log('');

  // 多くの補助金はAPI側でもmax_amountが0やnullのため、
  // これ以上の自動改善は困難。手動で金額不明と判断するか、
  // 0を設定する

  // max_amountが0の補助金も確認
  const { count: zeroAmount } = await supabase
    .from('subsidies')
    .select('*', { count: 'exact', head: true })
    .eq('max_amount', 0);

  console.log(`金額が0の補助金: ${zeroAmount}件`);

  // 金額なしの補助金のタイトルを表示
  console.log('\n金額がnullの補助金（最初の20件）:');
  noAmount?.slice(0, 20).forEach((s, i) => {
    console.log(`  ${i + 1}. ${s.title?.substring(0, 60)}...`);
  });
}

main();
