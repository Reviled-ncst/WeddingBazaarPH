'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Calendar, Users, Users2, MessageSquare, ClipboardList, Settings, Briefcase, CheckCircle, Clock, Shield, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ClientsTab } from '@/components/coordinator/ClientsTab';
import { EventsTab } from '@/components/coordinator/EventsTab';
import { TasksTab } from '@/components/coordinator/TasksTab';
import { MessagesTab } from '@/components/messaging/MessagesTab';

function CoordinatorDashboardContent() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'overview');

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
    // Redirect non-coordinators to their dashboards
    if (!isLoading && user && user.role !== 'coordinator') {
      if (user.role === 'vendor') {
        router.push('/vendor-dashboard');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-400"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Briefcase },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'tasks', label: 'Tasks', icon: ClipboardList },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'community', label: 'Community', icon: Users2, href: '/community' },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-dark-950">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Welcome, {user.name}!</h1>
            <p className="text-gray-400">Manage your wedding coordination</p>
          </div>
          <Badge variant="pink">Coordinator</Badge>
        </div>

        {/* Top Navigation Tabs */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.href) {
                    router.push(tab.href);
                  } else {
                    setActiveTab(tab.id);
                    router.push(`/coordinator-dashboard?tab=${tab.id}`, { scroll: false });
                  }
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
                    <p className="text-gray-400 text-sm">Upcoming Events</p>
                    <p className="text-2xl font-bold text-white">0</p>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/20 rounded-lg">
                    <Users className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Active Clients</p>
                    <p className="text-2xl font-bold text-white">0</p>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-yellow-500/20 rounded-lg">
                    <Clock className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Pending Tasks</p>
                    <p className="text-2xl font-bold text-white">0</p>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-500/20 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Completed</p>
                    <p className="text-2xl font-bold text-white">0</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Upcoming Events */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Upcoming Events</h3>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('events')}>
                  View All
                </Button>
              </div>
              <div className="text-center py-8 text-gray-400">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No upcoming events</p>
                <p className="text-sm mt-2">Events you coordinate will appear here</p>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-auto py-4 flex-col" onClick={() => setActiveTab('events')}>
                  <Calendar className="w-6 h-6 mb-2" />
                  <span>Manage Events</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col" onClick={() => setActiveTab('clients')}>
                  <Users className="w-6 h-6 mb-2" />
                  <span>View Clients</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col" onClick={() => setActiveTab('tasks')}>
                  <ClipboardList className="w-6 h-6 mb-2" />
                  <span>Tasks</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col" onClick={() => router.push('/vendors')}>
                  <Briefcase className="w-6 h-6 mb-2" />
                  <span>Find Providers</span>
                </Button>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'events' && <EventsTab />}

        {activeTab === 'clients' && <ClientsTab />}

        {activeTab === 'tasks' && <TasksTab />}

        {activeTab === 'messages' && user && (
          <MessagesTab userId={user.id} />
        )}

        {activeTab === 'profile' && (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-pink-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Business Verification</h3>
                    <p className="text-sm text-gray-400">Get verified to build trust with clients</p>
                  </div>
                </div>
                <Button onClick={() => router.push('/coordinator-dashboard/profile')}>
                  Manage Profile & Verification
                </Button>
              </div>
            </Card>
            
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Your Profile</h3>
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
              </div>
              <Button className="mt-6" onClick={() => router.push('/coordinator-dashboard/profile')}>
                Edit Business Profile
              </Button>
            </Card>
          </div>
        )}

        {activeTab === 'settings' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Coordinator Settings</h3>
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
                <p className="text-white capitalize">Coordinator</p>
              </div>
              <Button className="mt-4">Edit Profile</Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function CoordinatorDashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-400"></div>
      </div>
    }>
      <CoordinatorDashboardContent />
    </Suspense>
  );
}
