import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

type Props = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: Props) {
  const { id: subsidyId } = await params;
  const limit = 4;

  try {
    // 1. 現在の補助金の情報を取得
    const { data: currentSubsidy, error: subsidyError } = await supabaseAdmin
      .from('subsidies')
      .select('target_area, industry')
      .eq('id', subsidyId)
      .single();

    if (subsidyError || !currentSubsidy) {
      return NextResponse.json({ error: 'Subsidy not found' }, { status: 404 });
    }

    // 2. この補助金を閲覧したユーザーが見た他の補助金を取得（協調フィルタリング）
    const { data: viewerHistory } = await supabaseAdmin
      .from('browsing_history')
      .select('company_id')
      .eq('subsidy_id', subsidyId);

    let relatedSubsidies: { id: string; title: string; target_area: string[] | null; max_amount: number | null; end_date: string | null; view_count?: number }[] = [];

    if (viewerHistory && viewerHistory.length > 0) {
      const companyIds = viewerHistory.map(h => h.company_id);

      // これらのユーザーが見た他の補助金を集計
      const { data: otherViews } = await supabaseAdmin
        .from('browsing_history')
        .select('subsidy_id, subsidies!inner(id, title, target_area, max_amount, end_date, is_active)')
        .in('company_id', companyIds)
        .neq('subsidy_id', subsidyId);

      if (otherViews && otherViews.length > 0) {
        // 閲覧回数でカウント
        const subsidyCounts = new Map<string, { subsidy: typeof otherViews[0]['subsidies']; count: number }>();
        
        for (const view of otherViews) {
          const subsidy = view.subsidies;
          if (!subsidy || !(subsidy as { is_active?: boolean }).is_active) continue;
          
          const existing = subsidyCounts.get(view.subsidy_id);
          if (existing) {
            existing.count++;
          } else {
            subsidyCounts.set(view.subsidy_id, { subsidy, count: 1 });
          }
        }

        // カウント順にソートして取得
        relatedSubsidies = Array.from(subsidyCounts.entries())
          .sort((a, b) => b[1].count - a[1].count)
          .slice(0, limit)
          .map(([, { subsidy, count }]) => ({
            id: (subsidy as { id: string }).id,
            title: (subsidy as { title: string }).title,
            target_area: (subsidy as { target_area: string[] | null }).target_area,
            max_amount: (subsidy as { max_amount: number | null }).max_amount,
            end_date: (subsidy as { end_date: string | null }).end_date,
            view_count: count,
          }));
      }
    }

    // 3. 閲覧履歴ベースで十分なデータがない場合、属性ベースでフォールバック
    if (relatedSubsidies.length < limit) {
      const existingIds = relatedSubsidies.map(s => s.id);
      existingIds.push(subsidyId);

      let query = supabaseAdmin
        .from('subsidies')
        .select('id, title, target_area, max_amount, end_date')
        .eq('is_active', true)
        .not('id', 'in', `(${existingIds.join(',')})`)
        .limit(limit - relatedSubsidies.length);

      // 同じ地域を優先
      if (currentSubsidy.target_area && currentSubsidy.target_area.length > 0) {
        query = query.overlaps('target_area', currentSubsidy.target_area);
      }

      // 同じ業種を優先
      if (currentSubsidy.industry && currentSubsidy.industry.length > 0) {
        query = query.overlaps('industry', currentSubsidy.industry);
      }

      const { data: attributeBasedSubsidies } = await query.order('end_date', { ascending: true });

      if (attributeBasedSubsidies) {
        relatedSubsidies = [
          ...relatedSubsidies,
          ...attributeBasedSubsidies.map(s => ({
            ...s,
            view_count: undefined,
          })),
        ];
      }
    }

    // 4. それでも足りない場合は、単純に募集中の補助金を追加
    if (relatedSubsidies.length < limit) {
      const existingIds = relatedSubsidies.map(s => s.id);
      existingIds.push(subsidyId);

      const { data: fallbackSubsidies } = await supabaseAdmin
        .from('subsidies')
        .select('id, title, target_area, max_amount, end_date')
        .eq('is_active', true)
        .not('id', 'in', `(${existingIds.join(',')})`)
        .order('end_date', { ascending: true })
        .limit(limit - relatedSubsidies.length);

      if (fallbackSubsidies) {
        relatedSubsidies = [
          ...relatedSubsidies,
          ...fallbackSubsidies.map(s => ({
            ...s,
            view_count: undefined,
          })),
        ];
      }
    }

    // 閲覧履歴ベースのデータがあるかどうかを返す
    const hasViewerData = relatedSubsidies.some(s => s.view_count !== undefined);

    return NextResponse.json({
      subsidies: relatedSubsidies,
      source: hasViewerData ? 'collaborative' : 'content-based',
    });
  } catch (error) {
    console.error('Error fetching related subsidies:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

