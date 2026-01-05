import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { getCompanyIdFromToken } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 無料相談枠の残数と招待成功数を取得
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

    const { data: company, error } = await supabaseAdmin
      .from('companies')
      .select('free_consultation_slots, total_successful_invites')
      .eq('id', companyId)
      .single();

    if (error) {
      console.error('Error fetching consultation slots:', error);
      return NextResponse.json(
        { error: 'Failed to fetch slots' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      freeSlots: company?.free_consultation_slots || 0,
      totalInvites: company?.total_successful_invites || 0,
      maxSlots: 2, // 上限
    });
  } catch (error) {
    console.error('Error in GET /api/consultation/slots:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

