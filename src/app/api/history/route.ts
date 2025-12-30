import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { getCompanyIdFromToken } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 閲覧履歴を取得
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

    // 閲覧履歴を取得（最新20件、補助金情報も結合）
    const { data, error } = await supabaseAdmin
      .from('browsing_history')
      .select(`
        id,
        viewed_at,
        subsidy_id,
        subsidies (
          id,
          title,
          catch_phrase,
          max_amount,
          subsidy_rate,
          target_area,
          industry,
          end_date,
          is_active
        )
      `)
      .eq('company_id', companyId)
      .order('viewed_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching browsing history:', error);
      return NextResponse.json(
        { error: 'Failed to fetch browsing history' },
        { status: 500 }
      );
    }

    return NextResponse.json({ history: data });
  } catch (error) {
    console.error('Error in GET /api/history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 閲覧履歴を保存
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    const companyId = await getCompanyIdFromToken(token);

    if (!companyId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { subsidyId } = body;

    if (!subsidyId) {
      return NextResponse.json(
        { error: 'subsidyId is required' },
        { status: 400 }
      );
    }

    // UPSERT: 既存の履歴がある場合は更新、なければ挿入
    const { error } = await supabaseAdmin
      .from('browsing_history')
      .upsert(
        {
          company_id: companyId,
          subsidy_id: subsidyId,
          viewed_at: new Date().toISOString(),
        },
        {
          onConflict: 'company_id,subsidy_id',
        }
      );

    if (error) {
      console.error('Error saving browsing history:', error);
      return NextResponse.json(
        { error: 'Failed to save browsing history' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in POST /api/history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 閲覧履歴をクリア
export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    const companyId = await getCompanyIdFromToken(token);

    if (!companyId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { error } = await supabaseAdmin
      .from('browsing_history')
      .delete()
      .eq('company_id', companyId);

    if (error) {
      console.error('Error clearing browsing history:', error);
      return NextResponse.json(
        { error: 'Failed to clear browsing history' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


