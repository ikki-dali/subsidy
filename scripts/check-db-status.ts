import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function check() {
  const { count: total } = await supabase.from('subsidies').select('*', { count: 'exact', head: true });
  const { count: hasAmount } = await supabase.from('subsidies').select('*', { count: 'exact', head: true }).not('max_amount', 'is', null);
  const { count: hasRate } = await supabase.from('subsidies').select('*', { count: 'exact', head: true }).not('subsidy_rate', 'is', null);

  // 金額または補助率あり
  const { count: withInfo } = await supabase
    .from('subsidies')
    .select('*', { count: 'exact', head: true })
    .or('max_amount.not.is.null,subsidy_rate.not.is.null');

  // 両方なし
  const { count: withoutInfo } = await supabase
    .from('subsidies')
    .select('*', { count: 'exact', head: true })
    .is('max_amount', null)
    .is('subsidy_rate', null);

  const pct = ((withInfo || 0) / (total || 1) * 100).toFixed(1);
  const target = Math.ceil((total || 0) * 0.02);

  console.log('='.repeat(50));
  console.log('📊 現在のDB状況');
  console.log('='.repeat(50));
  console.log('総件数:', total);
  console.log('金額あり:', hasAmount);
  console.log('補助率あり:', hasRate);
  console.log('金額OR補助率あり:', withInfo, '(' + pct + '%)');
  console.log('情報なし:', withoutInfo);
  console.log('='.repeat(50));
  console.log('🎯 目標: 98% (情報なし ' + target + '件以下)');
  console.log('📉 残り削減: ' + ((withoutInfo || 0) - target) + '件');
  console.log('='.repeat(50));

  // 情報なしの例
  const { data: samples } = await supabase
    .from('subsidies')
    .select('title, max_amount, subsidy_rate, front_url')
    .is('max_amount', null)
    .is('subsidy_rate', null)
    .limit(10);

  console.log('\n=== 情報なしの例 ===');
  if (samples) {
    samples.forEach((s, i) => {
      const title = s.title || '(タイトルなし)';
      console.log((i+1) + '. ' + title.slice(0, 60) + '...');
    });
  }
}

check();
