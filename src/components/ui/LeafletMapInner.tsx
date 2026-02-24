'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';

// Extend Leaflet types for heat layer
declare module 'leaflet' {
  function heatLayer(
    latlngs: Array<[number, number, number?]>,
    options?: {
      minOpacity?: number;
      maxZoom?: number;
      max?: number;
      radius?: number;
      blur?: number;
      gradient?: { [key: number]: string };
    }
  ): L.Layer;
}

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
  const heatLayerRef = useRef<L.Layer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

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

    // Create markers layer group
    markersLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update heatmap when data changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove existing heat layer
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    // Clear existing markers
    if (markersLayerRef.current) {
      markersLayerRef.current.clearLayers();
    }

    if (data.length === 0) return;

    // Find max views for scaling intensity
    const maxViews = Math.max(...data.map(p => p.views));

    // Create heat data points: [lat, lng, intensity]
    // Multiply points for denser areas to create proper heat effect
    const heatPoints: [number, number, number][] = [];
    
    data.forEach((point) => {
      const intensity = point.views / maxViews;
      // Add multiple points at same location for higher intensity areas
      const pointCount = Math.max(1, Math.round(intensity * 10));
      for (let i = 0; i < pointCount; i++) {
        // Add slight random offset for better heat spread
        const latOffset = (Math.random() - 0.5) * 0.3;
        const lngOffset = (Math.random() - 0.5) * 0.3;
        heatPoints.push([
          point.lat + latOffset,
          point.lng + lngOffset,
          intensity
        ]);
      }
    });

    // Create heat layer with pink/magenta gradient
    const heat = L.heatLayer(heatPoints, {
      radius: 35,
      blur: 25,
      maxZoom: 10,
      minOpacity: 0.4,
      max: 1.0,
      gradient: {
        0.0: '#1e1b4b',   // Dark purple (cold)
        0.2: '#4c1d95',   // Purple
        0.4: '#7c3aed',   // Violet
        0.5: '#a855f7',   // Light violet
        0.6: '#d946ef',   // Fuchsia
        0.7: '#ec4899',   // Pink-500
        0.8: '#f472b6',   // Pink-400
        0.9: '#f9a8d4',   // Pink-300
        1.0: '#fce7f3',   // Pink-100 (hot)
      }
    });

    heat.addTo(map);
    heatLayerRef.current = heat;

    // Add small markers for city labels (on top of heat layer)
    data.forEach((point) => {
      const marker = L.circleMarker([point.lat, point.lng], {
        radius: 4,
        fillColor: '#ffffff',
        color: '#ec4899',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.9,
      });

      // Add popup with details
      marker.bindPopup(`
        <div style="text-align: center; min-width: 120px;">
          <strong style="font-size: 14px;">${point.city}</strong><br/>
          <span style="color: #ec4899; font-weight: bold;">${point.views.toLocaleString()}</span> views<br/>
          <span style="color: #9ca3af;">${point.sessions.toLocaleString()} sessions</span>
        </div>
      `);

      // Show tooltip on hover
      marker.bindTooltip(point.city, {
        permanent: false,
        direction: 'top',
        className: 'custom-tooltip'
      });

      if (markersLayerRef.current) {
        markersLayerRef.current.addLayer(marker);
      }
    });

    // Fit bounds to data if we have points
    if (data.length > 0) {
      const bounds = L.latLngBounds(data.map(p => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 8 });
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
