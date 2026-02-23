import Link from 'next/link';
import { Heart, Instagram, Facebook, Twitter, Mail, Phone, MapPin } from 'lucide-react';

const footerLinks = {
  providers: [
    { label: 'All Providers', href: '/vendors' },
    { label: 'Photographers', href: '/vendors?category=photographer' },
    { label: 'Venues', href: '/vendors?category=venue' },
    { label: 'Caterers', href: '/vendors?category=caterer' },
    { label: 'Decorators', href: '/vendors?category=decorator' },
    { label: 'Makeup Artists', href: '/vendors?category=makeup' },
  ],
  company: [
    { label: 'About Us', href: '/about' },
    { label: 'How It Works', href: '/how-it-works' },
    { label: 'For Providers', href: '/register' },
    { label: 'Blog', href: '/blog' },
  ],
  support: [
    { label: 'Help Center', href: '/help' },
    { label: 'Contact Us', href: '/contact' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ],
};

export function Footer() {
  return (
    <footer className="bg-dark-950 text-white border-t border-dark-800">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center space-x-2 mb-6">
              <Heart className="w-8 h-8 text-pink-400 fill-pink-400" />
              <span className="text-2xl font-semibold">
                <span className="text-pink-300 font-serif">Wedding</span>
                <span className="text-white">Bazaar</span>
              </span>
            </Link>
            <p className="text-dark-400 mb-6 max-w-md">
              Your one-stop destination for all wedding needs. Connect with the best providers 
              and make your special day truly memorable.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3 text-dark-400">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-pink-400" />
                <span>hello@weddingbazaar.ph</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-pink-400" />
                <span>+63 917 123 4567</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-pink-400" />
                <span>Manila, Philippines</span>
              </div>
            </div>
          </div>

          {/* Providers Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Providers</h4>
            <ul className="space-y-3">
              {footerLinks.providers.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    className="text-dark-400 hover:text-pink-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    className="text-dark-400 hover:text-pink-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Support</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    className="text-dark-400 hover:text-pink-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-dark-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <p className="text-dark-400 text-sm">
              © 2026 WeddingBazaar. All rights reserved. Made with{' '}
              <Heart className="w-4 h-4 inline text-pink-400 fill-pink-400" /> in the Philippines
            </p>

            {/* Social Links */}
            <div className="flex items-center space-x-4">
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 text-dark-400 hover:text-pink-400 transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 text-dark-400 hover:text-pink-400 transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 text-dark-400 hover:text-pink-400 transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
