'use client';

import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';

const FIRST_VISIT_KEY = 'wedding_bazaar_visited';

export function FirstTimeLoader({ children }: { children: React.ReactNode }) {
  const [showLoader, setShowLoader] = useState(false);
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    // Check if this is the first visit
    const hasVisited = localStorage.getItem(FIRST_VISIT_KEY);
    
    if (!hasVisited) {
      setShowLoader(true);
      // Mark as visited
      localStorage.setItem(FIRST_VISIT_KEY, 'true');
      
      // Hide loader after animation
      const timer = setTimeout(() => {
        setIsAnimating(false);
        // Allow fade out animation to complete
        setTimeout(() => {
          setShowLoader(false);
        }, 500);
      }, 2500);
      
      return () => clearTimeout(timer);
    }
  }, []);

  if (!showLoader) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Loader Overlay */}
      <div
        className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-dark-950 transition-opacity duration-500 ${
          isAnimating ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Animated Logo */}
        <div className="relative">
          {/* Outer ring */}
          <div className="absolute inset-0 animate-ping">
            <div className="w-24 h-24 rounded-full border-2 border-pink-400/30" />
          </div>
          
          {/* Heart icon with pulse */}
          <div className="relative w-24 h-24 flex items-center justify-center animate-pulse">
            <Heart className="w-12 h-12 text-pink-400 fill-pink-400" />
          </div>
        </div>

        {/* Brand name */}
        <h1 className="mt-8 text-3xl font-bold text-white animate-fade-in">
          Wedding <span className="text-pink-400">Bazaar</span>
        </h1>

        {/* Tagline */}
        <p className="mt-3 text-gray-400 animate-fade-in-delay">
          Connecting dreams with reality
        </p>

        {/* Loading dots */}
        <div className="mt-8 flex gap-2">
          <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>

      {/* Content (hidden during animation) */}
      <div className={isAnimating ? 'opacity-0' : 'opacity-100 transition-opacity duration-500'}>
        {children}
      </div>
    </>
  );
}
