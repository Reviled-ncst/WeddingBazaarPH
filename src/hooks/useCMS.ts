import { useState, useEffect } from 'react';

interface SiteSettings {
  contact: {
    email?: string;
    phone?: string;
    address?: string;
  };
  social: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    pinterest?: string;
  };
  branding: {
    site_name?: string;
    tagline?: string;
    logo_url?: string;
  };
  footer: {
    copyright_text?: string;
    footer_links?: string;
  };
}

interface LandingSection {
  id: number;
  section_key: string;
  title: string;
  subtitle: string;
  content: Record<string, unknown> | string;
  background_image: string;
  is_active: number;
  sort_order: number;
}

interface CMSData {
  settings: SiteSettings | null;
  sections: Record<string, LandingSection>;
  isLoading: boolean;
  error: string | null;
}

const defaultSettings: SiteSettings = {
  contact: {
    email: 'support@weddingbazaar.ph',
    phone: '+63 917 123 4567',
    address: 'Manila, Philippines'
  },
  social: {
    facebook: 'https://facebook.com/weddingbazaarph',
    instagram: 'https://instagram.com/weddingbazaarph'
  },
  branding: {
    site_name: 'Wedding Bazaar',
    tagline: 'Your Perfect Wedding, One Click Away'
  },
  footer: {
    copyright_text: '© 2024 Wedding Bazaar PH. All rights reserved.'
  }
};

export function useCMS(): CMSData {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [sections, setSections] = useState<Record<string, LandingSection>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCMSData = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        
        // Fetch settings and sections in parallel
        const [settingsRes, sectionsRes] = await Promise.all([
          fetch(`${apiUrl}/settings/public.php`).catch(() => null),
          fetch(`${apiUrl}/landing/sections.php`).catch(() => null)
        ]);

        if (settingsRes?.ok) {
          const settingsData = await settingsRes.json();
          if (settingsData.success) {
            setSettings(settingsData.data);
          }
        }

        if (sectionsRes?.ok) {
          const sectionsData = await sectionsRes.json();
          if (sectionsData.success && sectionsData.data.keyed) {
            setSections(sectionsData.data.keyed);
          }
        }
      } catch (err) {
        console.error('Failed to fetch CMS data:', err);
        setError('Failed to load CMS data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCMSData();
  }, []);

  return {
    settings: settings || defaultSettings,
    sections,
    isLoading,
    error
  };
}

// Helper to get a specific setting value
export function useSetting<T>(group: keyof SiteSettings, key: string, defaultValue: T): T {
  const { settings } = useCMS();
  
  if (!settings || !settings[group]) {
    return defaultValue;
  }
  
  const groupSettings = settings[group] as Record<string, unknown>;
  return (groupSettings[key] as T) ?? defaultValue;
}

// Helper to get a specific section
export function useSection(sectionKey: string): LandingSection | null {
  const { sections } = useCMS();
  return sections[sectionKey] || null;
}
