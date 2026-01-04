import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 招待コードを検証
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { valid: false, error: 'Invitation code is required' },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: invitation, error } = await (supabaseAdmin as any)
      .from('invitations')
      .select(`
        id,
        code,
        status,
        expires_at,
        inviter_company_id
      `)
      .eq('code', code)
      .single();

    if (error || !invitation) {
      return NextResponse.json({
        valid: false,
        error: '招待コードが見つかりません',
      });
    }

    // ステータスチェック
    if (invitation.status === 'used') {
      return NextResponse.json({
        valid: false,
        error: 'この招待コードは既に使用されています',
      });
    }

    if (invitation.status === 'cancelled') {
      return NextResponse.json({
        valid: false,
        error: 'この招待コードはキャンセルされています',
      });
    }

    // 有効期限チェック
    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);
    if (now > expiresAt) {
      // ステータスを更新
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabaseAdmin as any)
        .from('invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id);

      return NextResponse.json({
        valid: false,
        error: 'この招待コードは有効期限が切れています',
      });
    }

    // 招待者の企業名を取得
    const { data: inviterCompany } = await supabaseAdmin
      .from('companies')
      .select('name')
      .eq('id', invitation.inviter_company_id)
      .single();

    return NextResponse.json({
      valid: true,
      inviterCompanyName: inviterCompany?.name || null,
    });
  } catch (error) {
    console.error('Error in GET /api/invitations/validate:', error);
    return NextResponse.json(
      { valid: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
