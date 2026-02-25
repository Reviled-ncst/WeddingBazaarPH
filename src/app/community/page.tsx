'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Briefcase, 
  Calendar, 
  Users, 
  MessageSquare, 
  ArrowRight,
  TrendingUp,
  Clock,
  Star,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/wedding-bazaar-api';

interface Stats {
  openJobs: number;
  activeVendors: number;
  partnerships: number;
  forumThreads: number;
}

const communityFeatures = [
  {
    title: 'Job Board',
    description: 'Coordinators post job opportunities, vendors apply and get hired',
    icon: Briefcase,
    href: '/community/jobs',
    color: 'bg-emerald-500/20 text-emerald-400',
    stats: 'openJobs',
    statsLabel: 'Open Jobs',
    forRoles: ['vendor', 'coordinator'],
  },
  {
    title: 'Availability Board',
    description: 'Vendors showcase their availability, get discovered by coordinators',
    icon: Calendar,
    href: '/community/availability',
    color: 'bg-blue-500/20 text-blue-400',
    stats: 'activeVendors',
    statsLabel: 'Available Vendors',
    forRoles: ['vendor', 'coordinator'],
  },
  {
    title: 'Partnership Matching',
    description: 'Find compatible partners for long-term collaborations',
    icon: Users,
    href: '/community/partnerships',
    color: 'bg-purple-500/20 text-purple-400',
    stats: 'partnerships',
    statsLabel: 'Active Partnerships',
    forRoles: ['vendor', 'coordinator'],
  },
  {
    title: 'Discussion Forum',
    description: 'Share experiences, ask questions, and learn from the community',
    icon: MessageSquare,
    href: '/community/forum',
    color: 'bg-pink-500/20 text-pink-400',
    stats: 'forumThreads',
    statsLabel: 'Active Discussions',
    forRoles: ['vendor', 'coordinator', 'couple'],
  },
];

export default function CommunityPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ role: string; name: string } | null>(null);
  const [stats, setStats] = useState<Stats>({
    openJobs: 0,
    activeVendors: 0,
    partnerships: 0,
    forumThreads: 0,
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Error parsing user');
      }
    }
    
    // Fetch community stats
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // In a real app, this would be a single API call
      // For now, we'll use placeholder values
      setStats({
        openJobs: 12,
        activeVendors: 45,
        partnerships: 28,
        forumThreads: 156,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const filteredFeatures = communityFeatures.filter(
    feature => !user || feature.forRoles.includes(user.role)
  );

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-pink-500/10 to-transparent">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <Badge variant="default" className="mb-4">
              <Sparkles className="w-3 h-3 mr-1" />
              Wedding Industry Network
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Community Hub
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Connect with vendors and coordinators, find job opportunities, 
              showcase your availability, and grow your wedding business together.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <Card className="p-4 text-center">
              <Briefcase className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{stats.openJobs}</p>
              <p className="text-sm text-gray-400">Open Jobs</p>
            </Card>
            <Card className="p-4 text-center">
              <Calendar className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{stats.activeVendors}</p>
              <p className="text-sm text-gray-400">Available Vendors</p>
            </Card>
            <Card className="p-4 text-center">
              <Users className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{stats.partnerships}</p>
              <p className="text-sm text-gray-400">Partnerships</p>
            </Card>
            <Card className="p-4 text-center">
              <MessageSquare className="w-8 h-8 text-pink-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{stats.forumThreads}</p>
              <p className="text-sm text-gray-400">Discussions</p>
            </Card>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredFeatures.map((feature) => {
            const Icon = feature.icon;
            const statValue = stats[feature.stats as keyof Stats];
            
            return (
              <Link key={feature.href} href={feature.href}>
                <Card className="p-6 h-full hover:border-pink-500/30 transition-all group cursor-pointer">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${feature.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-semibold text-white group-hover:text-pink-400 transition-colors">
                          {feature.title}
                        </h3>
                        <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-pink-400 group-hover:translate-x-1 transition-all" />
                      </div>
                      <p className="text-gray-400 mb-4">{feature.description}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="text-xs">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          {statValue} {feature.statsLabel}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Call to Action */}
        {!user && (
          <Card className="mt-12 p-8 text-center bg-gradient-to-r from-pink-500/10 to-purple-500/10">
            <h2 className="text-2xl font-bold text-white mb-4">
              Join Our Community
            </h2>
            <p className="text-gray-400 mb-6 max-w-lg mx-auto">
              Register as a vendor or coordinator to access job opportunities, 
              post availability, and connect with industry professionals.
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => router.push('/register')}>
                Get Started
              </Button>
              <Button variant="outline" onClick={() => router.push('/login')}>
                Sign In
              </Button>
            </div>
          </Card>
        )}

        {/* Recent Activity - Placeholder */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-white mb-6">Recent Activity</h2>
          <div className="space-y-4">
            {[
              { type: 'job', text: 'New photography job posted in Manila', time: '2 hours ago' },
              { type: 'vendor', text: 'Vendor "Elegant Catering" is available Dec 15-20', time: '3 hours ago' },
              { type: 'forum', text: 'New discussion: "Tips for rainy season weddings"', time: '5 hours ago' },
              { type: 'partnership', text: 'New coordinator joined the network', time: '1 day ago' },
            ].map((activity, idx) => (
              <Card key={idx} className="p-4 flex items-center gap-4">
                <div className="p-2 bg-dark-800 rounded-lg">
                  {activity.type === 'job' && <Briefcase className="w-4 h-4 text-emerald-400" />}
                  {activity.type === 'vendor' && <Calendar className="w-4 h-4 text-blue-400" />}
                  {activity.type === 'forum' && <MessageSquare className="w-4 h-4 text-pink-400" />}
                  {activity.type === 'partnership' && <Users className="w-4 h-4 text-purple-400" />}
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm">{activity.text}</p>
                </div>
                <div className="flex items-center gap-1 text-gray-500 text-xs">
                  <Clock className="w-3 h-3" />
                  {activity.time}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
