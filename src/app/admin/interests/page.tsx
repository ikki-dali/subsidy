'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Bell,
  Building2,
  Clock,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Check,
  CheckCheck,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
} from 'lucide-react';

type Interest = {
  id: string;
  subsidy_id: string;
  subsidy_title: string;
  subsidy_url?: string;
  note?: string;
  status: string;
  read_at: string | null;
  created_at: string;
  company_id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone?: string;
  industry: string;
  prefecture: string;
};

const STATUS_OPTIONS = [
  { value: 'all', label: 'すべて' },
  { value: 'interested', label: '興味あり' },
  { value: 'contacted', label: '連絡済み' },
  { value: 'applied', label: '申請済み' },
  { value: 'rejected', label: '不採用' },
];

const STATUS_COLORS: Record<string, string> = {
  interested: 'bg-blue-100 text-blue-700',
  contacted: 'bg-yellow-100 text-yellow-700',
  applied: 'bg-green-100 text-green-700',
  rejected: 'bg-slate-100 text-slate-700',
};

const STATUS_LABELS: Record<string, string> = {
  interested: '興味あり',
  contacted: '連絡済み',
  applied: '申請済み',
  rejected: '不採用',
};

export default function AdminInterestsPage() {
  const [interests, setInterests] = useState<Interest[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const inFlightRef = useRef(false);
  const limit = 20;

  const fetchInterests = useCallback(async (options?: { silent?: boolean }) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    const silent = options?.silent === true;
    if (!silent) setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', limit.toString());
      params.set('offset', ((page - 1) * limit).toString());
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
      if (unreadOnly) params.set('unread', 'true');

      const res = await fetch(`/api/admin/interests?${params.toString()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setInterests(data.interests || []);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch interests:', error);
    } finally {
      if (!silent) setLoading(false);
      inFlightRef.current = false;
    }
  }, [page, statusFilter, unreadOnly]);

  useEffect(() => {
    fetchInterests();
  }, [fetchInterests]);

  useEffect(() => {
    const AUTO_REFRESH_MS = 5000;
    const intervalId = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      fetchInterests({ silent: true });
    }, AUTO_REFRESH_MS);

    return () => clearInterval(intervalId);
  }, [fetchInterests]);

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch('/api/admin/interests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, markAsRead: true }),
      });
      if (res.ok) {
        setInterests(prev =>
          prev.map(i => (i.id === id ? { ...i, read_at: new Date().toISOString() } : i))
        );
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/admin/interests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setInterests(prev =>
          prev.map(i => (i.id === id ? { ...i, status } : i))
        );
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/admin/interests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_read' }),
      });
      if (res.ok) {
        fetchInterests();
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const totalPages = Math.ceil(total / limit);
  const unreadCount = interests.filter(i => !i.read_at).length;

  return (
    <div className="space-y-6">
      {/* ページヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Bell className="h-6 w-6" />
            通知・リクエスト管理
          </h1>
          <p className="text-slate-600 mt-1">
            「気になる」リクエストの確認と対応
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchInterests()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            更新
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            <CheckCheck className="h-4 w-4 mr-1" />
            すべて既読
          </Button>
        </div>
      </div>

      {/* フィルター */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-medium">フィルター:</span>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="ステータス" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant={unreadOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => setUnreadOnly(!unreadOnly)}
            >
              未読のみ
              {unreadOnly && <Check className="ml-1 h-4 w-4" />}
            </Button>
            <div className="ml-auto text-sm text-slate-500">
              {total}件 / 未読 {interests.filter(i => !i.read_at).length}件
            </div>
          </div>
        </CardContent>
      </Card>

      {/* リスト */}
      {loading ? (
        <div className="text-center py-12 text-slate-500">読み込み中...</div>
      ) : interests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            リクエストはありません
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {interests.map(interest => (
            <Card
              key={interest.id}
              className={`${!interest.read_at ? 'border-l-4 border-l-orange-500' : ''}`}
            >
              <CardContent className="pt-4">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* 左側: 会社・補助金情報 */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {!interest.read_at && (
                            <Badge className="bg-orange-500">未読</Badge>
                          )}
                          <Badge className={STATUS_COLORS[interest.status]}>
                            {STATUS_LABELS[interest.status]}
                          </Badge>
                        </div>
                        <Link
                          href={`/admin/clients/${interest.company_id}`}
                          className="text-lg font-semibold hover:text-blue-600 mt-1 inline-block"
                        >
                          <Building2 className="inline h-4 w-4 mr-1" />
                          {interest.company_name}
                        </Link>
                      </div>
                      <div className="text-sm text-slate-500 flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatDate(interest.created_at)}
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-sm text-slate-500 mb-1">対象補助金:</p>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{interest.subsidy_title}</span>
                        {interest.subsidy_url && (
                          <a
                            href={interest.subsidy_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                        <Link
                          href={`/subsidies/${interest.subsidy_id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          詳細
                        </Link>
                      </div>
                    </div>

                    {interest.note && (
                      <div className="flex gap-2 text-sm">
                        <MessageSquare className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                        <p className="text-slate-600">{interest.note}</p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                      <span className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        <a href={`mailto:${interest.email}`} className="hover:text-blue-600">
                          {interest.email}
                        </a>
                      </span>
                      {interest.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          <a href={`tel:${interest.phone}`} className="hover:text-blue-600">
                            {interest.phone}
                          </a>
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {interest.prefecture}
                      </span>
                    </div>
                  </div>

                  {/* 右側: アクション */}
                  <div className="flex flex-col gap-2 lg:w-48">
                    <Select
                      value={interest.status}
                      onValueChange={(value) => updateStatus(interest.id, value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="interested">興味あり</SelectItem>
                        <SelectItem value="contacted">連絡済み</SelectItem>
                        <SelectItem value="applied">申請済み</SelectItem>
                        <SelectItem value="rejected">不採用</SelectItem>
                      </SelectContent>
                    </Select>
                    {!interest.read_at && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markAsRead(interest.id)}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        既読にする
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ページネーション */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            前へ
          </Button>
          <span className="text-sm text-slate-600">
            {page} / {totalPages} ページ
          </span>
          <Button
            variant="outline"
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            次へ
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
