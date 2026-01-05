'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Phone, MessageSquare, User, Ticket, CheckCircle, Video } from 'lucide-react';
import { AvailabilityPicker } from './availability-picker';

type ConsultationBookingFormProps = {
  freeSlots: number;
  onSuccess?: () => void;
};

export function ConsultationBookingForm({ freeSlots, onSuccess }: ConsultationBookingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState<{
    date: string;
    startTime: string;
    meetLink?: string;
  } | null>(null);
  
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [formData, setFormData] = useState({
    consultationTopic: '',
    contactName: '',
    contactPhone: '',
  });

  const hasFreeSlots = freeSlots > 0;

  const handleSlotSelect = (date: string, startTime: string) => {
    setSelectedDate(date);
    setSelectedTime(startTime);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDate || !selectedTime) {
      toast.error('日時を選択してください');
      return;
    }

    if (!formData.consultationTopic.trim()) {
      toast.error('ご相談内容を入力してください');
      return;
    }

    if (!hasFreeSlots) {
      toast.error('無料相談枠がありません');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          startTime: selectedTime,
          consultationTopic: formData.consultationTopic || undefined,
          contactName: formData.contactName || undefined,
          contactPhone: formData.contactPhone || undefined,
          useFreeSlot: true,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setBookingResult({
          date: selectedDate,
          startTime: selectedTime,
          meetLink: data.booking?.meetLink || data.booking?.meet_link,
        });
        toast.success('予約が確定しました！');
        onSuccess?.();
      } else {
        const data = await res.json();
        toast.error(data.error || '予約に失敗しました');
      }
    } catch (error) {
      console.error('Failed to create booking:', error);
      toast.error('エラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 予約完了画面
  if (bookingResult) {
    const dateObj = new Date(bookingResult.date);
    const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][dateObj.getDay()];
    const formattedDate = `${dateObj.getFullYear()}年${dateObj.getMonth() + 1}月${dateObj.getDate()}日(${dayOfWeek})`;

    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">予約が確定しました！</h3>
              <p className="text-slate-600 mt-2">
                {formattedDate} {bookingResult.startTime}〜
              </p>
            </div>
            
            {bookingResult.meetLink && (
              <div className="p-4 bg-blue-50 rounded-xl">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Video className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-900">Google Meet</span>
                </div>
                <a
                  href={bookingResult.meetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 underline break-all text-sm"
                >
                  {bookingResult.meetLink}
                </a>
                <p className="text-xs text-blue-500 mt-2">
                  ※ 当日このリンクからミーティングに参加してください
                </p>
              </div>
            )}

            <div className="pt-4 space-y-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  setBookingResult(null);
                  setSelectedDate('');
                  setSelectedTime('');
                }}
              >
                別の日程で予約する
              </Button>
              <p className="text-sm text-slate-500">
                予約内容はメールでもお送りしています
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5 text-blue-600" />
          補助金相談を予約
        </CardTitle>
        <CardDescription>
          空いている時間を選んで、その場で予約を確定できます
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* 無料枠バナー */}
        {hasFreeSlots ? (
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg shrink-0">
                <Ticket className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-800">
                  無料相談枠: {freeSlots}回分あり
                </p>
                <p className="text-xs text-green-600">
                  招待特典で獲得した無料枠を使用します（通常5,000円相当）
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <p className="text-sm text-slate-600">
              無料相談枠がありません。友達を招待すると無料相談枠がもらえます！
            </p>
            <Button variant="link" className="p-0 h-auto text-blue-600" asChild>
              <a href="/invite">招待ページへ →</a>
            </Button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 空き枠選択 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              ご希望の日時を選択 <span className="text-red-500">*</span>
            </label>
            <AvailabilityPicker
              onSelect={handleSlotSelect}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
            />
          </div>

          {/* 相談内容 */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <MessageSquare className="h-4 w-4" />
              ご相談内容 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.consultationTopic}
              onChange={(e) => setFormData({ ...formData, consultationTopic: e.target.value })}
              placeholder="例: IT導入補助金の申請について相談したい、自社に合う補助金を知りたい など"
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* 連絡先情報 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <User className="h-4 w-4" />
                ご担当者名（任意）
              </label>
              <input
                type="text"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                placeholder="山田 太郎"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900 placeholder:text-slate-400"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <Phone className="h-4 w-4" />
                電話番号（任意）
              </label>
              <input
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                placeholder="090-1234-5678"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* 送信ボタン */}
          <Button 
            type="submit" 
            className="w-full" 
            size="lg"
            disabled={isSubmitting || !hasFreeSlots || !selectedDate || !selectedTime || !formData.consultationTopic.trim()}
          >
            {isSubmitting ? (
              '予約中...'
            ) : !hasFreeSlots ? (
              '無料枠がありません'
            ) : !selectedDate || !selectedTime ? (
              '日時を選択してください'
            ) : (
              <>
                <Ticket className="h-4 w-4 mr-2" />
                この時間で予約する
              </>
            )}
          </Button>

          {!hasFreeSlots && (
            <p className="text-center text-sm text-slate-500">
              ※ 有料相談（5,000円）は近日公開予定です
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

