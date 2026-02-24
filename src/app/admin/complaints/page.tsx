'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { adminApi } from '@/lib/api';
import {
  AlertTriangle,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Store,
  Calendar,
  AlertCircle,
  Eye,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface Complaint {
  id: number;
  complainant: {
    id: number;
    name: string;
    email: string;
    role: 'individual' | 'vendor' | 'coordinator';
  };
  subject: {
    id: number;
    name: string;
    role: 'vendor' | 'coordinator';
  };
  type: 'service_quality' | 'payment_issue' | 'no_show' | 'communication' | 'fraud' | 'other';
  title: string;
  description: string;
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: string;
  resolution?: string;
  created_at: string;
  updated_at: string;
}

const complaintTypes: Record<string, string> = {
  service_quality: 'Service Quality',
  payment_issue: 'Payment Issue',
  no_show: 'No Show',
  communication: 'Communication',
  fraud: 'Fraud',
  other: 'Other'
};

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [resolution, setResolution] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<{ byStatus: Record<string, number>; byPriority: Record<string, number> }>({ byStatus: {}, byPriority: {} });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchComplaints = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await adminApi.getComplaints({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        priority: priorityFilter !== 'all' ? priorityFilter : undefined,
        search: searchTerm || undefined,
        page: currentPage,
        limit: 20
      }) as any;
      const data = response?.data || response;
      if (data?.success !== false) {
        setComplaints(data.complaints || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setStats(data.stats || { byStatus: {}, byPriority: {} });
      } else {
        setComplaints([]);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('Failed to fetch complaints:', err);
      setComplaints([]);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, priorityFilter, searchTerm, currentPage]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, priorityFilter]);

  const getStatusBadge = (status: Complaint['status']) => {
    const styles = {
      pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: Clock },
      investigating: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: Eye },
      resolved: { bg: 'bg-green-500/20', text: 'text-green-400', icon: CheckCircle },
      dismissed: { bg: 'bg-dark-600', text: 'text-dark-400', icon: XCircle },
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

  const getPriorityBadge = (priority: Complaint['priority']) => {
    const styles = {
      low: 'bg-dark-600 text-dark-300',
      medium: 'bg-yellow-500/20 text-yellow-400',
      high: 'bg-orange-500/20 text-orange-400',
      urgent: 'bg-red-500/20 text-red-400',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[priority]}`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    );
  };

  const handleStatusChange = async (id: number, newStatus: Complaint['status']) => {
    setActionLoading(true);
    try {
      const response = await adminApi.updateComplaint(id, { status: newStatus });
      if (response.success) {
        fetchComplaints();
        if (selectedComplaint?.id === id) {
          setSelectedComplaint(null);
        }
      }
    } catch (err) {
      console.error('Failed to update complaint:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedComplaint || !resolution.trim()) return;
    
    setActionLoading(true);
    try {
      const response = await adminApi.updateComplaint(selectedComplaint.id, { 
        status: 'resolved', 
        resolution 
      });
      if (response.success) {
        setSelectedComplaint(null);
        setResolution('');
        fetchComplaints();
      }
    } catch (err) {
      console.error('Failed to resolve complaint:', err);
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading && complaints.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-400"></div>
      </div>
    );
  }

  const urgentCount = (stats.byPriority?.urgent || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Complaints Management</h1>
          <p className="text-dark-400 mt-1">Handle user complaints and disputes</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.byStatus?.pending || 0}</p>
              <p className="text-xs text-dark-400">Pending</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Eye className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.byStatus?.investigating || 0}</p>
              <p className="text-xs text-dark-400">Investigating</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{urgentCount}</p>
              <p className="text-xs text-dark-400">Urgent</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.byStatus?.resolved || 0}</p>
              <p className="text-xs text-dark-400">Resolved</p>
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
              placeholder="Search complaints..."
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
            <option value="pending">Pending</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
          
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-4 py-2.5 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-400/20"
          >
            <option value="all">All Priority</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </Card>

      {/* Complaints List */}
      <div className="space-y-4">
        {complaints.map((complaint) => (
          <Card key={complaint.id} className="p-4 hover:bg-dark-800/30 transition-colors">
            <div className="flex flex-col lg:flex-row lg:items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {getStatusBadge(complaint.status)}
                  {getPriorityBadge(complaint.priority)}
                  <span className="px-2 py-0.5 bg-dark-700 text-dark-300 rounded-full text-xs">
                    {complaintTypes[complaint.type]}
                  </span>
                </div>
                
                <h3 className="font-medium text-white mb-1">{complaint.title}</h3>
                <p className="text-sm text-dark-400 line-clamp-2">{complaint.description}</p>
                
                <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-dark-500">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    From: {complaint.complainant.name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Store className="w-3.5 h-3.5" />
                    Against: {complaint.subject.name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {complaint.created_at}
                  </span>
                </div>
                
                {complaint.resolution && (
                  <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <p className="text-xs text-green-400 font-medium mb-1">Resolution:</p>
                    <p className="text-sm text-green-300">{complaint.resolution}</p>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2 lg:flex-col lg:items-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedComplaint(complaint)}
                  className="gap-1"
                >
                  <Eye className="w-4 h-4" />
                  View
                </Button>
                
                {complaint.status === 'pending' && (
                  <Button
                    size="sm"
                    onClick={() => handleStatusChange(complaint.id, 'investigating')}
                    className="gap-1"
                  >
                    Investigate
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
        
        {complaints.length === 0 && (
          <Card className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-dark-500 mx-auto mb-3" />
            <p className="text-dark-400">No complaints found</p>
          </Card>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
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
        </Card>
      )}

      {/* Complaint Detail Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-900 rounded-xl border border-dark-700 max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-dark-700">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusBadge(selectedComplaint.status)}
                    {getPriorityBadge(selectedComplaint.priority)}
                  </div>
                  <h2 className="text-xl font-semibold text-white">{selectedComplaint.title}</h2>
                </div>
                <button
                  onClick={() => { setSelectedComplaint(null); setResolution(''); }}
                  className="text-dark-400 hover:text-white"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
              {/* Parties */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-dark-800 rounded-lg">
                  <p className="text-xs text-dark-400 mb-1">Complainant</p>
                  <p className="font-medium text-white">{selectedComplaint.complainant.name}</p>
                  <p className="text-sm text-dark-400">{selectedComplaint.complainant.email}</p>
                  <span className="mt-2 inline-block px-2 py-0.5 bg-dark-700 text-dark-300 rounded text-xs capitalize">
                    {selectedComplaint.complainant.role}
                  </span>
                </div>
                <div className="p-3 bg-dark-800 rounded-lg">
                  <p className="text-xs text-dark-400 mb-1">Subject</p>
                  <p className="font-medium text-white">{selectedComplaint.subject.name}</p>
                  <span className="mt-2 inline-block px-2 py-0.5 bg-dark-700 text-dark-300 rounded text-xs capitalize">
                    {selectedComplaint.subject.role}
                  </span>
                </div>
              </div>
              
              {/* Description */}
              <div>
                <p className="text-xs text-dark-400 mb-2">Description</p>
                <p className="text-sm text-dark-200">{selectedComplaint.description}</p>
              </div>
              
              {/* Type & Dates */}
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-dark-400 mb-1">Type</p>
                  <p className="text-dark-200">{complaintTypes[selectedComplaint.type]}</p>
                </div>
                <div>
                  <p className="text-xs text-dark-400 mb-1">Filed</p>
                  <p className="text-dark-200">{selectedComplaint.created_at}</p>
                </div>
                <div>
                  <p className="text-xs text-dark-400 mb-1">Last Updated</p>
                  <p className="text-dark-200">{selectedComplaint.updated_at}</p>
                </div>
              </div>
              
              {/* Resolution Input */}
              {selectedComplaint.status !== 'resolved' && selectedComplaint.status !== 'dismissed' && (
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Resolution Notes</label>
                  <textarea
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    placeholder="Enter your resolution or notes..."
                    rows={4}
                    className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-pink-400/20 focus:border-pink-400 resize-none"
                  />
                </div>
              )}
              
              {/* Existing Resolution */}
              {selectedComplaint.resolution && (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-sm font-medium text-green-400 mb-2">Resolution</p>
                  <p className="text-sm text-green-300">{selectedComplaint.resolution}</p>
                </div>
              )}
            </div>
            
            {/* Actions */}
            {selectedComplaint.status !== 'resolved' && selectedComplaint.status !== 'dismissed' && (
              <div className="p-6 border-t border-dark-700 flex justify-end gap-3">
                <Button
                  variant="outline"
                  disabled={actionLoading}
                  onClick={() => {
                    handleStatusChange(selectedComplaint.id, 'dismissed');
                  }}
                >
                  Dismiss
                </Button>
                <Button
                  onClick={handleResolve}
                  disabled={!resolution.trim() || actionLoading}
                  className="gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  {actionLoading ? 'Saving...' : 'Mark Resolved'}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
