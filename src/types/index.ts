// User types
export interface User {
  id: number;
  email: string;
  name: string;
  role: 'individual' | 'couple' | 'vendor' | 'coordinator' | 'admin';
  phone?: string;
  avatar?: string;
  email_verified?: boolean;
  phone_verified?: boolean;
  created_at: string;
}

// Vendor types
export interface Vendor {
  id: number;
  user_id: number;
  business_name: string;
  category: VendorCategory;
  description: string;
  location: string;
  price_range: string;
  rating: number;
  images: string[];
  is_verified: boolean;
  user?: User;
}

export type VendorCategory = 
  | 'photographer'
  | 'videographer'
  | 'caterer'
  | 'venue'
  | 'decorator'
  | 'florist'
  | 'makeup'
  | 'dj'
  | 'planner'
  | 'cake'
  | 'invitation'
  | 'transport';

// Service types
export interface Service {
  id: number;
  vendor_id: number;
  name: string;
  description: string;
  price: number;
  duration: string;
}

// Booking types
export interface Booking {
  id: number;
  user_id: number;
  vendor_id: number;
  service_id: number;
  event_date: string;
  status: BookingStatus;
  total_price: number;
  notes?: string;
  created_at: string;
  vendor?: Vendor;
  service?: Service;
  user?: User;
}

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

// Review types
export interface Review {
  id: number;
  user_id: number;
  vendor_id: number;
  booking_id: number;
  rating: number;
  comment: string;
  created_at: string;
  user?: User;
}

// Message types
export interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: User;
  receiver?: User;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: 'individual' | 'vendor';
  phone?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
