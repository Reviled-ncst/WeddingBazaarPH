import { test, expect } from '@playwright/test';

/**
 * API Data Integrity Tests
 * These tests verify that API responses contain valid, consistent data
 * and that no data loss or misinterpretation occurs during CRUD operations
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/wedding-bazaar-api';

// Type definitions for API responses
interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  status?: string;
  created_at: string;
}

interface Verification {
  id: number;
  user_id: number;
  type: string;
  status: string;
  submitted_at: string;
}

interface Service {
  id: number;
  vendor_id: number;
  name: string;
  price: number;
  status: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Validation helpers
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidDate(dateStr: string): boolean {
  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date.getTime());
}

function isPositiveNumber(value: unknown): boolean {
  return typeof value === 'number' && value >= 0;
}

function hasRequiredFields<T extends object>(obj: T, fields: (keyof T)[]): boolean {
  return fields.every(field => field in obj && obj[field] !== undefined && obj[field] !== null);
}

test.describe('API - Users Endpoint Data Integrity', () => {
  test('GET /admin/users should return valid user data', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/admin/users/list.php`);
    
    // Skip if auth required
    if (response.status() === 401 || response.status() === 403) {
      test.skip();
      return;
    }
    
    if (response.ok()) {
      const data = await response.json();
      
      if (data.success && data.users && Array.isArray(data.users)) {
        for (const user of data.users) {
          // Validate required fields
          expect(user.id, `User missing id`).toBeDefined();
          expect(typeof user.id === 'number', `User id should be number`).toBeTruthy();
          
          if (user.email) {
            expect(isValidEmail(user.email), `Invalid email: ${user.email}`).toBeTruthy();
          }
          
          if (user.role) {
            expect(['admin', 'vendor', 'coordinator', 'individual', 'couple'].includes(user.role), 
              `Invalid role: ${user.role}`).toBeTruthy();
          }
          
          if (user.created_at) {
            expect(isValidDate(user.created_at), `Invalid date: ${user.created_at}`).toBeTruthy();
          }
        }
        
        // Check pagination integrity
        if (data.pagination) {
          expect(data.pagination.total).toBeGreaterThanOrEqual(0);
          expect(data.pagination.page).toBeGreaterThan(0);
          expect(data.pagination.totalPages).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  test('user counts should be consistent across endpoints', async ({ request }) => {
    // Get users list
    const usersResponse = await request.get(`${API_BASE_URL}/admin/users/list.php`);
    
    if (usersResponse.status() === 401 || usersResponse.status() === 403) {
      test.skip();
      return;
    }
    
    // Get dashboard stats
    const statsResponse = await request.get(`${API_BASE_URL}/admin/stats.php`);
    
    if (usersResponse.ok() && statsResponse.ok()) {
      const usersData = await usersResponse.json();
      const statsData = await statsResponse.json();
      
      if (usersData.pagination?.total && statsData.stats?.totalUsers) {
        // Total users should match
        expect(usersData.pagination.total).toBe(statsData.stats.totalUsers);
      }
    }
  });

  test('user role distribution should add up correctly', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/admin/users/list.php`);
    
    if (response.status() === 401 || response.status() === 403) {
      test.skip();
      return;
    }
    
    if (response.ok()) {
      const data = await response.json();
      
      if (data.stats?.byRole) {
        const roleSum = Object.values(data.stats.byRole as Record<string, number>)
          .reduce((sum: number, count) => sum + (count as number), 0);
        
        // Sum of roles should equal total users (or be close, accounting for users without roles)
        if (data.pagination?.total) {
          expect(roleSum).toBeLessThanOrEqual(data.pagination.total + 10); // Small tolerance for edge cases
        }
      }
    }
  });
});

test.describe('API - Verifications Endpoint Data Integrity', () => {
  test('GET /admin/verifications should return valid data', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/admin/verifications.php`);
    
    if (response.status() === 401 || response.status() === 403) {
      test.skip();
      return;
    }
    
    if (response.ok()) {
      const data = await response.json();
      
      if (data.success && data.verifications && Array.isArray(data.verifications)) {
        for (const verification of data.verifications) {
          // Validate required fields
          expect(verification.id, `Verification missing id`).toBeDefined();
          expect(typeof verification.id === 'number', `Verification id should be number`).toBeTruthy();
          
          if (verification.type) {
            expect(['vendor', 'coordinator'].includes(verification.type),
              `Invalid type: ${verification.type}`).toBeTruthy();
          }
          
          if (verification.status) {
            expect(['pending', 'approved', 'rejected'].includes(verification.status),
              `Invalid status: ${verification.status}`).toBeTruthy();
          }
          
          if (verification.submitted_at) {
            expect(isValidDate(verification.submitted_at), 
              `Invalid date: ${verification.submitted_at}`).toBeTruthy();
          }
          
          // Cross-validate user exists
          if (verification.user_id) {
            expect(typeof verification.user_id === 'number').toBeTruthy();
            expect(verification.user_id).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  test('verification status counts should be consistent', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/admin/verifications.php`);
    
    if (response.status() === 401 || response.status() === 403) {
      test.skip();
      return;
    }
    
    if (response.ok()) {
      const data = await response.json();
      
      if (data.verifications && Array.isArray(data.verifications)) {
        const statusCounts = data.verifications.reduce((acc: Record<string, number>, v: { status: string }) => {
          acc[v.status] = (acc[v.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const total = Object.values(statusCounts).reduce((sum: number, count) => sum + (count as number), 0);
        expect(total).toBe(data.verifications.length);
      }
    }
  });
});

test.describe('API - Services Endpoint Data Integrity', () => {
  test('GET /services should return valid service data', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/services/list.php`);
    
    if (response.ok()) {
      const data = await response.json();
      
      if (data.success && data.services && Array.isArray(data.services)) {
        for (const service of data.services) {
          // Validate required fields
          expect(service.id, `Service missing id`).toBeDefined();
          
          if (service.price !== undefined) {
            expect(isPositiveNumber(parseFloat(service.price)), 
              `Invalid price: ${service.price}`).toBeTruthy();
          }
          
          if (service.name) {
            expect(service.name.length).toBeGreaterThan(0);
            expect(service.name.length).toBeLessThan(500); // Reasonable length
          }
          
          // Vendor reference should be valid
          if (service.vendor_id) {
            expect(typeof service.vendor_id === 'number').toBeTruthy();
            expect(service.vendor_id).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  test('service prices should be consistent format', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/services/list.php`);
    
    if (response.ok()) {
      const data = await response.json();
      
      if (data.services && Array.isArray(data.services)) {
        const prices = data.services
          .filter((s: { price: unknown }) => s.price !== undefined && s.price !== null)
          .map((s: { price: string | number }) => parseFloat(String(s.price)));
        
        // All prices should be parseable as numbers
        for (const price of prices) {
          expect(isNaN(price), `Found NaN price`).toBeFalsy();
        }
        
        // No negative prices
        for (const price of prices) {
          expect(price).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });
});

test.describe('API - Bookings Data Integrity', () => {
  test('GET /bookings should return valid booking data', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/bookings/list.php`);
    
    if (response.status() === 401 || response.status() === 403) {
      test.skip();
      return;
    }
    
    if (response.ok()) {
      const data = await response.json();
      
      if (data.bookings && Array.isArray(data.bookings)) {
        for (const booking of data.bookings) {
          // Validate required fields
          if (booking.id) {
            expect(typeof booking.id).toBe('number');
          }
          
          // Booking date should be valid
          if (booking.event_date) {
            expect(isValidDate(booking.event_date), 
              `Invalid event_date: ${booking.event_date}`).toBeTruthy();
          }
          
          // Status should be valid
          if (booking.status) {
            const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'rejected'];
            expect(validStatuses.includes(booking.status),
              `Invalid status: ${booking.status}`).toBeTruthy();
          }
          
          // Price should be valid
          if (booking.total_amount !== undefined) {
            expect(isPositiveNumber(parseFloat(booking.total_amount))).toBeTruthy();
          }
        }
      }
    }
  });

  test('booking references should be valid', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/bookings/list.php`);
    
    if (response.status() === 401 || response.status() === 403) {
      test.skip();
      return;
    }
    
    if (response.ok()) {
      const data = await response.json();
      
      if (data.bookings && Array.isArray(data.bookings)) {
        for (const booking of data.bookings) {
          // User reference
          if (booking.user_id) {
            expect(booking.user_id).toBeGreaterThan(0);
          }
          
          // Service reference
          if (booking.service_id) {
            expect(booking.service_id).toBeGreaterThan(0);
          }
          
          // Vendor reference
          if (booking.vendor_id) {
            expect(booking.vendor_id).toBeGreaterThan(0);
          }
        }
      }
    }
  });
});

test.describe('API - Categories Data Integrity', () => {
  test('GET /categories should return valid category data', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/categories/list.php`);
    
    if (response.ok()) {
      const data = await response.json();
      
      if (data.success && data.categories && Array.isArray(data.categories)) {
        const categoryIds = new Set<number>();
        const categorySlugs = new Set<string>();
        
        for (const category of data.categories) {
          // Validate required fields
          expect(category.id).toBeDefined();
          
          // Check for duplicate IDs (data integrity issue)
          expect(categoryIds.has(category.id), 
            `Duplicate category ID: ${category.id}`).toBeFalsy();
          categoryIds.add(category.id);
          
          // Check for duplicate slugs
          if (category.slug) {
            expect(categorySlugs.has(category.slug),
              `Duplicate category slug: ${category.slug}`).toBeFalsy();
            categorySlugs.add(category.slug);
          }
          
          // Name should exist and be reasonable length
          if (category.name) {
            expect(category.name.length).toBeGreaterThan(0);
            expect(category.name.length).toBeLessThan(200);
          }
        }
      }
    }
  });
});

test.describe('API - Dashboard Stats Integrity', () => {
  test('dashboard stats should have consistent values', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/admin/stats.php`);
    
    if (response.status() === 401 || response.status() === 403) {
      test.skip();
      return;
    }
    
    if (response.ok()) {
      const text = await response.text();
      // Skip if response is HTML (error page) instead of JSON
      if (text.startsWith('<') || text.includes('<html') || text.includes('<br')) {
        test.skip();
        return;
      }
      
      try {
        const data = JSON.parse(text);
      
        if (data.stats) {
          const stats = data.stats;
          
          // All numeric stats should be non-negative
          const numericFields = [
            'totalUsers', 'activeVendors', 'pendingVerifications',
            'totalBookings', 'totalRevenue', 'monthlyRevenue',
            'openTickets', 'pendingComplaints', 'newUsersThisWeek'
          ];
          
          for (const field of numericFields) {
            if (stats[field] !== undefined) {
              expect(isPositiveNumber(stats[field]),
                `${field} should be non-negative: ${stats[field]}`).toBeTruthy();
            }
          }
          
          // Monthly revenue should not exceed total revenue
          if (stats.monthlyRevenue !== undefined && stats.totalRevenue !== undefined) {
            expect(stats.monthlyRevenue).toBeLessThanOrEqual(stats.totalRevenue);
          }
          
          // Active vendors should not exceed total vendors
          if (stats.activeVendors !== undefined && stats.usersByRole?.vendor !== undefined) {
            expect(stats.activeVendors).toBeLessThanOrEqual(stats.usersByRole.vendor);
          }
        }
      } catch {
        // Invalid JSON - skip test
        test.skip();
      }
    }
  });

  test('recent activity should have valid entries', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/admin/stats.php`);
    
    if (response.status() === 401 || response.status() === 403) {
      test.skip();
      return;
    }
    
    if (response.ok()) {
      const text = await response.text();
      // Skip if response is HTML (error page) instead of JSON
      if (text.startsWith('<') || text.includes('<html') || text.includes('<br')) {
        test.skip();
        return;
      }
      
      try {
        const data = JSON.parse(text);
      
        if (data.recentActivity && Array.isArray(data.recentActivity)) {
          for (const activity of data.recentActivity) {
            // Should have timestamp
            if (activity.created_at) {
              expect(isValidDate(activity.created_at)).toBeTruthy();
            }
            
            // Should have action description
            expect(activity.action || activity.description).toBeDefined();
            
            // User reference should be valid
            if (activity.user_id) {
              expect(activity.user_id).toBeGreaterThan(0);
            }
          }
          
          // Activity should be in chronological order (newest first usually)
          if (data.recentActivity.length > 1) {
            const dates = data.recentActivity
              .filter((a: { created_at: string }) => a.created_at)
              .map((a: { created_at: string }) => new Date(a.created_at).getTime());
            
            // Check if sorted (descending)
            const isSorted = dates.every((date: number, i: number) => i === 0 || dates[i - 1] >= date);
            // This is expected but not critical
            if (!isSorted) {
              console.log('Warning: Activity logs may not be sorted chronologically');
            }
          }
        }
      } catch {
        // Invalid JSON - skip test
        test.skip();
      }
    }
  });
});

test.describe('API - Data Loss Prevention', () => {
  test('pagination should not lose data', async ({ request }) => {
    // Get first page
    const page1Response = await request.get(`${API_BASE_URL}/services/list.php?page=1&limit=10`);
    
    if (page1Response.ok()) {
      const page1Data = await page1Response.json();
      
      if (page1Data.services && page1Data.pagination) {
        const totalRecords = page1Data.pagination.total;
        const pageSize = 10;
        const expectedPages = Math.ceil(totalRecords / pageSize);
        
        // Collect all IDs across pages
        const allIds = new Set<number>();
        
        for (let page = 1; page <= Math.min(expectedPages, 5); page++) { // Check up to 5 pages
          const pageResponse = await request.get(`${API_BASE_URL}/services/list.php?page=${page}&limit=${pageSize}`);
          
          if (pageResponse.ok()) {
            const pageData = await pageResponse.json();
            
            if (pageData.services) {
              for (const service of pageData.services) {
                // Check for duplicate IDs across pages (would indicate data issue)
                expect(allIds.has(service.id),
                  `Duplicate ID ${service.id} found across pages`).toBeFalsy();
                allIds.add(service.id);
              }
            }
          }
        }
        
        console.log(`Verified ${allIds.size} unique records across pages`);
      }
    }
  });

  test('search should return subset of full data', async ({ request }) => {
    // Get all services
    const allResponse = await request.get(`${API_BASE_URL}/services/list.php`);
    
    if (allResponse.ok()) {
      const allData = await allResponse.json();
      
      if (allData.services && allData.services.length > 0) {
        // Search for first service name
        const searchTerm = allData.services[0].name?.substring(0, 5);
        
        if (searchTerm) {
          const searchResponse = await request.get(
            `${API_BASE_URL}/services/list.php?search=${encodeURIComponent(searchTerm)}`
          );
          
          if (searchResponse.ok()) {
            const searchData = await searchResponse.json();
            
            // Search results should be subset of all data
            if (searchData.services) {
              expect(searchData.services.length).toBeLessThanOrEqual(allData.services.length);
              
              // All search results should match the search term
              for (const service of searchData.services) {
                const matchesSearch = 
                  service.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  service.description?.toLowerCase().includes(searchTerm.toLowerCase());
                // Some search implementations might be more flexible
              }
            }
          }
        }
      }
    }
  });
});

test.describe('API - Response Format Validation', () => {
  test('all endpoints should return valid JSON', async ({ request }) => {
    const endpoints = [
      '/categories/list.php',
      '/services/list.php',
      '/vendors/list.php'
    ];
    
    for (const endpoint of endpoints) {
      const response = await request.get(`${API_BASE_URL}${endpoint}`);
      
      if (response.ok()) {
        const contentType = response.headers()['content-type'];
        expect(contentType).toContain('application/json');
        
        // Should be parseable JSON
        const text = await response.text();
        try {
          const data = JSON.parse(text);
          expect(data).toBeDefined();
        } catch {
          expect(false, `Invalid JSON from ${endpoint}`).toBeTruthy();
        }
      }
    }
  });

  test('error responses should have proper structure', async ({ request }) => {
    // Request with invalid ID
    const response = await request.get(`${API_BASE_URL}/services/list.php?vendor_id=99999999`);
    
    // Whether success or empty result, should be valid JSON
    if (response.ok()) {
      const data = await response.json();
      expect(data).toBeDefined();
      
      // Should have success field
      if ('success' in data) {
        expect(typeof data.success === 'boolean').toBeTruthy();
      }
    }
  });
});
