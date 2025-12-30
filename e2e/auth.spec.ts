import { test, expect } from '@playwright/test';

/**
 * 認証フローのE2Eテスト
 */

// テスト用のユニークなメールアドレスを生成
const generateTestEmail = () => `e2e-auth-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;

// レート制限対策のヘルパー
async function postWithRetry(
  page: import('@playwright/test').Page,
  url: string,
  data: object,
  maxAttempts = 3
) {
  let response;
  for (let i = 0; i < maxAttempts; i++) {
    response = await page.request.post(url, { data });
    if (response.status() !== 429) break;
    await page.waitForTimeout(2000); // レート制限時は2秒待機
  }
  return response!;
}

test.describe('認証フロー', () => {
  
  test('新規登録APIが正常に動作する', async ({ page }) => {
    const testEmail = generateTestEmail();
    
    // APIで新規登録（レート制限対策付き）
    const response = await postWithRetry(page, '/api/companies', {
      companyName: 'E2Eテスト株式会社',
      industry: 'manufacturing',
      employeeCount: '1-10',
      annualRevenue: 'under_50m',
      prefecture: '東京都',
      contactName: 'テスト担当者',
      email: testEmail,
      phone: '03-9999-8888',
      password: 'TestPassword123',
    });
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBeTruthy();
    expect(data.company.name).toBe('E2Eテスト株式会社');
  });

  test('オンボーディングページが表示される', async ({ page }) => {
    await page.goto('/onboarding');
    
    // ステップ1の画面が表示される
    await expect(page.getByText('会社情報を教えてください')).toBeVisible();
    await expect(page.getByPlaceholder('株式会社サンプル')).toBeVisible();
    await expect(page.getByRole('button', { name: '次へ' })).toBeVisible();
  });

  test('ログインが正常に動作する', async ({ page }) => {
    const testEmail = generateTestEmail();
    const testPassword = 'SecurePassword456';
    
    // 先にAPIで登録（レート制限対策付き）
    const response = await postWithRetry(page, '/api/companies', {
      companyName: 'ログインテスト会社',
      industry: 'it',
      employeeCount: '11-50',
      annualRevenue: '50m_100m',
      prefecture: '大阪府',
      contactName: 'ログイン太郎',
      email: testEmail,
      phone: '06-1111-2222',
      password: testPassword,
    });
    expect(response.ok()).toBeTruthy();
    
    // ログインページへ
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'ログイン' })).toBeVisible();
    
    // ログイン
    await page.getByPlaceholder('example@company.com').fill(testEmail);
    await page.getByPlaceholder('••••••••').fill(testPassword);
    await page.getByRole('button', { name: 'ログイン' }).click();
    
    // ログイン成功後、トップページにリダイレクト
    await expect(page).toHaveURL('/');
  });

  test('間違ったパスワードでログインできない', async ({ page }) => {
    const testEmail = generateTestEmail();
    
    // 先にAPIで登録（レート制限対策付き）
    await postWithRetry(page, '/api/companies', {
      companyName: '間違いパスワードテスト会社',
      industry: 'retail',
      employeeCount: '1-10',
      annualRevenue: 'under_50m',
      prefecture: '神奈川県',
      contactName: '間違い太郎',
      email: testEmail,
      phone: '045-1111-2222',
      password: 'CorrectPassword789',
    });
    
    // ログインページへ
    await page.goto('/login');
    
    // 間違ったパスワードでログイン試行
    await page.getByPlaceholder('example@company.com').fill(testEmail);
    await page.getByPlaceholder('••••••••').fill('WrongPassword');
    await page.getByRole('button', { name: 'ログイン' }).click();
    
    // エラーメッセージが表示される
    await expect(page.getByText('メールアドレスまたはパスワードが正しくありません')).toBeVisible();
    
    // ログインページに留まる
    await expect(page).toHaveURL('/login');
  });

  test('未登録のメールアドレスでログインできない', async ({ page }) => {
    await page.goto('/login');
    
    await page.getByPlaceholder('example@company.com').fill('nonexistent@example.com');
    await page.getByPlaceholder('••••••••').fill('SomePassword123');
    await page.getByRole('button', { name: 'ログイン' }).click();
    
    // エラーメッセージが表示される
    await expect(page.getByText('メールアドレスまたはパスワードが正しくありません')).toBeVisible();
  });

  test('パスワードが8文字未満だとAPIで登録できない', async ({ page }) => {
    const testEmail = generateTestEmail();
    
    // 短いパスワードでAPI登録を試行（レート制限対策付き）
    const response = await postWithRetry(page, '/api/companies', {
      companyName: '短いパスワードテスト会社',
      industry: 'manufacturing',
      employeeCount: '1-10',
      annualRevenue: 'under_50m',
      prefecture: '東京都',
      contactName: '短い太郎',
      email: testEmail,
      phone: '03-0000-0000',
      password: 'short', // 5文字
    });
    
    // 400エラーが返る
    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('パスワード');
  });
});

test.describe('パスワードリセット', () => {
  
  test('パスワードリセットリクエストページが表示される', async ({ page }) => {
    await page.goto('/forgot-password');
    
    await expect(page).toHaveURL('/forgot-password');
    await expect(page.getByRole('heading', { name: 'パスワードリセット' })).toBeVisible();
    // メールアドレス入力欄（プレースホルダーで識別）
    await expect(page.getByRole('textbox', { name: /example@company.com/ })).toBeVisible();
  });

  test('パスワードリセットリクエストAPIが動作する', async ({ page }) => {
    // 存在しないメールアドレスでも成功レスポンスを返す（セキュリティ対策）
    const response = await page.request.post('/api/auth/reset-password/request', {
      data: { email: 'nonexistent@example.com' },
    });
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBeTruthy();
  });

  test('無効なトークンでパスワードリセットできない', async ({ page }) => {
    const response = await page.request.post('/api/auth/reset-password', {
      data: { 
        token: 'invalid-token-12345',
        newPassword: 'NewPassword123',
      },
    });
    
    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  test('トークン検証APIが無効なトークンを拒否する', async ({ page }) => {
    // 無効なトークン - ステータスは200だがvalid: falseを返す
    const response = await page.request.get('/api/auth/reset-password?token=invalid-token');
    
    const data = await response.json();
    expect(data.valid).toBe(false);
  });

  test('パスワード再設定ページでトークンなしはエラー表示', async ({ page }) => {
    await page.goto('/reset-password');
    
    // トークンがないのでエラーが表示される
    await expect(page.getByRole('heading', { name: /リンクが無効/ })).toBeVisible({ timeout: 10000 });
  });

  test('ログインページからパスワードリセットへ遷移できる', async ({ page }) => {
    await page.goto('/login');
    
    // パスワードを忘れた方はこちらリンクをクリック
    await page.getByText('パスワードを忘れた方はこちら').click();
    
    await expect(page).toHaveURL('/forgot-password');
  });
});

test.describe('ログアウト', () => {
  
  test('ログアウトAPIが動作する', async ({ page }) => {
    const testEmail = generateTestEmail();
    const testPassword = 'TestPassword123';
    
    // 先に登録・ログイン
    await postWithRetry(page, '/api/companies', {
      companyName: 'ログアウトテスト会社',
      industry: 'it',
      employeeCount: '1-10',
      annualRevenue: 'under_50m',
      prefecture: '東京都',
      contactName: 'ログアウト太郎',
      email: testEmail,
      phone: '03-1234-5678',
      password: testPassword,
    });
    
    // ログイン
    const loginResponse = await page.request.post('/api/auth/login', {
      data: { email: testEmail, password: testPassword },
    });
    expect(loginResponse.ok()).toBeTruthy();
    
    // ログアウト
    const logoutResponse = await page.request.delete('/api/auth/logout');
    expect(logoutResponse.ok()).toBeTruthy();
  });
});

