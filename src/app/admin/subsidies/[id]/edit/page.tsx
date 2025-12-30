'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Save,
  Loader2,
  ExternalLink,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

type Subsidy = {
  id: string;
  jgrants_id: string;
  title: string;
  catch_phrase?: string;
  description?: string;
  max_amount: number | null;
  subsidy_rate: string | null;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  official_url: string | null;
  front_url: string | null;
  target_area: string[] | null;
  industry: string[] | null;
  created_at: string;
  updated_at: string;
};

export default function AdminSubsidyEditPage() {
  const params = useParams();
  const subsidyId = params.id as string;

  const [subsidy, setSubsidy] = useState<Subsidy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // フォーム値
  const [maxAmount, setMaxAmount] = useState('');
  const [subsidyRate, setSubsidyRate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [title, setTitle] = useState('');
  const [catchPhrase, setCatchPhrase] = useState('');

  useEffect(() => {
    async function fetchSubsidy() {
      try {
        const res = await fetch(`/api/admin/subsidies/${subsidyId}`);
        if (res.ok) {
          const data = await res.json();
          const s = data.subsidy;
          setSubsidy(s);
          setMaxAmount(s.max_amount ? s.max_amount.toLocaleString() : '');
          setSubsidyRate(s.subsidy_rate || '');
          setIsActive(s.is_active);
          setTitle(s.title || '');
          setCatchPhrase(s.catch_phrase || '');
        }
      } catch (err) {
        console.error('Failed to fetch subsidy:', err);
        setError('データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    }

    if (subsidyId) {
      fetchSubsidy();
    }
  }, [subsidyId]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      // 金額をパース
      const parsedAmount = maxAmount.trim() === ''
        ? null
        : parseInt(maxAmount.replace(/,/g, ''), 10);

      if (maxAmount.trim() !== '' && isNaN(parsedAmount as number)) {
        setError('金額は数値で入力してください');
        setSaving(false);
        return;
      }

      const res = await fetch(`/api/admin/subsidies/${subsidyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          max_amount: parsedAmount,
          subsidy_rate: subsidyRate || null,
          is_active: isActive,
          title,
          catch_phrase: catchPhrase || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || '保存に失敗しました');
        return;
      }

      setSuccess(true);
      // 3秒後にメッセージを消す
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Save error:', err);
      setError('保存中にエラーが発生しました');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-slate-500">読み込み中...</div>
    );
  }

  if (!subsidy) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 mb-4">補助金が見つかりません</p>
        <Link href="/admin/subsidies">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-1" />
            一覧に戻る
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* ヘッダー */}
      <div className="flex items-center gap-4">
        <Link href="/admin/subsidies">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-900">補助金編集</h1>
          <p className="text-sm text-slate-500 line-clamp-1">{subsidy.title}</p>
        </div>
      </div>

      {/* エラー・成功メッセージ */}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-red-700 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 rounded-lg bg-green-50 border border-green-200 flex items-center gap-2 text-green-700 text-sm">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          保存しました
        </div>
      )}

      {/* リンク */}
      <div className="flex flex-wrap gap-3">
        {subsidy.official_url && (
          <a
            href={subsidy.official_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
          >
            <ExternalLink className="h-4 w-4" />
            公式サイト
          </a>
        )}
        {subsidy.front_url && (
          <a
            href={subsidy.front_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
          >
            <ExternalLink className="h-4 w-4" />
            申請フォーム
          </a>
        )}
        <Link
          href={`/subsidies/${subsidy.jgrants_id}`}
          className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
        >
          <ExternalLink className="h-4 w-4" />
          サイト上の表示
        </Link>
      </div>

      {/* 基本情報 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">基本情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500">JグランツID</p>
              <p className="font-mono">{subsidy.jgrants_id}</p>
            </div>
            <div>
              <p className="text-slate-500">対象地域</p>
              <p>{subsidy.target_area?.join(', ') || '-'}</p>
            </div>
            <div>
              <p className="text-slate-500">募集開始</p>
              <p>{formatDate(subsidy.start_date)}</p>
            </div>
            <div>
              <p className="text-slate-500">募集終了</p>
              <p>{formatDate(subsidy.end_date)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 編集フォーム */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">編集</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">タイトル</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="catchPhrase">キャッチフレーズ</Label>
            <Textarea
              id="catchPhrase"
              value={catchPhrase}
              onChange={(e) => setCatchPhrase(e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxAmount">補助上限額（円）</Label>
              <Input
                id="maxAmount"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                placeholder="例: 5,000,000"
              />
              <p className="text-xs text-slate-500">
                カンマ区切りで入力可能です
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subsidyRate">補助率</Label>
              <Input
                id="subsidyRate"
                value={subsidyRate}
                onChange={(e) => setSubsidyRate(e.target.value)}
                placeholder="例: 1/2, 2/3, 最大75%"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <Label htmlFor="isActive" className="cursor-pointer">
              募集中
            </Label>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1" />
                  保存
                </>
              )}
            </Button>
            <Link href="/admin/subsidies">
              <Button variant="outline">キャンセル</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
