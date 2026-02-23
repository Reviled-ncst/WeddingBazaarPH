/**
 * API Module Tests
 * Tests for the core API request helper and authentication
 */

import { api, authApi } from '@/lib/api';

describe('API Module', () => {
  const mockFetch = global.fetch as jest.Mock;

  describe('api.get', () => {
    it('should make a GET request with correct headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { id: 1 } }),
      });

      const result = await api.get('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
      expect(result.success).toBe(true);
    });

    it('should include auth token when available', async () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValueOnce('test-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await api.get('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Not found' }),
      });

      const result = await api.get('/nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not found');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await api.get('/test');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('api.post', () => {
    it('should make a POST request with JSON body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { created: true } }),
      });

      const result = await api.post('/test', { name: 'Test' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'Test' }),
        })
      );
      expect(result.success).toBe(true);
    });
  });

  describe('api.put', () => {
    it('should make a PUT request with JSON body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await api.put('/test/1', { name: 'Updated' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test/1'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ name: 'Updated' }),
        })
      );
    });
  });

  describe('api.delete', () => {
    it('should make a DELETE request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await api.delete('/test/1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test/1'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });
});

describe('Auth API', () => {
  const mockFetch = global.fetch as jest.Mock;

  describe('authApi.login', () => {
    it('should send login credentials', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { token: 'jwt-token', user: { id: 1, email: 'test@example.com' } },
        }),
      });

      const result = await authApi.login('test@example.com', 'password123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login.php'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
        })
      );
      expect(result.success).toBe(true);
    });

    it('should handle invalid credentials', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Invalid credentials' }),
      });

      const result = await authApi.login('wrong@example.com', 'wrongpass');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
    });
  });

  describe('authApi.register', () => {
    it('should send registration data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { user: { id: 1, email: 'new@example.com' } },
        }),
      });

      const result = await authApi.register({
        email: 'new@example.com',
        password: 'password123',
        name: 'New User',
        role: 'individual',
        phone: '09123456789',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/register.php'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('new@example.com'),
        })
      );
      expect(result.success).toBe(true);
    });

    it('should handle duplicate email error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Email already exists' }),
      });

      const result = await authApi.register({
        email: 'existing@example.com',
        password: 'password123',
        name: 'Test User',
        role: 'vendor',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email already exists');
    });
  });
});
