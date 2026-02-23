'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, Star, Heart, BadgeCheck, Loader2 } from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import { api } from '@/lib/api';

interface FeaturedVendor {
  id: number;
  name: string;
  category: string;
  category_name?: string;
  location: string;
  rating: number;
  review_count: number;
  price_range: string;
  image: string | null;
  is_verified: boolean;
  description?: string;
}

// Category label mapping
const categoryLabels: Record<string, string> = {
  photography: 'Photography',
  videography: 'Videography',
  venue: 'Venue',
  catering: 'Catering',
  florist: 'Florist',
  music: 'Music & DJ',
  makeup: 'Hair & Makeup',
  decoration: 'Decoration',
  coordinator: 'Coordinator',
};

// Category placeholder images
const categoryImages: Record<string, string> = {
  photography: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=300&fit=crop',
  videography: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400&h=300&fit=crop',
  venue: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&h=300&fit=crop',
  catering: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=400&h=300&fit=crop',
  florist: 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=400&h=300&fit=crop',
  music: 'https://images.unsplash.com/photo-1501612780327-45045538702b?w=400&h=300&fit=crop',
  makeup: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400&h=300&fit=crop',
  decoration: 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=400&h=300&fit=crop',
  coordinator: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=300&fit=crop',
};

export function FeaturedVendors() {
  const [vendors, setVendors] = useState<FeaturedVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        setLoading(true);
        const response = await api.get<{ success: boolean; vendors: FeaturedVendor[] }>('/public/featured-vendors.php?limit=8');
        if (response.data?.vendors) {
          setVendors(response.data.vendors);
        }
      } catch (err) {
        console.error('Failed to fetch featured vendors:', err);
        setError('Failed to load vendors');
      } finally {
        setLoading(false);
      }
    };

    fetchVendors();
  }, []);

  const getVendorImage = (vendor: FeaturedVendor) => {
    if (vendor.image) {
      // Handle relative URLs from API
      if (vendor.image.startsWith('/')) {
        return `${process.env.NEXT_PUBLIC_API_URL || 'https://weddingbazaarph-testing.up.railway.app'}${vendor.image}`;
      }
      return vendor.image;
    }
    return categoryImages[vendor.category] || categoryImages.photography;
  };

  return (
    <section className="py-24 bg-dark-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
          <div>
            <h2 className="text-4xl font-serif font-bold text-white mb-4">
              Featured Providers
            </h2>
            <p className="text-dark-400 text-lg max-w-xl">
              Handpicked wedding professionals with outstanding reviews and verified credentials
            </p>
          </div>
          <Link href="/discover">
            <Button variant="outline" className="mt-6 md:mt-0">
              View All Providers
            </Button>
          </Link>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-pink-400 animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-16">
            <p className="text-dark-400">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && vendors.length === 0 && (
          <div className="text-center py-16">
            <p className="text-dark-400">No featured vendors available at the moment.</p>
          </div>
        )}

        {/* Vendors Grid */}
        {!loading && vendors.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {vendors.map((vendor) => (
              <Link key={vendor.id} href={`/vendors/${vendor.id}`} className="group">
                <div className="bg-dark-950 border border-dark-800 rounded-2xl overflow-hidden hover:border-pink-400/30 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-pink-400/5">
                  {/* Image */}
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={getVendorImage(vendor)}
                      alt={vendor.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Favorite button */}
                    <button 
                      className="absolute top-3 right-3 p-2 bg-dark-950/80 backdrop-blur-sm rounded-full hover:bg-pink-400 transition-colors"
                      onClick={(e) => e.preventDefault()}
                    >
                      <Heart className="w-4 h-4 text-white" />
                    </button>
                    {/* Category badge */}
                    <div className="absolute bottom-3 left-3">
                      <Badge variant="pink" size="sm">
                        {vendor.category_name || categoryLabels[vendor.category] || vendor.category}
                      </Badge>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    {/* Name & Verified */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-white font-semibold text-lg leading-tight group-hover:text-pink-300 transition-colors">
                        {vendor.name}
                      </h3>
                      {vendor.is_verified && (
                        <BadgeCheck className="w-5 h-5 text-pink-400 flex-shrink-0" />
                      )}
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-1 text-dark-400 text-sm mb-3">
                      <MapPin className="w-4 h-4" />
                      <span>{vendor.location || 'Metro Manila'}</span>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-white font-medium">{vendor.rating.toFixed(1)}</span>
                      </div>
                      <span className="text-dark-500">({vendor.review_count} reviews)</span>
                    </div>

                    {/* Price */}
                    <p className="text-pink-300 font-medium text-sm">
                      {vendor.price_range}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
