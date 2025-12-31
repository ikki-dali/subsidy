import { createClient } from '@supabase/supabase-js';

type FavoriteRow = {
  company_id: string;
  subsidy_id: string;
  created_at: string;
};

function mustGetEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is required`);
  return v;
}

function sanitizeForSlack(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .slice(0, 1000);
}

function formatJst(date: Date): string {
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function floorToHourUtc(date: Date): Date {
  const d = new Date(date);
  d.setUTCMinutes(0, 0, 0);
  return d;
}

async function sendSlackWebhook(webhookUrl: string, payload: unknown) {
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Slack webhook failed: ${res.status} ${res.statusText} ${text}`);
  }
}

async function main() {
  const supabaseUrl = mustGetEnv('NEXT_PUBLIC_SUPABASE_URL');
  const supabaseServiceKey = mustGetEnv('SUPABASE_SERVICE_ROLE_KEY');
  const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    '';

  if (!slackWebhookUrl) {
    console.warn('SLACK_WEBHOOK_URL is not set. Skip sending favorites summary.');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // 前の1時間（UTCで「時刻の切れ目」を揃える）
  const end = floorToHourUtc(new Date());
  const start = new Date(end.getTime() - 60 * 60 * 1000);

  const { data: favorites, error } = await supabase
    .from('company_favorites')
    .select('company_id, subsidy_id, created_at')
    .gte('created_at', start.toISOString())
    .lt('created_at', end.toISOString());

  if (error) {
    throw new Error(`Failed to fetch favorites: ${error.message}`);
  }

  const rows: FavoriteRow[] = (favorites || []) as FavoriteRow[];
  const total = rows.length;

  // 0件のときは通知しない（ノイズを避ける）
  if (total === 0) {
    console.log(`No favorites in window: ${start.toISOString()} - ${end.toISOString()}`);
    return;
  }

  const uniqueCompanies = new Set(rows.map((r) => r.company_id)).size;

  const countsBySubsidy = new Map<string, number>();
  for (const r of rows) {
    countsBySubsidy.set(r.subsidy_id, (countsBySubsidy.get(r.subsidy_id) || 0) + 1);
  }

  const topSubsidies = [...countsBySubsidy.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const topIds = topSubsidies.map(([id]) => id);
  const titleById: Record<string, string> = {};
  if (topIds.length > 0) {
    const { data: subsidies, error: subError } = await supabase
      .from('subsidies')
      .select('id, title')
      .in('id', topIds);

    if (!subError) {
      for (const s of subsidies || []) {
        const id = (s as any).id as string;
        const title = (s as any).title as string | undefined;
        if (id && title) titleById[id] = title;
      }
    }
  }

  const windowText = `${formatJst(start)} 〜 ${formatJst(end)}（JST）`;

  const topLines = topSubsidies
    .map(([id, count]) => {
      const title = sanitizeForSlack(titleById[id] || id);
      const url = appUrl ? `${appUrl.replace(/\/$/, '')}/subsidies/${id}` : '';
      const link = url ? `<${url}|${title}>` : title;
      return `• ${link}：${count}件`;
    })
    .join('\n');

  const payload = {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '⭐️ お気に入り追加サマリー（直近1時間）',
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*追加数*\n${total}件` },
          { type: 'mrkdwn', text: `*企業数*\n${uniqueCompanies}社` },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*対象期間*\n${windowText}`,
        },
      },
      ...(topLines
        ? [
            { type: 'divider' },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*上位補助金（最大5件）*\n${topLines}`,
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

  await sendSlackWebhook(slackWebhookUrl, payload);
  console.log(`Sent favorites summary: total=${total}, companies=${uniqueCompanies}, window=${start.toISOString()}-${end.toISOString()}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


