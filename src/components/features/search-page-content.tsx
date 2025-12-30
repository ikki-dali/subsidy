'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { SubsidyCard } from '@/components/features/subsidy-card';
import { Header } from '@/components/layout/header';
import { MobileFilterSheet } from '@/components/features/mobile-filter-sheet';
import { 
  Search, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  SlidersHorizontal,
  MapPin,
  Building2,
  Banknote,
  Clock,
  TrendingUp,
  Filter,
  LayoutGrid,
  List,
  History,
} from 'lucide-react';
import type { Subsidy } from '@/types/database';

type SearchHistoryItem = {
  id: string;
  keyword: string;
  searched_at: string;
};

// 都道府県リスト
const PREFECTURES = [
  '全国', '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県',
  '岐阜県', '静岡県', '愛知県', '三重県',
  '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県',
  '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県',
  '福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
];

// 業種リスト（tag-industries.tsのカテゴリと一致）
const INDUSTRIES = [
  '全業種',
  '製造業',
  '小売業',
  '飲食業',
  'サービス業',
  'IT・情報通信',
  '建設業',
  '農林水産業',
  '医療・福祉',
  '観光・宿泊',
  '運輸・物流',
];

// 金額範囲リスト
const AMOUNT_RANGES = [
  { label: 'すべて', min: undefined, max: undefined },
  { label: '〜100万円', min: undefined, max: 1000000 },
  { label: '100万円〜500万円', min: 1000000, max: 5000000 },
  { label: '500万円〜1000万円', min: 5000000, max: 10000000 },
  { label: '1000万円〜5000万円', min: 10000000, max: 50000000 },
  { label: '5000万円〜1億円', min: 50000000, max: 100000000 },
  { label: '1億円以上', min: 100000000, max: undefined },
];

// ソートオプション
const SORT_OPTIONS = [
  { value: 'deadline', label: '締切日が近い順' },
  { value: 'amount_desc', label: '金額が高い順' },
  { value: 'amount_asc', label: '金額が低い順' },
  { value: 'newest', label: '新着順' },
];

type SearchResponse = {
  subsidies: Subsidy[];
  total: number;
  limit: number;
  offset: number;
};

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

export function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Cookie読み込み完了フラグ
  const [initialized, setInitialized] = useState(false);

  // 検索条件（URLパラメータがなければCookieから取得）
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [area, setArea] = useState(searchParams.get('area') || '');
  const [industry, setIndustry] = useState(searchParams.get('industry') || '');
  const [amountRange, setAmountRange] = useState(searchParams.get('amount') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'deadline');
  const [activeOnly, setActiveOnly] = useState(searchParams.get('active') !== 'false');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));
  const [userPrefecture, setUserPrefecture] = useState<string | null>(null);
  
  // UI状態
  const [showFilters, setShowFilters] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // 検索履歴サジェスト
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // 結果
  const [results, setResults] = useState<Subsidy[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const limit = 12;

  // 初回ロード時にCookieからユーザーの都道府県を取得
  useEffect(() => {
    const prefecture = getCookie('company_prefecture');
    if (prefecture) {
      setUserPrefecture(prefecture);
      // URLパラメータに地域指定がなければ、ユーザーの都道府県をデフォルトに
      if (!searchParams.get('area')) {
        setArea(prefecture);
      }
    }
    setInitialized(true);
  }, [searchParams]);

  // 検索履歴を取得
  useEffect(() => {
    const fetchSearchHistory = async () => {
      const companyId = getCookie('company_id');
      if (!companyId) return;

      try {
        const res = await fetch('/api/search-history');
        if (res.ok) {
          const data = await res.json();
          setSearchHistory(data.history || []);
        }
      } catch (error) {
        console.error('Failed to fetch search history:', error);
      }
    };

    fetchSearchHistory();
  }, []);

  // サジェストの外側クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 検索履歴を保存
  const saveSearchHistory = async (searchKeyword: string) => {
    const companyId = getCookie('company_id');
    if (!companyId || !searchKeyword.trim()) return;

    try {
      await fetch('/api/search-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: searchKeyword,
          filters: { area, industry, amountRange },
        }),
      });
      // 履歴を更新
      const res = await fetch('/api/search-history');
      if (res.ok) {
        const data = await res.json();
        setSearchHistory(data.history || []);
      }
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  };

  // 検索履歴を削除
  const deleteSearchHistory = async (historyId: string) => {
    try {
      await fetch(`/api/search-history?id=${historyId}`, { method: 'DELETE' });
      setSearchHistory((prev) => prev.filter((item) => item.id !== historyId));
    } catch (error) {
      console.error('Failed to delete search history:', error);
    }
  };

  // 検索実行
  const executeSearch = useCallback(async () => {
    if (!initialized) return; // 初期化完了まで待機

    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (keyword) params.set('keyword', keyword);
    if (area && area !== '全国') params.set('area', area);
    if (industry) params.set('industry', industry);
    if (activeOnly) params.set('active', 'true');
    if (sortBy) params.set('sort', sortBy);
    
    // 金額範囲
    if (amountRange) {
      const range = AMOUNT_RANGES.find((r) => r.label === amountRange);
      if (range) {
        if (range.min) params.set('minAmount', range.min.toString());
        if (range.max) params.set('maxAmount', range.max.toString());
      }
    }
    
    params.set('limit', limit.toString());
    params.set('offset', ((page - 1) * limit).toString());

    try {
      const res = await fetch(`/api/subsidies?${params.toString()}`);
      if (!res.ok) throw new Error('検索に失敗しました');

      const data: SearchResponse = await res.json();
      setResults(data.subsidies);
      setTotal(data.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : '検索に失敗しました');
      setResults([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [keyword, area, industry, amountRange, sortBy, activeOnly, page, initialized]);

  // 初回・条件変更時に検索
  useEffect(() => {
    executeSearch();
  }, [executeSearch]);

  // URL更新
  const updateUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (keyword) params.set('keyword', keyword);
    if (area) params.set('area', area);
    if (industry) params.set('industry', industry);
    if (amountRange) params.set('amount', amountRange);
    if (sortBy !== 'deadline') params.set('sort', sortBy);
    if (!activeOnly) params.set('active', 'false');
    if (page > 1) params.set('page', page.toString());

    const queryString = params.toString();
    router.push(`/search${queryString ? `?${queryString}` : ''}`, { scroll: false });
  }, [keyword, area, industry, amountRange, sortBy, activeOnly, page, router]);

  // 検索ボタン押下
  const handleSearch = () => {
    setPage(1);
    updateUrl();
    setShowSuggestions(false);
    // 検索履歴を保存
    if (keyword.trim()) {
      saveSearchHistory(keyword);
    }
  };

  // サジェストからキーワードを選択
  const selectSuggestion = (suggestedKeyword: string) => {
    setKeyword(suggestedKeyword);
    setShowSuggestions(false);
    // すぐに検索実行
    setTimeout(() => {
      setPage(1);
      updateUrl();
    }, 0);
  };

  // フィルタークリア
  const clearFilters = () => {
    setKeyword('');
    setArea('');
    setIndustry('');
    setAmountRange('');
    setSortBy('deadline');
    setActiveOnly(true);
    setPage(1);
    router.push('/search');
  };

  const totalPages = Math.ceil(total / limit);
  const hasFilters = keyword || area || industry || amountRange || !activeOnly;
  
  // アクティブなフィルター数
  const activeFilterCount = [
    keyword,
    area && area !== '全国' ? area : null,
    industry,
    amountRange,
    !activeOnly,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 overflow-x-hidden">
      {/* ヘッダー */}
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* メイン検索エリア */}
        <div className="bg-white rounded-2xl shadow-lg border p-4 sm:p-6 mb-6">
          {/* 検索バー */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="キーワードを入力（例：IT導入、設備投資、人材育成）"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onFocus={() => searchHistory.length > 0 && setShowSuggestions(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearch();
                  if (e.key === 'Escape') setShowSuggestions(false);
                }}
                className="pl-10 h-12 text-base rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500"
              />
              
              {/* 検索履歴サジェスト */}
              {showSuggestions && searchHistory.length > 0 && (
                <div 
                  ref={suggestionsRef}
                  className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden"
                >
                  <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                      <History className="h-3.5 w-3.5" />
                      最近の検索
                    </span>
                    <button
                      onClick={() => setShowSuggestions(false)}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      閉じる
                    </button>
                  </div>
                  <ul className="max-h-60 overflow-y-auto">
                    {searchHistory.map((item) => (
                      <li key={item.id} className="group">
                        <div className="flex items-center justify-between px-3 py-2.5 hover:bg-slate-50 cursor-pointer">
                          <button
                            className="flex-1 text-left text-sm text-slate-700 flex items-center gap-2"
                            onClick={() => selectSuggestion(item.keyword)}
                          >
                            <Search className="h-4 w-4 text-slate-400" />
                            {item.keyword}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSearchHistory(item.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded transition-opacity"
                          >
                            <X className="h-3.5 w-3.5 text-slate-400" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <Button 
                onClick={handleSearch} 
                className="flex-1 sm:flex-none h-12 px-4 sm:px-8 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-sm sm:text-base"
              >
                <Search className="h-5 w-5 sm:mr-2" />
                <span className="hidden sm:inline">検索</span>
              </Button>
              {/* モバイルフィルターボタン */}
              <Button 
                variant="outline" 
                onClick={() => setMobileFilterOpen(true)}
                className={`flex-1 sm:hidden h-12 px-4 rounded-xl text-sm ${activeFilterCount > 0 ? 'bg-blue-50 border-blue-200' : ''}`}
              >
                <SlidersHorizontal className="h-5 w-5" />
                {activeFilterCount > 0 && (
                  <Badge className="ml-2 bg-blue-600 text-xs">{activeFilterCount}</Badge>
                )}
              </Button>
              {/* デスクトップフィルターボタン */}
              <Button 
                variant="outline" 
                onClick={() => setShowFilters(!showFilters)}
                className={`hidden sm:flex h-12 px-4 rounded-xl text-base ${showFilters ? 'bg-blue-50 border-blue-200' : ''}`}
              >
                <SlidersHorizontal className="h-5 w-5 mr-2" />
                フィルター
                {activeFilterCount > 0 && (
                  <Badge className="ml-2 bg-blue-600 text-xs">{activeFilterCount}</Badge>
                )}
              </Button>
            </div>
          </div>

          {/* 拡張フィルター */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 地域 */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-green-600" />
                    対象地域
                    {userPrefecture && area === userPrefecture && (
                      <Badge className="text-[10px] bg-green-100 text-green-700 border-green-200">あなたの地域</Badge>
                    )}
                  </Label>
                  <Select value={area} onValueChange={setArea}>
                    <SelectTrigger className="rounded-lg">
                      <SelectValue placeholder="すべての地域" />
                    </SelectTrigger>
                    <SelectContent>
                      {userPrefecture && (
                        <SelectItem value={userPrefecture} className="font-medium text-green-700 bg-green-50">
                          ⭐ {userPrefecture}（あなたの地域）
                        </SelectItem>
                      )}
                      {PREFECTURES.filter(p => p !== userPrefecture).map((pref) => (
                        <SelectItem key={pref} value={pref}>
                          {pref}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 業種 */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-orange-600" />
                    対象業種
                  </Label>
                  <Select value={industry} onValueChange={setIndustry}>
                    <SelectTrigger className="rounded-lg">
                      <SelectValue placeholder="すべての業種" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map((ind) => (
                        <SelectItem key={ind} value={ind}>
                          {ind}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 金額範囲 */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Banknote className="h-4 w-4 text-blue-600" />
                    補助金額
                  </Label>
                  <Select value={amountRange} onValueChange={setAmountRange}>
                    <SelectTrigger className="rounded-lg">
                      <SelectValue placeholder="すべての金額" />
                    </SelectTrigger>
                    <SelectContent>
                      {AMOUNT_RANGES.map((range) => (
                        <SelectItem key={range.label} value={range.label}>
                          {range.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* ソート */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                    並び替え
                  </Label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SORT_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 追加オプション */}
              <div className="flex flex-wrap items-center gap-6 mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <Switch
                    id="active-only"
                    checked={activeOnly}
                    onCheckedChange={setActiveOnly}
                  />
                  <Label htmlFor="active-only" className="text-sm cursor-pointer flex items-center gap-2">
                    <Clock className="h-4 w-4 text-emerald-600" />
                    募集中のみ表示
                  </Label>
                </div>

                {hasFilters && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearFilters}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4 mr-1" />
                    フィルターをクリア
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 結果ヘッダー */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <div className="text-sm text-muted-foreground">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin inline-block h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></span>
                  検索中...
                </span>
              ) : error ? (
                <span className="text-red-600">{error}</span>
              ) : (
                <>
                  <span className="font-semibold text-foreground text-base sm:text-lg">{total.toLocaleString()}</span>
                  <span className="ml-1">件の補助金</span>
                </>
              )}
            </div>
            
            {/* アクティブフィルターバッジ */}
            {!loading && hasFilters && (
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {keyword && (
                  <Badge variant="secondary" className="bg-slate-100 text-xs">
                    <Filter className="h-3 w-3 mr-1" />
                    {keyword.length > 10 ? keyword.slice(0, 10) + '...' : keyword}
                  </Badge>
                )}
                {area && area !== '全国' && (
                  <Badge variant="secondary" className="bg-green-50 text-green-700 text-xs">
                    <MapPin className="h-3 w-3 mr-1" />
                    {area}
                  </Badge>
                )}
                {industry && (
                  <Badge variant="secondary" className="bg-orange-50 text-orange-700 text-xs">
                    <Building2 className="h-3 w-3 mr-1" />
                    {industry.length > 8 ? industry.slice(0, 8) + '...' : industry}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* 表示切替 */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode('grid')}
              className={viewMode === 'grid' ? 'bg-slate-100' : ''}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'bg-slate-100' : ''}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 結果一覧 */}
        {loading ? (
          <div className={`grid gap-4 ${viewMode === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="p-4 border rounded-xl bg-white">
                <Skeleton className="h-6 w-24 mb-3" />
                <Skeleton className="h-6 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-4" />
                <div className="flex gap-2 mb-4">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
              <Search className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              補助金が見つかりませんでした
            </h3>
            <p className="text-muted-foreground mb-4">
              検索条件を変更してお試しください
            </p>
            <Button variant="outline" onClick={clearFilters}>
              フィルターをクリア
            </Button>
          </div>
        ) : (
          <div className={`grid gap-4 ${viewMode === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {results.map((subsidy) => (
              <SubsidyCard 
                key={subsidy.id} 
                subsidy={subsidy} 
                variant={viewMode === 'list' ? 'compact' : 'default'}
              />
            ))}
          </div>
        )}

        {/* ページネーション */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 sm:gap-4 mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-slate-200">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => {
                setPage((p) => p - 1);
                updateUrl();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="rounded-lg h-11 sm:h-10 px-3 sm:px-4 text-sm"
            >
              <ChevronLeft className="h-5 w-5 sm:mr-1" />
              <span className="hidden sm:inline">前へ</span>
            </Button>
            
            <div className="flex items-center gap-1 sm:gap-2">
              {/* ページ番号 - モバイルでは3つ、デスクトップでは5つ表示 */}
              {Array.from({ length: Math.min(typeof window !== 'undefined' && window.innerWidth < 640 ? 3 : 5, totalPages) }, (_, i) => {
                const maxPages = 5;
                let pageNum;
                if (totalPages <= maxPages) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - maxPages + 1 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? 'default' : 'ghost'}
                    size="icon"
                    onClick={() => {
                      setPage(pageNum);
                      updateUrl();
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`w-10 h-10 sm:w-10 sm:h-10 rounded-lg text-sm ${page === pageNum ? 'bg-blue-600' : ''}`}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              disabled={page === totalPages}
              onClick={() => {
                setPage((p) => p + 1);
                updateUrl();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="rounded-lg h-11 sm:h-10 px-3 sm:px-4 text-sm"
            >
              <span className="hidden sm:inline">次へ</span>
              <ChevronRight className="h-5 w-5 sm:ml-1" />
            </Button>
          </div>
        )}
      </div>

      {/* モバイル用フィルターシート */}
      <MobileFilterSheet
        open={mobileFilterOpen}
        onOpenChange={setMobileFilterOpen}
        area={area}
        setArea={setArea}
        industry={industry}
        setIndustry={setIndustry}
        amountRange={amountRange}
        setAmountRange={setAmountRange}
        sortBy={sortBy}
        setSortBy={setSortBy}
        activeOnly={activeOnly}
        setActiveOnly={setActiveOnly}
        userPrefecture={userPrefecture}
        onApply={handleSearch}
        onClear={clearFilters}
        resultCount={total}
      />
    </div>
  );
}
