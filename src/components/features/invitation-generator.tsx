'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Copy, Check, Link2, UserPlus, Clock, Users, Gift, Phone, Ticket } from 'lucide-react';

type Invitation = {
  id: string;
  code: string;
  status: 'pending' | 'used' | 'expired' | 'cancelled';
  invited_email: string | null;
  expires_at: string;
  created_at: string;
  used_at: string | null;
  used_by_company_name: string | null;
};

export function InvitationGenerator() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [latestInviteUrl, setLatestInviteUrl] = useState<string | null>(null);
  const [slotsInfo, setSlotsInfo] = useState<{
    freeSlots: number;
    totalInvites: number;
    maxSlots: number;
  } | null>(null);

  // 招待一覧を取得
  const fetchInvitations = async () => {
    try {
      const res = await fetch('/api/invitations');
      if (res.ok) {
        const data = await res.json();
        setInvitations(data.invitations || []);
      }
    } catch (error) {
      console.error('Failed to fetch invitations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 無料枠情報を取得
  const fetchSlotsInfo = async () => {
    try {
      const res = await fetch('/api/consultation/slots');
      if (res.ok) {
        const data = await res.json();
        setSlotsInfo(data);
      }
    } catch (error) {
      console.error('Failed to fetch slots info:', error);
    }
  };

  useEffect(() => {
    fetchInvitations();
    fetchSlotsInfo();
  }, []);

  // 招待リンクを生成
  const createInvitation = async () => {
    setIsCreating(true);
    try {
      const res = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        const data = await res.json();
        setLatestInviteUrl(data.invitation.inviteUrl);
        toast.success('招待リンクを生成しました');
        fetchInvitations();
        
        // 自動的にクリップボードにコピー
        await navigator.clipboard.writeText(data.invitation.inviteUrl);
        setCopiedCode(data.invitation.code);
        setTimeout(() => setCopiedCode(null), 3000);
      } else {
        toast.error('招待リンクの生成に失敗しました');
      }
    } catch (error) {
      console.error('Failed to create invitation:', error);
      toast.error('エラーが発生しました');
    } finally {
      setIsCreating(false);
    }
  };

  // リンクをコピー
  const copyInviteLink = async (code: string) => {
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/?invite=${code}`;
    
    try {
      await navigator.clipboard.writeText(url);
      setCopiedCode(code);
      toast.success('リンクをコピーしました');
      setTimeout(() => setCopiedCode(null), 3000);
    } catch {
      toast.error('コピーに失敗しました');
    }
  };

  // ステータスのバッジ
  const StatusBadge = ({ status }: { status: string }) => {
    const styles = {
      pending: 'bg-blue-100 text-blue-700',
      used: 'bg-green-100 text-green-700',
      expired: 'bg-slate-100 text-slate-500',
      cancelled: 'bg-red-100 text-red-700',
    };
    const labels = {
      pending: '未使用',
      used: '使用済み',
      expired: '期限切れ',
      cancelled: 'キャンセル',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || styles.pending}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  // 残り日数を計算
  const getDaysRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  const pendingCount = invitations.filter(i => i.status === 'pending').length;
  const usedCount = invitations.filter(i => i.status === 'used').length;

  // 招待履歴ベースで計算（DBの値より招待履歴の方が正確）
  const maxSlots = 2;
  const earnedSlots = Math.min(usedCount, maxSlots); // 招待成功数から獲得した枠
  const remainingInvitesForSlots = Math.max(0, maxSlots - usedCount);

  return (
    <div className="space-y-6">
      {/* 招待特典カード */}
      <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-green-600" />
            招待特典
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-white rounded-xl border border-green-200 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-lg shrink-0">
                <Phone className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-bold text-slate-900">
                  補助金の無料相談（5,000円相当）
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  友達を1人招待するごとに、無料相談枠が1回もらえます！
                </p>
              </div>
            </div>
          </div>

          {/* 現在の状況と予約ボタン */}
          {slotsInfo && (
            <div className="p-4 bg-white rounded-xl border border-green-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Ticket className="h-5 w-5 text-green-600" />
                  <span className="text-slate-700">
                    現在の無料枠: <span className="font-bold text-lg text-green-700">{slotsInfo.freeSlots}回</span>
                  </span>
                </div>
              </div>
              {slotsInfo.freeSlots > 0 ? (
                <Button 
                  asChild
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                >
                  <a href="/consultation">
                    <Phone className="h-4 w-4 mr-2" />
                    無料相談を予約する
                  </a>
                </Button>
              ) : (
                <p className="text-sm text-slate-500 text-center">
                  友達を招待して無料相談枠をゲットしよう！
                </p>
              )}
            </div>
          )}

          {/* 進捗表示 */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">招待達成状況（最大{maxSlots}枠）</span>
              <span className="text-slate-900 font-medium">
                {usedCount}人招待済み → {earnedSlots}枠獲得
              </span>
            </div>
            <div className="h-2 bg-white rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all"
                style={{ width: `${Math.min(100, (usedCount / maxSlots) * 100)}%` }}
              />
            </div>
            {remainingInvitesForSlots > 0 ? (
              <p className="text-xs text-slate-500">
                あと{remainingInvitesForSlots}人招待で、さらに無料枠がもらえます
              </p>
            ) : (
              <p className="text-xs text-green-600 font-medium">
                🎉 最大枠を達成しました！
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 招待リンク生成カード */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-blue-600" />
            友達を招待
          </CardTitle>
          <CardDescription>
            招待リンクを生成して、同僚や知り合いの企業に補助金ナビを紹介しましょう
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={createInvitation} 
            disabled={isCreating}
            className="w-full"
          >
            {isCreating ? (
              <>生成中...</>
            ) : (
              <>
                <Link2 className="h-4 w-4 mr-2" />
                招待リンクを生成
              </>
            )}
          </Button>

          {latestInviteUrl && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800 mb-2">招待リンクを生成しました（クリップボードにコピー済み）</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-white px-2 py-1 rounded border truncate">
                  {latestInviteUrl}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(latestInviteUrl);
                    toast.success('コピーしました');
                  }}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {/* 統計 */}
          <div className="flex gap-4 pt-2">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Clock className="h-4 w-4" />
              <span>有効な招待: {pendingCount}件</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Users className="h-4 w-4" />
              <span>招待済み: {usedCount}人</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 招待履歴 */}
      {!isLoading && invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">招待履歴</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invitations.map((inv) => (
                <div 
                  key={inv.id} 
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono text-slate-600">{inv.code}</code>
                      <StatusBadge status={inv.status} />
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {inv.status === 'used' && inv.used_by_company_name ? (
                        <span className="text-green-600">
                          {inv.used_by_company_name} が登録
                        </span>
                      ) : inv.status === 'pending' ? (
                        <span>残り {getDaysRemaining(inv.expires_at)} 日</span>
                      ) : (
                        <span>
                          {new Date(inv.created_at).toLocaleDateString('ja-JP')} 作成
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {inv.status === 'pending' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyInviteLink(inv.code)}
                    >
                      {copiedCode === inv.code ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
