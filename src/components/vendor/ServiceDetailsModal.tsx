'use client';

import { X, Check, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useState } from 'react';
import { PricingItem, AddOn, ServiceImage } from './AddServiceModal';

interface ServiceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: {
    id: number;
    name: string;
    description: string;
    category: string;
    pricing_items: PricingItem[];
    add_ons: AddOn[];
    inclusions: string[];
    images: ServiceImage[];
    base_total: number;
    is_active: boolean;
  } | null;
}

const SERVICE_CATEGORY_LABELS: Record<string, string> = {
  photography: 'Photography',
  videography: 'Videography',
  venue: 'Venue',
  catering: 'Catering',
  decoration: 'Decoration',
  florist: 'Florist',
  'hair & makeup': 'Hair & Makeup',
  'music & entertainment': 'Music & Entertainment',
  'cake & desserts': 'Cake & Desserts',
  'wedding planner': 'Wedding Planner',
};

export function ServiceDetailsModal({ isOpen, onClose, service }: ServiceDetailsModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!isOpen || !service) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const categoryLabel = SERVICE_CATEGORY_LABELS[service.category] || service.category;
  const hasImages = service.images && service.images.length > 0;

  const nextImage = () => {
    if (hasImages) {
      setCurrentImageIndex((prev) => (prev + 1) % service.images.length);
    }
  };

  const prevImage = () => {
    if (hasImages) {
      setCurrentImageIndex((prev) => (prev - 1 + service.images.length) % service.images.length);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-dark-900 border border-dark-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-800">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-white">{service.name}</h2>
            <Badge variant={service.is_active ? 'success' : 'default'}>
              {service.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Images */}
            <div>
              {/* Main Image */}
              <div className="relative aspect-[4/3] bg-dark-800 rounded-xl overflow-hidden mb-3">
                {hasImages ? (
                  <>
                    <img
                      src={service.images[currentImageIndex].url}
                      alt={service.images[currentImageIndex].originalName || service.name}
                      className="w-full h-full object-cover"
                    />
                    {service.images.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                          {service.images.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => setCurrentImageIndex(idx)}
                              className={`w-2 h-2 rounded-full transition-colors ${
                                idx === currentImageIndex ? 'bg-white' : 'bg-white/40 hover:bg-white/60'
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-16 h-16 text-gray-600" />
                  </div>
                )}
              </div>

              {/* Thumbnail Grid */}
              {hasImages && service.images.length > 1 && (
                <div className="grid grid-cols-5 gap-2">
                  {service.images.slice(0, 5).map((image, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                        idx === currentImageIndex ? 'border-pink-500' : 'border-transparent hover:border-dark-600'
                      }`}
                    >
                      <img
                        src={image.url}
                        alt={image.originalName || `Image ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                  {service.images.length > 5 && (
                    <div className="aspect-square rounded-lg bg-dark-800 flex items-center justify-center">
                      <span className="text-gray-400 text-sm font-medium">+{service.images.length - 5}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Category Badge */}
              <div className="mt-4">
                <span className="text-gray-400 text-sm">Category</span>
                <div className="mt-1">
                  <Badge variant="pink">{categoryLabel}</Badge>
                </div>
              </div>

              {/* Description */}
              <div className="mt-4">
                <h3 className="text-gray-400 text-sm mb-2">Description</h3>
                <p className="text-gray-200 text-sm leading-relaxed">{service.description}</p>
              </div>
            </div>

            {/* Right Column - Pricing & Details */}
            <div className="space-y-6">
              {/* Pricing Items */}
              <div className="bg-dark-800/50 rounded-xl p-5">
                <h3 className="text-white font-semibold mb-4">Pricing Breakdown</h3>
                <div className="space-y-3">
                  {service.pricing_items && service.pricing_items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-300">{item.description}</span>
                        {item.quantity > 1 && (
                          <span className="text-gray-500">× {item.quantity}</span>
                        )}
                      </div>
                      <span className="text-white font-medium">
                        {formatPrice(item.quantity * item.rate)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-dark-700 flex items-center justify-between">
                  <span className="text-gray-400 font-medium">Base Total</span>
                  <span className="text-pink-400 text-lg font-bold">{formatPrice(service.base_total)}</span>
                </div>
              </div>

              {/* Add-ons */}
              {service.add_ons && service.add_ons.length > 0 && (
                <div className="bg-dark-800/50 rounded-xl p-5">
                  <h3 className="text-white font-semibold mb-4">Available Add-ons</h3>
                  <div className="space-y-3">
                    {service.add_ons.map((addon, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-gray-300">{addon.name}</span>
                        <span className="text-emerald-400 font-medium">+{formatPrice(addon.price)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Inclusions */}
              {service.inclusions && service.inclusions.length > 0 && (
                <div className="bg-dark-800/50 rounded-xl p-5">
                  <h3 className="text-white font-semibold mb-4">What&apos;s Included</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {service.inclusions.map((inclusion, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300">{inclusion}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-dark-800">
          <div className="flex justify-end">
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
