import { InvitationGenerator } from '@/components/features/invitation-generator';
import { Banknote, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: '友達を招待 | 補助金ナビ',
  description: '招待リンクを生成して、同僚や知り合いの企業に補助金ナビを紹介しましょう',
};

export default function InvitePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* ヘッダー */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Banknote className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              補助金ナビ
            </span>
          </Link>
          <Link 
            href="/" 
            className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            戻る
          </Link>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <InvitationGenerator />
      </main>
    </div>
  );
}
