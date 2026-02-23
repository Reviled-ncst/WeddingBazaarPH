import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Combine class names with tailwind-merge
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format price to currency
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(price);
}

// Format date
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'medium',
  }).format(new Date(date));
}

// Get initials from name
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Truncate text
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

// Generate rating stars
export function getRatingStars(rating: number): string {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  return '★'.repeat(fullStars) + (hasHalfStar ? '½' : '') + '☆'.repeat(emptyStars);
}

// Capitalize first letter
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Vendor category display names
export const categoryDisplayNames: Record<string, string> = {
  photographer: 'Photographer',
  videographer: 'Videographer',
  caterer: 'Caterer',
  venue: 'Venue',
  decorator: 'Decorator',
  florist: 'Florist',
  makeup: 'Makeup Artist',
  dj: 'DJ & Music',
  planner: 'Wedding Planner',
  cake: 'Cake & Bakery',
  invitation: 'Invitations',
  transport: 'Transport',
};
