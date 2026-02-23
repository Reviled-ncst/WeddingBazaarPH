'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { adminApi } from '@/lib/api';
import {
  Users,
  Search,
  Mail,
  Phone,
  CheckCircle,
  Ban,
  Eye,
  Download,
  UserPlus,
  Clock,
  ChevronLeft,
  ChevronRight,
  Shield,
  AlertTriangle
} from 'lucide-react';

interface User {
  id: number;
  email: string;
  name: string;
  role: 'individual' | 'vendor' | 'coordinator' | 'admin';
  phone?: string;
  avatar?: string;
  email_verified: boolean;
  status: 'active' | 'suspended' | 'banned';
  suspended_at?: string;
  suspended_reason?: string;
  created_at: string;
  updated_at: string;
  booking_count: number;
  vendor?: {
    business_name: string;
    verification_status: string;
    rating: number;
    review_count: number;
  };
  coordinator?: {
    business_name: string;
    verification_status: string;
    rating: number;
    review_count: number;
  };
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<{ byRole: Record<string, number>; byStatus: Record<string, number> }>({ byRole: {}, byStatus: {} });
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await adminApi.getUsers({
        role: roleFilter !== 'all' ? roleFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchTerm || undefined,
        page: currentPage,
        limit: 20
      }) as any;
      if (response?.success) {
        setUsers(response.users || []);
        setTotalPages(response.pagination?.totalPages || 1);
        setTotal(response.pagination?.total || 0);
        setStats(response.stats || { byRole: {}, byStatus: {} });
      } else {
        setUsers([]);
        setTotalPages(1);
        setTotal(0);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setUsers([]);
      setTotalPages(1);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [roleFilter, statusFilter, searchTerm, currentPage]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter]);

  const handleUserAction = async (userId: number, action: 'suspend' | 'activate' | 'ban') => {
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;
    
    setActionLoading(userId);
    try {
      const response = await adminApi.updateUser(userId, action);
      if (response.success) {
        fetchUsers();
      }
    } catch (err) {
      console.error(`Failed to ${action} user:`, err);
    } finally {
      setActionLoading(null);
    }
  };

  const getRoleBadge = (role: User['role']) => {
    const styles = {
      admin: 'bg-red-500/20 text-red-400 border-red-500/30',
      vendor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      coordinator: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      individual: 'bg-green-500/20 text-green-400 border-green-500/30',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${styles[role]}`}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-500/20 text-green-400',
      suspended: 'bg-yellow-500/20 text-yellow-400',
      banned: 'bg-red-500/20 text-red-400',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-dark-700 text-dark-400'}`}>
        {(status || 'active').charAt(0).toUpperCase() + (status || 'active').slice(1)}
      </span>
    );
  };

  if (isLoading && users.length === 0) {
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
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-dark-400 mt-1">
            {total} users total • {stats.byRole?.vendor || 0} vendors • {stats.byRole?.coordinator || 0} coordinators
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button className="gap-2">
            <UserPlus className="w-4 h-4" />
            Add User
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Users className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.byStatus?.active || 0}</p>
              <p className="text-xs text-dark-400">Active Users</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Shield className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.byRole?.vendor || 0}</p>
              <p className="text-xs text-dark-400">Vendors</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.byStatus?.suspended || 0}</p>
              <p className="text-xs text-dark-400">Suspended</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <Ban className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.byStatus?.banned || 0}</p>
              <p className="text-xs text-dark-400">Banned</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-500" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-pink-400/20 focus:border-pink-400"
            />
          </div>
          
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2.5 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-400/20"
          >
            <option value="all">All Roles</option>
            <option value="individual">Individuals</option>
            <option value="vendor">Vendors</option>
            <option value="coordinator">Coordinators</option>
          </select>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-400/20"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="banned">Banned</option>
          </select>
        </div>
      </Card>

      {/* Users Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-800/50 border-b border-dark-700">
              <tr>
                <th className="text-left py-4 px-4 text-xs font-medium text-dark-400 uppercase tracking-wider">User</th>
                <th className="text-left py-4 px-4 text-xs font-medium text-dark-400 uppercase tracking-wider">Contact</th>
                <th className="text-left py-4 px-4 text-xs font-medium text-dark-400 uppercase tracking-wider">Role</th>
                <th className="text-left py-4 px-4 text-xs font-medium text-dark-400 uppercase tracking-wider">Status</th>
                <th className="text-left py-4 px-4 text-xs font-medium text-dark-400 uppercase tracking-wider">Joined</th>
                <th className="text-right py-4 px-4 text-xs font-medium text-dark-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-dark-800/30 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-medium">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{user.name}</p>
                        {user.vendor && (
                          <p className="text-xs text-purple-400">{user.vendor.business_name}</p>
                        )}
                        {user.coordinator && (
                          <p className="text-xs text-blue-400">{user.coordinator.business_name}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-sm text-dark-300">
                        <Mail className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[160px]">{user.email}</span>
                        {user.email_verified && <CheckCircle className="w-3 h-3 text-green-400" />}
                      </div>
                      {user.phone && (
                        <div className="flex items-center gap-1.5 text-sm text-dark-400">
                          <Phone className="w-3.5 h-3.5" />
                          <span>{user.phone}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="space-y-1">
                      {getRoleBadge(user.role)}
                      {(user.vendor || user.coordinator) && (
                        <span className={`block text-xs ${
                          (user.vendor?.verification_status || user.coordinator?.verification_status) === 'verified' 
                            ? 'text-green-400' 
                            : 'text-yellow-400'
                        }`}>
                          {user.vendor?.verification_status || user.coordinator?.verification_status}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    {getStatusBadge(user.status || 'active')}
                    {user.suspended_reason && (
                      <p className="text-xs text-dark-500 mt-1 truncate max-w-[120px]" title={user.suspended_reason}>
                        {user.suspended_reason}
                      </p>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1.5 text-sm text-dark-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(user.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="text-xs text-dark-500 mt-1">
                      {user.booking_count} bookings
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        className="p-2 rounded-lg hover:bg-dark-700 text-dark-400 hover:text-white transition-colors"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {user.status === 'active' ? (
                        <button 
                          className="p-2 rounded-lg hover:bg-dark-700 text-dark-400 hover:text-yellow-400 transition-colors disabled:opacity-50"
                          title="Suspend user"
                          onClick={() => handleUserAction(user.id, 'suspend')}
                          disabled={actionLoading === user.id}
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      ) : (
                        <button 
                          className="p-2 rounded-lg hover:bg-dark-700 text-dark-400 hover:text-green-400 transition-colors disabled:opacity-50"
                          title="Activate user"
                          onClick={() => handleUserAction(user.id, 'activate')}
                          disabled={actionLoading === user.id}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="p-8 text-center">
              <Users className="w-12 h-12 text-dark-600 mx-auto mb-3" />
              <p className="text-dark-400">No users found</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-dark-800">
            <p className="text-sm text-dark-400">
              Page {currentPage} of {totalPages} ({total} users)
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
