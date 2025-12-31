'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Bell,
  FileText,
  AlertCircle,
  ArrowRight,
  Building2,
  Clock,
} from 'lucide-react';

type Stats = {
  totalClients: number;
  newClientsToday: number;
  unreadInterests: number;
  totalInterests: number;
  subsidiesWithoutAmount: number;
  totalSubsidies: number;
};

type RecentInterest = {
  id: string;
  company_name: string;
  subsidy_title: string;
  created_at: string;
  read_at: string | null;
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentInterests, setRecentInterests] = useState<RecentInterest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const AUTO_REFRESH_MS = 5000;
    let cancelled = false;
    let inFlight = false;

    async function fetchDashboardData() {
      if (inFlight) return;
      inFlight = true;
      try {
        const [statsRes, interestsRes] = await Promise.all([
          fetch('/api/admin/stats', { cache: 'no-store' }),
          fetch('/api/admin/interests?limit=5', { cache: 'no-store' }),
        ]);

        if (statsRes.ok) {
          const data = await statsRes.json();
          if (!cancelled) setStats(data.stats);
        }

        if (interestsRes.ok) {
          const data = await interestsRes.json();
          if (!cancelled) setRecentInterests(data.interests || []);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        if (!cancelled) setLoading(false);
        inFlight = false;
      }
    }

    fetchDashboardData();

    const intervalId = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      fetchDashboardData();
    }, AUTO_REFRESH_MS);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* ページヘッダー */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">ダッシュボード</h1>
        <p className="text-slate-600 mt-1">補助金ナビの管理概要</p>
      </div>

      {/* 統計カード */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              登録クライアント
            </CardTitle>
            <Users className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {loading ? '...' : stats?.totalClients?.toLocaleString() ?? 0}
            </div>
            {stats?.newClientsToday ? (
              <p className="text-xs text-green-600 mt-1">
                +{stats.newClientsToday} 今日
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              未対応リクエスト
            </CardTitle>
            <Bell className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {loading ? '...' : stats?.unreadInterests?.toLocaleString() ?? 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              / {stats?.totalInterests?.toLocaleString() ?? 0} 件
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              金額未入力
            </CardTitle>
            <AlertCircle className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {loading ? '...' : stats?.subsidiesWithoutAmount?.toLocaleString() ?? 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              / {stats?.totalSubsidies?.toLocaleString() ?? 0} 件
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              総補助金数
            </CardTitle>
            <FileText className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {loading ? '...' : stats?.totalSubsidies?.toLocaleString() ?? 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 最新リクエスト */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            最新の「気になる」リクエスト
          </CardTitle>
          <Link href="/admin/interests">
            <Button variant="ghost" size="sm">
              すべて見る
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-500">読み込み中...</div>
          ) : recentInterests.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              リクエストはまだありません
            </div>
          ) : (
            <div className="space-y-3">
              {recentInterests.map((interest) => (
                <div
                  key={interest.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {!interest.read_at && (
                      <Badge className="bg-orange-500">未読</Badge>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-slate-400" />
                        <span className="font-medium">{interest.company_name}</span>
                      </div>
                      <p className="text-sm text-slate-600 mt-0.5 line-clamp-1">
                        {interest.subsidy_title}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Clock className="h-4 w-4" />
                    {formatDate(interest.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* クイックアクション */}
      <div className="grid md:grid-cols-3 gap-4">
        <Link href="/admin/interests">
          <Card className="hover:border-blue-300 hover:shadow-md transition-all cursor-pointer h-full">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-orange-100">
                  <Bell className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold">リクエスト管理</h3>
                  <p className="text-sm text-slate-500">「気になる」リクエストを確認</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/clients">
          <Card className="hover:border-blue-300 hover:shadow-md transition-all cursor-pointer h-full">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-blue-100">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">クライアント管理</h3>
                  <p className="text-sm text-slate-500">登録企業の一覧と詳細</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/subsidies?filter=no_amount">
          <Card className="hover:border-blue-300 hover:shadow-md transition-all cursor-pointer h-full">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-red-100">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold">金額未入力の補助金</h3>
                  <p className="text-sm text-slate-500">手動で金額を入力</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
