'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LocationPicker } from '@/components/ui/LocationPicker';
import { CoordinatorVerificationModal, VerificationDocument } from '@/components/coordinator/VerificationModal';
import { 
  MapPin, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle,
  Building,
  DollarSign,
  Car,
  Shield,
  ArrowLeft,
  Mail,
  Phone,
  Briefcase,
  Star
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/wedding-bazaar-api';

// Cavite standard per-km pricing matrix based on vehicle type
const TRAVEL_PRICING_MATRIX: Record<string, { baseFee: number; perKmRate: number; label: string; description: string }> = {
  motorcycle: {
    baseFee: 150,
    perKmRate: 7,
    label: 'Motorcycle',
    description: 'Personal transport only'
  },
  car: {
    baseFee: 400,
    perKmRate: 12,
    label: 'Car / Sedan',
    description: 'Standard transport, 1-2 crew'
  },
  suv: {
    baseFee: 550,
    perKmRate: 16,
    label: 'SUV / AUV',
    description: 'Larger team, event supplies'
  },
  van: {
    baseFee: 700,
    perKmRate: 22,
    label: 'Van / L300',
    description: 'Full team with equipment'
  },
};

interface CoordinatorProfile {
  id: number;
  business_name: string;
  description: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  address_line1: string;
  address_line2: string;
  city: string;
  province: string;
  postal_code: string;
  vehicle_type: 'motorcycle' | 'car' | 'suv' | 'van' | null;
  price_range: string;
  base_travel_fee: number;
  per_km_rate: number;
  free_km_radius: number;
  specialties: string[];
  weddings_completed: number;
  rating: number;
  review_count: number;
  verification_status: 'unverified' | 'pending' | 'verified' | 'rejected';
  verification_documents: VerificationDocument[];
  verification_notes: string;
  verified_at: string | null;
}

export default function CoordinatorProfilePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<CoordinatorProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationDocs, setVerificationDocs] = useState<VerificationDocument[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Form state
  const [formData, setFormData] = useState({
    business_name: '',
    description: '',
    address_line1: '',
    address_line2: '',
    city: '',
    province: '',
    postal_code: '',
    free_km_radius: '10',
    price_range: '',
    weddings_completed: '0',
    specialties: '',
  });

  // Location state
  const [location, setLocation] = useState<{ latitude: number | null; longitude: number | null }>({
    latitude: null,
    longitude: null,
  });

  // Vehicle type for travel pricing
  const [vehicleType, setVehicleType] = useState<string>('car');

  const computedTravelFees = vehicleType && TRAVEL_PRICING_MATRIX[vehicleType]
    ? {
        baseFee: TRAVEL_PRICING_MATRIX[vehicleType].baseFee,
        perKmRate: TRAVEL_PRICING_MATRIX[vehicleType].perKmRate
      }
    : { baseFee: 0, perKmRate: 0 };

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
    if (!isLoading && user && user.role !== 'coordinator') {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  // Fetch coordinator profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        const res = await fetch(`${API_URL}/coordinators/profile.php?user_id=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.coordinator) {
            setProfile(data.coordinator);
            setFormData({
              business_name: data.coordinator.business_name || '',
              description: data.coordinator.description || '',
              address_line1: data.coordinator.address_line1 || '',
              address_line2: data.coordinator.address_line2 || '',
              city: data.coordinator.city || '',
              province: data.coordinator.province || '',
              postal_code: data.coordinator.postal_code || '',
              free_km_radius: data.coordinator.free_km_radius?.toString() || '10',
              price_range: data.coordinator.price_range || '',
              weddings_completed: data.coordinator.weddings_completed?.toString() || '0',
              specialties: Array.isArray(data.coordinator.specialties) 
                ? data.coordinator.specialties.join(', ') 
                : '',
            });
            setLocation({
              latitude: data.coordinator.latitude || null,
              longitude: data.coordinator.longitude || null,
            });
            if (data.coordinator.vehicle_type) {
              setVehicleType(data.coordinator.vehicle_type);
            }
            // Parse verification documents
            if (data.coordinator.verification_documents) {
              try {
                const docs = typeof data.coordinator.verification_documents === 'string' 
                  ? JSON.parse(data.coordinator.verification_documents) 
                  : data.coordinator.verification_documents;
                setVerificationDocs(docs || []);
              } catch {
                setVerificationDocs([]);
              }
            }
          }
        } else if (res.status === 404) {
          // Coordinator profile doesn't exist, need to create one
          setProfile(null);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    if (!isLoading && user) {
      fetchProfile();
    }
  }, [user, isLoading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLocationChange = (lat: number, lng: number) => {
    setLocation({ latitude: lat, longitude: lng });
  };

  const handleAddressChange = (address: { 
    address_line1?: string;
    city?: string;
    province?: string;
    postal_code?: string;
  }) => {
    setFormData(prev => ({
      ...prev,
      address_line1: address.address_line1 || prev.address_line1,
      city: address.city || prev.city,
      province: address.province || prev.province,
      postal_code: address.postal_code || prev.postal_code,
    }));
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.business_name.trim()) {
      errors.business_name = 'Business name is required';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    } else if (formData.description.trim().length < 50) {
      errors.description = 'Description should be at least 50 characters';
    }
    
    if (!formData.city.trim()) {
      errors.city = 'City is required';
    }
    
    if (!formData.province.trim()) {
      errors.province = 'Province is required';
    }
    
    if (!location.latitude || !location.longitude) {
      errors.location = 'Please set your business location on the map';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    
    if (!validateForm()) {
      setSaveMessage({ type: 'error', text: 'Please fix the errors below before saving.' });
      return;
    }
    
    setIsSaving(true);
    setValidationErrors({});
    try {
      const specialtiesArray = formData.specialties
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const updateData = {
        coordinator_id: profile.id,
        business_name: formData.business_name,
        description: formData.description,
        address_line1: formData.address_line1,
        address_line2: formData.address_line2,
        city: formData.city,
        province: formData.province,
        postal_code: formData.postal_code,
        latitude: location.latitude,
        longitude: location.longitude,
        vehicle_type: vehicleType || null,
        base_travel_fee: computedTravelFees.baseFee,
        per_km_rate: computedTravelFees.perKmRate,
        free_km_radius: parseInt(formData.free_km_radius) || 10,
        price_range: formData.price_range,
        weddings_completed: parseInt(formData.weddings_completed) || 0,
        specialties: specialtiesArray,
      };

      const res = await fetch(`${API_URL}/coordinators/update-profile.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(prev => prev ? { ...prev, ...data.coordinator } : null);
        setSaveMessage({ type: 'success', text: 'Profile saved successfully!' });
        setTimeout(() => setSaveMessage(null), 5000);
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setSaveMessage({ type: 'error', text: 'Failed to save profile. Please try again.' });
      setTimeout(() => setSaveMessage(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerificationSubmit = async (documents: VerificationDocument[]) => {
    if (!profile) return;

    const res = await fetch(`${API_URL}/coordinators/submit-verification.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        coordinator_id: profile.id,
        verification_documents: documents,
      }),
    });

    if (res.ok) {
      setProfile(prev => prev ? { ...prev, verification_status: 'pending' } : null);
      setVerificationDocs(documents);
      setShowVerificationModal(false);
    } else {
      throw new Error('Failed to submit verification');
    }
  };

  const getVerificationBadge = () => {
    if (!profile) return null;
    
    switch (profile.verification_status) {
      case 'verified':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-full text-sm">
            <CheckCircle className="w-4 h-4" />
            <span>Verified</span>
          </div>
        );
      case 'pending':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-full text-sm">
            <Clock className="w-4 h-4 animate-pulse" />
            <span>Pending Review</span>
          </div>
        );
      case 'rejected':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-full text-sm">
            <XCircle className="w-4 h-4" />
            <span>Rejected</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/20 text-yellow-400 rounded-full text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>Unverified</span>
          </div>
        );
    }
  };

  if (isLoading || isLoadingProfile) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-400"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-dark-950 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="p-8 text-center">
            <Briefcase className="w-16 h-16 text-pink-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Complete Your Profile</h2>
            <p className="text-dark-400 mb-6">
              Your coordinator profile hasn&apos;t been set up yet. Please contact support to get started.
            </p>
            <Button onClick={() => router.push('/coordinator-dashboard')}>
              Back to Dashboard
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.push('/coordinator-dashboard')}
            className="p-2 hover:bg-dark-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-dark-400" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">Business Profile</h1>
            <p className="text-dark-400">Manage your coordinator profile and verification</p>
          </div>
          {getVerificationBadge()}
        </div>

        {/* Verification Card */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center">
                <Shield className="w-6 h-6 text-pink-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Business Verification</h3>
                <p className="text-sm text-dark-400">
                  {profile.verification_status === 'verified' 
                    ? 'Your business is verified. Clients trust verified coordinators more!'
                    : profile.verification_status === 'pending'
                    ? 'Your verification is being reviewed. This usually takes 1-2 business days.'
                    : profile.verification_status === 'rejected'
                    ? 'Your verification was rejected. Please review and resubmit.'
                    : 'Get verified to build trust with potential clients.'}
                </p>
              </div>
            </div>
            {profile.verification_status === 'rejected' ? (
              <button
                onClick={() => setShowVerificationModal(true)}
                style={{
                  backgroundColor: '#ec4899',
                  color: '#ffffff',
                  border: '3px solid #f9a8d4',
                  boxShadow: '0 0 25px rgba(236, 72, 153, 0.6)',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '14px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f472b6';
                  e.currentTarget.style.boxShadow = '0 0 35px rgba(236, 72, 153, 0.8)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ec4899';
                  e.currentTarget.style.boxShadow = '0 0 25px rgba(236, 72, 153, 0.6)';
                }}
              >
                <AlertCircle className="w-4 h-4" />
                Resubmit Documents
              </button>
            ) : (
              <Button 
                variant={profile.verification_status === 'verified' ? 'outline' : 'primary'}
                onClick={() => setShowVerificationModal(true)}
              >
                {profile.verification_status === 'verified' 
                  ? 'View Status'
                  : profile.verification_status === 'pending'
                  ? 'View Status'
                  : 'Get Verified'}
              </Button>
            )}
          </div>
        </Card>

        {/* Profile Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Business Info */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Building className="w-5 h-5 text-pink-400" />
              <h3 className="font-semibold text-white">Business Information</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-dark-300 mb-1">Business Name <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  name="business_name"
                  value={formData.business_name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 bg-dark-800 border rounded-lg text-white focus:border-pink-500 focus:outline-none ${validationErrors.business_name ? 'border-red-500' : 'border-dark-700'}`}
                />
                {validationErrors.business_name && (
                  <p className="mt-1 text-sm text-red-400">{validationErrors.business_name}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm text-dark-300 mb-1">Description <span className="text-red-400">*</span></label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className={`w-full px-3 py-2 bg-dark-800 border rounded-lg text-white focus:border-pink-500 focus:outline-none resize-none ${validationErrors.description ? 'border-red-500' : 'border-dark-700'}`}
                />
                {validationErrors.description && (
                  <p className="mt-1 text-sm text-red-400">{validationErrors.description}</p>
                )}
                <p className="mt-1 text-xs text-dark-500">{formData.description.length}/50 characters minimum</p>
              </div>

              <div>
                <label className="block text-sm text-dark-300 mb-1">Price Range</label>
                <input
                  type="text"
                  name="price_range"
                  value={formData.price_range}
                  onChange={handleInputChange}
                  placeholder="e.g., ?50,000 - ?300,000"
                  className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:border-pink-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-dark-300 mb-1">Weddings Completed</label>
                <input
                  type="number"
                  name="weddings_completed"
                  value={formData.weddings_completed}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:border-pink-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-dark-300 mb-1">Specialties (comma-separated)</label>
                <input
                  type="text"
                  name="specialties"
                  value={formData.specialties}
                  onChange={handleInputChange}
                  placeholder="Traditional Filipino, Beach Weddings, Destination Weddings"
                  className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:border-pink-500 focus:outline-none"
                />
              </div>
            </div>
          </Card>

          {/* Contact & Location */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <MapPin className="w-5 h-5 text-pink-400" />
              <h3 className="font-semibold text-white">Location & Contact</h3>
            </div>
            
            <div className="space-y-4">
              {user && (
                <>
                  <div className="flex items-center gap-2 text-dark-400">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-2 text-dark-400">
                      <Phone className="w-4 h-4" />
                      <span className="text-sm">{user.phone}</span>
                    </div>
                  )}
                </>
              )}

              <div>
                <label className="block text-sm text-dark-300 mb-1">Address Line 1</label>
                <input
                  type="text"
                  name="address_line1"
                  value={formData.address_line1}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:border-pink-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-dark-300 mb-1">Address Line 2 (Optional)</label>
                <input
                  type="text"
                  name="address_line2"
                  value={formData.address_line2}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:border-pink-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-dark-300 mb-1">City <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 bg-dark-800 border rounded-lg text-white focus:border-pink-500 focus:outline-none ${validationErrors.city ? 'border-red-500' : 'border-dark-700'}`}
                  />
                  {validationErrors.city && (
                    <p className="mt-1 text-sm text-red-400">{validationErrors.city}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-dark-300 mb-1">Province <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    name="province"
                    value={formData.province}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 bg-dark-800 border rounded-lg text-white focus:border-pink-500 focus:outline-none ${validationErrors.province ? 'border-red-500' : 'border-dark-700'}`}
                  />
                  {validationErrors.province && (
                    <p className="mt-1 text-sm text-red-400">{validationErrors.province}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm text-dark-300 mb-1">Postal Code</label>
                <input
                  type="text"
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:border-pink-500 focus:outline-none"
                />
              </div>
            </div>
          </Card>

          {/* Map */}
          <Card className="p-6 lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <MapPin className="w-5 h-5 text-pink-400" />
              <h3 className="font-semibold text-white">Pin Your Business Location <span className="text-red-400">*</span></h3>
            </div>
            <p className="text-sm text-dark-400 mb-4">
              Click on the map to set your business location. This helps clients find coordinators near their event venue.
            </p>
            {validationErrors.location && (
              <p className="mb-4 text-sm text-red-400">{validationErrors.location}</p>
            )}
            <LocationPicker
              latitude={location.latitude}
              longitude={location.longitude}
              onLocationChange={handleLocationChange}
              onAddressChange={handleAddressChange}
            />
            {location.latitude && location.longitude && (
              <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Location set: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </p>
            )}
          </Card>

          {/* Travel Pricing */}
          <Card className="p-6 lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <DollarSign className="w-5 h-5 text-pink-400" />
              <h3 className="font-semibold text-white">Travel Pricing</h3>
            </div>
            <p className="text-sm text-dark-400 mb-4">
              Select your typical transport mode. Travel fees are automatically computed based on Cavite standard rates.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {Object.entries(TRAVEL_PRICING_MATRIX).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => setVehicleType(key)}
                  className={`p-4 rounded-xl border transition-all text-left ${
                    vehicleType === key
                      ? 'border-pink-500 bg-pink-500/10'
                      : 'border-dark-700 bg-dark-800/50 hover:border-dark-600'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Car className={`w-5 h-5 ${vehicleType === key ? 'text-pink-400' : 'text-dark-400'}`} />
                    <span className={`font-medium ${vehicleType === key ? 'text-white' : 'text-dark-300'}`}>
                      {value.label}
                    </span>
                  </div>
                  <p className="text-xs text-dark-500">{value.description}</p>
                  <div className="mt-2 text-sm">
                    <span className={vehicleType === key ? 'text-pink-400' : 'text-dark-400'}>
                      ?{value.baseFee} + ?{value.perKmRate}/km
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm text-dark-300 mb-1">Free KM Radius</label>
                <input
                  type="number"
                  name="free_km_radius"
                  value={formData.free_km_radius}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:border-pink-500 focus:outline-none"
                />
                <p className="text-xs text-dark-500 mt-1">No travel fee within this radius</p>
              </div>
              <div className="flex-1 p-4 bg-dark-800/50 rounded-lg border border-dark-700">
                <p className="text-sm text-dark-400">Computed Rates:</p>
                <p className="text-lg font-semibold text-white">
                  ?{computedTravelFees.baseFee} base + ?{computedTravelFees.perKmRate}/km
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Save Message */}
        {saveMessage && (
          <div className={`p-4 rounded-lg border flex items-center gap-3 ${
            saveMessage.type === 'success' 
              ? 'bg-green-500/20 border-green-500/30 text-green-400' 
              : 'bg-red-500/20 border-red-500/30 text-red-400'
          }`}>
            {saveMessage.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
            <span>{saveMessage.text}</span>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end mt-6 gap-4">
          <Button variant="outline" onClick={() => router.push('/coordinator-dashboard')}>
            Cancel
          </Button>
          <Button onClick={handleSaveProfile} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Profile'}
          </Button>
        </div>
      </div>

      {/* Verification Modal */}
      <CoordinatorVerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        coordinatorId={profile.id}
        businessName={profile.business_name}
        verificationStatus={profile.verification_status}
        verificationNotes={profile.verification_notes}
        verifiedAt={profile.verified_at}
        existingDocuments={verificationDocs}
        hasLocation={!!(location.latitude && location.longitude)}
        onSubmit={handleVerificationSubmit}
      />
    </div>
  );
}
