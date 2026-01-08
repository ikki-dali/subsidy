'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Banknote, AlertCircle, Home, UserPlus } from 'lucide-react';

export default function InviteUsedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col">
      {/* ヘッダー */}
      <header className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Link href="/" className="flex items-center gap-2 w-fit">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Banknote className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              補助金ナビ
            </span>
          </Link>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full text-center">
          {/* アイコン */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-100 rounded-full mb-6">
            <AlertCircle className="h-10 w-10 text-amber-600" />
          </div>

          {/* タイトル */}
          <h1 className="text-2xl font-bold text-slate-900 mb-3">
            この招待リンクは使用済みです
          </h1>

          {/* 説明 */}
          <p className="text-slate-600 mb-8">
            この招待リンクは既に別の方が使用しています。<br />
            新しい招待リンクを発行してもらうか、<br />
            直接ご登録ください。
          </p>

          {/* ボタン */}
          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/onboarding">
                <UserPlus className="h-4 w-4 mr-2" />
                新規登録する
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                トップページへ
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}


