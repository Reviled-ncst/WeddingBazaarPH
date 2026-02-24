'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, Button } from '@/components/ui'
import { RotateCcw, Check, X, Clock, AlertTriangle, User, Calendar, CreditCard, RefreshCw, Search, ArrowRight, MessageSquare, Gavel } from 'lucide-react'

type RefundStatus = 'pending_vendor' | 'pending_admin' | 'vendor_rejected' | 'appealed' | 'approved' | 'rejected' | 'processed'

interface RefundRequest {
  id: number
  booking_id: number
  user_id: number
  vendor_id: number
  amount: number
  reason: string | null
  status: RefundStatus
  vendor_notes: string | null
  vendor_responded_at: string | null
  appeal_reason: string | null
  appealed_at: string | null
  admin_notes: string | null
  processed_at: string | null
  paymongo_refund_id: string | null
  created_at: string
  // Joined data
  user_name?: string
  user_email?: string
  service_name?: string
  vendor_name?: string
  total_price?: number
  payment_id?: string
  event_date?: string
}

const statusConfig: Record<RefundStatus, { label: string; color: string; bgColor: string; icon: typeof Clock }> = {
  pending_vendor: { label: 'Awaiting Vendor', color: 'text-blue-400', bgColor: 'bg-blue-500/20', icon: Clock },
  pending_admin: { label: 'Ready for Review', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', icon: Clock },
  vendor_rejected: { label: 'Vendor Rejected', color: 'text-orange-400', bgColor: 'bg-orange-500/20', icon: X },
  appealed: { label: 'Customer Appealed', color: 'text-purple-400', bgColor: 'bg-purple-500/20', icon: Gavel },
  approved: { label: 'Approved', color: 'text-green-400', bgColor: 'bg-green-500/20', icon: Check },
  rejected: { label: 'Rejected', color: 'text-red-400', bgColor: 'bg-red-500/20', icon: X },
  processed: { label: 'Processed', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', icon: Check },
}

export default function AdminRefundsPage() {
  const [requests, setRequests] = useState<RefundRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'actionable' | 'pending_admin' | 'appealed' | 'approved' | 'rejected' | 'processed'>('actionable')
  const [processingId, setProcessingId] = useState<number | null>(null)
  const [adminNotes, setAdminNotes] = useState<{ [key: number]: string }>({})
  const [searchQuery, setSearchQuery] = useState('')

  const fetchRefunds = useCallback(async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('adminToken')
      let url = `${process.env.NEXT_PUBLIC_API_URL}/payments/refund.php`
      if (filter !== 'all' && filter !== 'actionable') {
        url += `?status=${filter}`
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) throw new Error('Failed to fetch refunds')
      
      const data = await response.json()
      let results = data.requests || []
      
      // Filter actionable requests (pending_admin or appealed)
      if (filter === 'actionable') {
        results = results.filter((r: RefundRequest) => r.status === 'pending_admin' || r.status === 'appealed')
      }
      
      setRequests(results)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load refunds')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    fetchRefunds()
  }, [fetchRefunds])

  const handleProcess = async (requestId: number, action: 'approve' | 'reject') => {
    const notes = adminNotes[requestId] || ''
    if (action === 'reject' && !notes.trim()) {
      setError('Please provide a reason for rejection')
      return
    }
    
    setProcessingId(requestId)
    setError('')
    
    try {
      const token = localStorage.getItem('adminToken')
      // Get admin ID from token if stored, or use a placeholder
      const adminData = localStorage.getItem('adminUser')
      const adminId = adminData ? JSON.parse(adminData).id : 1
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/refund.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action,
          refund_id: requestId,
          admin_id: adminId,
          notes
        })
      })
      
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || `Failed to ${action} refund`)
      }
      
      // Clear admin notes for this request
      setAdminNotes(prev => {
        const newNotes = { ...prev }
        delete newNotes[requestId]
        return newNotes
      })
      
      // Refresh the list
      fetchRefunds()
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} refund`)
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusBadge = (status: RefundStatus) => {
    const config = statusConfig[status]
    if (!config) return null
    const Icon = config.icon
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 ${config.bgColor} ${config.color} rounded-full text-xs`}>
        <Icon className="w-3 h-3" /> {config.label}
      </span>
    )
  }

  const filteredRequests = requests.filter(req => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      req.user_name?.toLowerCase().includes(query) ||
      req.user_email?.toLowerCase().includes(query) ||
      req.vendor_name?.toLowerCase().includes(query) ||
      req.service_name?.toLowerCase().includes(query) ||
      req.id.toString().includes(query)
    )
  })

  const stats = {
    total: requests.length,
    actionable: requests.filter(r => r.status === 'pending_admin' || r.status === 'appealed').length,
    pendingVendor: requests.filter(r => r.status === 'pending_vendor').length,
    approved: requests.filter(r => r.status === 'approved' || r.status === 'processed').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    totalRefunded: requests
      .filter(r => r.status === 'approved' || r.status === 'processed')
      .reduce((sum, r) => sum + (r.amount || 0), 0)
  }

  const canProcess = (status: RefundStatus) => status === 'pending_admin' || status === 'appealed'

  return (
    <div className="min-h-screen bg-dark-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl">
              <RotateCcw className="w-8 h-8 text-orange-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Refund Management</h1>
              <p className="text-gray-400">Review and process customer refund requests</p>
            </div>
          </div>
          <Button onClick={fetchRefunds} variant="outline" className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card className="p-4 bg-dark-800 border-dark-700">
            <p className="text-gray-400 text-sm">Total Requests</p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </Card>
          <Card className="p-4 bg-dark-800 border-yellow-500/30">
            <p className="text-yellow-400 text-sm">Needs Your Action</p>
            <p className="text-2xl font-bold text-yellow-400">{stats.actionable}</p>
          </Card>
          <Card className="p-4 bg-dark-800 border-blue-500/30">
            <p className="text-blue-400 text-sm">Awaiting Vendor</p>
            <p className="text-2xl font-bold text-blue-400">{stats.pendingVendor}</p>
          </Card>
          <Card className="p-4 bg-dark-800 border-green-500/30">
            <p className="text-green-400 text-sm">Approved/Processed</p>
            <p className="text-2xl font-bold text-green-400">{stats.approved}</p>
          </Card>
          <Card className="p-4 bg-dark-800 border-pink-500/30">
            <p className="text-pink-400 text-sm">Total Refunded</p>
            <p className="text-2xl font-bold text-pink-400">₱{stats.totalRefunded.toLocaleString()}</p>
          </Card>
        </div>

        {/* Filter explanation */}
        <Card className="p-4 bg-dark-800/50 border-dark-700 mb-6">
          <div className="flex items-start gap-3">
            <ArrowRight className="w-5 h-5 text-pink-400 mt-0.5" />
            <div className="text-sm">
              <p className="text-white font-medium mb-1">Refund Workflow</p>
              <p className="text-gray-400">
                1. Customer requests refund → 2. Vendor accepts/rejects → 3. If vendor accepts OR customer appeals → 4. Admin processes refund
              </p>
              <p className="text-gray-500 text-xs mt-1">
                You can only process refunds that are &quot;Ready for Review&quot; (vendor accepted) or &quot;Customer Appealed&quot; (vendor rejected but customer appealed)
              </p>
            </div>
          </div>
        </Card>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex gap-2 flex-wrap">
            {([
              { key: 'actionable', label: 'Needs Action' },
              { key: 'all', label: 'All' },
              { key: 'pending_admin', label: 'Ready for Review' },
              { key: 'appealed', label: 'Appeals' },
              { key: 'approved', label: 'Approved' },
              { key: 'rejected', label: 'Rejected' },
              { key: 'processed', label: 'Processed' },
            ] as const).map(({ key, label }) => (
              <Button
                key={key}
                variant={filter === key ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setFilter(key)}
                className={filter === key ? 'bg-pink-500 hover:bg-pink-600' : ''}
              >
                {label}
                {key === 'actionable' && stats.actionable > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-full text-xs">
                    {stats.actionable}
                  </span>
                )}
              </Button>
            ))}
          </div>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search by user, vendor, service, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-gray-500"
            />
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="p-4 mb-6 bg-red-500/20 border-red-500/30">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <p className="text-red-400">{error}</p>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setError('')}
                className="ml-auto text-red-400 hover:text-red-300"
              >
                Dismiss
              </Button>
            </div>
          </Card>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-pink-500" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <Card className="p-12 text-center bg-dark-800 border-dark-700">
            <RotateCcw className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Refund Requests</h3>
            <p className="text-gray-400">
              {filter === 'actionable' 
                ? 'No refund requests require your action at this time' 
                : 'No refund requests match your current filters'}
            </p>
          </Card>
        ) : (
          /* Requests List */
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <Card key={request.id} className={`p-6 bg-dark-800 border-dark-700 ${
                canProcess(request.status) ? 'border-l-4 border-l-yellow-500' : ''
              }`}>
                <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                  {/* Request Info */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-white">
                            Refund #{request.id}
                          </h3>
                          {getStatusBadge(request.status)}
                          {request.status === 'appealed' && (
                            <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs">
                              <Gavel className="w-3 h-3 inline mr-1" />
                              Appeal
                            </span>
                          )}
                        </div>
                        <p className="text-pink-400 text-xl font-bold">
                          ₱{Number(request.amount || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2 text-gray-400">
                        <User className="w-4 h-4" />
                        <span>{request.user_name || 'Unknown'}</span>
                        <span className="text-gray-600">({request.user_email})</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <CreditCard className="w-4 h-4" />
                        <span>{request.vendor_name || 'Unknown Vendor'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span>Requested: {new Date(request.created_at).toLocaleDateString('en-PH')}</span>
                      </div>
                      {request.event_date && (
                        <div className="flex items-center gap-2 text-gray-400">
                          <Calendar className="w-4 h-4" />
                          <span>Event: {new Date(request.event_date).toLocaleDateString('en-PH')}</span>
                        </div>
                      )}
                    </div>

                    {/* Customer's original reason */}
                    {request.reason && (
                      <div className="p-3 bg-dark-900 rounded-lg">
                        <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" /> Customer&apos;s Reason:
                        </p>
                        <p className="text-white">{request.reason}</p>
                      </div>
                    )}

                    {/* Vendor's response */}
                    {request.vendor_notes && (
                      <div className={`p-3 rounded-lg ${
                        request.status === 'pending_admin' 
                          ? 'bg-green-500/10 border border-green-500/30' 
                          : 'bg-orange-500/10 border border-orange-500/30'
                      }`}>
                        <p className="text-sm text-gray-500 mb-1">
                          Vendor {request.status === 'pending_admin' ? 'Approved' : 'Rejected'}:
                        </p>
                        <p className="text-white">{request.vendor_notes}</p>
                        {request.vendor_responded_at && (
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(request.vendor_responded_at).toLocaleDateString('en-PH')}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Customer's appeal */}
                    {request.appeal_reason && (
                      <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                        <p className="text-sm text-purple-400 mb-1 flex items-center gap-1">
                          <Gavel className="w-3 h-3" /> Customer&apos;s Appeal:
                        </p>
                        <p className="text-white">{request.appeal_reason}</p>
                        {request.appealed_at && (
                          <p className="text-xs text-gray-500 mt-1">
                            Appealed on {new Date(request.appealed_at).toLocaleDateString('en-PH')}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Admin's decision (for processed requests) */}
                    {request.admin_notes && (request.status === 'approved' || request.status === 'rejected' || request.status === 'processed') && (
                      <div className="p-3 bg-dark-900 rounded-lg border-l-2 border-pink-500">
                        <p className="text-sm text-gray-500 mb-1">Admin Decision:</p>
                        <p className="text-white">{request.admin_notes}</p>
                        {request.processed_at && (
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(request.processed_at).toLocaleDateString('en-PH')}
                          </p>
                        )}
                      </div>
                    )}

                    {/* PayMongo Refund ID if processed */}
                    {request.paymongo_refund_id && (
                      <div className="text-xs text-gray-500">
                        PayMongo Refund ID: {request.paymongo_refund_id}
                      </div>
                    )}
                  </div>

                  {/* Actions - Only show for actionable statuses */}
                  {canProcess(request.status) && (
                    <div className="lg:w-80 space-y-4">
                      <div className={`p-3 rounded-lg ${
                        request.status === 'appealed' 
                          ? 'bg-purple-500/10 border border-purple-500/30' 
                          : 'bg-yellow-500/10 border border-yellow-500/30'
                      }`}>
                        <p className="text-sm text-gray-400">
                          {request.status === 'appealed' 
                            ? 'Customer has appealed the vendor\'s rejection. Review both sides and make a final decision.'
                            : 'Vendor has accepted this refund request. Approve to process the refund via PayMongo.'}
                        </p>
                      </div>
                      <textarea
                        placeholder={request.status === 'appealed' 
                          ? "Admin decision notes (required for rejection)..." 
                          : "Add notes (optional)..."}
                        value={adminNotes[request.id] || ''}
                        onChange={(e) => setAdminNotes(prev => ({ ...prev, [request.id]: e.target.value }))}
                        className="w-full p-3 bg-dark-900 border border-dark-700 rounded-lg text-white placeholder-gray-500 resize-none"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleProcess(request.id, 'reject')}
                          disabled={processingId === request.id}
                          variant="outline"
                          className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10"
                        >
                          {processingId === request.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-red-400" />
                          ) : (
                            <>
                              <X className="w-4 h-4 mr-1" />
                              Reject
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => handleProcess(request.id, 'approve')}
                          disabled={processingId === request.id}
                          className="flex-1 bg-green-500 hover:bg-green-600"
                        >
                          {processingId === request.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white" />
                          ) : (
                            <>
                              <Check className="w-4 h-4 mr-1" />
                              Approve & Process
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
