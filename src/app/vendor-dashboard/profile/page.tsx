'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LocationPicker } from '@/components/ui/LocationPicker';
import { VerificationModal, VerificationDocument } from '@/components/vendor/VerificationModal';
import { 
  MapPin, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle,
  Building,
  DollarSign,
  Truck,
  Car,
  Bike,
  Shield,
  ArrowLeft,
  Mail,
  Phone,
  Loader2
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/wedding-bazaar-api';

// Cavite standard per-km pricing matrix based on vehicle type
const TRAVEL_PRICING_MATRIX: Record<string, { baseFee: number; perKmRate: number; label: string; description: string }> = {
  motorcycle: {
    baseFee: 150,
    perKmRate: 7,
    label: 'Motorcycle',
    description: 'Light equipment, camera gear only'
  },
  car: {
    baseFee: 400,
    perKmRate: 12,
    label: 'Car / Sedan',
    description: 'Standard equipment, 1-2 crew'
  },
  suv: {
    baseFee: 550,
    perKmRate: 16,
    label: 'SUV / AUV',
    description: 'Medium equipment, 2-4 crew'
  },
  van: {
    baseFee: 700,
    perKmRate: 22,
    label: 'Van / L300',
    description: 'Full equipment setup, sounds & lights'
  },
  truck: {
    baseFee: 1000,
    perKmRate: 35,
    label: 'Truck / Elf',
    description: 'Heavy equipment, staging, large packages'
  }
};

// Map vendor categories to their typical vehicle options
const CATEGORY_VEHICLE_OPTIONS: Record<string, string[]> = {
  'Photography': ['motorcycle', 'car', 'suv'],
  'Videography': ['car', 'suv', 'van'],
  'Catering': ['van', 'truck'],
  'Florists': ['car', 'suv', 'van'],
  'Music & Entertainment': ['car', 'suv', 'van'],
  'Wedding Planners': ['motorcycle', 'car'],
  'Venues': [],
  'Bridal Wear': ['car', 'suv'],
  'Hair & Makeup': ['motorcycle', 'car'],
  'Decorations': ['suv', 'van', 'truck'],
  'Sounds & Lights': ['van', 'truck'],
  'Photo & Video': ['motorcycle', 'car', 'suv'],
};

interface VendorProfile {
  id: number;
  business_name: string;
  category: string;
  description: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  address_line1: string;
  address_line2: string;
  city: string;
  province: string;
  postal_code: string;
  vehicle_type: 'motorcycle' | 'car' | 'suv' | 'van' | 'truck' | null;
  base_travel_fee: number;
  per_km_rate: number;
  free_km_radius: number;
  verification_status: 'unverified' | 'pending' | 'verified' | 'rejected';
  verification_documents: string[];
  verification_notes: string;
  verified_at: string | null;
}

export default function VendorProfilePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationDocs, setVerificationDocs] = useState<VerificationDocument[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [shakeForm, setShakeForm] = useState(false);
  
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
  });

  // Location state
  const [location, setLocation] = useState<{ latitude: number | null; longitude: number | null }>({
    latitude: null,
    longitude: null,
  });

  // Vehicle type for travel pricing
  const [vehicleType, setVehicleType] = useState<string>('');

  const getVehicleOptions = () => {
    if (!profile?.category) return Object.keys(TRAVEL_PRICING_MATRIX);
    return CATEGORY_VEHICLE_OPTIONS[profile.category] || Object.keys(TRAVEL_PRICING_MATRIX);
  };

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
    if (!isLoading && user && user.role !== 'vendor') {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  // Fetch vendor profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        const res = await fetch(`${API_URL}/vendors/profile.php?user_id=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.vendor) {
            setProfile(data.vendor);
            setFormData({
              business_name: data.vendor.business_name || '',
              description: data.vendor.description || '',
              address_line1: data.vendor.address_line1 || '',
              address_line2: data.vendor.address_line2 || '',
              city: data.vendor.city || '',
              province: data.vendor.province || '',
              postal_code: data.vendor.postal_code || '',
              free_km_radius: data.vendor.free_km_radius?.toString() || '10',
            });
            setLocation({
              latitude: data.vendor.latitude || null,
              longitude: data.vendor.longitude || null,
            });
            if (data.vendor.vehicle_type) {
              setVehicleType(data.vendor.vehicle_type);
            } else if (data.vendor.per_km_rate) {
              const storedRate = parseFloat(data.vendor.per_km_rate);
              const matchedVehicle = Object.entries(TRAVEL_PRICING_MATRIX).find(
                ([_, pricing]) => pricing.perKmRate === storedRate
              );
              if (matchedVehicle) {
                setVehicleType(matchedVehicle[0]);
              }
            }
            // Parse verification documents
            if (data.vendor.verification_documents) {
              try {
                const docs = typeof data.vendor.verification_documents === 'string' 
                  ? JSON.parse(data.vendor.verification_documents) 
                  : data.vendor.verification_documents;
                setVerificationDocs(docs || []);
              } catch {
                setVerificationDocs([]);
              }
            }
          }
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
    
    console.log('=== VALIDATING FORM ===');
    console.log('Form Data:', formData);
    console.log('Location:', location);
    
    if (!formData.business_name.trim()) {
      errors.business_name = 'Business name is required';
      console.log('? Business name missing');
    } else {
      console.log('? Business name:', formData.business_name);
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
      console.log('? Description missing');
    } else if (formData.description.trim().length < 50) {
      errors.description = `Description should be at least 50 characters (currently ${formData.description.trim().length})`;
      console.log('? Description too short:', formData.description.length, 'chars');
    } else {
      console.log('? Description:', formData.description.length, 'chars');
    }
    
    if (!formData.city.trim()) {
      errors.city = 'City is required';
      console.log('? City missing');
    } else {
      console.log('? City:', formData.city);
    }
    
    if (!formData.province.trim()) {
      errors.province = 'Province is required';
      console.log('? Province missing');
    } else {
      console.log('? Province:', formData.province);
    }
    
    if (!location.latitude || !location.longitude) {
      errors.location = 'Please set your business location on the map';
      console.log('? Location not set - lat:', location.latitude, 'lng:', location.longitude);
    } else {
      console.log('? Location:', location.latitude, location.longitude);
    }
    
    console.log('Validation errors:', errors);
    console.log('=== VALIDATION COMPLETE ===');
    
    setValidationErrors(errors);
    
    // Scroll to first error
    if (Object.keys(errors).length > 0) {
      const firstErrorField = Object.keys(errors)[0];
      console.log('Scrolling to first error field:', firstErrorField);
      
      setTimeout(() => {
        const element = firstErrorField === 'location' 
          ? document.getElementById('location-picker')
          : document.querySelector(`[name="${firstErrorField}"]`);
        
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Focus the element if it's an input
          if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
            element.focus();
          }
        }
      }, 100);
    }
    
    return Object.keys(errors).length === 0;
  };

  const handleSaveProfile = async () => {
    console.log('=== SAVE PROFILE CLICKED ===');
    console.log('Profile:', profile);
    
    if (!profile) {
      console.log('? No profile loaded');
      return;
    }
    
    // Run validation and get errors
    const errors: Record<string, string> = {};
    
    if (!formData.business_name.trim()) {
      errors.business_name = 'Business name is required';
    }
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    } else if (formData.description.trim().length < 50) {
      errors.description = `Description needs ${50 - formData.description.trim().length} more characters`;
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
    
    if (Object.keys(errors).length > 0) {
      console.log('? Validation failed:', errors);
      setValidationErrors(errors);
      
      // Trigger shake animation
      setShakeForm(true);
      setTimeout(() => setShakeForm(false), 500);
      
      // Show toast with list of missing fields
      const errorCount = Object.keys(errors).length;
      const errorList = Object.values(errors).slice(0, 3).join(' � ');
      setSaveMessage({ 
        type: 'error', 
        text: `${errorCount} error${errorCount > 1 ? 's' : ''}: ${errorList}` 
      });
      
      // Auto-clear toast after 5 seconds
      setTimeout(() => setSaveMessage(null), 5000);
      
      // Scroll to first error with highlight
      setTimeout(() => {
        const firstErrorField = Object.keys(errors)[0];
        const element = firstErrorField === 'location' 
          ? document.getElementById('location-picker')
          : document.querySelector(`[name="${firstErrorField}"]`);
        
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
            element.focus();
            // Add pulse effect
            element.classList.add('animate-pulse');
            setTimeout(() => element.classList.remove('animate-pulse'), 1000);
          }
        }
      }, 100);
      return;
    }
    
    console.log('? Validation passed, saving...');
    setIsSaving(true);
    setValidationErrors({});
    
    try {
      const updateData = {
        vendor_id: profile.id,
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
      };

      const res = await fetch(`${API_URL}/vendors/update-profile.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (res.ok) {
        const data = await res.json();
        console.log('? Profile saved successfully:', data);
        setProfile(prev => prev ? { ...prev, ...data.vendor } : null);
        setSaveMessage({ type: 'success', text: 'Profile saved successfully!' });
        setTimeout(() => setSaveMessage(null), 5000);
      } else {
        const errorText = await res.text();
        console.error('? Save failed:', res.status, errorText);
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('? Error saving profile:', error);
      setSaveMessage({ type: 'error', text: 'Failed to save profile. Please try again.' });
      setTimeout(() => setSaveMessage(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerificationSubmit = async (documents: VerificationDocument[]) => {
    console.log('=== VERIFICATION SUBMIT ===');
    console.log('Documents:', documents);
    console.log('Profile:', profile);
    
    if (!profile) {
      console.log('? No profile');
      return;
    }
    
    if (!location.latitude || !location.longitude) {
      console.log('? Location not set');
      throw new Error('Please set your business location first');
    }

    console.log('Submitting verification for vendor:', profile.id);
    
    const res = await fetch(`${API_URL}/vendors/submit-verification.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vendor_id: profile.id,
        verification_documents: documents,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      console.log('? Verification submitted:', data);
      setProfile(prev => prev ? { ...prev, verification_status: 'pending' } : null);
      setVerificationDocs(documents);
      setShowVerificationModal(false);
    } else {
      const errorText = await res.text();
      console.error('? Verification submit failed:', res.status, errorText);
      throw new Error('Failed to submit verification');
    }
  };

  const getVerificationBadge = () => {
    const status = profile?.verification_status || 'unverified';
    const badges: Record<string, { bg: string; text: string; icon: typeof CheckCircle }> = {
      verified: { bg: 'bg-green-500/20 border-green-500/30', text: 'text-green-400', icon: CheckCircle },
      pending: { bg: 'bg-yellow-500/20 border-yellow-500/30', text: 'text-yellow-400', icon: Clock },
      rejected: { bg: 'bg-red-500/20 border-red-500/30', text: 'text-red-400', icon: XCircle },
      unverified: { bg: 'bg-dark-700 border-dark-600', text: 'text-dark-400', icon: AlertCircle },
    };
    
    const badge = badges[status] || badges.unverified;
    const Icon = badge.icon;
    
    return (
      <button
        onClick={() => setShowVerificationModal(true)}
        className={`px-3 py-1.5 rounded-full border ${badge.bg} ${badge.text} flex items-center gap-1.5 text-sm font-medium hover:opacity-80 transition-opacity`}
      >
        <Icon className="w-4 h-4" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </button>
    );
  };

  if (isLoading || isLoadingProfile) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 py-8">
      {/* Shake animation styles */}
      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .shake-animation {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
      
      <div className={`max-w-4xl mx-auto px-4 ${shakeForm ? 'shake-animation' : ''}`}>
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/vendor-dashboard')}
            className="mb-4 text-dark-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Business Profile</h1>
              <p className="text-dark-400 mt-1">Manage your business information and settings</p>
            </div>
            {getVerificationBadge()}
          </div>
        </div>

        {/* Contact Information */}
        <Card className="mb-6 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="w-5 h-5 text-pink-400" />
            <h2 className="text-xl font-semibold text-white">Contact Information</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1">
                Email Address
              </label>
              <div className="flex items-center gap-3">
                <div className="flex-1 px-4 py-3 rounded-xl border border-dark-700 bg-dark-800 text-white flex items-center gap-2">
                  <Mail className="w-4 h-4 text-dark-500" />
                  <span>{user?.email || 'Not set'}</span>
                </div>
                <div className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                  user?.email_verified 
                    ? 'bg-green-500/20 border border-green-500/30 text-green-400' 
                    : 'bg-dark-700 border border-dark-600 text-dark-400'
                }`}>
                  {user?.email_verified ? (
                    <><CheckCircle className="w-3 h-3" /> Verified</>
                  ) : (
                    <><AlertCircle className="w-3 h-3" /> Unverified</>
                  )}
                </div>
              </div>
              {!user?.email_verified && (
                <button className="mt-2 text-sm text-pink-400 hover:text-pink-300">
                  Send verification email
                </button>
              )}
            </div>
            
            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1">
                Phone Number
              </label>
              <div className="flex items-center gap-3">
                <div className="flex-1 px-4 py-3 rounded-xl border border-dark-700 bg-dark-800 text-white flex items-center gap-2">
                  <Phone className="w-4 h-4 text-dark-500" />
                  <span>{user?.phone || 'Not set'}</span>
                </div>
                <div className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                  user?.phone_verified 
                    ? 'bg-green-500/20 border border-green-500/30 text-green-400' 
                    : 'bg-dark-700 border border-dark-600 text-dark-400'
                }`}>
                  {user?.phone_verified ? (
                    <><CheckCircle className="w-3 h-3" /> Verified</>
                  ) : (
                    <><AlertCircle className="w-3 h-3" /> Unverified</>
                  )}
                </div>
              </div>
              {!user?.phone_verified && user?.phone && (
                <button className="mt-2 text-sm text-pink-400 hover:text-pink-300">
                  Send verification SMS
                </button>
              )}
            </div>
          </div>
        </Card>

        {/* Business Documents Verification */}
        <Card className="mb-6 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-pink-400" />
              <h2 className="text-xl font-semibold text-white">Business Documents Verification</h2>
            </div>
            {getVerificationBadge()}
          </div>
          
          <p className="text-dark-400 text-sm mb-4">
            Submit your business documents to get verified and build trust with customers. Required documents include DTI/SEC registration, BIR Certificate of Registration, and a valid government ID.
          </p>

          {/* Verification Status Details */}
          {(!profile?.verification_status || profile?.verification_status === 'unverified') && (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl mb-4">
              <div className="flex items-center gap-2 text-yellow-400">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Not Yet Verified</span>
              </div>
              <p className="text-yellow-300/80 text-sm mt-1">
                Upload your business documents to complete verification and start accepting bookings.
              </p>
            </div>
          )}
          
          {profile?.verification_status === 'pending' && (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl mb-4">
              <div className="flex items-center gap-2 text-yellow-400">
                <Clock className="w-5 h-5" />
                <span className="font-medium">Verification Pending</span>
              </div>
              <p className="text-yellow-300/80 text-sm mt-1">
                Your documents are being reviewed. This usually takes 1-2 business days.
              </p>
            </div>
          )}
          
          {profile?.verification_status === 'verified' && (
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl mb-4">
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Verified Business</span>
              </div>
              <p className="text-green-300/80 text-sm mt-1">
                Your business has been verified. Verified at: {profile.verified_at ? new Date(profile.verified_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          )}
          
          {profile?.verification_status === 'rejected' && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl mb-4">
              <div className="flex items-center gap-2 text-red-400">
                <XCircle className="w-5 h-5" />
                <span className="font-medium">Verification Rejected</span>
              </div>
              <p className="text-red-300/80 text-sm mt-1">
                {profile.verification_notes || 'Your documents were rejected. Please review and resubmit.'}
              </p>
            </div>
          )}

          {/* Submitted Documents Preview */}
          {verificationDocs.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-dark-300 mb-2">Submitted Documents ({verificationDocs.length})</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {verificationDocs.map((doc, idx) => (
                  <div key={idx} className="p-2 bg-dark-800 border border-dark-700 rounded-lg text-xs text-dark-400 truncate">
                    ?? {doc.name || `Document ${idx + 1}`}
                  </div>
                ))}
              </div>
            </div>
          )}

          {profile?.verification_status === 'rejected' ? (
            <button
              onClick={() => setShowVerificationModal(true)}
              style={{
                backgroundColor: '#ec4899',
                color: '#ffffff',
                border: '3px solid #f9a8d4',
                boxShadow: '0 0 25px rgba(236, 72, 153, 0.6)',
                padding: '14px 28px',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '16px',
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
              <AlertCircle className="w-5 h-5" />
              Resubmit Documents
            </button>
          ) : (
            <Button
              onClick={() => setShowVerificationModal(true)}
              variant={profile?.verification_status === 'verified' ? 'outline' : 'primary'}
            >
              {(!profile?.verification_status || profile?.verification_status === 'unverified') && 'Submit Documents'}
              {profile?.verification_status === 'pending' && 'View Submitted Documents'}
              {profile?.verification_status === 'verified' && 'View Documents'}
            </Button>
          )}
        </Card>

        {/* Business Information */}
        <Card className="mb-6 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building className="w-5 h-5 text-pink-400" />
            <h2 className="text-xl font-semibold text-white">Business Information</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-dark-300 mb-1">
                Business Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="business_name"
                value={formData.business_name}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 rounded-xl border bg-dark-800 placeholder-dark-500 text-white focus:outline-none focus:ring-2 focus:ring-pink-400/20 focus:border-pink-400 transition-all duration-200 ${validationErrors.business_name ? 'border-red-500 ring-2 ring-red-500/30 bg-red-500/5' : 'border-dark-700'}`}
              />
              {validationErrors.business_name && (
                <div className="mt-2 flex items-start gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-400">{validationErrors.business_name}</p>
                </div>
              )}
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-dark-300 mb-1">
                Business Description <span className="text-red-400">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                placeholder="Tell customers about your business, experience, and what makes you unique..."
                className={`w-full px-4 py-3 rounded-xl border bg-dark-800 placeholder-dark-500 text-white focus:outline-none focus:ring-2 focus:ring-pink-400/20 focus:border-pink-400 resize-none transition-all duration-200 ${validationErrors.description ? 'border-red-500 ring-2 ring-red-500/30 bg-red-500/5' : 'border-dark-700'}`}
              />
              {validationErrors.description && (
                <div className="mt-2 flex items-start gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-400">{validationErrors.description}</p>
                </div>
              )}
              <p className={`mt-1 text-xs ${formData.description.length < 50 ? 'text-amber-400' : 'text-green-400'}`}>
                {formData.description.length}/50 characters minimum
                {formData.description.length < 50 && ` (${50 - formData.description.length} more needed)`}
              </p>
            </div>
          </div>
        </Card>

        {/* Location Information */}
        <Card className="mb-6 p-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-pink-400" />
            <h2 className="text-xl font-semibold text-white">Business Location</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-dark-300 mb-1">
                Address Line 1
              </label>
              <input
                type="text"
                name="address_line1"
                value={formData.address_line1}
                onChange={handleInputChange}
                placeholder="Street address, building name"
                className="w-full px-4 py-3 rounded-xl border border-dark-700 bg-dark-800 placeholder-dark-500 text-white focus:outline-none focus:ring-2 focus:ring-pink-400/20 focus:border-pink-400"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-dark-300 mb-1">
                Address Line 2
              </label>
              <input
                type="text"
                name="address_line2"
                value={formData.address_line2}
                onChange={handleInputChange}
                placeholder="Suite, unit, floor (optional)"
                className="w-full px-4 py-3 rounded-xl border border-dark-700 bg-dark-800 placeholder-dark-500 text-white focus:outline-none focus:ring-2 focus:ring-pink-400/20 focus:border-pink-400"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1">
                City / Municipality <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 rounded-xl border bg-dark-800 placeholder-dark-500 text-white focus:outline-none focus:ring-2 focus:ring-pink-400/20 focus:border-pink-400 transition-all duration-200 ${validationErrors.city ? 'border-red-500 ring-2 ring-red-500/30 bg-red-500/5' : 'border-dark-700'}`}
              />
              {validationErrors.city && (
                <div className="mt-2 flex items-start gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-400">{validationErrors.city}</p>
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1">
                Province / Region <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="province"
                value={formData.province}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 rounded-xl border bg-dark-800 placeholder-dark-500 text-white focus:outline-none focus:ring-2 focus:ring-pink-400/20 focus:border-pink-400 transition-all duration-200 ${validationErrors.province ? 'border-red-500 ring-2 ring-red-500/30 bg-red-500/5' : 'border-dark-700'}`}
              />
              {validationErrors.province && (
                <div className="mt-2 flex items-start gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-400">{validationErrors.province}</p>
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1">
                Postal Code
              </label>
              <input
                type="text"
                name="postal_code"
                value={formData.postal_code}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl border border-dark-700 bg-dark-800 placeholder-dark-500 text-white focus:outline-none focus:ring-2 focus:ring-pink-400/20 focus:border-pink-400"
              />
            </div>
            
            {/* Location Picker Map */}
            <div id="location-picker" className="md:col-span-2 pt-4 border-t border-dark-700">
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Pin Your Business Location <span className="text-red-400">*</span>
              </label>
              <LocationPicker
                latitude={location.latitude}
                longitude={location.longitude}
                onLocationChange={handleLocationChange}
                onAddressChange={handleAddressChange}
              />
              {validationErrors.location && (
                <p className="mt-2 text-sm text-red-400">{validationErrors.location}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Travel Fees - Hide for Venues */}
        {profile?.category !== 'Venues' && (
          <Card className="mb-6 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Truck className="w-5 h-5 text-pink-400" />
              <h2 className="text-xl font-semibold text-white">Travel Pricing</h2>
            </div>
            <p className="text-sm text-dark-400 mb-4">
              Your travel fees are auto-calculated based on Cavite standard rates for your vehicle type.
            </p>
            
            {/* Vehicle Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-dark-300 mb-3">
                Select Your Vehicle Type
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {getVehicleOptions().map((type) => {
                  const pricing = TRAVEL_PRICING_MATRIX[type];
                  const IconComponent = type === 'motorcycle' ? Bike : type === 'car' || type === 'suv' ? Car : Truck;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setVehicleType(type)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        vehicleType === type
                          ? 'border-pink-400 bg-pink-400/10 ring-2 ring-pink-400/20'
                          : 'border-dark-700 bg-dark-800 hover:border-dark-600'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <IconComponent className={`w-5 h-5 ${vehicleType === type ? 'text-pink-400' : 'text-dark-500'}`} />
                        <span className={`font-medium ${vehicleType === type ? 'text-pink-400' : 'text-white'}`}>
                          {pricing.label}
                        </span>
                      </div>
                      <p className="text-xs text-dark-500 mb-2">{pricing.description}</p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-dark-400">Base: ?{pricing.baseFee.toLocaleString()}</span>
                        <span className="text-dark-400">?{pricing.perKmRate}/km</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Computed Pricing Display */}
            {vehicleType && (
              <div className="p-4 bg-dark-800 border border-dark-700 rounded-xl mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-medium text-white">Your Computed Travel Rates</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-green-400">?{computedTravelFees.baseFee.toLocaleString()}</p>
                    <p className="text-xs text-dark-500">Base Fee</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-400">?{computedTravelFees.perKmRate}</p>
                    <p className="text-xs text-dark-500">Per Kilometer</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-400">{formData.free_km_radius} km</p>
                    <p className="text-xs text-dark-500">Free Radius</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Free Radius Setting */}
            <div className="max-w-xs">
              <label className="block text-sm font-medium text-dark-300 mb-1">
                Free Radius (KM)
              </label>
              <input
                type="number"
                name="free_km_radius"
                value={formData.free_km_radius}
                onChange={handleInputChange}
                min="0"
                max="50"
                className="w-full px-4 py-3 rounded-xl border border-dark-700 bg-dark-800 placeholder-dark-500 text-white focus:outline-none focus:ring-2 focus:ring-pink-400/20 focus:border-pink-400"
              />
              <p className="text-xs text-dark-500 mt-1">No travel fee within this distance</p>
            </div>
          </Card>
        )}

        {/* Save Message - Fixed Toast */}
        {saveMessage && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg border flex items-center gap-3 shadow-lg animate-in slide-in-from-top-2 ${
            saveMessage.type === 'success' 
              ? 'bg-green-500/90 border-green-400 text-white' 
              : 'bg-red-500/90 border-red-400 text-white'
          }`}>
            {saveMessage.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
            <span className="font-medium">{saveMessage.text}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/vendor-dashboard')}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="min-w-[140px]"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : 'Save Profile'}
          </Button>
        </div>
      </div>

      {/* Verification Modal */}
      <VerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        vendorId={profile?.id || 0}
        businessName={profile?.business_name || ''}
        verificationStatus={profile?.verification_status || 'unverified'}
        verificationNotes={profile?.verification_notes}
        verifiedAt={profile?.verified_at}
        existingDocuments={verificationDocs}
        hasLocation={!!(location.latitude && location.longitude)}
        onSubmit={handleVerificationSubmit}
      />
    </div>
  );
}
