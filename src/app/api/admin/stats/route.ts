/**
 * 管理画面統計API
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 並列でデータ取得
    const [
      companiesResult,
      newClientsTodayResult,
      unreadInterestsResult,
      totalInterestsResult,
      subsidiesWithoutAmountResult,
      totalSubsidiesResult,
    ] = await Promise.all([
      // 総クライアント数
      supabaseAdmin.from('companies').select('*', { count: 'exact', head: true }),
      
      // 今日の新規クライアント数
      supabaseAdmin
        .from('companies')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date().toISOString().split('T')[0]),
      
      // 未読リクエスト数
      supabaseAdmin
        .from('company_interests')
        .select('*', { count: 'exact', head: true })
        .is('read_at', null),
      
      // 総リクエスト数
      supabaseAdmin.from('company_interests').select('*', { count: 'exact', head: true }),
      
      // 金額未入力の補助金数
      supabaseAdmin
        .from('subsidies')
        .select('*', { count: 'exact', head: true })
        .is('max_amount', null)
        .eq('is_active', true),
      
      // 総補助金数
      supabaseAdmin.from('subsidies').select('*', { count: 'exact', head: true }),
    ]);

    const stats = {
      totalClients: companiesResult.count || 0,
      newClientsToday: newClientsTodayResult.count || 0,
      unreadInterests: unreadInterestsResult.count || 0,
      totalInterests: totalInterestsResult.count || 0,
      subsidiesWithoutAmount: subsidiesWithoutAmountResult.count || 0,
      totalSubsidies: totalSubsidiesResult.count || 0,
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
