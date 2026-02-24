'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';

export interface GeoPoint {
  city: string;
  lat: number;
  lng: number;
  views: number;
  sessions: number;
}

interface MapProps {
  data: GeoPoint[];
}

// Dynamically import the map component with no SSR
const LeafletMap: ComponentType<MapProps> = dynamic(
  () => import('./LeafletMapInner'),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center bg-dark-900 rounded-lg">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-400"></div>
      </div>
    ),
  }
) as ComponentType<MapProps>;

interface GeographicMapProps {
  data: GeoPoint[];
  className?: string;
}

export default function GeographicMap({ data, className = '' }: GeographicMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`bg-dark-900 rounded-lg ${className}`} style={{ minHeight: '500px' }}>
        <div className="h-full w-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-400"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg overflow-hidden ${className}`} style={{ minHeight: '500px' }}>
      <LeafletMap data={data} />
    </div>
  );
}
