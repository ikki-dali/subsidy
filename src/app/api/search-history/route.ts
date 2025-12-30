import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { getCompanyIdFromToken } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 検索履歴を取得
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

    // 検索履歴を取得（最新10件、重複キーワードを除去）
    const { data, error } = await supabaseAdmin
      .from('search_history')
      .select('id, keyword, filters, searched_at')
      .eq('company_id', companyId)
      .order('searched_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching search history:', error);
      return NextResponse.json(
        { error: 'Failed to fetch search history' },
        { status: 500 }
      );
    }

    // 重複するキーワードを除去（最新のものを優先）
    const uniqueKeywords = new Set<string>();
    const uniqueHistory = data?.filter((item) => {
      if (uniqueKeywords.has(item.keyword)) {
        return false;
      }
      uniqueKeywords.add(item.keyword);
      return true;
    }).slice(0, 10);

    return NextResponse.json({ history: uniqueHistory });
  } catch (error) {
    console.error('Error in GET /api/search-history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 検索履歴を保存
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
    const { keyword, filters } = body;

    if (!keyword || keyword.trim() === '') {
      return NextResponse.json(
        { error: 'keyword is required' },
        { status: 400 }
      );
    }

    // 検索履歴を保存
    const { error } = await supabaseAdmin
      .from('search_history')
      .insert({
        company_id: companyId,
        keyword: keyword.trim(),
        filters: filters || null,
        searched_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error saving search history:', error);
      return NextResponse.json(
        { error: 'Failed to save search history' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in POST /api/search-history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 検索履歴を削除（特定のIDまたは全削除）
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

    const { searchParams } = new URL(request.url);
    const historyId = searchParams.get('id');

    if (historyId) {
      // 特定の履歴を削除
      const { error } = await supabaseAdmin
        .from('search_history')
        .delete()
        .eq('id', historyId)
        .eq('company_id', companyId);

      if (error) {
        console.error('Error deleting search history:', error);
        return NextResponse.json(
          { error: 'Failed to delete search history' },
          { status: 500 }
        );
      }
    } else {
      // 全履歴を削除
      const { error } = await supabaseAdmin
        .from('search_history')
        .delete()
        .eq('company_id', companyId);

      if (error) {
        console.error('Error clearing search history:', error);
        return NextResponse.json(
          { error: 'Failed to clear search history' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/search-history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


