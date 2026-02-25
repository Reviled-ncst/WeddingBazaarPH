'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Calendar, 
  MapPin, 
  Star,
  Clock,
  Users,
  Filter,
  Plus,
  BadgeCheck,
  Percent,
  ArrowLeft,
  Tag,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/wedding-bazaar-api';

interface VendorAvailability {
  id: number;
  vendor_id: number;
  title: string;
  description: string | null;
  available_from: string;
  available_to: string;
  locations: string[];
  services_offered: string[];
  special_rate: number | null;
  regular_rate: number | null;
  discount_percent: number | null;
  max_bookings: number;
  current_bookings: number;
  status: string;
  views_count: number;
  inquiries_count: number;
  created_at: string;
  business_name: string;
  category: string;
  vendor_location: string;
  rating: number;
  review_count: number;
  price_range: string;
  images: string[];
  is_verified: boolean;
}

const categoryOptions = [
  { value: '', label: 'All Categories' },
  { value: 'photographer', label: 'Photography' },
  { value: 'videographer', label: 'Videography' },
  { value: 'caterer', label: 'Catering' },
  { value: 'decorator', label: 'Decoration' },
  { value: 'florist', label: 'Florist' },
  { value: 'makeup', label: 'Makeup & Hair' },
  { value: 'music', label: 'Music & DJ' },
  { value: 'venue', label: 'Venue' },
];

export default function AvailabilityBoardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [availability, setAvailability] = useState<VendorAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Filters
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Create form
  const [form, setForm] = useState({
    title: '',
    description: '',
    available_from: '',
    available_to: '',
    locations: '',
    services_offered: '',
    special_rate: '',
    regular_rate: '',
    discount_percent: '',
    max_bookings: '1'
  });

  useEffect(() => {
    fetchAvailability();
  }, [category, location, dateFrom, dateTo]);

  const fetchAvailability = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (location) params.set('location', location);
      if (dateFrom) params.set('date_from', dateFrom);
      if (dateTo) params.set('date_to', dateTo);
      
      const response = await fetch(`${API_URL}/community/availability/list.php?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        setAvailability(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!user) return;
    
    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/community/availability/create.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor_id: user.id,
          title: form.title,
          description: form.description,
          available_from: form.available_from,
          available_to: form.available_to,
          locations: form.locations.split('\n').filter(l => l.trim()),
          services_offered: form.services_offered.split('\n').filter(s => s.trim()),
          special_rate: form.special_rate ? parseFloat(form.special_rate) : null,
          regular_rate: form.regular_rate ? parseFloat(form.regular_rate) : null,
          discount_percent: form.discount_percent ? parseInt(form.discount_percent) : null,
          max_bookings: parseInt(form.max_bookings) || 1
        })
      });
      
      const result = await response.json();
      if (result.success) {
        setShowCreateModal(false);
        setForm({
          title: '', description: '', available_from: '', available_to: '',
          locations: '', services_offered: '', special_rate: '', regular_rate: '',
          discount_percent: '', max_bookings: '1'
        });
        fetchAvailability();
      } else {
        alert(result.error || 'Failed to post availability');
      }
    } catch (error) {
      console.error('Failed to create availability:', error);
      alert('Failed to post availability');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDateRange = (from: string, to: string) => {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    
    if (fromDate.getMonth() === toDate.getMonth()) {
      return `${fromDate.toLocaleDateString('en-PH', options)} - ${toDate.getDate()}`;
    }
    return `${fromDate.toLocaleDateString('en-PH', options)} - ${toDate.toLocaleDateString('en-PH', options)}`;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Header */}
      <div className="bg-dark-900/50 border-b border-dark-800">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <Link href="/community" className="hover:text-pink-400 flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" />
              Community
            </Link>
            <span>/</span>
            <span className="text-white">Availability Board</span>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Calendar className="w-6 h-6 text-blue-400" />
                Availability Board
              </h1>
              <p className="text-gray-400 mt-1">
                Discover vendors with open dates for your event
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowFilters(!showFilters)}
                className="md:hidden"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
              {user?.role === 'vendor' && (
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Post Availability
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Filters Sidebar */}
          <div className={`md:w-64 flex-shrink-0 ${showFilters ? 'block' : 'hidden md:block'}`}>
            <Card className="p-4 sticky top-24">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filters
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm focus:border-pink-500 focus:outline-none"
                  >
                    {categoryOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Any location"
                      className="w-full bg-dark-800 border border-dark-700 rounded-lg pl-10 pr-3 py-2 text-white text-sm focus:border-pink-500 focus:outline-none"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Event Date Range</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm focus:border-pink-500 focus:outline-none mb-2"
                  />
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm focus:border-pink-500 focus:outline-none"
                  />
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setCategory('');
                    setLocation('');
                    setDateFrom('');
                    setDateTo('');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </Card>
          </div>

          {/* Availability List */}
          <div className="flex-1">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-400 mx-auto"></div>
              </div>
            ) : availability.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availability.map((item) => (
                  <Card key={item.id} className="overflow-hidden hover:border-pink-500/30 transition-colors">
                    {/* Vendor Image */}
                    <div className="relative h-40 bg-dark-800">
                      {item.images && item.images[0] ? (
                        <img 
                          src={item.images[0]} 
                          alt={item.business_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Calendar className="w-12 h-12 text-gray-600" />
                        </div>
                      )}
                      {item.discount_percent && (
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-emerald-500 text-white">
                            <Percent className="w-3 h-3 mr-1" />
                            {item.discount_percent}% OFF
                          </Badge>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4">
                      {/* Vendor Info */}
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <Link href={`/vendors/${item.vendor_id}`}>
                            <h3 className="text-white font-semibold hover:text-pink-400 transition-colors flex items-center gap-1">
                              {item.business_name}
                              {item.is_verified && <BadgeCheck className="w-4 h-4 text-emerald-400" />}
                            </h3>
                          </Link>
                          <p className="text-sm text-pink-400 capitalize">{item.category}</p>
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                          <span className="text-white">{item.rating.toFixed(1)}</span>
                        </div>
                      </div>

                      {/* Title */}
                      <h4 className="text-gray-300 text-sm mb-2">{item.title}</h4>

                      {/* Dates */}
                      <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                        <Calendar className="w-4 h-4 text-blue-400" />
                        <span>{formatDateRange(item.available_from, item.available_to)}</span>
                      </div>

                      {/* Location */}
                      <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                        <MapPin className="w-4 h-4" />
                        <span>{item.vendor_location}</span>
                      </div>

                      {/* Price */}
                      <div className="flex items-center justify-between">
                        <div>
                          {item.special_rate ? (
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-emerald-400">{formatPrice(item.special_rate)}</span>
                              {item.regular_rate && (
                                <span className="text-sm text-gray-500 line-through">{formatPrice(item.regular_rate)}</span>
                              )}
                            </div>
                          ) : item.regular_rate ? (
                            <span className="text-lg font-bold text-pink-400">{formatPrice(item.regular_rate)}</span>
                          ) : (
                            <span className="text-sm text-gray-400">Contact for pricing</span>
                          )}
                        </div>
                        <Button size="sm">
                          Inquire
                        </Button>
                      </div>

                      {/* Spots left */}
                      {item.max_bookings > 1 && (
                        <div className="mt-3 pt-3 border-t border-dark-700">
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <Users className="w-3 h-3" />
                            <span>{item.max_bookings - item.current_bookings} spots left</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No Availability Posted</h3>
                <p className="text-gray-400 mb-4">
                  {category || location || dateFrom 
                    ? 'Try adjusting your filters to see more vendors'
                    : 'No vendors have posted availability yet'}
                </p>
                {user?.role === 'vendor' && (
                  <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Post Your Availability
                  </Button>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Create Availability Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Post Availability</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g., December Wedding Slots Available"
                  className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-2 text-white focus:border-pink-500 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Add details about your availability, special packages, etc."
                  rows={3}
                  className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-2 text-white focus:border-pink-500 focus:outline-none resize-none"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Available From *</label>
                  <input
                    type="date"
                    value={form.available_from}
                    onChange={(e) => setForm({ ...form, available_from: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-2 text-white focus:border-pink-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Available To *</label>
                  <input
                    type="date"
                    value={form.available_to}
                    onChange={(e) => setForm({ ...form, available_to: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-2 text-white focus:border-pink-500 focus:outline-none"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Service Locations (one per line)</label>
                <textarea
                  value={form.locations}
                  onChange={(e) => setForm({ ...form, locations: e.target.value })}
                  placeholder="Metro Manila&#10;Tagaytay&#10;Boracay"
                  rows={2}
                  className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-2 text-white focus:border-pink-500 focus:outline-none resize-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Services Offered (one per line)</label>
                <textarea
                  value={form.services_offered}
                  onChange={(e) => setForm({ ...form, services_offered: e.target.value })}
                  placeholder="Full Day Coverage&#10;Half Day Coverage&#10;Same Day Edit"
                  rows={2}
                  className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-2 text-white focus:border-pink-500 focus:outline-none resize-none"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Regular Rate (₱)</label>
                  <input
                    type="number"
                    value={form.regular_rate}
                    onChange={(e) => setForm({ ...form, regular_rate: e.target.value })}
                    placeholder="0"
                    className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-2 text-white focus:border-pink-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Special Rate (₱)</label>
                  <input
                    type="number"
                    value={form.special_rate}
                    onChange={(e) => setForm({ ...form, special_rate: e.target.value })}
                    placeholder="0"
                    className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-2 text-white focus:border-pink-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Discount %</label>
                  <input
                    type="number"
                    value={form.discount_percent}
                    onChange={(e) => setForm({ ...form, discount_percent: e.target.value })}
                    placeholder="0"
                    min="0"
                    max="100"
                    className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-2 text-white focus:border-pink-500 focus:outline-none"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Max Bookings</label>
                <input
                  type="number"
                  value={form.max_bookings}
                  onChange={(e) => setForm({ ...form, max_bookings: e.target.value })}
                  min="1"
                  className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-2 text-white focus:border-pink-500 focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">How many bookings can you accept in this period?</p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-dark-700">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreate}
                disabled={submitting || !form.title || !form.available_from || !form.available_to}
              >
                {submitting ? 'Posting...' : 'Post Availability'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
