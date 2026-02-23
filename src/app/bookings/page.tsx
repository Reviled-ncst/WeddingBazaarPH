'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Calendar, Clock, MapPin, CreditCard, CheckCircle, XCircle, 
  AlertCircle, Loader2, ArrowLeft, MessageCircle, DollarSign, Star
} from 'lucide-react';
import { Button, Badge, Card } from '@/components/ui';
import { PaymentModal } from '@/components/booking/PaymentModal';
import { ReviewModal } from '@/components/booking/ReviewModal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/wedding-bazaar-api';

interface Booking {
  id: number;
  service_id: number;
  service_name: string;
  vendor_id: number;
  vendor_name: string;
  business_name: string;
  event_date: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'partial' | 'refunded';
  total_price: number;
  notes: string | null;
  created_at: string;
  has_review?: boolean;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'danger'; icon: typeof CheckCircle }> = {
  pending: { label: 'Pending', variant: 'warning', icon: Clock },
  confirmed: { label: 'Confirmed', variant: 'success', icon: CheckCircle },
  completed: { label: 'Completed', variant: 'default', icon: CheckCircle },
  cancelled: { label: 'Cancelled', variant: 'danger', icon: XCircle },
};

export default function MyBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);
  const [payingBooking, setPayingBooking] = useState<Booking | null>(null);
  const [reviewingBooking, setReviewingBooking] = useState<Booking | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user.role === 'couple') {
          setUserId(user.id);
          fetchBookings(user.id);
        } else {
          router.push('/login');
        }
      } catch (e) {
        router.push('/login');
      }
    } else {
      router.push('/login');
    }
  }, []);

  const fetchBookings = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}/bookings/list.php?user_id=${id}`);
      const result = await response.json();
      if (result.success) {
        setBookings(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const cancelBooking = async (bookingId: number) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
      const response = await fetch(`${API_URL}/bookings/update-status.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: bookingId,
          status: 'cancelled',
        }),
      });

      const result = await response.json();
      if (result.success) {
        setBookings(bookings.map(b => 
          b.id === bookingId ? { ...b, status: 'cancelled' } : b
        ));
      }
    } catch (error) {
      console.error('Failed to cancel booking:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-pink-400" />
      </div>
    );
  }

  const activeBookings = bookings.filter(b => b.status === 'pending' || b.status === 'confirmed');
  const pastBookings = bookings.filter(b => b.status === 'completed' || b.status === 'cancelled');

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Header */}
      <div className="bg-dark-900/50 border-b border-dark-800">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/discover" className="text-gray-400 hover:text-pink-400 flex items-center gap-1 text-sm mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Discover
          </Link>
          <h1 className="text-3xl font-bold text-white">My Bookings</h1>
          <p className="text-gray-400 mt-1">Manage your wedding service bookings</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {bookings.length === 0 ? (
          <Card className="p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">No bookings yet</h2>
            <p className="text-gray-400 mb-6">Start planning your perfect wedding by browsing our vendors.</p>
            <Link href="/discover">
              <Button>Browse Vendors</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Active Bookings */}
            {activeBookings.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Upcoming Bookings</h2>
                <div className="space-y-4">
                  {activeBookings.map((booking) => {
                    const StatusIcon = statusConfig[booking.status].icon;
                    return (
                      <Card key={booking.id} className="p-6">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-white">{booking.service_name}</h3>
                              <Badge variant={statusConfig[booking.status].variant}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {statusConfig[booking.status].label}
                              </Badge>
                            </div>
                            <Link 
                              href={`/vendors/${booking.vendor_id}`}
                              className="text-pink-400 hover:text-pink-300 text-sm mb-3 block"
                            >
                              {booking.vendor_name}
                            </Link>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {formatDate(booking.event_date)}
                              </div>
                              <div className="flex items-center gap-1">
                                <CreditCard className="w-4 h-4" />
                                {formatPrice(booking.total_price)}
                              </div>
                            </div>
                            {booking.notes && (
                              <p className="text-gray-500 text-sm mt-2 italic">"{booking.notes}"</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Link href={`/messages?vendor=${booking.vendor_id}`}>
                              <Button variant="outline" size="sm">
                                <MessageCircle className="w-4 h-4 mr-1" />
                                Message
                              </Button>
                            </Link>
                            {booking.status === 'pending' && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-red-400 hover:text-red-300"
                                onClick={() => cancelBooking(booking.id)}
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Past Bookings */}
            {pastBookings.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Past Bookings</h2>
                <div className="space-y-4">
                  {pastBookings.map((booking) => {
                    const StatusIcon = statusConfig[booking.status].icon;
                    return (
                      <Card key={booking.id} className="p-6 opacity-75">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-white">{booking.service_name}</h3>
                              <Badge variant={statusConfig[booking.status].variant}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {statusConfig[booking.status].label}
                              </Badge>
                            </div>
                            <p className="text-gray-400 text-sm mb-3">{booking.vendor_name}</p>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {formatDate(booking.event_date)}
                              </div>
                              <div className="flex items-center gap-1">
                                <CreditCard className="w-4 h-4" />
                                {formatPrice(booking.total_price)}
                              </div>
                            </div>
                          </div>
                          {booking.status === 'completed' && !booking.has_review && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setReviewingBooking(booking)}
                            >
                              <Star className="w-4 h-4 mr-1" />
                              Leave Review
                            </Button>
                          )}
                          {booking.status === 'completed' && booking.has_review && (
                            <Badge variant="success">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Reviewed
                            </Badge>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewingBooking && userId && (
        <ReviewModal
          isOpen={!!reviewingBooking}
          onClose={() => setReviewingBooking(null)}
          bookingId={reviewingBooking.id}
          vendorId={reviewingBooking.vendor_id}
          vendorName={reviewingBooking.vendor_name}
          serviceName={reviewingBooking.service_name}
          userId={userId}
          onReviewSubmitted={() => {
            // Mark booking as reviewed
            setBookings(bookings.map(b => 
              b.id === reviewingBooking.id ? { ...b, has_review: true } : b
            ));
            setReviewingBooking(null);
          }}
        />
      )}
    </div>
  );
}
