/**
 * お気に入りAPI
 * GET: 現在のユーザーのお気に入り一覧を取得
 * POST: お気に入りに追加
 * DELETE: お気に入りから削除
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { getCompanyIdFromToken } from '@/lib/auth';

// お気に入り一覧を取得
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    const companyId = await getCompanyIdFromToken(token);

    if (!companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: favorites, error } = await supabaseAdmin
      .from('company_favorites')
      .select('subsidy_id, created_at')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Favorites fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // subsidy_idの配列を返す
    return NextResponse.json({
      favorites: favorites?.map(f => f.subsidy_id) || [],
    });
  } catch (error) {
    console.error('Favorites GET error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// お気に入りに追加
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    const companyId = await getCompanyIdFromToken(token);

    if (!companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subsidyId } = body;

    if (!subsidyId) {
      return NextResponse.json({ error: 'subsidyId is required' }, { status: 400 });
    }

    // 既に存在するかチェック（upsertの代わり）
    const { data: existing } = await supabaseAdmin
      .from('company_favorites')
      .select('id')
      .eq('company_id', companyId)
      .eq('subsidy_id', subsidyId)
      .single();

    if (existing) {
      // 既に存在する場合は成功として返す
      return NextResponse.json({ success: true, message: 'Already favorited' });
    }

    const { error } = await supabaseAdmin
      .from('company_favorites')
      .insert({
        company_id: companyId,
        subsidy_id: subsidyId,
      });

    if (error) {
      console.error('Favorite add error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Favorites POST error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// お気に入りから削除
export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    const companyId = await getCompanyIdFromToken(token);

    if (!companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const subsidyId = searchParams.get('subsidyId');

    if (!subsidyId) {
      return NextResponse.json({ error: 'subsidyId is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('company_favorites')
      .delete()
      .eq('company_id', companyId)
      .eq('subsidy_id', subsidyId);

    if (error) {
      console.error('Favorite remove error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Favorites DELETE error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
