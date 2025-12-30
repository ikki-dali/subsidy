'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { SubsidyCard } from '@/components/features/subsidy-card';
import { Header } from '@/components/layout/header';
import { useFavorites } from '@/lib/use-favorites';
import { PushNotificationToggle } from '@/components/features/push-notification-toggle';
import { Heart } from 'lucide-react';
import type { Subsidy } from '@/types/database';

export default function FavoritesPage() {
  const { favorites, isLoaded } = useFavorites();
  const [subsidies, setSubsidies] = useState<Subsidy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    const fetchFavorites = async () => {
      if (favorites.length === 0) {
        setSubsidies([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // 各お気に入りの補助金情報を取得
        const results = await Promise.all(
          favorites.map(async (id) => {
            try {
              const res = await fetch(`/api/subsidies/${id}`);
              if (!res.ok) return null;
              return res.json();
            } catch {
              return null;
            }
          })
        );

        setSubsidies(results.filter((s): s is Subsidy => s !== null));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [favorites, isLoaded]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Heart className="h-6 w-6 text-red-500" />
              お気に入り
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isLoaded && `${favorites.length}件の補助金を保存中`}
            </p>
          </div>
          
          {/* プッシュ通知設定 */}
          <div className="w-full sm:w-auto sm:min-w-[280px]">
            <PushNotificationToggle />
          </div>
        </div>

        {!isLoaded || loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 border rounded-lg bg-white">
                <Skeleton className="h-6 w-20 mb-2" />
                <Skeleton className="h-6 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-10 w-full mt-4" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
          </div>
        ) : subsidies.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-muted-foreground">
              お気に入りに登録した補助金はありません。
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              検索結果から気になる補助金をお気に入りに追加しましょう。
            </p>
            <Link
              href="/search"
              className="inline-block mt-4 text-blue-600 hover:underline"
            >
              補助金を検索する
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subsidies.map((subsidy) => (
              <SubsidyCard key={subsidy.id} subsidy={subsidy} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
