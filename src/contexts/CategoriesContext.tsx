'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LucideIcon, Camera, Video, MapPin, UtensilsCrossed, Palette, Flower2, Sparkles, Music, Cake, CalendarHeart, Shirt, Car, Gem, Users, Gift, BookOpen, Church, Plane, Scissors } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/wedding-bazaar-api';

export interface Subcategory {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  description?: string;
  sort_order: number;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  image?: string;
  sort_order: number;
  subcategories?: Subcategory[];
}

interface CategoriesContextType {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getCategoryBySlug: (slug: string) => Category | undefined;
  getIconComponent: (iconName?: string) => LucideIcon;
}

const CategoriesContext = createContext<CategoriesContextType | null>(null);

// Map icon names to Lucide components
const iconMap: Record<string, LucideIcon> = {
  Camera,
  Video,
  MapPin,
  UtensilsCrossed,
  Palette,
  Flower2,
  Sparkles,
  Music,
  Cake,
  CalendarHeart,
  Shirt,
  Car,
  Gem,
  Users,
  Gift,
  BookOpen,
  Church,
  Plane,
  Scissors,
};

// Default fallback categories if API fails
const defaultCategories: Category[] = [
  { id: 1, name: 'Photography', slug: 'photography', icon: 'Camera', sort_order: 1, subcategories: [] },
  { id: 2, name: 'Videography', slug: 'videography', icon: 'Video', sort_order: 2, subcategories: [] },
  { id: 3, name: 'Venues', slug: 'venues', icon: 'MapPin', sort_order: 3, subcategories: [] },
  { id: 4, name: 'Catering', slug: 'catering', icon: 'UtensilsCrossed', sort_order: 4, subcategories: [] },
  { id: 5, name: 'Decoration', slug: 'decoration', icon: 'Palette', sort_order: 5, subcategories: [] },
  { id: 6, name: 'Florist', slug: 'florist', icon: 'Flower2', sort_order: 6, subcategories: [] },
  { id: 7, name: 'Hair & Makeup', slug: 'hair-makeup', icon: 'Sparkles', sort_order: 7, subcategories: [] },
  { id: 8, name: 'Entertainment', slug: 'entertainment', icon: 'Music', sort_order: 8, subcategories: [] },
  { id: 9, name: 'Cakes & Desserts', slug: 'cakes', icon: 'Cake', sort_order: 9, subcategories: [] },
  { id: 10, name: 'Wedding Planners', slug: 'planners', icon: 'CalendarHeart', sort_order: 10, subcategories: [] },
  { id: 11, name: 'Attire', slug: 'attire', icon: 'Shirt', sort_order: 11, subcategories: [] },
  { id: 12, name: 'Transportation', slug: 'transportation', icon: 'Car', sort_order: 12, subcategories: [] },
];

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/categories/list.php`);
      const data = await response.json();
      
      if (data.success && data.data && data.data.length > 0) {
        setCategories(data.data);
      } else {
        // Use defaults if no data from API
        setCategories(defaultCategories);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      setError('Failed to load categories');
      // Keep using defaults on error
      setCategories(defaultCategories);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const getCategoryBySlug = (slug: string) => {
    return categories.find(c => c.slug === slug);
  };

  const getIconComponent = (iconName?: string): LucideIcon => {
    if (!iconName) return Camera;
    return iconMap[iconName] || Camera;
  };

  return (
    <CategoriesContext.Provider value={{
      categories,
      isLoading,
      error,
      refetch: fetchCategories,
      getCategoryBySlug,
      getIconComponent,
    }}>
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories() {
  const context = useContext(CategoriesContext);
  if (!context) {
    throw new Error('useCategories must be used within a CategoriesProvider');
  }
  return context;
}
