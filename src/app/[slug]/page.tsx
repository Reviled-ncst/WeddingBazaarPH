'use client';

import { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { RefreshCw } from 'lucide-react';

interface PageData {
  id: number;
  slug: string;
  title: string;
  content: string;
  meta_title: string;
  meta_description: string;
}

export default function CMSPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [page, setPage] = useState<PageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const response = await fetch(`${apiUrl}/pages/get.php?slug=${slug}`);
        const data = await response.json();
        
        if (data.success) {
          setPage(data.data);
        } else {
          setNotFoundState(true);
        }
      } catch (error) {
        console.error('Failed to fetch page:', error);
        setNotFoundState(true);
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      fetchPage();
    }
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-dark-950">
        <RefreshCw className="w-8 h-8 text-pink-400 animate-spin" />
      </div>
    );
  }

  if (notFoundState || !page) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-dark-950">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Page Not Found</h1>
          <p className="text-dark-400 mb-8">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
          <a href="/" className="text-pink-400 hover:underline">Return to Home</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{page.title}</h1>
        </div>

        {/* Content */}
        <Card className="p-8 md:p-12">
          <div 
            className="prose prose-invert prose-pink max-w-none
              prose-headings:text-white prose-headings:font-semibold
              prose-p:text-dark-300 prose-p:leading-relaxed
              prose-a:text-pink-400 prose-a:no-underline hover:prose-a:underline
              prose-strong:text-white
              prose-ul:text-dark-300 prose-ol:text-dark-300
              prose-li:marker:text-pink-400"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        </Card>
      </div>
    </div>
  );
}
