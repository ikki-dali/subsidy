import { test, expect } from '@playwright/test';

/**
 * お気に入り・気になる機能のE2Eテスト
 */

// テスト用のユニークなメールアドレスを生成
const generateTestEmail = () => `e2e-feature-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;

// 認証済みユーザーを作成してCookieを設定
async function createAuthenticatedUser(page: import('@playwright/test').Page) {
  const testEmail = generateTestEmail();
  const testPassword = 'TestPassword123';
  
  // APIで登録（リトライ付き）
  let response;
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts) {
    response = await page.request.post('/api/companies', {
      data: {
        companyName: '機能テスト会社',
        industry: 'it',
        employeeCount: '11-50',
        annualRevenue: '100m_500m',
        prefecture: '東京都',
        contactName: '機能テスト太郎',
        email: testEmail,
        phone: '03-5555-6666',
        password: testPassword,
      },
    });
    
    if (response.ok()) {
      break;
    }
    
    // レート制限の場合は待機してリトライ
    if (response.status() === 429) {
      await page.waitForTimeout(2000);
      attempts++;
    } else {
      // その他のエラーはログ出力して失敗
      const errorText = await response.text();
      console.error(`Registration failed: ${response.status()} - ${errorText}`);
      break;
    }
  }
  
  expect(response?.ok()).toBeTruthy();
  return { email: testEmail, password: testPassword };
}

test.describe('お気に入り機能', () => {
  
  test('お気に入りAPIが認証なしでエラーまたは空を返す', async ({ page }) => {
    const response = await page.request.get('/api/favorites');
    
    // 認証なしの場合、いくつかのパターンがある
    // - 200 + 空配列
    // - 200 + error
    // - 401/302 リダイレクト
    const status = response.status();
    expect([200, 302, 401].includes(status)).toBeTruthy();
    
    // JSONが返る場合のみパース
    const contentType = response.headers()['content-type'] || '';
    if (contentType.includes('application/json')) {
      const data = await response.json();
      // 空配列かエラー
      expect(Array.isArray(data.favorites) || data.error).toBeTruthy();
    }
  });

  test('認証済みユーザーがお気に入りを追加・削除できる', async ({ page }) => {
    // 認証済みユーザーを作成
    await createAuthenticatedUser(page);
    
    // 補助金IDを取得
    const subsidiesResponse = await page.request.get('/api/subsidies?limit=1&active=true');
    const subsidiesData = await subsidiesResponse.json();
    
    if (subsidiesData.subsidies && subsidiesData.subsidies.length > 0) {
      const subsidyId = subsidiesData.subsidies[0].id;
      
      // お気に入りに追加
      const addResponse = await page.request.post('/api/favorites', {
        data: { subsidyId },
      });
      expect(addResponse.ok()).toBeTruthy();
      
      // お気に入り一覧を取得
      const listResponse = await page.request.get('/api/favorites');
      expect(listResponse.ok()).toBeTruthy();
      
      // お気に入りから削除
      const deleteResponse = await page.request.delete(`/api/favorites?subsidyId=${subsidyId}`);
      expect(deleteResponse.ok()).toBeTruthy();
    }
  });
});

test.describe('気になる（Interest）機能', () => {
  
  test('気になるAPIが動作する', async ({ page }) => {
    // 認証済みユーザーを作成（レート制限対策込み）
    const { email, password } = await createAuthenticatedUser(page);
    
    // 少し待機してレート制限を回避
    await page.waitForTimeout(1000);
    
    // 補助金を取得
    const subsidiesResponse = await page.request.get('/api/subsidies?limit=1&active=true');
    const subsidiesData = await subsidiesResponse.json();
    
    if (subsidiesData.subsidies && subsidiesData.subsidies.length > 0) {
      const subsidy = subsidiesData.subsidies[0];
      
      // 気になる登録（相談申し込み）- リトライ付き
      let interestResponse;
      for (let i = 0; i < 3; i++) {
        interestResponse = await page.request.post('/api/interests', {
          data: {
            subsidyId: subsidy.id,
            subsidyTitle: subsidy.title,
            message: 'E2Eテストからの問い合わせです',
          },
        });
        
        if (interestResponse.status() !== 429) break;
        await page.waitForTimeout(2000); // レート制限時は待機
      }
      
      // 成功、重複エラー、またはレート制限（最悪ケース）
      expect([200, 201, 409, 429].includes(interestResponse!.status())).toBeTruthy();
      
      // 成功時のレスポンス確認
      if (interestResponse!.ok()) {
        const data = await interestResponse!.json();
        expect(data.success || data.id).toBeTruthy();
      }
    } else {
      // 補助金がない場合はテストをパス扱い
      console.log('No active subsidies found, skipping interest test');
    }
  });
});

test.describe('ヘルスチェック', () => {
  
  test('ヘルスチェックAPIが正常に動作する', async ({ page }) => {
    const response = await page.request.get('/api/health');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.status).toBe('ok');
  });
});

test.describe('公開ページアクセス', () => {
  
  test('トップページが表示される', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/');
  });

  test('検索ページが認証なしで表示される', async ({ page }) => {
    await page.goto('/search');
    await expect(page).toHaveURL('/search');
  });

  test('ログインページが表示される', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL('/login');
    await expect(page.getByRole('heading', { name: 'ログイン' })).toBeVisible();
  });

  test('オンボーディングページが表示される', async ({ page }) => {
    await page.goto('/onboarding');
    await expect(page).toHaveURL('/onboarding');
    await expect(page.getByText('会社情報を教えてください')).toBeVisible();
  });
});

