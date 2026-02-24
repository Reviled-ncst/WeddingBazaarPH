'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Calendar, Heart, MessageSquare, Bookmark, Settings, Search, Star, MapPin, Trash2, Clock, CheckCircle, XCircle, CreditCard, RotateCcw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { savedApi } from '@/lib/api';
import { formatPriceRange } from '@/lib/utils';
import { MessagesTab } from '@/components/messaging/MessagesTab';
import { PaymentModal } from '@/components/booking/PaymentModal';
import { MessageVendorModal } from '@/components/messaging/MessageVendorModal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/wedding-bazaar-api';

interface SavedVendor {
  id: number;
  business_name: string;
  category: string;
  location: string;
  rating: number;
  review_count: number;
  price_range: string;
}

interface Booking {
  id: number;
  service_id: number;
  service_name: string;
  vendor_id: number;
  vendor_name: string;
  business_name: string;
  event_date: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'refund_requested';
  payment_status: 'pending' | 'paid' | 'partial' | 'refunded' | 'unpaid';
  total_price: number;
  notes: string | null;
  created_at: string;
}

interface RefundRequest {
  id: number;
  booking_id: number;
  status: 'pending_vendor' | 'pending_admin' | 'vendor_rejected' | 'appealed' | 'approved' | 'rejected' | 'processed';
  amount: number;
  reason: string | null;
  vendor_notes: string | null;
  appeal_reason: string | null;
  admin_notes: string | null;
  created_at: string;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'danger'; icon: typeof CheckCircle }> = {
  pending: { label: 'Pending', variant: 'warning', icon: Clock },
  confirmed: { label: 'Confirmed', variant: 'success', icon: CheckCircle },
  completed: { label: 'Completed', variant: 'default', icon: CheckCircle },
  cancelled: { label: 'Cancelled', variant: 'danger', icon: XCircle },
  refund_requested: { label: 'Refund Requested', variant: 'warning', icon: RotateCcw },
};

function DashboardContent() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'overview');
  const [savedVendors, setSavedVendors] = useState<SavedVendor[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [payingBooking, setPayingBooking] = useState<Booking | null>(null);
  const [refundingBooking, setRefundingBooking] = useState<Booking | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundError, setRefundError] = useState('');
  const [messagingVendor, setMessagingVendor] = useState<{ id: number; name: string } | null>(null);
  // Refund workflow states
  const [refundRequests, setRefundRequests] = useState<Record<number, RefundRequest>>({});
  const [appealingRefund, setAppealingRefund] = useState<RefundRequest | null>(null);
  const [appealReason, setAppealReason] = useState('');
  const [appealLoading, setAppealLoading] = useState(false);
  const [appealError, setAppealError] = useState('');

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
    // Redirect vendors/coordinators to their dashboards
    if (!isLoading && user) {
      if (user.role === 'vendor') {
        router.push('/vendor-dashboard');
      } else if (user.role === 'coordinator') {
        router.push('/coordinator-dashboard');
      }
    }
  }, [user, isLoading, router]);

  // Fetch saved vendors when tab changes to 'saved' or on component mount
  useEffect(() => {
    if (user && (activeTab === 'saved' || activeTab === 'overview')) {
      fetchSavedVendors();
    }
    if (user && (activeTab === 'bookings' || activeTab === 'overview')) {
      fetchBookings();
    }
  }, [user, activeTab]);

  const fetchSavedVendors = async () => {
    if (!user) return;
    setLoadingSaved(true);
    try {
      const response = await savedApi.list(user.id);
      if (response.success && response.data) {
        setSavedVendors(response.data as SavedVendor[]);
      }
    } catch (error) {
      console.error('Failed to fetch saved vendors:', error);
    } finally {
      setLoadingSaved(false);
    }
  };

  const fetchBookings = async () => {
    if (!user) return;
    setLoadingBookings(true);
    try {
      const [bookingsRes, refundsRes] = await Promise.all([
        fetch(`${API_URL}/bookings/list.php?user_id=${user.id}`),
        fetch(`${API_URL}/payments/refund.php?user_id=${user.id}`)
      ]);
      
      const bookingsResult = await bookingsRes.json();
      const refundsResult = await refundsRes.json();
      
      if (bookingsResult.success) {
        setBookings(bookingsResult.data);
      }
      
      if (refundsResult.success && refundsResult.data) {
        // Map refunds by booking_id for easy lookup
        const refundMap: Record<number, RefundRequest> = {};
        refundsResult.data.forEach((refund: RefundRequest) => {
          refundMap[refund.booking_id] = refund;
        });
        setRefundRequests(refundMap);
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoadingBookings(false);
    }
  };

  const handleRefundRequest = async () => {
    if (!refundingBooking || !user) return;
    
    setRefundLoading(true);
    setRefundError('');
    
    try {
      const response = await fetch(`${API_URL}/payments/refund.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request',
          booking_id: refundingBooking.id,
          user_id: user.id,
          reason: refundReason
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('Refund request submitted! The vendor will review your request.');
        setRefundingBooking(null);
        setRefundReason('');
        fetchBookings();
      } else {
        setRefundError(result.message || 'Failed to submit refund request');
      }
    } catch (error) {
      console.error('Refund request error:', error);
      setRefundError('Network error. Please try again.');
    } finally {
      setRefundLoading(false);
    }
  };

  const handleAppeal = async () => {
    if (!appealingRefund || !user) return;
    
    setAppealLoading(true);
    setAppealError('');
    
    try {
      const response = await fetch(`${API_URL}/payments/refund.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'appeal',
          refund_id: appealingRefund.id,
          user_id: user.id,
          appeal_reason: appealReason
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('Appeal submitted! Our admin team will review your request.');
        setAppealingRefund(null);
        setAppealReason('');
        fetchBookings();
      } else {
        setAppealError(result.message || 'Failed to submit appeal');
      }
    } catch (error) {
      console.error('Appeal error:', error);
      setAppealError('Network error. Please try again.');
    } finally {
      setAppealLoading(false);
    }
  };

  const getRefundStatusBadge = (refund: RefundRequest) => {
    const configs: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'danger'; description: string }> = {
      pending_vendor: { label: 'Awaiting Vendor', variant: 'warning', description: 'Waiting for vendor response' },
      pending_admin: { label: 'Processing', variant: 'warning', description: 'Vendor approved, admin processing' },
      vendor_rejected: { label: 'Vendor Rejected', variant: 'danger', description: 'You can appeal this decision' },
      appealed: { label: 'Appeal Pending', variant: 'warning', description: 'Admin reviewing your appeal' },
      approved: { label: 'Approved', variant: 'success', description: 'Refund approved, processing payment' },
      rejected: { label: 'Rejected', variant: 'danger', description: 'Refund request was denied' },
      processed: { label: 'Refunded', variant: 'success', description: 'Refund completed' },
    };
    return configs[refund.status] || { label: refund.status, variant: 'default' as const, description: '' };
  };

  const handleUnsaveVendor = async (vendorId: number) => {
    try {
      const response = await savedApi.toggle(vendorId);
      if (response.success) {
        setSavedVendors((prev) => prev.filter((v) => v.id !== vendorId));
      }
    } catch (error) {
      console.error('Failed to unsave vendor:', error);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-400"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Heart },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'saved', label: 'Saved', icon: Bookmark },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-dark-950">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Welcome back, {user.name}!</h1>
          <p className="text-gray-400">Plan your perfect wedding day</p>
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
                  router.push(`/dashboard?tab=${tab.id}`, { scroll: false });
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-pink-500/20 rounded-lg">
                    <Calendar className="w-6 h-6 text-pink-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Upcoming Bookings</p>
                    <p className="text-2xl font-bold text-white">0</p>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-pink-500/20 rounded-lg">
                    <Bookmark className="w-6 h-6 text-pink-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Saved Providers</p>
                    <p className="text-2xl font-bold text-white">{savedVendors.length}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-pink-500/20 rounded-lg">
                    <MessageSquare className="w-6 h-6 text-pink-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Unread Messages</p>
                    <p className="text-2xl font-bold text-white">0</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-auto py-4 flex-col" onClick={() => router.push('/vendors')}>
                  <Search className="w-6 h-6 mb-2" />
                  <span>Find Services</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col" onClick={() => router.push('/coordinators')}>
                  <Heart className="w-6 h-6 mb-2" />
                  <span>Coordinators</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col" onClick={() => setActiveTab('bookings')}>
                  <Calendar className="w-6 h-6 mb-2" />
                  <span>View Bookings</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col" onClick={() => setActiveTab('messages')}>
                  <MessageSquare className="w-6 h-6 mb-2" />
                  <span>Messages</span>
                </Button>
              </div>
            </Card>

            {/* Recent Activity */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
              <div className="text-center py-8 text-gray-400">
                <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No recent activity yet</p>
                <p className="text-sm mt-2">Start by browsing our amazing providers!</p>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'bookings' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">My Bookings</h3>
            {loadingBookings ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-400 mx-auto"></div>
              </div>
            ) : bookings.length > 0 ? (
              <div className="space-y-4">
                {bookings.map((booking) => {
                  const config = statusConfig[booking.status] || statusConfig.pending;
                  const StatusIcon = config.icon;
                  const isPaid = booking.payment_status === 'paid';
                  const eventDate = new Date(booking.event_date);
                  const isUpcoming = eventDate >= new Date();
                  
                  return (
                    <div key={booking.id} className="border border-dark-700 rounded-lg p-4 hover:border-pink-500/30 transition-colors">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Link href={`/vendors/${booking.vendor_id}`} className="text-white font-semibold hover:text-pink-400 transition-colors">
                              {booking.business_name || booking.vendor_name}
                            </Link>
                            <Badge variant={config.variant} className="text-xs">
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {config.label}
                            </Badge>
                          </div>
                          <p className="text-gray-400 text-sm">{booking.service_name || 'Service'}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span className="flex items-center gap-1 text-gray-400">
                              <Calendar className="w-4 h-4" />
                              {eventDate.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                            <span className="text-pink-400 font-semibold">
                              ₱{Number(booking.total_price).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {!isPaid && booking.status !== 'cancelled' && (
                            <Button 
                              size="sm" 
                              onClick={() => setPayingBooking(booking)}
                              className="bg-pink-500 hover:bg-pink-600"
                            >
                              <CreditCard className="w-4 h-4 mr-1" />
                              Pay Now
                            </Button>
                          )}
                          {isPaid && booking.payment_status !== 'refunded' && !refundRequests[booking.id] && (
                            <>
                              <Badge variant="success" className="text-xs">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Paid
                              </Badge>
                              {booking.status !== 'completed' && booking.status !== 'refund_requested' && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => setRefundingBooking(booking)}
                                  className="text-orange-400 border-orange-400/30 hover:bg-orange-500/10"
                                >
                                  <RotateCcw className="w-3 h-3 mr-1" />
                                  Request Refund
                                </Button>
                              )}
                            </>
                          )}
                          {/* Show refund status if there's an active refund request */}
                          {refundRequests[booking.id] && (
                            <div className="flex items-center gap-2">
                              {(() => {
                                const refund = refundRequests[booking.id];
                                const statusInfo = getRefundStatusBadge(refund);
                                return (
                                  <>
                                    <span title={statusInfo.description}>
                                      <Badge variant={statusInfo.variant} className="text-xs">
                                        <RotateCcw className="w-3 h-3 mr-1" />
                                        {statusInfo.label}
                                      </Badge>
                                    </span>
                                    {refund.status === 'vendor_rejected' && (
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => setAppealingRefund(refund)}
                                        className="text-yellow-400 border-yellow-400/30 hover:bg-yellow-500/10"
                                      >
                                        <AlertTriangle className="w-3 h-3 mr-1" />
                                        Appeal
                                      </Button>
                                    )}
                                    {refund.vendor_notes && refund.status === 'vendor_rejected' && (
                                      <span className="text-xs text-gray-400" title={refund.vendor_notes}>
                                        (Vendor: {refund.vendor_notes.substring(0, 30)}...)
                                      </span>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                          )}
                          {booking.payment_status === 'refunded' && (
                            <Badge variant="warning" className="text-xs">
                              <RotateCcw className="w-3 h-3 mr-1" />
                              Refunded
                            </Badge>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setMessagingVendor({ id: booking.vendor_id, name: booking.business_name || booking.vendor_name })}
                          >
                            <MessageSquare className="w-3 h-3 mr-1" />
                            Message
                          </Button>
                          <Link href={`/vendors/${booking.vendor_id}`}>
                            <Button variant="outline" size="sm">View Vendor</Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No bookings yet</p>
                <Button className="mt-4" onClick={() => router.push('/vendors')}>
                  Find Services
                </Button>
              </div>
            )}
          </Card>
        )}

        {/* Payment Modal */}
        {payingBooking && (
          <PaymentModal
            isOpen={!!payingBooking}
            onClose={() => setPayingBooking(null)}
            bookingId={payingBooking.id}
            amount={payingBooking.total_price}
            serviceName={payingBooking.service_name || 'Service'}
            vendorName={payingBooking.business_name || payingBooking.vendor_name}
            eventDate={payingBooking.event_date}
            onPaymentComplete={() => {
              setPayingBooking(null);
              fetchBookings();
            }}
          />
        )}

        {/* Refund Request Modal */}
        {refundingBooking && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-orange-500/20 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Request Refund</h3>
                  <p className="text-sm text-gray-400">This will cancel your booking</p>
                </div>
              </div>
              
              <div className="mb-4 p-3 bg-dark-800 rounded-lg">
                <p className="text-white font-medium">{refundingBooking.business_name}</p>
                <p className="text-gray-400 text-sm">{refundingBooking.service_name || 'Service'}</p>
                <p className="text-pink-400 font-semibold mt-1">
                  Refund Amount: ₱{Number(refundingBooking.total_price).toLocaleString()}
                </p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">
                  Reason for refund (optional)
                </label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Please tell us why you're requesting a refund..."
                  className="w-full bg-dark-800 border border-dark-700 rounded-lg p-3 text-white placeholder-gray-500 resize-none"
                  rows={3}
                />
              </div>
              
              {refundError && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 text-sm">{refundError}</p>
                </div>
              )}
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setRefundingBooking(null);
                    setRefundReason('');
                    setRefundError('');
                  }}
                  disabled={refundLoading}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                  onClick={handleRefundRequest}
                  disabled={refundLoading}
                >
                  {refundLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Submit Request
                    </>
                  )}
                </Button>
              </div>
              
              <p className="text-xs text-gray-500 mt-4 text-center">
                The vendor will review your request and respond within 2-3 business days
              </p>
            </Card>
          </div>
        )}

        {/* Appeal Modal */}
        {appealingRefund && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-yellow-500/20 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Appeal Refund Decision</h3>
                  <p className="text-sm text-gray-400">Submit your appeal to our admin team</p>
                </div>
              </div>
              
              {appealingRefund.vendor_notes && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">Vendor&apos;s reason for rejection:</p>
                  <p className="text-white text-sm">{appealingRefund.vendor_notes}</p>
                </div>
              )}
              
              <div className="mb-4 p-3 bg-dark-800 rounded-lg">
                <p className="text-pink-400 font-semibold">
                  Refund Amount: ₱{Number(appealingRefund.amount).toLocaleString()}
                </p>
                {appealingRefund.reason && (
                  <p className="text-gray-400 text-sm mt-1">Original reason: {appealingRefund.reason}</p>
                )}
              </div>
              
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">
                  Why should we reconsider? <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={appealReason}
                  onChange={(e) => setAppealReason(e.target.value)}
                  placeholder="Please explain why you believe this refund should be approved..."
                  className="w-full bg-dark-800 border border-dark-700 rounded-lg p-3 text-white placeholder-gray-500 resize-none"
                  rows={4}
                />
              </div>
              
              {appealError && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 text-sm">{appealError}</p>
                </div>
              )}
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setAppealingRefund(null);
                    setAppealReason('');
                    setAppealError('');
                  }}
                  disabled={appealLoading}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black"
                  onClick={handleAppeal}
                  disabled={appealLoading || !appealReason.trim()}
                >
                  {appealLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-black mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      Submit Appeal
                    </>
                  )}
                </Button>
              </div>
              
              <p className="text-xs text-gray-500 mt-4 text-center">
                Our admin team will review your appeal and make a final decision
              </p>
            </Card>
          </div>
        )}

        {/* Message Vendor Modal */}
        {messagingVendor && (
          <MessageVendorModal
            isOpen={!!messagingVendor}
            onClose={() => setMessagingVendor(null)}
            vendorId={messagingVendor.id}
            vendorName={messagingVendor.name}
            userId={user?.id ?? null}
            onSuccess={() => {
              setMessagingVendor(null);
              setActiveTab('messages');
            }}
          />
        )}

        {activeTab === 'saved' && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Saved Providers</h3>
            {loadingSaved ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-400 mx-auto"></div>
              </div>
            ) : savedVendors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedVendors.map((vendor) => (
                  <Card key={vendor.id} className="p-4 hover:border-pink-500/30 transition-colors">
                    <div className="flex justify-between items-start">
                      <Link href={`/vendors/${vendor.id}`} className="flex-1">
                        <h4 className="text-white font-semibold hover:text-pink-400 transition-colors">
                          {vendor.business_name}
                        </h4>
                        <p className="text-pink-400 text-sm capitalize">{vendor.category}</p>
                        <div className="flex items-center gap-2 mt-2 text-gray-400 text-sm">
                          <MapPin className="w-3 h-3" />
                          <span>{vendor.location}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                          <span className="text-white text-sm">{vendor.rating.toFixed(1)}</span>
                          <span className="text-gray-400 text-sm">({vendor.review_count} reviews)</span>
                        </div>
                        <p className="text-pink-400 text-sm mt-2">{formatPriceRange(vendor.price_range)}</p>
                      </Link>
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => setMessagingVendor({ id: vendor.id, name: vendor.business_name })}
                          className="p-2 text-gray-400 hover:text-pink-400 transition-colors"
                          title="Message vendor"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleUnsaveVendor(vendor.id)}
                          className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                          title="Remove from saved"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-6">
                <div className="text-center py-12 text-gray-400">
                  <Bookmark className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No saved providers yet</p>
                  <Button className="mt-4" onClick={() => router.push('/vendors')}>
                    Browse Services
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'messages' && user && (
          <MessagesTab userId={user.id} />
        )}

        {activeTab === 'settings' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Account Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name</label>
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
                <p className="text-white capitalize">{user.role === 'individual' ? 'Couple' : user.role}</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-400"></div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
