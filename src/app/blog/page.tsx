'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Calendar, User, ArrowRight, FileText } from 'lucide-react';

interface BlogPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  featured_image: string;
  author_name: string;
  date: string;
  category: string;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://weddingbazaarph-testing.up.railway.app';
        const categoryParam = selectedCategory ? `&category=${encodeURIComponent(selectedCategory)}` : '';
        const response = await fetch(`${apiUrl}/public/blog.php?limit=12${categoryParam}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setPosts(data.posts || []);
            setCategories(data.categories || []);
          }
        }
      } catch (error) {
        console.error('Failed to fetch blog posts:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [selectedCategory]);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Wedding Blog</h1>
            <p className="text-xl text-dark-300">Tips, trends, and inspiration for your perfect wedding</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-dark-800"></div>
                <div className="p-6">
                  <div className="h-4 bg-dark-800 rounded w-1/4 mb-3"></div>
                  <div className="h-6 bg-dark-800 rounded mb-2"></div>
                  <div className="h-4 bg-dark-800 rounded w-3/4"></div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="min-h-screen bg-dark-950 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <FileText className="w-16 h-16 text-pink-400 mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Wedding Blog</h1>
          <p className="text-xl text-dark-300 mb-8">Coming Soon!</p>
          <p className="text-dark-400 max-w-md mx-auto">
            We&apos;re working on bringing you the best wedding tips, trends, and inspiration. 
            Check back soon for helpful articles from our wedding experts.
          </p>
          <Link href="/" className="inline-block mt-8 px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-lg transition-colors">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const featuredPost = posts[0];
  const otherPosts = posts.slice(1);

  return (
    <div className="min-h-screen bg-dark-950 py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Wedding Blog</h1>
          <p className="text-xl text-dark-300">Tips, trends, and inspiration for your perfect wedding</p>
        </div>

        {/* Category filters */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full text-sm transition-colors ${
                selectedCategory === null
                  ? 'bg-pink-500 text-white'
                  : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm transition-colors ${
                  selectedCategory === cat
                    ? 'bg-pink-500 text-white'
                    : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Featured Post */}
        <Card className="mb-12 overflow-hidden">
          <div className="grid md:grid-cols-2">
            <div className="h-64 md:h-auto">
              <img 
                src={featuredPost.featured_image || 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600'} 
                alt={featuredPost.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-8 flex flex-col justify-center">
              <span className="text-pink-400 text-sm font-medium mb-2">{featuredPost.category}</span>
              <h2 className="text-2xl font-semibold text-white mb-3">{featuredPost.title}</h2>
              <p className="text-dark-300 mb-4">{featuredPost.excerpt}</p>
              <div className="flex items-center gap-4 text-dark-400 text-sm mb-6">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {featuredPost.author_name}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {featuredPost.date}
                </span>
              </div>
              <Link 
                href={`/blog/${featuredPost.slug}`}
                className="text-pink-400 hover:text-pink-300 flex items-center gap-2"
              >
                Read More <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </Card>

        {/* Other Posts Grid */}
        {otherPosts.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherPosts.map((post) => (
              <Card key={post.id} className="overflow-hidden hover:border-pink-500/50 transition-colors">
                <div className="h-48">
                  <img 
                    src={post.featured_image || 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600'} 
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <span className="text-pink-400 text-xs font-medium">{post.category}</span>
                  <h3 className="text-lg font-semibold text-white mt-1 mb-2 line-clamp-2">{post.title}</h3>
                  <p className="text-dark-400 text-sm mb-4 line-clamp-2">{post.excerpt}</p>
                  <div className="flex items-center justify-between text-dark-500 text-xs">
                    <span>{post.author_name}</span>
                    <span>{post.date}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
