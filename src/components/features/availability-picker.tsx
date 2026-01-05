'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Clock, Loader2 } from 'lucide-react';

type Slot = {
  start: string;
  end: string;
};

type AvailabilityPickerProps = {
  onSelect: (date: string, startTime: string) => void;
  selectedDate?: string;
  selectedTime?: string;
};

// 日付をフォーマット
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 日付表示用
function formatDateDisplay(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
  return `${month}月${day}日(${dayOfWeek})`;
}

// 平日かどうか
function isWeekday(date: Date): boolean {
  const day = date.getDay();
  return day !== 0 && day !== 6;
}

export function AvailabilityPicker({ onSelect, selectedDate, selectedTime }: AvailabilityPickerProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    // 今週の月曜日を取得
    const day = today.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  });
  
  const [slots, setSlots] = useState<Record<string, Slot[]>>({});
  const [loadingDates, setLoadingDates] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // 表示する日付リスト（5日間 = 平日）
  const weekDates = Array.from({ length: 5 }, (_, i) => {
    const date = new Date(currentWeekStart);
    date.setDate(currentWeekStart.getDate() + i);
    return date;
  });

  // 空き枠を取得
  const fetchSlots = async (date: string) => {
    if (slots[date] || loadingDates.has(date)) {
      return;
    }

    setLoadingDates(prev => new Set(prev).add(date));
    setError(null);

    try {
      const res = await fetch(`/api/consultation/availability?date=${date}`);
      if (res.ok) {
        const data = await res.json();
        setSlots(prev => ({ ...prev, [date]: data.slots || [] }));
      } else {
        setError('空き枠の取得に失敗しました');
      }
    } catch (err) {
      console.error('Failed to fetch slots:', err);
      setError('空き枠の取得に失敗しました');
    } finally {
      setLoadingDates(prev => {
        const next = new Set(prev);
        next.delete(date);
        return next;
      });
    }
  };

  // 週が変わったら空き枠を取得
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    weekDates.forEach(date => {
      // 過去の日付はスキップ
      if (date < today) return;
      // 平日のみ
      if (!isWeekday(date)) return;
      
      const dateStr = formatDate(date);
      fetchSlots(dateStr);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWeekStart]);

  // 前の週へ
  const goToPrevWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(currentWeekStart.getDate() - 7);
    
    // 今週より前には戻れない
    const today = new Date();
    const day = today.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const thisMonday = new Date(today);
    thisMonday.setDate(today.getDate() + diff);
    thisMonday.setHours(0, 0, 0, 0);
    
    if (newStart >= thisMonday) {
      setCurrentWeekStart(newStart);
    }
  };

  // 次の週へ
  const goToNextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(currentWeekStart.getDate() + 7);
    
    // 3ヶ月以上先には進めない
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    
    if (newStart <= maxDate) {
      setCurrentWeekStart(newStart);
    }
  };

  // 今週かどうか
  const isCurrentWeek = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const thisMonday = new Date(today);
    thisMonday.setDate(today.getDate() + diff);
    thisMonday.setHours(0, 0, 0, 0);
    
    return currentWeekStart.getTime() === thisMonday.getTime();
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-4">
      {/* 週ナビゲーション */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={goToPrevWeek}
          disabled={isCurrentWeek()}
        >
          <ChevronLeft className="h-4 w-4" />
          前の週
        </Button>
        
        <span className="text-sm font-medium text-slate-700">
          {currentWeekStart.getMonth() + 1}月{currentWeekStart.getDate()}日 〜
        </span>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={goToNextWeek}
        >
          次の週
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
          {error}
        </div>
      )}

      {/* 日付と空き枠 */}
      <div className="space-y-4">
        {weekDates.map(date => {
          const dateStr = formatDate(date);
          const isPast = date < today;
          const dateSlots = slots[dateStr] || [];
          const isLoading = loadingDates.has(dateStr);

          return (
            <div key={dateStr} className="border rounded-lg overflow-hidden">
              {/* 日付ヘッダー */}
              <div className={`px-4 py-2 font-medium ${
                isPast 
                  ? 'bg-slate-100 text-slate-400' 
                  : 'bg-slate-50 text-slate-700'
              }`}>
                {formatDateDisplay(date)}
                {isPast && <span className="ml-2 text-xs">（過去）</span>}
              </div>

              {/* スロット */}
              <div className="p-3">
                {isPast ? (
                  <p className="text-sm text-slate-400">過去の日付です</p>
                ) : isLoading ? (
                  <div className="flex items-center gap-2 text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">読み込み中...</span>
                  </div>
                ) : dateSlots.length === 0 ? (
                  <p className="text-sm text-slate-400">空き枠がありません</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {dateSlots.map(slot => {
                      const isSelected = selectedDate === dateStr && selectedTime === slot.start;
                      
                      return (
                        <button
                          key={slot.start}
                          onClick={() => onSelect(dateStr, slot.start)}
                          className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:bg-blue-50'
                          }`}
                        >
                          <Clock className="h-3 w-3 inline mr-1" />
                          {slot.start}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 選択中の表示 */}
      {selectedDate && selectedTime && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
          <p className="text-sm text-blue-700">
            選択中: <span className="font-bold">{formatDateDisplay(new Date(selectedDate))} {selectedTime}</span>
            <span className="text-blue-500">（30分）</span>
          </p>
        </div>
      )}
    </div>
  );
}

