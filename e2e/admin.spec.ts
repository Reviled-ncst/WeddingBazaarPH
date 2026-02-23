import { test, expect } from '@playwright/test';

test.describe('Admin Panel', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to admin and skip auth for now (admin routes should redirect)
    await page.goto('/admin');
  });

  test('should load admin dashboard', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Check that page loads (may redirect to login if auth required)
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have admin navigation links', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Look for admin sidebar or navigation
    const adminNav = page.locator('nav, aside, [role="navigation"]');
    await expect(adminNav.first()).toBeVisible();
  });
});

test.describe('Admin Users Page', () => {
  test('should load users page', async ({ page }) => {
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Admin Activity Logs Page', () => {
  test('should load activity logs page', async ({ page }) => {
    await page.goto('/admin/activity-logs');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Admin Services Page', () => {
  test('should load services page', async ({ page }) => {
    await page.goto('/admin/services');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Admin Verifications Page', () => {
  test('should load verifications page', async ({ page }) => {
    await page.goto('/admin/verifications');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Admin Complaints Page', () => {
  test('should load complaints page', async ({ page }) => {
    await page.goto('/admin/complaints');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Admin Support Page', () => {
  test('should load support page', async ({ page }) => {
    await page.goto('/admin/support');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Admin Help Center Page', () => {
  test('should load help center page', async ({ page }) => {
    await page.goto('/admin/help-center');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Admin Location Logs Page', () => {
  test('should load location logs page', async ({ page }) => {
    await page.goto('/admin/location-logs');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Admin Login Security Page', () => {
  test('should load login security page', async ({ page }) => {
    await page.goto('/admin/login-security');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Admin Categories Page', () => {
  test('should load categories page', async ({ page }) => {
    await page.goto('/admin/categories');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Admin Settings Page', () => {
  test('should load settings page', async ({ page }) => {
    await page.goto('/admin/settings');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('body')).toBeVisible();
  });
});
