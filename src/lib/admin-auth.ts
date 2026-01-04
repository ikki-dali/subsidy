/**
 * 管理者認証ユーティリティ
 */

import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import type { NextRequest } from 'next/server';

// JWT署名用のシークレットキー
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET must be set');
  return new TextEncoder().encode(secret);
};

// 管理者トークンの有効期限（24時間）
const ADMIN_TOKEN_EXPIRY = '24h';

export type AdminRole = 'admin' | 'super_admin';

export interface AdminTokenPayload {
  adminId: string;
  email: string;
  name: string;
  role: AdminRole;
  isAdmin: true;
  iat?: number;
  exp?: number;
}

/**
 * パスワードをハッシュ化
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

/**
 * パスワードを検証
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * 管理者用JWTトークンを生成
 */
export async function createAdminToken(payload: {
  adminId: string;
  email: string;
  name: string;
  role: AdminRole;
}): Promise<string> {
  const secret = getJwtSecret();
  
  const token = await new SignJWT({
    adminId: payload.adminId,
    email: payload.email,
    name: payload.name,
    role: payload.role,
    isAdmin: true,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ADMIN_TOKEN_EXPIRY)
    .sign(secret);

  return token;
}

/**
 * 管理者JWTトークンを検証
 */
export async function verifyAdminToken(token: string): Promise<AdminTokenPayload | null> {
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });
    
    // isAdmin フラグがtrueでない場合は無効
    if (payload.isAdmin !== true) {
      return null;
    }
    
    return {
      adminId: payload.adminId as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as AdminRole,
      isAdmin: true,
      iat: payload.iat,
      exp: payload.exp,
    };
  } catch (error) {
    console.error('Admin token verification failed:', error);
    return null;
  }
}

/**
 * トークンから管理者IDを取得
 */
export async function getAdminIdFromToken(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  
  const payload = await verifyAdminToken(token);
  return payload?.adminId || null;
}

/**
 * リクエストからadminトークンを検証してペイロードを取得
 */
export async function getAdminFromRequest(request: NextRequest): Promise<AdminTokenPayload | null> {
  const token = request.cookies.get('admin_token')?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

/**
 * 初期管理者作成用（環境変数から）
 */
export async function getInitialAdminCredentials(): Promise<{
  email: string;
  password: string;
} | null> {
  const email = process.env.ADMIN_INITIAL_EMAIL;
  const password = process.env.ADMIN_INITIAL_PASSWORD;
  
  if (!email || !password) {
    return null;
  }
  
  return { email, password };
}
