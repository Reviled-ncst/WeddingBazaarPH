'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Calendar, Users, MessageSquare, Star, Settings, DollarSign, BarChart3, Package, Edit, Trash2, ShieldCheck, AlertCircle, Eye, EyeOff, MoreVertical, Clock, CheckCircle, XCircle, CreditCard, Mail, Phone, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { AddServiceModal, ServiceFormData, PricingItem, AddOn, ServiceImage } from '@/components/vendor/AddServiceModal';
import { ServiceDetailsModal } from '@/components/vendor/ServiceDetailsModal';
import { MessagesTab } from '@/components/messaging/MessagesTab';
import { AvailabilityTab } from '@/components/vendor/AvailabilityTab';

interface Service {
  id: number;
  name: string;
  description: string;
  category: string;
  pricing_items: PricingItem[];
  add_ons: AddOn[];
  inclusions: string[];
  images: ServiceImage[];
  base_total: number;
  is_active: boolean;
}

interface VendorBooking {
  id: number;
  user_id: number;
  service_id: number;
  service_name: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  event_date: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'partial' | 'refunded';
  total_price: number;
  notes: string | null;
  created_at: string;
}

function VendorDashboardContent() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'overview');
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [viewingService, setViewingService] = useState<Service | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [vendorId, setVendorId] = useState<number | null>(null);
  const [vendorCategory, setVendorCategory] = useState<string>('');
  const [verificationStatus, setVerificationStatus] = useState<'unverified' | 'pending' | 'verified' | 'rejected'>('unverified');
  const [bookings, setBookings] = useState<VendorBooking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  
  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    bookingId: number | null;
    action: 'confirm' | 'decline' | 'complete';
    booking: VendorBooking | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    bookingId: null,
    action: 'confirm',
    booking: null,
    isLoading: false,
  });

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
    // Redirect non-vendors to their dashboards
    if (!isLoading && user && user.role !== 'vendor') {
      if (user.role === 'coordinator') {
        router.push('/coordinator-dashboard');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, isLoading, router]);

  // Fetch vendor ID and services
  useEffect(() => {
    const fetchVendorData = async () => {
      if (!user) return;
      
      try {
        // Get vendor ID from vendor profile
        const vendorRes = await fetch(`http://localhost/wedding-bazaar-api/vendors/profile.php?user_id=${user.id}`);
        if (vendorRes.ok) {
          const vendorData = await vendorRes.json();
          if (vendorData.vendor) {
            setVendorId(vendorData.vendor.id);
            setVendorCategory(vendorData.vendor.category || '');
            setVerificationStatus(vendorData.vendor.verification_status || 'unverified');
            // Fetch services for this vendor
            const servicesRes = await fetch(`http://localhost/wedding-bazaar-api/services/list.php?vendor_id=${vendorData.vendor.id}`);
            if (servicesRes.ok) {
              const servicesData = await servicesRes.json();
              setServices(servicesData.services || []);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching vendor data:', error);
      }
    };

    if (!isLoading && user) {
      fetchVendorData();
    }
  }, [user, isLoading]);

  // Fetch bookings when vendor ID is available
  useEffect(() => {
    const fetchBookings = async () => {
      if (!vendorId) return;
      setBookingsLoading(true);
      try {
        const response = await fetch(`http://localhost/wedding-bazaar-api/bookings/list.php?vendor_id=${vendorId}`);
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setBookings(result.data || []);
          }
        }
      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setBookingsLoading(false);
      }
    };

    if (vendorId) {
      fetchBookings();
    }
  }, [vendorId]);

  // Open confirm dialog for booking action
  const openBookingConfirmDialog = (booking: VendorBooking, action: 'confirm' | 'decline' | 'complete') => {
    setConfirmDialog({
      isOpen: true,
      bookingId: booking.id,
      action,
      booking,
      isLoading: false,
    });
  };

  // Execute booking status update
  const executeBookingAction = async () => {
    if (!confirmDialog.bookingId || !confirmDialog.action) return;
    
    const statusMap = {
      confirm: 'confirmed',
      decline: 'cancelled',
      complete: 'completed',
    };
    const newStatus = statusMap[confirmDialog.action];
    
    setConfirmDialog(prev => ({ ...prev, isLoading: true }));
    
    try {
      const response = await fetch('http://localhost/wedding-bazaar-api/bookings/update-status.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: confirmDialog.bookingId,
          status: newStatus,
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setBookings(prev => prev.map(b => 
            b.id === confirmDialog.bookingId ? { ...b, status: newStatus as VendorBooking['status'] } : b
          ));
        }
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
    } finally {
      setConfirmDialog({
        isOpen: false,
        bookingId: null,
        action: 'confirm',
        booking: null,
        isLoading: false,
      });
    }
  };

  // Update booking status (deprecated - use dialog instead)
  const updateBookingStatus = async (bookingId: number, newStatus: string) => {
    try {
      const response = await fetch('http://localhost/wedding-bazaar-api/bookings/update-status.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: bookingId,
          status: newStatus,
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setBookings(prev => prev.map(b => 
            b.id === bookingId ? { ...b, status: newStatus as VendorBooking['status'] } : b
          ));
        }
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
    }
  };

  const handleSaveService = async (serviceData: ServiceFormData, serviceId?: number) => {
    if (!vendorId) return;
    
    const isEditing = !!serviceId;
    
    try {
      // Compute base total from pricing items
      const baseTotal = serviceData.pricingItems.reduce(
        (sum: number, item: PricingItem) => sum + (item.quantity * item.rate), 0
      );
      
      // Separate new file uploads from existing URLs
      const existingImages = serviceData.images.filter(img => !img.file);
      const newImageFiles = serviceData.images.filter(img => img.file);
      
      // Prepare API data
      const apiData = {
        ...(isEditing && { id: serviceId }),
        vendor_id: vendorId,
        name: serviceData.name,
        description: serviceData.description,
        category: serviceData.category,
        pricing_items: serviceData.pricingItems,
        add_ons: serviceData.addOns,
        details: serviceData.details,
        inclusions: serviceData.inclusions,
        images: existingImages,
        base_total: baseTotal,
      };
      
      const endpoint = isEditing 
        ? 'http://localhost/wedding-bazaar-api/services/update.php'
        : 'http://localhost/wedding-bazaar-api/services/create.php';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiData),
      });
      
      if (response.ok) {
        const result = await response.json();
        const finalServiceId = isEditing ? serviceId : result.service_id;
        
        // Upload images if any
        let uploadedImages: ServiceImage[] = [];
        if (newImageFiles.length > 0 && finalServiceId) {
          const formData = new FormData();
          formData.append('vendor_id', vendorId.toString());
          formData.append('service_id', finalServiceId.toString());
          newImageFiles.forEach(img => {
            if (img.file) {
              formData.append('images[]', img.file);
            }
          });
          
          const uploadResponse = await fetch('http://localhost/wedding-bazaar-api/services/upload-images.php', {
            method: 'POST',
            body: formData,
          });
          
          if (uploadResponse.ok) {
            const uploadResult = await uploadResponse.json();
            uploadedImages = uploadResult.images || [];
          }
        }
        
        if (isEditing) {
          // Update existing service in the list
          setServices(prev => prev.map(s => s.id === serviceId ? {
            ...s,
            name: serviceData.name,
            description: serviceData.description,
            category: serviceData.category,
            pricing_items: serviceData.pricingItems,
            add_ons: serviceData.addOns,
            inclusions: serviceData.inclusions,
            images: [...existingImages, ...uploadedImages],
            base_total: baseTotal,
          } : s));
        } else {
          // Add the new service to the list
          const newService: Service = {
            id: finalServiceId,
            name: serviceData.name,
            description: serviceData.description,
            category: serviceData.category,
            pricing_items: serviceData.pricingItems,
            add_ons: serviceData.addOns,
            inclusions: serviceData.inclusions,
            images: [...existingImages, ...uploadedImages],
            base_total: baseTotal,
            is_active: true,
          };
          setServices(prev => [...prev, newService]);
        }
        setIsAddServiceModalOpen(false);
        setEditingService(null);
      } else {
        console.error('Failed to ' + (isEditing ? 'update' : 'create') + ' service');
      }
    } catch (error) {
      console.error('Error ' + (isEditing ? 'updating' : 'creating') + ' service:', error);
    }
  };

  // Toggle service active status
  const handleToggleService = async (serviceId: number) => {
    if (!vendorId) return;
    try {
      const response = await fetch('http://localhost/wedding-bazaar-api/services/toggle.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: serviceId, vendor_id: vendorId }),
      });
      if (response.ok) {
        const result = await response.json();
        setServices(prev => prev.map(s => 
          s.id === serviceId ? { ...s, is_active: result.is_active } : s
        ));
      }
    } catch (error) {
      console.error('Error toggling service:', error);
    }
  };

  // Delete service
  const handleDeleteService = async (serviceId: number) => {
    if (!vendorId) return;
    if (!confirm('Are you sure you want to delete this service? This action cannot be undone.')) return;
    
    try {
      const response = await fetch('http://localhost/wedding-bazaar-api/services/delete.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: serviceId, vendor_id: vendorId }),
      });
      if (response.ok) {
        setServices(prev => prev.filter(s => s.id !== serviceId));
      }
    } catch (error) {
      console.error('Error deleting service:', error);
    }
  };

  const formatPrice = (service: Service) => {
    const formatter = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 });
    return formatter.format(service.base_total);
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      photographer: 'Photography',
      videographer: 'Videography',
      venue: 'Venue',
      caterer: 'Catering',
      decorator: 'Decoration',
      florist: 'Florist',
      makeup: 'Makeup & Hair',
      dj: 'DJ / Entertainment',
      cake: 'Cake & Desserts',
      planner: 'Wedding Planner',
    };
    return labels[category] || category;
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-400"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'availability', label: 'Availability', icon: Clock },
    { id: 'services', label: 'Services', icon: Package },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'reviews', label: 'Reviews', icon: Star },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-dark-950">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Welcome, {user.name}!</h1>
            <p className="text-gray-400">Manage your business</p>
          </div>
          <Badge variant="success">Provider</Badge>
        </div>

        {/* Top Navigation Tabs */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  router.push(`/vendor-dashboard?tab=${tab.id}`, { scroll: false });
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                    : 'bg-dark-800 text-gray-400 border border-dark-700 hover:text-white hover:border-dark-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dashboard Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-pink-500/20 rounded-lg">
                    <Calendar className="w-6 h-6 text-pink-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Total Bookings</p>
                    <p className="text-2xl font-bold text-white">0</p>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-500/20 rounded-lg">
                    <DollarSign className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">This Month</p>
                    <p className="text-2xl font-bold text-white">₱0</p>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/20 rounded-lg">
                    <Users className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Profile Views</p>
                    <p className="text-2xl font-bold text-white">0</p>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-yellow-500/20 rounded-lg">
                    <Star className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Rating</p>
                    <p className="text-2xl font-bold text-white">--</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Recent Bookings */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Recent Bookings</h3>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('bookings')}>
                  View All
                </Button>
              </div>
              <div className="text-center py-8 text-gray-400">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No bookings yet</p>
                <p className="text-sm mt-2">New booking requests will appear here</p>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-auto py-4 flex-col" onClick={() => setActiveTab('services')}>
                  <Package className="w-6 h-6 mb-2" />
                  <span>Manage Services</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col" onClick={() => setActiveTab('bookings')}>
                  <Calendar className="w-6 h-6 mb-2" />
                  <span>View Bookings</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col" onClick={() => setActiveTab('messages')}>
                  <MessageSquare className="w-6 h-6 mb-2" />
                  <span>Messages</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col" onClick={() => setActiveTab('settings')}>
                  <Settings className="w-6 h-6 mb-2" />
                  <span>Settings</span>
                </Button>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Bookings</h3>
              <Badge variant="default">{bookings.length} total</Badge>
            </div>

            {bookingsLoading ? (
              <Card className="p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-pink-400 mx-auto" />
                <p className="text-gray-400 mt-4">Loading bookings...</p>
              </Card>
            ) : bookings.length === 0 ? (
              <Card className="p-12 text-center">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400">No bookings yet</p>
                <p className="text-sm mt-2 text-gray-500">Wait for couples to book your services</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Pending Bookings */}
                {bookings.filter(b => b.status === 'pending').length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-amber-400 mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Pending Confirmation ({bookings.filter(b => b.status === 'pending').length})
                    </h4>
                    <div className="space-y-3">
                      {bookings.filter(b => b.status === 'pending').map((booking) => (
                        <Card key={booking.id} className="p-4 border-amber-500/30 bg-amber-500/5">
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h5 className="font-semibold text-white">{booking.service_name}</h5>
                                <Badge variant="warning">Pending</Badge>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                <div className="flex items-center gap-2 text-gray-400">
                                  <User className="w-4 h-4" />
                                  {booking.client_name}
                                </div>
                                <div className="flex items-center gap-2 text-gray-400">
                                  <Calendar className="w-4 h-4" />
                                  {new Date(booking.event_date).toLocaleDateString('en-PH', { 
                                    year: 'numeric', month: 'short', day: 'numeric' 
                                  })}
                                </div>
                                <div className="flex items-center gap-2 text-gray-400">
                                  <Mail className="w-4 h-4" />
                                  {booking.client_email}
                                </div>
                                <div className="flex items-center gap-2 text-gray-400">
                                  <CreditCard className="w-4 h-4" />
                                  ₱{Number(booking.total_price).toLocaleString()}
                                  {booking.payment_status === 'paid' && (
                                    <Badge variant="success" className="ml-1 text-xs">Paid</Badge>
                                  )}
                                  {booking.payment_status === 'partial' && (
                                    <Badge variant="warning" className="ml-1 text-xs">Partial</Badge>
                                  )}
                                </div>
                              </div>
                              {booking.notes && (
                                <p className="text-gray-500 text-sm mt-2 italic">"{booking.notes}"</p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                onClick={() => openBookingConfirmDialog(booking, 'confirm')}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Confirm
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-red-400 border-red-400/50 hover:bg-red-400/10"
                                onClick={() => openBookingConfirmDialog(booking, 'decline')}
                              >
                                Decline
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Confirmed Bookings */}
                {bookings.filter(b => b.status === 'confirmed').length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-emerald-400 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Confirmed ({bookings.filter(b => b.status === 'confirmed').length})
                    </h4>
                    <div className="space-y-3">
                      {bookings.filter(b => b.status === 'confirmed').map((booking) => (
                        <Card key={booking.id} className="p-4 border-emerald-500/30 bg-emerald-500/5">
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h5 className="font-semibold text-white">{booking.service_name}</h5>
                                <Badge variant="success">Confirmed</Badge>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                <div className="flex items-center gap-2 text-gray-400">
                                  <User className="w-4 h-4" />
                                  {booking.client_name}
                                </div>
                                <div className="flex items-center gap-2 text-gray-400">
                                  <Calendar className="w-4 h-4" />
                                  {new Date(booking.event_date).toLocaleDateString('en-PH', { 
                                    year: 'numeric', month: 'short', day: 'numeric' 
                                  })}
                                </div>
                                <div className="flex items-center gap-2 text-gray-400">
                                  <Phone className="w-4 h-4" />
                                  {booking.client_phone || 'No phone'}
                                </div>
                                <div className="flex items-center gap-2 text-gray-400">
                                  <CreditCard className="w-4 h-4" />
                                  ₱{Number(booking.total_price).toLocaleString()}
                                  {booking.payment_status === 'paid' && (
                                    <Badge variant="success" className="ml-1 text-xs">Paid</Badge>
                                  )}
                                  {booking.payment_status === 'partial' && (
                                    <Badge variant="warning" className="ml-1 text-xs">Partial</Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => openBookingConfirmDialog(booking, 'complete')}
                              >
                                Mark Complete
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Past Bookings (Completed/Cancelled) */}
                {bookings.filter(b => b.status === 'completed' || b.status === 'cancelled').length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                      Past Bookings ({bookings.filter(b => b.status === 'completed' || b.status === 'cancelled').length})
                    </h4>
                    <div className="space-y-3">
                      {bookings.filter(b => b.status === 'completed' || b.status === 'cancelled').map((booking) => (
                        <Card key={booking.id} className="p-4 opacity-60">
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h5 className="font-semibold text-white">{booking.service_name}</h5>
                                <Badge variant={booking.status === 'completed' ? 'default' : 'danger'}>
                                  {booking.status === 'completed' ? 'Completed' : 'Cancelled'}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                <div className="flex items-center gap-2 text-gray-500">
                                  <User className="w-4 h-4" />
                                  {booking.client_name}
                                </div>
                                <div className="flex items-center gap-2 text-gray-500">
                                  <Calendar className="w-4 h-4" />
                                  {new Date(booking.event_date).toLocaleDateString('en-PH', { 
                                    year: 'numeric', month: 'short', day: 'numeric' 
                                  })}
                                </div>
                                <div className="flex items-center gap-2 text-gray-500">
                                  <CreditCard className="w-4 h-4" />
                                  ₱{Number(booking.total_price).toLocaleString()}
                                </div>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'services' && (
          <div className="space-y-6">
            {/* Verification Status Banner */}
            {verificationStatus !== 'verified' && (
              <Card className={`p-4 ${
                verificationStatus === 'pending' ? 'bg-yellow-500/10 border-yellow-500/30' :
                verificationStatus === 'rejected' ? 'bg-red-500/10 border-red-500/30' :
                'bg-orange-500/10 border-orange-500/30'
              }`}>
                <div className="flex items-start gap-3">
                  <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                    verificationStatus === 'pending' ? 'text-yellow-400' :
                    verificationStatus === 'rejected' ? 'text-red-400' :
                    'text-orange-400'
                  }`} />
                  <div className="flex-1">
                    <h4 className={`font-semibold ${
                      verificationStatus === 'pending' ? 'text-yellow-400' :
                      verificationStatus === 'rejected' ? 'text-red-400' :
                      'text-orange-400'
                    }`}>
                      {verificationStatus === 'pending' 
                        ? 'Verification Pending'
                        : verificationStatus === 'rejected'
                        ? 'Verification Rejected'
                        : 'Verification Required'}
                    </h4>
                    <p className="text-gray-300 text-sm mt-1">
                      {verificationStatus === 'pending'
                        ? 'Your verification documents are being reviewed. You will be able to add services once verified.'
                        : verificationStatus === 'rejected'
                        ? 'Your verification was rejected. Please check the profile page for details and resubmit.'
                        : 'You must complete your profile and submit verification documents before adding services.'}
                    </p>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="mt-3"
                      onClick={() => router.push('/vendor-dashboard/profile')}
                    >
                      <ShieldCheck className="w-4 h-4 mr-2" />
                      Go to Verification
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">My Services</h3>
                <Button 
                  onClick={() => setIsAddServiceModalOpen(true)}
                  disabled={verificationStatus !== 'verified'}
                  title={verificationStatus !== 'verified' ? 'Complete verification to add services' : ''}
                >
                  Add Service
                </Button>
              </div>
              
              {services.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No services added yet</p>
                  <p className="text-sm mt-2">Add your services to attract more clients</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {services.map((service) => (
                    <div 
                      key={service.id} 
                      className={`border rounded-lg overflow-hidden hover:border-dark-500 transition-colors ${
                        service.is_active ? 'border-dark-700' : 'border-dark-800 opacity-60'
                      }`}
                    >
                      <div className="flex">
                        {/* Service Image */}
                        <div className="w-32 h-32 sm:w-40 sm:h-40 flex-shrink-0 bg-dark-800">
                          {service.images && service.images.length > 0 ? (
                            <img 
                              src={service.images[0].url.startsWith('http') ? service.images[0].url : `http://localhost${service.images[0].url}`}
                              alt={service.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-10 h-10 text-gray-600" />
                            </div>
                          )}
                        </div>
                        
                        {/* Service Details */}
                        <div className="flex-1 p-4 flex flex-col relative group">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0 pr-3">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-white font-semibold truncate">{service.name}</h4>
                                <Badge variant={service.is_active ? 'success' : 'default'} size="sm">
                                  {service.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 text-sm">
                                <span className="text-gray-500">{getCategoryLabel(service.category)}</span>
                                <span className="text-pink-400 font-semibold">{formatPrice(service)}</span>
                                {service.images && service.images.length > 0 && (
                                  <span className="text-gray-600 text-xs">{service.images.length} photo{service.images.length !== 1 ? 's' : ''}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <p className="text-gray-400 text-sm line-clamp-2 flex-1">{service.description}</p>
                          
                          {service.inclusions && service.inclusions.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {service.inclusions.slice(0, 3).map((inclusion, idx) => (
                                <span key={idx} className="text-xs bg-dark-800 text-gray-300 px-2 py-0.5 rounded">
                                  {inclusion}
                                </span>
                              ))}
                              {service.inclusions.length > 3 && (
                                <span className="text-xs text-gray-500">+{service.inclusions.length - 3} more</span>
                              )}
                            </div>
                          )}
                          
                          {/* Action Bar */}
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-dark-700/50">
                            <button
                              onClick={() => setViewingService(service)}
                              className="text-sm text-pink-400 hover:text-pink-300 font-medium transition-colors"
                            >
                              View Details
                            </button>
                            
                            <div className="flex items-center gap-1 bg-dark-800/50 rounded-lg p-1">
                              <button 
                                onClick={() => handleToggleService(service.id)}
                                title={service.is_active ? 'Deactivate service' : 'Activate service'}
                                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                                  service.is_active 
                                    ? 'text-amber-400 hover:bg-amber-500/20' 
                                    : 'text-emerald-400 hover:bg-emerald-500/20'
                                }`}
                              >
                                {service.is_active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                <span className="hidden sm:inline">{service.is_active ? 'Hide' : 'Show'}</span>
                              </button>
                              <div className="w-px h-4 bg-dark-600" />
                              <button 
                                title="Edit service"
                                onClick={() => {
                                  setEditingService(service);
                                  setIsAddServiceModalOpen(true);
                                }}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-blue-400 hover:bg-blue-500/20 transition-all"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Edit</span>
                              </button>
                              <div className="w-px h-4 bg-dark-600" />
                              <button 
                                onClick={() => handleDeleteService(service.id)}
                                title="Delete service"
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-red-400 hover:bg-red-500/20 transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Delete</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {activeTab === 'messages' && user && (
          <MessagesTab userId={user.id} />
        )}

        {activeTab === 'availability' && vendorId && (
          <AvailabilityTab vendorId={vendorId} />
        )}

        {activeTab === 'reviews' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Reviews</h3>
            <div className="text-center py-12 text-gray-400">
              <Star className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No reviews yet</p>
              <p className="text-sm mt-2">Reviews from clients will appear here</p>
            </div>
          </Card>
        )}

        {activeTab === 'settings' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Business Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Business Name</label>
                <p className="text-white">{user.name}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Email</label>
                <p className="text-white">{user.email}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Phone</label>
                <p className="text-white">{user.phone || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Account Type</label>
                <p className="text-white capitalize">Provider</p>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Verification Status</label>
                <div className="flex items-center gap-2">
                  {verificationStatus === 'verified' ? (
                    <Badge variant="success">Verified</Badge>
                  ) : verificationStatus === 'pending' ? (
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pending</Badge>
                  ) : verificationStatus === 'rejected' ? (
                    <Badge variant="danger">Rejected</Badge>
                  ) : (
                    <Badge variant="default">Not Verified</Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <Button onClick={() => router.push('/vendor-dashboard/profile')}>
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Edit Profile & Verification
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Add Service Modal */}
      <AddServiceModal
        isOpen={isAddServiceModalOpen}
        onClose={() => {
          setIsAddServiceModalOpen(false);
          setEditingService(null);
        }}
        onSave={handleSaveService}
        vendorCategory={vendorCategory}
        editService={editingService ? {
          id: editingService.id,
          name: editingService.name,
          description: editingService.description,
          category: editingService.category,
          pricing_items: editingService.pricing_items,
          add_ons: editingService.add_ons || [],
          details: {},
          inclusions: editingService.inclusions || [],
          images: editingService.images || [],
        } : undefined}
      />

      {/* Service Details Modal */}
      <ServiceDetailsModal
        isOpen={!!viewingService}
        onClose={() => setViewingService(null)}
        service={viewingService}
      />

      {/* Booking Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={executeBookingAction}
        title={
          confirmDialog.action === 'confirm' ? 'Confirm Booking' :
          confirmDialog.action === 'decline' ? 'Decline Booking' :
          'Complete Booking'
        }
        message={
          confirmDialog.action === 'confirm' 
            ? `Are you sure you want to confirm this booking for "${confirmDialog.booking?.service_name}" with ${confirmDialog.booking?.client_name}? They will be notified of your confirmation.`
            : confirmDialog.action === 'decline'
            ? `Are you sure you want to decline this booking for "${confirmDialog.booking?.service_name}" with ${confirmDialog.booking?.client_name}? This action cannot be undone.`
            : `Are you sure you want to mark this booking as complete? Make sure the service has been delivered.`
        }
        confirmText={
          confirmDialog.action === 'confirm' ? 'Yes, Confirm' :
          confirmDialog.action === 'decline' ? 'Yes, Decline' :
          'Mark Complete'
        }
        variant={
          confirmDialog.action === 'confirm' ? 'success' :
          confirmDialog.action === 'decline' ? 'danger' :
          'info'
        }
        isLoading={confirmDialog.isLoading}
      />
    </div>
  );
}

export default function VendorDashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-400"></div>
      </div>
    }>
      <VendorDashboardContent />
    </Suspense>
  );
}
