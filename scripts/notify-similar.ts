/**
 * 類似補助金通知スクリプト
 * 
 * 「似た案件を通知」登録したユーザーに対し、
 * 類似の新着補助金があればメールで通知する
 * 
 * 使い方:
 *   npm run notify:similar          # 本番実行
 *   npm run notify:similar:dry      # ドライラン（メール送信なし）
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { findSimilarSubsidies, type SubsidyForMatching } from '../src/lib/subsidy-matcher';
import { sendSimilarSubsidyNotification } from '../src/lib/email';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// 新着とみなす日数
const NEW_SUBSIDY_DAYS = 7;

// 類似度の閾値
const SIMILARITY_THRESHOLD = 0.35;

type NotifyInterest = {
  id: string;
  company_id: string;
  subsidy_id: string;
  note: string | null;
  company: {
    id: string;
    name: string;
    email: string;
    industry: string;
    prefecture: string;
  };
};

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  console.log('='.repeat(60));
  console.log('類似補助金通知');
  console.log('='.repeat(60));
  console.log(`モード: ${dryRun ? 'ドライラン' : '本番'}`);
  console.log('');

  // 1. notify_similar ステータスの興味を取得
  const { data: interests, error: interestsError } = await supabase
    .from('company_interests')
    .select(`
      id,
      company_id,
      subsidy_id,
      note,
      company:companies(id, name, email, industry, prefecture)
    `)
    .eq('status', 'notify_similar');

  if (interestsError) {
    console.error('興味データ取得エラー:', interestsError);
    process.exit(1);
  }

  if (!interests || interests.length === 0) {
    console.log('通知対象がありません。');
    return;
  }

  console.log(`通知希望登録: ${interests.length}件\n`);

  // 2. 新着の募集中補助金を取得
  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - NEW_SUBSIDY_DAYS);

  const { data: newSubsidies, error: subsidiesError } = await supabase
    .from('subsidies')
    .select('id, jgrants_id, title, description, industry, target_area, max_amount')
    .eq('is_active', true)
    .gte('created_at', sinceDate.toISOString())
    .order('created_at', { ascending: false });

  if (subsidiesError) {
    console.error('補助金データ取得エラー:', subsidiesError);
    process.exit(1);
  }

  if (!newSubsidies || newSubsidies.length === 0) {
    console.log(`過去${NEW_SUBSIDY_DAYS}日間に新規補助金がありません。`);
    return;
  }

  console.log(`新着補助金（${NEW_SUBSIDY_DAYS}日以内）: ${newSubsidies.length}件\n`);

  // 候補をSubsidyForMatching形式に変換
  const candidates: SubsidyForMatching[] = newSubsidies.map(s => ({
    id: s.id,
    title: s.title,
    description: s.description,
    industry: s.industry,
    target_area: s.target_area,
    max_amount: s.max_amount,
  }));

  let notifiedCount = 0;
  let skipCount = 0;

  // 3. 各興味に対して類似補助金を探す
  for (const interest of interests as unknown as NotifyInterest[]) {
    const company = Array.isArray(interest.company) ? interest.company[0] : interest.company;
    
    if (!company) {
      console.log(`[Skip] 会社情報なし: interest_id=${interest.id}`);
      skipCount++;
      continue;
    }

    console.log(`\n[${company.name}] ${interest.subsidy_id}`);

    // 元の補助金情報を取得
    const { data: originalSubsidy } = await supabase
      .from('subsidies')
      .select('id, jgrants_id, title, description, industry, target_area, max_amount, end_date')
      .or(`id.eq.${interest.subsidy_id},jgrants_id.eq.${interest.subsidy_id}`)
      .single();

    if (!originalSubsidy) {
      console.log(`  → 元の補助金が見つかりません`);
      skipCount++;
      continue;
    }

    console.log(`  元の補助金: ${originalSubsidy.title.slice(0, 40)}...`);

    // 既に通知済みの補助金IDを取得
    const { data: notifiedHistory } = await supabase
      .from('notification_history')
      .select('notified_subsidy_id')
      .eq('interest_id', interest.id);

    const alreadyNotified = new Set(
      (notifiedHistory || []).map(h => h.notified_subsidy_id)
    );

    // 類似補助金を検索
    const source: SubsidyForMatching = {
      id: originalSubsidy.id,
      title: originalSubsidy.title,
      description: originalSubsidy.description,
      industry: originalSubsidy.industry,
      target_area: originalSubsidy.target_area,
      max_amount: originalSubsidy.max_amount,
    };

    const similarResults = findSimilarSubsidies(source, candidates, {
      threshold: SIMILARITY_THRESHOLD,
      maxResults: 5,
      excludeIds: [originalSubsidy.id, ...Array.from(alreadyNotified)],
    });

    if (similarResults.length === 0) {
      console.log(`  → 類似補助金なし`);
      skipCount++;
      continue;
    }

    console.log(`  → ${similarResults.length}件の類似補助金を発見`);

    // 類似補助金の詳細情報を取得
    const similarSubsidyIds = similarResults.map(r => r.subsidyId);
    const { data: similarDetails } = await supabase
      .from('subsidies')
      .select('id, title, max_amount, end_date')
      .in('id', similarSubsidyIds);

    if (!similarDetails || similarDetails.length === 0) {
      skipCount++;
      continue;
    }

    // 通知データを組み立て
    const similarSubsidiesForEmail = similarDetails.map(s => {
      const result = similarResults.find(r => r.subsidyId === s.id);
      return {
        id: s.id,
        title: s.title,
        maxAmount: s.max_amount,
        endDate: s.end_date,
        matchReasons: result?.reasons || [],
      };
    });

    for (const s of similarSubsidiesForEmail) {
      console.log(`    - ${s.title.slice(0, 35)}... (${s.matchReasons.join(', ')})`);
    }

    // メール送信
    if (!dryRun) {
      const result = await sendSimilarSubsidyNotification({
        to: company.email,
        companyName: company.name,
        originalSubsidyTitle: originalSubsidy.title,
        similarSubsidies: similarSubsidiesForEmail,
      });

      if (result.success) {
        console.log(`  → メール送信成功: ${result.messageId}`);

        // 通知履歴を保存
        for (const similar of similarResults) {
          await supabase.from('notification_history').insert({
            company_id: company.id,
            interest_id: interest.id,
            notified_subsidy_id: similar.subsidyId,
            similarity_score: similar.score,
          });
        }

        notifiedCount++;
      } else {
        console.log(`  → メール送信失敗: ${result.error}`);
      }
    } else {
      console.log(`  → [DRY RUN] メール送信スキップ`);
      notifiedCount++;
    }

    // レート制限
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n' + '='.repeat(60));
  console.log('完了');
  console.log(`  通知送信: ${notifiedCount}件`);
  console.log(`  スキップ: ${skipCount}件`);
  console.log('='.repeat(60));
}

main().catch(console.error);
