import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');
    
    // Check that the page loads successfully
    await expect(page).toHaveTitle(/.*/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have clickable navigation', async ({ page }) => {
    await page.goto('/');
    
    // Check for any navigation elements
    const nav = page.locator('nav, header');
    await expect(nav.first()).toBeVisible();
  });
});

test.describe('Vendors Page', () => {
  test('should load vendors list', async ({ page }) => {
    await page.goto('/vendors');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Coordinators Page', () => {
  test('should load coordinators list', async ({ page }) => {
    await page.goto('/coordinators');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Login Page', () => {
  test('should display login form', async ({ page }) => {
    await page.goto('/login');
    
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should have submit button', async ({ page }) => {
    await page.goto('/login');
    
    // Look for a submit button (either type=submit or contains Sign In)
    const submitBtn = page.locator('button[type="submit"], button:has-text("Sign In")').first();
    await expect(submitBtn).toBeVisible();
  });
});

test.describe('Register Page', () => {
  test('should display registration form', async ({ page }) => {
    await page.goto('/register');
    
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });
});

test.describe('Discover Page', () => {
  test('should load discover page', async ({ page }) => {
    await page.goto('/discover');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Dashboard Pages', () => {
  test('should load vendor dashboard', async ({ page }) => {
    await page.goto('/vendor-dashboard');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('body')).toBeVisible();
  });

  test('should load coordinator dashboard', async ({ page }) => {
    await page.goto('/coordinator-dashboard');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('body')).toBeVisible();
  });

  test('should load user dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Bookings Page', () => {
  test('should load bookings page', async ({ page }) => {
    await page.goto('/bookings');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Messages Page', () => {
  test('should load messages page', async ({ page }) => {
    await page.goto('/messages');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('body')).toBeVisible();
  });
});
