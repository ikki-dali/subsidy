import { test, expect } from '@playwright/test';

/**
 * 補助金検索のE2Eテスト
 */

test.describe('補助金検索', () => {
  
  test('検索ページが表示される', async ({ page }) => {
    await page.goto('/search');
    
    // ページが表示される（認証不要）
    await expect(page).toHaveURL('/search');
    
    // キーワード検索フォームが存在する
    await expect(page.locator('input[type="text"], input[type="search"]').first()).toBeVisible();
  });

  test('検索APIが動作する', async ({ page }) => {
    // APIを直接テスト
    const response = await page.request.get('/api/subsidies?limit=5&active=true');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.subsidies).toBeDefined();
    expect(Array.isArray(data.subsidies)).toBeTruthy();
  });

  test('エリア指定で検索APIが動作する', async ({ page }) => {
    const response = await page.request.get('/api/subsidies?area=東京都&limit=5&active=true');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.subsidies).toBeDefined();
  });

  test('キーワード検索APIが動作する', async ({ page }) => {
    const response = await page.request.get('/api/subsidies?keyword=IT&limit=5&active=true');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.subsidies).toBeDefined();
  });
});

test.describe('補助金詳細ページ', () => {
  
  test('詳細ページAPIが動作する', async ({ page }) => {
    // まずリストから1件取得
    const listResponse = await page.request.get('/api/subsidies?limit=1&active=true');
    expect(listResponse.ok()).toBeTruthy();
    
    const listData = await listResponse.json();
    if (listData.subsidies && listData.subsidies.length > 0) {
      const subsidyId = listData.subsidies[0].id;
      
      // 詳細APIを叩く
      const detailResponse = await page.request.get(`/api/subsidies/${subsidyId}`);
      expect(detailResponse.ok()).toBeTruthy();
      
      const detailData = await detailResponse.json();
      expect(detailData.id).toBe(subsidyId);
      expect(detailData.title).toBeDefined();
    }
  });

  test('詳細ページが直接アクセスで表示される', async ({ page }) => {
    // APIから補助金IDを取得
    const listResponse = await page.request.get('/api/subsidies?limit=1&active=true');
    const listData = await listResponse.json();
    
    if (listData.subsidies && listData.subsidies.length > 0) {
      const subsidyId = listData.subsidies[0].id;
      
      // 詳細ページに直接アクセス（公開ページなので認証不要）
      await page.goto(`/subsidies/${subsidyId}`);
      
      // ページが表示される
      await expect(page).toHaveURL(new RegExp(`/subsidies/${subsidyId}`));
      
      // タイトルが表示される
      await expect(page.locator('h1').first()).toBeVisible();
    }
  });
});

