/// <reference types="@types/google.maps" />
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { MapPin, Navigation, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { GoogleMap, LoadScript, Marker, Autocomplete } from '@react-google-maps/api';

interface LocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  onLocationChange: (lat: number, lng: number) => void;
  onAddressChange?: (address: { 
    address_line1?: string;
    city?: string;
    province?: string;
    postal_code?: string;
  }) => void;
}

const libraries: ("places")[] = ["places"];

const mapContainerStyle = {
  width: '100%',
  height: '320px',
  borderRadius: '12px',
};

const defaultCenter = {
  lat: 14.5995, // Manila
  lng: 120.9842,
};

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  styles: [
    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
    { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
    { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
    { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
    { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
    { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
    { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
    { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
    { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
    { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
    { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] },
  ],
};

export function LocationPicker({ 
  latitude, 
  longitude, 
  onLocationChange,
  onAddressChange 
}: LocationPickerProps) {
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentLat = latitude || defaultCenter.lat;
  const currentLng = longitude || defaultCenter.lng;
  const hasLocation = latitude !== null && longitude !== null;

  const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  }, []);

  const onAutocompleteLoad = useCallback((autocompleteInstance: google.maps.places.Autocomplete) => {
    setAutocomplete(autocompleteInstance);
  }, []);

  const onPlaceChanged = useCallback(() => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      
      if (place.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        
        onLocationChange(lat, lng);
        
        // Pan map to location
        if (map) {
          map.panTo({ lat, lng });
          map.setZoom(16);
        }
        
        // Parse address components
        if (onAddressChange && place.address_components) {
          const addressData: {
            address_line1?: string;
            city?: string;
            province?: string;
            postal_code?: string;
          } = {};

          place.address_components.forEach((component) => {
            const types = component.types;
            
            if (types.includes('street_number') || types.includes('route') || types.includes('premise')) {
              addressData.address_line1 = (addressData.address_line1 || '') + component.long_name + ' ';
            }
            if (types.includes('sublocality') || types.includes('neighborhood')) {
              addressData.address_line1 = (addressData.address_line1 || '') + component.long_name;
            }
            if (types.includes('locality') || types.includes('administrative_area_level_2')) {
              addressData.city = component.long_name;
            }
            if (types.includes('administrative_area_level_1')) {
              addressData.province = component.long_name;
            }
            if (types.includes('postal_code')) {
              addressData.postal_code = component.long_name;
            }
          });

          // If no address line, use formatted address
          if (!addressData.address_line1 && place.formatted_address) {
            addressData.address_line1 = place.formatted_address.split(',')[0];
          }

          onAddressChange(addressData);
        }
      }
    }
  }, [autocomplete, map, onLocationChange, onAddressChange]);

  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      
      onLocationChange(lat, lng);
      
      // Reverse geocode to get address
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results && results[0] && onAddressChange) {
          const place = results[0];
          const addressData: {
            address_line1?: string;
            city?: string;
            province?: string;
            postal_code?: string;
          } = {};

          place.address_components?.forEach((component) => {
            const types = component.types;
            
            if (types.includes('street_number') || types.includes('route')) {
              addressData.address_line1 = (addressData.address_line1 || '') + component.long_name + ' ';
            }
            if (types.includes('sublocality') || types.includes('neighborhood')) {
              addressData.address_line1 = (addressData.address_line1 || '') + component.long_name;
            }
            if (types.includes('locality') || types.includes('administrative_area_level_2')) {
              addressData.city = component.long_name;
            }
            if (types.includes('administrative_area_level_1')) {
              addressData.province = component.long_name;
            }
            if (types.includes('postal_code')) {
              addressData.postal_code = component.long_name;
            }
          });

          if (!addressData.address_line1) {
            addressData.address_line1 = place.formatted_address?.split(',')[0];
          }

          onAddressChange(addressData);
        }
      });
    }
  }, [onLocationChange, onAddressChange]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    setIsGettingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        
        onLocationChange(lat, lng);
        
        // Pan map to location
        if (map) {
          map.panTo({ lat, lng });
          map.setZoom(16);
        }
        
        // Reverse geocode to get address
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === 'OK' && results && results[0] && onAddressChange) {
            const place = results[0];
            const addressData: {
              address_line1?: string;
              city?: string;
              province?: string;
              postal_code?: string;
            } = {};

            place.address_components?.forEach((component) => {
              const types = component.types;
              
              if (types.includes('street_number') || types.includes('route')) {
                addressData.address_line1 = (addressData.address_line1 || '') + component.long_name + ' ';
              }
              if (types.includes('sublocality') || types.includes('neighborhood')) {
                addressData.address_line1 = (addressData.address_line1 || '') + component.long_name;
              }
              if (types.includes('locality') || types.includes('administrative_area_level_2')) {
                addressData.city = component.long_name;
              }
              if (types.includes('administrative_area_level_1')) {
                addressData.province = component.long_name;
              }
              if (types.includes('postal_code')) {
                addressData.postal_code = component.long_name;
              }
            });

            if (!addressData.address_line1) {
              addressData.address_line1 = place.formatted_address?.split(',')[0];
            }

            onAddressChange(addressData);
          }
        });
        
        setIsGettingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        setLocationError('Unable to get your location. Please search or click on the map.');
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="w-full h-80 bg-dark-800 rounded-xl flex items-center justify-center">
        <p className="text-red-400">Google Maps API key not configured</p>
      </div>
    );
  }

  return (
    <LoadScript googleMapsApiKey={apiKey} libraries={libraries}>
      <div className="space-y-4">
        {/* Search Bar with Places Autocomplete */}
        <Autocomplete
          onLoad={onAutocompleteLoad}
          onPlaceChanged={onPlaceChanged}
          options={{
            componentRestrictions: { country: 'ph' },
            types: ['establishment', 'geocode'],
          }}
        >
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-500" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search places, venues, hotels, malls..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-dark-700 bg-dark-800 placeholder-dark-500 text-white focus:outline-none focus:ring-2 focus:ring-pink-400/20 focus:border-pink-400"
            />
          </div>
        </Autocomplete>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <MapPin className="w-4 h-4" />
            <span>Click on the map to set location</span>
          </div>
          <Button
            onClick={getCurrentLocation}
            disabled={isGettingLocation}
            size="sm"
            className="flex items-center gap-2"
          >
            <Navigation className="w-4 h-4" />
            {isGettingLocation ? 'Getting...' : 'Use My Location'}
          </Button>
        </div>

        {/* Error message */}
        {locationError && (
          <div className="text-sm text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2">
            {locationError}
          </div>
        )}

        {/* Map */}
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={{ lat: currentLat, lng: currentLng }}
          zoom={hasLocation ? 16 : 12}
          onClick={handleMapClick}
          onLoad={onMapLoad}
          options={mapOptions}
        >
          {hasLocation && (
            <Marker
              position={{ lat: currentLat, lng: currentLng }}
              icon={{
                url: 'data:image/svg+xml,' + encodeURIComponent(`
                  <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="20" cy="20" r="18" fill="#ec4899" stroke="#ffffff" stroke-width="3"/>
                    <circle cx="20" cy="20" r="6" fill="#ffffff"/>
                  </svg>
                `),
                scaledSize: new google.maps.Size(40, 40),
                anchor: new google.maps.Point(20, 20),
              }}
            />
          )}
        </GoogleMap>

        {/* Selected location info */}
        {hasLocation && (
          <div className="text-sm text-gray-400 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-pink-400" />
            <span>
              Location set: {currentLat.toFixed(6)}, {currentLng.toFixed(6)}
            </span>
          </div>
        )}
      </div>
    </LoadScript>
  );
}

export default LocationPicker;
