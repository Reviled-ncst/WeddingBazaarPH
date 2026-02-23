'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, Phone, Mail, MapPin, Calendar, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { coordinatorApi } from '@/lib/api';

interface Client {
  id: number;
  couple_name: string;
  partner1_name?: string;
  partner2_name?: string;
  email?: string;
  phone?: string;
  wedding_date?: string;
  venue_name?: string;
  budget?: number;
  notes?: string;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
}

interface ClientFormData {
  couple_name: string;
  partner1_name: string;
  partner2_name: string;
  email: string;
  phone: string;
  wedding_date: string;
  venue_name: string;
  budget: string;
  notes: string;
  status: string;
}

const initialFormData: ClientFormData = {
  couple_name: '',
  partner1_name: '',
  partner2_name: '',
  email: '',
  phone: '',
  wedding_date: '',
  venue_name: '',
  budget: '',
  notes: '',
  status: 'active',
};

export function ClientsTab() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<ClientFormData>(initialFormData);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const response = await coordinatorApi.listClients();
      if (response.success && response.data) {
        setClients(response.data as Client[]);
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        couple_name: client.couple_name,
        partner1_name: client.partner1_name || '',
        partner2_name: client.partner2_name || '',
        email: client.email || '',
        phone: client.phone || '',
        wedding_date: client.wedding_date || '',
        venue_name: client.venue_name || '',
        budget: client.budget?.toString() || '',
        notes: client.notes || '',
        status: client.status,
      });
    } else {
      setEditingClient(null);
      setFormData(initialFormData);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingClient(null);
    setFormData(initialFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.couple_name.trim()) return;

    setSaving(true);
    try {
      const data = {
        ...formData,
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
      };

      if (editingClient) {
        const response = await coordinatorApi.updateClient(editingClient.id, data);
        if (response.success) {
          fetchClients();
          handleCloseModal();
        }
      } else {
        const response = await coordinatorApi.createClient(data);
        if (response.success) {
          fetchClients();
          handleCloseModal();
        }
      }
    } catch (error) {
      console.error('Failed to save client:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this client?')) return;

    try {
      const response = await coordinatorApi.deleteClient(id);
      if (response.success) {
        setClients((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete client:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'completed':
        return <Badge variant="default">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="default">Cancelled</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-400"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">My Clients</h3>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Client
        </Button>
      </div>

      {clients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clients.map((client) => (
            <Card key={client.id} className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="text-white font-semibold">{client.couple_name}</h4>
                  {getStatusBadge(client.status)}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleOpenModal(client)}
                    className="p-2 text-gray-400 hover:text-pink-400 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(client.id)}
                    className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-400">
                {client.wedding_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Wedding: {formatDate(client.wedding_date)}</span>
                  </div>
                )}
                {client.venue_name && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{client.venue_name}</span>
                  </div>
                )}
                {client.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span>{client.email}</span>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>{client.phone}</span>
                  </div>
                )}
                {client.budget && (
                  <p className="text-pink-400 font-medium">
                    Budget: {formatCurrency(client.budget)}
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-6">
          <div className="text-center py-12 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No clients yet</p>
            <p className="text-sm mt-2">Add the couples you&apos;re working with</p>
          </div>
        </Card>
      )}

      {/* Add/Edit Client Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-900 rounded-xl border border-dark-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-dark-700">
              <h3 className="text-lg font-semibold text-white">
                {editingClient ? 'Edit Client' : 'Add New Client'}
              </h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Couple Name *</label>
                <input
                  type="text"
                  value={formData.couple_name}
                  onChange={(e) => setFormData({ ...formData, couple_name: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:border-pink-500"
                  placeholder="e.g., John & Jane Doe"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Partner 1</label>
                  <input
                    type="text"
                    value={formData.partner1_name}
                    onChange={(e) => setFormData({ ...formData, partner1_name: e.target.value })}
                    className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Partner 2</label>
                  <input
                    type="text"
                    value={formData.partner2_name}
                    onChange={(e) => setFormData({ ...formData, partner2_name: e.target.value })}
                    className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Wedding Date</label>
                  <input
                    type="date"
                    value={formData.wedding_date}
                    onChange={(e) => setFormData({ ...formData, wedding_date: e.target.value })}
                    className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Budget</label>
                  <input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:border-pink-500"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Venue</label>
                <input
                  type="text"
                  value={formData.venue_name}
                  onChange={(e) => setFormData({ ...formData, venue_name: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:border-pink-500"
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:border-pink-500 resize-none"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={handleCloseModal}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={saving}>
                  {saving ? 'Saving...' : editingClient ? 'Update' : 'Add Client'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
