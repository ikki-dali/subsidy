// 補助金詳細取得API

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { checkRateLimit, getRateLimitHeaders, getClientIp } from '@/lib/rate-limit';
import { getCachedSubsidyDetail } from '@/lib/cache';

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  // Rate Limiting（公開API）
  const ip = getClientIp(request);
  const rateLimit = await checkRateLimit(ip, request.nextUrl.pathname);
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
    // キャッシュ付きでデータを取得
    const data = await getCachedSubsidyDetail(id, async () => {
      const { data, error } = await supabase
        .from('subsidies')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { __notFound: true };
        }
        console.error('Supabase error:', error);
        throw error;
      }

      return data;
    });

    // 404チェック
    if (data && typeof data === 'object' && '__notFound' in data) {
      return NextResponse.json({ error: '補助金が見つかりません' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error('API error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
