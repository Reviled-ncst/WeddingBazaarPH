import { ApiResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/wedding-bazaar-api';

// Get auth token from localStorage
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

// API request helper
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const json = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: json.message || 'An error occurred',
      };
    }

    // If API returns { success, data } structure, extract data
    if (json.success !== undefined && json.data !== undefined) {
      return {
        success: json.success,
        data: json.data,
        error: json.message,
      };
    }

    return {
      success: true,
      data: json,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// API methods
export const api = {
  // GET request
  get: <T>(endpoint: string) => 
    apiRequest<T>(endpoint, { method: 'GET' }),

  // POST request
  post: <T>(endpoint: string, body: unknown) =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  // PUT request
  put: <T>(endpoint: string, body: unknown) =>
    apiRequest<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  // DELETE request
  delete: <T>(endpoint: string) =>
    apiRequest<T>(endpoint, { method: 'DELETE' }),
};

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login.php', { email, password }),
  
  register: (data: {
    email: string;
    password: string;
    name: string;
    role: 'individual' | 'vendor' | 'coordinator';
    phone?: string;
  }) => api.post('/auth/register.php', data),
  
  logout: () => api.post('/auth/logout.php', {}),
};

// Vendors API
export const vendorsApi = {
  list: (params?: { category?: string; location?: string; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.set('category', params.category);
    if (params?.location) searchParams.set('location', params.location);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    return api.get(`/vendors/list.php?${searchParams.toString()}`);
  },
  
  detail: (id: number) => api.get(`/vendors/get.php?id=${id}`),
  
  create: (data: FormData) =>
    fetch(`${API_BASE_URL}/vendors/create.php`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getToken()}` },
      body: data,
    }),
};

// Coordinators API
export const coordinatorsApi = {
  list: (params?: { location?: string; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.location) searchParams.set('location', params.location);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    return api.get(`/coordinators/list.php?${searchParams.toString()}`);
  },
  
  detail: (id: number) => api.get(`/coordinators/get.php?id=${id}`),
  
  // Saved coordinators
  checkSaved: (coordinatorId: number, userId?: number) => {
    const params = new URLSearchParams();
    params.set('coordinator_id', coordinatorId.toString());
    if (userId) params.set('user_id', userId.toString());
    return api.get(`/saved/check-coordinator.php?${params.toString()}`);
  },
  
  toggleSaved: (coordinatorId: number, userId: number) =>
    api.post('/saved/toggle-coordinator.php', { coordinator_id: coordinatorId, user_id: userId }),
  
  listSaved: (userId: number) =>
    api.get(`/saved/list-coordinators.php?user_id=${userId}`),
  
  // Bookings
  createBooking: (data: {
    user_id: number;
    coordinator_id: number;
    service_id?: number;
    event_date: string;
    notes?: string;
    guest_count?: number;
    event_location?: string;
    event_latitude?: number;
    event_longitude?: number;
    travel_fee?: number;
    total_price?: number;
  }) => api.post('/coordinator-bookings/create.php', data),
  
  listBookings: (params: { user_id?: number; coordinator_id?: number; status?: string }) => {
    const searchParams = new URLSearchParams();
    if (params.user_id) searchParams.set('user_id', params.user_id.toString());
    if (params.coordinator_id) searchParams.set('coordinator_id', params.coordinator_id.toString());
    if (params.status) searchParams.set('status', params.status);
    return api.get(`/coordinator-bookings/list.php?${searchParams.toString()}`);
  },
  
  updateBookingStatus: (bookingId: number, status: string) =>
    api.post('/coordinator-bookings/update-status.php', { booking_id: bookingId, status }),
};

// Bookings API
export const bookingsApi = {
  create: (data: {
    vendor_id: number;
    service_id: number;
    event_date: string;
    notes?: string;
  }) => api.post('/bookings/create.php', data),
  
  list: () => api.get('/bookings/list.php'),
  
  update: (id: number, status: string) =>
    api.put(`/bookings/update.php?id=${id}`, { status }),
};

// Services API
export const servicesApi = {
  categories: () => api.get('/services/categories.php'),
};

// Saved Vendors API
export const savedApi = {
  check: (vendorId: number, userId?: number) => {
    const params = new URLSearchParams();
    params.set('vendor_id', vendorId.toString());
    if (userId) params.set('user_id', userId.toString());
    return api.get(`/saved/check.php?${params.toString()}`);
  },
  toggle: (vendorId: number) => api.post('/saved/toggle.php', { vendor_id: vendorId }),
  list: (userId: number) => api.get(`/saved/list.php?user_id=${userId}`),
};

// Reviews API
export const reviewsApi = {
  list: (vendorId?: number, userId?: number) => {
    const params = new URLSearchParams();
    if (vendorId) params.set('vendor_id', vendorId.toString());
    if (userId) params.set('user_id', userId.toString());
    return api.get(`/reviews/list.php?${params.toString()}`);
  },
  create: (data: { booking_id: number; rating: number; comment?: string }) =>
    api.post('/reviews/create.php', data),
};

// Messages API
export const messagesApi = {
  // Direct messages
  conversations: (userId: number) =>
    api.get(`/messages/conversations.php?user_id=${userId}`),
  list: (userId: number, otherUserId: number) =>
    api.get(`/messages/list.php?user_id=${userId}&other_user_id=${otherUserId}`),
  send: (senderId: number, receiverId: number, content: string) =>
    api.post('/messages/send.php', { sender_id: senderId, receiver_id: receiverId, content }),
  
  // Group messages
  groupConversations: (userId: number) =>
    api.get(`/messages/group-conversations.php?user_id=${userId}`),
  createGroup: (createdBy: number, name: string, participantIds: number[]) =>
    api.post('/messages/create-group.php', { created_by: createdBy, name, participant_ids: participantIds }),
  groupMessages: (conversationId: number, userId: number) =>
    api.get(`/messages/group-list.php?conversation_id=${conversationId}&user_id=${userId}`),
  sendGroup: (conversationId: number, senderId: number, content: string) =>
    api.post('/messages/send-group.php', { conversation_id: conversationId, sender_id: senderId, content }),
};

// Coordinator Dashboard API
export const coordinatorApi = {
  // Clients
  listClients: (status?: string) => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    return api.get(`/coordinator/clients.php?${params.toString()}`);
  },
  createClient: (data: {
    couple_name: string;
    partner1_name?: string;
    partner2_name?: string;
    email?: string;
    phone?: string;
    wedding_date?: string;
    venue_name?: string;
    budget?: number;
    notes?: string;
  }) => api.post('/coordinator/clients.php', data),
  updateClient: (id: number, data: Record<string, unknown>) =>
    api.put(`/coordinator/client-update.php?id=${id}`, data),
  deleteClient: (id: number) =>
    api.delete(`/coordinator/client-update.php?id=${id}`),

  // Events
  listEvents: (params?: { status?: string; client_id?: number; upcoming?: boolean }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.client_id) searchParams.set('client_id', params.client_id.toString());
    if (params?.upcoming) searchParams.set('upcoming', '1');
    return api.get(`/coordinator/events.php?${searchParams.toString()}`);
  },
  createEvent: (data: {
    title: string;
    event_date: string;
    client_id?: number;
    event_time?: string;
    location?: string;
    description?: string;
    event_type?: string;
  }) => api.post('/coordinator/events.php', data),
  updateEvent: (id: number, data: Record<string, unknown>) =>
    api.put(`/coordinator/event-update.php?id=${id}`, data),
  deleteEvent: (id: number) =>
    api.delete(`/coordinator/event-update.php?id=${id}`),

  // Tasks
  listTasks: (params?: { completed?: boolean; event_id?: number; client_id?: number; priority?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.completed !== undefined) searchParams.set('completed', params.completed.toString());
    if (params?.event_id) searchParams.set('event_id', params.event_id.toString());
    if (params?.client_id) searchParams.set('client_id', params.client_id.toString());
    if (params?.priority) searchParams.set('priority', params.priority);
    return api.get(`/coordinator/tasks.php?${searchParams.toString()}`);
  },
  createTask: (data: {
    title: string;
    event_id?: number;
    client_id?: number;
    description?: string;
    due_date?: string;
    priority?: string;
  }) => api.post('/coordinator/tasks.php', data),
  updateTask: (id: number, data: Record<string, unknown>) =>
    api.put(`/coordinator/task-update.php?id=${id}`, data),
  deleteTask: (id: number) =>
    api.delete(`/coordinator/task-update.php?id=${id}`),
};

// Admin Dashboard API
export const adminApi = {
  // Dashboard Stats
  getStats: () => api.get('/admin/stats.php'),

  // Activity Logs
  getActivityLogs: (params?: {
    action?: string;
    role?: string;
    date_from?: string;
    date_to?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.action) searchParams.set('action', params.action);
    if (params?.role) searchParams.set('role', params.role);
    if (params?.date_from) searchParams.set('date_from', params.date_from);
    if (params?.date_to) searchParams.set('date_to', params.date_to);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    return api.get(`/admin/activity-logs.php?${searchParams.toString()}`);
  },

  // Users
  getUsers: (params?: {
    role?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.role) searchParams.set('role', params.role);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    return api.get(`/admin/users.php?${searchParams.toString()}`);
  },
  updateUser: (userId: number, action: string, reason?: string) =>
    api.put('/admin/users.php', { user_id: userId, action, reason }),

  // Login Security
  getLoginAttempts: (params?: { status?: string; search?: string; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams({ type: 'attempts' });
    if (params?.status) searchParams.set('status', params.status);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    return api.get(`/admin/login-security.php?${searchParams.toString()}`);
  },
  getAccountLockouts: (params?: { active_only?: boolean; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams({ type: 'lockouts' });
    if (params?.active_only) searchParams.set('active_only', 'true');
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    return api.get(`/admin/login-security.php?${searchParams.toString()}`);
  },
  unlockAccount: (lockoutId: number, reason?: string) =>
    api.post('/admin/login-security.php', { action: 'unlock', lockout_id: lockoutId, reason }),

  // Complaints
  getComplaints: (params?: {
    status?: string;
    priority?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.priority) searchParams.set('priority', params.priority);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    return api.get(`/admin/complaints.php?${searchParams.toString()}`);
  },
  updateComplaint: (complaintId: number, data: Record<string, unknown>) =>
    api.put('/admin/complaints.php', { complaint_id: complaintId, ...data }),

  // Support Tickets
  getTickets: (params?: {
    status?: string;
    priority?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.priority) searchParams.set('priority', params.priority);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    return api.get(`/admin/support-tickets.php?${searchParams.toString()}`);
  },
  getTicket: (ticketId: number) =>
    api.get(`/admin/support-tickets.php?ticket_id=${ticketId}`),
  replyToTicket: (ticketId: number, message: string, isInternal?: boolean) =>
    api.post('/admin/support-tickets.php', { ticket_id: ticketId, message, is_internal: isInternal }),
  updateTicket: (ticketId: number, data: Record<string, unknown>) =>
    api.put('/admin/support-tickets.php', { ticket_id: ticketId, ...data }),

  // Help Articles
  getHelpArticles: (params?: {
    category?: string;
    search?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.set('category', params.category);
    if (params?.search) searchParams.set('search', params.search);
    return api.get(`/admin/help-articles.php?${searchParams.toString()}`);
  },
  getHelpArticle: (idOrSlug: number | string) => {
    const param = typeof idOrSlug === 'number' ? `id=${idOrSlug}` : `slug=${idOrSlug}`;
    return api.get(`/admin/help-articles.php?${param}`);
  },
  createHelpArticle: (data: {
    category: string;
    title: string;
    content: string;
    excerpt?: string;
    tags?: string[];
    is_published?: boolean;
  }) => api.post('/admin/help-articles.php', data),
  updateHelpArticle: (id: number, data: Record<string, unknown>) =>
    api.put('/admin/help-articles.php', { id, ...data }),
  deleteHelpArticle: (id: number) =>
    api.delete(`/admin/help-articles.php?id=${id}`),

  // Location Logs
  getLocationLogs: (params?: {
    user_id?: number;
    role?: string;
    action?: string;
    region?: string;
    search?: string;
    purpose?: string;
    date_from?: string;
    date_to?: string;
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.user_id) searchParams.set('user_id', params.user_id.toString());
    if (params?.role) searchParams.set('role', params.role);
    if (params?.action) searchParams.set('action', params.action);
    if (params?.region) searchParams.set('region', params.region);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.purpose) searchParams.set('purpose', params.purpose);
    if (params?.date_from) searchParams.set('date_from', params.date_from);
    if (params?.date_to) searchParams.set('date_to', params.date_to);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    return api.get(`/admin/location-logs.php?${searchParams.toString()}`);
  },

  // Services (admin view)
  getServices: (params?: {
    category?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.set('category', params.category);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    return api.get(`/admin/services.php?${searchParams.toString()}`);
  },
  updateServiceStatus: (serviceId: number, updates: { status?: string; is_featured?: boolean }) =>
    api.put('/admin/services.php', { service_id: serviceId, ...updates }),
};
