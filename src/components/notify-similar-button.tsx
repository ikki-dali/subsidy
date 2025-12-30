'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Bell, BellOff, Loader2, Check } from 'lucide-react';

interface NotifySimilarButtonProps {
  subsidyId: string;
  subsidyTitle: string;
  subsidyCategory?: string;
  subsidyIndustry?: string[];
  isNotifying?: boolean;
  onSuccess?: () => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
}

export function NotifySimilarButton({
  subsidyId,
  subsidyTitle,
  subsidyCategory,
  subsidyIndustry,
  isNotifying = false,
  onSuccess,
  variant = 'outline',
  size = 'default',
  showLabel = true,
}: NotifySimilarButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifying, setNotifying] = useState(isNotifying);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/interests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subsidyId,
          subsidyTitle,
          subsidyUrl: window.location.href,
          type: 'notify_similar',
          note: `この補助金に類似した案件が出たら通知希望\n業種: ${subsidyIndustry?.join(', ') || '指定なし'}\nカテゴリ: ${subsidyCategory || '指定なし'}`,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '登録に失敗しました');
      }

      setNotifying(true);
      setSuccess(true);
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
      }, 1500);
      onSuccess?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '登録に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/interests?subsidyId=${subsidyId}&type=notify_similar`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '解除に失敗しました');
      }

      setNotifying(false);
      onSuccess?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '解除に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  if (notifying) {
    return (
      <Button
        variant="secondary"
        size={size}
        onClick={handleRemove}
        disabled={loading}
        className="gap-2 bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-300"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Bell className="h-4 w-4 fill-amber-500 text-amber-500" />
        )}
        {showLabel && '通知設定済み'}
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className="gap-2">
          <BellOff className="h-4 w-4" />
          {showLabel && '似た案件を通知'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>似た案件の通知を受け取る</DialogTitle>
          <DialogDescription>
            「{subsidyTitle}」に似た補助金が募集開始されたときにお知らせします。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Bell className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">通知条件</p>
                <ul className="list-disc list-inside space-y-1 text-amber-700">
                  {subsidyIndustry && subsidyIndustry.length > 0 && (
                    <li>業種: {subsidyIndustry.join(', ')}</li>
                  )}
                  {subsidyCategory && <li>カテゴリ: {subsidyCategory}</li>}
                  <li>類似のキーワード・金額帯</li>
                </ul>
              </div>
            </div>
          </div>
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          {success && (
            <div className="flex items-center gap-2 text-green-600">
              <Check className="h-4 w-4" />
              <span className="text-sm">通知設定を登録しました</span>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            キャンセル
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                登録中...
              </>
            ) : (
              <>
                <Bell className="mr-2 h-4 w-4" />
                通知を設定する
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
