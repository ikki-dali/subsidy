import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// 認証不要のパス
// NOTE: startsWith('/') は常に true になるため、'/' は「完全一致」で扱う
const PUBLIC_PATHS_EXACT = [
  '/', // ホームのみ公開
  '/search',
  '/onboarding',
  '/login',
  '/forgot-password', // パスワードリセットリクエスト
  '/reset-password', // パスワードリセット実行
  '/admin/login', // 管理者ログインは公開
];

const PUBLIC_PATH_PREFIXES = [
  '/subsidies', // 詳細ページ含む
  '/api/companies',
  '/api/auth', // ログイン・パスワードリセット含む
  '/api/health',
  '/api/subsidies', // 補助金APIは公開
  '/api/interests',
  '/api/admin/auth', // 管理者認証APIは公開
  '/_next',
  '/favicon.ico',
  '/fonts',
];

// 管理者専用パス
const ADMIN_PATH_PREFIX = '/admin';
const ADMIN_API_PREFIX = '/api/admin';

// 静的ファイルのパターン
const STATIC_FILE_PATTERNS = [
  /\.(ico|png|jpg|jpeg|gif|svg|webp|css|js|woff|woff2|ttf|eot)$/i,
];

// JWT検証用のシークレットキー取得
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return null;
  }
  return new TextEncoder().encode(secret);
};

// トークン検証
async function verifyAuthToken(token: string): Promise<boolean> {
  try {
    const secret = getJwtSecret();
    if (!secret) return false;

    await jwtVerify(token, secret, { algorithms: ['HS256'] });
    return true;
  } catch {
    return false;
  }
}

// 管理者トークン検証
async function verifyAdminAuthToken(token: string): Promise<boolean> {
  try {
    const secret = getJwtSecret();
    if (!secret) return false;

    const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });
    // isAdmin フラグがtrueであることを確認
    return payload.isAdmin === true;
  } catch {
    return false;
  }
}

// 管理者パスかどうか判定
function isAdminPath(pathname: string): boolean {
  return pathname.startsWith(ADMIN_PATH_PREFIX) || pathname.startsWith(ADMIN_API_PREFIX);
}

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS_EXACT.includes(pathname)) return true;
  return PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 静的ファイルはスキップ
  if (STATIC_FILE_PATTERNS.some(pattern => pattern.test(pathname))) {
    return NextResponse.next();
  }

  // 公開パスはスキップ（ただしx-pathnameは設定）
  if (isPublicPath(pathname)) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-pathname', pathname);
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // 管理者パスの場合は別の認証ロジック
  if (isAdminPath(pathname)) {
    const adminToken = request.cookies.get('admin_token')?.value;

    if (!adminToken) {
      // APIの場合は401を返す
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      // ページの場合はログインへリダイレクト
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      return NextResponse.redirect(url);
    }

    const isValidAdmin = await verifyAdminAuthToken(adminToken);

    if (!isValidAdmin) {
      // 無効なトークンの場合
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      const response = NextResponse.redirect(url);
      response.cookies.delete('admin_token');
      return response;
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-pathname', pathname);
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // 一般ユーザー認証トークンを取得
  const token = request.cookies.get('auth_token')?.value;

  // トークンがない場合
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = '/onboarding';
    return NextResponse.redirect(url);
  }

  // トークンを検証
  const isValid = await verifyAuthToken(token);

  if (!isValid) {
    // 無効なトークンの場合、Cookieを削除してオンボーディングへ
    const url = request.nextUrl.clone();
    url.pathname = '/onboarding';
    const response = NextResponse.redirect(url);
    response.cookies.delete('auth_token');
    return response;
  }

  // 認証済みの場合はそのまま通す
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
