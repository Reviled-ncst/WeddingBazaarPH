'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { adminApi } from '@/lib/api';
import {
  Package,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Star,
  MapPin,
  Store,
  Calendar,
  TrendingUp,
  Flag,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface Service {
  id: number;
  vendor: {
    id: number;
    name: string;
    verified: boolean;
  };
  name: string;
  description: string;
  category: string;
  subcategory: string;
  price_range: string;
  location: string;
  status: 'active' | 'inactive' | 'pending' | 'flagged';
  is_featured: boolean;
  rating: number;
  review_count: number;
  booking_count: number;
  created_at: string;
}

const categories = [
  'Photography & Videography',
  'Catering',
  'Venues',
  'Flowers & Decor',
  'Entertainment',
  'Attire & Accessories',
  'Wedding Coordinators',
  'Hair & Makeup'
];

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<{ byStatus: Record<string, number>; featured: number }>({ byStatus: {}, featured: 0 });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchServices = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await adminApi.getServices({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        search: searchTerm || undefined,
        page: currentPage,
        limit: 20
      }) as any;
      const data = response?.data || response;
      if (data?.success !== false) {
        setServices(data.services || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setStats(data.stats || { byStatus: {}, featured: 0 });
      } else {
        setServices([]);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('Failed to fetch services:', err);
      setServices([]);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, categoryFilter, searchTerm, currentPage]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, categoryFilter]);

  const getStatusBadge = (status: Service['status']) => {
    const styles = {
      active: { bg: 'bg-green-500/20', text: 'text-green-400', icon: CheckCircle },
      inactive: { bg: 'bg-dark-600', text: 'text-dark-400', icon: XCircle },
      pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: Calendar },
      flagged: { bg: 'bg-red-500/20', text: 'text-red-400', icon: Flag },
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

  const toggleStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    setActionLoading(true);
    try {
      const response = await adminApi.updateServiceStatus(id, { status: newStatus });
      if (response.success) {
        fetchServices();
        if (selectedService?.id === id) {
          setSelectedService(null);
        }
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const toggleFeatured = async (id: number, currentFeatured: boolean) => {
    setActionLoading(true);
    try {
      const response = await adminApi.updateServiceStatus(id, { is_featured: !currentFeatured });
      if (response.success) {
        fetchServices();
      }
    } catch (err) {
      console.error('Failed to toggle featured:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const approveService = async (id: number) => {
    setActionLoading(true);
    try {
      const response = await adminApi.updateServiceStatus(id, { status: 'active' });
      if (response.success) {
        fetchServices();
      }
    } catch (err) {
      console.error('Failed to approve service:', err);
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading && services.length === 0) {
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
          <h1 className="text-2xl font-bold text-white">Services Management</h1>
          <p className="text-dark-400 mt-1">Manage all vendor services</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.byStatus?.active || 0}</p>
              <p className="text-xs text-dark-400">Active</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <Calendar className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.byStatus?.pending || 0}</p>
              <p className="text-xs text-dark-400">Pending Review</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <Flag className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.byStatus?.flagged || 0}</p>
              <p className="text-xs text-dark-400">Flagged</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-pink-500/10 rounded-lg">
              <Star className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.featured}</p>
              <p className="text-xs text-dark-400">Featured</p>
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
              placeholder="Search services or vendors..."
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
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
            <option value="flagged">Flagged</option>
          </select>
          
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2.5 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-400/20"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Services Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-800/50 border-b border-dark-700">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-medium text-dark-400 uppercase">Service</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-dark-400 uppercase">Category</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-dark-400 uppercase">Price</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-dark-400 uppercase">Stats</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-dark-400 uppercase">Status</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-dark-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800">
              {services.map((service) => (
                <tr key={service.id} className="hover:bg-dark-800/30 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-dark-700 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Package className="w-6 h-6 text-dark-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white truncate max-w-xs">{service.name}</p>
                          {service.is_featured && (
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Store className="w-3.5 h-3.5 text-dark-500" />
                          <span className="text-sm text-dark-400">{service.vendor.name}</span>
                          {service.vendor.verified && (
                            <CheckCircle className="w-3.5 h-3.5 text-blue-400" />
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-xs text-dark-500">
                          <MapPin className="w-3 h-3" />
                          {service.location}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div>
                      <p className="text-sm text-white">{service.category}</p>
                      <p className="text-xs text-dark-500">{service.subcategory}</p>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-sm text-dark-300">{service.price_range}</p>
                  </td>
                  <td className="py-4 px-4">
                    <div className="space-y-1">
                      {service.rating > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                          <span className="text-sm text-white">{service.rating}</span>
                          <span className="text-xs text-dark-500">({service.review_count})</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-xs text-dark-500">
                        <TrendingUp className="w-3 h-3" />
                        {service.booking_count} bookings
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    {getStatusBadge(service.status)}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-end gap-2">
                      {service.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => approveService(service.id)}
                          disabled={actionLoading}
                          className="gap-1"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </Button>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedService(service)}
                        className="gap-1"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleFeatured(service.id, service.is_featured)}
                        disabled={actionLoading}
                        className={service.is_featured ? 'text-yellow-400' : ''}
                      >
                        <Star className={`w-4 h-4 ${service.is_featured ? 'fill-yellow-400' : ''}`} />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleStatus(service.id, service.status)}
                        disabled={actionLoading}
                        className={`gap-1 ${
                          service.status === 'active' ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'
                        }`}
                      >
                        {service.status === 'active' ? (
                          <XCircle className="w-4 h-4" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {services.length === 0 && (
          <div className="p-8 text-center">
            <Package className="w-12 h-12 text-dark-500 mx-auto mb-3" />
            <p className="text-dark-400">No services found</p>
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

      {/* Service Detail Modal */}
      {selectedService && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-900 rounded-xl border border-dark-700 max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-dark-700">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusBadge(selectedService.status)}
                    {selectedService.is_featured && (
                      <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full text-xs flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400" />
                        Featured
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-semibold text-white">{selectedService.name}</h2>
                </div>
                <button
                  onClick={() => setSelectedService(null)}
                  className="text-dark-400 hover:text-white"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
              {/* Vendor Info */}
              <div className="p-4 bg-dark-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-dark-700 rounded-full flex items-center justify-center">
                    <Store className="w-6 h-6 text-dark-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-white">{selectedService.vendor.name}</p>
                      {selectedService.vendor.verified && (
                        <CheckCircle className="w-4 h-4 text-blue-400" />
                      )}
                    </div>
                    <p className="text-sm text-dark-400">Vendor ID: {selectedService.vendor.id}</p>
                  </div>
                </div>
              </div>
              
              {/* Description */}
              <div>
                <p className="text-xs text-dark-400 mb-2">Description</p>
                <p className="text-sm text-dark-200">{selectedService.description}</p>
              </div>
              
              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-dark-400 mb-1">Category</p>
                  <p className="text-dark-200">{selectedService.category}</p>
                </div>
                <div>
                  <p className="text-xs text-dark-400 mb-1">Subcategory</p>
                  <p className="text-dark-200">{selectedService.subcategory}</p>
                </div>
                <div>
                  <p className="text-xs text-dark-400 mb-1">Price Range</p>
                  <p className="text-dark-200">{selectedService.price_range}</p>
                </div>
                <div>
                  <p className="text-xs text-dark-400 mb-1">Location</p>
                  <p className="text-dark-200">{selectedService.location}</p>
                </div>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-dark-800 rounded-lg text-center">
                  <div className="flex items-center justify-center gap-1 text-yellow-400">
                    <Star className="w-4 h-4 fill-yellow-400" />
                    <span className="font-bold">{selectedService.rating || 'N/A'}</span>
                  </div>
                  <p className="text-xs text-dark-400 mt-1">Rating</p>
                </div>
                <div className="p-3 bg-dark-800 rounded-lg text-center">
                  <p className="font-bold text-white">{selectedService.review_count}</p>
                  <p className="text-xs text-dark-400 mt-1">Reviews</p>
                </div>
                <div className="p-3 bg-dark-800 rounded-lg text-center">
                  <p className="font-bold text-white">{selectedService.booking_count}</p>
                  <p className="text-xs text-dark-400 mt-1">Bookings</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-dark-700 flex justify-end gap-3">
              <Button
                variant="outline"
                disabled={actionLoading}
                onClick={() => toggleFeatured(selectedService.id, selectedService.is_featured)}
                className="gap-2"
              >
                <Star className={`w-4 h-4 ${selectedService.is_featured ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                {selectedService.is_featured ? 'Remove Featured' : 'Set as Featured'}
              </Button>
              <Button
                variant={selectedService.status === 'active' ? 'outline' : 'primary'}
                disabled={actionLoading}
                onClick={() => {
                  toggleStatus(selectedService.id, selectedService.status);
                  setSelectedService(null);
                }}
                className="gap-2"
              >
                {selectedService.status === 'active' ? (
                  <>
                    <XCircle className="w-4 h-4" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Activate
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
