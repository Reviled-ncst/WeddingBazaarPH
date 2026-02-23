'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { MapPin, Navigation, Crosshair, Search, X, Loader2, Clock } from 'lucide-react';
import { Button } from './Button';

// Dynamic import for Leaflet to avoid SSR issues
import dynamic from 'next/dynamic';

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

interface SearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type?: string; // e.g., restaurant, hotel, mall
  class?: string; // e.g., amenity, shop, tourism
  name?: string; // Establishment name
  address?: {
    road?: string;
    street?: string;
    suburb?: string;
    city?: string;
    town?: string;
    municipality?: string;
    village?: string;
    state?: string;
    region?: string;
    province?: string;
    postcode?: string;
  };
  namedetails?: {
    name?: string;
    'name:en'?: string;
  };
}

// Helper to extract short location name
const getShortName = (result: SearchResult): string => {
  // Try to get establishment name first
  if (result.namedetails?.name) return result.namedetails.name;
  if (result.namedetails?.['name:en']) return result.namedetails['name:en'];
  if (result.name) return result.name;
  
  // Extract from display_name (first part before comma)
  const parts = result.display_name.split(',');
  return parts[0].trim();
};

// Helper to get location type label
const getLocationTypeLabel = (result: SearchResult): string | null => {
  if (!result.type || result.type === 'yes') return null;
  
  // Map common types to friendly labels
  const typeMap: Record<string, string> = {
    restaurant: 'Restaurant',
    cafe: 'Cafe',
    hotel: 'Hotel',
    mall: 'Shopping Mall',
    supermarket: 'Supermarket',
    hospital: 'Hospital',
    school: 'School',
    church: 'Church',
    bank: 'Bank',
    pharmacy: 'Pharmacy',
    fuel: 'Gas Station',
    fast_food: 'Fast Food',
    bar: 'Bar',
    nightclub: 'Nightclub',
    cinema: 'Cinema',
    gym: 'Gym',
    spa: 'Spa',
    beauty: 'Beauty Salon',
    hairdresser: 'Hair Salon',
    wedding: 'Wedding Venue',
    events_venue: 'Events Venue',
    community_centre: 'Events Venue',
    conference_centre: 'Conference Center',
    townhall: 'Town Hall',
    marketplace: 'Market',
    park: 'Park',
    garden: 'Garden',
    golf_course: 'Golf Course',
    resort: 'Resort',
    apartment: 'Building',
    residential: 'Residential',
    commercial: 'Commercial',
    industrial: 'Industrial',
  };
  
  return typeMap[result.type] || result.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

// Props for the map component
interface MapComponentProps {
  latitude: number;
  longitude: number;
  onLocationChange: (lat: number, lng: number) => void;
  hasLocation: boolean;
  zoomToLocation?: boolean;
}

// Map component that will be dynamically imported
const MapComponent = dynamic<MapComponentProps>(
  () => import('./LocationPickerMap'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-80 bg-dark-800 rounded-xl flex items-center justify-center">
        <div className="text-gray-400">Loading map...</div>
      </div>
    )
  }
);

export function LocationPicker({ 
  latitude, 
  longitude, 
  onLocationChange,
  onAddressChange 
}: LocationPickerProps) {
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [shouldZoomIn, setShouldZoomIn] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1); // Keyboard navigation
  const [recentSearches, setRecentSearches] = useState<SearchResult[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Default to Manila if no location set
  const defaultLat = 14.5995;
  const defaultLng = 120.9842;
  
  const currentLat = latitude || defaultLat;
  const currentLng = longitude || defaultLng;

  // Load recent searches from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('recentLocationSearches');
      if (saved) {
        setRecentSearches(JSON.parse(saved).slice(0, 5));
      }
    } catch (e) {
      console.error('Error loading recent searches:', e);
    }
  }, []);

  // Save recent search to localStorage
  const saveRecentSearch = (result: SearchResult) => {
    try {
      const updated = [result, ...recentSearches.filter(r => r.place_id !== result.place_id)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('recentLocationSearches', JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving recent search:', e);
    }
  };

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
        setSelectedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [searchResults]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const items = resultsRef.current.querySelectorAll('[data-result-item]');
      if (items[selectedIndex]) {
        items[selectedIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  // Keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const results = searchQuery.length < 2 ? recentSearches : searchResults;
    const totalResults = results.length;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setShowResults(true);
        setSelectedIndex(prev => (prev < totalResults - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setShowResults(true);
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : totalResults - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleSelectResult(results[selectedIndex]);
        } else if (searchQuery.length >= 2) {
          searchLocation(searchQuery);
        }
        break;
      case 'Escape':
        e.preventDefault();
        if (showResults) {
          setShowResults(false);
          setSelectedIndex(-1);
        } else {
          clearSearch();
        }
        inputRef.current?.blur();
        break;
      case 'Tab':
        setShowResults(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Debounced search function - enhanced for better results like Google
  const searchLocation = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Run multiple searches in parallel for comprehensive results
      const searches = [
        // Primary search - general query with high limit
        fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=ph&limit=15&addressdetails=1&namedetails=1&extratags=1&dedupe=0`
        ),
        // Secondary search - try with "Cavite" appended for local context
        fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ' Cavite')}&countrycodes=ph&limit=10&addressdetails=1&namedetails=1&extratags=1&dedupe=0`
        ),
        // Tertiary search - structured query for barangays
        fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=ph&limit=10&addressdetails=1&namedetails=1&featuretype=settlement&dedupe=0`
        ),
      ];

      const responses = await Promise.allSettled(searches);
      const allResults: SearchResult[] = [];
      
      for (const response of responses) {
        if (response.status === 'fulfilled' && response.value.ok) {
          const data = await response.value.json();
          allResults.push(...data);
        }
      }

      // Deduplicate by place_id and similar coordinates
      const seen = new Map<string, SearchResult>();
      for (const result of allResults) {
        // Create a key based on rounded coordinates to group nearby duplicates
        const latKey = parseFloat(result.lat).toFixed(4);
        const lonKey = parseFloat(result.lon).toFixed(4);
        const nameKey = getShortName(result).toLowerCase();
        const uniqueKey = `${nameKey}-${latKey}-${lonKey}`;
        
        // Keep the one with more details
        if (!seen.has(uniqueKey) || 
            (result.namedetails && !seen.get(uniqueKey)?.namedetails)) {
          seen.set(uniqueKey, result);
        }
      }
      
      // Convert back to array and sort by relevance
      const uniqueResults = Array.from(seen.values());
      
      // Sort: prioritize exact name matches, then by type (places > roads)
      const queryLower = query.toLowerCase();
      uniqueResults.sort((a, b) => {
        const aName = getShortName(a).toLowerCase();
        const bName = getShortName(b).toLowerCase();
        
        // Exact match first
        const aExact = aName === queryLower ? 1 : 0;
        const bExact = bName === queryLower ? 1 : 0;
        if (aExact !== bExact) return bExact - aExact;
        
        // Starts with query
        const aStarts = aName.startsWith(queryLower) ? 1 : 0;
        const bStarts = bName.startsWith(queryLower) ? 1 : 0;
        if (aStarts !== bStarts) return bStarts - aStarts;
        
        // Contains query
        const aContains = aName.includes(queryLower) ? 1 : 0;
        const bContains = bName.includes(queryLower) ? 1 : 0;
        if (aContains !== bContains) return bContains - aContains;
        
        // Prefer places over roads
        const placeTypes = ['city', 'town', 'village', 'suburb', 'neighbourhood', 'hamlet', 'administrative'];
        const aIsPlace = placeTypes.includes(a.type || '') ? 1 : 0;
        const bIsPlace = placeTypes.includes(b.type || '') ? 1 : 0;
        
        return bIsPlace - aIsPlace;
      });
      
      // Limit final results
      setSearchResults(uniqueResults.slice(0, 12));
      setShowResults(true);
    } catch (error) {
      console.error('Error searching location:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handle search input change with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      searchLocation(query);
    }, 300);
  };

  // Handle selecting a search result
  const handleSelectResult = async (result: SearchResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    
    // Save to recent searches
    saveRecentSearch(result);
    
    // Trigger zoom animation and update location
    setShouldZoomIn(true);
    onLocationChange(lat, lng);
    
    // Update address fields if available
    if (onAddressChange && result.address) {
      onAddressChange({
        address_line1: result.address.road || result.address.street || result.address.suburb || '',
        city: result.address.city || result.address.town || result.address.municipality || result.address.village || '',
        province: result.address.state || result.address.region || result.address.province || '',
        postal_code: result.address.postcode || '',
      });
    }
    
    // Clear search
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
    setSelectedIndex(-1);
    
    // Reset zoom flag after animation
    setTimeout(() => setShouldZoomIn(false), 2000);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem('recentLocationSearches');
    } catch (e) {
      console.error('Error clearing recent searches:', e);
    }
  };

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    setIsGettingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        
        // Trigger zoom animation
        setShouldZoomIn(true);
        onLocationChange(lat, lng);
        
        // Try to get address from coordinates
        await reverseGeocode(lat, lng);
        setIsGettingLocation(false);
        
        // Reset zoom flag after animation completes
        setTimeout(() => setShouldZoomIn(false), 2000);
      },
      (error) => {
        console.error('Error getting location:', error);
        setLocationError('Unable to get your location. Please click on the map to set it manually.');
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    if (!onAddressChange) return;
    
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      const data = await res.json();
      
      if (data.address) {
        onAddressChange({
          address_line1: data.address.road || data.address.street || data.address.suburb || '',
          city: data.address.city || data.address.town || data.address.municipality || data.address.village || '',
          province: data.address.state || data.address.region || data.address.province || '',
          postal_code: data.address.postcode || '',
        });
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
    }
  };

  const handleMapClick = async (lat: number, lng: number) => {
    onLocationChange(lat, lng);
    await reverseGeocode(lat, lng);
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div ref={searchRef} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-500" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (searchResults.length > 0) {
                setShowResults(true);
              } else if (searchQuery.length < 2 && recentSearches.length > 0) {
                setShowResults(true);
              }
            }}
            placeholder="Search places, malls, hotels, streets, barangays..."
            className="w-full pl-10 pr-10 py-3 rounded-xl border border-dark-700 bg-dark-800 placeholder-dark-500 text-white focus:outline-none focus:ring-2 focus:ring-pink-400/20 focus:border-pink-400"
            autoComplete="off"
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-500 hover:text-white"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
            </button>
          )}
        </div>
        
        {/* Recent Searches Dropdown (when query is short) */}
        {showResults && searchQuery.length < 2 && recentSearches.length > 0 && (
          <div ref={resultsRef} className="absolute z-50 w-full mt-2 bg-dark-800 border border-dark-700 rounded-xl shadow-xl max-h-72 overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-2 border-b border-dark-700">
              <span className="text-xs text-dark-400 font-medium">Recent searches</span>
              <button 
                onClick={clearRecentSearches}
                className="text-xs text-dark-500 hover:text-pink-400 transition-colors"
              >
                Clear all
              </button>
            </div>
            {recentSearches.map((result, index) => {
              const shortName = getShortName(result);
              const typeLabel = getLocationTypeLabel(result);
              const isSelected = index === selectedIndex;
              
              return (
                <button
                  key={result.place_id}
                  data-result-item
                  onClick={() => handleSelectResult(result)}
                  className={`w-full px-4 py-3 text-left border-b border-dark-700 last:border-b-0 last:rounded-b-xl transition-colors ${
                    isSelected ? 'bg-dark-700' : 'hover:bg-dark-700/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-dark-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-white text-sm font-medium truncate">{shortName}</p>
                        {typeLabel && (
                          <span className="text-xs px-2 py-0.5 bg-dark-700 text-dark-300 rounded-full flex-shrink-0">
                            {typeLabel}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
        
        {/* Search Results Dropdown */}
        {showResults && searchQuery.length >= 2 && searchResults.length > 0 && (
          <div ref={resultsRef} className="absolute z-50 w-full mt-2 bg-dark-800 border border-dark-700 rounded-xl shadow-xl max-h-72 overflow-y-auto">
            {searchResults.map((result, index) => {
              const shortName = getShortName(result);
              const typeLabel = getLocationTypeLabel(result);
              const addressParts = result.display_name.split(',').slice(1, 4).join(',').trim();
              const isSelected = index === selectedIndex;
              
              return (
                <button
                  key={result.place_id}
                  data-result-item
                  onClick={() => handleSelectResult(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full px-4 py-3 text-left border-b border-dark-700 last:border-b-0 first:rounded-t-xl last:rounded-b-xl transition-colors ${
                    isSelected ? 'bg-dark-700' : 'hover:bg-dark-700/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <MapPin className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isSelected ? 'text-pink-400' : 'text-dark-500'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-medium truncate ${isSelected ? 'text-white' : 'text-dark-200'}`}>{shortName}</p>
                        {typeLabel && (
                          <span className="text-xs px-2 py-0.5 bg-dark-700 text-dark-300 rounded-full flex-shrink-0">
                            {typeLabel}
                          </span>
                        )}
                      </div>
                      {addressParts && (
                        <p className="text-dark-400 text-xs truncate mt-0.5">{addressParts}</p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
        
        {/* No results message */}
        {showResults && searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
          <div className="absolute z-50 w-full mt-2 bg-dark-800 border border-dark-700 rounded-xl shadow-xl p-4 text-center">
            <p className="text-dark-400 text-sm">No locations found. Try a different search term.</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Crosshair className="w-4 h-4" />
          <span>Click on the map to set your business location</span>
        </div>
        <Button
          onClick={getCurrentLocation}
          disabled={isGettingLocation}
          size="sm"
          className="flex items-center gap-2"
        >
          <Navigation className="w-4 h-4" />
          {isGettingLocation ? 'Getting Location...' : 'Use Current Location'}
        </Button>
      </div>

      {/* Error message */}
      {locationError && (
        <div className="text-sm text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2">
          {locationError}
        </div>
      )}

      {/* Map */}
      <div className="relative">
        <MapComponent
          latitude={currentLat}
          longitude={currentLng}
          onLocationChange={handleMapClick}
          hasLocation={latitude !== null && longitude !== null}
          zoomToLocation={shouldZoomIn}
        />
        
        {/* Location status indicator */}
        <div className="absolute bottom-3 left-3 bg-dark-900/90 backdrop-blur-sm rounded-lg px-3 py-2 text-sm">
          {latitude !== null && longitude !== null ? (
            <div className="flex items-center gap-2 text-green-400">
              <MapPin className="w-4 h-4" />
              <span>Location set</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-400">
              <MapPin className="w-4 h-4" />
              <span>No location set</span>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <p className="text-xs text-gray-500">
        Your location helps couples calculate travel fees and find vendors near them.
        Search for your address, use your current location, or click directly on the map.
      </p>
    </div>
  );
}

export default LocationPicker;
