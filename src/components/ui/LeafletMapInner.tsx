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
  const heatPointsRef = useRef<[number, number, number][]>([]);

  // Calculate radius based on zoom level to maintain consistent geographic size
  const getRadiusForZoom = (zoom: number): number => {
    // Base radius at zoom 6, scale exponentially
    const baseZoom = 6;
    const baseRadius = 50;
    const scaleFactor = Math.pow(2, zoom - baseZoom);
    return Math.max(15, Math.min(100, baseRadius * scaleFactor));
  };

  const getBlurForZoom = (zoom: number): number => {
    const baseZoom = 6;
    const baseBlur = 30;
    const scaleFactor = Math.pow(2, zoom - baseZoom);
    return Math.max(10, Math.min(60, baseBlur * scaleFactor));
  };

  // Function to update heat layer
  const updateHeatLayer = (map: L.Map, points: [number, number, number][]) => {
    // Remove existing heat layer
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    if (points.length === 0) return;

    const zoom = map.getZoom();
    const radius = getRadiusForZoom(zoom);
    const blur = getBlurForZoom(zoom);

    // Create heat layer with pink/magenta gradient
    const heat = L.heatLayer(points, {
      radius: radius,
      blur: blur,
      maxZoom: 18,
      minOpacity: 0.5,
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
  };

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

    // Update heat layer on zoom change
    map.on('zoomend', () => {
      if (heatPointsRef.current.length > 0) {
        updateHeatLayer(map, heatPointsRef.current);
      }
    });

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

    // Clear existing markers
    if (markersLayerRef.current) {
      markersLayerRef.current.clearLayers();
    }

    if (data.length === 0) {
      heatPointsRef.current = [];
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
      return;
    }

    // Find max views for scaling intensity
    const maxViews = Math.max(...data.map(p => p.views));

    // Create heat data points: [lat, lng, intensity]
    const heatPoints: [number, number, number][] = [];
    
    data.forEach((point) => {
      const intensity = point.views / maxViews;
      // Add the main point with full intensity
      heatPoints.push([point.lat, point.lng, intensity]);
      
      // Add surrounding points for better heat spread on high-traffic areas
      const spreadCount = Math.max(1, Math.round(intensity * 8));
      for (let i = 0; i < spreadCount; i++) {
        const angle = (i / spreadCount) * Math.PI * 2;
        const distance = 0.15 + Math.random() * 0.2; // Geographic spread ~15-35km
        heatPoints.push([
          point.lat + Math.sin(angle) * distance,
          point.lng + Math.cos(angle) * distance,
          intensity * 0.6 // Lower intensity for spread points
        ]);
      }
    });

    // Store for zoom updates
    heatPointsRef.current = heatPoints;

    // Create initial heat layer
    updateHeatLayer(map, heatPoints);

    // Add small markers for city labels (on top of heat layer)
    data.forEach((point) => {
      const marker = L.circleMarker([point.lat, point.lng], {
        radius: 5,
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
