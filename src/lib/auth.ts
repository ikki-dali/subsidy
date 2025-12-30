/**
 * JWT認証ユーティリティ
 * 
 * auth_token Cookieを署名・検証するためのJWTライブラリ
 */

import { SignJWT, jwtVerify } from 'jose';

// JWT署名用のシークレットキー
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET must be set');
  return new TextEncoder().encode(secret);
};

// トークンの有効期限（7日間）
const TOKEN_EXPIRY = '7d';

export interface TokenPayload {
  companyId: string;
  companyName: string;
  iat?: number;
  exp?: number;
}

/**
 * JWTトークンを生成
 */
export async function createToken(payload: { companyId: string; companyName: string }): Promise<string> {
  const secret = getJwtSecret();
  
  const token = await new SignJWT({
    companyId: payload.companyId,
    companyName: payload.companyName,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(secret);

  return token;
}

/**
 * JWTトークンを検証
 */
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });
    
    return {
      companyId: payload.companyId as string,
      companyName: payload.companyName as string,
      iat: payload.iat,
      exp: payload.exp,
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * トークンからcompanyIdを取得（簡易版）
 */
export async function getCompanyIdFromToken(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  
  const payload = await verifyToken(token);
  return payload?.companyId || null;
}

