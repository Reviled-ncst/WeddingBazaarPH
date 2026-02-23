'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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

interface CMSContextValue {
  settings: SiteSettings;
  sections: Record<string, LandingSection>;
  isLoading: boolean;
  getSection: (key: string) => LandingSection | null;
  getSetting: <T>(group: keyof SiteSettings, key: string, defaultValue: T) => T;
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

const CMSContext = createContext<CMSContextValue>({
  settings: defaultSettings,
  sections: {},
  isLoading: true,
  getSection: () => null,
  getSetting: (_, __, defaultValue) => defaultValue
});

export function CMSProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [sections, setSections] = useState<Record<string, LandingSection>>({});
  const [isLoading, setIsLoading] = useState(true);

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
            // Merge with defaults
            setSettings({
              ...defaultSettings,
              ...settingsData.data
            });
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
      } finally {
        setIsLoading(false);
      }
    };

    fetchCMSData();
  }, []);

  const getSection = (key: string): LandingSection | null => {
    return sections[key] || null;
  };

  const getSetting = <T,>(group: keyof SiteSettings, key: string, defaultValue: T): T => {
    if (!settings[group]) {
      return defaultValue;
    }
    const groupSettings = settings[group] as Record<string, unknown>;
    return (groupSettings[key] as T) ?? defaultValue;
  };

  return (
    <CMSContext.Provider value={{ settings, sections, isLoading, getSection, getSetting }}>
      {children}
    </CMSContext.Provider>
  );
}

export function useCMSContext() {
  return useContext(CMSContext);
}
