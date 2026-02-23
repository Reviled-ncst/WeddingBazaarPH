'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FileText, Plus, Edit, Trash2, Eye, EyeOff, Save, X, RefreshCw, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';

interface Page {
  id: number;
  slug: string;
  title: string;
  content: string;
  meta_title: string;
  meta_description: string;
  is_published: number;
  created_at: string;
  updated_at: string;
}

export default function CMSPagesPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    content: '',
    meta_title: '',
    meta_description: '',
    is_published: false
  });

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<Page[]>('/admin/pages/list.php');
      if (response.success && response.data) {
        setPages(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch pages:', error);
      setMessage({ type: 'error', text: 'Failed to load pages' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingPage(null);
    setFormData({
      slug: '',
      title: '',
      content: '',
      meta_title: '',
      meta_description: '',
      is_published: false
    });
  };

  const handleEdit = async (page: Page) => {
    try {
      const response = await api.get<Page>(`/admin/pages/get.php?id=${page.id}`);
      if (response.success && response.data) {
        setEditingPage(response.data);
        setFormData({
          slug: response.data.slug,
          title: response.data.title,
          content: response.data.content || '',
          meta_title: response.data.meta_title || '',
          meta_description: response.data.meta_description || '',
          is_published: response.data.is_published === 1
        });
        setIsCreating(false);
      }
    } catch (error) {
      console.error('Failed to fetch page:', error);
    }
  };

  const handleCancel = () => {
    setEditingPage(null);
    setIsCreating(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const endpoint = editingPage 
        ? '/admin/pages/update.php' 
        : '/admin/pages/create.php';
      
      const data = editingPage 
        ? { ...formData, id: editingPage.id, is_published: formData.is_published ? 1 : 0 }
        : { ...formData, is_published: formData.is_published ? 1 : 0 };

      const response = await api.post<Page>(endpoint, data);

      if (response.success) {
        setMessage({ type: 'success', text: response.message || 'Page saved successfully' });
        fetchPages();
        handleCancel();
      } else {
        setMessage({ type: 'error', text: response.error || 'Failed to save page' });
      }
    } catch (error) {
      console.error('Failed to save page:', error);
      setMessage({ type: 'error', text: 'Failed to save page' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSlugChange = (value: string) => {
    // Auto-generate slug from title
    const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    setFormData({ ...formData, slug });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-pink-400 animate-spin" />
      </div>
    );
  }

  // Show editor
  if (editingPage || isCreating) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {isCreating ? 'Create New Page' : `Edit: ${editingPage?.title}`}
            </h1>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Page
                </>
              )}
            </Button>
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Page Content</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => {
                      setFormData({ ...formData, title: e.target.value });
                      if (isCreating) handleSlugChange(e.target.value);
                    }}
                    className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="Page Title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Slug</label>
                  <div className="flex items-center gap-2">
                    <span className="text-dark-400">/</span>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                      className="flex-1 px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                      placeholder="page-url"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Content (HTML)</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={15}
                    className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="<h1>Page content...</h1>"
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Publishing</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-white">Published</span>
                  <button
                    onClick={() => setFormData({ ...formData, is_published: !formData.is_published })}
                    className={`relative w-12 h-6 rounded-full transition-colors ${formData.is_published ? 'bg-green-500' : 'bg-dark-700'}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.is_published ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold text-white mb-4">SEO</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Meta Title</label>
                  <input
                    type="text"
                    value={formData.meta_title}
                    onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                    className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="SEO Title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Meta Description</label>
                  <textarea
                    value={formData.meta_description}
                    onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="Brief description for search engines"
                  />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Show list
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Pages</h1>
          <p className="text-dark-400 mt-1">Manage static pages (About, Help, Privacy, etc.)</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          New Page
        </Button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {message.text}
        </div>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-700">
                <th className="text-left px-6 py-4 text-sm font-medium text-dark-400">Title</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-dark-400">Slug</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-dark-400">Status</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-dark-400">Updated</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-dark-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((page) => (
                <tr key={page.id} className="border-b border-dark-800 hover:bg-dark-800/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-dark-400" />
                      <span className="text-white font-medium">{page.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-dark-400">/{page.slug}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      page.is_published ? 'bg-green-500/20 text-green-400' : 'bg-dark-700 text-dark-400'
                    }`}>
                      {page.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-dark-400 text-sm">
                    {new Date(page.updated_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={`/${page.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-dark-700 rounded-lg text-dark-400 hover:text-white"
                        title="Preview"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => handleEdit(page)}
                        className="p-2 hover:bg-dark-700 rounded-lg text-dark-400 hover:text-white"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {pages.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-dark-400">
                    No pages yet. Click "New Page" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
