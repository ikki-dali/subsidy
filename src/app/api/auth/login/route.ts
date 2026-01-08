import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createToken } from '@/lib/auth';
import { checkRateLimit, getRateLimitHeaders, getClientIp } from '@/lib/rate-limit';
import bcrypt from 'bcryptjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  // Rate Limiting
  const ip = getClientIp(request);
  const rateLimit = await checkRateLimit(ip, '/api/auth/login');
  
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
    if (!process.env.JWT_SECRET) {
      return NextResponse.json(
        { error: 'サーバー設定が不足しています（JWT_SECRET）。管理者にお問い合わせください。' },
        { status: 500, headers: getRateLimitHeaders(rateLimit) }
      );
    }
    const body = await request.json();
    const { email, password } = body;

    // バリデーション
    if (!email || !password) {
      return NextResponse.json(
        { error: 'メールアドレスとパスワードを入力してください' },
        { status: 400 }
      );
    }

    // メールアドレスの形式チェック
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: '有効なメールアドレスを入力してください' },
        { status: 400 }
      );
    }

    // パスワード最低要件（登録と合わせる）
    if (typeof password !== 'string' || password.length < 8 || password.length > 200) {
      return NextResponse.json(
        { error: 'メールアドレスまたはパスワードが正しくありません' },
        { status: 401 }
      );
    }

    // Supabaseクライアント作成
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // メールアドレスで会社を検索
    const { data, error } = await supabase
      .from('companies')
      .select('id, name, industry, prefecture, password_hash')
      .eq('email', String(email).toLowerCase())
      .single();

    // ユーザー列挙を防ぐため、存在しない場合も同一メッセージ
    if (error || !data) {
      return NextResponse.json(
        { error: 'メールアドレスまたはパスワードが正しくありません' },
        { status: 401 }
      );
    }

    if (!data.password_hash) {
      // 旧データ（パスワード未設定）など
      return NextResponse.json(
        { error: 'このアカウントはパスワードが未設定です。管理者にお問い合わせください。' },
        { status: 403 }
      );
    }

    const isValidPassword = await bcrypt.compare(password, data.password_hash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'メールアドレスまたはパスワードが正しくありません' },
        { status: 401 }
      );
    }

    // JWTトークンを生成
    const token = await createToken({
      companyId: data.id,
      companyName: data.name,
    });

    const response = NextResponse.json({ 
      success: true, 
      company: {
        id: data.id,
        name: data.name,
      }
    });

    // 署名済みトークンをCookieに保存（7日間有効）
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    // 都道府県と業種を別Cookieに保存
    response.cookies.set('company_prefecture', data.prefecture, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    
    response.cookies.set('company_industry', data.industry, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

