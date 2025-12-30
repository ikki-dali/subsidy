'use client';

import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// VAPID公開鍵（環境変数から取得、なければダミー値）
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushNotificationToggle() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    // ブラウザサポートチェック
    const checkSupport = async () => {
      const supported = 
        'serviceWorker' in navigator && 
        'PushManager' in window &&
        'Notification' in window;
      
      setIsSupported(supported);
      
      if (supported) {
        setPermission(Notification.permission);
        
        // 既存のService Worker登録を確認
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          const swRegistration = registrations.find(r => r.active?.scriptURL.includes('sw.js'));
          
          if (swRegistration) {
            const subscription = await swRegistration.pushManager.getSubscription();
            setIsSubscribed(!!subscription);
          }
        } catch (error) {
          console.error('Failed to check subscription:', error);
        }
      }
      
      setIsLoading(false);
    };

    checkSupport();
  }, []);

  const handleToggle = async (enabled: boolean) => {
    // auth_token は httpOnly のため、APIで認証状態を確認する
    try {
      const authRes = await fetch('/api/companies');
      if (!authRes.ok) {
        toast.error('認証状態の確認に失敗しました');
        return;
      }
      const authData = await authRes.json();
      if (!authData?.authenticated) {
        toast.error('ログインが必要です');
        return;
      }
    } catch {
      toast.error('認証状態の確認に失敗しました');
      return;
    }

    if (!VAPID_PUBLIC_KEY) {
      toast.error('プッシュ通知の設定が完了していません（VAPID鍵が未設定）');
      return;
    }

    setIsLoading(true);

    try {
      if (enabled) {
        // 通知許可をリクエスト
        const perm = await Notification.requestPermission();
        setPermission(perm);

        if (perm !== 'granted') {
          toast.error('通知が許可されていません。ブラウザの設定を確認してください。');
          setIsLoading(false);
          return;
        }

        // Service Workerを登録
        const registration = await navigator.serviceWorker.register('/sw.js');
        await registration.update();

        // プッシュ通知を購読
        const keyArray = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: keyArray.buffer as ArrayBuffer,
        });

        // サーバーに購読情報を送信
        const p256dh = subscription.getKey('p256dh');
        const auth = subscription.getKey('auth');

        if (!p256dh || !auth) {
          throw new Error('Failed to get subscription keys');
        }

        const response = await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
            p256dh: btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(p256dh)))),
            auth: btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(auth)))),
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to save subscription');
        }

        setIsSubscribed(true);
        toast.success('プッシュ通知を有効にしました');
      } else {
        // 購読を解除
        const registrations = await navigator.serviceWorker.getRegistrations();
        const swRegistration = registrations.find(r => r.active?.scriptURL.includes('sw.js'));

        if (swRegistration) {
          const subscription = await swRegistration.pushManager.getSubscription();
          
          if (subscription) {
            await subscription.unsubscribe();

            // サーバーから購読情報を削除
            await fetch('/api/push/subscribe', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                endpoint: subscription.endpoint,
              }),
            });
          }
        }

        setIsSubscribed(false);
        toast.success('プッシュ通知を無効にしました');
      }
    } catch (error) {
      console.error('Push notification toggle error:', error);
      toast.error('エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl text-sm text-muted-foreground">
        <BellOff className="h-5 w-5" />
        <span>このブラウザはプッシュ通知に対応していません</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4 p-4 bg-white rounded-xl border">
      <div className="flex items-center gap-3">
        {isSubscribed ? (
          <div className="p-2 rounded-lg bg-blue-100">
            <Bell className="h-5 w-5 text-blue-600" />
          </div>
        ) : (
          <div className="p-2 rounded-lg bg-slate-100">
            <BellOff className="h-5 w-5 text-slate-500" />
          </div>
        )}
        <div>
          <Label htmlFor="push-toggle" className="font-medium cursor-pointer">
            プッシュ通知
          </Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            締切が近づいたらお知らせします
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        <Switch
          id="push-toggle"
          checked={isSubscribed}
          onCheckedChange={handleToggle}
          disabled={isLoading || permission === 'denied'}
        />
      </div>
    </div>
  );
}
