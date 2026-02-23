'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '${API_URL}';

export function Hero() {
  const [stats, setStats] = useState({ happyCouples: 1000 });

  useEffect(() => {
    fetch(`${API_URL}/public/stats.php`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.stats) {
          setStats(data.stats);
        }
      })
      .catch(() => {});
  }, []);

  // Format number with + suffix
  const formatCount = (num: number) => {
    if (num >= 10000) return `${Math.floor(num / 1000)}k+`;
    if (num >= 1000) return `${(num / 1000).toFixed(1).replace('.0', '')}k+`;
    return `${num}+`;
  };

  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2070&auto=format&fit=crop')`,
        }}
      />
      
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-dark-950/70" />

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        {/* Heading */}
        <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-6 leading-tight">
          Find Your Perfect
          <br />
          <span className="text-gradient">Wedding Providers</span>
        </h1>

        {/* Subheading */}
        <p className="text-lg md:text-xl text-dark-200 mb-10 max-w-xl mx-auto">
          Connect with top-rated photographers, venues, caterers, and more.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/discover">
            <Button size="lg" className="px-8">
              Browse Providers
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="outline" size="lg" className="px-8">
              Get Started
            </Button>
          </Link>
        </div>

        {/* Trust Badge */}
        <p className="mt-10 text-dark-400 text-sm">
          Trusted by <span className="text-pink-300 font-medium">{formatCount(stats.happyCouples)}</span> couples across the Philippines
        </p>
      </div>
    </section>
  );
}
