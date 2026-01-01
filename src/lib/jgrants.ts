// JグランツAPI連携

import type { JGrantsSubsidy, JGrantsListResponse, JGrantsDetailResponse } from '@/types/jgrants';

const JGRANTS_BASE_URL = 'https://api.jgrants-portal.go.jp/exp/v1/public';

type FetchSubsidiesParams = {
  acceptance?: 0 | 1;  // 1=募集中のみ
  keyword?: string;
  area?: string;
};

// 募集中の補助金一覧を取得
export async function fetchSubsidies(params: FetchSubsidiesParams = {}): Promise<JGrantsSubsidy[]> {
  const request = {
    acceptance: params.acceptance ?? 1,
    ...(params.keyword && { keyword: params.keyword }),
    ...(params.area && { area: params.area }),
  };

  const url = new URL(`${JGRANTS_BASE_URL}/subsidies`);
  url.searchParams.set('request', JSON.stringify(request));

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`JグランツAPI error: ${res.status}`);
  }

  const data: JGrantsListResponse = await res.json();
  return data.result || [];
}

// 補助金詳細を取得
export async function fetchSubsidyDetail(id: string): Promise<JGrantsSubsidy | null> {
  const res = await fetch(`${JGRANTS_BASE_URL}/subsidies/id/${id}`);
  if (!res.ok) {
    throw new Error(`JグランツAPI error: ${res.status}`);
  }

  const data: JGrantsDetailResponse = await res.json();
  return data.result?.[0] || null;
}

// 業種文字列を配列に変換
export function parseIndustry(industry?: string): string[] {
  if (!industry) return [];
  return industry.split('/').map(s => s.trim()).filter(Boolean);
}

// 金額フォーマット（負の値や0は「金額未定」）
export function formatCurrency(amount?: number | null): string {
  if (!amount || amount <= 0) return '金額未定';
  if (amount >= 100000000) return `${(amount / 100000000).toFixed(1)}億円`;
  if (amount >= 10000) return `${(amount / 10000).toFixed(0)}万円`;
  return `${amount.toLocaleString()}円`;
}

// 残り日数計算
export function getDaysRemaining(endDate?: string | null): number | null {
  if (!endDate) return null;
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// 締切ステータス
export function getDeadlineStatus(days: number | null): 'urgent' | 'soon' | 'normal' | 'closed' | 'ongoing' {
  if (days === null) return 'ongoing'; // 締切日なし = 随時募集
  if (days < 0) return 'closed';
  if (days <= 7) return 'urgent';
  if (days <= 30) return 'soon';
  return 'normal';
}
