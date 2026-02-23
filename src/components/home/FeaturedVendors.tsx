'use client';

import Link from 'next/link';
import { MapPin, Star, Heart, BadgeCheck } from 'lucide-react';
import { Button, Badge } from '@/components/ui';

// Mock data for featured vendors
const featuredVendors = [
  {
    id: 1,
    name: 'Royal Photography Studio',
    category: 'Photographer',
    location: 'Manila',
    rating: 4.9,
    reviewCount: 234,
    priceRange: '₱25,000 - ₱150,000',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=300&fit=crop',
    isVerified: true,
  },
  {
    id: 2,
    name: 'Grand Palace Venue',
    category: 'Venue',
    location: 'Quezon City',
    rating: 4.8,
    reviewCount: 189,
    priceRange: '₱200,000 - ₱800,000',
    image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&h=300&fit=crop',
    isVerified: true,
  },
  {
    id: 3,
    name: 'Spice & Delight Catering',
    category: 'Caterer',
    location: 'Makati',
    rating: 4.7,
    reviewCount: 156,
    priceRange: '₱500 - ₱1,500 per pax',
    image: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=400&h=300&fit=crop',
    isVerified: false,
  },
  {
    id: 4,
    name: 'Glamour Makeup Studio',
    category: 'Makeup Artist',
    location: 'Cebu City',
    rating: 4.9,
    reviewCount: 312,
    priceRange: '₱15,000 - ₱50,000',
    image: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400&h=300&fit=crop',
    isVerified: true,
  },
];

export function FeaturedVendors() {
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

        {/* Vendors Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredVendors.map((vendor) => (
            <Link key={vendor.id} href={`/vendors/${vendor.id}`} className="group">
              <div className="bg-dark-950 border border-dark-800 rounded-2xl overflow-hidden hover:border-pink-400/30 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-pink-400/5">
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={vendor.image}
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
                    <Badge variant="pink" size="sm">{vendor.category}</Badge>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  {/* Name & Verified */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-white font-semibold text-lg leading-tight group-hover:text-pink-300 transition-colors">
                      {vendor.name}
                    </h3>
                    {vendor.isVerified && (
                      <BadgeCheck className="w-5 h-5 text-pink-400 flex-shrink-0" />
                    )}
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-1 text-dark-400 text-sm mb-3">
                    <MapPin className="w-4 h-4" />
                    <span>{vendor.location}</span>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-white font-medium">{vendor.rating}</span>
                    </div>
                    <span className="text-dark-500">({vendor.reviewCount} reviews)</span>
                  </div>

                  {/* Price */}
                  <p className="text-pink-300 font-medium text-sm">
                    {vendor.priceRange}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
