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
import { Heart, HeartOff, Loader2 } from 'lucide-react';

interface InterestButtonProps {
  subsidyId: string;
  subsidyTitle: string;
  subsidyUrl?: string;
  isInterested?: boolean;
  onSuccess?: () => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
}

export function InterestButton({
  subsidyId,
  subsidyTitle,
  subsidyUrl,
  isInterested = false,
  onSuccess,
  variant = 'outline',
  size = 'default',
  showLabel = true,
}: InterestButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState('');
  const [interested, setInterested] = useState(isInterested);
  const [error, setError] = useState<string | null>(null);

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
          subsidyUrl: subsidyUrl || window.location.href,
          note: note.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '送信に失敗しました');
      }

      setInterested(true);
      setOpen(false);
      setNote('');
      onSuccess?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '送信に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/interests?subsidyId=${subsidyId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '削除に失敗しました');
      }

      setInterested(false);
      onSuccess?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '削除に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  if (interested) {
    return (
      <Button
        variant="secondary"
        size={size}
        onClick={handleRemove}
        disabled={loading}
        className="gap-2"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Heart className="h-4 w-4 fill-red-500 text-red-500" />
        )}
        {showLabel && '気になるリストに追加済み'}
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className="gap-2">
          <HeartOff className="h-4 w-4" />
          {showLabel && 'この補助金が気になる'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>この補助金に興味がありますか？</DialogTitle>
          <DialogDescription>
            「{subsidyTitle}」について担当者からご連絡いたします。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="note" className="text-sm font-medium">
              コメント（任意）
            </label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="質問やご要望があればお書きください..."
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={loading}
            />
          </div>
          {error && (
            <p className="text-sm text-red-500">{error}</p>
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
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                送信中...
              </>
            ) : (
              <>
                <Heart className="mr-2 h-4 w-4" />
                相談する
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

