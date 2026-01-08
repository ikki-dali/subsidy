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
  const rateLimit = await checkRateLimit(ip, '/api/companies');
  
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'リクエストが多すぎます。しばらくしてからお試しください。' },
      { 
        status: 429,
        headers: getRateLimitHeaders(rateLimit),
      }
    );
  }
  
  // JWT_SECRET がない状態で登録すると「DBに登録されたのにログインできない」状態になり得るため、
  // 事前にチェックして早期に落とす（＝重複409の原因を作らない）
  if (!process.env.JWT_SECRET) {
    return NextResponse.json(
      { error: 'サーバー設定が不足しています（JWT_SECRET）。管理者にお問い合わせください。' },
      { status: 500, headers: getRateLimitHeaders(rateLimit) }
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
      // Step 3: 補助金ニーズ
      subsidyExperience,
      subsidyPurposes,
      subsidyPurposeOther,
      // Step 4: 課題
      currentChallenges,
      challengeOther,
      // 招待コード
      inviteCode,
    } = body;

    // バリデーション
    if (!companyName || !industry || !employeeCount || !annualRevenue || !prefecture || !contactName || !email || !phone || !password) {
      return NextResponse.json(
        { error: '必須項目が入力されていません' },
        { status: 400 }
      );
    }

    // Step 3 & 4 のバリデーション（必須）
    if (!subsidyExperience) {
      return NextResponse.json(
        { error: '補助金の利用経験を選択してください' },
        { status: 400 }
      );
    }
    if (!subsidyPurposes || !Array.isArray(subsidyPurposes) || subsidyPurposes.length === 0) {
      return NextResponse.json(
        { error: '補助金の利用用途を1つ以上選択してください' },
        { status: 400 }
      );
    }
    if (!currentChallenges || !Array.isArray(currentChallenges) || currentChallenges.length === 0) {
      return NextResponse.json(
        { error: '現在の課題を1つ以上選択してください' },
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

    // リードスコア計算
    let leadScore = 0;

    // 補助金経験スコア
    if (subsidyExperience === 'experienced_many') leadScore += 20;
    else if (subsidyExperience === 'experienced_few') leadScore += 10;

    // 用途スコア
    if (subsidyPurposes.includes('it_dx')) leadScore += 30;
    if (subsidyPurposes.includes('equipment')) leadScore += 10;
    if (subsidyPurposes.includes('new_business')) leadScore += 10;

    // 課題スコア
    if (currentChallenges.includes('efficiency')) leadScore += 20;
    if (currentChallenges.includes('digitalization')) leadScore += 20;
    if (currentChallenges.includes('labor_shortage')) leadScore += 10;
    if (currentChallenges.includes('productivity')) leadScore += 10;

    // Supabaseクライアント作成（サービスロールキー使用）
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 招待コードの検証と招待元会社ID取得
    let invitedBy: string | null = null;
    if (inviteCode) {
      const { data: invitation } = await supabase
        .from('invitations')
        .select('inviter_company_id')
        .eq('code', inviteCode)
        .eq('status', 'pending')
        .single();

      if (invitation) {
        invitedBy = invitation.inviter_company_id;
      }
    }

    // 会社情報を登録
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
        // Step 3: 補助金ニーズ
        subsidy_experience: subsidyExperience,
        subsidy_purposes: subsidyPurposes,
        subsidy_purpose_other: subsidyPurposeOther || null,
        // Step 4: 課題
        current_challenges: currentChallenges,
        challenge_other: challengeOther || null,
        // リードスコア
        lead_score: leadScore,
        // 招待元
        invited_by: invitedBy,
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

    // 招待コードを使用済みに更新 & 招待者に無料相談枠を付与
    if (inviteCode && invitedBy) {
      await supabase
        .from('invitations')
        .update({
          status: 'used',
          used_by_company_id: data.id,
          used_at: new Date().toISOString(),
        })
        .eq('code', inviteCode);

      // 招待者の招待成功数と無料相談枠を更新
      const { data: inviterData } = await supabase
        .from('companies')
        .select('total_successful_invites, free_consultation_slots')
        .eq('id', invitedBy)
        .single();

      if (inviterData) {
        const newInviteCount = (inviterData.total_successful_invites || 0) + 1;
        // 無料相談枠は上限2回まで
        const currentSlots = inviterData.free_consultation_slots || 0;
        const newSlots = Math.min(currentSlots + 1, 2);

        await supabase
          .from('companies')
          .update({
            total_successful_invites: newInviteCount,
            free_consultation_slots: newSlots,
          })
          .eq('id', invitedBy);
      }
    }

    // JWTトークンを生成（失敗したら登録済みレコードを巻き戻す）
    let token: string;
    try {
      token = await createToken({
        companyId: data.id,
        companyName: data.name,
      });
    } catch (e) {
      console.error('Failed to create auth token after company insert:', e);
      try {
        await supabase.from('companies').delete().eq('id', data.id);
      } catch (rollbackError) {
        console.error('Failed to rollback company insert:', rollbackError);
      }
      return NextResponse.json(
        { error: 'サーバー設定が不足しています。しばらくしてから再度お試しください。' },
        { status: 500 }
      );
    }

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
