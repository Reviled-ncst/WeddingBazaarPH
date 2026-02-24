'use client';

import { useState, useEffect } from 'react';
import { 
  X, Calendar, CreditCard, Check, AlertCircle, Info, 
  ChevronRight, ChevronLeft, Wallet, Building, Smartphone, 
  Receipt, Clock, MapPin, Navigation, Users, Package
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LocationPicker } from '@/components/ui/LocationPicker';
import { AvailabilityCalendar } from './AvailabilityCalendar';
import { PaymentModal } from './PaymentModal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/wedding-bazaar-api';

interface PricingItem {
  description: string;
  quantity?: number;
  unit?: string;
  rate?: number;
  amount?: number;
}

interface Service {
  id: number;
  name: string;
  description?: string;
  price?: number;
  base_total?: number;
  pricing_items?: PricingItem[];
  inclusions?: string[];
  add_ons?: Array<{ name: string; price: number }>;
  details?: Record<string, string | number>;
}

interface VendorTravelInfo {
  latitude?: number;
  longitude?: number;
  base_travel_fee?: number;
  per_km_rate?: number;
  free_km_radius?: number;
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendorId: number;
  vendorName: string;
  service: Service;
  userId: number | null;
  vendorTravelInfo?: VendorTravelInfo;
  onSuccess?: () => void;
}

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate travel fee based on distance
function calculateTravelFee(
  distance: number,
  baseFee: number = 0,
  perKmRate: number = 0,
  freeRadius: number = 0
): number {
  if (distance <= freeRadius) return 0;
  const chargeableDistance = distance - freeRadius;
  return baseFee + (chargeableDistance * perKmRate);
}

type BookingStep = 'date' | 'confirm';

export function BookingModal({
  isOpen,
  onClose,
  vendorId,
  vendorName,
  service,
  userId,
  vendorTravelInfo,
  onSuccess,
}: BookingModalProps) {
  const [currentStep, setCurrentStep] = useState<BookingStep>('date');
  const [eventDate, setEventDate] = useState('');
  const [notes, setNotes] = useState('');
  const [guestCount, setGuestCount] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [createdBookingId, setCreatedBookingId] = useState<number | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [dateAvailability, setDateAvailability] = useState<{
    available: boolean;
    reason?: string;
    current_bookings?: number;
    max_bookings?: number;
  } | null>(null);
  const [checkingDate, setCheckingDate] = useState(false);
  
  // Event location state for travel fee calculation
  const [eventLocation, setEventLocation] = useState<{
    lat: number | null;
    lng: number | null;
    address: string;
  }>({ lat: null, lng: null, address: '' });
  const [showLocationInput, setShowLocationInput] = useState(false);

  // Calculate distance and travel fee
  const distance = 
    eventLocation.lat && eventLocation.lng && 
    vendorTravelInfo?.latitude && vendorTravelInfo?.longitude
      ? calculateDistance(
          vendorTravelInfo.latitude,
          vendorTravelInfo.longitude,
          eventLocation.lat,
          eventLocation.lng
        )
      : 0;

  const travelFee = vendorTravelInfo?.per_km_rate
    ? calculateTravelFee(
        distance,
        vendorTravelInfo.base_travel_fee || 0,
        vendorTravelInfo.per_km_rate,
        vendorTravelInfo.free_km_radius || 0
      )
    : 0;

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep('date');
      setEventDate('');
      setNotes('');
      setGuestCount('');
      setError('');
      setSuccess(false);
      setCreatedBookingId(null);
      setShowPaymentModal(false);
      setEventLocation({ lat: null, lng: null, address: '' });
      setShowLocationInput(false);
    }
  }, [isOpen]);

  // Check availability when date changes
  useEffect(() => {
    if (eventDate && vendorId && service.id) {
      checkDateAvailability(eventDate);
    } else {
      setDateAvailability(null);
    }
  }, [eventDate, vendorId, service.id]);

  const checkDateAvailability = async (date: string) => {
    setCheckingDate(true);
    try {
      const response = await fetch(
        `${API_URL}/availability/check.php?vendor_id=${vendorId}&service_id=${service.id}&date=${date}`
      );
      const result = await response.json();
      if (result.success) {
        setDateAvailability(result.data);
      }
    } catch (err) {
      console.error('Failed to check availability:', err);
    } finally {
      setCheckingDate(false);
    }
  };

  if (!isOpen) return null;

  const basePrice = service.price || service.base_total || 0;
  const totalPrice = basePrice + Math.round(travelFee);
  const hasTravelPricing = !!(vendorTravelInfo?.per_km_rate && vendorTravelInfo.per_km_rate > 0);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-PH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleNext = () => {
    setError('');
    
    if (currentStep === 'date') {
      if (!eventDate) {
        setError('Please select an event date');
        return;
      }
      if (dateAvailability && !dateAvailability.available) {
        setError(dateAvailability.reason || 'Selected date is not available');
        return;
      }
      setCurrentStep('confirm');
    }
  };

  const handleBack = () => {
    setError('');
    if (currentStep === 'confirm') {
      setCurrentStep('date');
    }
  };

  const handleSubmit = async () => {
    setError('');

    if (!userId) {
      setError('Please log in to book a service');
      return;
    }

    setIsSubmitting(true);

    try {
      // Capture source tracking data
      const sourcePage = typeof window !== 'undefined' ? window.location.pathname : null;
      const referrer = typeof document !== 'undefined' ? document.referrer : null;
      const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const sessionId = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('analytics_session') : null;
      
      // Detect device type
      const getDeviceType = () => {
        if (typeof window === 'undefined') return 'desktop';
        const width = window.innerWidth;
        if (width < 768) return 'mobile';
        if (width < 1024) return 'tablet';
        return 'desktop';
      };
      
      // Get browser name
      const getBrowser = () => {
        if (typeof navigator === 'undefined') return 'unknown';
        const ua = navigator.userAgent;
        if (ua.includes('Firefox')) return 'Firefox';
        if (ua.includes('Chrome')) return 'Chrome';
        if (ua.includes('Safari')) return 'Safari';
        if (ua.includes('Edge')) return 'Edge';
        return 'Other';
      };
      
      const response = await fetch(`${API_URL}/bookings/create.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          vendor_id: vendorId,
          service_id: service.id,
          event_date: eventDate,
          total_price: totalPrice,
          travel_fee: Math.round(travelFee),
          event_latitude: eventLocation.lat,
          event_longitude: eventLocation.lng,
          event_address: eventLocation.address,
          guest_count: guestCount || null,
          notes: notes || null,
          // Source tracking data
          source_page: sourcePage,
          referrer: referrer,
          utm_source: urlParams?.get('utm_source'),
          utm_medium: urlParams?.get('utm_medium'),
          utm_campaign: urlParams?.get('utm_campaign'),
          user_city: eventLocation.address?.split(',')[0] || null,
          user_latitude: eventLocation.lat,
          user_longitude: eventLocation.lng,
          device_type: getDeviceType(),
          browser: getBrowser(),
          session_id: sessionId,
        }),
      });

      const result = await response.json();

      if (result.success && result.booking_id) {
        setCreatedBookingId(result.booking_id);
        setShowPaymentModal(true);
      } else {
        setError(result.message || 'Failed to create booking');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentComplete = () => {
    setSuccess(true);
    setShowPaymentModal(false);
    setTimeout(() => {
      onSuccess?.();
      onClose();
    }, 2000);
  };

  const steps: BookingStep[] = ['date', 'confirm'];

  const stepIndicator = (
    <div className="flex items-center justify-center gap-2 mb-6">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
            currentStep === step 
              ? 'bg-pink-500 text-white' 
              : steps.indexOf(currentStep) > index
                ? 'bg-emerald-500 text-white'
                : 'bg-dark-700 text-gray-500'
          }`}>
            {steps.indexOf(currentStep) > index ? (
              <Check className="w-4 h-4" />
            ) : (
              index + 1
            )}
          </div>
          {index < 1 && (
            <div className={`w-12 h-0.5 mx-1 ${
              steps.indexOf(currentStep) > index
                ? 'bg-emerald-500'
                : 'bg-dark-700'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-dark-900 border border-dark-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-800">
          <h2 className="text-xl font-semibold text-white">
            {success ? 'Booking Confirmed!' : 'Book Service'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {success ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-3">Payment Complete!</h3>
              <p className="text-gray-400 mb-6">
                Your booking has been confirmed. {vendorName} will contact you with the details.
              </p>
              <div className="bg-dark-800/50 rounded-xl p-4 text-left">
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(eventDate)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <CreditCard className="w-4 h-4" />
                  <span>{formatPrice(totalPrice)}</span>
                </div>
              </div>
            </div>
          ) : (
            <>
              {stepIndicator}

              {/* Service Info - Always visible */}
              <div className="bg-dark-800/50 rounded-xl p-4 mb-6">
                <h3 className="text-white font-medium mb-1">{service.name}</h3>
                <p className="text-gray-400 text-sm mb-2">{vendorName}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-pink-400" />
                    <span className="text-pink-400 font-semibold">{formatPrice(basePrice)}</span>
                    {hasTravelPricing && <span className="text-gray-500 text-xs">+ travel</span>}
                  </div>
                  {eventDate && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className={dateAvailability?.available ? 'text-white' : 'text-red-400'}>
                        {formatDate(eventDate)}
                      </span>
                      {checkingDate ? (
                        <span className="text-gray-500 text-xs">(checking...)</span>
                      ) : dateAvailability && (
                        <span className={`text-xs ${dateAvailability.available ? 'text-gray-500' : 'text-red-400'}`}>
                          ({dateAvailability.available 
                            ? `${dateAvailability.current_bookings}/${dateAvailability.max_bookings} booked`
                            : 'unavailable'})
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 p-3 mb-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span className="text-red-400 text-sm">{error}</span>
                </div>
              )}

              {/* Step 1: Date Selection */}
              {currentStep === 'date' && (
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Select Event Date *
                  </label>
                  <AvailabilityCalendar
                    vendorId={vendorId}
                    serviceId={service.id}
                    selectedDate={eventDate}
                    onDateSelect={(date) => setEventDate(date)}
                  />

                  {/* Event Location for Travel Fee */}
                  {hasTravelPricing && (
                    <div className="mt-4">
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-pink-400" />
                          Event Location
                          <span className="text-gray-500 text-xs font-normal">(for travel fee calculation)</span>
                        </div>
                      </label>
                      
                      {!showLocationInput ? (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowLocationInput(true)}
                          className="w-full justify-start text-left"
                        >
                          <MapPin className="w-4 h-4 mr-2" />
                          {eventLocation.address || 'Set event location on map'}
                        </Button>
                      ) : (
                        <div className="space-y-3">
                          {/* Map Location Picker */}
                          <LocationPicker
                            latitude={eventLocation.lat}
                            longitude={eventLocation.lng}
                            onLocationChange={(lat, lng) => {
                              setEventLocation(prev => ({ ...prev, lat, lng }));
                            }}
                            onAddressChange={(address) => {
                              const fullAddress = [
                                address.address_line1,
                                address.city,
                                address.province
                              ].filter(Boolean).join(', ');
                              setEventLocation(prev => ({ ...prev, address: fullAddress }));
                            }}
                          />
                          
                          {/* Travel Fee Preview */}
                          {distance > 0 && (
                            <div className="bg-dark-800/50 rounded-lg p-3 text-sm">
                              <div className="flex items-center justify-between text-gray-400">
                                <span className="flex items-center gap-1">
                                  <Navigation className="w-3 h-3" />
                                  Distance from vendor:
                                </span>
                                <span className="text-white">{distance.toFixed(1)} km</span>
                              </div>
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-gray-400">Travel Fee:</span>
                                <span className={travelFee > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                                  {travelFee > 0 ? formatPrice(Math.round(travelFee)) : 'Free'}
                                </span>
                              </div>
                              {vendorTravelInfo?.free_km_radius && vendorTravelInfo.free_km_radius > 0 && (
                                <p className="text-gray-500 text-xs mt-2">
                                  Free within {vendorTravelInfo.free_km_radius}km • Base: ₱{vendorTravelInfo.base_travel_fee} • ₱{vendorTravelInfo.per_km_rate}/km after
                                </p>
                              )}
                            </div>
                          )}

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowLocationInput(false)}
                            className="w-full"
                          >
                            Done
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Guest Count */}
                  <div className="mt-4">
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      <Users className="w-4 h-4 inline mr-2" />
                      Expected Guest Count
                      {service.details?.capacity && (
                        <span className="text-gray-500 font-normal ml-2">
                          (max {service.details.capacity} guests)
                        </span>
                      )}
                    </label>
                    <input
                      type="number"
                      value={guestCount}
                      onChange={(e) => {
                        const val = e.target.value ? parseInt(e.target.value) : '';
                        const maxCapacity = service.details?.capacity ? Number(service.details.capacity) : 2000;
                        if (val === '' || (typeof val === 'number' && val >= 1 && val <= maxCapacity)) {
                          setGuestCount(val);
                        }
                      }}
                      placeholder={service.details?.capacity ? `1 - ${service.details.capacity}` : "e.g., 100"}
                      min={1}
                      max={service.details?.capacity ? Number(service.details.capacity) : 2000}
                      className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-pink-500 transition-colors"
                    />
                    <p className="text-gray-500 text-xs mt-1">
                      {service.details?.capacity 
                        ? `This service can accommodate up to ${service.details.capacity} guests`
                        : 'This helps the vendor prepare appropriately for your event'}
                    </p>
                  </div>

                  {/* Notes */}
                  <div className="mt-4">
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Additional Notes (Optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any special requests or details..."
                      rows={2}
                      className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-pink-500 transition-colors resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Confirmation */}
              {currentStep === 'confirm' && (
                <div className="space-y-4">
                  {/* Event Details Card */}
                  <div className="bg-dark-800 rounded-xl p-5">
                    <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-pink-400" />
                      Event Details
                    </h4>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Event Date</span>
                        <span className="text-white">{formatDate(eventDate)}</span>
                      </div>
                      {guestCount && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400 flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            Expected Guests
                          </span>
                          <span className="text-white">{guestCount} guests</span>
                        </div>
                      )}
                      {eventLocation.address && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            Location
                          </span>
                          <span className="text-white text-right max-w-[200px] truncate">{eventLocation.address}</span>
                        </div>
                      )}
                      {notes && (
                        <div className="pt-2 border-t border-dark-700">
                          <span className="text-gray-400 text-sm">Special Requests:</span>
                          <p className="text-gray-300 text-sm mt-1">{notes}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Service & Package Details Card */}
                  <div className="bg-dark-800 rounded-xl p-5">
                    <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                      <Package className="w-5 h-5 text-pink-400" />
                      Package Details
                    </h4>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Service</span>
                        <span className="text-white font-medium">{service.name}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Vendor</span>
                        <span className="text-white">{vendorName}</span>
                      </div>

                      {/* Pricing Items Breakdown */}
                      {service.pricing_items && service.pricing_items.length > 0 && (
                        <div className="pt-3 border-t border-dark-700">
                          <span className="text-gray-400 text-xs uppercase tracking-wider mb-2 block">Price Breakdown</span>
                          <div className="space-y-1.5">
                            {service.pricing_items.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span className="text-gray-400">
                                  {item.description}
                                  {item.quantity && item.unit && (
                                    <span className="text-gray-500 text-xs ml-1">
                                      ({item.quantity} {item.unit})
                                    </span>
                                  )}
                                </span>
                                <span className="text-white">
                                  {item.amount ? formatPrice(item.amount) : item.rate ? formatPrice(item.rate) : '-'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Inclusions */}
                      {service.inclusions && service.inclusions.length > 0 && (
                        <div className="pt-3 border-t border-dark-700">
                          <span className="text-gray-400 text-xs uppercase tracking-wider mb-2 block">What&apos;s Included</span>
                          <ul className="space-y-1">
                            {service.inclusions.map((inclusion, idx) => (
                              <li key={idx} className="flex items-center gap-2 text-sm text-gray-300">
                                <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                                {inclusion}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Service Details */}
                      {service.details && Object.keys(service.details).length > 0 && (
                        <div className="pt-3 border-t border-dark-700">
                          <span className="text-gray-400 text-xs uppercase tracking-wider mb-2 block">Details</span>
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries(service.details).map(([key, value]) => (
                              <div key={key} className="text-sm">
                                <span className="text-gray-500 capitalize">{key.replace(/_/g, ' ')}: </span>
                                <span className="text-gray-300">{value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Price Summary Card */}
                  <div className="bg-dark-800 rounded-xl p-5">
                    <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                      <Receipt className="w-5 h-5 text-pink-400" />
                      Price Summary
                    </h4>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Package Price</span>
                        <span className="text-white">{formatPrice(basePrice)}</span>
                      </div>
                      {hasTravelPricing && (
                          <>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400 flex items-center gap-1">
                                <Navigation className="w-3 h-3" />
                                Travel Fee{distance > 0 && ` (${distance.toFixed(1)} km)`}
                              </span>
                              <span className="text-white">
                                {travelFee > 0 ? formatPrice(Math.round(travelFee)) : 'Free'}
                              </span>
                            </div>
                            {vendorTravelInfo?.free_km_radius && vendorTravelInfo.free_km_radius > 0 && distance <= vendorTravelInfo.free_km_radius && (
                              <p className="text-emerald-400 text-xs">Within free {vendorTravelInfo.free_km_radius}km radius</p>
                            )}
                          </>
                        )}
                        <div className="pt-2 border-t border-dark-700 flex justify-between">
                          <span className="text-gray-400 font-medium">Total Price</span>
                          <span className="text-pink-400 font-bold text-lg">{formatPrice(totalPrice)}</span>
                        </div>
                      </div>
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <CreditCard className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-blue-400 font-medium text-sm">Proceed to Payment</p>
                        <p className="text-gray-400 text-xs mt-1">
                          After confirming, you'll be able to complete payment using GCash, 
                          GrabPay, bank transfer, or cash.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer with navigation */}
        {!success && (
          <div className="px-6 py-4 border-t border-dark-800 flex gap-3">
            {currentStep !== 'date' && (
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-1"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            )}
            
            {currentStep === 'confirm' ? (
              <Button
                onClick={handleSubmit}
                className="flex-1"
                disabled={isSubmitting || !userId}
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Creating Booking...
                  </>
                ) : !userId ? (
                  'Log in to Book'
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Confirm & Proceed to Payment
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                className="flex-1"
              >
                Review Booking
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {createdBookingId !== null && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            onSuccess?.();
            onClose();
          }}
          bookingId={createdBookingId}
          amount={totalPrice}
          serviceName={service.name}
          vendorName={vendorName}
          eventDate={formatDate(eventDate)}
          onPaymentComplete={handlePaymentComplete}
        />
      )}
    </div>
  );
}
