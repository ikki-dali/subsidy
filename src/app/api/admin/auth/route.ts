/**
 * 管理者認証API
 * POST: ログイン
 * DELETE: ログアウト
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import {
  verifyPassword,
  createAdminToken,
  hashPassword,
  getInitialAdminCredentials,
  type AdminRole,
} from '@/lib/admin-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ログイン
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'メールアドレスとパスワードは必須です' },
        { status: 400 }
      );
    }

    // 管理者を検索
    const { data: admin, error: fetchError } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('is_active', true)
      .single();

    // 管理者が見つからない場合、初期管理者かチェック
    if (fetchError || !admin) {
      const initialCreds = await getInitialAdminCredentials();
      
      if (initialCreds && email.toLowerCase() === initialCreds.email.toLowerCase() && password === initialCreds.password) {
        // 初期管理者を作成
        const passwordHash = await hashPassword(password);
        const { data: newAdmin, error: createError } = await supabaseAdmin
          .from('admin_users')
          .insert({
            email: email.toLowerCase(),
            password_hash: passwordHash,
            name: '管理者',
            role: 'super_admin' as AdminRole,
            is_active: true,
          })
          .select()
          .single();

        if (createError || !newAdmin) {
          console.error('Failed to create initial admin:', createError);
          return NextResponse.json(
            { error: 'ログインに失敗しました' },
            { status: 401 }
          );
        }

        // トークン発行
        const token = await createAdminToken({
          adminId: newAdmin.id,
          email: newAdmin.email,
          name: newAdmin.name,
          role: newAdmin.role as AdminRole,
        });

        const response = NextResponse.json({
          success: true,
          admin: {
            id: newAdmin.id,
            email: newAdmin.email,
            name: newAdmin.name,
            role: newAdmin.role,
          },
        });

        response.cookies.set('admin_token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24, // 24時間
          path: '/',
        });

        return response;
      }

      return NextResponse.json(
        { error: 'メールアドレスまたはパスワードが正しくありません' },
        { status: 401 }
      );
    }

    // パスワード検証
    const isValid = await verifyPassword(password, admin.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'メールアドレスまたはパスワードが正しくありません' },
        { status: 401 }
      );
    }

    // 最終ログイン日時を更新
    await supabaseAdmin
      .from('admin_users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', admin.id);

    // トークン発行
    const token = await createAdminToken({
      adminId: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role as AdminRole,
    });

    const response = NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    });

    response.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24時間
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: 'ログイン処理中にエラーが発生しました' },
      { status: 500 }
    );
  }
}

// ログアウト
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  
  response.cookies.set('admin_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  return response;
}

// 現在の管理者情報取得
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // トークンをインポートして検証
    const { verifyAdminToken } = await import('@/lib/admin-auth');
    const payload = await verifyAdminToken(token);
    
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // DBから最新情報を取得
    const { data: admin, error } = await supabaseAdmin
      .from('admin_users')
      .select('id, email, name, role, last_login_at')
      .eq('id', payload.adminId)
      .eq('is_active', true)
      .single();

    if (error || !admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 401 });
    }

    return NextResponse.json({ admin });
  } catch (error) {
    console.error('Get admin error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
