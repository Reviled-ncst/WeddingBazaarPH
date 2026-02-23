'use client';

import { useState, useEffect } from 'react';
import { Star, Quote, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface Testimonial {
  id: number;
  name: string;
  location: string;
  image: string | null;
  rating: number;
  text: string;
  date: string;
  vendor_name?: string;
  service_type?: string;
}

// Default avatar based on name initials
const getInitialsAvatar = (name: string) => {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=F472B6&color=fff&size=100`;
};

export function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        setLoading(true);
        const response = await api.get<{ success: boolean; testimonials: Testimonial[] }>('/public/testimonials.php?limit=6');
        if (response.data?.testimonials) {
          setTestimonials(response.data.testimonials);
        }
      } catch (err) {
        console.error('Failed to fetch testimonials:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTestimonials();
  }, []);

  return (
    <section className="py-24 bg-dark-950 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-pink-400/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-300/5 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-serif font-bold text-white mb-4">
            Love Stories
          </h2>
          <p className="text-dark-400 text-lg max-w-2xl mx-auto">
            Hear from couples who found their perfect wedding providers through our platform
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-pink-400 animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!loading && testimonials.length === 0 && (
          <div className="text-center py-16">
            <p className="text-dark-400">No testimonials available yet.</p>
          </div>
        )}

        {/* Testimonials Grid */}
        {!loading && testimonials.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="bg-dark-900 border border-dark-800 rounded-2xl p-8 relative hover:border-pink-400/30 transition-all duration-300"
              >
                {/* Quote icon */}
                <Quote className="absolute top-6 right-6 w-8 h-8 text-pink-400/20" />

                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>

                {/* Text */}
                <p className="text-dark-200 mb-6 leading-relaxed">
                  &quot;{testimonial.text}&quot;
                </p>

                {/* Author */}
                <div className="flex items-center gap-4">
                  <img
                    src={testimonial.image || getInitialsAvatar(testimonial.name)}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-pink-400/20"
                  />
                  <div>
                    <h4 className="text-white font-semibold">{testimonial.name}</h4>
                    <p className="text-dark-400 text-sm">
                      {testimonial.location} • {testimonial.date}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
