'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Calendar, Clock, MessageSquare, Phone, User, Ticket, CheckCircle } from 'lucide-react';

type TimeSlot = 'morning' | 'afternoon' | 'evening';

type ConsultationFormProps = {
  freeSlots: number;
  onSuccess?: () => void;
};

const TIME_SLOT_LABELS: Record<TimeSlot, string> = {
  morning: '午前（9:00〜12:00）',
  afternoon: '午後（13:00〜17:00）',
  evening: '夕方（17:00〜19:00）',
};

export function ConsultationForm({ freeSlots, onSuccess }: ConsultationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    preferredDate: '',
    preferredTimeSlot: '' as TimeSlot | '',
    consultationTopic: '',
    contactName: '',
    contactPhone: '',
  });

  const hasFreeSlots = freeSlots > 0;

  // 最小日付（明日以降）
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  // 最大日付（3ヶ月後）
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 3);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.preferredDate || !formData.preferredTimeSlot) {
      toast.error('希望日と時間帯を選択してください');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          useFreeSlot: hasFreeSlots,
        }),
      });

      if (res.ok) {
        setIsSuccess(true);
        toast.success('予約を受け付けました');
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

  if (isSuccess) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">予約を受け付けました</h3>
            <p className="text-slate-600">
              ご希望の日程で調整の上、担当者よりご連絡いたします。
              <br />
              しばらくお待ちください。
            </p>
            <div className="pt-4">
              <Button variant="outline" onClick={() => setIsSuccess(false)}>
                別の日程で予約する
              </Button>
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
          補助金申請に関するご相談を承ります。専門スタッフが対応いたします。
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* 無料枠バナー */}
        {hasFreeSlots ? (
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
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
          {/* 希望日 */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Calendar className="h-4 w-4" />
              ご希望の日程 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              min={minDate}
              max={maxDateStr}
              value={formData.preferredDate}
              onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* 時間帯 */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Clock className="h-4 w-4" />
              ご希望の時間帯 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(Object.entries(TIME_SLOT_LABELS) as [TimeSlot, string][]).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormData({ ...formData, preferredTimeSlot: value })}
                  className={`px-4 py-3 text-sm rounded-lg border transition-colors ${
                    formData.preferredTimeSlot === value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-300 hover:border-slate-400'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 相談内容 */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <MessageSquare className="h-4 w-4" />
              ご相談内容（任意）
            </label>
            <textarea
              value={formData.consultationTopic}
              onChange={(e) => setFormData({ ...formData, consultationTopic: e.target.value })}
              placeholder="例: IT導入補助金の申請について相談したい、自社に合う補助金を知りたい など"
              rows={4}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
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
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* 送信ボタン */}
          <Button 
            type="submit" 
            className="w-full" 
            size="lg"
            disabled={isSubmitting || !hasFreeSlots}
          >
            {isSubmitting ? (
              '送信中...'
            ) : hasFreeSlots ? (
              <>
                <Ticket className="h-4 w-4 mr-2" />
                無料枠を使って予約する
              </>
            ) : (
              '無料枠がありません'
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

