'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { adminApi } from '@/lib/api';
import {
  Activity,
  Search,
  Download,
  LogIn,
  LogOut,
  Edit,
  Plus,
  ShoppingCart,
  CreditCard,
  MapPin,
  Shield,
  AlertTriangle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface ActivityLog {
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

const actionIcons: Record<string, { icon: typeof Activity; color: string; bg: string }> = {
  login: { icon: LogIn, color: 'text-green-400', bg: 'bg-green-500/10' },
  logout: { icon: LogOut, color: 'text-gray-400', bg: 'bg-gray-500/10' },
  login_failed: { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
  profile_update: { icon: Edit, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  service_create: { icon: Plus, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  service_update: { icon: Edit, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  booking_create: { icon: ShoppingCart, color: 'text-pink-400', bg: 'bg-pink-500/10' },
  payment_complete: { icon: CreditCard, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  verification_submit: { icon: Shield, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  user_suspend: { icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/10' },
  user_activate: { icon: Shield, color: 'text-green-400', bg: 'bg-green-500/10' },
  user_ban: { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
  location_access: { icon: MapPin, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  default: { icon: Activity, color: 'text-dark-400', bg: 'bg-dark-700' },
};

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [actionTypes, setActionTypes] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await adminApi.getActivityLogs({
        action: actionFilter !== 'all' ? actionFilter : undefined,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        search: searchTerm || undefined,
        page: currentPage,
        limit: 20
      }) as any;
      if (response?.success) {
        setLogs(response.logs || []);
        setTotalPages(response.pagination?.totalPages || 1);
        setTotal(response.pagination?.total || 0);
        if (response.filters?.actionTypes) {
          setActionTypes(response.filters.actionTypes);
        }
      } else {
        setLogs([]);
        setTotalPages(1);
        setTotal(0);
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
      setLogs([]);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, [actionFilter, roleFilter, searchTerm, currentPage]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, actionFilter, roleFilter]);

  const getActionInfo = (action: string) => {
    return actionIcons[action] || actionIcons.default;
  };

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      admin: 'bg-red-500/20 text-red-400',
      vendor: 'bg-purple-500/20 text-purple-400',
      coordinator: 'bg-blue-500/20 text-blue-400',
      individual: 'bg-green-500/20 text-green-400',
    };
    return (
      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${styles[role] || 'bg-dark-700 text-dark-400'}`}>
        {role}
      </span>
    );
  };

  if (isLoading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Activity Logs</h1>
          <p className="text-dark-400 mt-1">Monitor all user activities across the platform ({total} total)</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export Logs
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-500" />
            <input
              type="text"
              placeholder="Search by user, email, description, or IP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-pink-400/20 focus:border-pink-400"
            />
          </div>
          
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-4 py-2.5 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-400/20"
          >
            <option value="all">All Actions</option>
            {actionTypes.map(action => (
              <option key={action} value={action}>{action.replace(/_/g, ' ')}</option>
            ))}
          </select>
          
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2.5 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-400/20"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="vendor">Vendor</option>
            <option value="coordinator">Coordinator</option>
            <option value="individual">Individual</option>
          </select>
        </div>
      </Card>

      {/* Activity Log List */}
      <Card className="overflow-hidden">
        <div className="divide-y divide-dark-800">
          {logs.map((log) => {
            const actionInfo = getActionInfo(log.action);
            const Icon = actionInfo.icon;
            return (
              <div key={log.id} className="flex items-start gap-4 p-4 hover:bg-dark-800/30 transition-colors">
                <div className={`p-2.5 rounded-lg ${actionInfo.bg} flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${actionInfo.color}`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-white">{log.user_name}</span>
                    {getRoleBadge(log.user_role)}
                  </div>
                  <p className="text-sm text-dark-300 mt-1">{log.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-dark-500 flex-wrap">
                    <span>{new Date(log.created_at).toLocaleString()}</span>
                    <span>IP: {log.ip_address}</span>
                    {log.location && <span>{log.location}</span>}
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-dark-500">{log.action.replace(/_/g, ' ')}</p>
                  {log.entity_type && (
                    <p className="text-xs text-dark-600 mt-1">
                      {log.entity_type} #{log.entity_id}
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          {logs.length === 0 && (
            <div className="p-8 text-center">
              <Activity className="w-12 h-12 text-dark-600 mx-auto mb-3" />
              <p className="text-dark-400">No activity logs found</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-dark-800">
            <p className="text-sm text-dark-400">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="px-3 py-1 text-sm text-dark-400">
                {currentPage} / {totalPages}
              </span>
              <Button 
                variant="outline" 
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
