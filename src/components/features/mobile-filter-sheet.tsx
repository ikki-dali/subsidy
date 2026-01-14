'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Building2,
  Banknote,
  TrendingUp,
  Clock,
  RotateCcw,
} from 'lucide-react';

// 足立区特化サイト - 地域フィルターは削除

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

type MobileFilterSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // フィルター値（足立区特化: 地域フィルターは削除）
  industry: string;
  setIndustry: (industry: string) => void;
  amountRange: string;
  setAmountRange: (amountRange: string) => void;
  sortBy: string;
  setSortBy: (sortBy: string) => void;
  activeOnly: boolean;
  setActiveOnly: (active: boolean) => void;
  // アクション
  onApply: () => void;
  onClear: () => void;
  // 結果数
  resultCount?: number;
};

export function MobileFilterSheet({
  open,
  onOpenChange,
  industry,
  setIndustry,
  amountRange,
  setAmountRange,
  sortBy,
  setSortBy,
  activeOnly,
  setActiveOnly,
  onApply,
  onClear,
  resultCount,
}: MobileFilterSheetProps) {
  const handleApply = () => {
    onApply();
    onOpenChange(false);
  };

  const handleClear = () => {
    onClear();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[85vh] rounded-t-3xl px-0 overflow-hidden"
      >
        <SheetHeader className="px-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-bold">フィルター</SheetTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="text-slate-500 hover:text-slate-700 h-10 px-3"
            >
              <RotateCcw className="h-4 w-4 mr-1.5" />
              リセット
            </Button>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* 足立区特化: 地域フィルターは削除 */}

          {/* 業種 */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-orange-100">
                <Building2 className="h-4 w-4 text-orange-600" />
              </div>
              対象業種
            </Label>
            <Select value={industry} onValueChange={setIndustry}>
              <SelectTrigger className="h-12 rounded-xl text-base">
                <SelectValue placeholder="すべての業種" />
              </SelectTrigger>
              <SelectContent className="max-h-[40vh]">
                {INDUSTRIES.map((ind) => (
                  <SelectItem key={ind} value={ind} className="h-12">
                    {ind}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 金額範囲 */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-100">
                <Banknote className="h-4 w-4 text-blue-600" />
              </div>
              補助金額
            </Label>
            <Select value={amountRange} onValueChange={setAmountRange}>
              <SelectTrigger className="h-12 rounded-xl text-base">
                <SelectValue placeholder="すべての金額" />
              </SelectTrigger>
              <SelectContent>
                {AMOUNT_RANGES.map((range) => (
                  <SelectItem key={range.label} value={range.label} className="h-12">
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 並び替え */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-100">
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </div>
              並び替え
            </Label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-12 rounded-xl text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="h-12">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 募集中のみ */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-emerald-100">
                <Clock className="h-4 w-4 text-emerald-600" />
              </div>
              <Label htmlFor="mobile-active-only" className="text-base font-medium cursor-pointer">
                募集中のみ表示
              </Label>
            </div>
            <Switch
              id="mobile-active-only"
              checked={activeOnly}
              onCheckedChange={setActiveOnly}
              className="scale-125"
            />
          </div>
        </div>

        <SheetFooter className="px-6 py-4 border-t bg-white">
          <Button
            onClick={handleApply}
            className="w-full h-14 text-lg font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          >
            {resultCount !== undefined ? (
              `${resultCount.toLocaleString()}件の結果を見る`
            ) : (
              '検索結果を見る'
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

