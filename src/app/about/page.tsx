'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Heart, Users, Star, Award } from 'lucide-react';

interface PublicStats {
  happyCouples: number;
  verifiedProviders: number;
  averageRating: number;
  yearsOfService: number;
}

export default function AboutPage() {
  const [stats, setStats] = useState<PublicStats>({
    happyCouples: 0,
    verifiedProviders: 0,
    averageRating: 0,
    yearsOfService: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://weddingbazaarph-testing.up.railway.app';
        const response = await fetch(`${apiUrl}/public/stats.php`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.stats) {
            setStats(data.stats);
          }
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(num >= 10000 ? 0 : 1)}K+`;
    }
    return `${num}+`;
  };

  return (
    <div className="min-h-screen bg-dark-950 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">About Wedding Bazaar</h1>
          <p className="text-xl text-dark-300">Your trusted partner in creating perfect wedding memories</p>
        </div>

        <Card className="p-8 md:p-12 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">Our Mission</h2>
          <p className="text-dark-300 leading-relaxed mb-6">
            Wedding Bazaar was founded with a simple mission: to make wedding planning easier and more enjoyable 
            for couples across the Philippines. We connect engaged couples with the best wedding vendors, 
            helping them find trusted professionals who can bring their dream wedding to life.
          </p>
          <p className="text-dark-300 leading-relaxed">
            We believe every couple deserves access to quality wedding services, regardless of their budget 
            or location. Our platform brings together photographers, venues, caterers, coordinators, and 
            more – all in one place.
          </p>
        </Card>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="p-6 text-center">
            <Heart className="w-12 h-12 text-pink-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {loading ? '...' : formatNumber(stats.happyCouples)}
            </h3>
            <p className="text-dark-400">Happy Couples</p>
          </Card>
          <Card className="p-6 text-center">
            <Users className="w-12 h-12 text-pink-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {loading ? '...' : formatNumber(stats.verifiedProviders)}
            </h3>
            <p className="text-dark-400">Verified Providers</p>
          </Card>
          <Card className="p-6 text-center">
            <Star className="w-12 h-12 text-pink-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {loading ? '...' : `${stats.averageRating}/5`}
            </h3>
            <p className="text-dark-400">Average Rating</p>
          </Card>
          <Card className="p-6 text-center">
            <Award className="w-12 h-12 text-pink-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {loading ? '...' : `${stats.yearsOfService} Years`}
            </h3>
            <p className="text-dark-400">Serving Filipino Couples</p>
          </Card>
        </div>

        <Card className="p-8 md:p-12">
          <h2 className="text-2xl font-semibold text-white mb-4">Why Choose Us?</h2>
          <ul className="space-y-4 text-dark-300">
            <li className="flex items-start gap-3">
              <span className="text-pink-400 font-bold">?</span>
              <span><strong className="text-white">Verified Vendors:</strong> Every vendor goes through our verification process</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-pink-400 font-bold">?</span>
              <span><strong className="text-white">Secure Payments:</strong> Book and pay safely through our platform</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-pink-400 font-bold">?</span>
              <span><strong className="text-white">Real Reviews:</strong> Read honest feedback from real couples</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-pink-400 font-bold">?</span>
              <span><strong className="text-white">Dedicated Support:</strong> Our team is here to help you every step of the way</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
