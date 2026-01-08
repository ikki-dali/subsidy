import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCompanyIdFromToken } from '@/lib/auth';
import { checkRateLimit, getRateLimitHeaders, getClientIp } from '@/lib/rate-limit';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
const appBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';

/**
 * Slackメッセージ用にテキストをサニタイズ
 */
function sanitizeForSlack(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .slice(0, 1000); // 最大1000文字
}

function sanitizeUrlForSlack(url?: string | null): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return undefined;
    }
    return parsed.toString();
  } catch {
    return undefined;
  }
}

/**
 * Slack通知を送信
 */
async function sendSlackNotification(data: {
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  subsidyTitle: string;
  subsidyUrl: string;
  note?: string;
  type?: 'interested' | 'notify_similar';
}) {
  if (!slackWebhookUrl) {
    console.warn('SLACK_WEBHOOK_URL is not configured');
    return;
  }

  // 入力値をサニタイズ
  const sanitized = {
    companyName: sanitizeForSlack(data.companyName),
    contactName: sanitizeForSlack(data.contactName),
    email: sanitizeForSlack(data.email),
    phone: data.phone ? sanitizeForSlack(data.phone) : undefined,
    subsidyTitle: sanitizeForSlack(data.subsidyTitle),
    note: data.note ? sanitizeForSlack(data.note) : undefined,
  };
  const safeUrl = sanitizeUrlForSlack(data.subsidyUrl) || (appBaseUrl ? `${appBaseUrl}/` : '/');

  const isNotifySimilar = data.type === 'notify_similar';
  const headerText = isNotifySimilar 
    ? '🔔 類似案件の通知リクエスト' 
    : '🔔 新しい補助金相談リクエスト';
  
  const message = {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: headerText,
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*会社名*\n${sanitized.companyName}`,
          },
          {
            type: 'mrkdwn',
            text: `*担当者*\n${sanitized.contactName}`,
          },
        ],
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*メールアドレス*\n${sanitized.email}`,
          },
          {
            type: 'mrkdwn',
            text: `*電話番号*\n${sanitized.phone || '未登録'}`,
          },
        ],
      },
      {
        type: 'divider',
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*興味のある補助金*\n<${safeUrl}|${sanitized.subsidyTitle}>`,
        },
      },
      ...(sanitized.note
        ? [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*コメント*\n${sanitized.note}`,
              },
            },
          ]
        : []),
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `送信日時: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}`,
          },
        ],
      },
    ],
  };

  try {
    const response = await fetch(slackWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      console.error('Slack notification failed:', response.statusText);
    }
  } catch (error) {
    console.error('Slack notification error:', error);
  }
}

/**
 * 補助金への興味を登録
 */
export async function POST(request: NextRequest) {
  // Rate Limiting
  const ip = getClientIp(request);
  const rateLimit = await checkRateLimit(ip, '/api/interests');
  
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
    const { subsidyId, subsidyTitle, subsidyUrl, note, type = 'interested' } = body;
    const safeSubsidyUrl =
      sanitizeUrlForSlack(subsidyUrl) ||
      (appBaseUrl ? `${appBaseUrl}/subsidies/${subsidyId}` : undefined);

    // JWTトークンから会社IDを取得
    const token = request.cookies.get('auth_token')?.value;
    const companyId = await getCompanyIdFromToken(token);

    if (!companyId) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    if (!subsidyId || !subsidyTitle) {
      return NextResponse.json(
        { error: '補助金情報が不足しています' },
        { status: 400 }
      );
    }

    // noteの長さ制限
    if (note && note.length > 2000) {
      return NextResponse.json(
        { error: 'コメントは2000文字以内で入力してください' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 会社情報を取得
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('name, contact_name, email, phone')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      return NextResponse.json(
        { error: '会社情報が見つかりません' },
        { status: 404 }
      );
    }

    // 興味を登録（upsert）
    // typeは'interested'または'notify_similar'
    const status = type === 'notify_similar' ? 'notify_similar' : 'interested';
    const { data, error } = await supabase
      .from('company_interests')
      .upsert(
        {
          company_id: companyId,
          subsidy_id: subsidyId,
          note: note || null,
          status,
        },
        {
          onConflict: 'company_id,subsidy_id',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: '登録に失敗しました' },
        { status: 500 }
      );
    }

    // Slack通知を送信
    await sendSlackNotification({
      companyName: company.name,
      contactName: company.contact_name,
      email: company.email,
      phone: company.phone,
      subsidyTitle,
      subsidyUrl: safeSubsidyUrl || '',
      note,
      type: status as 'interested' | 'notify_similar',
    });

    return NextResponse.json({
      success: true,
      interest: data,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

/**
 * ユーザーの興味リストを取得
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    const companyId = await getCompanyIdFromToken(token);

    if (!companyId) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 興味リストを取得
    const { data, error } = await supabase
      .from('company_interests')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'データの取得に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      interests: data,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

/**
 * 興味を削除
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subsidyId = searchParams.get('subsidyId');
    const type = searchParams.get('type'); // オプション: 'notify_similar' の場合のみ該当typeを削除
    const token = request.cookies.get('auth_token')?.value;
    const companyId = await getCompanyIdFromToken(token);

    if (!companyId) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    if (!subsidyId) {
      return NextResponse.json(
        { error: '補助金IDが必要です' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let query = supabase
      .from('company_interests')
      .delete()
      .eq('company_id', companyId)
      .eq('subsidy_id', subsidyId);
    
    // typeが指定されている場合は、そのstatusのみ削除
    if (type) {
      query = query.eq('status', type);
    }

    const { error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: '削除に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
