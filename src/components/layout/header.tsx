'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Banknote, UserPlus } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/recommended', label: 'おすすめ' },
  { href: '/search', label: '検索' },
  { href: '/favorites', label: 'お気に入り' },
  { href: '/history', label: '履歴' },
];

export function Header() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Banknote className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
          <span className="text-base sm:text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            足立区補助金ナビ
          </span>
        </Link>
        {/* デスクトップ用ナビ - モバイルではBottomNavを使用 */}
        <nav className="hidden md:flex gap-2 items-center">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm px-3 py-1.5 rounded-full transition-colors ${
                isActive(item.href)
                  ? 'text-foreground font-medium bg-blue-50'
                  : 'text-muted-foreground hover:text-foreground hover:bg-slate-100'
              }`}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/invite"
            className={`ml-2 p-2 rounded-full transition-colors ${
              isActive('/invite')
                ? 'text-blue-600 bg-blue-50'
                : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50'
            }`}
            title="友達を招待"
          >
            <UserPlus className="h-5 w-5" />
          </Link>
        </nav>
        
        {/* モバイル用招待ボタン */}
        <Link
          href="/invite"
          className="md:hidden p-2 rounded-full text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          title="友達を招待"
        >
          <UserPlus className="h-5 w-5" />
        </Link>
      </div>
    </header>
  );
}

