'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  ShieldCheck,
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  Download,
  ExternalLink,
  User,
  Building,
  Calendar,
  MessageSquare
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/wedding-bazaar-api';

interface VerificationRequest {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  business_name: string;
  type: 'vendor' | 'coordinator';
  category?: string;
  status: 'pending' | 'approved' | 'rejected';
  documents: {
    name: string;
    type: string;
    url: string;
    uploaded_at: string;
  }[];
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  notes?: string;
}

export default function VerificationsPage() {
  const [verifications, setVerifications] = useState<VerificationRequest[]>([]);
  const [filteredVerifications, setFilteredVerifications] = useState<VerificationRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedVerification, setSelectedVerification] = useState<VerificationRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch verifications from API
  useEffect(() => {
    const fetchVerifications = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_URL}/admin/verifications.php`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.verifications) {
            // Transform API data to match our interface
            const transformed = data.verifications.map((v: { 
              id: number;
              user_id: number;
              user_name: string;
              user_email: string;
              business_name: string;
              type: 'vendor' | 'coordinator';
              category?: string;
              status: string;
              documents: { name: string; type: string; url: string; uploadedAt?: string; uploaded_at?: string }[];
              submitted_at: string;
              reviewed_at?: string;
              notes?: string;
            }) => ({
              ...v,
              documents: (v.documents || []).map((d: { name: string; type: string; url: string; uploadedAt?: string; uploaded_at?: string }) => ({
                name: d.name || 'Document',
                type: d.type || 'unknown',
                url: d.url || '#',
                uploaded_at: d.uploadedAt || d.uploaded_at || v.submitted_at
              }))
            }));
            setVerifications(transformed);
          }
        }
      } catch (error) {
        console.error('Error fetching verifications:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchVerifications();
  }, []);

  useEffect(() => {
    let filtered = verifications;
    
    if (searchTerm) {
      filtered = filtered.filter(v => 
        v.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.user_email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(v => v.status === statusFilter);
    }
    
    if (typeFilter !== 'all') {
      filtered = filtered.filter(v => v.type === typeFilter);
    }
    
    setFilteredVerifications(filtered);
  }, [verifications, searchTerm, statusFilter, typeFilter]);

  const getStatusBadge = (status: VerificationRequest['status']) => {
    const styles = {
      pending: { bg: 'bg-yellow-500/20 border-yellow-500/30', text: 'text-yellow-400', icon: Clock },
      approved: { bg: 'bg-green-500/20 border-green-500/30', text: 'text-green-400', icon: CheckCircle },
      rejected: { bg: 'bg-red-500/20 border-red-500/30', text: 'text-red-400', icon: XCircle },
    };
    const style = styles[status];
    const Icon = style.icon;
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${style.bg} ${style.text} flex items-center gap-1.5 w-fit`}>
        <Icon className="w-3.5 h-3.5" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const handleApprove = async (id: number) => {
    if (!selectedVerification) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`${API_URL}/admin/update-verification.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          type: selectedVerification.type,
          action: 'approve',
          notes: reviewNotes
        })
      });
      
      if (res.ok) {
        setVerifications(prev => prev.map(v => 
          v.id === id && v.type === selectedVerification.type 
            ? { ...v, status: 'approved' as const, reviewed_at: new Date().toISOString(), reviewed_by: 'Admin User', notes: reviewNotes } 
            : v
        ));
        setSelectedVerification(null);
        setReviewNotes('');
      } else {
        const error = await res.json();
        alert('Error: ' + (error.error || 'Failed to approve'));
      }
    } catch (error) {
      console.error('Error approving:', error);
      alert('Failed to approve verification');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (id: number) => {
    if (!selectedVerification) return;
    if (!reviewNotes.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    setIsProcessing(true);
    try {
      const res = await fetch(`${API_URL}/admin/update-verification.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          type: selectedVerification.type,
          action: 'reject',
          notes: reviewNotes
        })
      });
      
      if (res.ok) {
        setVerifications(prev => prev.map(v => 
          v.id === id && v.type === selectedVerification.type 
            ? { ...v, status: 'rejected' as const, reviewed_at: new Date().toISOString(), reviewed_by: 'Admin User', notes: reviewNotes } 
            : v
        ));
        setSelectedVerification(null);
        setReviewNotes('');
      } else {
        const error = await res.json();
        alert('Error: ' + (error.error || 'Failed to reject'));
      }
    } catch (error) {
      console.error('Error rejecting:', error);
      alert('Failed to reject verification');
    } finally {
      setIsProcessing(false);
    }
  };

  const pendingCount = verifications.filter(v => v.status === 'pending').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Document Verifications</h1>
          <p className="text-dark-400 mt-1">Review and verify vendor & coordinator documents</p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 px-4 py-2 rounded-lg">
            <AlertCircle className="w-5 h-5 text-yellow-400" />
            <span className="text-yellow-400 font-medium">{pendingCount} pending review{pendingCount > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-500" />
            <input
              type="text"
              placeholder="Search by business name or email..."
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
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2.5 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-400/20"
          >
            <option value="all">All Types</option>
            <option value="vendor">Vendors</option>
            <option value="coordinator">Coordinators</option>
          </select>
        </div>
      </Card>

      {/* Verifications List */}
      <div className="space-y-4">
        {filteredVerifications.length === 0 ? (
          <Card className="p-12 text-center">
            <ShieldCheck className="w-12 h-12 text-dark-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Verification Requests</h3>
            <p className="text-dark-400">
              {verifications.length === 0 
                ? 'No vendors or coordinators have submitted documents for verification yet.'
                : 'No results match your current filters.'}
            </p>
          </Card>
        ) : (
          filteredVerifications.map((verification) => (
          <Card key={verification.id} className="p-5">
            <div className="flex flex-col lg:flex-row lg:items-start gap-4">
              {/* Business Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-dark-800 rounded-xl">
                    {verification.type === 'vendor' ? (
                      <Building className="w-6 h-6 text-purple-400" />
                    ) : (
                      <User className="w-6 h-6 text-blue-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-semibold text-white">{verification.business_name}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        verification.type === 'vendor' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {verification.type.charAt(0).toUpperCase() + verification.type.slice(1)}
                      </span>
                      {verification.category && (
                        <span className="px-2 py-0.5 rounded bg-dark-700 text-dark-300 text-xs">
                          {verification.category}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-dark-400 mt-1">{verification.user_email}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-dark-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Submitted: {verification.submitted_at}
                      </span>
                      {verification.reviewed_at && (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Reviewed: {verification.reviewed_at}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Documents */}
                <div className="mt-4 pl-14">
                  <p className="text-sm font-medium text-dark-300 mb-2">Submitted Documents ({verification.documents.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {verification.documents.map((doc, idx) => (
                      <button
                        key={idx}
                        className="flex items-center gap-2 px-3 py-2 bg-dark-800 hover:bg-dark-700 border border-dark-700 rounded-lg text-sm transition-colors"
                      >
                        <FileText className="w-4 h-4 text-pink-400" />
                        <span className="text-dark-300">{doc.name}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-dark-500" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Review Notes */}
                {verification.notes && (
                  <div className="mt-4 pl-14">
                    <div className="flex items-start gap-2 p-3 bg-dark-800/50 rounded-lg">
                      <MessageSquare className="w-4 h-4 text-dark-500 mt-0.5" />
                      <div>
                        <p className="text-xs text-dark-500 mb-1">Review notes by {verification.reviewed_by}</p>
                        <p className="text-sm text-dark-300">{verification.notes}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Status & Actions */}
              <div className="flex flex-row lg:flex-col items-center lg:items-end gap-3">
                {getStatusBadge(verification.status)}
                
                {verification.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedVerification(verification)}
                      className="gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      Review
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))
        )}
      </div>

      {/* Review Modal */}
      {selectedVerification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSelectedVerification(null)} />
          <div className="relative bg-dark-900 border border-dark-700 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-white mb-4">Review Verification</h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-dark-800 rounded-lg">
                <h3 className="font-medium text-white">{selectedVerification.business_name}</h3>
                <p className="text-sm text-dark-400">{selectedVerification.user_email}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-dark-300 mb-2">Documents to Review</p>
                <div className="space-y-2">
                  {selectedVerification.documents.map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-pink-400" />
                        <div>
                          <p className="text-sm text-white">{doc.name}</p>
                          <p className="text-xs text-dark-500">Uploaded: {doc.uploaded_at}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="gap-1">
                        <Eye className="w-4 h-4" />
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Review Notes</label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add notes about your review decision..."
                  rows={3}
                  className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-pink-400/20 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-dark-800">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSelectedVerification(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10"
                  onClick={() => handleReject(selectedVerification.id)}
                  disabled={isProcessing}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  {isProcessing ? 'Processing...' : 'Reject'}
                </Button>
                <Button
                  className="flex-1 bg-green-500 hover:bg-green-600"
                  onClick={() => handleApprove(selectedVerification.id)}
                  disabled={isProcessing}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {isProcessing ? 'Processing...' : 'Approve'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
