'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface GeoPoint {
  city: string;
  lat: number;
  lng: number;
  views: number;
  sessions: number;
}

interface LeafletMapInnerProps {
  data: GeoPoint[];
}

export default function LeafletMapInner({ data }: LeafletMapInnerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map centered on Philippines
    const map = L.map(mapRef.current, {
      center: [12.8797, 121.7740], // Center of Philippines
      zoom: 6,
      minZoom: 5,
      maxZoom: 18,
      zoomControl: true,
    });

    // Use a dark theme tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers when data changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.CircleMarker) {
        map.removeLayer(layer);
      }
    });

    if (data.length === 0) return;

    // Find max views for scaling
    const maxViews = Math.max(...data.map(p => p.views));

    // Add markers for each location
    data.forEach((point) => {
      const intensity = point.views / maxViews;
      const radius = 8 + intensity * 25; // 8-33px radius
      
      // Create a circle marker with pink heatmap style
      const circle = L.circleMarker([point.lat, point.lng], {
        radius: radius,
        fillColor: '#ec4899', // Pink-500
        color: '#be185d', // Pink-700
        weight: 2,
        opacity: 0.8,
        fillOpacity: 0.3 + intensity * 0.5, // 0.3-0.8 opacity based on intensity
      }).addTo(map);

      // Add popup with details
      circle.bindPopup(`
        <div style="text-align: center; min-width: 120px;">
          <strong style="font-size: 14px;">${point.city}</strong><br/>
          <span style="color: #ec4899; font-weight: bold;">${point.views.toLocaleString()}</span> views<br/>
          <span style="color: #9ca3af;">${point.sessions.toLocaleString()} sessions</span>
        </div>
      `);

      // Show tooltip on hover
      circle.bindTooltip(point.city, {
        permanent: false,
        direction: 'top',
        className: 'custom-tooltip'
      });
    });

    // Fit bounds to data if we have points
    if (data.length > 0) {
      const bounds = L.latLngBounds(data.map(p => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
    }
  }, [data]);

  return (
    <>
      <style jsx global>{`
        .leaflet-container {
          background: #1a1a2e;
          font-family: inherit;
        }
        .leaflet-popup-content-wrapper {
          background: #1f2937;
          color: white;
          border-radius: 8px;
        }
        .leaflet-popup-content {
          margin: 10px 12px;
        }
        .leaflet-popup-tip {
          background: #1f2937;
        }
        .custom-tooltip {
          background: #1f2937;
          color: white;
          border: 1px solid #374151;
          border-radius: 4px;
          padding: 4px 8px;
          font-size: 12px;
        }
        .leaflet-control-zoom a {
          background: #1f2937 !important;
          color: white !important;
          border-color: #374151 !important;
        }
        .leaflet-control-zoom a:hover {
          background: #374151 !important;
        }
        .leaflet-control-attribution {
          background: rgba(31, 41, 55, 0.8) !important;
          color: #9ca3af !important;
        }
        .leaflet-control-attribution a {
          color: #ec4899 !important;
        }
      `}</style>
      <div ref={mapRef} style={{ width: '100%', height: '100%', minHeight: '500px' }} />
    </>
  );
}
