'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCategories } from '@/contexts/CategoriesContext';
import { 
  Search, MapPin, Star, BadgeCheck, Camera, Building, UtensilsCrossed, 
  Flower2, Music, Video, Palette, Sparkles, Users, Filter
} from 'lucide-react';
import { Button, Badge, Card } from '@/components/ui';
import { vendorsApi, coordinatorsApi } from '@/lib/api';

interface Provider {
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
  type: 'provider' | 'coordinator';
}

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
  venues: [
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
  entertainment: [
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
  'hair-makeup': [
    'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&h=300&fit=crop',
  ],
  decoration: [
    'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&h=300&fit=crop',
  ],
  coordinator: [
    'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=400&h=300&fit=crop',
  ],
  planners: [
    'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=400&h=300&fit=crop',
  ],
  cakes: [
    'https://images.unsplash.com/photo-1535254973040-607b474d7f5a?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1558301211-0d8c8ddee6ec?w=400&h=300&fit=crop',
  ],
  attire: [
    'https://images.unsplash.com/photo-1594463750939-ebb28c3f7f75?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1550005809-91ad75fb315f?w=400&h=300&fit=crop',
  ],
  transportation: [
    'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&h=300&fit=crop',
  ],
};

export default function DiscoverPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-400"></div>
      </div>
    }>
      <DiscoverContent />
    </Suspense>
  );
}

function DiscoverContent() {
  const { user, isLoading } = useAuth();
  const { categories, getIconComponent } = useCategories();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [allProviders, setAllProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  // Build category filter options from context
  const categoryFilters = [
    { id: 'all', label: 'All', icon: Sparkles },
    { id: 'coordinator', label: 'Coordinators', icon: Users },
    ...categories.map(cat => ({
      id: cat.slug,
      label: cat.name,
      icon: getIconComponent(cat.icon)
    }))
  ];

  // Sync search from URL params
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    if (urlSearch !== searchQuery) {
      setSearchQuery(urlSearch);
    }
  }, [searchParams]);

  useEffect(() => {
    // Redirect non-couples to their appropriate pages
    if (!isLoading && user) {
      if (user.role === 'vendor') {
        router.push('/vendor-dashboard');
      } else if (user.role === 'coordinator') {
        router.push('/coordinator-dashboard');
      }
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    fetchAllProviders();
  }, []);

  const fetchAllProviders = async () => {
    setLoading(true);
    try {
      // Fetch both vendors and coordinators
      const [vendorsRes, coordinatorsRes] = await Promise.all([
        vendorsApi.list({ limit: 50 }),
        coordinatorsApi.list(),
      ]);

      const providers: Provider[] = [];

      if (vendorsRes.success && vendorsRes.data) {
        const vendorData = vendorsRes.data as { vendors: Provider[] };
        (vendorData.vendors || []).forEach((v) => {
          providers.push({ ...v, type: 'provider' });
        });
      }

      if (coordinatorsRes.success && coordinatorsRes.data) {
        const coordData = coordinatorsRes.data as { coordinators: Provider[] };
        (coordData.coordinators || []).forEach((c) => {
          providers.push({ ...c, category: 'coordinator', type: 'coordinator' });
        });
      }

      // Sort by rating
      providers.sort((a, b) => b.rating - a.rating);
      setAllProviders(providers);
    } catch (error) {
      console.error('Failed to fetch providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProviderImage = (provider: Provider) => {
    if (provider.images && provider.images.length > 0) {
      return provider.images[0];
    }
    // Use vendor ID to vary the fallback image
    const images = categoryImages[provider.category] || categoryImages.photography;
    return images[provider.id % images.length];
  };

  const filteredProviders = allProviders.filter((provider) => {
    const matchesCategory = selectedCategory === 'all' || provider.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      provider.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const formatPrice = (priceRange: string | null | undefined) => {
    if (!priceRange) return 'Price on request';
    // Replace ??? with PHP peso sign
    return priceRange.replace(/\?\?\?/g, '₱');
  };

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Filter Bar */}
      <section className="sticky top-16 z-40 bg-dark-900/95 backdrop-blur-sm border-b border-dark-800 py-4">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            <Filter className="w-5 h-5 text-gray-400 flex-shrink-0" />
            {categoryFilters.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                    isActive
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
        </div>
      </section>

      {/* Results Header */}
      <section className="py-6 border-b border-dark-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">
                {selectedCategory === 'all' 
                  ? 'All Providers' 
                  : selectedCategory === 'coordinator'
                  ? 'Wedding Coordinators'
                  : categoryFilters.find(c => c.id === selectedCategory)?.label || 'Providers'}
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                {filteredProviders.length} {filteredProviders.length === 1 ? 'result' : 'results'} found
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Results Grid */}
      <section className="py-8">
        <div className="max-w-6xl mx-auto px-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(9)].map((_, i) => (
                <Card key={i} className="h-72 animate-pulse bg-dark-800" />
              ))}
            </div>
          ) : filteredProviders.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-16 h-16 mx-auto text-gray-600 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No providers found</h3>
              <p className="text-gray-400 mb-4">Try adjusting your filters or search query</p>
              <Button onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProviders.map((provider) => (
                <Link key={`${provider.type}-${provider.id}`} href={`/vendors/${provider.id}`}>
                  <Card className="overflow-hidden hover:border-pink-500/30 transition-all group h-full">
                    <div className="relative h-44">
                      <img
                        src={getProviderImage(provider)}
                        alt={provider.business_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 left-2">
                        <Badge 
                          variant={provider.type === 'coordinator' ? 'pink' : 'default'}
                          className="flex items-center gap-1"
                        >
                          {provider.type === 'coordinator' ? (
                            <><Users className="w-3 h-3" /> Coordinator</>
                          ) : (
                            <span className="capitalize">{provider.category}</span>
                          )}
                        </Badge>
                      </div>
                      {provider.is_verified && (
                        <div className="absolute top-2 right-2">
                          <Badge variant="success" className="flex items-center gap-1">
                            <BadgeCheck className="w-3 h-3" />
                            Verified
                          </Badge>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-white font-semibold truncate mb-1">{provider.business_name}</h3>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-gray-500" />
                          <span className="text-gray-500 text-sm truncate">{provider.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="text-white text-sm">{provider.rating?.toFixed(1) || '0.0'}</span>
                          <span className="text-gray-500 text-sm">({provider.review_count || 0})</span>
                        </div>
                      </div>
                      <p className="text-gray-400 text-sm line-clamp-2 mb-3">{provider.description}</p>
                      <p className="text-pink-400 font-medium">{formatPrice(provider.price_range)}</p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
