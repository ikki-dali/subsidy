import { NextResponse } from 'next/server';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const jwtSecret = process.env.JWT_SECRET;

  // 環境変数チェック
  if (!supabaseUrl || !supabaseKey || !jwtSecret) {
    return NextResponse.json({
      status: 'error',
      message: 'Supabase環境変数が設定されていません',
      env: {
        NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? 'set' : 'missing',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseKey ? 'set' : 'missing',
        JWT_SECRET: jwtSecret ? 'set' : 'missing',
      },
    }, { status: 500 });
  }

  try {
    // 動的インポートで環境変数が設定されている場合のみ実行
    const { supabaseAdmin } = await import('@/lib/supabase-server');

    // subsidies テーブルのカウント取得
    const { count, error } = await supabaseAdmin
      .from('subsidies')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return NextResponse.json({
        status: 'error',
        message: error.message,
        code: error.code,
      }, { status: 500 });
    }

    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      subsidies_count: count ?? 0,
      env: {
        JWT_SECRET: 'set',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      status: 'error',
      message: `Database connection failed: ${message}`,
    }, { status: 500 });
  }
}
