'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  MapPin, 
  Star,
  BadgeCheck,
  Filter,
  Handshake,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Percent,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/wedding-bazaar-api';

interface Partnership {
  id: number;
  coordinator_id: number;
  vendor_id: number;
  message: string | null;
  partnership_type: 'preferred' | 'exclusive' | 'referral';
  commission_rate: number | null;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  created_at: string;
  coordinator_name: string;
  coordinator_rating: number;
  weddings_completed: number;
  vendor_name: string;
  vendor_category: string;
  vendor_rating: number;
  vendor_reviews: number;
  vendor_location: string;
  vendor_images: string[];
  vendor_verified: boolean;
}

const partnershipTypeLabels: Record<string, { label: string; color: string }> = {
  preferred: { label: 'Preferred Partner', color: 'bg-blue-500/20 text-blue-400' },
  exclusive: { label: 'Exclusive Partner', color: 'bg-purple-500/20 text-purple-400' },
  referral: { label: 'Referral Partner', color: 'bg-emerald-500/20 text-emerald-400' },
};

const statusLabels: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  pending: { label: 'Pending', color: 'bg-yellow-500/20 text-yellow-400', icon: Clock },
  accepted: { label: 'Active', color: 'bg-emerald-500/20 text-emerald-400', icon: CheckCircle },
  rejected: { label: 'Declined', color: 'bg-red-500/20 text-red-400', icon: XCircle },
  cancelled: { label: 'Cancelled', color: 'bg-gray-500/20 text-gray-400', icon: XCircle },
};

export default function PartnershipsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: number; role: string; vendorId?: number; coordinatorId?: number } | null>(null);
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing' | 'active'>('active');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
      } catch (e) {
        console.error('Error parsing user');
      }
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchPartnerships();
    }
  }, [user, activeTab]);

  const fetchPartnerships = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (user.role === 'coordinator' && user.coordinatorId) {
        params.set('coordinator_id', user.coordinatorId.toString());
      } else if (user.role === 'vendor' && user.vendorId) {
        params.set('vendor_id', user.vendorId.toString());
      }
      
      if (activeTab === 'active') {
        params.set('status', 'accepted');
      } else if (activeTab === 'incoming' && user.role === 'vendor') {
        params.set('status', 'pending');
      } else if (activeTab === 'outgoing' && user.role === 'coordinator') {
        params.set('status', 'pending');
      }
      
      const response = await fetch(`${API_URL}/community/partnerships/requests.php?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        setPartnerships(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch partnerships:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (partnershipId: number, status: 'accepted' | 'rejected') => {
    try {
      const response = await fetch(`${API_URL}/community/partnerships/requests.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'respond',
          id: partnershipId,
          status
        })
      });
      
      const result = await response.json();
      if (result.success) {
        fetchPartnerships();
      }
    } catch (error) {
      console.error('Failed to respond:', error);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays < 1) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
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
            <span className="text-white">Partnerships</span>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Handshake className="w-6 h-6 text-purple-400" />
                Partnership Matching
              </h1>
              <p className="text-gray-400 mt-1">
                Build long-term collaborations with vendors and coordinators
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {!user ? (
          <Card className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Sign In Required</h3>
            <p className="text-gray-400 mb-4">
              Please sign in as a vendor or coordinator to view and manage partnerships
            </p>
            <Button onClick={() => router.push('/login')}>
              Sign In
            </Button>
          </Card>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setActiveTab('active')}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  activeTab === 'active'
                    ? 'bg-pink-500 text-white'
                    : 'bg-dark-800 text-gray-400 hover:bg-dark-700'
                }`}
              >
                <CheckCircle className="w-4 h-4 inline mr-2" />
                Active Partners
              </button>
              {user.role === 'vendor' && (
                <button
                  onClick={() => setActiveTab('incoming')}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                    activeTab === 'incoming'
                      ? 'bg-pink-500 text-white'
                      : 'bg-dark-800 text-gray-400 hover:bg-dark-700'
                  }`}
                >
                  <Clock className="w-4 h-4 inline mr-2" />
                  Incoming Requests
                </button>
              )}
              {user.role === 'coordinator' && (
                <button
                  onClick={() => setActiveTab('outgoing')}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                    activeTab === 'outgoing'
                      ? 'bg-pink-500 text-white'
                      : 'bg-dark-800 text-gray-400 hover:bg-dark-700'
                  }`}
                >
                  <Clock className="w-4 h-4 inline mr-2" />
                  Sent Requests
                </button>
              )}
            </div>

            {/* Partnerships List */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-400 mx-auto"></div>
              </div>
            ) : partnerships.length > 0 ? (
              <div className="space-y-4">
                {partnerships.map((partnership) => {
                  const typeInfo = partnershipTypeLabels[partnership.partnership_type];
                  const statusInfo = statusLabels[partnership.status];
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <Card key={partnership.id} className="p-6 hover:border-pink-500/30 transition-colors">
                      <div className="flex flex-col md:flex-row gap-4">
                        {/* Partner Image */}
                        <div className="w-20 h-20 rounded-lg bg-dark-800 flex-shrink-0 overflow-hidden">
                          {partnership.vendor_images && partnership.vendor_images[0] ? (
                            <img 
                              src={partnership.vendor_images[0]} 
                              alt={partnership.vendor_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Users className="w-8 h-8 text-gray-600" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          {/* Header */}
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Link 
                                  href={`/vendors/${partnership.vendor_id}`}
                                  className="text-lg font-semibold text-white hover:text-pink-400 transition-colors"
                                >
                                  {partnership.vendor_name}
                                </Link>
                                {partnership.vendor_verified && (
                                  <BadgeCheck className="w-4 h-4 text-emerald-400" />
                                )}
                                <Badge className={typeInfo.color}>{typeInfo.label}</Badge>
                              </div>
                              <p className="text-sm text-gray-400 capitalize">
                                {partnership.vendor_category} &bull; {partnership.vendor_location}
                              </p>
                            </div>
                            <Badge className={statusInfo.color}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusInfo.label}
                            </Badge>
                          </div>

                          {/* Stats */}
                          <div className="flex items-center gap-4 text-sm mb-3">
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                              <span className="text-white">{partnership.vendor_rating.toFixed(1)}</span>
                              <span className="text-gray-400">({partnership.vendor_reviews} reviews)</span>
                            </div>
                            {partnership.commission_rate && (
                              <div className="flex items-center gap-1 text-emerald-400">
                                <Percent className="w-3 h-3" />
                                <span>{partnership.commission_rate}% commission</span>
                              </div>
                            )}
                            <span className="text-gray-500">{getTimeAgo(partnership.created_at)}</span>
                          </div>

                          {/* Message */}
                          {partnership.message && (
                            <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                              {partnership.message}
                            </p>
                          )}

                          {/* Actions */}
                          <div className="flex gap-2">
                            {partnership.status === 'pending' && user.role === 'vendor' && (
                              <>
                                <Button size="sm" onClick={() => handleRespond(partnership.id, 'accepted')}>
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Accept
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleRespond(partnership.id, 'rejected')}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Decline
                                </Button>
                              </>
                            )}
                            {partnership.status === 'accepted' && (
                              <Button size="sm" variant="outline">
                                <MessageSquare className="w-4 h-4 mr-1" />
                                Message
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <Handshake className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  {activeTab === 'active' ? 'No Active Partnerships' : 'No Pending Requests'}
                </h3>
                <p className="text-gray-400 mb-4">
                  {user.role === 'coordinator' 
                    ? 'Browse vendors to send partnership requests'
                    : 'Coordinators can send you partnership requests'}
                </p>
                {user.role === 'coordinator' && (
                  <Button onClick={() => router.push('/vendors')}>
                    Browse Vendors
                  </Button>
                )}
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
