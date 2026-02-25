'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ForumCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  allowed_roles: string[];
  threads_count: number;
  posts_count: number;
}

interface ForumThread {
  id: number;
  category_id: number;
  user_id: number;
  title: string;
  slug: string;
  content: string;
  is_pinned: boolean;
  is_locked: boolean;
  views_count: number;
  replies_count: number;
  last_reply_at: string | null;
  author_name: string;
  author_role: string;
  category_name: string;
  created_at: string;
}

interface ForumPost {
  id: number;
  thread_id: number;
  user_id: number;
  content: string;
  author_name: string;
  author_role: string;
  created_at: string;
}

export default function ForumPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [activeThread, setActiveThread] = useState<ForumThread | null>(null);
  const [threadPosts, setThreadPosts] = useState<ForumPost[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNewThread, setShowNewThread] = useState(false);
  const [newThread, setNewThread] = useState({ title: '', content: '', category_id: '' });
  const [newReply, setNewReply] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/community/forum/categories.php`);
      const data = await res.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  }, []);

  const fetchThreads = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category_slug', selectedCategory);
      if (searchQuery) params.append('search', searchQuery);
      params.append('limit', '20');
      
      const res = await fetch(`${API_URL}/community/forum/threads.php?${params}`);
      const data = await res.json();
      if (data.success) {
        setThreads(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch threads:', error);
    }
  }, [selectedCategory, searchQuery]);

  const fetchThreadDetail = async (threadId: number) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/community/forum/posts.php?thread_id=${threadId}`);
      const data = await res.json();
      if (data.success) {
        setActiveThread(data.data.thread);
        setThreadPosts(data.data.posts);
      }
    } catch (error) {
      console.error('Failed to fetch thread:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchCategories(), fetchThreads()]);
      setLoading(false);
    };
    loadData();
  }, [fetchCategories, fetchThreads]);

  const handleCreateThread = async () => {
    if (!user || !newThread.title || !newThread.content || !newThread.category_id) return;
    
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/community/forum/threads.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          category_id: parseInt(newThread.category_id),
          title: newThread.title,
          content: newThread.content
        })
      });
      
      const data = await res.json();
      if (data.success) {
        setShowNewThread(false);
        setNewThread({ title: '', content: '', category_id: '' });
        await fetchThreads();
      }
    } catch (error) {
      console.error('Failed to create thread:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePostReply = async () => {
    if (!user || !activeThread || !newReply.trim()) return;
    
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/community/forum/posts.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          thread_id: activeThread.id,
          content: newReply
        })
      });
      
      const data = await res.json();
      if (data.success) {
        setNewReply('');
        await fetchThreadDetail(activeThread.id);
      }
    } catch (error) {
      console.error('Failed to post reply:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const badges: Record<string, string> = {
      admin: 'bg-red-100 text-red-800',
      vendor: 'bg-blue-100 text-blue-800',
      coordinator: 'bg-purple-100 text-purple-800',
      couple: 'bg-pink-100 text-pink-800'
    };
    return badges[role] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  // Thread detail view
  if (activeThread) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button
            onClick={() => setActiveThread(null)}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-6"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Forum
          </button>

          {/* Thread Header */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              {activeThread.is_pinned && (
                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">📌 Pinned</span>
              )}
              {activeThread.is_locked && (
                <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">🔒 Locked</span>
              )}
              <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                {activeThread.category_name}
              </span>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{activeThread.title}</h1>
            
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                  {activeThread.author_name?.charAt(0) || '?'}
                </div>
                <span className="font-medium text-gray-900">{activeThread.author_name}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${getRoleBadge(activeThread.author_role)}`}>
                  {activeThread.author_role}
                </span>
              </div>
              <span>•</span>
              <span>{formatDate(activeThread.created_at)}</span>
              <span>•</span>
              <span>{activeThread.views_count} views</span>
            </div>
            
            <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
              {activeThread.content}
            </div>
          </div>

          {/* Replies */}
          <div className="space-y-4 mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              {activeThread.replies_count} {activeThread.replies_count === 1 ? 'Reply' : 'Replies'}
            </h2>
            
            {threadPosts.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
                No replies yet. Be the first to reply!
              </div>
            ) : (
              threadPosts.map((post) => (
                <div key={post.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center font-semibold">
                      {post.author_name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{post.author_name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${getRoleBadge(post.author_role)}`}>
                          {post.author_role}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">{formatDate(post.created_at)}</span>
                    </div>
                  </div>
                  <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                    {post.content}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Reply Form */}
          {user && !activeThread.is_locked && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Post a Reply</h3>
              <textarea
                value={newReply}
                onChange={(e) => setNewReply(e.target.value)}
                placeholder="Write your reply..."
                rows={4}
                className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <div className="flex justify-end mt-4">
                <button
                  onClick={handlePostReply}
                  disabled={submitting || !newReply.trim()}
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Posting...' : 'Post Reply'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Forum list view
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <Link href="/community" className="text-primary-600 hover:text-primary-700 text-sm mb-2 inline-block">
              ← Back to Community
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Discussion Forum</h1>
            <p className="text-gray-600 mt-1">Connect with other vendors and coordinators</p>
          </div>
          {user && (user.role === 'vendor' || user.role === 'coordinator' || user.role === 'admin') && (
            <button
              onClick={() => setShowNewThread(true)}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Thread
            </button>
          )}
        </div>

        {/* Categories */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <button
            onClick={() => setSelectedCategory('')}
            className={`p-4 rounded-lg text-center transition ${
              !selectedCategory ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span className="text-2xl block mb-1">🌐</span>
            <span className="text-sm font-medium">All</span>
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.slug)}
              className={`p-4 rounded-lg text-center transition ${
                selectedCategory === cat.slug 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="text-2xl block mb-1">{cat.icon || '💬'}</span>
              <span className="text-sm font-medium">{cat.name}</span>
              <span className="text-xs block opacity-75">{cat.threads_count} threads</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <input
            type="text"
            placeholder="Search discussions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Threads List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : threads.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No discussions yet</h3>
            <p className="text-gray-600">Be the first to start a conversation!</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md divide-y">
            {threads.map((thread) => (
              <div
                key={thread.id}
                onClick={() => fetchThreadDetail(thread.id)}
                className="p-4 hover:bg-gray-50 cursor-pointer transition"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center font-semibold flex-shrink-0">
                    {thread.author_name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {thread.is_pinned && <span className="text-yellow-500 text-sm">📌</span>}
                      {thread.is_locked && <span className="text-red-500 text-sm">🔒</span>}
                      <h3 className="font-semibold text-gray-900 truncate">{thread.title}</h3>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">{thread.content}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="bg-gray-100 px-2 py-0.5 rounded">{thread.category_name}</span>
                      <span>{thread.author_name}</span>
                      <span>{formatDate(thread.created_at)}</span>
                      <span>{thread.views_count} views</span>
                      <span>{thread.replies_count} replies</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* New Thread Modal */}
        {showNewThread && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Start a New Discussion</h2>
                  <button
                    onClick={() => setShowNewThread(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={newThread.category_id}
                    onChange={(e) => setNewThread({ ...newThread, category_id: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={newThread.title}
                    onChange={(e) => setNewThread({ ...newThread, title: e.target.value })}
                    placeholder="What's your discussion about?"
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                  <textarea
                    value={newThread.content}
                    onChange={(e) => setNewThread({ ...newThread, content: e.target.value })}
                    placeholder="Share your thoughts, questions, or ideas..."
                    rows={6}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              <div className="p-6 border-t flex justify-end gap-4">
                <button
                  onClick={() => setShowNewThread(false)}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateThread}
                  disabled={submitting || !newThread.title || !newThread.content || !newThread.category_id}
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Posting...' : 'Post Discussion'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
