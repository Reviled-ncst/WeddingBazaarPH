'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Layout, Save, Eye, EyeOff, RefreshCw, ChevronUp, ChevronDown, Edit, X } from 'lucide-react';
import { api } from '@/lib/api';

interface Section {
  id: number;
  section_key: string;
  title: string;
  subtitle: string;
  content: string;
  content_json?: Record<string, unknown>;
  background_image: string;
  is_active: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export default function CMSLandingPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    content: '',
    background_image: '',
    is_active: true
  });

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<Section[]>('/admin/sections/list.php');
      if (response.success && response.data) {
        setSections(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch sections:', error);
      setMessage({ type: 'error', text: 'Failed to load sections' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (section: Section) => {
    setEditingSection(section);
    setFormData({
      title: section.title || '',
      subtitle: section.subtitle || '',
      content: section.content || '',
      background_image: section.background_image || '',
      is_active: section.is_active === 1
    });
  };

  const handleCancel = () => {
    setEditingSection(null);
  };

  const handleSave = async () => {
    if (!editingSection) return;
    
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await api.post('/admin/sections/update.php', {
        id: editingSection.id,
        title: formData.title,
        subtitle: formData.subtitle,
        content: formData.content,
        background_image: formData.background_image,
        is_active: formData.is_active ? 1 : 0
      });

      if (response.success) {
        setMessage({ type: 'success', text: 'Section updated successfully' });
        fetchSections();
        handleCancel();
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to update section' });
      }
    } catch (error) {
      console.error('Failed to save section:', error);
      setMessage({ type: 'error', text: 'Failed to save section' });
    } finally {
      setIsSaving(false);
    }
  };

  const getSectionLabel = (key: string): string => {
    const labels: Record<string, string> = {
      hero: 'Hero Banner',
      features: 'Features Section',
      how_it_works: 'How It Works',
      stats: 'Statistics',
      testimonials: 'Testimonials',
      cta: 'Call to Action',
      faq: 'FAQ Section'
    };
    return labels[key] || key;
  };

  const getSectionDescription = (key: string): string => {
    const descriptions: Record<string, string> = {
      hero: 'The main banner at the top of the landing page',
      features: 'Highlight key features of the platform',
      how_it_works: 'Step-by-step guide for users',
      stats: 'Platform statistics and numbers',
      testimonials: 'Customer reviews and testimonials',
      cta: 'Call to action banner to drive signups',
      faq: 'Frequently asked questions'
    };
    return descriptions[key] || '';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-pink-400 animate-spin" />
      </div>
    );
  }

  // Show editor
  if (editingSection) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Edit: {getSectionLabel(editingSection.section_key)}
            </h1>
            <p className="text-dark-400 mt-1">{getSectionDescription(editingSection.section_key)}</p>
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
                  Save Section
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
          <div className="col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Content</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="Section Title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Subtitle</label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="Section Subtitle"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Content (JSON)
                    <span className="text-dark-400 font-normal ml-2">For items, buttons, etc.</span>
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={12}
                    className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder='{"items": [], "buttons": []}'
                  />
                  <p className="text-xs text-dark-400 mt-2">
                    Use valid JSON format. The structure depends on the section type.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Settings</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-white">Active</span>
                  <button
                    onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                    className={`relative w-12 h-6 rounded-full transition-colors ${formData.is_active ? 'bg-green-500' : 'bg-dark-700'}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.is_active ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Background</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Image URL</label>
                  <input
                    type="url"
                    value={formData.background_image}
                    onChange={(e) => setFormData({ ...formData, background_image: e.target.value })}
                    className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="https://..."
                  />
                </div>
                
                {formData.background_image && (
                  <div className="relative rounded-lg overflow-hidden">
                    <img
                      src={formData.background_image}
                      alt="Background preview"
                      className="w-full h-32 object-cover"
                    />
                  </div>
                )}
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
          <h1 className="text-2xl font-bold text-white">Landing Page</h1>
          <p className="text-dark-400 mt-1">Manage sections on the homepage</p>
        </div>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-dark-800 rounded-lg text-dark-400 hover:text-white transition-colors"
        >
          <Eye className="w-4 h-4" />
          Preview Site
        </a>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {message.text}
        </div>
      )}

      <div className="space-y-4">
        {sections.map((section, index) => (
          <Card key={section.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex flex-col gap-1">
                  <button className="p-1 hover:bg-dark-800 rounded text-dark-400 hover:text-white disabled:opacity-50" disabled={index === 0}>
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button className="p-1 hover:bg-dark-800 rounded text-dark-400 hover:text-white disabled:opacity-50" disabled={index === sections.length - 1}>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="w-12 h-12 bg-dark-800 rounded-lg flex items-center justify-center">
                  <Layout className="w-6 h-6 text-pink-400" />
                </div>
                
                <div>
                  <h3 className="text-white font-medium">{getSectionLabel(section.section_key)}</h3>
                  <p className="text-dark-400 text-sm">{getSectionDescription(section.section_key)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  section.is_active ? 'bg-green-500/20 text-green-400' : 'bg-dark-700 text-dark-400'
                }`}>
                  {section.is_active ? 'Active' : 'Hidden'}
                </span>
                
                <button
                  onClick={() => handleEdit(section)}
                  className="flex items-center gap-2 px-4 py-2 bg-dark-800 rounded-lg text-dark-400 hover:text-white transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
              </div>
            </div>
          </Card>
        ))}

        {sections.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-dark-400">No landing sections configured. Run the CMS schema to add default sections.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
