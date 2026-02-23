'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Calendar, Heart, MessageSquare, Bookmark, Settings, Search, Star, MapPin, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { savedApi } from '@/lib/api';
import { MessagesTab } from '@/components/messaging/MessagesTab';

interface SavedVendor {
  id: number;
  business_name: string;
  category: string;
  location: string;
  rating: number;
  review_count: number;
  price_range: string;
}

function DashboardContent() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'overview');
  const [savedVendors, setSavedVendors] = useState<SavedVendor[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

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
  }, [user, activeTab]);

  const fetchSavedVendors = async () => {
    setLoadingSaved(true);
    try {
      const response = await savedApi.list();
      if (response.success && response.data) {
        setSavedVendors(response.data as SavedVendor[]);
      }
    } catch (error) {
      console.error('Failed to fetch saved vendors:', error);
    } finally {
      setLoadingSaved(false);
    }
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
            <div className="text-center py-12 text-gray-400">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No bookings yet</p>
              <Button className="mt-4" onClick={() => router.push('/vendors')}>
                Find Services
              </Button>
            </div>
          </Card>
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
                        <p className="text-pink-400 text-sm mt-2">{vendor.price_range}</p>
                      </Link>
                      <button
                        onClick={() => handleUnsaveVendor(vendor.id)}
                        className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                        title="Remove from saved"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
