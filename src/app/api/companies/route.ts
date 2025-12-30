import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createToken, getCompanyIdFromToken } from '@/lib/auth';
import { checkRateLimit, getRateLimitHeaders, getClientIp } from '@/lib/rate-limit';
import bcrypt from 'bcryptjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  // Rate Limiting
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(ip, '/api/companies');
  
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

    const {
      companyName,
      industry,
      employeeCount,
      annualRevenue,
      prefecture,
      contactName,
      email,
      phone,
      password,
    } = body;

    // バリデーション
    if (!companyName || !industry || !employeeCount || !annualRevenue || !prefecture || !contactName || !email || !phone || !password) {
      return NextResponse.json(
        { error: '必須項目が入力されていません' },
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

    const normalizedEmail = String(email).toLowerCase();

    // 入力値の長さ制限
    if (companyName.length > 200 || contactName.length > 100 || email.length > 254) {
      return NextResponse.json(
        { error: '入力値が長すぎます' },
        { status: 400 }
      );
    }

    // パスワードの最低要件
    if (typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { error: 'パスワードは8文字以上で入力してください' },
        { status: 400 }
      );
    }
    if (password.length > 200) {
      return NextResponse.json(
        { error: 'パスワードが長すぎます' },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Supabaseクライアント作成（サービスロールキー使用）
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 会社情報を登録
    // NOTE: phoneカラムはDBに追加が必要
    // ALTER TABLE companies ADD COLUMN IF NOT EXISTS phone TEXT;
    const { data, error } = await supabase
      .from('companies')
      .insert({
        name: companyName,
        industry,
        employee_count: employeeCount,
        annual_revenue: annualRevenue,
        prefecture,
        contact_name: contactName,
        email: normalizedEmail,
        phone,
        password_hash: passwordHash,
      })
      .select()
      .single();

    if (error) {
      // 重複メールアドレスの場合
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'このメールアドレスは既に登録されています' },
          { status: 409 }
        );
      }
      console.error('Database error:', error);
      return NextResponse.json(
        { error: '登録に失敗しました' },
        { status: 500 }
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

    // 都道府県と業種を別Cookieに保存（クライアントで読み取り可能）
    response.cookies.set('company_prefecture', prefecture, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
    
    response.cookies.set('company_industry', industry, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Cookieからトークンを取得
    const token = request.cookies.get('auth_token')?.value;
    const companyId = await getCompanyIdFromToken(token);

    if (!companyId) {
      return NextResponse.json(
        { authenticated: false },
        { status: 200 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 会社情報を取得
    const { data, error } = await supabase
      .from('companies')
      .select('id, name, industry, employee_count, prefecture')
      .eq('id', companyId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { authenticated: false },
        { status: 200 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      company: data,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
