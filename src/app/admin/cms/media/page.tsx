'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Image, Upload, Trash2, RefreshCw, Copy, Check, Search, Filter } from 'lucide-react';
import { api } from '@/lib/api';

interface MediaItem {
  id: number;
  filename: string;
  url: string;
  file_type: string;
  file_size: number;
  category: string;
  alt_text: string;
  uploaded_by: number;
  created_at: string;
}

export default function CMSMediaPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMedia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  const fetchMedia = async () => {
    setIsLoading(true);
    try {
      const url = selectedCategory 
        ? `/admin/media/list.php?category=${selectedCategory}`
        : '/admin/media/list.php';
      const response = await api.get<{ items: MediaItem[]; pagination: unknown }>(url);
      if (response.success && response.data) {
        const data = response.data as { items: MediaItem[] };
        setItems(data.items);
      }
    } catch (error) {
      console.error('Failed to fetch media:', error);
      setMessage({ type: 'error', text: 'Failed to load media' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setMessage(null);

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', selectedCategory || 'general');

        const token = localStorage.getItem('token');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/admin/media/upload.php`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.message);
        }
      }

      setMessage({ type: 'success', text: `Uploaded ${files.length} file(s)` });
      fetchMedia();
    } catch (error) {
      console.error('Upload failed:', error);
      setMessage({ type: 'error', text: 'Failed to upload file(s)' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (item: MediaItem) => {
    if (!confirm(`Delete "${item.filename}"?`)) return;

    try {
      const response = await api.post('/admin/media/delete.php', { id: item.id });
      if (response.success) {
        setMessage({ type: 'success', text: 'File deleted' });
        fetchMedia();
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to delete' });
      }
    } catch (error) {
      console.error('Delete failed:', error);
      setMessage({ type: 'error', text: 'Failed to delete file' });
    }
  };

  const handleCopyUrl = async (item: MediaItem) => {
    try {
      await navigator.clipboard.writeText(item.url);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const categories = ['general', 'hero', 'testimonials', 'gallery', 'icons'];

  if (isLoading && items.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-pink-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Media Library</h1>
          <p className="text-dark-400 mt-1">Upload and manage images for the site</p>
        </div>
        <Button onClick={handleUploadClick} disabled={isUploading}>
          {isUploading ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload Files
            </>
          )}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {message.text}
        </div>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-dark-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Media Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {items.map((item) => (
          <Card key={item.id} className="overflow-hidden group">
            <div className="relative aspect-square bg-dark-800">
              {item.file_type === 'image' ? (
                <img
                  src={item.url.startsWith('http') ? item.url : `${process.env.NEXT_PUBLIC_API_URL || ''}${item.url}`}
                  alt={item.alt_text || item.filename}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Image className="w-12 h-12 text-dark-600" />
                </div>
              )}
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => handleCopyUrl(item)}
                  className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                  title="Copy URL"
                >
                  {copiedId === item.id ? (
                    <Check className="w-5 h-5 text-green-400" />
                  ) : (
                    <Copy className="w-5 h-5 text-white" />
                  )}
                </button>
                <button
                  onClick={() => handleDelete(item)}
                  className="p-2 bg-red-500/50 rounded-lg hover:bg-red-500/70 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
            
            <div className="p-3">
              <p className="text-white text-sm truncate">{item.filename}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-dark-400 text-xs">{formatFileSize(item.file_size)}</span>
                <span className="text-dark-400 text-xs bg-dark-800 px-2 py-0.5 rounded">{item.category}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {items.length === 0 && !isLoading && (
        <Card className="p-12 text-center">
          <Image className="w-16 h-16 text-dark-600 mx-auto mb-4" />
          <p className="text-dark-400">No media files yet. Upload some images to get started.</p>
        </Card>
      )}
    </div>
  );
}
