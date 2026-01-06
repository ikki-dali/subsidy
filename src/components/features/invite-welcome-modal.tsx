'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Gift, ArrowRight, X, Sparkles, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export function InviteWelcomeModal() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const inviteCode = searchParams.get('invite');

  useEffect(() => {
    if (!inviteCode) return;

    // 招待コードをバリデーション
    const validateInviteCode = async () => {
      try {
        const res = await fetch(`/api/invitations/validate?code=${inviteCode}`);
        const data = await res.json();
        
        if (data.valid) {
          // 有効な場合のみsessionStorageに保存してモーダル表示
          sessionStorage.setItem('invite_code', inviteCode);
          setIsOpen(true);
        } else {
          // 無効な場合はsessionStorageから削除して使用済みページへ
          sessionStorage.removeItem('invite_code');
          router.replace('/invite-used');
        }
      } catch (error) {
        console.error('Failed to validate invite code:', error);
        toast.error('招待コードの検証に失敗しました');
      }
    };

    validateInviteCode();
  }, [inviteCode, router]);

  const handleRegister = () => {
    router.push(`/onboarding?invite=${inviteCode}`);
  };

  const handleClose = () => {
    setIsOpen(false);
    // URLからinviteパラメータを削除
    router.replace('/', { scroll: false });
  };

  if (!isOpen || !inviteCode) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* オーバーレイ */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* モーダル */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* 閉じるボタン */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 transition-colors z-10"
        >
          <X className="h-5 w-5 text-slate-400" />
        </button>

        {/* ヘッダー部分 */}
        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-6 py-10 text-center relative overflow-hidden">
          {/* 背景エフェクト */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-1/4 w-32 h-32 bg-blue-400/20 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-indigo-400/20 rounded-full blur-2xl"></div>
          </div>
          
          <div className="relative">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur rounded-full mb-4">
              <Gift className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              招待を受けました！
            </h2>
            <p className="text-blue-100 text-sm">
              補助金ナビへようこそ
            </p>
          </div>
        </div>

        {/* コンテンツ部分 */}
        <div className="px-6 py-6">
          <p className="text-slate-600 text-center mb-6">
            あなたは補助金ナビに招待されました。<br />
            登録して、事業に最適な補助金を見つけましょう。
          </p>

          {/* 特典リスト */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
              <span className="text-sm text-slate-700">全国2,200件以上の補助金を検索</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
              <span className="text-sm text-slate-700">あなたに合った補助金をおすすめ</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
              <span className="text-sm text-slate-700">締切アラートでチャンスを逃さない</span>
            </div>
          </div>

          {/* 登録ボタン */}
          <Button 
            onClick={handleRegister}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-6 text-lg font-semibold rounded-xl shadow-lg"
          >
            <Sparkles className="h-5 w-5 mr-2" />
            無料で登録する
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>

          <p className="text-xs text-slate-400 text-center mt-4">
            登録は無料です・1分で完了
          </p>
        </div>
      </div>
    </div>
  );
}

