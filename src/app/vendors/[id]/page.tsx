'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  MapPin, Star, Heart, BadgeCheck, Phone, Mail, 
  Calendar, ChevronLeft, ChevronRight, MessageCircle, ArrowLeft
} from 'lucide-react';
import { Button, Badge, Card } from '@/components/ui';
import { vendorsApi, savedApi } from '@/lib/api';
import { BookingModal } from '@/components/booking/BookingModal';
import { MessageVendorModal } from '@/components/messaging/MessageVendorModal';

interface ServiceImage {
  url: string;
  filename?: string;
  originalName?: string;
}

interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  duration: string;
  is_active: boolean;
  images?: ServiceImage[];
}

interface Review {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  user_name: string;
}

interface VendorDetail {
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
  reviews: Review[];
  created_at: string;
  // Travel pricing
  latitude?: number;
  longitude?: number;
  base_travel_fee?: number;
  per_km_rate?: number;
  free_km_radius?: number;
}

const categoryImages: Record<string, string[]> = {
  photography: [
    'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&h=600&fit=crop',
  ],
  venue: [
    'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=800&h=600&fit=crop',
  ],
  catering: [
    'https://images.unsplash.com/photo-1555244162-803834f70033?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop',
  ],
  florist: [
    'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=800&h=600&fit=crop',
  ],
  music: [
    'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop',
  ],
  makeup: [
    'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&h=600&fit=crop',
  ],
  videography: [
    'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=800&h=600&fit=crop',
  ],
  decoration: [
    'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&h=600&fit=crop',
  ],
  coordinator: [
    'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&h=600&fit=crop',
  ],
};

const getCategoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    photography: 'Photography',
    venue: 'Venue',
    catering: 'Catering',
    florist: 'Florist',
    music: 'Music & DJ',
    videography: 'Videography',
    makeup: 'Makeup & Hair',
    decoration: 'Decoration',
    coordinator: 'Wedding Coordinator',
  };
  return labels[category] || category;
};

export default function VendorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const vendorId = Number(params.id);
  
  const [vendor, setVendor] = useState<VendorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  
  // User authentication state
  const [userId, setUserId] = useState<number | null>(null);
  
  // Modal states
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [highlightPackages, setHighlightPackages] = useState(false);
  
  // Refs
  const servicesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check for logged in user
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user.role === 'couple') {
          setUserId(user.id);
        }
      } catch (e) {
        console.error('Error parsing user data');
      }
    }
  }, []);

  useEffect(() => {
    if (vendorId) {
      fetchVendor();
    }
  }, [vendorId]);

  // Check if vendor is saved
  useEffect(() => {
    const checkSaved = async () => {
      if (!userId || !vendorId) return;
      try {
        const response = await savedApi.check(vendorId);
        if (response.success && response.data) {
          setIsSaved((response.data as { is_saved: boolean }).is_saved);
        }
      } catch (error) {
        console.error('Failed to check saved status:', error);
      }
    };
    checkSaved();
  }, [userId, vendorId]);

  const handleToggleSave = async () => {
    if (!userId) {
      router.push('/login?redirect=' + encodeURIComponent(`/vendors/${vendorId}`));
      return;
    }
    
    setSavingStatus(true);
    try {
      const response = await savedApi.toggle(vendorId);
      if (response.success && response.data) {
        setIsSaved((response.data as { is_saved: boolean }).is_saved);
      }
    } catch (error) {
      console.error('Failed to toggle save:', error);
    } finally {
      setSavingStatus(false);
    }
  };

  const fetchVendor = async () => {
    setLoading(true);
    try {
      const response = await vendorsApi.detail(vendorId);
      if (response.success && response.data) {
        setVendor(response.data as VendorDetail);
      }
    } catch (error) {
      console.error('Failed to fetch vendor:', error);
    } finally {
      setLoading(false);
    }
  };

  const getImages = () => {
    // 1. Use vendor profile images if available
    if (vendor?.images && vendor.images.length > 0) {
      return vendor.images;
    }
    
    // 2. Use service images if vendor has no profile images
    if (vendor?.services && vendor.services.length > 0) {
      const serviceImages: string[] = [];
      for (const service of vendor.services) {
        if (service.images && Array.isArray(service.images)) {
          for (const img of service.images) {
            const url = typeof img === 'string' ? img : img.url;
            if (url) {
              // Add localhost prefix if it's a relative URL
              const fullUrl = url.startsWith('http') ? url : `http://localhost${url}`;
              serviceImages.push(fullUrl);
            }
          }
        }
      }
      if (serviceImages.length > 0) {
        return serviceImages;
      }
    }
    
    // 3. Fall back to category stock photos
    return categoryImages[vendor?.category || 'photography'] || categoryImages.photography;
  };

  const images = vendor ? getImages() : [];

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleBookService = (service: Service) => {
    if (!userId) {
      router.push('/login?redirect=' + encodeURIComponent(`/vendors/${vendorId}`));
      return;
    }
    setSelectedService(service);
    setShowBookingModal(true);
  };

  const handleBookGeneral = () => {
    if (!userId) {
      router.push('/login?redirect=' + encodeURIComponent(`/vendors/${vendorId}`));
      return;
    }
    // If vendor has services, scroll to services section to select a package first
    if (vendor?.services && vendor.services.length > 0) {
      setHighlightPackages(true);
      servicesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Remove highlight after animation
      setTimeout(() => setHighlightPackages(false), 2000);
      return;
    }
    // No services - allow general booking
    setSelectedService(null);
    setShowBookingModal(true);
  };

  const handleSendMessage = (service?: Service) => {
    if (!userId) {
      router.push('/login?redirect=' + encodeURIComponent(`/vendors/${vendorId}`));
      return;
    }
    setSelectedService(service || null);
    setShowMessageModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-400"></div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-white mb-4">Provider not found</h2>
        <Link href="/vendors">
          <Button>Back to Services</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Breadcrumb */}
      <div className="bg-dark-900/50 border-b border-dark-800">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/vendors" className="text-gray-400 hover:text-pink-400 flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" />
              Back to Services
            </Link>
            <span className="text-dark-600">/</span>
            <span className="text-pink-400">{vendor.business_name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images & Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <Card className="overflow-hidden">
              <div className="relative h-64 md:h-96">
                <img
                  src={images[currentImage]}
                  alt={vendor.business_name}
                  className="w-full h-full object-cover"
                />
                
                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-dark-900/80 rounded-full text-white hover:bg-dark-900"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-dark-900/80 rounded-full text-white hover:bg-dark-900"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {images.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentImage(i)}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            i === currentImage ? 'bg-pink-400' : 'bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}

                {vendor.is_verified && (
                  <div className="absolute top-4 left-4">
                    <Badge variant="success" className="flex items-center gap-1">
                      <BadgeCheck className="w-3 h-3" />
                      Verified Provider
                    </Badge>
                  </div>
                )}
              </div>
            </Card>

            {/* About */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">About</h2>
              <p className="text-gray-400 whitespace-pre-line">{vendor.description}</p>
            </Card>

            {/* Services */}
            {vendor.services && vendor.services.length > 0 && (
              <Card 
                ref={servicesRef}
                className={`p-6 transition-all duration-500 ${highlightPackages ? 'ring-2 ring-pink-500 ring-offset-2 ring-offset-dark-950' : ''}`}
              >
                <h2 className="text-xl font-semibold text-white mb-2">Services & Packages</h2>
                {highlightPackages && (
                  <p className="text-pink-400 text-sm mb-4 animate-pulse">
                    👆 Please select a package below to continue booking
                  </p>
                )}
                <div className="space-y-4">
                  {vendor.services.map((service) => (
                    <div
                      key={service.id}
                      className={`flex flex-col md:flex-row md:items-center justify-between p-4 bg-dark-800/50 rounded-lg transition-all ${highlightPackages ? 'hover:bg-dark-700/50 cursor-pointer' : ''}`}
                      onClick={highlightPackages ? () => handleBookService(service) : undefined}
                    >
                      <div className="mb-2 md:mb-0">
                        <h3 className="text-white font-medium">{service.name}</h3>
                        <p className="text-gray-400 text-sm">{service.duration}</p>
                        {service.description && (
                          <p className="text-gray-500 text-sm mt-1">{service.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-pink-400 font-semibold text-lg">
                          {formatPrice(service.price)}
                        </span>
                        <Button size="sm" onClick={(e) => { e.stopPropagation(); handleBookService(service); }}>Book</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Reviews */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Reviews</h2>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span className="text-white font-semibold">{vendor.rating.toFixed(1)}</span>
                  <span className="text-gray-400">({vendor.review_count} reviews)</span>
                </div>
              </div>

              {vendor.reviews && vendor.reviews.length > 0 ? (
                <div className="space-y-4">
                  {vendor.reviews.map((review) => (
                    <div key={review.id} className="border-b border-dark-800 last:border-0 pb-4 last:pb-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-pink-500/20 rounded-full flex items-center justify-center">
                          <span className="text-pink-400 font-medium">
                            {review.user_name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-medium">{review.user_name}</p>
                          <div className="flex items-center gap-2">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 ${
                                    i < review.rating
                                      ? 'text-yellow-400 fill-yellow-400'
                                      : 'text-dark-600'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-gray-500 text-sm">
                              {new Date(review.created_at).toLocaleDateString('en-PH', {
                                month: 'long',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-400 ml-13">{review.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">No reviews yet</p>
              )}
            </Card>
          </div>

          {/* Right Column - Contact & Booking */}
          <div className="space-y-6">
            {/* Provider Info Card */}
            <Card className="p-6 sticky top-24">
              <div className="mb-4">
                <Badge variant="default" className="mb-3">
                  {getCategoryLabel(vendor.category)}
                </Badge>
                <h1 className="text-2xl font-bold text-white mb-2">{vendor.business_name}</h1>
                <div className="flex items-center gap-2 text-gray-400 mb-2">
                  <MapPin className="w-4 h-4" />
                  <span>{vendor.location}</span>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span className="text-white font-semibold">{vendor.rating.toFixed(1)}</span>
                  <span className="text-gray-400">({vendor.review_count} reviews)</span>
                </div>
                <p className="text-pink-400 font-semibold text-lg">{vendor.price_range}</p>
              </div>

              <div className="space-y-3 mb-6">
                <Button className="w-full" size="lg" onClick={handleBookGeneral}>
                  <Calendar className="w-4 h-4 mr-2" />
                  {vendor.services && vendor.services.length > 0 ? 'Select Package' : 'Book Now'}
                </Button>
                <Button variant="outline" className="w-full" size="lg" onClick={() => handleSendMessage()}>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={handleToggleSave}
                  disabled={savingStatus}
                >
                  <Heart className={`w-4 h-4 mr-2 ${isSaved ? 'fill-pink-400 text-pink-400' : ''}`} />
                  {savingStatus ? 'Saving...' : isSaved ? 'Saved' : 'Save'}
                </Button>
              </div>

              {/* Contact Info */}
              <div className="border-t border-dark-800 pt-4">
                <h3 className="text-white font-medium mb-3">Contact Information</h3>
                <div className="space-y-2">
                  <a
                    href={`tel:${vendor.phone}`}
                    className="flex items-center gap-3 text-gray-400 hover:text-pink-400"
                  >
                    <Phone className="w-4 h-4" />
                    <span>{vendor.phone}</span>
                  </a>
                  <a
                    href={`mailto:${vendor.email}`}
                    className="flex items-center gap-3 text-gray-400 hover:text-pink-400"
                  >
                    <Mail className="w-4 h-4" />
                    <span>{vendor.email}</span>
                  </a>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {selectedService && (
        <BookingModal
          isOpen={showBookingModal}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedService(null);
          }}
          vendorId={vendorId}
          vendorName={vendor.business_name}
          service={selectedService}
          userId={userId}
          vendorTravelInfo={{
            latitude: vendor.latitude,
            longitude: vendor.longitude,
            base_travel_fee: vendor.base_travel_fee,
            per_km_rate: vendor.per_km_rate,
            free_km_radius: vendor.free_km_radius,
          }}
          onSuccess={() => {
            // Optionally refresh or show notification
          }}
        />
      )}

      {/* Message Modal */}
      <MessageVendorModal
        isOpen={showMessageModal}
        onClose={() => {
          setShowMessageModal(false);
          setSelectedService(null);
        }}
        vendorId={vendorId}
        vendorName={vendor.business_name}
        userId={userId}
        service={selectedService}
        onSuccess={() => {
          // Optionally refresh or show notification
        }}
      />
    </div>
  );
}
