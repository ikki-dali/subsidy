'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { SubsidyCard } from '@/components/features/subsidy-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { History, Trash2, ArrowLeft, Clock } from 'lucide-react';
import { getCookie } from '@/lib/utils';
import type { Subsidy } from '@/types/database';

type HistoryItem = {
  id: string;
  viewed_at: string;
  subsidy_id: string;
  subsidies: Subsidy;
};

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      const companyId = getCookie('company_id');
      if (!companyId) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/history');
        if (response.ok) {
          const data = await response.json();
          setHistory(data.history || []);
        }
      } catch (error) {
        console.error('Failed to fetch history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const handleClearHistory = async () => {
    if (!confirm('閲覧履歴をすべて削除しますか？')) return;

    setIsClearing(true);
    try {
      const response = await fetch('/api/history', { method: 'DELETE' });
      if (response.ok) {
        setHistory([]);
      }
    } catch (error) {
      console.error('Failed to clear history:', error);
    } finally {
      setIsClearing(false);
    }
  };

  const formatViewedAt = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'たった今';
    if (diffMins < 60) return `${diffMins}分前`;
    if (diffHours < 24) return `${diffHours}時間前`;
    if (diffDays < 7) return `${diffDays}日前`;

    return date.toLocaleDateString('ja-JP', {
      month: 'long',
      day: 'numeric',
    });
  };

  const isAuthenticated = getCookie('company_id');

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 pb-20 sm:pb-0">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* ヘッダー */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-purple-100">
                <History className="h-6 w-6 text-purple-600" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                閲覧履歴
              </h1>
            </div>
            <p className="text-muted-foreground">
              最近閲覧した補助金を確認できます
            </p>
          </div>

          {history.length > 0 && (
            <Button
              variant="outline"
              onClick={handleClearHistory}
              disabled={isClearing}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              履歴をクリア
            </Button>
          )}
        </div>

        {/* 未認証の場合 */}
        {!isAuthenticated && !isLoading && (
          <div className="bg-white rounded-2xl shadow-sm border p-8 text-center">
            <History className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-slate-900 mb-2">
              ログインが必要です
            </h2>
            <p className="text-muted-foreground mb-4">
              閲覧履歴を確認するにはログインしてください
            </p>
            <Link href="/onboarding">
              <Button>
                ログイン / 新規登録
              </Button>
            </Link>
          </div>
        )}

        {/* ローディング */}
        {isLoading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-4 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        )}

        {/* 履歴がない場合 */}
        {!isLoading && isAuthenticated && history.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border p-8 text-center">
            <Clock className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-slate-900 mb-2">
              閲覧履歴がありません
            </h2>
            <p className="text-muted-foreground mb-4">
              補助金を閲覧すると、ここに履歴が表示されます
            </p>
            <Link href="/search">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                補助金を探す
              </Button>
            </Link>
          </div>
        )}

        {/* 履歴一覧 */}
        {!isLoading && history.length > 0 && (
          <div className="space-y-6">
            {/* 日付ごとにグループ化 */}
            {history.map((item) => (
              <div key={item.id} className="relative">
                <div className="absolute -left-3 top-4 text-xs text-muted-foreground bg-slate-100 px-2 py-0.5 rounded">
                  {formatViewedAt(item.viewed_at)}
                </div>
                <div className="pl-8 sm:pl-0">
                  <SubsidyCard
                    subsidy={item.subsidies}
                    enableSwipe={false}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}



