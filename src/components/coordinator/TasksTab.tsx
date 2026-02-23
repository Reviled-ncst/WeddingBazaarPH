'use client';

import { useState, useEffect } from 'react';
import { ClipboardList, Plus, Edit2, Trash2, Calendar, CheckCircle2, Circle, X, Flag } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { coordinatorApi } from '@/lib/api';

interface Client {
  id: number;
  couple_name: string;
}

interface Event {
  id: number;
  title: string;
}

interface Task {
  id: number;
  event_id?: number;
  event_title?: string;
  client_id?: number;
  client_name?: string;
  title: string;
  description?: string;
  due_date?: string;
  priority: 'low' | 'medium' | 'high';
  is_completed: boolean;
  completed_at?: string;
  created_at: string;
}

interface TaskCounts {
  total: number;
  completed: number;
  pending: number;
}

interface TaskFormData {
  title: string;
  event_id: string;
  client_id: string;
  description: string;
  due_date: string;
  priority: string;
}

const initialFormData: TaskFormData = {
  title: '',
  event_id: '',
  client_id: '',
  description: '',
  due_date: '',
  priority: 'medium',
};

export function TasksTab() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [counts, setCounts] = useState<TaskCounts>({ total: 0, completed: 0, pending: 0 });
  const [clients, setClients] = useState<Client[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState<TaskFormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  useEffect(() => {
    Promise.all([fetchTasks(), fetchClients(), fetchEvents()]);
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await coordinatorApi.listTasks();
      if (response.success && response.data) {
        setTasks(response.data as Task[]);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const responseData = response as any;
        if (responseData.counts) {
          setCounts(responseData.counts);
        }
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await coordinatorApi.listClients();
      if (response.success && response.data) {
        setClients(response.data as Client[]);
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await coordinatorApi.listEvents();
      if (response.success && response.data) {
        setEvents(response.data as Event[]);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    }
  };

  const handleOpenModal = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        title: task.title,
        event_id: task.event_id?.toString() || '',
        client_id: task.client_id?.toString() || '',
        description: task.description || '',
        due_date: task.due_date || '',
        priority: task.priority,
      });
    } else {
      setEditingTask(null);
      setFormData(initialFormData);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTask(null);
    setFormData(initialFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setSaving(true);
    try {
      const data = {
        ...formData,
        event_id: formData.event_id ? parseInt(formData.event_id) : undefined,
        client_id: formData.client_id ? parseInt(formData.client_id) : undefined,
      };

      if (editingTask) {
        const response = await coordinatorApi.updateTask(editingTask.id, data);
        if (response.success) {
          fetchTasks();
          handleCloseModal();
        }
      } else {
        const response = await coordinatorApi.createTask(data);
        if (response.success) {
          fetchTasks();
          handleCloseModal();
        }
      }
    } catch (error) {
      console.error('Failed to save task:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleComplete = async (task: Task) => {
    try {
      const response = await coordinatorApi.updateTask(task.id, {
        is_completed: !task.is_completed,
      });
      if (response.success) {
        fetchTasks();
      }
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const response = await coordinatorApi.deleteTask(id);
      if (response.success) {
        fetchTasks();
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="default" className="bg-red-500/20 text-red-400 border-red-500/30">High</Badge>;
      case 'medium':
        return <Badge variant="default" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Medium</Badge>;
      case 'low':
        return <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">Low</Badge>;
      default:
        return <Badge variant="default">{priority}</Badge>;
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'pending') return !task.is_completed;
    if (filter === 'completed') return task.is_completed;
    return true;
  });

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
        <h3 className="text-lg font-semibold text-white">Tasks</h3>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-white">{counts.total}</p>
          <p className="text-sm text-gray-400">Total</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-yellow-400">{counts.pending}</p>
          <p className="text-sm text-gray-400">Pending</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{counts.completed}</p>
          <p className="text-sm text-gray-400">Completed</p>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        {(['all', 'pending', 'completed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                : 'bg-dark-800 text-gray-400 border border-dark-700 hover:text-white'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {filteredTasks.length > 0 ? (
        <div className="space-y-2">
          {filteredTasks.map((task) => (
            <Card key={task.id} className={`p-4 ${task.is_completed ? 'opacity-60' : ''}`}>
              <div className="flex items-start gap-3">
                <button
                  onClick={() => handleToggleComplete(task)}
                  className={`mt-0.5 transition-colors ${
                    task.is_completed ? 'text-green-400' : 'text-gray-500 hover:text-pink-400'
                  }`}
                >
                  {task.is_completed ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className={`text-white font-medium ${task.is_completed ? 'line-through' : ''}`}>
                      {task.title}
                    </h4>
                    {getPriorityBadge(task.priority)}
                  </div>

                  {task.description && (
                    <p className="text-sm text-gray-400 mt-1">{task.description}</p>
                  )}

                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                    {task.due_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Due: {formatDate(task.due_date)}
                      </span>
                    )}
                    {task.event_title && (
                      <span>Event: {task.event_title}</span>
                    )}
                    {task.client_name && (
                      <span>Client: {task.client_name}</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-1">
                  <button
                    onClick={() => handleOpenModal(task)}
                    className="p-2 text-gray-400 hover:text-pink-400 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-6">
          <div className="text-center py-12 text-gray-400">
            <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No {filter !== 'all' ? filter : ''} tasks</p>
            <p className="text-sm mt-2">Create tasks for your events</p>
          </div>
        </Card>
      )}

      {/* Add/Edit Task Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-900 rounded-xl border border-dark-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-dark-700">
              <h3 className="text-lg font-semibold text-white">
                {editingTask ? 'Edit Task' : 'Add New Task'}
              </h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Task Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:border-pink-500"
                  placeholder="e.g., Confirm venue booking"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Event</label>
                  <select
                    value={formData.event_id}
                    onChange={(e) => setFormData({ ...formData, event_id: e.target.value })}
                    className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:border-pink-500"
                  >
                    <option value="">No event</option>
                    {events.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Client</label>
                  <select
                    value={formData.client_id}
                    onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                    className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:border-pink-500"
                  >
                    <option value="">No client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.couple_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:border-pink-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:border-pink-500 resize-none"
                  rows={3}
                  placeholder="Task details..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={handleCloseModal}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={saving}>
                  {saving ? 'Saving...' : editingTask ? 'Update' : 'Add Task'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
