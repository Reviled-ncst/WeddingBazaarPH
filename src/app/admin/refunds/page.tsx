'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, Button } from '@/components/ui'
import { RotateCcw, Check, X, Clock, AlertTriangle, User, Calendar, CreditCard, RefreshCw, Search } from 'lucide-react'

interface RefundRequest {
  id: number
  booking_id: number
  user_id: number
  reason: string | null
  status: 'pending' | 'approved' | 'rejected'
  admin_notes: string | null
  created_at: string
  processed_at: string | null
  // Joined data
  user_name?: string
  user_email?: string
  service_name?: string
  vendor_name?: string
  amount?: number
  payment_id?: string
  event_date?: string
}

export default function AdminRefundsPage() {
  const [requests, setRequests] = useState<RefundRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [processingId, setProcessingId] = useState<number | null>(null)
  const [adminNotes, setAdminNotes] = useState<{ [key: number]: string }>({})
  const [searchQuery, setSearchQuery] = useState('')

  const fetchRefunds = useCallback(async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('adminToken')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/payments/refund.php?status=${filter === 'all' ? '' : filter}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )
      
      if (!response.ok) throw new Error('Failed to fetch refunds')
      
      const data = await response.json()
      setRequests(data.requests || [])
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
    setProcessingId(requestId)
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/refund.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action,
          request_id: requestId,
          admin_notes: adminNotes[requestId] || ''
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || `Failed to ${action} refund`)
      }
      
      // Refresh the list
      fetchRefunds()
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} refund`)
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">
            <Clock className="w-3 h-3" /> Pending
          </span>
        )
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
            <Check className="w-3 h-3" /> Approved
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs">
            <X className="w-3 h-3" /> Rejected
          </span>
        )
      default:
        return null
    }
  }

  const filteredRequests = requests.filter(req => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      req.user_name?.toLowerCase().includes(query) ||
      req.user_email?.toLowerCase().includes(query) ||
      req.vendor_name?.toLowerCase().includes(query) ||
      req.service_name?.toLowerCase().includes(query)
    )
  })

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    totalAmount: requests
      .filter(r => r.status === 'approved')
      .reduce((sum, r) => sum + (r.amount || 0), 0)
  }

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
              <h1 className="text-2xl font-bold text-white">Refund Requests</h1>
              <p className="text-gray-400">Manage customer refund requests</p>
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
          <Card className="p-4 bg-dark-800 border-dark-700">
            <p className="text-yellow-400 text-sm">Pending</p>
            <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
          </Card>
          <Card className="p-4 bg-dark-800 border-dark-700">
            <p className="text-green-400 text-sm">Approved</p>
            <p className="text-2xl font-bold text-green-400">{stats.approved}</p>
          </Card>
          <Card className="p-4 bg-dark-800 border-dark-700">
            <p className="text-red-400 text-sm">Rejected</p>
            <p className="text-2xl font-bold text-red-400">{stats.rejected}</p>
          </Card>
          <Card className="p-4 bg-dark-800 border-dark-700">
            <p className="text-pink-400 text-sm">Total Refunded</p>
            <p className="text-2xl font-bold text-pink-400">₱{stats.totalAmount.toLocaleString()}</p>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex gap-2">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
              <Button
                key={status}
                variant={filter === status ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setFilter(status)}
                className={filter === status ? 'bg-pink-500 hover:bg-pink-600' : ''}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search by user, vendor, or service..."
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
              {filter === 'pending' 
                ? 'No pending refund requests at this time' 
                : 'No refund requests match your current filters'}
            </p>
          </Card>
        ) : (
          /* Requests List */
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <Card key={request.id} className="p-6 bg-dark-800 border-dark-700">
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
                        <span>Requested: {new Date(request.created_at).toLocaleDateString()}</span>
                      </div>
                      {request.event_date && (
                        <div className="flex items-center gap-2 text-gray-400">
                          <Calendar className="w-4 h-4" />
                          <span>Event: {new Date(request.event_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    {request.reason && (
                      <div className="p-3 bg-dark-900 rounded-lg">
                        <p className="text-sm text-gray-500 mb-1">Customer Reason:</p>
                        <p className="text-white">{request.reason}</p>
                      </div>
                    )}

                    {request.admin_notes && request.status !== 'pending' && (
                      <div className="p-3 bg-dark-900 rounded-lg border-l-2 border-pink-500">
                        <p className="text-sm text-gray-500 mb-1">Admin Notes:</p>
                        <p className="text-white">{request.admin_notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {request.status === 'pending' && (
                    <div className="lg:w-80 space-y-4">
                      <textarea
                        placeholder="Add notes (optional)..."
                        value={adminNotes[request.id] || ''}
                        onChange={(e) => setAdminNotes(prev => ({ ...prev, [request.id]: e.target.value }))}
                        className="w-full p-3 bg-dark-900 border border-dark-700 rounded-lg text-white placeholder-gray-500 resize-none"
                        rows={2}
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
                              Approve
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
