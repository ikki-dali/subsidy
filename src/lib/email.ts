/**
 * メール送信サービス
 * 
 * Resend APIを使用してメールを送信
 * API keyがない場合はコンソールにログ出力（開発用）
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@hojokin-navi.jp';
const APP_NAME = '補助金ナビ';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export type EmailOptions = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export type SendResult = {
  success: boolean;
  messageId?: string;
  error?: string;
};

/**
 * メール送信
 */
export async function sendEmail(options: EmailOptions): Promise<SendResult> {
  const { to, subject, html, text } = options;
  const isProduction = process.env.NODE_ENV === 'production';

  // API keyがない場合はログ出力のみ
  if (!RESEND_API_KEY) {
    if (isProduction) {
      console.warn('[Email] RESEND_API_KEY is not set. Email sending is disabled.');
      return {
        success: false,
        error: 'RESEND_API_KEY is not set',
      };
    }

    console.log('\n📧 [EMAIL MOCK] Would send email:');
    console.log(`  To: ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Body preview: ${text?.slice(0, 100) || html.slice(0, 100)}...`);
    console.log('  (Set RESEND_API_KEY to actually send emails)\n');
    return {
      success: true,
      messageId: `mock-${Date.now()}`,
    };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${APP_NAME} <${FROM_EMAIL}>`,
        to: [to],
        subject,
        html,
        text,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send email');
    }

    const data = await response.json();
    return {
      success: true,
      messageId: data.id,
    };
  } catch (error) {
    console.error('Email send error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 類似補助金通知メールを送信
 */
export async function sendSimilarSubsidyNotification(params: {
  to: string;
  companyName: string;
  originalSubsidyTitle: string;
  similarSubsidies: Array<{
    id: string;
    title: string;
    maxAmount?: number | null;
    endDate?: string | null;
    matchReasons: string[];
  }>;
}): Promise<SendResult> {
  const { to, companyName, originalSubsidyTitle, similarSubsidies } = params;

  const subsidyListHtml = similarSubsidies.map(subsidy => {
    const amount = subsidy.maxAmount
      ? `最大${formatAmount(subsidy.maxAmount)}`
      : '金額要確認';
    const deadline = subsidy.endDate
      ? `締切: ${formatDate(subsidy.endDate)}`
      : '締切未定';
    const reasons = subsidy.matchReasons.join('、');
    
    return `
      <div style="margin-bottom: 20px; padding: 16px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #3b82f6;">
        <h3 style="margin: 0 0 8px 0; color: #1e293b; font-size: 16px;">
          <a href="${APP_URL}/subsidies/${subsidy.id}" style="color: #2563eb; text-decoration: none;">
            ${escapeHtml(subsidy.title)}
          </a>
        </h3>
        <p style="margin: 0 0 4px 0; color: #64748b; font-size: 14px;">
          ${amount} | ${deadline}
        </p>
        <p style="margin: 0; color: #94a3b8; font-size: 12px;">
          マッチ理由: ${reasons}
        </p>
      </div>
    `;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #334155; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; font-size: 24px; margin: 0;">💰 ${APP_NAME}</h1>
      </div>
      
      <p style="font-size: 16px;">
        ${escapeHtml(companyName)} 様
      </p>
      
      <p style="font-size: 16px;">
        以前ご興味をお持ちいただいた<strong>「${escapeHtml(originalSubsidyTitle)}」</strong>に似た補助金が見つかりました！
      </p>
      
      <div style="margin: 30px 0;">
        <h2 style="font-size: 18px; color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">
          おすすめの補助金
        </h2>
        ${subsidyListHtml}
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${APP_URL}/search" 
           style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
          すべての補助金を見る
        </a>
      </div>
      
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
      
      <p style="font-size: 12px; color: #94a3b8; text-align: center;">
        このメールは${APP_NAME}の通知設定に基づいて送信されています。<br>
        通知設定の変更は<a href="${APP_URL}/settings" style="color: #64748b;">こちら</a>から行えます。
      </p>
    </body>
    </html>
  `;

  const text = `
${companyName} 様

以前ご興味をお持ちいただいた「${originalSubsidyTitle}」に似た補助金が見つかりました！

【おすすめの補助金】
${similarSubsidies.map(s => `・${s.title}\n  ${s.maxAmount ? `最大${formatAmount(s.maxAmount)}` : '金額要確認'}\n  詳細: ${APP_URL}/subsidies/${s.id}`).join('\n\n')}

すべての補助金を見る: ${APP_URL}/search

---
${APP_NAME}
  `.trim();

  return sendEmail({
    to,
    subject: `【${APP_NAME}】ご興味のある補助金に似た案件が見つかりました`,
    html,
    text,
  });
}

/**
 * 金額フォーマット
 */
function formatAmount(amount: number): string {
  if (amount >= 100000000) {
    return `${(amount / 100000000).toFixed(1)}億円`;
  } else if (amount >= 10000) {
    return `${Math.round(amount / 10000).toLocaleString()}万円`;
  }
  return `${amount.toLocaleString()}円`;
}

/**
 * 日付フォーマット
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * HTMLエスケープ
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * 締切アラートメールを送信
 */
export type DeadlineAlertSubsidy = {
  id: string;
  title: string;
  endDate: string;
  daysRemaining: number;
  maxAmount: number | null;
};

export async function sendDeadlineAlertEmail(params: {
  to: string;
  companyName: string;
  contactName: string;
  subsidies: DeadlineAlertSubsidy[];
}): Promise<SendResult> {
  const { to, contactName, subsidies } = params;

  // 締切日が近い順にソート
  const sortedSubsidies = [...subsidies].sort(
    (a, b) => a.daysRemaining - b.daysRemaining
  );

  const subsidyListHtml = sortedSubsidies.map(subsidy => {
    const urgencyColor =
      subsidy.daysRemaining <= 1
        ? '#dc2626'  // red
        : subsidy.daysRemaining <= 3
        ? '#ea580c'  // orange
        : '#ca8a04'; // yellow

    const amount = subsidy.maxAmount
      ? subsidy.maxAmount === -1
        ? '個別相談'
        : `最大${formatAmount(subsidy.maxAmount)}`
      : '金額要確認';

    return `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">
            <a href="${APP_URL}/subsidies/${subsidy.id}" style="color: #2563eb; text-decoration: none;">
              ${escapeHtml(subsidy.title)}
            </a>
          </div>
          <div style="font-size: 14px; color: #6b7280;">
            ${amount}
          </div>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; white-space: nowrap;">
          <span style="display: inline-block; padding: 4px 8px; border-radius: 4px; background-color: ${urgencyColor}; color: white; font-weight: 600; font-size: 14px;">
            あと${subsidy.daysRemaining}日
          </span>
          <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
            ${formatDate(subsidy.endDate)}
          </div>
        </td>
      </tr>
    `;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 24px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">${APP_NAME}</h1>
      </div>

      <div style="background: #ffffff; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="margin-top: 0;">
          ${escapeHtml(contactName)}様
        </p>

        <p>
          お気に入り・閲覧した補助金の中で、<strong>締切が近づいているもの</strong>があります。
        </p>

        <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
          <thead>
            <tr style="background-color: #f9fafb;">
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-weight: 600;">補助金名</th>
              <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-weight: 600;">締切</th>
            </tr>
          </thead>
          <tbody>
            ${subsidyListHtml}
          </tbody>
        </table>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${APP_URL}/favorites" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: 600;">
            お気に入りを確認する
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">

        <p style="font-size: 12px; color: #6b7280; margin-bottom: 0;">
          このメールは${APP_NAME}から自動送信されています。<br>
          通知設定は<a href="${APP_URL}/settings" style="color: #2563eb;">設定ページ</a>から変更できます。
        </p>
      </div>
    </body>
    </html>
  `;

  const text = `
${contactName}様

お気に入り・閲覧した補助金の中で、締切が近づいているものがあります。

━━━━━━━━━━━━━━━━━━━━━━━━━━━

${sortedSubsidies.map(s => {
  const amount = s.maxAmount
    ? s.maxAmount === -1
      ? '個別相談'
      : `最大${formatAmount(s.maxAmount)}`
    : '金額要確認';
  return `【あと${s.daysRemaining}日】${s.title}\n  締切: ${formatDate(s.endDate)}\n  ${amount}\n  ${APP_URL}/subsidies/${s.id}`;
}).join('\n\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━

お気に入りを確認: ${APP_URL}/favorites

---
このメールは${APP_NAME}から自動送信されています。
通知設定: ${APP_URL}/settings
  `.trim();

  return sendEmail({
    to,
    subject: `【締切間近】${sortedSubsidies.length}件の補助金の締切が近づいています`,
    html,
    text,
  });
}

/**
 * Resendの設定状態を確認
 */
export function isEmailConfigured(): boolean {
  return !!RESEND_API_KEY;
}
