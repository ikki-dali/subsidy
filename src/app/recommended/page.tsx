'use client';

import { Fragment, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SubsidyCard } from '@/components/features/subsidy-card';
import { Header } from '@/components/layout/header';
import { Check, Clock, Cpu, Percent, Sparkles, TrendingUp } from 'lucide-react';
import type { Subsidy } from '@/types/database';

type Category = 'ai_dx' | 'all' | 'deadline' | 'popular' | 'new' | 'highrate';

const CATEGORIES: { id: Category; label: string; icon: React.ReactNode; description: string }[] = [
  { id: 'ai_dx', label: 'AI・IT・DX', icon: <Cpu className="h-4 w-4" />, description: 'AI/IT/DX関連の補助金をピックアップ' },
  { id: 'all', label: 'すべて', icon: <Sparkles className="h-4 w-4" />, description: '各カテゴリからピックアップ' },
  { id: 'deadline', label: '締切間近', icon: <Clock className="h-4 w-4" />, description: '申請期限が近い補助金' },
  { id: 'popular', label: '高額補助', icon: <TrendingUp className="h-4 w-4" />, description: '補助上限額が大きい補助金' },
  { id: 'new', label: '新着', icon: <Sparkles className="h-4 w-4" />, description: '最近追加された補助金' },
  { id: 'highrate', label: '高補助率', icon: <Percent className="h-4 w-4" />, description: '補助率が高い補助金' },
];

export default function RecommendedPage() {
  const [category, setCategory] = useState<Category>('ai_dx');
  // category=all のときだけ有効: 募集中のみ表示（デフォルトは募集終了も含む）
  const [activeOnly, setActiveOnly] = useState(false);
  const [subsidies, setSubsidies] = useState<Subsidy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommended = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          category,
          limit: '12',
        });
        if (category === 'all' && activeOnly) {
          params.set('active', 'true');
        }
        const res = await fetch(`/api/subsidies/recommended?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setSubsidies(data.subsidies);
        }
      } catch (e) {
        console.error('Fetch error:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommended();
  }, [category, activeOnly]);

  const currentCategory = CATEGORIES.find(c => c.id === category);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* タイトル */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-yellow-500" />
            おすすめ補助金
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            あなたにぴったりの補助金を見つけましょう
          </p>
        </div>

        {/* カテゴリタブ */}
        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORIES.map((cat) => (
            <Fragment key={cat.id}>
              <Button
                variant={category === cat.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCategory(cat.id)}
                className="flex items-center gap-1"
              >
                {cat.icon}
                {cat.label}
              </Button>

              {/* 「すべて」選択時のみ、募集終了を除外するトグルを表示 */}
              {cat.id === 'all' && category === 'all' && (
                <Button
                  variant={activeOnly ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveOnly((v) => !v)}
                  className={activeOnly ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
                >
                  <Check className={`h-4 w-4 mr-1 ${activeOnly ? 'text-white' : 'text-emerald-600'}`} />
                  募集中
                </Button>
              )}
            </Fragment>
          ))}
        </div>

        {/* カテゴリ説明 */}
        {currentCategory && (
          <p className="text-sm text-muted-foreground mb-4">
            {currentCategory.description}
          </p>
        )}

        {/* 結果一覧 */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="p-4 border rounded-lg bg-white">
                <Skeleton className="h-6 w-20 mb-2" />
                <Skeleton className="h-6 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-10 w-full mt-4" />
              </div>
            ))}
          </div>
        ) : subsidies.length === 0 ? (
          <div className="text-center py-12">
            <Sparkles className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-muted-foreground">
              おすすめの補助金がまだありません。
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              データが蓄積されるとおすすめが表示されます。
            </p>
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
