'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui';

export function CTA() {
  return (
    <section className="py-24 bg-dark-900 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-pink-400/10 via-dark-900 to-pink-400/10" />
      
      {/* Decorative circles */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-pink-400/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-pink-400/10 rounded-full blur-3xl" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-6">
          Ready to Plan Your
          <br />
          <span className="text-pink-300">Dream Wedding?</span>
        </h2>
        
        <p className="text-dark-300 text-xl mb-10 max-w-2xl mx-auto">
          Join thousands of couples who have found their perfect wedding providers through Wedding Bazaar
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/register">
            <Button size="lg" className="group">
              Get Started Free
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Link href="/discover">
            <Button variant="outline" size="lg">
              Browse Providers
            </Button>
          </Link>
        </div>

        {/* Trust badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-dark-400">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-white">10,000+</span>
            <span className="text-sm">Happy Couples</span>
          </div>
          <div className="w-px h-8 bg-dark-700" />
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-white">5,000+</span>
            <span className="text-sm">Verified Providers</span>
          </div>
          <div className="w-px h-8 bg-dark-700" />
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-white">50+</span>
            <span className="text-sm">Cities</span>
          </div>
        </div>
      </div>
    </section>
  );
}
