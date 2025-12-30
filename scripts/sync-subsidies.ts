/**
 * JグランツAPIから補助金データを取得してSupabaseに同期するスクリプト
 * 
 * 実行方法: npm run sync:subsidies
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

// 環境変数
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const JGRANTS_BASE_URL = 'https://api.jgrants-portal.go.jp/exp/v1/public';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('環境変数が設定されていません: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

type JGrantsSubsidy = {
  id: string;
  name: string;
  title: string;
  subsidy_catch_phrase?: string;
  detail?: string;
  target_area_search?: string;
  target_area_detail?: string;
  industry?: string;
  use_purpose?: string;
  subsidy_max_limit?: number;
  subsidy_rate?: string;
  target_number_of_employees?: string;
  acceptance_start_datetime?: string;
  acceptance_end_datetime?: string;
  project_end_deadline?: string;
  front_subsidy_detail_page_url?: string;
};

type JGrantsResponse = {
  result: JGrantsSubsidy[];
  metadata: {
    resultset: {
      count: number;
    };
  };
};

// 業種文字列を配列に変換
function parseIndustry(industry?: string): string[] {
  if (!industry) return [];
  return industry.split('/').map(s => s.trim()).filter(Boolean);
}

// 地域文字列を配列に変換
function parseArea(area?: string): string[] {
  if (!area) return [];
  // カンマ、スラッシュ、全角スラッシュで分割
  return area.split(/[,\/／]/).map(s => s.trim()).filter(Boolean);
}

async function fetchSubsidiesFromJGrants(): Promise<JGrantsSubsidy[]> {
  console.log('JグランツAPIから補助金一覧を取得中...');
  
  const params = new URLSearchParams({
    keyword: '事業',
    sort: 'acceptance_end_datetime',
    order: 'ASC',
    acceptance: '0',
  });

  const url = `${JGRANTS_BASE_URL}/subsidies?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`JグランツAPI error: ${res.status}`);
  }

  const data: JGrantsResponse = await res.json();
  console.log(`${data.result.length}件の補助金を取得`);
  
  // 各補助金の詳細を取得
  console.log('各補助金の詳細情報を取得中...');
  const detailedSubsidies: JGrantsSubsidy[] = [];
  
  for (let i = 0; i < data.result.length; i++) {
    const subsidy = data.result[i];
    
    // 進捗表示（50件ごと）
    if ((i + 1) % 50 === 0 || i === data.result.length - 1) {
      console.log(`  進捗: ${i + 1}/${data.result.length}件`);
    }
    
    try {
      const detailUrl = `${JGRANTS_BASE_URL}/subsidies/id/${subsidy.id}`;
      const detailRes = await fetch(detailUrl);
      
      if (detailRes.ok) {
        const detailData = await detailRes.json();
        if (detailData.result && detailData.result[0]) {
          detailedSubsidies.push(detailData.result[0]);
        } else {
          detailedSubsidies.push(subsidy);
        }
      } else {
        detailedSubsidies.push(subsidy);
      }
      
      // レート制限対策: 100msの間隔
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`  詳細取得失敗: ${subsidy.id}`);
      detailedSubsidies.push(subsidy);
    }
  }
  
  console.log(`詳細取得完了: ${detailedSubsidies.length}件`);
  return detailedSubsidies;
}

async function syncToSupabase(subsidies: JGrantsSubsidy[]): Promise<void> {
  console.log('Supabaseにデータを同期中...');

  let successCount = 0;
  let errorCount = 0;

  for (const subsidy of subsidies) {
    const record = {
      jgrants_id: subsidy.id,
      name: subsidy.name,
      title: subsidy.title,
      catch_phrase: subsidy.subsidy_catch_phrase || null,
      description: subsidy.detail || null,
      target_area: parseArea(subsidy.target_area_search),
      target_area_detail: subsidy.target_area_detail || null,
      industry: parseIndustry(subsidy.industry),
      use_purpose: subsidy.use_purpose || null,
      target_number_of_employees: subsidy.target_number_of_employees || null,
      max_amount: subsidy.subsidy_max_limit || null,
      subsidy_rate: subsidy.subsidy_rate || null,
      start_date: subsidy.acceptance_start_datetime || null,
      end_date: subsidy.acceptance_end_datetime || null,
      project_end_deadline: subsidy.project_end_deadline || null,
      front_url: subsidy.front_subsidy_detail_page_url || null,
      is_active: true,
      updated_at: new Date().toISOString(),
    };

    // upsert: jgrants_idが同じなら更新、なければ挿入
    const { error } = await supabase
      .from('subsidies')
      .upsert(record, { onConflict: 'jgrants_id' });

    if (error) {
      console.error(`エラー: ${subsidy.title}`, error.message);
      errorCount++;
    } else {
      successCount++;
    }
  }

  console.log(`同期完了: 成功 ${successCount}件, エラー ${errorCount}件`);
}

async function main() {
  try {
    const subsidies = await fetchSubsidiesFromJGrants();
    await syncToSupabase(subsidies);
    console.log('データ同期が完了しました');
  } catch (error) {
    console.error('エラーが発生しました:', error);
    process.exit(1);
  }
}

main();
