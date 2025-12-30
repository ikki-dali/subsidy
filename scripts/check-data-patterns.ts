import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkIdPatterns() {
  // 全体からユニークなプレフィックスを抽出（ページネーション対応）
  const allPatterns: Record<string, number> = {};
  let offset = 0;
  const pageSize = 1000;

  while (true) {
    const { data: page } = await supabase
      .from('subsidies')
      .select('jgrants_id')
      .range(offset, offset + pageSize - 1);

    if (!page || page.length === 0) break;

    page.forEach(s => {
      if (!s.jgrants_id) return;
      let prefix: string;
      if (s.jgrants_id.startsWith('a0W')) prefix = 'a0W... (J-Grants)';
      else if (s.jgrants_id.includes(':')) prefix = s.jgrants_id.split(':')[0] + ':...';
      else prefix = 'other: ' + s.jgrants_id.substring(0, 15);
      allPatterns[prefix] = (allPatterns[prefix] || 0) + 1;
    });

    offset += pageSize;
    if (page.length < pageSize) break;
  }

  console.log('=== 全件 jgrants_id プレフィックス ===');
  Object.entries(allPatterns).sort((a, b) => b[1] - a[1]).forEach(([p, c]) => {
    console.log(`  ${p}: ${c}件`);
  });

  // ソース別の件数
  const { data: sources } = await supabase.from('subsidies').select('source');
  const sourceCounts: Record<string, number> = {};
  sources?.forEach(s => {
    const src = s.source || 'null';
    sourceCounts[src] = (sourceCounts[src] || 0) + 1;
  });

  console.log('\n=== ソース別件数 ===');
  Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]).forEach(([source, count]) => {
    console.log(`  ${source}: ${count}件`);
  });

  // 非J-Grantsデータのサンプル
  const { data: sample } = await supabase
    .from('subsidies')
    .select('jgrants_id, title, description, max_amount, front_url, source')
    .not('jgrants_id', 'like', 'a0W%')
    .limit(5);

  console.log('\n=== 非J-Grantsデータ サンプル ===');
  sample?.forEach((s, i) => {
    console.log(`\n[${i+1}] ${s.title}`);
    console.log(`  ID: ${s.jgrants_id}`);
    console.log(`  概要: ${s.description ? '✓ あり' : '✗ なし'}`);
    console.log(`  金額: ${s.max_amount ? '✓ ' + s.max_amount : '✗ なし'}`);
    console.log(`  URL: ${s.front_url || 'なし'}`);
    console.log(`  ソース: ${s.source || '不明'}`);
  });
}

checkIdPatterns();
