import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * ログアウトAPI
 * DELETE: ログアウト（auth_tokenクッキーを削除）
 */
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  
  // auth_tokenクッキーを削除
  response.cookies.set('auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0, // 即座に期限切れ
  });
  
  return response;
}

// POSTでも対応（フォームからの送信用）
export async function POST() {
  return DELETE();
}


