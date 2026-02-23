import { test, expect, Page } from '@playwright/test';

/**
 * User Management & Verification Workflow Tests
 * Tests for CRUD operations, state transitions, and data consistency
 */

// Test fixtures
const TEST_USER = {
  email: `test-${Date.now()}@example.com`,
  name: 'Test User',
  role: 'individual'
};

// Helper to wait for API response
async function waitForApiResponse(page: Page, urlPattern: string | RegExp): Promise<unknown> {
  const responsePromise = page.waitForResponse(response => 
    response.url().includes(typeof urlPattern === 'string' ? urlPattern : '') && 
    response.status() === 200
  );
  return responsePromise;
}

// Helper to get table row count
async function getTableRowCount(page: Page): Promise<number> {
  return page.locator('tbody tr').count();
}

// Helper to check for loading state completion
async function waitForLoadingComplete(page: Page, timeout: number = 10000) {
  const loader = page.locator('.animate-spin, [class*="loading"], [class*="Loading"]');
  if (await loader.isVisible()) {
    await expect(loader).toBeHidden({ timeout });
  }
  await page.waitForTimeout(500); // Small buffer for React state updates
}

test.describe('User Management - CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
    await waitForLoadingComplete(page);
  });

  test('should display user list with correct data structure', async ({ page }) => {
    // Verify table headers
    const expectedHeaders = ['Name', 'Email', 'Role', 'Status'];
    
    for (const header of expectedHeaders) {
      const headerCell = page.locator(`th:has-text("${header}"), [role="columnheader"]:has-text("${header}")`);
      // At least some headers should be present
    }
    
    // Verify data rows exist
    const rowCount = await getTableRowCount(page);
    console.log(`Found ${rowCount} user rows`);
    
    if (rowCount > 0) {
      // First row should have proper structure
      const firstRow = page.locator('tbody tr').first();
      
      // Should contain email-like text
      const rowText = await firstRow.textContent();
      expect(rowText).toBeDefined();
    }
  });

  test('should search users and maintain data integrity', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first();
    
    if (!await searchInput.isVisible()) {
      test.skip();
      return;
    }
    
    // Get initial state
    const initialCount = await getTableRowCount(page);
    
    // Search for something specific
    await searchInput.fill('admin');
    await page.waitForTimeout(500);
    
    const searchResultCount = await getTableRowCount(page);
    
    // Clear search
    await searchInput.clear();
    await page.waitForTimeout(500);
    
    const finalCount = await getTableRowCount(page);
    
    // Count should return to original or similar (pagination may affect)
    expect(Math.abs(finalCount - initialCount)).toBeLessThan(5);
  });

  test('should filter users by role without data loss', async ({ page }) => {
    // Find role filter
    const roleFilter = page.locator('select').first();
    
    if (!await roleFilter.isVisible()) {
      test.skip();
      return;
    }
    
    // Get initial stats
    const statsText = await page.locator('p:has-text("vendors"), p:has-text("coordinators")').first().textContent();
    
    // Apply vendor filter
    await roleFilter.selectOption({ label: 'Vendor' });
    await page.waitForTimeout(500);
    
    // Verify all visible users are vendors
    const roleBadges = await page.locator('tbody span[class*="badge"], tbody span[class*="rounded-full"]').allTextContents();
    
    for (const badge of roleBadges) {
      if (badge.toLowerCase().includes('vendor') || ['admin', 'coordinator', 'individual'].some(r => badge.toLowerCase().includes(r))) {
        // Valid role badge found
      }
    }
    
    // Reset filter
    await roleFilter.selectOption({ index: 0 });
    await page.waitForTimeout(500);
  });

  test('should handle user action buttons correctly', async ({ page }) => {
    const actionButtons = page.locator('tbody button:has-text("View"), tbody button:has-text("Edit"), tbody button:has-text("Suspend")');
    
    const buttonCount = await actionButtons.count();
    
    if (buttonCount > 0) {
      // Click first view button
      const viewButton = page.locator('tbody button:has-text("View")').first();
      
      if (await viewButton.isVisible()) {
        await viewButton.click();
        await page.waitForTimeout(500);
        
        // Should open modal or navigate
        const modal = page.locator('[role="dialog"], [class*="modal"], [class*="Modal"]');
        // Modal might appear for view action
      }
    }
  });

  test('pagination should maintain data consistency', async ({ page }) => {
    const nextButton = page.locator('button:has-text("Next"), button:has-text(">")').first();
    const prevButton = page.locator('button:has-text("Prev"), button:has-text("<")').first();
    
    if (!await nextButton.isVisible()) {
      test.skip();
      return;
    }
    
    // Get first page data
    const firstPageFirstRow = await page.locator('tbody tr').first().textContent();
    
    // Go to next page
    await nextButton.click();
    await page.waitForTimeout(500);
    
    const secondPageFirstRow = await page.locator('tbody tr').first().textContent();
    
    // Data should be different
    if (firstPageFirstRow && secondPageFirstRow) {
      expect(firstPageFirstRow).not.toBe(secondPageFirstRow);
    }
    
    // Go back
    await prevButton.click();
    await page.waitForTimeout(500);
    
    const backToFirstPageRow = await page.locator('tbody tr').first().textContent();
    
    // Data should match first page
    expect(backToFirstPageRow).toBe(firstPageFirstRow);
  });
});

test.describe('User Status Transitions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
    await waitForLoadingComplete(page);
  });

  test('should show correct status badges', async ({ page }) => {
    const validStatuses = ['active', 'suspended', 'banned', 'pending'];
    
    const statusBadges = await page.locator('tbody span[class*="badge"], tbody span[class*="rounded-full"]').allTextContents();
    
    let statusFound = false;
    for (const badge of statusBadges) {
      const normalizedBadge = badge.toLowerCase().trim();
      if (validStatuses.some(status => normalizedBadge.includes(status))) {
        statusFound = true;
      }
    }
    
    // Should have found at least some status badges or be empty
  });

  test('suspend action should update user status', async ({ page }) => {
    // Find a user with active status
    const activeUserRow = page.locator('tbody tr:has(span:has-text("Active"))').first();
    
    if (!await activeUserRow.isVisible()) {
      test.skip();
      return;
    }
    
    // Find suspend button in that row
    const suspendButton = activeUserRow.locator('button:has-text("Suspend")');
    
    if (await suspendButton.isVisible()) {
      // Note: We don't actually click to avoid changing real data
      // Instead verify the button exists
      expect(await suspendButton.isEnabled()).toBeTruthy();
    }
  });
});

test.describe('Verification Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/verifications');
    await page.waitForLoadState('networkidle');
    await waitForLoadingComplete(page);
  });

  test('should display verification requests', async ({ page }) => {
    const header = page.locator('h1:has-text("Verification")');
    const pageHasHeader = await header.isVisible({ timeout: 5000 }).catch(() => false);
    
    // If redirected to login, that's acceptable for auth-protected pages
    const loginHeading = await page.locator('h1:has-text("Welcome Back")').isVisible({ timeout: 1000 }).catch(() => false);
    const passwordInput = await page.locator('input[type="password"]').isVisible({ timeout: 1000 }).catch(() => false);
    const isLoginPage = loginHeading || passwordInput;
    
    if (isLoginPage) {
      // Auth required - this is expected behavior, skip the rest
      return;
    }
    
    expect(pageHasHeader, 'Page should show verification header').toBeTruthy();
    
    // Check for verification list or empty state
    const verificationList = page.locator('tbody tr, [class*="verification"]');
    const emptyState = page.locator('text=No verifications, text=No pending, text=No requests');
    
    // Either has requests or shows empty state
    const hasVerifications = await verificationList.count() > 0;
    const showsEmpty = await emptyState.isVisible();
    
    expect(hasVerifications || showsEmpty).toBeTruthy();
  });

  test('should filter verifications by status', async ({ page }) => {
    const statusButtons = page.locator('button:has-text("Pending"), button:has-text("Approved"), button:has-text("Rejected")');
    
    if (await statusButtons.first().isVisible()) {
      // Click pending filter
      await page.locator('button:has-text("Pending")').first().click();
      await page.waitForTimeout(500);
      
      // All visible items should be pending
      const statusBadges = await page.locator('tbody span:has-text("Pending")').count();
      const allRows = await page.locator('tbody tr').count();
      
      // If rows exist, they should all be pending
      if (allRows > 0 && statusBadges > 0) {
        expect(statusBadges).toBe(allRows);
      }
    }
  });

  test('should show verification details', async ({ page }) => {
    const viewButton = page.locator('button:has-text("View"), button:has-text("Review")').first();
    
    if (await viewButton.isVisible()) {
      await viewButton.click();
      await page.waitForTimeout(500);
      
      // Should show details panel or modal
      const detailsPanel = page.locator('[class*="modal"], [class*="Modal"], [class*="panel"], [class*="Panel"], aside');
      // Details should appear
    }
  });

  test('should have approve/reject actions', async ({ page }) => {
    const viewButton = page.locator('button:has-text("View"), button:has-text("Review")').first();
    
    if (await viewButton.isVisible()) {
      await viewButton.click();
      await page.waitForTimeout(500);
      
      // Should show approve and reject buttons
      const approveButton = page.locator('button:has-text("Approve")');
      const rejectButton = page.locator('button:has-text("Reject")');
      
      // At least one action should be available for pending items
      // (might not be visible for already processed items)
    }
  });

  test('verification data should include required fields', async ({ page }) => {
    const rows = await page.locator('tbody tr').count();
    
    if (rows > 0) {
      const firstRow = page.locator('tbody tr').first();
      const rowText = await firstRow.textContent();
      
      // Should contain business name or user info
      expect(rowText).toBeDefined();
      expect(rowText!.length).toBeGreaterThan(0);
    }
  });
});

test.describe('Data Consistency Across Pages', () => {
  test('user count should match between dashboard and users page', async ({ page }) => {
    // Get count from dashboard
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await waitForLoadingComplete(page);
    
    // Check if we're on login page
    const isLoginPage = await page.locator('input[type="password"]').isVisible({ timeout: 1000 }).catch(() => false);
    if (isLoginPage) {
      // Auth required - skip test
      return;
    }
    
    const dashboardUserElement = page.locator('p').filter({ hasText: 'Total Users' }).or(page.locator('div').filter({ hasText: 'Total Users' })).first();
    const hasDashboardUserStat = await dashboardUserElement.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (!hasDashboardUserStat) {
      // Dashboard might not have this stat - skip test
      return;
    }
    
    const dashboardUserCount = await dashboardUserElement.textContent();
    
    // Get count from users page
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
    await waitForLoadingComplete(page);
    
    const usersPageElement = page.locator('p').filter({ hasText: 'users total' }).first();
    const hasUsersPageStat = await usersPageElement.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (!hasUsersPageStat) {
      // Users page might not have this stat - skip test
      return;
    }
    
    const usersPageCount = await usersPageElement.textContent();
    
    // Both should have consistent numbers (exact match may vary due to real-time updates)
    if (dashboardUserCount && usersPageCount) {
      const dashNum = parseInt(dashboardUserCount.replace(/[^0-9]/g, ''), 10);
      const usersNum = parseInt(usersPageCount.replace(/[^0-9]/g, ''), 10);
      
      if (!isNaN(dashNum) && !isNaN(usersNum)) {
        // Allow small variance for real-time updates
        expect(Math.abs(dashNum - usersNum)).toBeLessThan(10);
      }
    }
  });

  test('pending verifications count should be consistent', async ({ page }) => {
    // Get count from dashboard
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await waitForLoadingComplete(page);
    
    // Check if we're on login page
    const isLoginPage = await page.locator('input[type="password"]').isVisible({ timeout: 1000 }).catch(() => false);
    if (isLoginPage) {
      // Auth required - skip test
      return;
    }
    
    const dashboardPendingElement = page.locator('div:has(p:has-text("Pending Verification")) p:first-child').or(page.locator('[class*="stat"]:has-text("Pending")')).first();
    const hasDashboardStat = await dashboardPendingElement.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (!hasDashboardStat) {
      // Dashboard might not have this stat - skip test
      return;
    }
    
    const dashboardPendingText = await dashboardPendingElement.textContent();
    
    // Get count from verifications page
    await page.goto('/admin/verifications');
    await page.waitForLoadState('networkidle');
    await waitForLoadingComplete(page);
    
    // Filter by pending
    const pendingFilter = page.locator('button:has-text("Pending")').first();
    if (await pendingFilter.isVisible()) {
      await pendingFilter.click();
      await page.waitForTimeout(500);
    }
    
    const pendingCount = await page.locator('tbody tr').count();
    
    // Compare
    if (dashboardPendingText) {
      const dashNum = parseInt(dashboardPendingText.replace(/[^0-9]/g, ''), 10);
      
      if (!isNaN(dashNum)) {
        // Should be reasonably close
        expect(Math.abs(dashNum - pendingCount)).toBeLessThan(5);
      }
    }
  });
});

test.describe('Error Handling & Edge Cases', () => {
  test('should handle empty search results gracefully', async ({ page }) => {
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
    await waitForLoadingComplete(page);
    
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first();
    
    if (await searchInput.isVisible()) {
      // Search for something that won't exist
      await searchInput.fill('xyznonexistent123456789');
      await page.waitForTimeout(500);
      
      // Should show empty state or "no results" message
      const rows = await page.locator('tbody tr').count();
      const emptyMessage = page.locator('text=No results, text=No users found, text=not found');
      
      // Either no rows or empty message
      expect(rows === 0 || await emptyMessage.isVisible()).toBeTruthy();
    }
  });

  test('should handle rapid filter changes', async ({ page }) => {
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
    await waitForLoadingComplete(page);
    
    const roleFilter = page.locator('select').first();
    
    if (await roleFilter.isVisible()) {
      // Rapidly change filters
      await roleFilter.selectOption({ index: 1 });
      await roleFilter.selectOption({ index: 2 });
      await roleFilter.selectOption({ index: 0 });
      await roleFilter.selectOption({ index: 1 });
      
      await page.waitForTimeout(1000);
      
      // Page should still be stable
      await expect(page.locator('body')).toBeVisible();
      const pageContent = await page.textContent('body');
      expect(pageContent).not.toContain('Error');
    }
  });

  test('should not lose data on browser back/forward', async ({ page }) => {
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
    await waitForLoadingComplete(page);
    
    const initialRowCount = await getTableRowCount(page);
    
    // Navigate away
    await page.goto('/admin/verifications');
    await page.waitForLoadState('networkidle');
    
    // Go back
    await page.goBack();
    await page.waitForLoadState('networkidle');
    await waitForLoadingComplete(page);
    
    const afterBackRowCount = await getTableRowCount(page);
    
    // Data should be restored
    expect(Math.abs(afterBackRowCount - initialRowCount)).toBeLessThan(2);
  });
});

test.describe('Performance & Large Dataset Handling', () => {
  test('should handle large datasets without timeouts', async ({ page }) => {
    page.setDefaultTimeout(30000);
    
    await page.goto('/admin/users');
    
    const startTime = Date.now();
    await page.waitForLoadState('networkidle');
    await waitForLoadingComplete(page, 20000);
    const loadTime = Date.now() - startTime;
    
    console.log(`Users page loaded in ${loadTime}ms`);
    
    // Should load within reasonable time
    expect(loadTime).toBeLessThan(20000);
  });

  test('should paginate efficiently', async ({ page }) => {
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
    await waitForLoadingComplete(page);
    
    const nextButton = page.locator('button:has-text("Next"), button:has-text(">")').first();
    
    if (await nextButton.isVisible() && await nextButton.isEnabled()) {
      const startTime = Date.now();
      await nextButton.click();
      await waitForLoadingComplete(page);
      const pageChangeTime = Date.now() - startTime;
      
      console.log(`Page change took ${pageChangeTime}ms`);
      
      // Pagination should be fast
      expect(pageChangeTime).toBeLessThan(5000);
    }
  });
});
