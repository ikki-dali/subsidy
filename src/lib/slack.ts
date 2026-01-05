const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

type SlackMessage = {
  text?: string;
  blocks?: SlackBlock[];
};

type SlackBlock = {
  type: string;
  text?: {
    type: string;
    text: string;
    emoji?: boolean;
  };
  fields?: {
    type: string;
    text: string;
  }[];
  elements?: {
    type: string;
    text: string;
  }[];
};

// Slackにメッセージを送信
export async function sendSlackNotification(message: SlackMessage): Promise<boolean> {
  if (!SLACK_WEBHOOK_URL) {
    console.warn('Slack webhook URL not configured');
    return false;
  }

  try {
    const response = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      console.error('Slack notification failed:', response.status);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending Slack notification:', error);
    return false;
  }
}

// 相談予約の通知を送信
export async function notifyNewConsultationBooking(params: {
  companyName: string;
  contactName?: string;
  contactPhone?: string;
  date: string;
  startTime: string;
  consultationTopic?: string;
  meetLink?: string;
  isFree: boolean;
}): Promise<boolean> {
  const {
    companyName,
    contactName,
    contactPhone,
    date,
    startTime,
    consultationTopic,
    meetLink,
    isFree,
  } = params;

  // 日付をフォーマット
  const dateObj = new Date(date);
  const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][dateObj.getDay()];
  const formattedDate = `${dateObj.getFullYear()}年${dateObj.getMonth() + 1}月${dateObj.getDate()}日(${dayOfWeek})`;

  const message: SlackMessage = {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🗓️ 新しい相談予約が入りました',
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*会社名:*\n${companyName}`,
          },
          {
            type: 'mrkdwn',
            text: `*担当者:*\n${contactName || '未入力'}`,
          },
          {
            type: 'mrkdwn',
            text: `*日時:*\n${formattedDate} ${startTime}〜`,
          },
          {
            type: 'mrkdwn',
            text: `*種別:*\n${isFree ? '🎟️ 無料枠利用' : '💰 有料'}`,
          },
        ],
      },
      ...(contactPhone
        ? [
            {
              type: 'section' as const,
              fields: [
                {
                  type: 'mrkdwn' as const,
                  text: `*電話番号:*\n${contactPhone}`,
                },
              ],
            },
          ]
        : []),
      ...(consultationTopic
        ? [
            {
              type: 'section' as const,
              text: {
                type: 'mrkdwn' as const,
                text: `*相談内容:*\n${consultationTopic}`,
              },
            },
          ]
        : []),
      ...(meetLink
        ? [
            {
              type: 'section' as const,
              text: {
                type: 'mrkdwn' as const,
                text: `*Google Meet:*\n<${meetLink}|ミーティングに参加>`,
              },
            },
          ]
        : []),
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `予約時刻: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}`,
          },
        ],
      },
    ],
  };

  return sendSlackNotification(message);
}

// 予約キャンセルの通知
export async function notifyConsultationCancellation(params: {
  companyName: string;
  date: string;
  startTime: string;
}): Promise<boolean> {
  const { companyName, date, startTime } = params;

  const dateObj = new Date(date);
  const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][dateObj.getDay()];
  const formattedDate = `${dateObj.getFullYear()}年${dateObj.getMonth() + 1}月${dateObj.getDate()}日(${dayOfWeek})`;

  const message: SlackMessage = {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '❌ 相談予約がキャンセルされました',
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*会社名:*\n${companyName}`,
          },
          {
            type: 'mrkdwn',
            text: `*日時:*\n${formattedDate} ${startTime}〜`,
          },
        ],
      },
    ],
  };

  return sendSlackNotification(message);
}

