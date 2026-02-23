'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { adminApi } from '@/lib/api';
import {
  Ticket,
  Search,
  MessageSquare,
  Clock,
  CheckCircle,
  User,
  Send,
  AlertCircle,
  Loader2,
  ArrowLeft
} from 'lucide-react';

interface SupportTicket {
  id: number;
  ticket_number: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: 'individual' | 'vendor' | 'coordinator';
  };
  subject: string;
  category: 'account' | 'booking' | 'payment' | 'technical' | 'other';
  status: 'open' | 'in_progress' | 'waiting_reply' | 'resolved' | 'closed';
  priority: 'low' | 'normal' | 'high';
  messages: {
    id: number;
    sender: 'user' | 'admin';
    sender_name: string;
    message: string;
    created_at: string;
  }[];
  created_at: string;
  updated_at: string;
}

const categoryLabels: Record<string, string> = {
  account: 'Account',
  booking: 'Booking',
  payment: 'Payment',
  technical: 'Technical',
  other: 'Other'
};

export default function SupportTicketsPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<{ byStatus: Record<string, number> }>({ byStatus: {} });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await adminApi.getTickets({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchTerm || undefined,
        page: currentPage,
        limit: 20
      }) as any;
      if (response?.success) {
        setTickets(response.tickets || []);
        setTotalPages(response.pagination?.totalPages || 1);
        setStats(response.stats || { byStatus: {} });
      } else {
        setTickets([]);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
      setTickets([]);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, searchTerm, currentPage]);

  const fetchTicketDetails = async (ticketId: number) => {
    try {
      const response = await adminApi.getTicket(ticketId) as any;
      if (response.success) {
        setSelectedTicket(response.ticket);
      }
    } catch (err) {
      console.error('Failed to fetch ticket details:', err);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const getStatusBadge = (status: SupportTicket['status']) => {
    const styles = {
      open: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Open' },
      in_progress: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'In Progress' },
      waiting_reply: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Waiting Reply' },
      resolved: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Resolved' },
      closed: { bg: 'bg-dark-600', text: 'text-dark-400', label: 'Closed' },
    };
    const style = styles[status];
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        {style.label}
      </span>
    );
  };

  const getPriorityBadge = (priority: SupportTicket['priority']) => {
    const styles = {
      low: 'text-dark-400',
      normal: 'text-blue-400',
      high: 'text-red-400',
    };
    return (
      <span className={`text-xs font-medium ${styles[priority]} capitalize`}>
        {priority}
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      individual: 'bg-blue-500/20 text-blue-400',
      vendor: 'bg-purple-500/20 text-purple-400',
      coordinator: 'bg-pink-500/20 text-pink-400',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs ${styles[role] || 'bg-dark-600 text-dark-400'}`}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;
    
    setActionLoading(true);
    try {
      const response = await adminApi.replyToTicket(selectedTicket.id, replyMessage);
      if (response.success) {
        setReplyMessage('');
        await fetchTicketDetails(selectedTicket.id);
        fetchTickets();
      }
    } catch (err) {
      console.error('Failed to send reply:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (id: number, newStatus: SupportTicket['status']) => {
    setActionLoading(true);
    try {
      const response = await adminApi.updateTicket(id, { status: newStatus });
      if (response.success) {
        if (selectedTicket?.id === id) {
          await fetchTicketDetails(id);
        }
        fetchTickets();
      }
    } catch (err) {
      console.error('Failed to update ticket:', err);
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading && tickets.length === 0) {
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
          <h1 className="text-2xl font-bold text-white">Support Tickets</h1>
          <p className="text-dark-400 mt-1">Manage user support requests</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.byStatus?.open || 0}</p>
              <p className="text-xs text-dark-400">Open</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Loader2 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.byStatus?.in_progress || 0}</p>
              <p className="text-xs text-dark-400">In Progress</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Clock className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.byStatus?.waiting_reply || 0}</p>
              <p className="text-xs text-dark-400">Waiting Reply</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tickets List */}
        <div className={`${selectedTicket ? 'hidden lg:block' : ''} lg:col-span-1 space-y-4`}>
          {/* Filters */}
          <Card className="p-4">
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-500" />
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-pink-400/20 focus:border-pink-400"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2.5 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-400/20"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="waiting_reply">Waiting Reply</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </Card>

          {/* Tickets */}
          <div className="space-y-2">
            {tickets.map((ticket) => (
              <Card 
                key={ticket.id}
                className={`p-4 cursor-pointer transition-colors ${
                  selectedTicket?.id === ticket.id 
                    ? 'ring-2 ring-pink-400 bg-dark-800/50' 
                    : 'hover:bg-dark-800/30'
                }`}
                onClick={() => fetchTicketDetails(ticket.id)}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-xs text-dark-500">{ticket.ticket_number}</span>
                  {getStatusBadge(ticket.status)}
                </div>
                <h3 className="font-medium text-white text-sm line-clamp-1 mb-1">{ticket.subject}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-dark-400">{ticket.user.name}</span>
                  {getRoleBadge(ticket.user.role)}
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-dark-500">
                  <span>{categoryLabels[ticket.category]}</span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    {ticket.messages.length}
                  </span>
                </div>
              </Card>
            ))}
            
            {tickets.length === 0 && (
              <Card className="p-8 text-center">
                <Ticket className="w-12 h-12 text-dark-500 mx-auto mb-3" />
                <p className="text-dark-400">No tickets found</p>
              </Card>
            )}
          </div>
        </div>

        {/* Ticket Detail */}
        <div className={`${selectedTicket ? '' : 'hidden lg:flex lg:items-center lg:justify-center'} lg:col-span-2`}>
          {selectedTicket ? (
            <Card className="flex flex-col h-[calc(100vh-16rem)]">
              {/* Ticket Header */}
              <div className="p-4 border-b border-dark-700">
                <div className="flex items-center gap-3 mb-3 lg:hidden">
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="text-dark-400 hover:text-white"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm text-dark-500">{selectedTicket.ticket_number}</span>
                </div>
                
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusBadge(selectedTicket.status)}
                      <span className="text-xs text-dark-500">{categoryLabels[selectedTicket.category]}</span>
                      {getPriorityBadge(selectedTicket.priority)}
                    </div>
                    <h2 className="text-lg font-semibold text-white">{selectedTicket.subject}</h2>
                    <div className="flex items-center gap-3 mt-2 text-sm text-dark-400">
                      <span className="flex items-center gap-1.5">
                        <User className="w-4 h-4" />
                        {selectedTicket.user.name}
                      </span>
                      {getRoleBadge(selectedTicket.user.role)}
                    </div>
                  </div>
                  
                  {selectedTicket.status !== 'resolved' && selectedTicket.status !== 'closed' && (
                    <div className="flex gap-2">
                      {selectedTicket.status === 'open' && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionLoading}
                          onClick={() => handleStatusChange(selectedTicket.id, 'in_progress')}
                        >
                          Start
                        </Button>
                      )}
                      <Button
                        size="sm"
                        disabled={actionLoading}
                        onClick={() => handleStatusChange(selectedTicket.id, 'resolved')}
                        className="gap-1"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Resolve
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedTicket.messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] rounded-lg p-3 ${
                      msg.sender === 'admin' 
                        ? 'bg-pink-500/20 text-pink-100' 
                        : 'bg-dark-800 text-dark-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-medium ${
                          msg.sender === 'admin' ? 'text-pink-400' : 'text-dark-400'
                        }`}>
                          {msg.sender_name}
                        </span>
                        <span className="text-xs text-dark-500">{msg.created_at}</span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply Input */}
              {selectedTicket.status !== 'resolved' && selectedTicket.status !== 'closed' && (
                <div className="p-4 border-t border-dark-700">
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <textarea
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        placeholder="Type your reply..."
                        rows={2}
                        className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-pink-400/20 focus:border-pink-400 resize-none"
                      />
                    </div>
                    <Button
                      onClick={handleSendReply}
                      disabled={!replyMessage.trim() || actionLoading}
                      className="self-end"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ) : (
            <Card className="p-8">
              <div className="text-center">
                <Ticket className="w-16 h-16 text-dark-500 mx-auto mb-4" />
                <p className="text-dark-400">Select a ticket to view details</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
