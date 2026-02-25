'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Menu, X, Heart, User, Search, Home, Users, Users2, LucideIcon, Calendar, Bookmark, MessageSquare, Settings, LogOut, ChevronDown, BarChart3, Package, Star, CalendarCheck, ClipboardList, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';

function HeaderContent() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab');

  // Hide header on admin pages (admin has its own layout with sidebar and header)
  const isAdminPage = pathname.startsWith('/admin');
  
  // Check if a nav link is active (handles both pathname and tab params)
  const isLinkActive = (href: string) => {
    const [linkPath, linkQuery] = href.split('?');
    const linkTab = linkQuery?.split('=')[1];
    
    if (linkTab) {
      return pathname === linkPath && currentTab === linkTab;
    }
    return pathname === linkPath && !currentTab;
  };

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchExpanded(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when search expands
  useEffect(() => {
    if (isSearchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchExpanded]);

  // For logged-in couples, Home goes to discover page with both services and coordinators
  const getHomeLink = () => {
    if (user && (user.role === 'individual' || user.role === 'couple')) {
      return '/discover';
    }
    if (user && user.role === 'vendor') {
      return '/vendor-dashboard';
    }
    if (user && user.role === 'coordinator') {
      return '/coordinator-dashboard';
    }
    if (user && user.role === 'admin') {
      return '/admin';
    }
    return '/';
  };

  // Role-specific navigation links
  const getNavLinks = (): { href: string; label: string; icon: LucideIcon }[] => {
    if (!user) {
      return [{ href: '/', label: 'Home', icon: Home }];
    }
    
    // Vendors, coordinators, and admins use in-dashboard navigation, so no header nav needed
    if (user.role === 'vendor' || user.role === 'coordinator' || user.role === 'admin') {
      return [];
    }
    
    // Couple (individual)
    return [
      { href: '/discover', label: 'Home', icon: Home },
    ];
  };

  const navLinks = getNavLinks();

  // Role-specific profile menu items
  const getProfileMenuItems = (): { href: string; label: string; icon: LucideIcon }[] => {
    if (!user) return [];
    
    if (user.role === 'vendor') {
      return [
        { href: '/vendor-dashboard/profile', label: 'Profile & Verification', icon: ShieldCheck },
        { href: '/community', label: 'Community', icon: Users2 },
        { href: '/vendor-dashboard?tab=settings', label: 'Settings', icon: Settings },
      ];
    }
    
    if (user.role === 'coordinator') {
      return [
        { href: '/coordinator-dashboard/profile', label: 'Profile & Verification', icon: ShieldCheck },
        { href: '/community', label: 'Community', icon: Users2 },
        { href: '/coordinator-dashboard?tab=settings', label: 'Settings', icon: Settings },
      ];
    }
    
    // Couple (individual)
    return [
      { href: '/dashboard', label: 'Dashboard', icon: Home },
      { href: '/dashboard?tab=bookings', label: 'My Bookings', icon: Calendar },
      { href: '/dashboard?tab=saved', label: 'Saved Providers', icon: Bookmark },
      { href: '/dashboard?tab=messages', label: 'Messages', icon: MessageSquare },
      { href: '/dashboard?tab=settings', label: 'Settings', icon: Settings },
    ];
  };

  const profileMenuItems = getProfileMenuItems();

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
    router.push('/');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/discover?search=${encodeURIComponent(searchQuery)}`);
      setIsSearchExpanded(false);
      setSearchQuery('');
    }
  };

  const getDashboardLink = () => {
    if (!user) return '/dashboard';
    if (user.role === 'vendor') return '/vendor-dashboard';
    if (user.role === 'coordinator') return '/coordinator-dashboard';
    return '/dashboard';
  };

  // Admin has its own layout with sidebar - don't show global header
  if (isAdminPage) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 bg-dark-950/90 backdrop-blur-lg border-b border-dark-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={getHomeLink()} className="flex items-center space-x-2">
            <Heart className="w-8 h-8 text-pink-400 fill-pink-400" />
            <span className="text-xl font-semibold">
              <span className="text-pink-300 font-serif">Wedding</span>
              <span className="text-white">Bazaar</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = isLinkActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? 'bg-pink-500/10 text-pink-400' 
                      : 'text-dark-300 hover:bg-dark-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}

            {/* Search - only for couples and non-logged-in users */}
            {(!user || user.role === 'individual') && (
              <div ref={searchRef} className="relative ml-2">
                {isSearchExpanded ? (
                  <form onSubmit={handleSearch} className="flex items-center">
                    <div className="flex items-center bg-dark-800 border border-dark-700 rounded-full px-3 py-1.5">
                      <Search className="w-4 h-4 text-dark-400 mr-2" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search providers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Escape' && setIsSearchExpanded(false)}
                        className="w-40 bg-transparent text-white text-sm placeholder-dark-500 focus:outline-none"
                        autoFocus
                      />
                      {searchQuery && (
                        <button
                          type="submit"
                          className="ml-1 p-1 bg-pink-500 rounded-full hover:bg-pink-600 transition-colors"
                        >
                          <Search className="w-3 h-3 text-white" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => { setIsSearchExpanded(false); setSearchQuery(''); }}
                        className="ml-1 p-1 text-dark-400 hover:text-white transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => setIsSearchExpanded(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-dark-300 hover:bg-dark-800 hover:text-white transition-all duration-200"
                  >
                    <Search className="w-4 h-4" />
                    <span>Search</span>
                  </button>
                )}
              </div>
            )}
          </nav>

          {/* Right Section */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="relative" ref={profileRef}>
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-2 text-dark-200 hover:text-pink-400 transition-colors px-3 py-2 rounded-lg hover:bg-dark-800"
                >
                  <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-pink-400" />
                  </div>
                  <span className="font-medium">{user.name.split(' ')[0]}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Profile Dropdown */}
                {isProfileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-dark-900 border border-dark-800 rounded-xl shadow-xl py-2 z-50">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-dark-800">
                      <p className="text-sm font-medium text-white">{user.name}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                      <p className="text-xs text-pink-400 capitalize mt-1">{user.role === 'individual' ? 'Couple' : user.role}</p>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      {profileMenuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-dark-800 hover:text-white transition-colors"
                          >
                            <Icon className="w-4 h-4" />
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>

                    {/* Logout */}
                    <div className="border-t border-dark-800 pt-2">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-dark-800 hover:text-white transition-colors w-full"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-dark-300"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-dark-800">
            <nav className="flex flex-col space-y-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-3 px-3 py-2 text-dark-300 hover:text-pink-400 hover:bg-dark-800 rounded-lg transition-colors font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Icon className="w-5 h-5" />
                    {link.label}
                  </Link>
                );
              })}
              <hr className="border-dark-800 my-2" />
              {user ? (
                <>
                  {/* User info */}
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-white">{user.name}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </div>
                  {profileMenuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-3 px-3 py-2 text-dark-300 hover:text-pink-400 hover:bg-dark-800 rounded-lg transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Icon className="w-5 h-5" />
                        {item.label}
                      </Link>
                    );
                  })}
                  <button 
                    onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                    className="flex items-center gap-3 px-3 py-2 text-dark-400 hover:text-pink-400 hover:bg-dark-800 rounded-lg transition-colors w-full"
                  >
                    <LogOut className="w-5 h-5" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    href="/login"
                    className="text-dark-300"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link href="/register" onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full">Get Started</Button>
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

export function Header() {
  return (
    <Suspense fallback={
      <header className="sticky top-0 z-50 bg-dark-950/90 backdrop-blur-lg border-b border-dark-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <div className="flex items-center space-x-2">
            <Heart className="w-8 h-8 text-pink-400 fill-pink-400" />
            <span className="text-xl font-semibold">
              <span className="text-pink-300 font-serif">Wedding</span>
              <span className="text-white">Bazaar</span>
            </span>
          </div>
        </div>
      </header>
    }>
      <HeaderContent />
    </Suspense>
  );
}
