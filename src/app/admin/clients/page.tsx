'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  Search,
  Building2,
  Mail,
  MapPin,
  Heart,
  Bell,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ArrowUpDown,
} from 'lucide-react';

type Client = {
  id: string;
  name: string;
  contact_name: string;
  email: string;
  phone?: string;
  industry: string;
  prefecture: string;
  employee_count: string;
  annual_revenue?: string;
  created_at: string;
  interests_count: number;
  favorites_count: number;
};

const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県',
  '岐阜県', '静岡県', '愛知県', '三重県',
  '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県',
  '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県',
  '福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
];

export default function AdminClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [prefecture, setPrefecture] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const inFlightRef = useRef(false);
  const limit = 20;

  const fetchClients = useCallback(async (options?: { silent?: boolean }) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    const silent = options?.silent === true;
    if (!silent) setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', limit.toString());
      params.set('offset', ((page - 1) * limit).toString());
      if (search) params.set('search', search);
      if (prefecture && prefecture !== 'all') params.set('prefecture', prefecture);
      params.set('sort', sortBy);
      params.set('order', sortOrder);

      const res = await fetch(`/api/admin/clients?${params.toString()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients || []);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    } finally {
      if (!silent) setLoading(false);
      inFlightRef.current = false;
    }
  }, [page, search, prefecture, sortBy, sortOrder]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    const AUTO_REFRESH_MS = 5000;
    const intervalId = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      fetchClients({ silent: true });
    }, AUTO_REFRESH_MS);

    return () => clearInterval(intervalId);
  }, [fetchClients]);

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* ページヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="h-6 w-6" />
            クライアント管理
          </h1>
          <p className="text-slate-600 mt-1">
            登録企業の一覧と詳細情報
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchClients()}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          更新
        </Button>
      </div>

      {/* 検索・フィルター */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="会社名、担当者名、メールで検索..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <Select value={prefecture} onValueChange={(v) => { setPrefecture(v); setPage(1); }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="都道府県" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                {PREFECTURES.map(p => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-sm text-slate-500 flex items-center">
              {total}件
            </div>
          </div>
        </CardContent>
      </Card>

      {/* テーブル */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="text-left p-4 font-medium text-slate-600">会社情報</th>
                  <th className="text-left p-4 font-medium text-slate-600 hidden md:table-cell">
                    <button
                      className="flex items-center gap-1 hover:text-slate-900"
                      onClick={() => toggleSort('prefecture')}
                    >
                      地域
                      <ArrowUpDown className="h-4 w-4" />
                    </button>
                  </th>
                  <th className="text-center p-4 font-medium text-slate-600 hidden lg:table-cell">気になる</th>
                  <th className="text-center p-4 font-medium text-slate-600 hidden lg:table-cell">お気に入り</th>
                  <th className="text-left p-4 font-medium text-slate-600">
                    <button
                      className="flex items-center gap-1 hover:text-slate-900"
                      onClick={() => toggleSort('created_at')}
                    >
                      登録日
                      <ArrowUpDown className="h-4 w-4" />
                    </button>
                  </th>
                  <th className="text-center p-4 font-medium text-slate-600">詳細</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-500">
                      読み込み中...
                    </td>
                  </tr>
                ) : clients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-500">
                      クライアントが見つかりません
                    </td>
                  </tr>
                ) : (
                  clients.map(client => (
                    <tr key={client.id} className="border-b hover:bg-slate-50">
                      <td className="p-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-slate-400" />
                            <span className="font-medium">{client.name}</span>
                          </div>
                          <div className="text-sm text-slate-500 mt-1">
                            {client.contact_name}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-slate-500 mt-0.5">
                            <Mail className="h-3 w-3" />
                            {client.email}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-4 w-4 text-slate-400" />
                          {client.prefecture}
                        </div>
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {client.industry}
                        </Badge>
                      </td>
                      <td className="p-4 text-center hidden lg:table-cell">
                        {client.interests_count > 0 ? (
                          <Badge className="bg-orange-100 text-orange-700">
                            <Bell className="h-3 w-3 mr-1" />
                            {client.interests_count}
                          </Badge>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="p-4 text-center hidden lg:table-cell">
                        {client.favorites_count > 0 ? (
                          <Badge className="bg-red-100 text-red-700">
                            <Heart className="h-3 w-3 mr-1" />
                            {client.favorites_count}
                          </Badge>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        {formatDate(client.created_at)}
                      </td>
                      <td className="p-4 text-center">
                        <Link href={`/admin/clients/${client.id}`}>
                          <Button variant="ghost" size="sm">
                            詳細
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

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
