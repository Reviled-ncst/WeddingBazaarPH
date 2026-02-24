'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { X, Plus, Trash2, AlertCircle, Check, Info, Calculator, DollarSign, ChevronLeft, ChevronRight, Image, Upload } from 'lucide-react';
import { Button, Input } from '@/components/ui';

// Helper to transform image URLs
const getImageUrl = (url: string): string => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('blob:')) return url;
  // Strip /wedding-bazaar-api prefix if present (legacy URLs)
  let cleanUrl = url;
  if (cleanUrl.startsWith('/wedding-bazaar-api')) {
    cleanUrl = cleanUrl.replace('/wedding-bazaar-api', '');
  }
  return `${process.env.NEXT_PUBLIC_API_URL}${cleanUrl}`;
};

// Type for category field definitions
interface CategoryField {
  name: string;
  label: string;
  type: 'number' | 'checkbox' | 'text' | 'select';
  required: boolean;
  placeholder?: string;
  options?: string[];
  defaultValue?: string | number | boolean;
}

interface CategoryConfig {
  label: string;
  fields: CategoryField[];
  defaultInclusions: string[];
  suggestedPricingItems: SuggestedPricingItem[];
  suggestedAddOns: SuggestedAddOn[];
  defaultDescription?: string;
}

interface SuggestedPricingItem {
  description: string;
  unit: string;
  defaultQty?: number;
  defaultRate?: number;
}

interface SuggestedAddOn {
  name: string;
  suggestedPrice?: number;
}

// Pricing item (line item in the breakdown)
export interface PricingItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  total: number; // Auto-computed: quantity * rate
}

// Add-on that couples can optionally select
export interface AddOn {
  id: string;
  name: string;
  description?: string;
  price: number;
}

// Service categories with their specific requirements
// Keys must match database category values (lowercase)
const SERVICE_CATEGORIES: Record<string, CategoryConfig> = {
  photography: {
    label: 'Photography',
    defaultDescription: 'Professional wedding photography package with full coverage of your special day. Includes pre-wedding consultation, ceremony and reception coverage, and beautifully edited photos delivered via online gallery.',
    fields: [
      { name: 'coverage_hours', label: 'Coverage Hours', type: 'number', required: true, placeholder: 'e.g., 8', defaultValue: 8 },
      { name: 'photographers_count', label: 'Number of Photographers', type: 'number', required: true, placeholder: 'e.g., 2', defaultValue: 2 },
      { name: 'edited_photos', label: 'Edited Photos Included', type: 'number', required: false, placeholder: 'e.g., 300', defaultValue: 300 },
      { name: 'raw_files', label: 'Raw Files Included', type: 'checkbox', required: false, defaultValue: false },
      { name: 'album_included', label: 'Photo Album Included', type: 'checkbox', required: false, defaultValue: true },
    ],
    defaultInclusions: ['Edited high-resolution photos', 'Online gallery', 'Pre-wedding consultation'],
    suggestedPricingItems: [
      { description: 'Photography Coverage', unit: 'hours', defaultQty: 8, defaultRate: 5000 },
      { description: 'Lead Photographer', unit: 'day', defaultQty: 1, defaultRate: 15000 },
      { description: 'Second Photographer', unit: 'day', defaultQty: 1, defaultRate: 10000 },
      { description: 'Photo Editing', unit: 'photos', defaultQty: 300, defaultRate: 50 },
    ],
    suggestedAddOns: [
      { name: 'Engagement Shoot', suggestedPrice: 15000 },
      { name: 'Drone Shots', suggestedPrice: 10000 },
      { name: 'Same-Day Edit Photos', suggestedPrice: 8000 },
      { name: 'Extra Hour', suggestedPrice: 5000 },
      { name: 'Printed Album (20 pages)', suggestedPrice: 12000 },
      { name: 'USB Drive with RAW Files', suggestedPrice: 3000 },
    ],
  },
  videography: {
    label: 'Videography',
    defaultDescription: 'Cinematic wedding videography capturing every precious moment. Our team delivers stunning highlight reels and full ceremony coverage with professional editing and color grading.',
    fields: [
      { name: 'coverage_hours', label: 'Coverage Hours', type: 'number', required: true, placeholder: 'e.g., 10', defaultValue: 10 },
      { name: 'videographers_count', label: 'Number of Videographers', type: 'number', required: true, placeholder: 'e.g., 2', defaultValue: 2 },
      { name: 'highlight_video', label: 'Highlight Video (minutes)', type: 'number', required: false, placeholder: 'e.g., 5', defaultValue: 5 },
      { name: 'full_video', label: 'Full Video Included', type: 'checkbox', required: false, defaultValue: true },
      { name: 'drone_footage', label: 'Drone Footage Included', type: 'checkbox', required: false, defaultValue: false },
    ],
    defaultInclusions: ['Highlight video', 'Full ceremony coverage', 'Professional editing'],
    suggestedPricingItems: [
      { description: 'Video Coverage', unit: 'hours', defaultQty: 10, defaultRate: 6000 },
      { description: 'Lead Videographer', unit: 'day', defaultQty: 1, defaultRate: 18000 },
      { description: 'Second Videographer', unit: 'day', defaultQty: 1, defaultRate: 12000 },
      { description: 'Highlight Video (5 min)', unit: 'video', defaultQty: 1, defaultRate: 15000 },
      { description: 'Full Ceremony Edit', unit: 'video', defaultQty: 1, defaultRate: 20000 },
    ],
    suggestedAddOns: [
      { name: 'Same-Day Edit Video', suggestedPrice: 25000 },
      { name: 'Drone Footage', suggestedPrice: 15000 },
      { name: 'Extra Videographer', suggestedPrice: 10000 },
      { name: 'Extended Highlight (10 min)', suggestedPrice: 8000 },
      { name: 'RAW Footage', suggestedPrice: 5000 },
    ],
  },
  venue: {
    label: 'Venue',
    defaultDescription: 'Beautiful wedding venue perfect for your special day. Our space accommodates intimate gatherings to grand celebrations with modern amenities and dedicated staff.',
    fields: [
      { name: 'capacity', label: 'Maximum Capacity (guests)', type: 'number', required: true, placeholder: 'e.g., 200', defaultValue: 150 },
      { name: 'hours_included', label: 'Hours Included', type: 'number', required: true, placeholder: 'e.g., 6', defaultValue: 6 },
      { name: 'setup_included', label: 'Setup/Teardown Included', type: 'checkbox', required: false, defaultValue: true },
      { name: 'parking_capacity', label: 'Parking Capacity', type: 'number', required: false, placeholder: 'e.g., 50', defaultValue: 50 },
      { name: 'catering_allowed', label: 'Outside Catering Allowed', type: 'checkbox', required: false, defaultValue: true },
    ],
    defaultInclusions: ['Tables and chairs', 'Basic sound system', 'Parking', 'Security'],
    suggestedPricingItems: [
      { description: 'Venue Rental', unit: 'hours', defaultQty: 6, defaultRate: 15000 },
      { description: 'Tables & Chairs', unit: 'guests', defaultQty: 100, defaultRate: 200 },
      { description: 'Sound System', unit: 'package', defaultQty: 1, defaultRate: 10000 },
      { description: 'Basic Lighting', unit: 'package', defaultQty: 1, defaultRate: 8000 },
    ],
    suggestedAddOns: [
      { name: 'Extra Hour', suggestedPrice: 10000 },
      { name: 'Bridal Suite Access', suggestedPrice: 8000 },
      { name: 'Additional Parking', suggestedPrice: 5000 },
      { name: 'Generator Backup', suggestedPrice: 15000 },
      { name: 'Overnight Accommodation', suggestedPrice: 25000 },
    ],
  },
  catering: {
    label: 'Catering',
    defaultDescription: 'Exquisite wedding catering with customizable menus to delight your guests. From elegant plated dinners to lavish buffets, we create unforgettable culinary experiences.',
    fields: [
      { name: 'minimum_pax', label: 'Minimum Guests', type: 'number', required: true, placeholder: 'e.g., 50', defaultValue: 50 },
      { name: 'courses', label: 'Number of Courses', type: 'number', required: false, placeholder: 'e.g., 5', defaultValue: 5 },
      { name: 'buffet_style', label: 'Buffet Style', type: 'checkbox', required: false, defaultValue: true },
      { name: 'plated_service', label: 'Plated Service Available', type: 'checkbox', required: false, defaultValue: true },
      { name: 'waitstaff_included', label: 'Waitstaff Included', type: 'checkbox', required: false, defaultValue: true },
    ],
    defaultInclusions: ['Food tasting session', 'Table setup', 'Serving utensils', 'Cleanup'],
    suggestedPricingItems: [
      { description: 'Per Person Rate', unit: 'pax', defaultQty: 100, defaultRate: 800 },
      { description: 'Waitstaff', unit: 'staff', defaultQty: 5, defaultRate: 1500 },
      { description: 'Table Setup & Linens', unit: 'tables', defaultQty: 10, defaultRate: 500 },
      { description: 'Beverages Package', unit: 'pax', defaultQty: 100, defaultRate: 150 },
    ],
    suggestedAddOns: [
      { name: 'Cocktail Hour', suggestedPrice: 150 },
      { name: 'Dessert Station', suggestedPrice: 20000 },
      { name: 'Late Night Snacks', suggestedPrice: 80 },
      { name: 'Extra Course', suggestedPrice: 100 },
      { name: 'Premium Drinks Package', suggestedPrice: 200 },
    ],
  },
  decoration: {
    label: 'Decoration',
    defaultDescription: 'Transform your venue into a breathtaking wonderland with our elegant wedding decoration services. We handle everything from ceremony backdrops to reception centerpieces.',
    fields: [
      { name: 'setup_time', label: 'Setup Time (hours before)', type: 'number', required: false, placeholder: 'e.g., 4', defaultValue: 4 },
      { name: 'areas_covered', label: 'Areas Covered', type: 'text', required: false, placeholder: 'e.g., Ceremony, Reception', defaultValue: 'Ceremony, Reception' },
      { name: 'centerpieces_included', label: 'Centerpieces Included', type: 'number', required: false, placeholder: 'e.g., 15', defaultValue: 15 },
      { name: 'lighting_included', label: 'Lighting Package Included', type: 'checkbox', required: false, defaultValue: true },
    ],
    defaultInclusions: ['Ceremony backdrop', 'Reception centerpieces', 'Setup and teardown'],
    suggestedPricingItems: [
      { description: 'Ceremony Setup', unit: 'package', defaultQty: 1, defaultRate: 25000 },
      { description: 'Reception Setup', unit: 'package', defaultQty: 1, defaultRate: 35000 },
      { description: 'Centerpieces', unit: 'pcs', defaultQty: 15, defaultRate: 1500 },
      { description: 'Backdrop Design', unit: 'unit', defaultQty: 1, defaultRate: 20000 },
      { description: 'Lighting Package', unit: 'package', defaultQty: 1, defaultRate: 15000 },
    ],
    suggestedAddOns: [
      { name: 'Premium Flowers Upgrade', suggestedPrice: 15000 },
      { name: 'LED Dance Floor', suggestedPrice: 25000 },
      { name: 'Photo Booth Backdrop', suggestedPrice: 8000 },
      { name: 'Ceiling Draping', suggestedPrice: 20000 },
    ],
  },
  florist: {
    label: 'Florist',
    defaultDescription: 'Stunning floral arrangements crafted with love for your wedding day. From romantic bridal bouquets to elegant centerpieces, we bring your floral vision to life.',
    fields: [
      { name: 'bouquets', label: 'Bouquets Included', type: 'number', required: false, placeholder: 'e.g., 6', defaultValue: 5 },
      { name: 'boutonnieres', label: 'Boutonnieres', type: 'number', required: false, placeholder: 'e.g., 8', defaultValue: 6 },
      { name: 'centerpieces', label: 'Centerpieces', type: 'number', required: false, placeholder: 'e.g., 15', defaultValue: 15 },
      { name: 'fresh_flowers', label: 'Fresh Flowers Only', type: 'checkbox', required: false, defaultValue: true },
    ],
    defaultInclusions: ['Bridal bouquet', 'Groom boutonniere', 'Consultation'],
    suggestedPricingItems: [
      { description: 'Bridal Bouquet', unit: 'pc', defaultQty: 1, defaultRate: 5000 },
      { description: 'Bridesmaid Bouquet', unit: 'pcs', defaultQty: 4, defaultRate: 2500 },
      { description: 'Boutonniere', unit: 'pcs', defaultQty: 6, defaultRate: 500 },
      { description: 'Centerpieces', unit: 'pcs', defaultQty: 15, defaultRate: 1500 },
      { description: 'Ceremony Flowers', unit: 'package', defaultQty: 1, defaultRate: 15000 },
    ],
    suggestedAddOns: [
      { name: 'Premium Rose Upgrade', suggestedPrice: 5000 },
      { name: 'Flower Crown', suggestedPrice: 3000 },
      { name: 'Petal Aisle', suggestedPrice: 8000 },
      { name: 'Corsage', suggestedPrice: 1500 },
    ],
  },
  'hair & makeup': {
    label: 'Hair & Makeup',
    defaultDescription: 'Professional bridal hair and makeup services for your perfect wedding look. Our experienced artists ensure you look and feel your absolute best on your special day.',
    fields: [
      { name: 'persons_included', label: 'Persons Included', type: 'number', required: true, placeholder: 'e.g., 5', defaultValue: 5 },
      { name: 'trial_included', label: 'Trial Session Included', type: 'checkbox', required: false, defaultValue: true },
      { name: 'touch_up', label: 'Touch-up Service', type: 'checkbox', required: false, defaultValue: true },
      { name: 'airbrush', label: 'Airbrush Makeup', type: 'checkbox', required: false, defaultValue: false },
      { name: 'hair_styling', label: 'Hair Styling Included', type: 'checkbox', required: false, defaultValue: true },
    ],
    defaultInclusions: ['Bridal makeup', 'False lashes', 'Setting spray'],
    suggestedPricingItems: [
      { description: 'Bridal Makeup & Hair', unit: 'session', defaultQty: 1, defaultRate: 8000 },
      { description: 'Entourage Makeup', unit: 'persons', defaultQty: 4, defaultRate: 3000 },
      { description: 'Trial Session', unit: 'session', defaultQty: 1, defaultRate: 3000 },
      { description: 'Touch-up Service', unit: 'hours', defaultQty: 2, defaultRate: 1000 },
    ],
    suggestedAddOns: [
      { name: 'Extra Person', suggestedPrice: 2500 },
      { name: 'Airbrush Upgrade', suggestedPrice: 3000 },
      { name: 'Hair Extensions', suggestedPrice: 5000 },
      { name: 'Second Look', suggestedPrice: 4000 },
      { name: 'Touch-up Kit', suggestedPrice: 1500 },
    ],
  },
  'music & entertainment': {
    label: 'Music & Entertainment',
    defaultDescription: 'Set the perfect mood for your wedding celebration with professional DJ and entertainment services. We keep your guests dancing all night long with the perfect playlist.',
    fields: [
      { name: 'hours', label: 'Hours of Service', type: 'number', required: true, placeholder: 'e.g., 5', defaultValue: 5 },
      { name: 'equipment_included', label: 'Sound Equipment Included', type: 'checkbox', required: false, defaultValue: true },
      { name: 'lighting', label: 'Lighting Package', type: 'checkbox', required: false, defaultValue: true },
      { name: 'mc_services', label: 'MC Services', type: 'checkbox', required: false, defaultValue: true },
    ],
    defaultInclusions: ['Professional DJ', 'Sound system', 'Basic lighting', 'Wireless microphones'],
    suggestedPricingItems: [
      { description: 'DJ Services', unit: 'hours', defaultQty: 5, defaultRate: 3000 },
      { description: 'Sound System', unit: 'package', defaultQty: 1, defaultRate: 15000 },
      { description: 'Lighting Package', unit: 'package', defaultQty: 1, defaultRate: 10000 },
      { description: 'MC Services', unit: 'event', defaultQty: 1, defaultRate: 8000 },
    ],
    suggestedAddOns: [
      { name: 'Extra Hour', suggestedPrice: 3000 },
      { name: 'Fog Machine', suggestedPrice: 2000 },
      { name: 'LED Wall', suggestedPrice: 15000 },
      { name: 'Live Band Add-on', suggestedPrice: 30000 },
    ],
  },
  'cake & desserts': {
    label: 'Cake & Desserts',
    defaultDescription: 'Delicious custom wedding cakes and desserts crafted to perfection. Our artisan bakers create stunning centerpieces that taste as good as they look.',
    fields: [
      { name: 'servings', label: 'Number of Servings', type: 'number', required: true, placeholder: 'e.g., 100', defaultValue: 100 },
      { name: 'tiers', label: 'Number of Tiers', type: 'number', required: false, placeholder: 'e.g., 3', defaultValue: 3 },
      { name: 'fondant', label: 'Fondant Finish', type: 'checkbox', required: false, defaultValue: true },
      { name: 'custom_design', label: 'Custom Design', type: 'checkbox', required: false, defaultValue: true },
    ],
    defaultInclusions: ['Custom design', 'Cake stand', 'Cake knife service'],
    suggestedPricingItems: [
      { description: 'Wedding Cake', unit: 'servings', defaultQty: 100, defaultRate: 200 },
      { description: 'Design Fee', unit: 'tier', defaultQty: 3, defaultRate: 2000 },
      { description: 'Delivery & Setup', unit: 'trip', defaultQty: 1, defaultRate: 2500 },
    ],
    suggestedAddOns: [
      { name: 'Dessert Table', suggestedPrice: 15000 },
      { name: 'Cupcake Tower', suggestedPrice: 8000 },
      { name: 'Custom Cake Topper', suggestedPrice: 2500 },
      { name: 'Additional Flavor', suggestedPrice: 3000 },
      { name: 'Groom\'s Cake', suggestedPrice: 5000 },
    ],
  },
  'wedding planner': {
    label: 'Wedding Planner',
    defaultDescription: 'Full-service wedding planning and coordination to bring your dream wedding to life. From vendor sourcing to day-of execution, we handle every detail with care.',
    fields: [
      { name: 'planning_type', label: 'Planning Type', type: 'select', options: ['Full Planning', 'Partial Planning', 'Day-of Coordination'], required: true, defaultValue: 'Full Planning' },
      { name: 'meetings_included', label: 'Planning Meetings', type: 'number', required: false, placeholder: 'e.g., 6', defaultValue: 6 },
      { name: 'vendor_coordination', label: 'Vendor Coordination', type: 'checkbox', required: false, defaultValue: true },
      { name: 'timeline_creation', label: 'Timeline Creation', type: 'checkbox', required: false, defaultValue: true },
      { name: 'assistants', label: 'Day-of Assistants', type: 'number', required: false, placeholder: 'e.g., 2', defaultValue: 2 },
    ],
    defaultInclusions: ['Vendor recommendations', 'Budget tracking', 'Day-of coordination'],
    suggestedPricingItems: [
      { description: 'Planning Fee', unit: 'package', defaultQty: 1, defaultRate: 50000 },
      { description: 'Day-of Coordination', unit: 'event', defaultQty: 1, defaultRate: 25000 },
      { description: 'Planning Meetings', unit: 'sessions', defaultQty: 6, defaultRate: 2000 },
      { description: 'Day-of Assistants', unit: 'persons', defaultQty: 2, defaultRate: 3000 },
    ],
    suggestedAddOns: [
      { name: 'Rehearsal Coordination', suggestedPrice: 8000 },
      { name: 'Extra Assistant', suggestedPrice: 5000 },
      { name: 'Post-Wedding Brunch', suggestedPrice: 10000 },
      { name: 'Destination Planning Fee', suggestedPrice: 30000 },
    ],
  },
};

// Common units for pricing
const COMMON_UNITS = [
  'hours', 'day', 'pax', 'persons', 'pcs', 'package', 'session', 'event', 
  'tables', 'unit', 'trip', 'staff', 'servings', 'video', 'photos', 'tier', 'guests'
];

// Service image type
export interface ServiceImage {
  url: string;
  filename?: string;
  originalName?: string;
  file?: File; // For new uploads
}

export interface ServiceFormData {
  name: string;
  description: string;
  category: string;
  pricingItems: PricingItem[];
  addOns: AddOn[];
  details: Record<string, string | number | boolean>;
  inclusions: string[];
  images: ServiceImage[];
  max_bookings_per_day?: number;
}

interface ValidationErrors {
  name?: string;
  description?: string;
  category?: string;
  pricingItems?: string;
  details?: Record<string, string>;
}

interface AddServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (service: ServiceFormData, serviceId?: number) => Promise<void>;
  vendorCategory?: string;
  editService?: {
    id: number;
    name: string;
    description: string;
    category: string;
    pricing_items: PricingItem[];
    add_ons: AddOn[];
    details: Record<string, string | number | boolean>;
    inclusions: string[];
    images: ServiceImage[];
  } | null;
}

// Generate unique ID
const generateId = () => Math.random().toString(36).substr(2, 9);

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-PH', { 
    style: 'currency', 
    currency: 'PHP', 
    minimumFractionDigits: 0,
    maximumFractionDigits: 0 
  }).format(amount);
};

export function AddServiceModal({ isOpen, onClose, onSave, vendorCategory, editService }: AddServiceModalProps) {
  const isEditMode = !!editService;
  
  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    description: '',
    category: vendorCategory || '',
    pricingItems: [],
    addOns: [],
    details: {},
    inclusions: [],
    images: [],
    max_bookings_per_day: 1,
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newInclusion, setNewInclusion] = useState('');
  const [currentStep, setCurrentStep] = useState(0);

  // Wizard steps configuration
  const wizardSteps = [
    { id: 'basic', label: 'Basic Info', description: 'Name and description' },
    { id: 'images', label: 'Images', description: 'Portfolio samples' },
    { id: 'pricing', label: 'Pricing', description: 'Set your prices' },
    { id: 'addons', label: 'Add-ons', description: 'Optional extras' },
    { id: 'details', label: 'Details', description: 'Specific settings' },
  ];

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      // If editing, populate with existing service data
      if (editService) {
        setFormData({
          name: editService.name,
          description: editService.description,
          category: editService.category,
          pricingItems: editService.pricing_items || [],
          addOns: editService.add_ons || [],
          details: editService.details || {},
          inclusions: editService.inclusions || [],
          images: editService.images || [],
          max_bookings_per_day: editService.max_bookings_per_day || 1,
        });
        setErrors({});
        setTouched({});
        setCurrentStep(0);
        return;
      }
      
      // New service - use defaults
      const category = vendorCategory || '';
      const categoryConfig = category ? SERVICE_CATEGORIES[category] : null;
      
      // Pre-fill pricing items from category suggestions
      const defaultPricingItems: PricingItem[] = categoryConfig?.suggestedPricingItems
        ?.slice(0, 3) // Take first 3 suggested items
        .map((suggestion) => {
          const qty = suggestion.defaultQty || 1;
          const rate = suggestion.defaultRate || 0;
          return {
            id: generateId(),
            description: suggestion.description,
            quantity: qty,
            unit: suggestion.unit,
            rate: rate,
            total: qty * rate,
          };
        }) || [];
      
      // Pre-fill add-ons from category suggestions
      const defaultAddOns: AddOn[] = categoryConfig?.suggestedAddOns
        ?.slice(0, 3) // Take first 3 suggested add-ons
        .map((suggestion) => ({
          id: generateId(),
          name: suggestion.name,
          price: suggestion.suggestedPrice || 0,
        })) || [];
      
      // Default package name based on category
      const defaultName = categoryConfig 
        ? `${categoryConfig.label} Package`
        : '';
      
      // Pre-fill category-specific details with default values
      const defaultDetails: Record<string, string | number | boolean> = {};
      if (categoryConfig) {
        categoryConfig.fields.forEach(field => {
          if (field.defaultValue !== undefined) {
            defaultDetails[field.name] = field.defaultValue;
          }
        });
      }
      
      setFormData({
        name: defaultName,
        description: categoryConfig?.defaultDescription || '',
        category,
        pricingItems: defaultPricingItems,
        addOns: defaultAddOns,
        details: defaultDetails,
        inclusions: categoryConfig 
          ? [...categoryConfig.defaultInclusions]
          : [],
        images: [],
      });
      setErrors({});
      setTouched({});
      setCurrentStep(0);
    }
  }, [isOpen, vendorCategory, editService]);

  // Update form when category changes
  useEffect(() => {
    if (formData.category && SERVICE_CATEGORIES[formData.category]) {
      const categoryConfig = SERVICE_CATEGORIES[formData.category];
      
      // Pre-fill data only if empty (to avoid overwriting user changes)
      setFormData(prev => {
        const updates: Partial<ServiceFormData> = {};
        
        // Pre-fill inclusions if empty
        if (prev.inclusions.length === 0) {
          updates.inclusions = [...categoryConfig.defaultInclusions];
        }
        
        // Pre-fill pricing items if empty
        if (prev.pricingItems.length === 0) {
          updates.pricingItems = categoryConfig.suggestedPricingItems
            ?.slice(0, 3)
            .map((suggestion) => {
              const qty = suggestion.defaultQty || 1;
              const rate = suggestion.defaultRate || 0;
              return {
                id: generateId(),
                description: suggestion.description,
                quantity: qty,
                unit: suggestion.unit,
                rate: rate,
                total: qty * rate,
              };
            }) || [];
        }
        
        // Pre-fill add-ons if empty
        if (prev.addOns.length === 0) {
          updates.addOns = categoryConfig.suggestedAddOns
            ?.slice(0, 3)
            .map((suggestion) => ({
              id: generateId(),
              name: suggestion.name,
              price: suggestion.suggestedPrice || 0,
            })) || [];
        }
        
        // Pre-fill name if empty or generic
        if (!prev.name || prev.name === '' || prev.name.endsWith(' Package')) {
          updates.name = `${categoryConfig.label} Package`;
        }
        
        // Pre-fill description if empty
        if (!prev.description && categoryConfig.defaultDescription) {
          updates.description = categoryConfig.defaultDescription;
        }
        
        // Pre-fill category-specific details if empty
        if (Object.keys(prev.details).length === 0) {
          const defaultDetails: Record<string, string | number | boolean> = {};
          categoryConfig.fields.forEach(field => {
            if (field.defaultValue !== undefined) {
              defaultDetails[field.name] = field.defaultValue;
            }
          });
          if (Object.keys(defaultDetails).length > 0) {
            updates.details = defaultDetails;
          }
        }
        
        return Object.keys(updates).length > 0 ? { ...prev, ...updates } : prev;
      });
    }
  }, [formData.category]);

  const currentCategory = formData.category ? SERVICE_CATEGORIES[formData.category] : null;

  // Auto-compute totals
  const computedTotals = useMemo(() => {
    const baseTotal = formData.pricingItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const addOnsTotal = formData.addOns.reduce((sum, addon) => sum + addon.price, 0);
    return {
      baseTotal,
      addOnsTotal,
      grandTotal: baseTotal + addOnsTotal,
    };
  }, [formData.pricingItems, formData.addOns]);

  // Pricing item handlers
  const addPricingItem = (suggestion?: SuggestedPricingItem) => {
    const newItem: PricingItem = {
      id: generateId(),
      description: suggestion?.description || '',
      quantity: suggestion?.defaultQty || 1,
      unit: suggestion?.unit || 'unit',
      rate: 0,
      total: 0,
    };
    setFormData(prev => ({
      ...prev,
      pricingItems: [...prev.pricingItems, newItem],
    }));
  };

  const updatePricingItem = (id: string, field: keyof PricingItem, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      pricingItems: prev.pricingItems.map(item => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        // Auto-compute total
        updated.total = updated.quantity * updated.rate;
        return updated;
      }),
    }));
  };

  const removePricingItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      pricingItems: prev.pricingItems.filter(item => item.id !== id),
    }));
  };

  // Add-on handlers
  const addAddOn = (suggestion?: SuggestedAddOn) => {
    const newAddOn: AddOn = {
      id: generateId(),
      name: suggestion?.name || '',
      price: suggestion?.suggestedPrice || 0,
    };
    setFormData(prev => ({
      ...prev,
      addOns: [...prev.addOns, newAddOn],
    }));
  };

  const updateAddOn = (id: string, field: keyof AddOn, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      addOns: prev.addOns.map(addon => 
        addon.id === id ? { ...addon, [field]: value } : addon
      ),
    }));
  };

  const removeAddOn = (id: string) => {
    setFormData(prev => ({
      ...prev,
      addOns: prev.addOns.filter(addon => addon.id !== id),
    }));
  };

  // Inclusion handlers
  const addInclusion = () => {
    if (newInclusion.trim()) {
      setFormData(prev => ({
        ...prev,
        inclusions: [...prev.inclusions, newInclusion.trim()],
      }));
      setNewInclusion('');
    }
  };

  const removeInclusion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      inclusions: prev.inclusions.filter((_, i) => i !== index),
    }));
  };

  // Detail handlers
  const handleDetailChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      details: { ...prev.details, [field]: value },
    }));
  };

  // Validation
  const validateField = (field: string, value: unknown): string | undefined => {
    switch (field) {
      case 'name':
        if (!value || (typeof value === 'string' && !value.trim())) return 'Service name is required';
        if (typeof value === 'string' && value.trim().length < 3) return 'Name must be at least 3 characters';
        return undefined;
      case 'description':
        if (!value || (typeof value === 'string' && !value.trim())) return 'Description is required';
        if (typeof value === 'string' && value.trim().length < 20) return 'Description must be at least 20 characters';
        return undefined;
      case 'category':
        if (!value) return 'Category is required';
        return undefined;
      case 'pricingItems':
        if (!formData.pricingItems.length) return 'Add at least one pricing item';
        if (formData.pricingItems.some(item => !item.description.trim())) return 'All items need a description';
        if (formData.pricingItems.some(item => item.rate <= 0)) return 'All items need a rate greater than 0';
        return undefined;
      default:
        return undefined;
    }
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const value = formData[field as keyof ServiceFormData];
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (touched[field]) {
      const error = validateField(field, value);
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {
      name: validateField('name', formData.name),
      description: validateField('description', formData.description),
      category: validateField('category', formData.category),
      pricingItems: validateField('pricingItems', formData.pricingItems),
    };

    // Validate required category-specific fields
    if (currentCategory) {
      const detailErrors: Record<string, string> = {};
      currentCategory.fields.forEach(field => {
        if (field.required && !formData.details[field.name]) {
          detailErrors[field.name] = `${field.label} is required`;
        }
      });
      if (Object.keys(detailErrors).length > 0) {
        newErrors.details = detailErrors;
      }
    }

    setErrors(newErrors);
    setTouched({
      name: true,
      description: true,
      category: true,
      pricingItems: true,
    });

    return !Object.values(newErrors).some(e => e && (typeof e === 'string' || Object.keys(e).length > 0));
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSave(formData, editService?.id);
      onClose();
    } catch (error) {
      console.error('Failed to save service:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Step validation helper
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0: // Basic Info
        const nameError = validateField('name', formData.name);
        const descError = validateField('description', formData.description);
        const catError = validateField('category', formData.category);
        setErrors(prev => ({
          ...prev,
          name: nameError,
          description: descError,
          category: catError,
        }));
        setTouched(prev => ({ ...prev, name: true, description: true, category: true }));
        return !nameError && !descError && !catError;
      case 1: // Pricing
        const pricingError = validateField('pricingItems', formData.pricingItems);
        setErrors(prev => ({ ...prev, pricingItems: pricingError }));
        setTouched(prev => ({ ...prev, pricingItems: true }));
        return !pricingError;
      case 2: // Add-ons (optional, always valid)
        return true;
      case 3: // Details
        if (currentCategory) {
          const detailErrors: Record<string, string> = {};
          currentCategory.fields.forEach(field => {
            if (field.required && !formData.details[field.name]) {
              detailErrors[field.name] = `${field.label} is required`;
            }
          });
          if (Object.keys(detailErrors).length > 0) {
            setErrors(prev => ({ ...prev, details: detailErrors }));
            return false;
          }
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep) && currentStep < wizardSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const activeSection = wizardSteps[currentStep].id as 'basic' | 'images' | 'pricing' | 'addons' | 'details';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-dark-900 border border-dark-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-800">
          <h2 className="text-xl font-semibold text-white">{isEditMode ? 'Edit Service' : 'Add New Service'}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-6 py-4 border-b border-dark-800">
          <div className="flex items-center justify-between">
            {wizardSteps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                {/* Step circle */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                      index < currentStep
                        ? 'bg-green-500 text-white'
                        : index === currentStep
                        ? 'bg-pink-500 text-white ring-4 ring-pink-500/20'
                        : 'bg-dark-700 text-gray-400'
                    }`}
                  >
                    {index < currentStep ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <p className={`text-sm font-medium ${
                      index === currentStep ? 'text-pink-400' : 'text-gray-400'
                    }`}>
                      {step.label}
                    </p>
                    <p className="text-xs text-gray-500 hidden sm:block">{step.description}</p>
                  </div>
                </div>
                
                {/* Connector line */}
                {index < wizardSteps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 ${
                    index < currentStep ? 'bg-green-500' : 'bg-dark-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Basic Info Section */}
          {activeSection === 'basic' && (
            <div className="space-y-6">
              {/* Category */}
              <div>
                <label className="block text-sm text-dark-300 mb-1.5">
                  Category <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  onBlur={() => handleBlur('category')}
                  className={`w-full px-4 py-3 rounded-xl border bg-dark-800 text-white focus:outline-none focus:ring-2 focus:ring-pink-400/20 focus:border-pink-400 ${
                    touched.category && errors.category ? 'border-red-500' : 'border-dark-700'
                  }`}
                >
                  <option value="">Select a category</option>
                  {Object.entries(SERVICE_CATEGORIES).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
                {touched.category && errors.category && (
                  <p className="mt-1.5 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.category}
                  </p>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm text-dark-300 mb-1.5">
                  Service Name <span className="text-red-400">*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  onBlur={() => handleBlur('name')}
                  placeholder="e.g., Premium Wedding Photography Package"
                  className={touched.name && errors.name ? 'border-red-500' : ''}
                />
                {touched.name && errors.name && (
                  <p className="mt-1.5 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm text-dark-300 mb-1.5">
                  Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  onBlur={() => handleBlur('description')}
                  placeholder="Describe what's included in your service package..."
                  rows={4}
                  className={`w-full px-4 py-3 rounded-xl border bg-dark-800 placeholder-dark-500 text-white focus:outline-none focus:ring-2 focus:ring-pink-400/20 focus:border-pink-400 resize-none ${
                    touched.description && errors.description ? 'border-red-500' : 'border-dark-700'
                  }`}
                />
                {touched.description && errors.description && (
                  <p className="mt-1.5 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.description}
                  </p>
                )}
              </div>

              {/* What's Included */}
              <div>
                <label className="block text-sm text-dark-300 mb-1.5">What&apos;s Included</label>
                <div className="space-y-2 mb-3">
                  {formData.inclusions.map((inclusion, index) => (
                    <div key={index} className="flex items-center gap-2 bg-dark-800 px-3 py-2 rounded-lg">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <span className="text-white flex-1">{inclusion}</span>
                      <button
                        type="button"
                        onClick={() => removeInclusion(index)}
                        className="text-gray-500 hover:text-red-400"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newInclusion}
                    onChange={(e) => setNewInclusion(e.target.value)}
                    placeholder="Add an inclusion..."
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addInclusion())}
                  />
                  <Button type="button" variant="outline" onClick={addInclusion}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Images Section */}
          {activeSection === 'images' && (
            <div className="space-y-6">
              <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700">
                <label className="block text-sm font-medium text-white mb-3">
                  <Image className="w-4 h-4 inline mr-2" />
                  Portfolio Images
                  <span className="text-gray-400 font-normal ml-2">(Showcase your work)</span>
                </label>
                
                {/* Upload Area */}
                <div 
                  className="border-2 border-dashed border-dark-600 rounded-xl p-8 text-center hover:border-pink-500/50 transition-colors cursor-pointer"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.multiple = true;
                    input.onchange = (e) => {
                      const files = (e.target as HTMLInputElement).files;
                      if (files) {
                        const newImages: ServiceImage[] = Array.from(files).map(file => ({
                          url: URL.createObjectURL(file),
                          file,
                          originalName: file.name,
                        }));
                        setFormData(prev => ({
                          ...prev,
                          images: [...prev.images, ...newImages].slice(0, 10), // Max 10 images
                        }));
                      }
                    };
                    input.click();
                  }}
                >
                  <Upload className="w-10 h-10 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-400 mb-1">Click to upload images</p>
                  <p className="text-xs text-gray-500">PNG, JPG, WebP up to 5MB each (max 10 images)</p>
                </div>
                
                {/* Image Previews */}
                {formData.images.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {formData.images.map((img, index) => (
                      <div key={index} className="relative group aspect-square rounded-lg overflow-hidden bg-dark-700">
                        <img 
                          src={getImageUrl(img.url)} 
                          alt={img.originalName || `Image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFormData(prev => ({
                                ...prev,
                                images: prev.images.filter((_, i) => i !== index),
                              }));
                            }}
                            className="p-2 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        {index === 0 && (
                          <span className="absolute top-2 left-2 px-2 py-0.5 bg-pink-500 text-white text-xs rounded">
                            Cover
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {formData.images.length === 0 && (
                  <div className="mt-4 text-center py-6 bg-dark-700/50 rounded-lg">
                    <p className="text-gray-500 text-sm">No images uploaded yet</p>
                    <p className="text-gray-600 text-xs mt-1">Add photos of your work to attract more couples!</p>
                  </div>
                )}
              </div>
              
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex gap-3">
                  <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-300">
                    <p className="font-medium text-blue-400 mb-1">Tips for great portfolio images:</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-400">
                      <li>Use high-quality, well-lit photos</li>
                      <li>The first image will be your cover photo</li>
                      <li>Show variety in your work</li>
                      <li>Include both wide shots and details</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pricing Breakdown Section */}
          {activeSection === 'pricing' && (
            <div className="space-y-6">
              {/* Total Summary */}
              <div className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calculator className="w-5 h-5 text-pink-400" />
                  <span className="text-white font-medium">Auto-Computed Total</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Base Price</p>
                    <p className="text-lg font-semibold text-white">{formatCurrency(computedTotals.baseTotal)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Add-ons</p>
                    <p className="text-lg font-semibold text-white">{formatCurrency(computedTotals.addOnsTotal)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Grand Total</p>
                    <p className="text-lg font-bold text-pink-400">{formatCurrency(computedTotals.grandTotal)}</p>
                  </div>
                </div>
              </div>

              {/* Info about pricing */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3">
                <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-300">
                  <p className="font-medium text-blue-400 mb-1">How Pricing Works</p>
                  <p>Add line items below with quantity, unit, and rate. The total is automatically calculated. Couples will see the full breakdown when they view your service.</p>
                </div>
              </div>

              {/* Pricing Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm text-dark-300">Pricing Line Items</label>
                  {errors.pricingItems && touched.pricingItems && (
                    <p className="text-sm text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.pricingItems}
                    </p>
                  )}
                </div>

                {/* Suggested items (show if category selected) */}
                {currentCategory && formData.pricingItems.length === 0 && (
                  <div className="mb-4 p-3 bg-dark-800 rounded-xl">
                    <p className="text-sm text-gray-400 mb-2">Quick add suggested items:</p>
                    <div className="flex flex-wrap gap-2">
                      {currentCategory.suggestedPricingItems.map((suggestion, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => addPricingItem(suggestion)}
                          className="px-3 py-1.5 text-sm bg-dark-700 hover:bg-dark-600 text-white rounded-lg transition-colors"
                        >
                          + {suggestion.description}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pricing items table */}
                <div className="space-y-3">
                  {formData.pricingItems.map((item) => (
                    <div key={item.id} className="bg-dark-800 rounded-xl p-4">
                      <div className="grid grid-cols-12 gap-3">
                        {/* Description */}
                        <div className="col-span-4">
                          <label className="block text-xs text-gray-500 mb-1">Description</label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updatePricingItem(item.id, 'description', e.target.value)}
                            placeholder="e.g., Photography Coverage"
                            className="w-full px-3 py-2 text-sm rounded-lg border border-dark-700 bg-dark-900 text-white focus:outline-none focus:border-pink-400"
                          />
                        </div>
                        {/* Quantity */}
                        <div className="col-span-2">
                          <label className="block text-xs text-gray-500 mb-1">Qty</label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updatePricingItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                            min="0"
                            step="1"
                            className="w-full px-3 py-2 text-sm rounded-lg border border-dark-700 bg-dark-900 text-white focus:outline-none focus:border-pink-400"
                          />
                        </div>
                        {/* Unit */}
                        <div className="col-span-2">
                          <label className="block text-xs text-gray-500 mb-1">Unit</label>
                          <select
                            value={item.unit}
                            onChange={(e) => updatePricingItem(item.id, 'unit', e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-dark-700 bg-dark-900 text-white focus:outline-none focus:border-pink-400"
                          >
                            {COMMON_UNITS.map(unit => (
                              <option key={unit} value={unit}>{unit}</option>
                            ))}
                          </select>
                        </div>
                        {/* Rate */}
                        <div className="col-span-2">
                          <label className="block text-xs text-gray-500 mb-1">Rate (₱)</label>
                          <input
                            type="number"
                            value={item.rate || ''}
                            onChange={(e) => updatePricingItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                            min="0"
                            placeholder="0"
                            className="w-full px-3 py-2 text-sm rounded-lg border border-dark-700 bg-dark-900 text-white focus:outline-none focus:border-pink-400"
                          />
                        </div>
                        {/* Total & Delete */}
                        <div className="col-span-2 flex items-end gap-2">
                          <div className="flex-1">
                            <label className="block text-xs text-gray-500 mb-1">Total</label>
                            <div className="px-3 py-2 text-sm rounded-lg bg-dark-700 text-pink-400 font-medium">
                              {formatCurrency(item.quantity * item.rate)}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removePricingItem(item.id)}
                            className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add item button */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addPricingItem()}
                  className="w-full mt-3"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Pricing Item
                </Button>
              </div>
            </div>
          )}

          {/* Add-ons Section */}
          {activeSection === 'addons' && (
            <div className="space-y-6">
              {/* Info */}
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 flex gap-3">
                <DollarSign className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-300">
                  <p className="font-medium text-purple-400 mb-1">Optional Add-ons</p>
                  <p>Add-ons are optional extras that couples can select when booking. They&apos;ll see these as selectable options with prices.</p>
                </div>
              </div>

              {/* Suggested add-ons */}
              {currentCategory && formData.addOns.length === 0 && (
                <div className="p-3 bg-dark-800 rounded-xl">
                  <p className="text-sm text-gray-400 mb-2">Quick add suggested add-ons:</p>
                  <div className="flex flex-wrap gap-2">
                    {currentCategory.suggestedAddOns.map((suggestion, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => addAddOn(suggestion)}
                        className="px-3 py-1.5 text-sm bg-dark-700 hover:bg-dark-600 text-white rounded-lg transition-colors"
                      >
                        + {suggestion.name} {suggestion.suggestedPrice && `(₱${suggestion.suggestedPrice.toLocaleString()})`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Add-ons list */}
              <div className="space-y-3">
                {formData.addOns.map((addon) => (
                  <div key={addon.id} className="bg-dark-800 rounded-xl p-4 flex items-center gap-4">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">Add-on Name</label>
                      <input
                        type="text"
                        value={addon.name}
                        onChange={(e) => updateAddOn(addon.id, 'name', e.target.value)}
                        placeholder="e.g., Engagement Shoot"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-dark-700 bg-dark-900 text-white focus:outline-none focus:border-pink-400"
                      />
                    </div>
                    <div className="w-32">
                      <label className="block text-xs text-gray-500 mb-1">Price (₱)</label>
                      <input
                        type="number"
                        value={addon.price || ''}
                        onChange={(e) => updateAddOn(addon.id, 'price', parseFloat(e.target.value) || 0)}
                        min="0"
                        placeholder="0"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-dark-700 bg-dark-900 text-white focus:outline-none focus:border-pink-400"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAddOn(addon.id)}
                      className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors mt-5"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add button */}
              <Button
                type="button"
                variant="outline"
                onClick={() => addAddOn()}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Custom Add-on
              </Button>

              {/* Add-ons total */}
              {formData.addOns.length > 0 && (
                <div className="bg-dark-800 rounded-xl p-4 flex items-center justify-between">
                  <span className="text-gray-400">Total Add-ons Value:</span>
                  <span className="text-lg font-semibold text-purple-400">
                    {formatCurrency(computedTotals.addOnsTotal)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Details Section */}
          {activeSection === 'details' && (
            <div className="space-y-6">
              {currentCategory ? (
                <>
                  <p className="text-sm text-gray-400">
                    Provide details specific to your {currentCategory.label.toLowerCase()} service.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    {currentCategory.fields.map((field) => (
                      <div key={field.name} className={field.type === 'checkbox' ? 'col-span-2' : ''}>
                        {field.type === 'checkbox' ? (
                          <label className="flex items-center gap-3 cursor-pointer p-3 bg-dark-800 rounded-xl hover:bg-dark-700 transition-colors">
                            <div className="relative">
                              <input
                                type="checkbox"
                                checked={!!formData.details[field.name]}
                                onChange={(e) => handleDetailChange(field.name, e.target.checked)}
                                className="sr-only"
                              />
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                formData.details[field.name] 
                                  ? 'bg-pink-500 border-pink-500' 
                                  : 'border-dark-600 bg-dark-800'
                              }`}>
                                {formData.details[field.name] && <Check className="w-3 h-3 text-white" />}
                              </div>
                            </div>
                            <span className="text-white">{field.label}</span>
                          </label>
                        ) : field.type === 'select' ? (
                          <div>
                            <label className="block text-sm text-dark-300 mb-1.5">
                              {field.label} {field.required && <span className="text-red-400">*</span>}
                            </label>
                            <select
                              value={(formData.details[field.name] as string) || ''}
                              onChange={(e) => handleDetailChange(field.name, e.target.value)}
                              className={`w-full px-4 py-3 rounded-xl border bg-dark-800 text-white focus:outline-none focus:ring-2 focus:ring-pink-400/20 focus:border-pink-400 ${
                                errors.details?.[field.name] ? 'border-red-500' : 'border-dark-700'
                              }`}
                            >
                              <option value="">Select...</option>
                              {field.options?.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                            {errors.details?.[field.name] && (
                              <p className="mt-1 text-sm text-red-400">{errors.details[field.name]}</p>
                            )}
                          </div>
                        ) : (
                          <div>
                            <label className="block text-sm text-dark-300 mb-1.5">
                              {field.label} {field.required && <span className="text-red-400">*</span>}
                            </label>
                            <input
                              type={field.type}
                              placeholder={field.placeholder}
                              value={(formData.details[field.name] as string) || ''}
                              onChange={(e) => handleDetailChange(field.name, e.target.value)}
                              className={`w-full px-4 py-3 rounded-xl border bg-dark-800 placeholder-dark-500 text-white focus:outline-none focus:ring-2 focus:ring-pink-400/20 focus:border-pink-400 ${
                                errors.details?.[field.name] ? 'border-red-500' : 'border-dark-700'
                              }`}
                            />
                            {errors.details?.[field.name] && (
                              <p className="mt-1 text-sm text-red-400">{errors.details[field.name]}</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <Info className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a category first to see specific details</p>
                </div>
              )}

              {/* Max Bookings Per Day - Common for all categories */}
              <div className="border-t border-dark-700 pt-6 mt-6">
                <h4 className="text-white font-medium mb-3">Booking Limits</h4>
                <div>
                  <label className="block text-sm text-dark-300 mb-1.5">
                    Maximum Bookings Per Day <span className="text-red-400">*</span>
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={formData.max_bookings_per_day || 1}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        max_bookings_per_day: Math.max(1, Math.min(10, parseInt(e.target.value) || 1))
                      }))}
                      className="w-24 px-4 py-3 rounded-xl border border-dark-700 bg-dark-800 text-white text-center focus:outline-none focus:ring-2 focus:ring-pink-400/20 focus:border-pink-400"
                    />
                    <span className="text-gray-400 text-sm">bookings per day</span>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Limit how many couples can book this service on the same day
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-dark-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              {computedTotals.baseTotal > 0 && (
                <span>
                  Service Total: <span className="text-pink-400 font-semibold">{formatCurrency(computedTotals.baseTotal)}</span>
                  {computedTotals.addOnsTotal > 0 && (
                    <span className="text-gray-500"> (+{formatCurrency(computedTotals.addOnsTotal)} in add-ons)</span>
                  )}
                </span>
              )}
            </div>
            <div className="flex gap-3">
              {currentStep > 0 && (
                <Button variant="ghost" onClick={handlePrevious} disabled={isSubmitting}>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
              )}
              {currentStep === 0 && (
                <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
                  Cancel
                </Button>
              )}
              {currentStep < wizardSteps.length - 1 ? (
                <Button onClick={handleNext}>
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : isEditMode ? 'Update Service' : 'Save Service'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
