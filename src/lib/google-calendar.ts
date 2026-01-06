import { google, calendar_v3 } from 'googleapis';

// 環境変数から認証情報を取得
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const GOOGLE_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary';

// 相談の設定
const CONSULTATION_DURATION_MINUTES = 30; // ユーザーに見せる時間
const CALENDAR_BLOCK_MINUTES = 60; // カレンダーにブロックする時間（バッファ込み）
const BUSINESS_HOURS = { start: 10, end: 18 }; // 平日 10:00-18:00

// Google Calendar APIクライアントを作成
function getCalendarClient(): calendar_v3.Calendar | null {
  if (!GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY) {
    console.warn('Google Calendar credentials not configured');
    return null;
  }

  const auth = new google.auth.JWT({
    email: GOOGLE_CLIENT_EMAIL,
    key: GOOGLE_PRIVATE_KEY,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });

  return google.calendar({ version: 'v3', auth });
}

// 日付が平日かどうかをチェック
function isWeekday(date: Date): boolean {
  const day = date.getDay();
  return day !== 0 && day !== 6; // 0=日曜, 6=土曜
}

// 指定日の空き枠を取得
export async function getAvailableSlots(
  date: string, // YYYY-MM-DD形式
  calendarId: string = GOOGLE_CALENDAR_ID
): Promise<{ start: string; end: string }[]> {
  const calendar = getCalendarClient();
  
  if (!calendar) {
    // カレンダー未設定の場合はモック空き枠を返す（開発用）
    return getMockSlots(date);
  }

  const targetDate = new Date(date);
  
  // 平日チェック
  if (!isWeekday(targetDate)) {
    return [];
  }

  // 過去の日付チェック
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (targetDate < today) {
    return [];
  }

  // その日の開始と終了時刻（JST）
  const timeMin = new Date(date);
  timeMin.setHours(BUSINESS_HOURS.start, 0, 0, 0);
  
  const timeMax = new Date(date);
  timeMax.setHours(BUSINESS_HOURS.end, 0, 0, 0);

  try {
    // FreeBusy APIで予定を取得
    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        timeZone: 'Asia/Tokyo',
        items: [{ id: calendarId }],
      },
    });

    const busySlots = response.data.calendars?.[calendarId]?.busy || [];

    // 空き枠を計算
    const availableSlots: { start: string; end: string }[] = [];
    
    // 1時間ごとにスロットをチェック（バッファ込みなので1時間間隔）
    for (let hour = BUSINESS_HOURS.start; hour < BUSINESS_HOURS.end; hour++) {
      const slotStart = new Date(date);
      slotStart.setHours(hour, 0, 0, 0);
      
      const slotEnd = new Date(date);
      slotEnd.setHours(hour + 1, 0, 0, 0); // バッファ込みで1時間

      // 今日の場合、現在時刻より後のスロットのみ
      const now = new Date();
      if (targetDate.toDateString() === now.toDateString() && slotStart <= now) {
        continue;
      }

      // 予定と重複しているかチェック
      const isOverlapping = busySlots.some((busy) => {
        const busyStart = new Date(busy.start!);
        const busyEnd = new Date(busy.end!);
        return slotStart < busyEnd && slotEnd > busyStart;
      });

      if (!isOverlapping) {
        availableSlots.push({
          start: `${hour.toString().padStart(2, '0')}:00`,
          end: `${hour.toString().padStart(2, '0')}:${CONSULTATION_DURATION_MINUTES}`,
        });
      }
    }

    return availableSlots;
  } catch (error) {
    console.error('Error fetching calendar availability:', error);
    // エラー時はモックスロットを返す（カレンダー連携失敗時のフォールバック）
    return getMockSlots(date);
  }
}

// 予約をカレンダーに作成（Google Meet付き）
export async function createCalendarEvent(params: {
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  companyName: string;
  contactName?: string;
  consultationTopic?: string;
  calendarId?: string;
}): Promise<{
  eventId: string;
  meetLink: string;
  startTime: Date;
  endTime: Date;
} | null> {
  const calendar = getCalendarClient();
  
  if (!calendar) {
    console.warn('Google Calendar not configured, skipping event creation');
    return null;
  }

  const { date, startTime, companyName, contactName, consultationTopic, calendarId = GOOGLE_CALENDAR_ID } = params;

  // 開始・終了時刻を計算
  const [hour, minute] = startTime.split(':').map(Number);
  
  const startDateTime = new Date(date);
  startDateTime.setHours(hour, minute, 0, 0);
  
  const endDateTime = new Date(date);
  endDateTime.setHours(hour + 1, minute, 0, 0); // バッファ込みで1時間ブロック

  const summary = `【補助金相談】${companyName}${contactName ? ` - ${contactName}様` : ''}`;
  const description = `
補助金ナビからの相談予約

会社名: ${companyName}
${contactName ? `担当者: ${contactName}` : ''}
${consultationTopic ? `\n相談内容:\n${consultationTopic}` : ''}

---
相談時間: ${CONSULTATION_DURATION_MINUTES}分
（カレンダーには${CALENDAR_BLOCK_MINUTES}分でブロックしています）
  `.trim();

  try {
    const response = await calendar.events.insert({
      calendarId,
      conferenceDataVersion: 1, // Google Meet生成に必要
      requestBody: {
        summary,
        description,
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: 'Asia/Tokyo',
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: 'Asia/Tokyo',
        },
        conferenceData: {
          createRequest: {
            requestId: `consultation-${Date.now()}`,
            conferenceSolutionKey: {
              type: 'hangoutsMeet',
            },
          },
        },
      },
    });

    const event = response.data;
    const meetLink = event.conferenceData?.entryPoints?.find(
      (ep) => ep.entryPointType === 'video'
    )?.uri || '';

    return {
      eventId: event.id!,
      meetLink,
      startTime: startDateTime,
      endTime: endDateTime,
    };
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return null;
  }
}

// カレンダーイベントを削除（キャンセル時）
export async function deleteCalendarEvent(
  eventId: string,
  calendarId: string = GOOGLE_CALENDAR_ID
): Promise<boolean> {
  const calendar = getCalendarClient();
  
  if (!calendar) {
    return false;
  }

  try {
    await calendar.events.delete({
      calendarId,
      eventId,
    });
    return true;
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    return false;
  }
}

// 開発用モック空き枠
function getMockSlots(date: string): { start: string; end: string }[] {
  const targetDate = new Date(date);
  
  if (!isWeekday(targetDate)) {
    return [];
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (targetDate < today) {
    return [];
  }

  const slots: { start: string; end: string }[] = [];
  for (let hour = BUSINESS_HOURS.start; hour < BUSINESS_HOURS.end; hour++) {
    // 今日の場合、現在時刻より後のスロットのみ
    const now = new Date();
    if (targetDate.toDateString() === now.toDateString()) {
      if (hour <= now.getHours()) {
        continue;
      }
    }
    
    slots.push({
      start: `${hour.toString().padStart(2, '0')}:00`,
      end: `${hour.toString().padStart(2, '0')}:30`,
    });
  }
  
  return slots;
}

// エクスポート用の定数
export const CONSULTATION_CONFIG = {
  durationMinutes: CONSULTATION_DURATION_MINUTES,
  blockMinutes: CALENDAR_BLOCK_MINUTES,
  businessHours: BUSINESS_HOURS,
};

