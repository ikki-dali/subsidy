import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { checkRateLimit, getRateLimitHeaders, getClientIp } from '@/lib/rate-limit';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * トークンの検証
 * GET /api/auth/reset-password?token=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'トークンが指定されていません' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // トークンを検証
    const { data: resetToken, error } = await supabase
      .from('password_reset_tokens')
      .select('id, company_id, expires_at, used_at')
      .eq('token', token)
      .single();

    if (error || !resetToken) {
      return NextResponse.json(
        { valid: false, error: '無効なトークンです' },
        { status: 400 }
      );
    }

    // 使用済みチェック
    if (resetToken.used_at) {
      return NextResponse.json(
        { valid: false, error: 'このリンクは既に使用されています' },
        { status: 400 }
      );
    }

    // 有効期限チェック
    if (new Date(resetToken.expires_at) < new Date()) {
      return NextResponse.json(
        { valid: false, error: 'このリンクの有効期限が切れています' },
        { status: 400 }
      );
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json(
      { valid: false, error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

/**
 * パスワードリセット実行
 * POST /api/auth/reset-password
 * 
 * リクエストボディ: { token: string, password: string }
 */
export async function POST(request: NextRequest) {
  // Rate Limiting
  const ip = getClientIp(request);
  const rateLimit = await checkRateLimit(ip, '/api/auth/reset-password');

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'リクエストが多すぎます。しばらくしてからお試しください。' },
      {
        status: 429,
        headers: getRateLimitHeaders(rateLimit),
      }
    );
  }

  try {
    const body = await request.json();
    const { token, password } = body;

    // バリデーション
    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'トークンが指定されていません' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'パスワードを入力してください' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'パスワードは8文字以上で入力してください' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // トークンを検証
    const { data: resetToken, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('id, company_id, expires_at, used_at')
      .eq('token', token)
      .single();

    if (tokenError || !resetToken) {
      return NextResponse.json(
        { error: '無効なリンクです。もう一度パスワードリセットをリクエストしてください。' },
        { status: 400 }
      );
    }

    // 使用済みチェック
    if (resetToken.used_at) {
      return NextResponse.json(
        { error: 'このリンクは既に使用されています。もう一度パスワードリセットをリクエストしてください。' },
        { status: 400 }
      );
    }

    // 有効期限チェック
    if (new Date(resetToken.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'このリンクの有効期限が切れています。もう一度パスワードリセットをリクエストしてください。' },
        { status: 400 }
      );
    }

    // パスワードをハッシュ化
    const passwordHash = await bcrypt.hash(password, 12);

    // パスワードを更新
    const { error: updateError } = await supabase
      .from('companies')
      .update({ password_hash: passwordHash })
      .eq('id', resetToken.company_id);

    if (updateError) {
      console.error('Failed to update password:', updateError);
      return NextResponse.json(
        { error: 'パスワードの更新に失敗しました' },
        { status: 500 }
      );
    }

    // トークンを使用済みにする
    await supabase
      .from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', resetToken.id);

    return NextResponse.json({
      success: true,
      message: 'パスワードが正常に更新されました',
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

