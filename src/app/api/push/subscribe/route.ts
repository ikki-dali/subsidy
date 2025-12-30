import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { getCompanyIdFromToken } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// プッシュ通知を購読
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    const companyId = await getCompanyIdFromToken(token);

    if (!companyId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { endpoint, p256dh, auth } = body;

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json(
        { error: 'Missing subscription data' },
        { status: 400 }
      );
    }

    // UPSERT: 既存の購読がある場合は更新、なければ挿入
    const { error } = await supabaseAdmin
      .from('push_subscriptions')
      .upsert(
        {
          company_id: companyId,
          endpoint,
          p256dh,
          auth,
          created_at: new Date().toISOString(),
        },
        {
          onConflict: 'company_id,endpoint',
        }
      );

    if (error) {
      console.error('Error saving push subscription:', error);
      return NextResponse.json(
        { error: 'Failed to save subscription' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in POST /api/push/subscribe:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// プッシュ通知の購読を解除
export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    const companyId = await getCompanyIdFromToken(token);

    if (!companyId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Missing endpoint' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('push_subscriptions')
      .delete()
      .eq('company_id', companyId)
      .eq('endpoint', endpoint);

    if (error) {
      console.error('Error deleting push subscription:', error);
      return NextResponse.json(
        { error: 'Failed to delete subscription' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/push/subscribe:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 購読状態を取得
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    const companyId = await getCompanyIdFromToken(token);

    if (!companyId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('push_subscriptions')
      .select('id, endpoint, created_at')
      .eq('company_id', companyId);

    if (error) {
      console.error('Error fetching push subscriptions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      subscribed: data && data.length > 0,
      subscriptions: data,
    });
  } catch (error) {
    console.error('Error in GET /api/push/subscribe:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


