'use client';

import { useState, useEffect } from 'react';
import { ConsultationBookingForm } from '@/components/features/consultation-booking-form';
import { ConsultationSlotsCard } from '@/components/features/consultation-slots-badge';
import { Banknote, ArrowLeft, Calendar, CheckCircle, Clock, XCircle, Video } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Booking = {
  id: string;
  preferred_date: string;
  start_time?: string;
  end_time?: string;
  preferred_time_slot: 'morning' | 'afternoon' | 'evening' | 'custom';
  consultation_topic: string | null;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  is_free: boolean;
  meet_link?: string;
  created_at: string;
};

const STATUS_CONFIG = {
  pending: { label: '確認中', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  confirmed: { label: '確定', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  completed: { label: '完了', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  cancelled: { label: 'キャンセル', color: 'bg-slate-100 text-slate-500', icon: XCircle },
};

export default function ConsultationPage() {
  const [freeSlots, setFreeSlots] = useState(0);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [invitesRes, bookingsRes] = await Promise.all([
        fetch('/api/invitations'),
        fetch('/api/consultation'),
      ]);

      // 招待履歴から無料枠を計算（DBの値が信頼できない場合のため）
      if (invitesRes.ok) {
        const invitesData = await invitesRes.json();
        const invitations = invitesData.invitations || [];
        const usedCount = invitations.filter((i: { status: string }) => i.status === 'used').length;
        setFreeSlots(Math.min(usedCount, 2)); // 最大2枠
      }

      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json();
        setBookings(bookingsData.bookings || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatDateTime = (booking: Booking) => {
    if (booking.start_time) {
      const date = new Date(booking.start_time);
      const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
      return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日(${dayOfWeek}) ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}〜`;
    }
    
    // 旧形式のデータ
    const date = new Date(booking.preferred_date);
    const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
    const timeSlotLabels = {
      morning: '午前',
      afternoon: '午後',
      evening: '夕方',
      custom: '',
    };
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日(${dayOfWeek}) ${timeSlotLabels[booking.preferred_time_slot]}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* ヘッダー */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Banknote className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              補助金ナビ
            </span>
          </Link>
          <Link 
            href="/invite" 
            className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            戻る
          </Link>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* 無料枠表示 */}
        <ConsultationSlotsCard />

        {/* 予約フォーム */}
        <ConsultationBookingForm freeSlots={freeSlots} onSuccess={fetchData} />

        {/* 予約履歴 */}
        {!isLoading && bookings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-5 w-5 text-slate-600" />
                予約履歴
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {bookings.map((booking) => {
                  const statusConfig = STATUS_CONFIG[booking.status];
                  const StatusIcon = statusConfig.icon;
                  
                  return (
                    <div 
                      key={booking.id}
                      className="p-4 bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-slate-900">
                              {formatDateTime(booking)}
                            </span>
                          </div>
                          {booking.consultation_topic && (
                            <p className="text-sm text-slate-600 line-clamp-2 mb-2">
                              {booking.consultation_topic}
                            </p>
                          )}
                          <div className="flex items-center gap-2 flex-wrap">
                            {booking.is_free && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                                無料枠利用
                              </span>
                            )}
                            {booking.meet_link && booking.status === 'confirmed' && (
                              <a
                                href={booking.meet_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
                              >
                                <Video className="h-3 w-3" />
                                Meet参加
                              </a>
                            )}
                          </div>
                        </div>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium shrink-0 ${statusConfig.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig.label}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
