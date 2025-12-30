'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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
  FileText,
  Search,
  ExternalLink,
  Edit,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Banknote,
  Save,
  X,
  Loader2,
} from 'lucide-react';

type Subsidy = {
  id: string;
  jgrants_id: string;
  title: string;
  max_amount: number | null;
  subsidy_rate: string | null;
  is_active: boolean;
  end_date: string | null;
  official_url: string | null;
  updated_at: string;
};

const FILTER_OPTIONS = [
  { value: 'all', label: 'すべて' },
  { value: 'no_amount', label: '金額未入力' },
  { value: 'active', label: '募集中' },
  { value: 'inactive', label: '募集終了' },
];

function AdminSubsidiesPageContent() {
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get('filter') || 'all';

  const [subsidies, setSubsidies] = useState<Subsidy[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filter, setFilter] = useState(initialFilter);
  const limit = 20;

  // インライン編集用
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editRate, setEditRate] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchSubsidies = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', limit.toString());
      params.set('offset', ((page - 1) * limit).toString());
      if (search) params.set('search', search);
      if (filter && filter !== 'all') params.set('filter', filter);
      params.set('sort', 'updated_at');
      params.set('order', 'desc');

      const res = await fetch(`/api/admin/subsidies?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSubsidies(data.subsidies || []);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch subsidies:', error);
    } finally {
      setLoading(false);
    }
  }, [page, search, filter]);

  useEffect(() => {
    fetchSubsidies();
  }, [fetchSubsidies]);

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const startEditing = (subsidy: Subsidy) => {
    setEditingId(subsidy.id);
    setEditAmount(subsidy.max_amount ? subsidy.max_amount.toLocaleString() : '');
    setEditRate(subsidy.subsidy_rate || '');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditAmount('');
    setEditRate('');
  };

  const saveInline = async (subsidyId: string) => {
    setSaving(true);
    try {
      const parsedAmount = editAmount.trim() === ''
        ? null
        : parseInt(editAmount.replace(/,/g, ''), 10);

      if (editAmount.trim() !== '' && isNaN(parsedAmount as number)) {
        alert('金額は数値で入力してください');
        setSaving(false);
        return;
      }

      const res = await fetch(`/api/admin/subsidies/${subsidyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          max_amount: parsedAmount,
          subsidy_rate: editRate || null,
        }),
      });

      if (res.ok) {
        // ローカル状態を更新
        setSubsidies(prev =>
          prev.map(s =>
            s.id === subsidyId
              ? { ...s, max_amount: parsedAmount, subsidy_rate: editRate || null }
              : s
          )
        );
        cancelEditing();
      } else {
        const data = await res.json();
        alert(data.error || '保存に失敗しました');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('保存中にエラーが発生しました');
    } finally {
      setSaving(false);
    }
  };

  const formatAmount = (amount: number | null) => {
    if (amount === null) return null;
    if (amount >= 100000000) {
      return `${(amount / 100000000).toFixed(1)}億円`;
    } else if (amount >= 10000) {
      return `${(amount / 10000).toLocaleString()}万円`;
    }
    return `${amount.toLocaleString()}円`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
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
            <FileText className="h-6 w-6" />
            補助金管理
          </h1>
          <p className="text-slate-600 mt-1">
            補助金データの確認と編集
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchSubsidies}
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
                placeholder="補助金名で検索..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <Select value={filter} onValueChange={(v) => { setFilter(v); setPage(1); }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="フィルター" />
              </SelectTrigger>
              <SelectContent>
                {FILTER_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
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
                  <th className="text-left p-4 font-medium text-slate-600">補助金名</th>
                  <th className="text-left p-4 font-medium text-slate-600 hidden md:table-cell">金額</th>
                  <th className="text-left p-4 font-medium text-slate-600 hidden lg:table-cell">補助率</th>
                  <th className="text-center p-4 font-medium text-slate-600">ステータス</th>
                  <th className="text-left p-4 font-medium text-slate-600 hidden lg:table-cell">締切</th>
                  <th className="text-center p-4 font-medium text-slate-600">操作</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-500">
                      読み込み中...
                    </td>
                  </tr>
                ) : subsidies.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-500">
                      補助金が見つかりません
                    </td>
                  </tr>
                ) : (
                  subsidies.map(subsidy => (
                    <tr key={subsidy.id} className="border-b hover:bg-slate-50">
                      <td className="p-4">
                        <div className="max-w-md">
                          <p className="font-medium line-clamp-2">{subsidy.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {subsidy.official_url && (
                              <a
                                href={subsidy.official_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                              >
                                <ExternalLink className="h-3 w-3" />
                                公式サイト
                              </a>
                            )}
                            <Link
                              href={`/subsidies/${subsidy.jgrants_id}`}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              詳細ページ
                            </Link>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        {editingId === subsidy.id ? (
                          <Input
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            placeholder="例: 5,000,000"
                            className="w-32 h-8 text-sm"
                            autoFocus
                          />
                        ) : subsidy.max_amount !== null ? (
                          <div className="flex items-center gap-1">
                            <Banknote className="h-4 w-4 text-green-600" />
                            <span className="font-medium">{formatAmount(subsidy.max_amount)}</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEditing(subsidy)}
                            className="cursor-pointer hover:opacity-80 transition-opacity"
                          >
                            <Badge className="bg-red-100 text-red-700 hover:bg-red-200">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              クリックして入力
                            </Badge>
                          </button>
                        )}
                      </td>
                      <td className="p-4 hidden lg:table-cell">
                        {editingId === subsidy.id ? (
                          <Input
                            value={editRate}
                            onChange={(e) => setEditRate(e.target.value)}
                            placeholder="例: 1/2"
                            className="w-24 h-8 text-sm"
                          />
                        ) : (
                          <span className="text-sm">
                            {subsidy.subsidy_rate || '-'}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {subsidy.is_active ? (
                          <Badge className="bg-green-100 text-green-700">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            募集中
                          </Badge>
                        ) : (
                          <Badge className="bg-slate-100 text-slate-700">
                            <XCircle className="h-3 w-3 mr-1" />
                            終了
                          </Badge>
                        )}
                      </td>
                      <td className="p-4 hidden lg:table-cell text-sm text-slate-600">
                        {formatDate(subsidy.end_date)}
                      </td>
                      <td className="p-4 text-center">
                        {editingId === subsidy.id ? (
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => saveInline(subsidy.id)}
                              disabled={saving}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              {saving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Save className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={cancelEditing}
                              disabled={saving}
                              className="text-slate-500 hover:text-slate-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Link href={`/admin/subsidies/${subsidy.id}/edit`}>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4 mr-1" />
                              編集
                            </Button>
                          </Link>
                        )}
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

export default function AdminSubsidiesPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-slate-500">読み込み中...</div>}>
      <AdminSubsidiesPageContent />
    </Suspense>
  );
}
