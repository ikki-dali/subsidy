import { cookies, headers } from 'next/headers';
import { AdminSidebar } from '@/components/admin/sidebar';
import { verifyAdminToken } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: '管理画面 - 補助金ナビ',
  description: '補助金ナビ管理画面',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  
  // 現在のパスを取得
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || headersList.get('x-invoke-path') || '';
  const isLoginPage = pathname.includes('/admin/login');

  // ログインページの場合はシンプルなレイアウト
  if (isLoginPage || !token) {
    return <>{children}</>;
  }

  // トークンがある場合は検証して管理者名を取得
  let adminName: string | undefined;
  const payload = await verifyAdminToken(token);
  if (payload) {
    adminName = payload.name;
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <AdminSidebar adminName={adminName} />
      <main className="pl-64 transition-all duration-300">
        <div className="min-h-screen p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
