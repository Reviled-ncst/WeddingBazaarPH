'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { adminApi } from '@/lib/api';
import {
  MapPin,
  Search,
  Download,
  Globe,
  Clock,
  Activity,
  MapPinned,
  Monitor,
  Smartphone,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface LocationLog {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  user_role: 'individual' | 'vendor' | 'coordinator' | 'admin';
  action: string;
  ip_address: string;
  city: string;
  region: string;
  country: string;
  coordinates?: { lat: number; lng: number };
  device: string;
  browser: string;
  created_at: string;
}

const actions = [
  { value: 'login', label: 'Login' },
  { value: 'admin_login', label: 'Admin Login' },
  { value: 'profile_view', label: 'Profile View' },
  { value: 'booking', label: 'Booking' },
  { value: 'service_update', label: 'Service Update' },
  { value: 'search', label: 'Search' },
];

export default function LocationLogsPage() {
  const [logs, setLogs] = useState<LocationLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<{ totalLogs: number; uniqueCities: number; topRegions: Array<{ region: string; count: number }> }>({ totalLogs: 0, uniqueCities: 0, topRegions: [] });
  const [regions, setRegions] = useState<string[]>([]);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await adminApi.getLocationLogs({
        role: roleFilter !== 'all' ? roleFilter : undefined,
        action: actionFilter !== 'all' ? actionFilter : undefined,
        region: regionFilter !== 'all' ? regionFilter : undefined,
        search: searchTerm || undefined,
        page: currentPage,
        limit: 20
      }) as any;
      if (response.success) {
        setLogs(response.logs);
        setTotalPages(response.pagination.totalPages);
        setStats(response.stats);
        setRegions(response.regions || []);
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [roleFilter, actionFilter, regionFilter, searchTerm, currentPage]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, actionFilter, regionFilter]);

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      individual: 'bg-blue-500/20 text-blue-400',
      vendor: 'bg-purple-500/20 text-purple-400',
      coordinator: 'bg-pink-500/20 text-pink-400',
      admin: 'bg-red-500/20 text-red-400',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs ${styles[role] || 'bg-dark-600 text-dark-400'}`}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  const getDeviceIcon = (device: string) => {
    if (device.toLowerCase().includes('phone') || device.toLowerCase().includes('android') || device.toLowerCase().includes('iphone')) {
      return <Smartphone className="w-4 h-4 text-dark-500" />;
    }
    return <Monitor className="w-4 h-4 text-dark-500" />;
  };

  const getActionLabel = (action: string) => {
    const found = actions.find(a => a.value === action);
    return found ? found.label : action.replace('_', ' ');
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
          <h1 className="text-2xl font-bold text-white">Location Logs</h1>
          <p className="text-dark-400 mt-1">Track user location access and activity</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export Data
        </Button>
      </div>

      {/* Stats & Map Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Placeholder */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Activity Map</h2>
            <span className="text-xs text-dark-400">Last 24 hours</span>
          </div>
          <div className="aspect-[16/9] bg-dark-800 rounded-lg relative overflow-hidden flex items-center justify-center">
            <div className="text-center">
              <Globe className="w-16 h-16 text-dark-600 mx-auto mb-3" />
              <p className="text-dark-400 text-sm">Interactive map placeholder</p>
              <p className="text-dark-500 text-xs mt-1">Integration with Google Maps or Mapbox</p>
            </div>
            
            {/* Simulated pins */}
            <div className="absolute top-[30%] left-[40%] animate-pulse">
              <div className="w-3 h-3 bg-pink-500 rounded-full shadow-lg shadow-pink-500/50"></div>
            </div>
            <div className="absolute top-[35%] left-[45%] animate-pulse delay-100">
              <div className="w-3 h-3 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50"></div>
            </div>
            <div className="absolute top-[40%] left-[42%] animate-pulse delay-200">
              <div className="w-2 h-2 bg-purple-500 rounded-full shadow-lg shadow-purple-500/50"></div>
            </div>
            <div className="absolute top-[50%] left-[35%] animate-pulse delay-300">
              <div className="w-2 h-2 bg-green-500 rounded-full shadow-lg shadow-green-500/50"></div>
            </div>
          </div>
        </Card>

        {/* Top Locations */}
        <Card className="p-6">
          <h2 className="font-semibold text-white mb-4">Top Regions</h2>
          <div className="space-y-3">
            {stats.topRegions.map((item, index) => (
              <div key={item.region} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index === 0 ? 'bg-pink-500/20 text-pink-400' :
                  index === 1 ? 'bg-blue-500/20 text-blue-400' :
                  'bg-dark-700 text-dark-400'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white">{item.region}</p>
                  <div className="w-full bg-dark-700 rounded-full h-1.5 mt-1">
                    <div 
                      className="bg-pink-500 h-1.5 rounded-full"
                      style={{ width: `${(item.count / stats.totalLogs) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-sm text-dark-400">{item.count}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-6 pt-4 border-t border-dark-700">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-xl font-bold text-white">{stats.totalLogs}</p>
                <p className="text-xs text-dark-400">Total Accesses</p>
              </div>
              <div>
                <p className="text-xl font-bold text-white">{stats.uniqueCities}</p>
                <p className="text-xs text-dark-400">Unique Cities</p>
              </div>
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
              placeholder="Search by user, city, or IP..."
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
            <option value="admin">Admins</option>
          </select>
          
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-4 py-2.5 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-400/20"
          >
            <option value="all">All Actions</option>
            {actions.map(action => (
              <option key={action.value} value={action.value}>{action.label}</option>
            ))}
          </select>
          
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="px-4 py-2.5 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-400/20"
          >
            <option value="all">All Regions</option>
            {regions.map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Location Logs Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-800/50 border-b border-dark-700">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-medium text-dark-400 uppercase">User</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-dark-400 uppercase">Action</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-dark-400 uppercase">Location</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-dark-400 uppercase">IP / Device</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-dark-400 uppercase">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-dark-800/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="text-sm text-white">{log.user_name}</p>
                        <p className="text-xs text-dark-500">{log.user_email}</p>
                      </div>
                      {getRoleBadge(log.user_role)}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-pink-400" />
                      <span className="text-sm text-dark-300 capitalize">{getActionLabel(log.action)}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <MapPinned className="w-4 h-4 text-dark-500" />
                      <div>
                        <p className="text-sm text-white">{log.city}</p>
                        <p className="text-xs text-dark-500">{log.region}, {log.country}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2 text-sm text-dark-400">
                      <Globe className="w-3.5 h-3.5" />
                      {log.ip_address}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-dark-500 mt-1">
                      {getDeviceIcon(log.device)}
                      {log.device} / {log.browser}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2 text-sm text-dark-400">
                      <Clock className="w-3.5 h-3.5" />
                      {log.created_at}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {logs.length === 0 && (
          <div className="p-8 text-center">
            <MapPin className="w-12 h-12 text-dark-500 mx-auto mb-3" />
            <p className="text-dark-400">No location logs found</p>
          </div>
        )}

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
