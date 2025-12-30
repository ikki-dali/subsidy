'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Sparkles, Heart, History } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', icon: Home, label: 'ホーム' },
  { href: '/search', icon: Search, label: '検索' },
  { href: '/recommended', icon: Sparkles, label: 'おすすめ' },
  { href: '/favorites', icon: Heart, label: 'お気に入り' },
  { href: '/history', icon: History, label: '履歴' },
];

export function BottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  // オンボーディング・ログインページでは非表示
  if (pathname.startsWith('/onboarding') || pathname.startsWith('/login')) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 md:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full py-2 transition-colors ${
                active
                  ? 'text-blue-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon 
                className={`h-6 w-6 mb-1 ${active ? 'fill-blue-100' : ''}`}
                strokeWidth={active ? 2.5 : 2}
              />
              <span className={`text-xs ${active ? 'font-semibold' : 'font-medium'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

