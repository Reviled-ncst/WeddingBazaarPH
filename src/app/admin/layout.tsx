'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Users,
  FolderTree,
  Package,
  ShieldCheck,
  MessageSquareWarning,
  HeadphonesIcon,
  Activity,
  KeyRound,
  MapPin,
  HelpCircle,
  Settings,
  ChevronLeft,
  Menu,
  LogOut,
  Bell,
  Search,
  FileText,
  Layout,
  Image,
  Globe,
  BarChart3,
  MousePointer,
  Database,
  RotateCcw
} from 'lucide-react';

const adminNavItems = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Heatmaps', href: '/admin/heatmaps', icon: MousePointer },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Categories', href: '/admin/categories', icon: FolderTree },
  { name: 'Services', href: '/admin/services', icon: Package },
  { name: 'Verifications', href: '/admin/verifications', icon: ShieldCheck },
  { name: 'Refunds', href: '/admin/refunds', icon: RotateCcw },
  { name: 'Complaints', href: '/admin/complaints', icon: MessageSquareWarning },
  { name: 'Support Tickets', href: '/admin/support', icon: HeadphonesIcon },
  { name: 'Activity Logs', href: '/admin/activity-logs', icon: Activity },
  { name: 'Login Security', href: '/admin/login-security', icon: KeyRound },
  { name: 'Location Logs', href: '/admin/location-logs', icon: MapPin },
  { name: 'Help Center', href: '/admin/help-center', icon: HelpCircle },
  { name: 'Site Settings', href: '/admin/cms/settings', icon: Globe },
  { name: 'Pages', href: '/admin/cms/pages', icon: FileText },
  { name: 'Landing Page', href: '/admin/cms/landing', icon: Layout },
  { name: 'Media', href: '/admin/cms/media', icon: Image },
  { name: 'Migrations', href: '/admin/migrations', icon: Database },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
    if (!isLoading && user && user.role !== 'admin') {
      router.push('/');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-400"></div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-dark-950 flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-dark-900 border-r border-dark-800 transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        } hidden lg:block`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-dark-800">
          {sidebarOpen && (
            <Link href="/admin" className="flex items-center gap-2">
              <span className="text-pink-400 text-xl">💒</span>
              <span className="font-bold text-white">Admin Panel</span>
            </Link>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-dark-800 text-dark-400 hover:text-white transition-colors"
          >
            <ChevronLeft className={`w-5 h-5 transition-transform ${!sidebarOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-4rem)]">
          {adminNavItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                    : 'text-dark-400 hover:bg-dark-800 hover:text-white'
                }`}
                title={!sidebarOpen ? item.name : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="text-sm font-medium">{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-64 bg-dark-900 border-r border-dark-800 z-50">
            <div className="h-16 flex items-center justify-between px-4 border-b border-dark-800">
              <Link href="/admin" className="flex items-center gap-2">
                <span className="text-pink-400 text-xl">💒</span>
                <span className="font-bold text-white">Admin Panel</span>
              </Link>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-dark-800 text-dark-400"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>
            <nav className="p-4 space-y-1">
              {adminNavItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                        : 'text-dark-400 hover:bg-dark-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className={`flex-1 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'} transition-all duration-300`}>
        {/* Top header */}
        <header className="h-16 bg-dark-900 border-b border-dark-800 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-lg hover:bg-dark-800 text-dark-400 lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* Search */}
            <div className="hidden md:flex items-center gap-2 bg-dark-800 rounded-lg px-3 py-2 w-64">
              <Search className="w-4 h-4 text-dark-500" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent text-sm text-white placeholder-dark-500 focus:outline-none w-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-dark-800 text-dark-400 hover:text-white">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-pink-500 rounded-full"></span>
            </button>

            {/* User menu */}
            <div className="flex items-center gap-3 pl-3 border-l border-dark-700">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">{user.name}</p>
                <p className="text-xs text-dark-400">Administrator</p>
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-lg hover:bg-dark-800 text-dark-400 hover:text-red-400"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
