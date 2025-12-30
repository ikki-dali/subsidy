'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Bell,
  Users,
  FileText,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Banknote,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const NAV_ITEMS = [
  {
    label: 'ダッシュボード',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    label: '通知・リクエスト',
    href: '/admin/interests',
    icon: Bell,
  },
  {
    label: 'クライアント管理',
    href: '/admin/clients',
    icon: Users,
  },
  {
    label: '補助金管理',
    href: '/admin/subsidies',
    icon: FileText,
  },
];

type AdminSidebarProps = {
  adminName?: string;
};

export function AdminSidebar({ adminName }: AdminSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    window.location.href = '/admin/login';
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-slate-900 text-white transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* ヘッダー */}
      <div className="flex h-16 items-center justify-between border-b border-slate-700 px-4">
        {!collapsed && (
          <Link href="/admin" className="flex items-center gap-2">
            <Banknote className="h-6 w-6 text-blue-400" />
            <span className="font-semibold">補助金ナビ</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="text-slate-400 hover:text-white hover:bg-slate-800"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* ナビゲーション */}
      <nav className="flex flex-col gap-1 p-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || 
            (item.href !== '/admin' && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* フッター */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-slate-700 p-3">
        {!collapsed && adminName && (
          <div className="mb-3 px-3 text-sm text-slate-400 truncate">
            {adminName}
          </div>
        )}
        <Button
          variant="ghost"
          onClick={handleLogout}
          className={cn(
            'w-full text-slate-300 hover:text-white hover:bg-slate-800',
            collapsed ? 'justify-center px-2' : 'justify-start gap-3 px-3'
          )}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span>ログアウト</span>}
        </Button>
      </div>
    </aside>
  );
}
