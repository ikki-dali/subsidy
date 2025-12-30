/**
 * 締切アラート送信 Cron API
 *
 * 日次で実行され、締切が近い補助金をユーザーにメール通知する
 *
 * 対象:
 * - お気に入りに追加した補助金
 * - 閲覧履歴のある補助金
 *
 * 通知タイミング:
 * - 締切7日前
 * - 締切3日前
 * - 締切前日
 *
 * 使い方:
 * - Vercel Cron: vercel.json で設定
 * - 手動実行: POST /api/cron/deadline-alerts
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { sendDeadlineAlertEmail, DeadlineAlertSubsidy } from '@/lib/email';

// Cron実行用の認証キー（任意設定）
const CRON_SECRET = process.env.CRON_SECRET;

// 通知する日数（締切まで何日前）
const ALERT_DAYS = [7, 3, 1];

type CompanyWithEmail = {
  id: string;
  name: string;
  contact_name: string;
  email: string;
};

export async function POST(request: NextRequest) {
  try {
    // 認証チェック（CRON_SECRETが設定されている場合）
    if (CRON_SECRET) {
      const authHeader = request.headers.get('authorization');
      if (authHeader !== `Bearer ${CRON_SECRET}`) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    const results = {
      processed: 0,
      emailsSent: 0,
      errors: [] as string[],
    };

    // 今日の日付
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 各通知日について処理
    for (const daysBefore of ALERT_DAYS) {
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + daysBefore);
      const targetDateStr = targetDate.toISOString().split('T')[0];

      console.log(`Checking deadlines for ${targetDateStr} (${daysBefore} days before)`);

      // 対象の補助金を取得（締切日が一致するもの）
      const { data: subsidies, error: subsidyError } = await supabaseAdmin
        .from('subsidies')
        .select('id, title, end_date, max_amount')
        .eq('is_active', true)
        .gte('end_date', targetDateStr)
        .lt('end_date', new Date(targetDate.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

      if (subsidyError) {
        console.error('Error fetching subsidies:', subsidyError);
        results.errors.push(`Failed to fetch subsidies: ${subsidyError.message}`);
        continue;
      }

      if (!subsidies || subsidies.length === 0) {
        console.log(`No subsidies with deadline on ${targetDateStr}`);
        continue;
      }

      const subsidyIds = subsidies.map(s => s.id);
      console.log(`Found ${subsidies.length} subsidies with deadline on ${targetDateStr}`);

      // お気に入りと閲覧履歴から対象ユーザーを取得
      const companiesMap = new Map<string, {
        company: CompanyWithEmail;
        subsidies: Set<string>;
      }>();

      // お気に入りから取得
      const { data: favorites, error: favError } = await supabaseAdmin
        .from('company_favorites')
        .select(`
          company_id,
          subsidy_id,
          companies:company_id (
            id,
            name,
            contact_name,
            email
          )
        `)
        .in('subsidy_id', subsidyIds);

      if (favError) {
        console.error('Error fetching favorites:', favError);
      } else if (favorites) {
        for (const fav of favorites) {
          const company = fav.companies as unknown as CompanyWithEmail;
          if (!company) continue;

          if (!companiesMap.has(company.id)) {
            companiesMap.set(company.id, {
              company,
              subsidies: new Set(),
            });
          }
          companiesMap.get(company.id)!.subsidies.add(fav.subsidy_id);
        }
      }

      // 閲覧履歴から取得
      const { data: history, error: histError } = await supabaseAdmin
        .from('browsing_history')
        .select(`
          company_id,
          subsidy_id,
          companies:company_id (
            id,
            name,
            contact_name,
            email
          )
        `)
        .in('subsidy_id', subsidyIds);

      if (histError) {
        console.error('Error fetching history:', histError);
      } else if (history) {
        for (const hist of history) {
          const company = hist.companies as unknown as CompanyWithEmail;
          if (!company) continue;

          if (!companiesMap.has(company.id)) {
            companiesMap.set(company.id, {
              company,
              subsidies: new Set(),
            });
          }
          companiesMap.get(company.id)!.subsidies.add(hist.subsidy_id);
        }
      }

      // 各ユーザーにメール送信
      for (const [companyId, data] of Array.from(companiesMap.entries())) {
        results.processed++;

        // 既に送信済みかチェック
        const subsidyIdsToNotify = Array.from(data.subsidies);
        // Note: deadline_alert_history テーブルはマイグレーション後に型定義を再生成する必要あり
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: sentAlerts } = await (supabaseAdmin as any)
          .from('deadline_alert_history')
          .select('subsidy_id')
          .eq('company_id', companyId)
          .eq('days_before', daysBefore)
          .in('subsidy_id', subsidyIdsToNotify);

        const alreadySentIds = new Set(sentAlerts?.map((a: { subsidy_id: string }) => a.subsidy_id) || []);
        const newSubsidyIds = subsidyIdsToNotify.filter(id => !alreadySentIds.has(id));

        if (newSubsidyIds.length === 0) {
          console.log(`No new alerts for company ${companyId}`);
          continue;
        }

        // 補助金の詳細情報を取得
        const subsidiesForEmail: DeadlineAlertSubsidy[] = subsidies
          .filter(s => newSubsidyIds.includes(s.id))
          .map(s => ({
            id: s.id,
            title: s.title,
            endDate: s.end_date!,
            daysRemaining: daysBefore,
            maxAmount: s.max_amount,
          }));

        // メール送信
        const result = await sendDeadlineAlertEmail({
          to: data.company.email,
          companyName: data.company.name,
          contactName: data.company.contact_name,
          subsidies: subsidiesForEmail,
        });

        if (result.success) {
          results.emailsSent++;

          // 送信履歴を記録
          const alertRecords = newSubsidyIds.map(subsidyId => ({
            company_id: companyId,
            subsidy_id: subsidyId,
            days_before: daysBefore,
            email_id: result.messageId,
          }));

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error: insertError } = await (supabaseAdmin as any)
            .from('deadline_alert_history')
            .insert(alertRecords);

          if (insertError) {
            console.error('Error recording alert history:', insertError);
          }
        } else {
          results.errors.push(`Failed to send to ${data.company.email}: ${result.error}`);
        }
      }
    }

    console.log('Deadline alert results:', results);

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error) {
    console.error('Error in deadline alert cron:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GETは動作確認用（認証不要）
export async function GET() {
  return NextResponse.json({
    name: 'Deadline Alert Cron',
    description: 'Sends email alerts for subsidies with approaching deadlines',
    alertDays: ALERT_DAYS,
    usage: 'POST /api/cron/deadline-alerts with Authorization: Bearer <CRON_SECRET>',
    configured: {
      cronSecret: !!CRON_SECRET,
      resendApiKey: !!process.env.RESEND_API_KEY,
    },
  });
}
