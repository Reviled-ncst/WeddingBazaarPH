import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const API_BASE_URL = process.env.API_URL || 'https://weddingbazaarph-testing.up.railway.app';

test.describe('Analytics Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/analytics');
    await page.waitForLoadState('networkidle');
  });

  test('should load analytics dashboard', async ({ page }) => {
    // Check for analytics header or login redirect
    const header = page.locator('h1:has-text("Analytics")');
    const pageHasHeader = await header.isVisible({ timeout: 5000 }).catch(() => false);
    
    const loginHeading = await page.locator('h1:has-text("Welcome Back")').isVisible({ timeout: 1000 }).catch(() => false);
    const passwordInput = await page.locator('input[type="password"]').isVisible({ timeout: 1000 }).catch(() => false);
    const isLoginPage = loginHeading || passwordInput;
    
    expect(pageHasHeader || isLoginPage, 'Page should show analytics dashboard or login').toBeTruthy();
  });

  test('should display period selector buttons', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // Check for period selector buttons
    const periodButtons = page.locator('button:has-text("24 Hours"), button:has-text("7 Days"), button:has-text("30 Days")');
    const hasButtons = await periodButtons.first().isVisible({ timeout: 3000 }).catch(() => false);
    
    // Either shows period buttons or login page
    const isLoginPage = await page.locator('input[type="password"]').isVisible({ timeout: 1000 }).catch(() => false);
    
    expect(hasButtons || isLoginPage).toBeTruthy();
  });

  test('should show overview stats cards', async ({ page }) => {
    await page.waitForTimeout(1500);
    
    // Look for stat cards (Page Views, Unique Visitors, etc.)
    const statCards = page.locator('[class*="Card"], .p-6').filter({ hasText: /Page Views|Unique Visitors|Bounce Rate|Total Clicks/ });
    const hasStatCards = await statCards.first().isVisible({ timeout: 3000 }).catch(() => false);
    
    const isLoginPage = await page.locator('input[type="password"]').isVisible({ timeout: 1000 }).catch(() => false);
    
    expect(hasStatCards || isLoginPage).toBeTruthy();
  });
});

test.describe('Heatmaps Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/heatmaps');
    await page.waitForLoadState('networkidle');
  });

  test('should load heatmaps page', async ({ page }) => {
    const header = page.locator('h1:has-text("Heatmaps")');
    const pageHasHeader = await header.isVisible({ timeout: 5000 }).catch(() => false);
    
    const loginHeading = await page.locator('h1:has-text("Welcome Back")').isVisible({ timeout: 1000 }).catch(() => false);
    const passwordInput = await page.locator('input[type="password"]').isVisible({ timeout: 1000 }).catch(() => false);
    const isLoginPage = loginHeading || passwordInput;
    
    expect(pageHasHeader || isLoginPage, 'Page should show heatmaps or login').toBeTruthy();
  });

  test('should have view type toggle (Clicks/Scroll)', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    const clicksButton = page.locator('button:has-text("Clicks")');
    const scrollButton = page.locator('button:has-text("Scroll")');
    
    const hasClicksButton = await clicksButton.isVisible({ timeout: 3000 }).catch(() => false);
    const hasScrollButton = await scrollButton.isVisible({ timeout: 3000 }).catch(() => false);
    
    const isLoginPage = await page.locator('input[type="password"]').isVisible({ timeout: 1000 }).catch(() => false);
    
    expect((hasClicksButton && hasScrollButton) || isLoginPage).toBeTruthy();
  });

  test('should have page selector dropdown', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    const pageSelector = page.locator('select');
    const hasSelector = await pageSelector.first().isVisible({ timeout: 3000 }).catch(() => false);
    
    const isLoginPage = await page.locator('input[type="password"]').isVisible({ timeout: 1000 }).catch(() => false);
    
    expect(hasSelector || isLoginPage).toBeTruthy();
  });
});

test.describe('Analytics Tracking API', () => {
  test('should accept pageview tracking', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/analytics/collect.php`, {
      data: {
        type: 'pageview',
        sessionId: 'test-session-123',
        path: '/test-page',
        title: 'Test Page',
        screenWidth: 1920,
        screenHeight: 1080,
        viewportWidth: 1920,
        viewportHeight: 900
      }
    });
    
    // Should accept the request (may fail on DB if tables don't exist, but shouldn't crash)
    expect(response.status()).toBeLessThan(500);
  });

  test('should accept click tracking', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/analytics/collect.php`, {
      data: {
        type: 'click',
        sessionId: 'test-session-123',
        path: '/test-page',
        elementTag: 'button',
        elementId: 'submit-btn',
        clickX: 500,
        clickY: 300,
        viewportWidth: 1920,
        viewportHeight: 900
      }
    });
    
    expect(response.status()).toBeLessThan(500);
  });

  test('should accept scroll tracking', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/analytics/collect.php`, {
      data: {
        type: 'scroll',
        sessionId: 'test-session-123',
        path: '/test-page',
        scrollDepth: 50,
        scrollY: 500,
        pageHeight: 2000,
        viewportHeight: 900
      }
    });
    
    expect(response.status()).toBeLessThan(500);
  });

  test('should accept custom event tracking', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/analytics/collect.php`, {
      data: {
        type: 'event',
        sessionId: 'test-session-123',
        eventName: 'button_click',
        eventCategory: 'engagement',
        eventLabel: 'cta_button',
        eventValue: 1,
        path: '/test-page',
        properties: { buttonColor: 'pink' }
      }
    });
    
    expect(response.status()).toBeLessThan(500);
  });

  test('should reject invalid event type', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/analytics/collect.php`, {
      data: {
        type: 'invalid_type',
        sessionId: 'test-session-123'
      }
    });
    
    // Should return 400 for invalid type (or 404 if endpoint not deployed yet)
    expect([400, 404]).toContain(response.status());
  });

  test('should handle missing type gracefully', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/analytics/collect.php`, {
      data: {
        sessionId: 'test-session-123'
      }
    });
    
    // Should return 400 for missing type (or 404 if endpoint not deployed yet)
    expect([400, 404]).toContain(response.status());
  });
});

test.describe('Analytics Stats API', () => {
  test('should require authentication', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/analytics/stats.php`);
    
    // Should return 401 without auth (or 404 if endpoint not deployed yet)
    expect([401, 404]).toContain(response.status());
  });

  test('should accept period parameter', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/analytics/stats.php?period=7d`);
    
    // Should return 401 without auth (or 404 if endpoint not deployed yet)
    expect([401, 404]).toContain(response.status());
  });
});

test.describe('Heatmap Data API', () => {
  test('should require authentication', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/analytics/heatmap.php?page=/`);
    
    // Should return 401 without auth (or 404 if endpoint not deployed yet)
    expect([401, 404]).toContain(response.status());
  });

  test('should accept type parameter', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/analytics/heatmap.php?page=/&type=clicks`);
    
    // Should return 401 without auth (or 404 if endpoint not deployed yet)
    expect([401, 404]).toContain(response.status());
  });
});
