'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SubsidyCard } from '@/components/features/subsidy-card';
import { AuthRequiredLink } from '@/components/features/auth-required-link';
import { 
  Sparkles, 
  ArrowRight, 
  Clock, 
  TrendingUp, 
  Zap,
  Flame,
  MapPin,
  Briefcase,
} from 'lucide-react';
import type { Subsidy } from '@/types/database';

type Category = 'all' | 'deadline' | 'popular' | 'new';

// Cookieから値を取得するヘルパー関数
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const part = parts.pop();
    if (part) {
      return decodeURIComponent(part.split(';').shift() || '');
    }
  }
  return null;
}

// 業種コードから日本語名へのマッピング
const INDUSTRY_LABELS: Record<string, string> = {
  manufacturing: '製造業',
  construction: '建設業',
  it: 'IT・情報サービス業',
  retail: '小売業',
  wholesale: '卸売業',
  food: '飲食サービス業',
  hospitality: '宿泊業',
  transport: '運輸業',
  real_estate: '不動産業',
  medical: '医療・福祉',
  education: '教育・学習支援',
  agriculture: '農業',
  other: 'その他',
};

function getIndustryLabel(code: string): string {
  return INDUSTRY_LABELS[code] || code;
}

const categories = [
  { id: 'all' as const, label: 'すべて', icon: Sparkles, color: 'text-yellow-500' },
  { id: 'deadline' as const, label: '締切間近', icon: Clock, color: 'text-red-500' },
  { id: 'popular' as const, label: '人気', icon: Flame, color: 'text-orange-500' },
  { id: 'new' as const, label: '新着', icon: Zap, color: 'text-blue-500' },
];

export function RecommendedSection() {
  const [subsidies, setSubsidies] = useState<Subsidy[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [userPrefecture, setUserPrefecture] = useState<string | null>(null);
  const [userIndustry, setUserIndustry] = useState<string | null>(null);
  const [cookiesLoaded, setCookiesLoaded] = useState(false);

  // 初回ロード時にCookieからユーザーの都道府県と業種を取得
  useEffect(() => {
    const prefecture = getCookie('company_prefecture');
    const industry = getCookie('company_industry');
      setUserPrefecture(prefecture);
    setUserIndustry(industry);
    setCookiesLoaded(true);
  }, []);

  useEffect(() => {
    // Cookieの読み込みが完了するまで待つ
    if (!cookiesLoaded) return;

    const abortController = new AbortController();
    
    const fetchRecommended = async () => {
      setLoading(true);
      try {
        // ユーザーの地域・業種があれば優先的に表示
        const params = new URLSearchParams({
          category: activeCategory,
          limit: '6',
        });
        if (userPrefecture) {
          params.set('area', userPrefecture);
        }
        if (userIndustry) {
          params.set('industry', userIndustry);
        }
        
        const res = await fetch(`/api/subsidies/recommended?${params.toString()}`, {
          signal: abortController.signal,
        });
        if (res.ok) {
          const data = await res.json();
          setSubsidies(data.subsidies);
        }
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') {
          return; // リクエストがキャンセルされた場合は何もしない
        }
        console.error('Fetch error:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommended();

    return () => {
      abortController.abort();
    };
  }, [activeCategory, userPrefecture, userIndustry, cookiesLoaded]);

  if (!loading && subsidies.length === 0 && activeCategory === 'all') {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">おすすめ補助金</h2>
            {userPrefecture && (
              <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                <MapPin className="h-3 w-3 mr-1" />
                {userPrefecture}
              </Badge>
            )}
            {userIndustry && (
              <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs">
                <Briefcase className="h-3 w-3 mr-1" />
                {getIndustryLabel(userIndustry)}
              </Badge>
            )}
          </div>
          <p className="text-slate-600">
            {userPrefecture || userIndustry
              ? `${[userPrefecture, userIndustry ? getIndustryLabel(userIndustry) : null].filter(Boolean).join('・')}向けの注目の補助金` 
              : '今注目の補助金をピックアップ'
            }
          </p>
        </div>
        
        <AuthRequiredLink href="/recommended">
          <Button variant="outline" className="group h-11 px-5">
            すべて見る
            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </AuthRequiredLink>
      </div>

      {/* カテゴリタブ - タッチフレンドリーなサイズ */}
      <div className="flex flex-wrap gap-2 sm:gap-3 mb-6">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <Button
              key={cat.id}
              variant={isActive ? 'default' : 'outline'}
              onClick={() => setActiveCategory(cat.id)}
              className={`
                rounded-full h-11 px-5 text-sm transition-all
                ${isActive 
                  ? 'bg-slate-900 text-white' 
                  : 'bg-white hover:bg-slate-50'
                }
              `}
            >
              <Icon className={`h-4 w-4 mr-1.5 ${isActive ? 'text-white' : cat.color}`} />
              {cat.label}
            </Button>
          );
        })}
      </div>

      {/* カード一覧 */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-5 border rounded-2xl bg-white">
              <div className="flex gap-2 mb-3">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
              <Skeleton className="h-6 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-4" />
              <div className="flex gap-2 mb-4">
                <Skeleton className="h-10 w-28 rounded-lg" />
                <Skeleton className="h-10 w-28 rounded-lg" />
              </div>
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          ))}
        </div>
      ) : subsidies.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border">
          <TrendingUp className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 mb-2">このカテゴリの補助金はありません</p>
          <p className="text-sm text-slate-400">他のカテゴリを選択してください</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {subsidies.map((subsidy) => (
            <SubsidyCard key={subsidy.id} subsidy={subsidy} />
          ))}
        </div>
      )}

      {/* もっと見るリンク */}
      {subsidies.length > 0 && (
        <div className="text-center mt-8">
          <AuthRequiredLink href="/recommended">
            <Button variant="outline" size="lg" className="rounded-full h-12 px-8 text-base">
              もっと見る
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </AuthRequiredLink>
        </div>
      )}
    </div>
  );
}
