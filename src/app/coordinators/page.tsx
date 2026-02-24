'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Star, BadgeCheck, Heart, Users, Calendar, Award, MessageCircle } from 'lucide-react';
import { Button, Badge, Card } from '@/components/ui';
import { coordinatorsApi } from '@/lib/api';
import { formatPriceRange } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { MessageVendorModal } from '@/components/messaging/MessageVendorModal';

interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  duration: string;
}

interface Coordinator {
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
  services: Service[];
}

interface CoordinatorsResponse {
  coordinators: Coordinator[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const coordinatorImages = [
  'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1460978812857-470ed1c77af0?w=400&h=300&fit=crop',
];

export default function CoordinatorsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [messagingCoordinator, setMessagingCoordinator] = useState<{ id: number; name: string } | null>(null);

  useEffect(() => {
    fetchCoordinators();
  }, []);

  const fetchCoordinators = async () => {
    setLoading(true);
    try {
      const response = await coordinatorsApi.list({ limit: 20 });
      
      if (response.success && response.data) {
        const data = response.data as CoordinatorsResponse;
        setCoordinators(data.coordinators);
      }
    } catch (error) {
      console.error('Failed to fetch coordinators:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCoordinators = coordinators.filter(coordinator =>
    coordinator.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    coordinator.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-dark-900 to-dark-950 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Heart className="w-8 h-8 text-pink-400" />
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              Wedding Coordinators
            </h1>
          </div>
          <p className="text-gray-400 mb-8 max-w-2xl">
            Let our experienced wedding coordinators take the stress out of planning your special day. 
            From full planning to day-of coordination, find the perfect match for your vision.
          </p>

          {/* Search Bar */}
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search coordinators by name or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-pink-400"
            />
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-pink-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Expert Planners</h3>
            <p className="text-gray-400 text-sm">
              Verified coordinators with years of experience in Philippine weddings
            </p>
          </Card>
          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-6 h-6 text-pink-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Full Service</h3>
            <p className="text-gray-400 text-sm">
              From venue scouting to day-of coordination, all your needs covered
            </p>
          </Card>
          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="w-6 h-6 text-pink-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Top Rated</h3>
            <p className="text-gray-400 text-sm">
              Highly reviewed by couples for exceptional service and dedication
            </p>
          </Card>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-400">
            {loading ? 'Loading...' : `${filteredCoordinators.length} coordinators available`}
          </p>
        </div>

        {/* Coordinators List */}
        {loading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="flex gap-6">
                  <div className="w-48 h-32 bg-dark-800 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-3">
                    <div className="h-5 bg-dark-800 rounded w-1/3" />
                    <div className="h-4 bg-dark-800 rounded w-1/4" />
                    <div className="h-4 bg-dark-800 rounded w-full" />
                    <div className="h-4 bg-dark-800 rounded w-3/4" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : filteredCoordinators.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No coordinators found</h3>
            <p className="text-gray-400 mb-6">Try adjusting your search</p>
            <Button onClick={() => setSearchQuery('')}>
              Clear Search
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredCoordinators.map((coordinator, index) => (
              <Card 
                key={coordinator.id} 
                className="overflow-hidden hover:border-pink-500/50 transition-all"
              >
                <div className="flex flex-col md:flex-row">
                  {/* Image */}
                  <div className="relative w-full md:w-64 h-48 md:h-auto shrink-0">
                    <img
                      src={coordinator.images?.[0] || coordinatorImages[index % coordinatorImages.length]}
                      alt={coordinator.business_name}
                      className="w-full h-full object-cover"
                    />
                    {coordinator.is_verified && (
                      <div className="absolute top-3 left-3">
                        <Badge variant="success" className="flex items-center gap-1">
                          <BadgeCheck className="w-3 h-3" />
                          Verified
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6 flex-1">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-2">
                          {coordinator.business_name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <div className="flex items-center gap-1 text-gray-400">
                            <MapPin className="w-4 h-4" />
                            <span>{coordinator.location}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            <span className="text-white font-medium">{coordinator.rating.toFixed(1)}</span>
                            <span className="text-gray-500">({coordinator.review_count} reviews)</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-400">Starting from</p>
                        <p className="text-lg font-semibold text-pink-400">{formatPriceRange(coordinator.price_range)}</p>
                      </div>
                    </div>

                    <p className="text-gray-400 mb-4">
                      {coordinator.description}
                    </p>

                    {/* Services */}
                    {coordinator.services && coordinator.services.length > 0 && (
                      <div className="mb-4">
                        <button
                          onClick={() => setExpandedCard(expandedCard === coordinator.id ? null : coordinator.id)}
                          className="text-pink-400 text-sm hover:underline mb-2"
                        >
                          {expandedCard === coordinator.id ? 'Hide services' : `View ${coordinator.services.length} services`}
                        </button>
                        
                        {expandedCard === coordinator.id && (
                          <div className="space-y-2 mt-3">
                            {coordinator.services.map((service) => (
                              <div 
                                key={service.id}
                                className="bg-dark-800/50 rounded-lg p-3 flex items-center justify-between"
                              >
                                <div>
                                  <p className="text-white font-medium">{service.name}</p>
                                  <p className="text-gray-400 text-sm">{service.duration}</p>
                                </div>
                                <p className="text-pink-400 font-semibold">{formatPrice(service.price)}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Link href={`/vendors/${coordinator.id}`}>
                        <Button>View Profile</Button>
                      </Link>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          if (!user) {
                            router.push('/login');
                            return;
                          }
                          setMessagingCoordinator({ id: coordinator.id, name: coordinator.business_name });
                        }}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Contact
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Message Coordinator Modal */}
        {messagingCoordinator && (
          <MessageVendorModal
            isOpen={!!messagingCoordinator}
            onClose={() => setMessagingCoordinator(null)}
            vendorId={messagingCoordinator.id}
            vendorName={messagingCoordinator.name}
            userId={user?.id ?? null}
            onSuccess={() => {
              setMessagingCoordinator(null);
              router.push('/dashboard?tab=messages');
            }}
          />
        )}
      </div>
    </div>
  );
}
