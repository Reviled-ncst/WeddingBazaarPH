'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Briefcase, Calendar, Handshake, MessageCircle, Home, ArrowLeft, Users2 } from 'lucide-react';

const communityNav = [
  { href: '/community', label: 'Hub', icon: Home, exact: true },
  { href: '/community/jobs', label: 'Job Board', icon: Briefcase },
  { href: '/community/availability', label: 'Availability', icon: Calendar },
  { href: '/community/partnerships', label: 'Partnerships', icon: Handshake },
  { href: '/community/forum', label: 'Forum', icon: MessageCircle },
];

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const getDashboardLink = () => {
    if (user?.role === 'vendor') return '/vendor-dashboard';
    if (user?.role === 'coordinator') return '/coordinator-dashboard';
    return '/dashboard';
  };

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-50 bg-dark-900 border-b border-dark-700">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Left: Back to Dashboard + Title */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(getDashboardLink())}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
              <div className="h-6 w-px bg-dark-700" />
              <div className="flex items-center gap-2">
                <Users2 className="w-5 h-5 text-pink-400" />
                <span className="font-semibold text-white">Community</span>
              </div>
            </div>

            {/* Center: Navigation Links */}
            <nav className="flex items-center gap-1 overflow-x-auto">
              {communityNav.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href, item.exact);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap transition-all ${
                      active
                        ? 'bg-pink-500/20 text-pink-400'
                        : 'text-gray-400 hover:text-white hover:bg-dark-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium hidden md:inline">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right: User Info */}
            <div className="flex items-center gap-2">
              {user && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-400 font-medium">
                    {user.name?.charAt(0) || '?'}
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium text-white">{user.name}</p>
                    <p className="text-xs text-gray-400 capitalize">{user.role}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <main>{children}</main>
    </div>
  );
}
