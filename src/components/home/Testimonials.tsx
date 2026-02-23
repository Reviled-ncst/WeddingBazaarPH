import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: 'Priya & Rahul',
    location: 'Mumbai',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    rating: 5,
    text: 'Wedding Bazaar made our wedding planning so much easier! We found the perfect photographer and venue through this platform. Highly recommended!',
    date: 'December 2025',
  },
  {
    id: 2,
    name: 'Ananya & Vikram',
    location: 'Delhi',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    rating: 5,
    text: 'The providers we connected with were professional and delivered exactly what we envisioned. Our wedding was magical thanks to Wedding Bazaar.',
    date: 'January 2026',
  },
  {
    id: 3,
    name: 'Meera & Arjun',
    location: 'Bangalore',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    rating: 5,
    text: 'From makeup artist to caterer, we found all our vendors here. The reviews helped us make informed decisions. Best wedding planning experience!',
    date: 'November 2025',
  },
];

export function Testimonials() {
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

        {/* Testimonials Grid */}
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
                "{testimonial.text}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <img
                  src={testimonial.image}
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
      </div>
    </section>
  );
}
