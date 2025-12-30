// 補助金詳細取得API

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { checkRateLimit, getRateLimitHeaders, getClientIp } from '@/lib/rate-limit';

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  // Rate Limiting（公開API）
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(ip, request.nextUrl.pathname);
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
    const { data, error } = await supabase
      .from('subsidies')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: '補助金が見つかりません' }, { status: 404 });
      }
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error('API error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
