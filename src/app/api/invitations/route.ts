import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { getCompanyIdFromToken } from '@/lib/auth';
import { randomBytes } from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 招待コード生成（8文字、URL-safe）
function generateInviteCode(): string {
  return randomBytes(6).toString('base64url').slice(0, 8);
}

// 招待リンク一覧を取得
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: invitations, error } = await (supabaseAdmin as any)
      .from('invitations')
      .select(`
        id,
        code,
        status,
        invited_email,
        expires_at,
        created_at,
        used_at,
        used_by_company_id
      `)
      .eq('inviter_company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching invitations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch invitations' },
        { status: 500 }
      );
    }

    // 使用された招待の企業名を取得
    const usedInvitations = invitations?.filter((inv: { used_by_company_id: string | null }) => inv.used_by_company_id) || [];
    const companyIds = usedInvitations.map((inv: { used_by_company_id: string }) => inv.used_by_company_id);
    
    let companiesMap: Record<string, string> = {};
    if (companyIds.length > 0) {
      const { data: companies } = await supabaseAdmin
        .from('companies')
        .select('id, name')
        .in('id', companyIds);
      
      companiesMap = (companies || []).reduce((acc: Record<string, string>, c: { id: string; name: string }) => {
        acc[c.id] = c.name;
        return acc;
      }, {});
    }

    // レスポンスに企業名を追加
    const enrichedInvitations = (invitations || []).map((inv: {
      id: string;
      code: string;
      status: string;
      invited_email: string | null;
      expires_at: string;
      created_at: string;
      used_at: string | null;
      used_by_company_id: string | null;
    }) => ({
      ...inv,
      used_by_company_name: inv.used_by_company_id ? companiesMap[inv.used_by_company_id] : null,
    }));

    return NextResponse.json({ invitations: enrichedInvitations });
  } catch (error) {
    console.error('Error in GET /api/invitations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 新しい招待リンクを作成
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

    const body = await request.json().catch(() => ({}));
    const { email } = body as { email?: string };

    // 招待コードを生成
    const code = generateInviteCode();
    
    // 有効期限は30日後
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: invitation, error } = await (supabaseAdmin as any)
      .from('invitations')
      .insert({
        code,
        inviter_company_id: companyId,
        invited_email: email || null,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating invitation:', error);
      return NextResponse.json(
        { error: 'Failed to create invitation' },
        { status: 500 }
      );
    }

    // 招待URLを生成
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const inviteUrl = `${baseUrl}/onboarding?invite=${code}`;

    return NextResponse.json({
      invitation: {
        ...invitation,
        inviteUrl,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/invitations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
