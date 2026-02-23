'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { adminApi } from '@/lib/api';
import {
  HelpCircle,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Book,
  FileText,
  ChevronDown,
  ChevronRight,
  GripVertical,
  XCircle
} from 'lucide-react';

interface HelpArticle {
  id: number;
  category: string;
  title: string;
  content: string;
  is_published: boolean;
  view_count: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

const categories = ['Getting Started', 'For Couples', 'For Vendors', 'For Coordinators', 'Payments', 'Account & Security'];

export default function HelpCenterPage() {
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [expandedCategories, setExpandedCategories] = useState<string[]>(categories);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<HelpArticle | null>(null);
  const [formData, setFormData] = useState({ category: '', title: '', content: '', is_published: false });
  const [stats, setStats] = useState<{ published: number; drafts: number; totalViews: number }>({ published: 0, drafts: 0, totalViews: 0 });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchArticles = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await adminApi.getHelpArticles({
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        search: searchTerm || undefined
      }) as any;
      if (response.success) {
        setArticles(response.articles);
        setStats(response.stats);
      }
    } catch (err) {
      console.error('Failed to fetch articles:', err);
    } finally {
      setIsLoading(false);
    }
  }, [categoryFilter, searchTerm]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const groupedArticles = categories.map(cat => ({
    category: cat,
    articles: articles.filter(a => a.category === cat)
  })).filter(g => g.articles.length > 0);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const openCreateModal = () => {
    setEditingArticle(null);
    setFormData({ category: categories[0], title: '', content: '', is_published: false });
    setIsModalOpen(true);
  };

  const openEditModal = (article: HelpArticle) => {
    setEditingArticle(article);
    setFormData({
      category: article.category,
      title: article.title,
      content: article.content,
      is_published: article.is_published
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) return;

    setActionLoading(true);
    try {
      if (editingArticle) {
        const response = await adminApi.updateHelpArticle(editingArticle.id, formData);
        if (response.success) {
          setIsModalOpen(false);
          fetchArticles();
        }
      } else {
        const response = await adminApi.createHelpArticle(formData);
        if (response.success) {
          setIsModalOpen(false);
          fetchArticles();
        }
      }
    } catch (err) {
      console.error('Failed to save article:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const togglePublish = async (id: number, currentPublished: boolean) => {
    try {
      const response = await adminApi.updateHelpArticle(id, { is_published: !currentPublished });
      if (response.success) {
        fetchArticles();
      }
    } catch (err) {
      console.error('Failed to toggle publish:', err);
    }
  };

  const deleteArticle = async (id: number) => {
    if (!confirm('Are you sure you want to delete this article?')) return;
    
    try {
      const response = await adminApi.deleteHelpArticle(id);
      if (response.success) {
        fetchArticles();
      }
    } catch (err) {
      console.error('Failed to delete article:', err);
    }
  };

  if (isLoading && articles.length === 0) {
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
          <h1 className="text-2xl font-bold text-white">Help Center</h1>
          <p className="text-dark-400 mt-1">Manage help articles and FAQs</p>
        </div>
        <Button onClick={openCreateModal} className="gap-2">
          <Plus className="w-4 h-4" />
          New Article
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <FileText className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.published}</p>
              <p className="text-xs text-dark-400">Published</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <Edit className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.drafts}</p>
              <p className="text-xs text-dark-400">Drafts</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Eye className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.totalViews.toLocaleString()}</p>
              <p className="text-xs text-dark-400">Total Views</p>
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
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-pink-400/20 focus:border-pink-400"
            />
          </div>
          
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

      {/* Articles by Category */}
      <div className="space-y-4">
        {groupedArticles.map(group => (
          <Card key={group.category} className="overflow-hidden">
            <button
              onClick={() => toggleCategory(group.category)}
              className="w-full flex items-center justify-between gap-4 p-4 hover:bg-dark-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Book className="w-5 h-5 text-pink-400" />
                <span className="font-medium text-white">{group.category}</span>
                <span className="px-2 py-0.5 bg-dark-700 text-dark-400 rounded-full text-xs">
                  {group.articles.length}
                </span>
              </div>
              {expandedCategories.includes(group.category) ? (
                <ChevronDown className="w-5 h-5 text-dark-400" />
              ) : (
                <ChevronRight className="w-5 h-5 text-dark-400" />
              )}
            </button>
            
            {expandedCategories.includes(group.category) && (
              <div className="border-t border-dark-700 divide-y divide-dark-800">
                {group.articles.map(article => (
                  <div key={article.id} className="flex items-center gap-4 p-4 hover:bg-dark-800/20 transition-colors">
                    <GripVertical className="w-4 h-4 text-dark-600 cursor-grab" />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-white truncate">{article.title}</h3>
                        {!article.is_published && (
                          <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs">
                            Draft
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-dark-500">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {article.view_count.toLocaleString()} views
                        </span>
                        <span>Updated: {article.updated_at}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => togglePublish(article.id, article.is_published)}
                        className={article.is_published ? 'text-green-400' : 'text-dark-400'}
                      >
                        {article.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(article)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteArticle(article.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
        
        {groupedArticles.length === 0 && (
          <Card className="p-8 text-center">
            <HelpCircle className="w-12 h-12 text-dark-500 mx-auto mb-3" />
            <p className="text-dark-400">No articles found</p>
          </Card>
        )}
      </div>

      {/* Article Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-900 rounded-xl border border-dark-700 max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-dark-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">
                  {editingArticle ? 'Edit Article' : 'New Article'}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-dark-400 hover:text-white"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-400/20"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Article title"
                  className="w-full px-4 py-2.5 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-pink-400/20"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">Content</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Write your article content here... (supports basic markdown)"
                  rows={10}
                  className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-pink-400/20 resize-none font-mono text-sm"
                />
              </div>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_published}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_published: e.target.checked }))}
                  className="w-4 h-4 rounded border-dark-600 bg-dark-800 text-pink-400 focus:ring-pink-400/20"
                />
                <span className="text-sm text-dark-300">Publish immediately</span>
              </label>
            </div>
            
            <div className="p-6 border-t border-dark-700 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={!formData.title.trim() || !formData.content.trim() || actionLoading}
              >
                {actionLoading ? 'Saving...' : (editingArticle ? 'Save Changes' : 'Create Article')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
