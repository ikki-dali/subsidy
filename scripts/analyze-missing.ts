import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function main() {
  const { data } = await supabase
    .from('subsidies')
    .select('title, jgrants_id, front_url')
    .is('max_amount', null)
    .is('subsidy_rate', null);

  if (!data) {
    console.log('データなし');
    return;
  }

  const jnet21 = data.filter(d => d.jgrants_id?.startsWith('jnet21:'));
  const mirasapo = data.filter(d => d.jgrants_id?.startsWith('mirasapo:'));
  const pref = data.filter(d => d.jgrants_id?.startsWith('pref:'));
  const other = data.filter(d => {
    const id = d.jgrants_id || '';
    return !id.startsWith('jnet21:') && !id.startsWith('mirasapo:') && !id.startsWith('pref:');
  });

  console.log('=== 情報なし内訳 ===');
  console.log('J-Net21:', jnet21.length);
  console.log('mirasapo:', mirasapo.length);
  console.log('pref:', pref.length);
  console.log('その他:', other.length);

  console.log('\n=== mirasapo ===');
  mirasapo.forEach((d, i) => {
    console.log(`${i+1}. ${(d.title || '').slice(0, 60)}`);
    console.log(`   URL: ${d.front_url}`);
  });

  console.log('\n=== その他 ===');
  other.slice(0, 10).forEach((d, i) => {
    console.log(`${i+1}. ${(d.title || '').slice(0, 50)} [${d.jgrants_id || 'null'}]`);
    console.log(`   URL: ${d.front_url}`);
  });

  console.log('\n=== J-Net21 (全件) ===');
  jnet21.forEach((d, i) => {
    console.log(`${i+1}. ${(d.title || '').slice(0, 60)}`);
  });
}

main().catch(console.error);
