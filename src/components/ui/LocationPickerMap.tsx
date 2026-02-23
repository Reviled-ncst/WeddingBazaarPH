'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface LocationPickerMapProps {
  latitude: number;
  longitude: number;
  onLocationChange: (lat: number, lng: number) => void;
  hasLocation: boolean;
  zoomToLocation?: boolean; // Trigger animated zoom to location
}

// Custom marker icon with precise accuracy indicator
const createMarkerIcon = () => {
  return L.divIcon({
    className: 'custom-marker-container',
    html: `
      <div style="position: relative; width: 60px; height: 70px;">
        <!-- Pulsing accuracy ring at exact location point -->
        <div style="
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: rgba(236, 72, 153, 0.3);
          animation: pulse 2s ease-out infinite;
        "></div>
        
        <!-- Precise dot at exact location -->
        <div style="
          position: absolute;
          bottom: 4px;
          left: 50%;
          transform: translateX(-50%);
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ec4899;
          border: 2px solid white;
          box-shadow: 0 0 4px rgba(0,0,0,0.5);
          z-index: 10;
        "></div>
        
        <!-- Pin shadow -->
        <div style="
          position: absolute;
          bottom: -2px;
          left: 50%;
          transform: translateX(-50%);
          width: 20px;
          height: 6px;
          border-radius: 50%;
          background: rgba(0,0,0,0.2);
          filter: blur(2px);
        "></div>
        
        <!-- Main pin marker -->
        <svg style="
          position: absolute;
          bottom: 6px;
          left: 50%;
          transform: translateX(-50%);
          width: 36px;
          height: 48px;
          filter: drop-shadow(0 3px 3px rgba(0,0,0,0.3));
        " viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Pin body with gradient -->
          <defs>
            <linearGradient id="pinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#f472b6"/>
              <stop offset="100%" style="stop-color:#db2777"/>
            </linearGradient>
          </defs>
          <path d="M12 0C6.48 0 2 4.48 2 10c0 7 10 18 10 18s10-11 10-18c0-5.52-4.48-10-10-10z" fill="url(#pinGradient)"/>
          <path d="M12 0C6.48 0 2 4.48 2 10c0 7 10 18 10 18s10-11 10-18c0-5.52-4.48-10-10-10z" fill="none" stroke="white" stroke-width="1" opacity="0.5"/>
          <!-- Inner circle -->
          <circle cx="12" cy="10" r="5" fill="white"/>
          <circle cx="12" cy="10" r="3" fill="#db2777"/>
        </svg>
      </div>
      
      <style>
        @keyframes pulse {
          0% {
            transform: translateX(-50%) scale(1);
            opacity: 0.8;
          }
          100% {
            transform: translateX(-50%) scale(3);
            opacity: 0;
          }
        }
      </style>
    `,
    iconSize: [60, 70],
    iconAnchor: [30, 70], // Anchor at the bottom center where the precise dot is
  });
};

export default function LocationPickerMap({ 
  latitude, 
  longitude, 
  onLocationChange,
  hasLocation,
  zoomToLocation = false
}: LocationPickerMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Create map
    const map = L.map(containerRef.current, {
      center: [latitude, longitude],
      zoom: hasLocation ? 15 : 12,
      zoomControl: true,
    });

    // Add dark tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    // Add marker if location exists
    if (hasLocation) {
      const marker = L.marker([latitude, longitude], {
        icon: createMarkerIcon(),
        draggable: true,
      }).addTo(map);

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        onLocationChange(pos.lat, pos.lng);
      });

      markerRef.current = marker;
    }

    // Click handler for setting location
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      onLocationChange(lat, lng);
    });

    mapRef.current = map;
    setIsMapReady(true);

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Update marker position when coordinates change
  useEffect(() => {
    if (!mapRef.current || !isMapReady) return;

    const map = mapRef.current;

    // Update or create marker
    if (markerRef.current) {
      markerRef.current.setLatLng([latitude, longitude]);
    } else {
      const marker = L.marker([latitude, longitude], {
        icon: createMarkerIcon(),
        draggable: true,
      }).addTo(map);

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        onLocationChange(pos.lat, pos.lng);
      });

      markerRef.current = marker;
    }

    // Pan to new location (without animation normally)
    if (!zoomToLocation) {
      map.setView([latitude, longitude], map.getZoom());
    }
  }, [latitude, longitude, isMapReady, onLocationChange, zoomToLocation]);

  // Handle animated zoom-in when using current location
  useEffect(() => {
    if (!mapRef.current || !isMapReady || !zoomToLocation) return;

    const map = mapRef.current;
    
    // Fly to location with smooth animation and zoom to street level
    map.flyTo([latitude, longitude], 17, {
      animate: true,
      duration: 1.5, // 1.5 seconds animation
    });
  }, [latitude, longitude, zoomToLocation, isMapReady]);

  return (
    <>
      {/* Global styles for marker animation and map cursor */}
      <style jsx global>{`
        .leaflet-container {
          cursor: crosshair !important;
        }
        .leaflet-marker-draggable {
          cursor: move !important;
        }
        .custom-marker-container {
          background: transparent !important;
          border: none !important;
        }
        @keyframes markerPulse {
          0% {
            transform: translateX(-50%) scale(1);
            opacity: 0.8;
          }
          100% {
            transform: translateX(-50%) scale(3);
            opacity: 0;
          }
        }
      `}</style>
      <div 
        ref={containerRef} 
        className="w-full h-80 rounded-xl overflow-hidden border border-dark-700"
        style={{ minHeight: '320px' }}
      />
    </>
  );
}
