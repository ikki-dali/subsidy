import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';
import { sendEmail } from '@/lib/email';
import { checkRateLimit, getRateLimitHeaders, getClientIp } from '@/lib/rate-limit';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * パスワードリセットリクエスト
 * POST /api/auth/reset-password/request
 * 
 * リクエストボディ: { email: string }
 * 
 * ※セキュリティ上、メールアドレスが存在しない場合も成功レスポンスを返す
 */
export async function POST(request: NextRequest) {
  // Rate Limiting
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(ip, '/api/auth/reset-password/request');

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
    const { email } = body;

    // バリデーション
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'メールアドレスを入力してください' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // メールアドレスの形式チェック
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json(
        { error: '有効なメールアドレスを入力してください' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 会社を検索（存在しない場合も同じレスポンスを返す）
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name, contact_name, email')
      .eq('email', normalizedEmail)
      .single();

    // セキュリティ上、メールアドレスの存在有無を漏らさない
    if (companyError || !company) {
      console.log(`Password reset requested for non-existent email: ${normalizedEmail}`);
      // 成功したように見せる
      return NextResponse.json({
        success: true,
        message: 'メールアドレスが登録されている場合、リセットメールを送信しました',
      });
    }

    // 既存の未使用トークンを無効化
    await supabase
      .from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('company_id', company.id)
      .is('used_at', null);

    // 新しいトークンを生成（URLセーフなランダム文字列）
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1時間後

    // トークンをDBに保存
    const { error: insertError } = await supabase
      .from('password_reset_tokens')
      .insert({
        company_id: company.id,
        token,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error('Failed to create reset token:', insertError);
      return NextResponse.json(
        { error: 'リセットメールの送信に失敗しました' },
        { status: 500 }
      );
    }

    // リセットメールを送信
    const resetUrl = `${APP_URL}/reset-password?token=${token}`;
    const emailResult = await sendPasswordResetEmail({
      to: company.email,
      contactName: company.contact_name || company.name,
      resetUrl,
    });

    if (!emailResult.success) {
      console.error('Failed to send reset email:', emailResult.error);
      // メール送信に失敗してもトークンは有効なまま（ログで確認可能）
    }

    return NextResponse.json({
      success: true,
      message: 'メールアドレスが登録されている場合、リセットメールを送信しました',
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

/**
 * パスワードリセットメールを送信
 */
async function sendPasswordResetEmail(params: {
  to: string;
  contactName: string;
  resetUrl: string;
}) {
  const { to, contactName, resetUrl } = params;
  const APP_NAME = '補助金ナビ';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #334155; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; font-size: 24px; margin: 0;">🔐 ${APP_NAME}</h1>
      </div>
      
      <p style="font-size: 16px;">
        ${escapeHtml(contactName)} 様
      </p>
      
      <p style="font-size: 16px;">
        パスワードリセットのリクエストを受け付けました。<br>
        以下のボタンをクリックして、新しいパスワードを設定してください。
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" 
           style="display: inline-block; background: #2563eb; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
          パスワードをリセットする
        </a>
      </div>
      
      <p style="font-size: 14px; color: #64748b;">
        ※このリンクは<strong>1時間</strong>有効です。<br>
        ※心当たりがない場合は、このメールを無視してください。
      </p>
      
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
      
      <p style="font-size: 12px; color: #94a3b8; text-align: center;">
        このメールは${APP_NAME}から自動送信されています。<br>
        ボタンがクリックできない場合は、以下のURLをブラウザにコピーしてください：<br>
        <span style="word-break: break-all;">${resetUrl}</span>
      </p>
    </body>
    </html>
  `;

  const text = `
${contactName} 様

パスワードリセットのリクエストを受け付けました。
以下のURLにアクセスして、新しいパスワードを設定してください。

${resetUrl}

※このリンクは1時間有効です。
※心当たりがない場合は、このメールを無視してください。

---
${APP_NAME}
  `.trim();

  return sendEmail({
    to,
    subject: `【${APP_NAME}】パスワードリセットのご案内`,
    html,
    text,
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

