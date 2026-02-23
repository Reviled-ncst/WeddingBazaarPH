'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { adminApi } from '@/lib/api';
import {
  Search,
  Download,
  Shield,
  CheckCircle,
  XCircle,
  Lock,
  Unlock,
  MapPin,
  Clock,
  Monitor,
  Globe,
  Ban,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface LoginAttempt {
  id: number;
  user_id?: number;
  email: string;
  user_name?: string;
  status: 'success' | 'failed' | 'blocked';
  failure_reason?: string;
  ip_address: string;
  location?: string;
  device?: string;
  browser?: string;
  created_at: string;
}

interface AccountLockout {
  id: number;
  user_id?: number;
  email: string;
  user_name?: string;
  reason: string;
  failed_attempts: number;
  locked_until: string;
  ip_address: string;
  created_at: string;
}

export default function LoginSecurityPage() {
  const [attempts, setAttempts] = useState<LoginAttempt[]>([]);
  const [lockouts, setLockouts] = useState<AccountLockout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'attempts' | 'lockouts'>('attempts');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<{ success: number; failed: number; blocked: number }>({ success: 0, failed: 0, blocked: 0 });
  const [unlockingId, setUnlockingId] = useState<number | null>(null);

  const fetchAttempts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await adminApi.getLoginAttempts({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchTerm || undefined,
        page: currentPage,
        limit: 20
      }) as any;
      // API wrapper returns {success, data} where data contains the actual response
      const data = response?.data || response;
      if (data?.success) {
        setAttempts(data.attempts || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setStats(data.stats || { success: 0, failed: 0, blocked: 0 });
      } else {
        setAttempts([]);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('Failed to fetch login attempts:', err);
      setAttempts([]);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, searchTerm, currentPage]);

  const fetchLockouts = useCallback(async () => {
    try {
      const response = await adminApi.getAccountLockouts({ active_only: true }) as any;
      // API wrapper returns {success, data} where data contains the actual response
      const data = response?.data || response;
      if (data?.success) {
        setLockouts(data.lockouts || []);
      } else {
        setLockouts([]);
      }
    } catch (err) {
      console.error('Failed to fetch lockouts:', err);
      setLockouts([]);
    }
  }, []);

  useEffect(() => {
    fetchAttempts();
    fetchLockouts();
  }, [fetchAttempts, fetchLockouts]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const getStatusBadge = (status: LoginAttempt['status']) => {
    const styles = {
      success: { bg: 'bg-green-500/20', text: 'text-green-400', icon: CheckCircle },
      failed: { bg: 'bg-red-500/20', text: 'text-red-400', icon: XCircle },
      blocked: { bg: 'bg-orange-500/20', text: 'text-orange-400', icon: Ban },
    };
    const style = styles[status];
    const Icon = style.icon;
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text} flex items-center gap-1 w-fit`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const unlockAccount = async (lockoutId: number) => {
    if (!confirm('Are you sure you want to unlock this account?')) return;
    setUnlockingId(lockoutId);
    try {
      const response = await adminApi.unlockAccount(lockoutId);
      if (response.success) {
        fetchLockouts();
      }
    } catch (err) {
      console.error('Failed to unlock account:', err);
    } finally {
      setUnlockingId(null);
    }
  };

  if (isLoading && attempts.length === 0) {
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
          <h1 className="text-2xl font-bold text-white">Login Security</h1>
          <p className="text-dark-400 mt-1">Monitor login attempts and manage account lockouts</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export Report
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.success}</p>
              <p className="text-xs text-dark-400">Successful Logins</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <XCircle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.failed}</p>
              <p className="text-xs text-dark-400">Failed Attempts</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <Ban className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.blocked}</p>
              <p className="text-xs text-dark-400">Blocked Attempts</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <Lock className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{lockouts.length}</p>
              <p className="text-xs text-dark-400">Locked Accounts</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-dark-800">
        <button
          onClick={() => setActiveTab('attempts')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'attempts'
              ? 'border-pink-400 text-pink-400'
              : 'border-transparent text-dark-400 hover:text-white'
          }`}
        >
          Login Attempts
        </button>
        <button
          onClick={() => setActiveTab('lockouts')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'lockouts'
              ? 'border-pink-400 text-pink-400'
              : 'border-transparent text-dark-400 hover:text-white'
          }`}
        >
          Account Lockouts
          {lockouts.length > 0 && (
            <span className="bg-yellow-500/20 text-yellow-400 text-xs px-1.5 py-0.5 rounded-full">
              {lockouts.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'attempts' && (
        <>
          {/* Filters */}
          <Card className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-500" />
                <input
                  type="text"
                  placeholder="Search by email, IP, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-pink-400/20 focus:border-pink-400"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-400/20"
              >
                <option value="all">All Status</option>
                <option value="success">Successful</option>
                <option value="failed">Failed</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
          </Card>

          {/* Login Attempts Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-dark-800/50 border-b border-dark-700">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-medium text-dark-400 uppercase">User / Email</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-dark-400 uppercase">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-dark-400 uppercase">IP / Location</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-dark-400 uppercase">Device</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-dark-400 uppercase">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-800">
                  {attempts.map((attempt) => (
                    <tr key={attempt.id} className="hover:bg-dark-800/30 transition-colors">
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-sm text-white">{attempt.user_name || 'Unknown User'}</p>
                          <p className="text-xs text-dark-400">{attempt.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          {getStatusBadge(attempt.status)}
                          {attempt.failure_reason && (
                            <p className="text-xs text-dark-500">{attempt.failure_reason}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-sm text-dark-300">
                          <Globe className="w-3.5 h-3.5 text-dark-500" />
                          {attempt.ip_address}
                        </div>
                        {attempt.location && (
                          <div className="flex items-center gap-1.5 text-xs text-dark-500 mt-1">
                            <MapPin className="w-3 h-3" />
                            {attempt.location}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-sm text-dark-300">
                          <Monitor className="w-3.5 h-3.5 text-dark-500" />
                          {attempt.device}
                        </div>
                        <p className="text-xs text-dark-500 mt-1">{attempt.browser}</p>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-sm text-dark-400">
                          <Clock className="w-3.5 h-3.5" />
                          {attempt.created_at}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {attempts.length === 0 && (
                <div className="p-8 text-center">
                  <Shield className="w-12 h-12 text-dark-600 mx-auto mb-3" />
                  <p className="text-dark-400">No login attempts found</p>
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
        </>
      )}

      {activeTab === 'lockouts' && (
        <Card className="overflow-hidden">
          {lockouts.length > 0 ? (
            <div className="divide-y divide-dark-800">
              {lockouts.map((lockout) => (
                <div key={lockout.id} className="flex items-center gap-4 p-4 hover:bg-dark-800/30 transition-colors">
                  <div className="p-3 bg-yellow-500/10 rounded-xl">
                    <Lock className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-white">{lockout.user_name || lockout.email}</p>
                      <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
                        {lockout.failed_attempts} failed attempts
                      </span>
                    </div>
                    <p className="text-sm text-dark-400 mt-1">{lockout.reason}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-dark-500">
                      <span className="flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        IP: {lockout.ip_address}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Locked until: {lockout.locked_until}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => unlockAccount(lockout.id)}
                    disabled={unlockingId === lockout.id}
                    className="gap-2"
                  >
                    <Unlock className="w-4 h-4" />
                    {unlockingId === lockout.id ? 'Unlocking...' : 'Unlock'}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Shield className="w-12 h-12 text-green-500/50 mx-auto mb-3" />
              <p className="text-dark-400">No accounts are currently locked</p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
