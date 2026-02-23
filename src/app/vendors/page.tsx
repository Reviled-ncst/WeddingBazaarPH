'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, MapPin, Star, BadgeCheck, Camera, Building, UtensilsCrossed, Flower2, Music, Video, Palette, Sparkles } from 'lucide-react';
import { Button, Badge, Card } from '@/components/ui';
import { vendorsApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';

interface Vendor {
  id: number;
  business_name: string;
  category: string;
  description: string;
  location: string;
  price_range: string;
  rating: number;
  review_count: number;
  images: string[];
  is_verified: boolean;
  owner_name: string;
  phone: string;
  email: string;
}

interface VendorsResponse {
  vendors: Vendor[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const categories = [
  { id: 'all', label: 'All Services', icon: Sparkles },
  { id: 'photography', label: 'Photography', icon: Camera },
  { id: 'venue', label: 'Venues', icon: Building },
  { id: 'catering', label: 'Catering', icon: UtensilsCrossed },
  { id: 'florist', label: 'Florists', icon: Flower2 },
  { id: 'music', label: 'Music & DJ', icon: Music },
  { id: 'videography', label: 'Videography', icon: Video },
  { id: 'makeup', label: 'Makeup & Hair', icon: Palette },
  { id: 'decoration', label: 'Decoration', icon: Sparkles },
];

const categoryImages: Record<string, string[]> = {
  photography: [
    'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=400&h=300&fit=crop',
  ],
  venue: [
    'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400&h=300&fit=crop',
  ],
  catering: [
    'https://images.unsplash.com/photo-1555244162-803834f70033?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop',
  ],
  florist: [
    'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400&h=300&fit=crop',
  ],
  music: [
    'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
  ],
  videography: [
    'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=400&h=300&fit=crop',
  ],
  makeup: [
    'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&h=300&fit=crop',
  ],
  decoration: [
    'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&h=300&fit=crop',
  ],
};

const getVendorImage = (vendor: Vendor) => {
  if (vendor.images?.[0]) {
    return vendor.images[0];
  }
  const images = categoryImages[vendor.category] || categoryImages.photography;
  return images[vendor.id % images.length];
};

function VendorsContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category') || 'all';
  
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });

  useEffect(() => {
    fetchVendors();
  }, [selectedCategory]);

  const fetchVendors = async (page = 1) => {
    setLoading(true);
    try {
      const response = await vendorsApi.list({
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        page,
        limit: 12,
      });
      
      if (response.success && response.data) {
        const data = response.data as VendorsResponse;
        setVendors(data.vendors || []);
        setPagination({
          page: data.pagination?.page || 1,
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 0,
        });
      }
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVendors = vendors.filter(vendor =>
    vendor.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vendor.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCategoryLabel = (category: string) => {
    const cat = categories.find(c => c.id === category);
    return cat?.label || category;
  };

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-dark-900 to-dark-950 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Find Wedding Services
          </h1>
          <p className="text-gray-400 mb-8 max-w-2xl">
            Browse our curated selection of wedding vendors and service providers. 
            From photography to catering, find everything you need for your perfect day.
          </p>

          {/* Search Bar */}
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-pink-400"
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                    : 'bg-dark-800 text-gray-400 border border-dark-700 hover:text-white hover:border-dark-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-400">
            {loading ? 'Loading...' : `${pagination.total} providers found`}
          </p>
        </div>

        {/* Vendors Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden animate-pulse">
                <div className="h-48 bg-dark-800" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-dark-800 rounded w-3/4" />
                  <div className="h-3 bg-dark-800 rounded w-1/2" />
                  <div className="h-3 bg-dark-800 rounded w-full" />
                </div>
              </Card>
            ))}
          </div>
        ) : filteredVendors.length === 0 ? (
          <div className="text-center py-16">
            <Sparkles className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No providers found</h3>
            <p className="text-gray-400 mb-6">Try adjusting your search or filters</p>
            <Button onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}>
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVendors.map((vendor) => (
              <Link key={vendor.id} href={`/vendors/${vendor.id}`}>
                <Card className="overflow-hidden group hover:border-pink-500/50 transition-all cursor-pointer h-full">
                  {/* Image */}
                  <div className="relative h-48 bg-dark-800">
                    <img
                      src={getVendorImage(vendor)}
                      alt={vendor.business_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {vendor.is_verified && (
                      <div className="absolute top-3 right-3">
                        <Badge variant="success" className="flex items-center gap-1">
                          <BadgeCheck className="w-3 h-3" />
                          Verified
                        </Badge>
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <Badge variant="default">
                        {getCategoryLabel(vendor.category)}
                      </Badge>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-pink-400 transition-colors">
                      {vendor.business_name}
                    </h3>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                      <MapPin className="w-4 h-4" />
                      <span>{vendor.location}</span>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-white font-medium">{vendor.rating.toFixed(1)}</span>
                      </div>
                      <span className="text-gray-500">({vendor.review_count} reviews)</span>
                    </div>

                    <p className="text-gray-400 text-sm line-clamp-2 mb-3">
                      {vendor.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="text-pink-400 font-medium text-sm">
                        {vendor.price_range}
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {[...Array(pagination.totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => fetchVendors(i + 1)}
                className={`w-10 h-10 rounded-lg transition-colors ${
                  pagination.page === i + 1
                    ? 'bg-pink-500 text-white'
                    : 'bg-dark-800 text-gray-400 hover:bg-dark-700'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function VendorsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-400"></div>
      </div>
    }>
      <VendorsContent />
    </Suspense>
  );
}
