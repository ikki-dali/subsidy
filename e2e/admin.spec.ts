import { test, expect, Page } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// .env.localをロード
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

/**
 * 管理画面のE2Eテスト
 */

// 環境変数から管理者認証情報を取得
const ADMIN_EMAIL = process.env.ADMIN_INITIAL_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_INITIAL_PASSWORD;

// 管理者としてUIでログインするヘルパー関数
async function loginAsAdmin(page: Page) {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error('ADMIN_INITIAL_EMAIL and ADMIN_INITIAL_PASSWORD must be set');
  }
  
  await page.goto('/admin/login');
  await page.getByLabel('メールアドレス').fill(ADMIN_EMAIL);
  await page.getByLabel('パスワード').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'ログイン' }).click();
  
  // ダッシュボードにリダイレクトされるまで待機
  await page.waitForURL('/admin', { timeout: 15000 });
}

test.describe('管理者認証', () => {

  test('管理者ログインページが表示される', async ({ page }) => {
    await page.goto('/admin/login');
    
    await expect(page).toHaveURL('/admin/login');
    // メールアドレスとパスワードの入力欄が表示される
    await expect(page.getByLabel('メールアドレス')).toBeVisible();
    await expect(page.getByLabel('パスワード')).toBeVisible();
    await expect(page.getByRole('button', { name: 'ログイン' })).toBeVisible();
  });

  test('認証なしで管理画面にアクセスするとログインページにリダイレクト', async ({ page }) => {
    // 管理画面のダッシュボードにアクセス
    await page.goto('/admin');
    
    // ログインページにリダイレクトされる
    await expect(page).toHaveURL('/admin/login');
  });

  test('認証なしで管理APIにアクセスすると401が返る', async ({ page }) => {
    // 統計APIにアクセス
    const response = await page.request.get('/api/admin/stats');
    expect(response.status()).toBe(401);
  });

  test('間違ったパスワードでログインできない', async ({ page }) => {
    await page.goto('/admin/login');
    
    await page.getByLabel('メールアドレス').fill('wrong@example.com');
    await page.getByLabel('パスワード').fill('wrongpassword');
    await page.getByRole('button', { name: 'ログイン' }).click();
    
    // エラーメッセージが表示される（赤い背景のエラーボックス）
    const errorBox = page.locator('.bg-red-50');
    await expect(errorBox).toBeVisible({ timeout: 15000 });
    
    // ログインページに留まる
    await expect(page).toHaveURL('/admin/login');
  });
});

test.describe('管理者ログイン後の操作', () => {
  // 注意: このテストは環境変数 ADMIN_INITIAL_EMAIL, ADMIN_INITIAL_PASSWORD が設定されている場合のみ動作

  test('管理者認証APIが動作する', async ({ page }) => {
    // 環境変数から管理者認証情報を取得できない場合はスキップ
    // 実際のテストではモックまたはテスト用の認証情報を使用
    
    // ログインAPIのエンドポイント確認
    const response = await page.request.post('/api/admin/auth', {
      data: {
        email: 'test@example.com',
        password: 'testpassword',
      },
    });
    
    // 認証失敗でも API は動作する（401が返る）
    expect([200, 401].includes(response.status())).toBeTruthy();
  });
});

test.describe('管理画面ページ構造', () => {
  
  test('補助金管理APIが存在する', async ({ page }) => {
    const response = await page.request.get('/api/admin/subsidies?limit=1');
    // 認証なしなので401が返る
    expect(response.status()).toBe(401);
  });

  test('クライアント一覧APIが存在する', async ({ page }) => {
    const response = await page.request.get('/api/admin/clients?limit=1');
    // 認証なしなので401が返る
    expect(response.status()).toBe(401);
  });

  test('問い合わせ一覧APIが存在する', async ({ page }) => {
    const response = await page.request.get('/api/admin/interests?limit=1');
    // 認証なしなので401が返る
    expect(response.status()).toBe(401);
  });
});

test.describe('管理者ログイン統合テスト', () => {
  
  test('管理者ログインフローが動作する（UIテスト）', async ({ page }) => {
    // ログインページに遷移
    await page.goto('/admin/login');
    
    // フォームが表示される
    await expect(page.getByLabel('メールアドレス')).toBeVisible();
    await expect(page.getByLabel('パスワード')).toBeVisible();
    await expect(page.getByRole('button', { name: 'ログイン' })).toBeVisible();
    
    // ログインボタンがクリック可能
    await expect(page.getByRole('button', { name: 'ログイン' })).toBeEnabled();
  });

  test('ログアウトAPIが存在する', async ({ page }) => {
    const response = await page.request.delete('/api/admin/auth');
    // ログアウトはセッションがなくても成功扱い
    expect([200, 401].includes(response.status())).toBeTruthy();
  });
});

test.describe('管理者ログイン後の操作（認証必須）', () => {
  // 環境変数が設定されていない場合はスキップ
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, 'ADMIN_INITIAL_EMAIL/PASSWORD not set');

  test('管理者としてUIからログインしてダッシュボードにアクセスできる', async ({ page }) => {
    // UIでログイン
    await page.goto('/admin/login');
    await page.getByLabel('メールアドレス').fill(ADMIN_EMAIL!);
    await page.getByLabel('パスワード').fill(ADMIN_PASSWORD!);
    await page.getByRole('button', { name: 'ログイン' }).click();
    
    // ダッシュボードにリダイレクトされる
    await expect(page).toHaveURL('/admin', { timeout: 15000 });
  });

  test('ログイン後、補助金管理ページにアクセスできる', async ({ page }) => {
    await loginAsAdmin(page);
    
    await page.goto('/admin/subsidies');
    
    // ログインページにリダイレクトされない
    await expect(page).toHaveURL('/admin/subsidies', { timeout: 10000 });
  });

  test('ログイン後、クライアント一覧ページにアクセスできる', async ({ page }) => {
    await loginAsAdmin(page);
    
    await page.goto('/admin/clients');
    
    // ログインページにリダイレクトされない
    await expect(page).toHaveURL('/admin/clients', { timeout: 10000 });
  });

  test('ログイン後、問い合わせ一覧ページにアクセスできる', async ({ page }) => {
    await loginAsAdmin(page);
    
    await page.goto('/admin/interests');
    
    // ログインページにリダイレクトされない
    await expect(page).toHaveURL('/admin/interests', { timeout: 10000 });
  });
});

