'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Building2,
  Clock,
  CheckCircle,
  XCircle,
  Video,
  RefreshCw,
  Filter,
  User,
  Phone,
  Mail,
  Ticket,
} from 'lucide-react';

type Company = {
  id: string;
  name: string;
  email: string;
  contact_name: string | null;
  phone: string | null;
};

type Booking = {
  id: string;
  company_id: string;
  companies: Company;
  preferred_date: string;
  start_time: string | null;
  end_time: string | null;
  preferred_time_slot: string;
  consultation_topic: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  is_free: boolean;
  meet_link: string | null;
  created_at: string;
};

type Stats = {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
};

const STATUS_CONFIG = {
  pending: { label: '確認中', color: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: Clock },
  confirmed: { label: '確定', color: 'bg-blue-100 text-blue-700 border-blue-300', icon: CheckCircle },
  completed: { label: '完了', color: 'bg-green-100 text-green-700 border-green-300', icon: CheckCircle },
  cancelled: { label: 'キャンセル', color: 'bg-slate-100 text-slate-500 border-slate-300', icon: XCircle },
};

export default function AdminConsultationsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) {
        params.set('status', statusFilter);
      }
      
      const res = await fetch(`/api/admin/consultations?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings || []);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch('/api/admin/consultations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (res.ok) {
        await fetchBookings();
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDateTime = (booking: Booking) => {
    if (booking.start_time) {
      const date = new Date(booking.start_time);
      const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
      return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}(${dayOfWeek}) ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
    }
    
    const date = new Date(booking.preferred_date);
    const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
    const timeSlotLabels: Record<string, string> = {
      morning: '午前',
      afternoon: '午後',
      evening: '夕方',
      custom: '',
    };
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}(${dayOfWeek}) ${timeSlotLabels[booking.preferred_time_slot] || ''}`;
  };

  // 今日以降の予約を抽出
  const upcomingBookings = bookings.filter(b => {
    if (b.status === 'cancelled' || b.status === 'completed') return false;
    if (!b.start_time) return true;
    return new Date(b.start_time) >= new Date();
  });

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">相談予約管理</h1>
          <p className="text-slate-600 mt-1">予約の確認とステータス管理</p>
        </div>
        <Button onClick={fetchBookings} variant="outline" size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          更新
        </Button>
      </div>

      {/* 統計 */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-slate-500">合計</p>
            </CardContent>
          </Card>
          <Card className="border-yellow-200">
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              <p className="text-xs text-slate-500">確認中</p>
            </CardContent>
          </Card>
          <Card className="border-blue-200">
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.confirmed}</p>
              <p className="text-xs text-slate-500">確定</p>
            </CardContent>
          </Card>
          <Card className="border-green-200">
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              <p className="text-xs text-slate-500">完了</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold text-slate-400">{stats.cancelled}</p>
              <p className="text-xs text-slate-500">キャンセル</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* フィルター */}
      <Card>
        <CardHeader className="py-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium">フィルター</span>
          </div>
        </CardHeader>
        <CardContent className="py-3">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={statusFilter === '' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('')}
            >
              すべて
            </Button>
            <Button
              variant={statusFilter === 'confirmed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('confirmed')}
            >
              確定
            </Button>
            <Button
              variant={statusFilter === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('pending')}
            >
              確認中
            </Button>
            <Button
              variant={statusFilter === 'completed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('completed')}
            >
              完了
            </Button>
            <Button
              variant={statusFilter === 'cancelled' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('cancelled')}
            >
              キャンセル
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 予約リスト */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            予約一覧
            {upcomingBookings.length > 0 && (
              <Badge className="bg-blue-600">今後 {upcomingBookings.length}件</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-500">読み込み中...</div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              予約はまだありません
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => {
                const statusConfig = STATUS_CONFIG[booking.status];
                const StatusIcon = statusConfig.icon;
                const company = booking.companies;

                return (
                  <div
                    key={booking.id}
                    className={`p-4 rounded-lg border ${
                      booking.status === 'confirmed' ? 'border-blue-200 bg-blue-50/50' :
                      booking.status === 'pending' ? 'border-yellow-200 bg-yellow-50/50' :
                      'border-slate-200 bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* 左側：予約情報 */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${statusConfig.color}`}>
                            <StatusIcon className="h-3 w-3" />
                            {statusConfig.label}
                          </span>
                          {booking.is_free && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                              <Ticket className="h-3 w-3" />
                              無料枠
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                          <Clock className="h-4 w-4 text-slate-400" />
                          {formatDateTime(booking)}
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 mt-3">
                          {/* 会社情報 */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Building2 className="h-4 w-4 text-slate-400" />
                              <span className="font-medium">{company?.name || '不明'}</span>
                            </div>
                            {(booking.contact_name || company?.contact_name) && (
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <User className="h-4 w-4 text-slate-400" />
                                {booking.contact_name || company?.contact_name}
                              </div>
                            )}
                            {company?.email && (
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Mail className="h-4 w-4 text-slate-400" />
                                <a href={`mailto:${company.email}`} className="hover:text-blue-600">
                                  {company.email}
                                </a>
                              </div>
                            )}
                            {(booking.contact_phone || company?.phone) && (
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Phone className="h-4 w-4 text-slate-400" />
                                <a href={`tel:${booking.contact_phone || company.phone}`} className="hover:text-blue-600">
                                  {booking.contact_phone || company.phone}
                                </a>
                              </div>
                            )}
                          </div>

                          {/* 相談内容 */}
                          {booking.consultation_topic && (
                            <div>
                              <p className="text-xs text-slate-500 mb-1">相談内容：</p>
                              <p className="text-sm text-slate-700 line-clamp-3">
                                {booking.consultation_topic}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Meet リンク */}
                        {booking.meet_link && (
                          <div className="mt-2">
                            <a
                              href={booking.meet_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200"
                            >
                              <Video className="h-4 w-4" />
                              Google Meetに参加
                            </a>
                          </div>
                        )}
                      </div>

                      {/* 右側：アクション */}
                      <div className="flex flex-col gap-2">
                        {booking.status === 'confirmed' && (
                          <Button
                            size="sm"
                            onClick={() => updateStatus(booking.id, 'completed')}
                            disabled={updatingId === booking.id}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            完了
                          </Button>
                        )}
                        {(booking.status === 'pending' || booking.status === 'confirmed') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatus(booking.id, 'cancelled')}
                            disabled={updatingId === booking.id}
                            className="text-red-600 border-red-300 hover:bg-red-50"
                          >
                            キャンセル
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

