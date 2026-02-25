'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  MapPin, Star, Heart, BadgeCheck, Phone, Mail, 
  Calendar, ChevronLeft, ChevronRight, MessageCircle, ArrowLeft,
  Check, Users, Award, Package, Crown, Sparkles, Building, Camera, 
  UtensilsCrossed, Flower2, Palette, Music, Video, ChevronDown, ChevronUp
} from 'lucide-react';
import { Button, Badge, Card } from '@/components/ui';
import { coordinatorsApi, savedApi } from '@/lib/api';
import { formatPriceRange } from '@/lib/utils';
import { MessageVendorModal } from '@/components/messaging/MessageVendorModal';

interface AffiliatedVendor {
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
  affiliation_status: string;
  commission_rate: number;
  affiliation_notes: string;
}

interface PackageItem {
  id: number;
  vendor_id: number;
  service_id: number | null;
  custom_price: number | null;
  notes: string;
  business_name: string;
  category: string;
  vendor_images: string[];
  service_name: string | null;
  service_price: number | null;
}

interface CoordinatorPackage {
  id: number;
  name: string;
  description: string;
  package_type: 'budget' | 'standard' | 'premium' | 'luxury' | 'custom';
  base_price: number;
  discount_percentage: number;
  discounted_price: number;
  is_featured: boolean;
  items: PackageItem[];
}

interface Review {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  user_name: string;
}

interface CoordinatorDetail {
  id: number;
  user_id: number;
  business_name: string;
  description: string;
  location: string;
  price_range: string;
  rating: number;
  review_count: number;
  images: string[];
  specialties: string[];
  weddings_completed: number;
  is_verified: boolean;
  owner_name: string;
  phone: string;
  email: string;
  affiliated_vendors: AffiliatedVendor[];
  packages: CoordinatorPackage[];
  reviews: Review[];
  latitude?: number;
  longitude?: number;
  base_travel_fee?: number;
  per_km_rate?: number;
  free_km_radius?: number;
}

const categoryIcons: Record<string, React.ElementType> = {
  photographer: Camera,
  photography: Camera,
  videographer: Video,
  videography: Video,
  venue: Building,
  caterer: UtensilsCrossed,
  catering: UtensilsCrossed,
  decorator: Sparkles,
  decoration: Sparkles,
  florist: Flower2,
  makeup: Palette,
  dj: Music,
  music: Music,
  cake: UtensilsCrossed,
  planner: Users,
};

const packageTypeColors: Record<string, string> = {
  budget: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  standard: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  premium: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  luxury: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  custom: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
};

const coordinatorImages = [
  'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&h=600&fit=crop',
];

const getCategoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    photographer: 'Photography',
    photography: 'Photography',
    videographer: 'Videography',
    videography: 'Videography',
    venue: 'Venue',
    caterer: 'Catering',
    catering: 'Catering',
    decorator: 'Decoration',
    decoration: 'Decoration',
    florist: 'Florist',
    makeup: 'Makeup & Hair',
    dj: 'Music & DJ',
    music: 'Music & DJ',
    cake: 'Cake',
    planner: 'Planner',
  };
  return labels[category] || category;
};

export default function CoordinatorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const coordinatorId = Number(params.id);
  
  const [coordinator, setCoordinator] = useState<CoordinatorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [expandedPackage, setExpandedPackage] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'packages' | 'vendors'>('packages');
  
  // User authentication state
  const [userId, setUserId] = useState<number | null>(null);
  
  // Modal states
  const [showMessageModal, setShowMessageModal] = useState(false);
  
  // Refs
  const packagesRef = useRef<HTMLDivElement>(null);

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
    if (coordinatorId) {
      fetchCoordinator();
    }
  }, [coordinatorId]);

  const fetchCoordinator = async () => {
    setLoading(true);
    try {
      const response = await coordinatorsApi.detail(coordinatorId);
      if (response.success && response.data) {
        setCoordinator(response.data as CoordinatorDetail);
        // Expand featured package by default
        const featuredPkg = (response.data as CoordinatorDetail).packages?.find(p => p.is_featured);
        if (featuredPkg) {
          setExpandedPackage(featuredPkg.id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch coordinator:', error);
    } finally {
      setLoading(false);
    }
  };

  const getImages = () => {
    if (coordinator?.images && coordinator.images.length > 0) {
      return coordinator.images;
    }
    return coordinatorImages;
  };

  const images = coordinator ? getImages() : [];

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

  const handleSendMessage = () => {
    if (!userId) {
      router.push('/login?redirect=' + encodeURIComponent(`/coordinators/${coordinatorId}`));
      return;
    }
    setShowMessageModal(true);
  };

  const handleInquirePackage = (pkg: CoordinatorPackage) => {
    if (!userId) {
      router.push('/login?redirect=' + encodeURIComponent(`/coordinators/${coordinatorId}`));
      return;
    }
    // Open message modal - the message will pre-fill with package inquiry
    setShowMessageModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-400"></div>
      </div>
    );
  }

  if (!coordinator) {
    return (
      <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-white mb-4">Coordinator not found</h2>
        <Link href="/coordinators">
          <Button>Back to Coordinators</Button>
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
            <Link href="/coordinators" className="text-gray-400 hover:text-pink-400 flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" />
              Back to Coordinators
            </Link>
            <span className="text-dark-600">/</span>
            <span className="text-pink-400">{coordinator.business_name}</span>
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
                  alt={coordinator.business_name}
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

                {coordinator.is_verified && (
                  <div className="absolute top-4 left-4">
                    <Badge variant="success" className="flex items-center gap-1">
                      <BadgeCheck className="w-3 h-3" />
                      Verified Coordinator
                    </Badge>
                  </div>
                )}
              </div>
            </Card>

            {/* About */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">About</h2>
              <p className="text-gray-400 whitespace-pre-line mb-4">{coordinator.description}</p>
              
              {/* Specialties */}
              {coordinator.specialties && coordinator.specialties.length > 0 && (
                <div>
                  <h3 className="text-white font-medium mb-2">Specialties</h3>
                  <div className="flex flex-wrap gap-2">
                    {coordinator.specialties.map((specialty, idx) => (
                      <Badge key={idx} variant="default">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Tabs for Packages/Vendors */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setActiveTab('packages')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'packages' 
                    ? 'bg-pink-500 text-white' 
                    : 'bg-dark-800 text-gray-400 hover:bg-dark-700'
                }`}
              >
                <Package className="w-4 h-4" />
                Wedding Packages ({coordinator.packages?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('vendors')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'vendors' 
                    ? 'bg-pink-500 text-white' 
                    : 'bg-dark-800 text-gray-400 hover:bg-dark-700'
                }`}
              >
                <Users className="w-4 h-4" />
                Vendor Network ({coordinator.affiliated_vendors?.length || 0})
              </button>
            </div>

            {/* Packages Section */}
            {activeTab === 'packages' && (
              <Card ref={packagesRef} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-white">Wedding Packages</h2>
                  <span className="text-sm text-gray-400">Pre-built vendor combinations with exclusive discounts</span>
                </div>
                
                {coordinator.packages && coordinator.packages.length > 0 ? (
                  <div className="space-y-4">
                    {coordinator.packages.map((pkg) => (
                      <div
                        key={pkg.id}
                        className={`bg-dark-800/50 rounded-lg overflow-hidden border ${
                          pkg.is_featured ? 'border-pink-500/50' : 'border-transparent'
                        }`}
                      >
                        {/* Package Header */}
                        <div 
                          className="flex flex-col md:flex-row md:items-center justify-between p-4 cursor-pointer hover:bg-dark-700/30 transition-colors"
                          onClick={() => setExpandedPackage(expandedPackage === pkg.id ? null : pkg.id)}
                        >
                          <div className="flex-1 mb-2 md:mb-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-white font-medium">{pkg.name}</h3>
                              {pkg.is_featured && (
                                <Badge variant="default" className="bg-pink-500/20 text-pink-400 border-pink-500/30 flex items-center gap-1">
                                  <Crown className="w-3 h-3" />
                                  Featured
                                </Badge>
                              )}
                              <Badge variant="default" className={packageTypeColors[pkg.package_type]}>
                                {pkg.package_type.charAt(0).toUpperCase() + pkg.package_type.slice(1)}
                              </Badge>
                              {expandedPackage === pkg.id ? (
                                <ChevronUp className="w-4 h-4 text-gray-400" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                            <p className="text-gray-400 text-sm mt-1 line-clamp-1">{pkg.description}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              {pkg.discount_percentage > 0 && (
                                <span className="text-gray-500 line-through text-sm mr-2">
                                  {formatPrice(pkg.base_price)}
                                </span>
                              )}
                              <span className="text-pink-400 font-semibold text-lg">
                                {formatPrice(pkg.discounted_price)}
                              </span>
                              {pkg.discount_percentage > 0 && (
                                <span className="text-emerald-400 text-xs ml-2">
                                  Save {pkg.discount_percentage}%
                                </span>
                              )}
                            </div>
                            <Button size="sm" onClick={(e) => { e.stopPropagation(); handleInquirePackage(pkg); }}>
                              Inquire
                            </Button>
                          </div>
                        </div>

                        {/* Expanded Package Details */}
                        {expandedPackage === pkg.id && (
                          <div className="px-4 pb-4 border-t border-dark-700 pt-4">
                            <p className="text-gray-400 text-sm mb-4">{pkg.description}</p>
                            
                            {/* Vendors Included */}
                            <h4 className="text-white text-sm font-medium mb-3 flex items-center gap-2">
                              <Users className="w-4 h-4 text-pink-400" />
                              Vendors Included
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {pkg.items.map((item) => {
                                const Icon = categoryIcons[item.category] || Sparkles;
                                return (
                                  <Link 
                                    key={item.id} 
                                    href={`/vendors/${item.vendor_id}`}
                                    className="flex items-center gap-3 p-3 bg-dark-900/50 rounded-lg hover:bg-dark-700/50 transition-colors group"
                                  >
                                    <div className="w-12 h-12 rounded-lg bg-dark-700 flex items-center justify-center overflow-hidden">
                                      {item.vendor_images?.[0] ? (
                                        <img 
                                          src={item.vendor_images[0]} 
                                          alt={item.business_name}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <Icon className="w-5 h-5 text-gray-400" />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-white text-sm font-medium group-hover:text-pink-400 transition-colors truncate">
                                        {item.business_name}
                                      </p>
                                      <p className="text-gray-500 text-xs">
                                        {getCategoryLabel(item.category)}
                                        {item.service_name && ` - ${item.service_name}`}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      {(item.custom_price || item.service_price) && (
                                        <span className="text-emerald-400 text-xs">
                                          {formatPrice(item.custom_price || item.service_price || 0)}
                                        </span>
                                      )}
                                    </div>
                                  </Link>
                                );
                              })}
                            </div>

                            <div className="mt-4 pt-4 border-t border-dark-700 flex items-center justify-between">
                              <div className="text-sm text-gray-400">
                                {pkg.items.length} vendors • Coordination included
                              </div>
                              <Button onClick={() => handleInquirePackage(pkg)}>
                                <MessageCircle className="w-4 h-4 mr-2" />
                                Request Quote
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-8">No packages available yet. Contact the coordinator for custom quotes.</p>
                )}
              </Card>
            )}

            {/* Affiliated Vendors Section */}
            {activeTab === 'vendors' && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-white">Vendor Network</h2>
                  <span className="text-sm text-gray-400">Trusted partners this coordinator works with</span>
                </div>
                
                {coordinator.affiliated_vendors && coordinator.affiliated_vendors.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {coordinator.affiliated_vendors.map((vendor) => {
                      const Icon = categoryIcons[vendor.category] || Sparkles;
                      return (
                        <Link 
                          key={vendor.id} 
                          href={`/vendors/${vendor.id}`}
                          className="flex gap-4 p-4 bg-dark-800/50 rounded-lg hover:bg-dark-700/50 transition-colors group"
                        >
                          <div className="w-20 h-20 rounded-lg bg-dark-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {vendor.images?.[0] ? (
                              <img 
                                src={vendor.images[0]} 
                                alt={vendor.business_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Icon className="w-8 h-8 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="text-white font-medium group-hover:text-pink-400 transition-colors truncate">
                                {vendor.business_name}
                              </h3>
                              {vendor.is_verified && (
                                <BadgeCheck className="w-4 h-4 text-emerald-400" />
                              )}
                            </div>
                            <p className="text-gray-500 text-sm">{getCategoryLabel(vendor.category)}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                <span className="text-white text-xs">{vendor.rating.toFixed(1)}</span>
                              </div>
                              <span className="text-gray-500 text-xs">({vendor.review_count} reviews)</span>
                            </div>
                            <p className="text-pink-400 text-sm mt-1">{formatPriceRange(vendor.price_range)}</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-8">No affiliated vendors yet</p>
                )}
              </Card>
            )}

            {/* Reviews */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Reviews</h2>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span className="text-white font-semibold">{coordinator.rating.toFixed(1)}</span>
                  <span className="text-gray-400">({coordinator.review_count} reviews)</span>
                </div>
              </div>

              {coordinator.reviews && coordinator.reviews.length > 0 ? (
                <div className="space-y-4">
                  {coordinator.reviews.map((review) => (
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

          {/* Right Column - Contact & Info */}
          <div className="space-y-6">
            {/* Coordinator Info Card */}
            <Card className="p-6 sticky top-24">
              <div className="mb-4">
                <Badge variant="default" className="mb-3 flex items-center gap-1 w-fit">
                  <Users className="w-3 h-3" />
                  Wedding Coordinator
                </Badge>
                <h1 className="text-2xl font-bold text-white mb-2">{coordinator.business_name}</h1>
                <div className="flex items-center gap-2 text-gray-400 mb-2">
                  <MapPin className="w-4 h-4" />
                  <span>{coordinator.location}</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span className="text-white font-semibold">{coordinator.rating.toFixed(1)}</span>
                  <span className="text-gray-400">({coordinator.review_count} reviews)</span>
                </div>
                {coordinator.weddings_completed > 0 && (
                  <div className="flex items-center gap-2 text-gray-400 mb-2">
                    <Award className="w-4 h-4 text-yellow-400" />
                    <span>{coordinator.weddings_completed} weddings completed</span>
                  </div>
                )}
                <p className="text-pink-400 font-semibold text-lg">{formatPriceRange(coordinator.price_range)}</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6 py-4 border-y border-dark-800">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{coordinator.affiliated_vendors?.length || 0}</p>
                  <p className="text-gray-500 text-sm">Partner Vendors</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{coordinator.packages?.length || 0}</p>
                  <p className="text-gray-500 text-sm">Packages</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <Button className="w-full" size="lg" onClick={() => {
                  setActiveTab('packages');
                  packagesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}>
                  <Package className="w-4 h-4 mr-2" />
                  View Packages
                </Button>
                <Button variant="outline" className="w-full" size="lg" onClick={handleSendMessage}>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </div>

              {/* Contact Info */}
              <div className="border-t border-dark-800 pt-4">
                <h3 className="text-white font-medium mb-3">Contact Information</h3>
                <div className="space-y-2">
                  <a
                    href={`tel:${coordinator.phone}`}
                    className="flex items-center gap-3 text-gray-400 hover:text-pink-400"
                  >
                    <Phone className="w-4 h-4" />
                    <span>{coordinator.phone}</span>
                  </a>
                  <a
                    href={`mailto:${coordinator.email}`}
                    className="flex items-center gap-3 text-gray-400 hover:text-pink-400"
                  >
                    <Mail className="w-4 h-4" />
                    <span>{coordinator.email}</span>
                  </a>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Message Modal */}
      <MessageVendorModal
        isOpen={showMessageModal}
        onClose={() => setShowMessageModal(false)}
        vendorId={coordinator.user_id}
        vendorName={coordinator.business_name}
        userId={userId}
        onSuccess={() => {
          // Optionally refresh or show notification
        }}
      />
    </div>
  );
}
