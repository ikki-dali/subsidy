'use client';

import { useEffect } from 'react';
import { getCookie } from '@/lib/utils';

type HistoryTrackerProps = {
  subsidyId: string;
};

export function HistoryTracker({ subsidyId }: HistoryTrackerProps) {
  useEffect(() => {
    const trackHistory = async () => {
      // 認証チェック
      const companyId = getCookie('company_id');
      if (!companyId) return;

      try {
        await fetch('/api/history', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ subsidyId }),
        });
      } catch (error) {
        // 履歴保存に失敗してもユーザー体験に影響しないため、エラーは無視
        console.error('Failed to track history:', error);
      }
    };

    trackHistory();
  }, [subsidyId]);

  // このコンポーネントは何もレンダリングしない
  return null;
}



