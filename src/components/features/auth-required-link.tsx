'use client';

import { useRouter } from 'next/navigation';
import { ReactNode, useState } from 'react';

async function isAuthenticated(): Promise<boolean> {
  try {
    const res = await fetch('/api/companies', { method: 'GET' });
    if (!res.ok) return false;
    const data = await res.json();
    return data?.authenticated === true;
  } catch {
    return false;
  }
}

interface AuthRequiredLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
}

export function AuthRequiredLink({ href, children, className }: AuthRequiredLinkProps) {
  const router = useRouter();
  const [checking, setChecking] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (checking) return;
    setChecking(true);

    const authed = await isAuthenticated();
    setChecking(false);

    if (authed) {
      router.push(href);
      return;
    }

    // 未認証の場合はオンボーディングへ（戻り先をセッションに保存）
    try {
      sessionStorage.setItem('redirect_after_onboarding', href);
    } catch {
      // ignore
    }
      router.push('/onboarding');
  };

  return (
    <a href={href} onClick={handleClick} className={className} aria-disabled={checking}>
      {children}
    </a>
  );
}

