'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Heart, Clock, MapPin, Building2, ExternalLink, TrendingUp, Check } from 'lucide-react';
import { formatCurrency, getDaysRemaining, getDeadlineStatus } from '@/lib/jgrants';
import { stripHtml } from '@/lib/clean-description';
import type { Subsidy } from '@/types/database';
import { useFavorites } from '@/lib/use-favorites';
import { AuthRequiredLink } from '@/components/features/auth-required-link';
import { SwipeableCard } from '@/components/ui/swipeable-card';

type SubsidyCardProps = {
  subsidy: Subsidy;
  variant?: 'default' | 'compact';
  enableSwipe?: boolean;
};

export function SubsidyCard({ subsidy, variant = 'default', enableSwipe = true }: SubsidyCardProps) {
  const router = useRouter();
  const { isFavorite, toggleFavorite } = useFavorites();
  const daysRemaining = getDaysRemaining(subsidy.end_date);
  // is_activeがfalseの場合は強制的にclosed、それ以外は締切日ベースのステータス
  const status = subsidy.is_active === false ? 'closed' : getDeadlineStatus(daysRemaining);
  const isFav = isFavorite(subsidy.id);

  // スワイプハンドラー
  const handleSwipeRight = () => {
    toggleFavorite(subsidy.id);
  };

  const handleSwipeLeft = () => {
    router.push(`/subsidies/${subsidy.id}`);
  };

  // ステータスに応じたスタイル
  const statusConfig = {
    urgent: {
      badge: 'bg-red-500 text-white border-red-500 animate-pulse',
      card: 'border-l-4 border-l-red-500',
      icon: 'text-red-500',
    },
    soon: {
      badge: 'bg-amber-500 text-white border-amber-500',
      card: 'border-l-4 border-l-amber-500',
      icon: 'text-amber-500',
    },
    normal: {
      badge: 'bg-emerald-500 text-white border-emerald-500',
      card: 'border-l-4 border-l-emerald-500',
      icon: 'text-emerald-500',
    },
    ongoing: {
      badge: 'bg-blue-500 text-white border-blue-500',
      card: 'border-l-4 border-l-blue-500',
      icon: 'text-blue-500',
    },
    closed: {
      badge: 'bg-slate-400 text-white border-slate-400',
      card: 'border-l-4 border-l-slate-400 opacity-70',
      icon: 'text-slate-400',
    },
  };

  const statusLabels = {
    urgent: '締切間近',
    soon: 'まもなく締切',
    normal: '募集中',
    ongoing: '随時募集',
    closed: '募集終了',
  };

  const config = statusConfig[status];

  // 金額を視覚的に表示
  const formatAmountDisplay = (amount: number | null | undefined) => {
    if (!amount) return null;
    
    if (amount >= 100000000) {
      return { value: (amount / 100000000).toFixed(1), unit: '億円' };
    } else if (amount >= 10000) {
      return { value: Math.round(amount / 10000), unit: '万円' };
    }
    return { value: amount.toLocaleString(), unit: '円' };
  };

  const amountDisplay = formatAmountDisplay(subsidy.max_amount);

  if (variant === 'compact') {
    return (
      <AuthRequiredLink href={`/subsidies/${subsidy.id}`}>
        <Card className={`group hover:shadow-md transition-all cursor-pointer ${config.card}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm line-clamp-1 group-hover:text-blue-600 transition-colors">
                  {subsidy.title}
                </h3>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  {subsidy.target_area && subsidy.target_area.length > 0 && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {subsidy.target_area[0]}
                    </span>
                  )}
                  {daysRemaining !== null && daysRemaining >= 0 && (
                    <span className={`flex items-center gap-1 ${config.icon}`}>
                      <Clock className="h-3 w-3" />
                      残り{daysRemaining}日
                    </span>
                  )}
                </div>
              </div>
              {amountDisplay && (
                <div className="text-right shrink-0">
                  <span className="text-lg font-bold text-blue-600">{amountDisplay.value}</span>
                  <span className="text-xs text-muted-foreground ml-0.5">{amountDisplay.unit}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </AuthRequiredLink>
    );
  }

  const cardContent = (
    <Card className={`group hover:shadow-xl transition-all duration-300 ${config.card} sm:hover:scale-[1.02] h-full flex flex-col`}>
      <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="flex-1 min-w-0 space-y-1.5 sm:space-y-2">
            {/* ステータスバッジ */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <Badge className={`${config.badge} font-semibold text-xs`}>
                <Clock className="h-3 w-3 mr-0.5 sm:mr-1" />
                {statusLabels[status]}
                {daysRemaining !== null && daysRemaining >= 0 && ` (${daysRemaining}日)`}
              </Badge>
              
              {/* 金額バッジ */}
              {amountDisplay && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                  <TrendingUp className="h-3 w-3 mr-0.5 sm:mr-1" />
                  最大{amountDisplay.value}{amountDisplay.unit}
                </Badge>
              )}
            </div>
            
            {/* タイトル */}
            <CardTitle className="text-sm sm:text-lg leading-snug min-h-[2.5rem] sm:min-h-[3.5rem]">
              <AuthRequiredLink 
                href={`/subsidies/${subsidy.id}`} 
                className="hover:text-blue-600 transition-colors line-clamp-2"
              >
                {subsidy.title}
              </AuthRequiredLink>
            </CardTitle>
          </div>
          
          {/* お気に入りボタン */}
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.preventDefault();
              toggleFavorite(subsidy.id);
            }}
            className="shrink-0 hover:bg-red-50 h-10 w-10 min-w-[44px] min-h-[44px]"
          >
            <Heart
              className={`h-5 w-5 transition-all ${
                isFav 
                  ? 'fill-red-500 text-red-500 scale-110' 
                  : 'text-gray-300 hover:text-red-400'
              }`}
            />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-3 sm:p-4 pt-0 space-y-3 sm:space-y-4 flex-1 flex flex-col">
        {/* キャッチフレーズ or 概要の冒頭 - 固定高さで揃える */}
        <div className="min-h-[2.5rem] sm:min-h-[3rem]">
          {(() => {
            const strippedDesc = subsidy.description ? stripHtml(subsidy.description) : '';
            const displayText = subsidy.catch_phrase || 
              (strippedDesc ? strippedDesc.slice(0, 80) + (strippedDesc.length > 80 ? '...' : '') : null);
            return displayText ? (
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {displayText}
              </p>
            ) : null;
          })()}
        </div>

        {/* 詳細情報 */}
        <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
          {/* 補助率 */}
          <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-lg bg-slate-50">
            <div className="p-1 sm:p-1.5 rounded bg-purple-100">
              <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-purple-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground">補助率</p>
              <p className="font-semibold text-purple-700 truncate">{subsidy.subsidy_rate || '-'}</p>
            </div>
          </div>

          {/* 上限額 */}
          <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-lg bg-slate-50">
            <div className="p-1 sm:p-1.5 rounded bg-blue-100">
              <Building2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground">上限額</p>
              <p className="font-semibold text-blue-700 truncate">{formatCurrency(subsidy.max_amount)}</p>
            </div>
          </div>
        </div>

        {/* 対象地域・業種タグ */}
        <div className="flex flex-wrap gap-1 min-h-[3.5rem] sm:min-h-[4rem] content-start">
          {subsidy.target_area && subsidy.target_area.slice(0, 1).map((area, i) => (
            <Badge 
              key={i} 
              variant="outline" 
              className="text-[10px] sm:text-xs bg-green-50 text-green-700 border-green-200 py-0.5"
            >
              <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5" />
              {area}
            </Badge>
          ))}
          {subsidy.target_area && subsidy.target_area.length > 1 && (
            <Popover>
              <PopoverTrigger asChild>
                <Badge 
                  variant="outline" 
                  className="text-[10px] sm:text-xs py-0.5 cursor-pointer hover:bg-slate-100"
                >
                  +{subsidy.target_area.length - 1}
                </Badge>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2" align="start">
                <div className="text-xs font-medium text-slate-600 mb-2">対象地域</div>
                <div className="flex flex-wrap gap-1 max-w-xs">
                  {subsidy.target_area.map((area, i) => (
                    <Badge 
                      key={i} 
                      variant="outline" 
                      className="text-xs bg-green-50 text-green-700 border-green-200"
                    >
                      {area}
                    </Badge>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}
          {(() => {
            // 「全業種」は表示しない（他のタグがある場合は冗長）
            const displayIndustries = (subsidy.industry || []).filter(ind => ind !== '全業種');
            const visibleCount = 2; // 表示する最大タグ数
            return (
              <>
                {displayIndustries.slice(0, visibleCount).map((ind, i) => (
                  <Badge 
                    key={i} 
                    variant="outline" 
                    className="text-[10px] sm:text-xs bg-orange-50 text-orange-700 border-orange-200 py-0.5"
                  >
                    {ind.length > 8 ? ind.slice(0, 8) + '...' : ind}
                  </Badge>
                ))}
                {displayIndustries.length > visibleCount && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Badge 
                        variant="outline" 
                        className="text-[10px] sm:text-xs py-0.5 cursor-pointer hover:bg-slate-100"
                      >
                        +{displayIndustries.length - visibleCount}
                      </Badge>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2" align="start">
                      <div className="text-xs font-medium text-slate-600 mb-2">対象業種</div>
                      <div className="flex flex-wrap gap-1">
                        {displayIndustries.map((ind, i) => (
                          <Badge 
                            key={i} 
                            variant="outline" 
                            className="text-xs bg-orange-50 text-orange-700 border-orange-200"
                          >
                            {ind}
                          </Badge>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
                {displayIndustries.length === 0 && subsidy.industry?.includes('全業種') && (
                  <Badge 
                    variant="outline" 
                    className="text-[10px] sm:text-xs bg-gray-50 text-gray-600 border-gray-200 py-0.5"
                  >
                    全業種
                  </Badge>
                )}
              </>
            );
          })()}
        </div>

        {/* アクションボタン */}
        <div className="flex gap-2 pt-1 sm:pt-2 mt-auto">
          <AuthRequiredLink href={`/subsidies/${subsidy.id}`} className="flex-1">
            <Button 
              variant="default" 
              className="w-full h-11 sm:h-12 text-sm sm:text-base bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            >
              詳細を見る
              <ExternalLink className="h-4 w-4 sm:h-5 sm:w-5 ml-1.5" />
            </Button>
          </AuthRequiredLink>
        </div>
      </CardContent>
    </Card>
  );

  // モバイルでスワイプを有効化
  if (enableSwipe) {
    return (
      <SwipeableCard
        onSwipeRight={handleSwipeRight}
        onSwipeLeft={handleSwipeLeft}
        rightAction={{
          icon: isFav ? <Check className="h-6 w-6" /> : <Heart className="h-6 w-6" />,
          label: isFav ? '解除' : 'お気に入り',
          color: isFav ? 'bg-slate-500' : 'bg-pink-500',
        }}
        leftAction={{
          icon: <ExternalLink className="h-6 w-6" />,
          label: '詳細',
          color: 'bg-blue-500',
        }}
      >
        {cardContent}
      </SwipeableCard>
    );
  }

  return cardContent;
}
