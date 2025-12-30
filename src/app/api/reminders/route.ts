import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { getCompanyIdFromToken } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 締切が近いお気に入り補助金を取得
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    const companyId = await getCompanyIdFromToken(token);

    if (!companyId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 現在の日付
    const now = new Date();
    // 7日後の日付
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // お気に入りの補助金で締切が7日以内のものを取得
    const { data: favorites, error: favError } = await supabaseAdmin
      .from('company_favorites')
      .select('subsidy_id')
      .eq('company_id', companyId);

    if (favError) {
      console.error('Error fetching favorites:', favError);
      return NextResponse.json(
        { error: 'Failed to fetch favorites' },
        { status: 500 }
      );
    }

    if (!favorites || favorites.length === 0) {
      return NextResponse.json({ reminders: [] });
    }

    const subsidyIds = favorites.map((f) => f.subsidy_id);

    // 締切が近い補助金を取得
    const { data: subsidies, error: subError } = await supabaseAdmin
      .from('subsidies')
      .select('id, title, end_date, max_amount, target_area')
      .in('id', subsidyIds)
      .gte('end_date', now.toISOString())
      .lte('end_date', sevenDaysLater.toISOString())
      .order('end_date', { ascending: true });

    if (subError) {
      console.error('Error fetching subsidies:', subError);
      return NextResponse.json(
        { error: 'Failed to fetch subsidies' },
        { status: 500 }
      );
    }

    // 残り日数を計算して追加
    const reminders = (subsidies || [])
      .filter((subsidy) => subsidy.end_date !== null)
      .map((subsidy) => {
        const endDate = new Date(subsidy.end_date!);
        const diffTime = endDate.getTime() - now.getTime();
        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return {
          ...subsidy,
          daysRemaining,
          urgency: daysRemaining <= 3 ? 'urgent' : 'soon',
        };
      });

    return NextResponse.json({ reminders });
  } catch (error) {
    console.error('Error in GET /api/reminders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


