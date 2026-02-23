'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Search, Calendar, CreditCard, Heart, CheckCircle, MessageCircle, Star } from 'lucide-react';

const steps = [
  {
    icon: Search,
    title: 'Browse Vendors',
    description: 'Explore our curated list of verified wedding vendors. Filter by category, location, price range, and ratings to find your perfect match.'
  },
  {
    icon: MessageCircle,
    title: 'Connect & Discuss',
    description: 'Send messages to vendors, ask questions, and discuss your wedding vision. Get quotes and understand their packages.'
  },
  {
    icon: Calendar,
    title: 'Check Availability',
    description: 'View real-time availability calendars. Find vendors who are free on your wedding date.'
  },
  {
    icon: CreditCard,
    title: 'Book & Pay Securely',
    description: 'Book your chosen vendors with secure online payments. Pay deposits or full amounts as per vendor policies.'
  },
  {
    icon: CheckCircle,
    title: 'Get Confirmation',
    description: 'Receive instant booking confirmation. Track all your bookings in one dashboard.'
  },
  {
    icon: Heart,
    title: 'Enjoy Your Wedding',
    description: 'Relax and enjoy your special day knowing everything is taken care of by professionals.'
  }
];

const forVendors = [
  {
    icon: Star,
    title: 'Create Your Profile',
    description: 'Showcase your work with photos, videos, and detailed service descriptions.'
  },
  {
    icon: Calendar,
    title: 'Manage Bookings',
    description: 'Accept bookings, manage your calendar, and track payments all in one place.'
  },
  {
    icon: MessageCircle,
    title: 'Connect with Couples',
    description: 'Receive inquiries and build relationships with engaged couples.'
  }
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-dark-950 py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">How It Works</h1>
          <p className="text-xl text-dark-300 max-w-2xl mx-auto">
            Wedding Bazaar makes planning your wedding simple and stress-free
          </p>
        </div>

        {/* For Couples */}
        <div className="mb-20">
          <h2 className="text-2xl font-semibold text-white text-center mb-10">For Couples</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {steps.map((step, index) => (
              <Card key={index} className="p-6 relative">
                <div className="absolute -top-3 -left-3 w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {index + 1}
                </div>
                <step.icon className="w-10 h-10 text-pink-400 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-dark-400">{step.description}</p>
              </Card>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/discover">
              <Button size="lg">Start Browsing Vendors</Button>
            </Link>
          </div>
        </div>

        {/* For Vendors */}
        <div className="bg-dark-900 rounded-2xl p-8 md:p-12">
          <h2 className="text-2xl font-semibold text-white text-center mb-10">For Vendors</h2>
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {forVendors.map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-8 h-8 text-pink-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-dark-400">{item.description}</p>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Link href="/register">
              <Button variant="outline" size="lg">Join as a Vendor</Button>
            </Link>
          </div>
        </div>

        {/* FAQ Teaser */}
        <div className="text-center mt-16">
          <p className="text-dark-300 mb-4">Have questions?</p>
          <Link href="/help" className="text-pink-400 hover:underline">
            Check our Help Center →
          </Link>
        </div>
      </div>
    </div>
  );
}
