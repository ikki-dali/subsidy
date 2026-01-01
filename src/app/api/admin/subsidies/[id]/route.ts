/**
 * 管理画面補助金詳細・更新API
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabaseAdmin
      .from('subsidies')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Subsidy not found' }, { status: 404 });
    }

    return NextResponse.json({ subsidy: data });
  } catch (error) {
    console.error('Subsidy GET error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// 更新
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // 更新可能なフィールド
    const allowedFields = ['max_amount', 'subsidy_rate', 'is_active', 'ai_dx_featured', 'title', 'description', 'catch_phrase'];
    const updateData: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (field in body) {
        // max_amountは数値に変換
        if (field === 'max_amount') {
          const value = body[field];
          if (value === null || value === '') {
            updateData[field] = null;
          } else {
            const numValue = parseInt(String(value).replace(/,/g, ''), 10);
            if (isNaN(numValue)) {
              return NextResponse.json({ error: 'Invalid max_amount value' }, { status: 400 });
            }
            updateData[field] = numValue;
          }
        } else if (field === 'is_active' || field === 'ai_dx_featured') {
          updateData[field] = Boolean(body[field]);
        } else {
          updateData[field] = body[field];
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('subsidies')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Subsidy update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, subsidy: data });
  } catch (error) {
    console.error('Subsidy PATCH error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
