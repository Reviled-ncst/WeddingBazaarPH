'use client';

import Link from 'next/link';
import { useCategories } from '@/contexts/CategoriesContext';
import { Loader2 } from 'lucide-react';

export function Categories() {
  const { categories, isLoading, getIconComponent } = useCategories();

  if (isLoading) {
    return (
      <section className="py-16 md:py-20 bg-dark-950">
        <div className="flex justify-center items-center">
          <Loader2 className="w-8 h-8 text-pink-400 animate-spin" />
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-20 bg-dark-950">
      <div className="max-w-5xl mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-10 md:mb-14">
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-white mb-3">
            Browse by Category
          </h2>
          <p className="text-dark-400 text-sm md:text-base">
            <span className="hidden md:inline">Hover to explore</span>
            <span className="md:hidden">Tap to explore</span>
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:flex md:flex-wrap justify-center gap-3 md:gap-4">
          {categories.map((category) => {
            const Icon = getIconComponent(category.icon);
            return (
              <Link
                key={category.slug}
                href={`/discover?category=${category.slug}`}
                className="group relative"
              >
                {/* Mobile: Icon + Label */}
                <div className="md:hidden flex flex-col items-center gap-2 p-3 bg-dark-900 border border-dark-800 rounded-xl hover:border-pink-400/30 transition-all">
                  <Icon className="w-6 h-6 text-pink-400" />
                  <span className="text-xs text-dark-300 text-center">{category.name}</span>
                </div>
                {/* Desktop: Expandable */}
                <div className="hidden md:flex items-center gap-0 pl-4 pr-4 py-3 bg-dark-900 border border-dark-800 rounded-full hover:bg-dark-800 hover:border-pink-400/30 hover:pr-5 group-hover:gap-3 transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)]">
                  <Icon className="w-5 h-5 text-dark-400 group-hover:text-pink-400 transition-colors duration-500 shrink-0" />
                  <div className="grid grid-cols-[0fr] group-hover:grid-cols-[1fr] transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)]">
                    <span className="overflow-hidden whitespace-nowrap text-white opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                      {category.name}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
