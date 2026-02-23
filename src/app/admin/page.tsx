'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { adminApi } from '@/lib/api';
import {
  Users,
  Store,
  UserCheck,
  Calendar,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  Clock,
  DollarSign,
  Activity,
  Eye
} from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  activeVendors: number;
  pendingVerifications: number;
  totalBookings: number;
  totalRevenue: number;
  monthlyRevenue: number;
  openTickets: number;
  pendingComplaints: number;
  newUsersThisWeek: number;
  usersByRole: Record<string, number>;
}

interface ActivityItem {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  user_role: string;
  action: string;
  entity_type?: string;
  entity_id?: number;
  description: string;
  ip_address: string;
  location?: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const response = await adminApi.getStats() as any;
      if (response.success) {
        setStats(response.stats);
        setRecentActivity(response.recentActivity || []);
      } else {
        setError(response.message || 'Failed to load stats');
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const getStatCards = () => {
    if (!stats) return [];
    return [
      {
        title: 'Total Users',
        value: stats.totalUsers.toLocaleString(),
        change: `+${stats.newUsersThisWeek} this week`,
        changeType: 'positive',
        icon: Users,
        color: 'text-blue-400',
        bg: 'bg-blue-500/10',
      },
      {
        title: 'Active Vendors',
        value: stats.activeVendors.toLocaleString(),
        change: `${stats.usersByRole?.vendor || 0} total`,
        changeType: 'positive',
        icon: Store,
        color: 'text-green-400',
        bg: 'bg-green-500/10',
      },
      {
        title: 'Coordinators',
        value: (stats.usersByRole?.coordinator || 0).toLocaleString(),
        change: 'Active',
        changeType: 'positive',
        icon: UserCheck,
        color: 'text-purple-400',
        bg: 'bg-purple-500/10',
      },
      {
        title: 'Total Bookings',
        value: stats.totalBookings.toLocaleString(),
        change: 'All time',
        changeType: 'positive',
        icon: Calendar,
        color: 'text-pink-400',
        bg: 'bg-pink-500/10',
      },
      {
        title: 'Monthly Revenue',
        value: `?${(stats.monthlyRevenue / 1000).toFixed(0)}K`,
        change: `?${(stats.totalRevenue / 1000).toFixed(0)}K total`,
        changeType: 'positive',
        icon: DollarSign,
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10',
      },
      {
        title: 'Pending Verifications',
        value: stats.pendingVerifications.toString(),
        change: 'Needs attention',
        changeType: stats.pendingVerifications > 0 ? 'warning' : 'positive',
        icon: ShieldCheck,
        color: 'text-yellow-400',
        bg: 'bg-yellow-500/10',
      },
      {
        title: 'Open Complaints',
        value: stats.pendingComplaints.toString(),
        change: stats.pendingComplaints > 0 ? 'Review required' : 'All clear',
        changeType: stats.pendingComplaints > 0 ? 'warning' : 'positive',
        icon: AlertTriangle,
        color: 'text-orange-400',
        bg: 'bg-orange-500/10',
      },
      {
        title: 'Support Tickets',
        value: stats.openTickets.toString(),
        change: stats.openTickets > 0 ? 'Open' : 'All resolved',
        changeType: stats.openTickets > 0 ? 'warning' : 'positive',
        icon: Clock,
        color: 'text-red-400',
        bg: 'bg-red-500/10',
      },
    ];
  };

  const getActivityIcon = (action: string) => {
    if (action.includes('login')) return <Activity className="w-4 h-4 text-blue-400" />;
    if (action.includes('booking')) return <Calendar className="w-4 h-4 text-green-400" />;
    if (action.includes('verification')) return <ShieldCheck className="w-4 h-4 text-yellow-400" />;
    if (action.includes('complaint') || action.includes('suspend') || action.includes('ban')) 
      return <AlertTriangle className="w-4 h-4 text-red-400" />;
    if (action.includes('service')) return <Store className="w-4 h-4 text-purple-400" />;
    return <Activity className="w-4 h-4 text-dark-400" />;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400">{error}</p>
          <button 
            onClick={fetchStats}
            className="mt-4 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-dark-400 mt-1">Welcome back! Here&apos;s what&apos;s happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {getStatCards().map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-dark-400 text-sm">{stat.title}</p>
                  <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                  <div className="flex items-center gap-1 mt-2">
                    {stat.changeType === 'positive' ? (
                      <TrendingUp className="w-3 h-3 text-green-400" />
                    ) : (
                      <AlertTriangle className="w-3 h-3 text-yellow-400" />
                    )}
                    <span className={`text-xs ${
                      stat.changeType === 'positive' ? 'text-green-400' : 'text-yellow-400'
                    }`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Activity and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
            <a href="/admin/activity-logs" className="text-sm text-pink-400 hover:text-pink-300">View all</a>
          </div>
          <div className="space-y-4">
            {recentActivity.length === 0 ? (
              <p className="text-dark-400 text-center py-8">No recent activity</p>
            ) : (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-4 p-3 bg-dark-800/50 rounded-lg">
                  <div className="p-2 bg-dark-700 rounded-lg">
                    {getActivityIcon(activity.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{activity.description}</p>
                    <p className="text-xs text-dark-400">{activity.user_name}</p>
                  </div>
                  <span className="text-xs text-dark-500 whitespace-nowrap">{formatTimeAgo(activity.created_at)}</span>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <a href="/admin/verifications" className="w-full flex items-center gap-3 p-3 bg-dark-800 hover:bg-dark-700 rounded-lg transition-colors">
              <ShieldCheck className="w-5 h-5 text-yellow-400" />
              <span className="text-sm text-white">Review Verifications</span>
              <span className="ml-auto bg-yellow-500/20 text-yellow-400 text-xs px-2 py-0.5 rounded-full">
                {stats?.pendingVerifications || 0}
              </span>
            </a>
            <a href="/admin/complaints" className="w-full flex items-center gap-3 p-3 bg-dark-800 hover:bg-dark-700 rounded-lg transition-colors">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              <span className="text-sm text-white">Handle Complaints</span>
              <span className="ml-auto bg-orange-500/20 text-orange-400 text-xs px-2 py-0.5 rounded-full">
                {stats?.pendingComplaints || 0}
              </span>
            </a>
            <a href="/admin/support" className="w-full flex items-center gap-3 p-3 bg-dark-800 hover:bg-dark-700 rounded-lg transition-colors">
              <Clock className="w-5 h-5 text-red-400" />
              <span className="text-sm text-white">Support Tickets</span>
              <span className="ml-auto bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded-full">
                {stats?.openTickets || 0}
              </span>
            </a>
            <a href="/admin/activity-logs" className="w-full flex items-center gap-3 p-3 bg-dark-800 hover:bg-dark-700 rounded-lg transition-colors">
              <Eye className="w-5 h-5 text-blue-400" />
              <span className="text-sm text-white">View Activity Logs</span>
            </a>
          </div>
        </Card>
      </div>

      {/* Heatmap Placeholder */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">User Activity Heatmap</h2>
          <select className="bg-dark-800 border border-dark-700 rounded-lg px-3 py-1.5 text-sm text-white">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 90 days</option>
          </select>
        </div>
        <div className="h-48 bg-dark-800/50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <Activity className="w-12 h-12 text-dark-600 mx-auto mb-2" />
            <p className="text-dark-500 text-sm">Activity heatmap visualization</p>
            <p className="text-dark-600 text-xs mt-1">Shows user engagement intensity over time</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
