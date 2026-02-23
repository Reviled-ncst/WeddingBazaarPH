'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import {
  FolderTree,
  Plus,
  Search,
  Edit,
  Trash2,
  ChevronRight,
  ChevronDown,
  GripVertical,
  Eye,
  EyeOff,
  Save,
  X,
  Loader2
} from 'lucide-react';

interface Subcategory {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
  sort_order: number;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  is_active: boolean;
  sort_order: number;
  subcategories: Subcategory[];
  vendor_count: number;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [editingCategory, setEditingCategory] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSubcategoryModal, setShowSubcategoryModal] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await api.get<{ categories: Category[] }>('/admin/categories/list.php');
        if (response.data?.categories) {
          // Ensure vendor_count and subcategories exist
          const categoriesWithDefaults = response.data.categories.map(cat => ({
            ...cat,
            vendor_count: cat.vendor_count || 0,
            subcategories: cat.subcategories || [],
          }));
          setCategories(categoriesWithDefaults);
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const toggleExpand = (id: number) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleActive = (categoryId: number, subcategoryId?: number) => {
    setCategories(prev => prev.map(cat => {
      if (cat.id === categoryId) {
        if (subcategoryId !== undefined) {
          return {
            ...cat,
            subcategories: cat.subcategories.map(sub => 
              sub.id === subcategoryId ? { ...sub, is_active: !sub.is_active } : sub
            )
          };
        }
        return { ...cat, is_active: !cat.is_active };
      }
      return cat;
    }));
  };

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.subcategories.some(sub => sub.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Categories & Subcategories</h1>
          <p className="text-dark-400 mt-1">Manage service categories and subcategories</p>
        </div>
        <Button className="gap-2" onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4" />
          Add Category
        </Button>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-500" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-pink-400/20 focus:border-pink-400"
          />
        </div>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card className="p-8">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-pink-400 animate-spin" />
          </div>
        </Card>
      )}

      {/* Empty State */}
      {!loading && categories.length === 0 && (
        <Card className="p-8">
          <div className="text-center text-dark-400">
            <FolderTree className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No categories found.</p>
          </div>
        </Card>
      )}

      {/* Categories List */}
      {!loading && filteredCategories.length > 0 && (
      <Card className="divide-y divide-dark-800">
        {filteredCategories.map((category) => (
          <div key={category.id}>
            {/* Category Row */}
            <div className="flex items-center gap-4 p-4 hover:bg-dark-800/30 transition-colors">
              <button className="text-dark-500 hover:text-dark-400 cursor-grab">
                <GripVertical className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => toggleExpand(category.id)}
                className="p-1 rounded hover:bg-dark-700 text-dark-400"
              >
                {category.subcategories.length > 0 ? (
                  expandedCategories.has(category.id) ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )
                ) : (
                  <div className="w-5 h-5" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-pink-500/10 rounded-lg">
                    <FolderTree className="w-5 h-5 text-pink-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{category.name}</h3>
                    <p className="text-sm text-dark-400">{category.description}</p>
                  </div>
                </div>
              </div>

              <div className="hidden sm:block text-sm text-dark-400">
                {category.vendor_count} vendors
              </div>

              <div className="hidden sm:block text-sm text-dark-400">
                {category.subcategories.length} subcategories
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleActive(category.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    category.is_active 
                      ? 'text-green-400 hover:bg-green-500/10' 
                      : 'text-dark-500 hover:bg-dark-700'
                  }`}
                  title={category.is_active ? 'Active - Click to deactivate' : 'Inactive - Click to activate'}
                >
                  {category.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => setShowSubcategoryModal(category.id)}
                  className="p-2 rounded-lg hover:bg-dark-700 text-dark-400 hover:text-white transition-colors"
                  title="Add subcategory"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button 
                  className="p-2 rounded-lg hover:bg-dark-700 text-dark-400 hover:text-white transition-colors"
                  title="Edit category"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  className="p-2 rounded-lg hover:bg-dark-700 text-dark-400 hover:text-red-400 transition-colors"
                  title="Delete category"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Subcategories */}
            {expandedCategories.has(category.id) && category.subcategories.length > 0 && (
              <div className="bg-dark-900/50 border-l-2 border-pink-500/30 ml-14">
                {category.subcategories.map((sub) => (
                  <div key={sub.id} className="flex items-center gap-4 p-3 pl-6 hover:bg-dark-800/30 transition-colors">
                    <button className="text-dark-600 hover:text-dark-500 cursor-grab">
                      <GripVertical className="w-4 h-4" />
                    </button>
                    <div className="w-2 h-2 rounded-full bg-dark-600" />
                    <span className="flex-1 text-sm text-dark-300">{sub.name}</span>
                    <span className="text-xs text-dark-500">{sub.slug}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleActive(category.id, sub.id)}
                        className={`p-1.5 rounded transition-colors ${
                          sub.is_active 
                            ? 'text-green-400 hover:bg-green-500/10' 
                            : 'text-dark-500 hover:bg-dark-700'
                        }`}
                      >
                        {sub.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                      <button className="p-1.5 rounded hover:bg-dark-700 text-dark-400 hover:text-white transition-colors">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1.5 rounded hover:bg-dark-700 text-dark-400 hover:text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {filteredCategories.length === 0 && !loading && (
          <div className="p-8 text-center">
            <FolderTree className="w-12 h-12 text-dark-600 mx-auto mb-3" />
            <p className="text-dark-400">No categories match your search</p>
          </div>
        )}
      </Card>
      )}

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-dark-900 border border-dark-700 rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Add Category</h2>
              <button onClick={() => setShowAddModal(false)} className="text-dark-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1">Name</label>
                <input
                  type="text"
                  placeholder="e.g., Photography"
                  className="w-full px-4 py-2.5 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-pink-400/20 focus:border-pink-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1">Slug</label>
                <input
                  type="text"
                  placeholder="e.g., photography"
                  className="w-full px-4 py-2.5 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-pink-400/20 focus:border-pink-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1">Description</label>
                <textarea
                  placeholder="Brief description..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-pink-400/20 focus:border-pink-400 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1">Icon</label>
                <input
                  type="text"
                  placeholder="e.g., camera"
                  className="w-full px-4 py-2.5 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-pink-400/20 focus:border-pink-400"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button className="flex-1 gap-2">
                  <Save className="w-4 h-4" />
                  Save Category
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
