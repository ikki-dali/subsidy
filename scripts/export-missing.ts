import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function main() {
  const { data, error } = await supabase
    .from('subsidies')
    .select('id, title, jgrants_id, front_url')
    .is('max_amount', null)
    .is('subsidy_rate', null);

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (!data) {
    console.log('データなし');
    return;
  }

  console.log('# 金額・補助率なしデータ一覧（手動確認用）\n');
  console.log(`合計: ${data.length}件\n`);
  console.log('---\n');

  data.forEach((d, i) => {
    console.log(`## ${i + 1}. ${d.title || '(タイトルなし)'}\n`);
    console.log(`- ID: ${d.id}`);
    console.log(`- ソース: ${d.jgrants_id || 'なし'}`);
    console.log(`- 詳細URL: ${d.front_url || 'なし'}`);
    console.log('');
  });
}

main().catch(console.error);
