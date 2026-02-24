'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { 
  MousePointer, 
  Layers, 
  ArrowDown,
  RefreshCw,
  Eye,
  MapPin
} from 'lucide-react';

interface HeatmapPoint {
  x: number;
  y: number;
  value: number;
  element?: string;
  elementId?: string;
  text?: string;
}

interface TopElement {
  element_tag: string;
  element_id: string | null;
  element_class: string | null;
  element_text: string | null;
  clicks: number;
}

interface ScrollData {
  depth_bucket: number;
  count: number;
}

interface GeoPoint {
  city: string;
  lat: number;
  lng: number;
  views: number;
  sessions: number;
}

// Philippines bounding box for map projection
const PH_BOUNDS = {
  minLat: 4.5,
  maxLat: 21.5,
  minLng: 116,
  maxLng: 127
};

export default function HeatmapsPage() {
  const [heatmapData, setHeatmapData] = useState<HeatmapPoint[]>([]);
  const [topElements, setTopElements] = useState<TopElement[]>([]);
  const [scrollDistribution, setScrollDistribution] = useState<ScrollData[]>([]);
  const [avgScrollDepth, setAvgScrollDepth] = useState(0);
  const [geoData, setGeoData] = useState<GeoPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7d');
  const [selectedPage, setSelectedPage] = useState('/');
  const [viewType, setViewType] = useState<'clicks' | 'scroll' | 'geo'>('clicks');
  const [pages, setPages] = useState<string[]>(['/']);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const geoCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch available pages
  useEffect(() => {
    const fetchPages = async () => {
      try {
        const token = localStorage.getItem('token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://weddingbazaarph-testing.up.railway.app';
        
        const response = await fetch(`${apiUrl}/analytics/stats.php?period=${period}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const result = await response.json();
        if (result.success && result.topPages) {
          setPages(result.topPages.map((p: { page_path: string }) => p.page_path));
        }
      } catch {
        // Use defaults
      }
    };
    
    fetchPages();
  }, [period]);

  // Fetch heatmap data
  useEffect(() => {
    const fetchHeatmapData = async () => {
      setLoading(true);
      
      try {
        const token = localStorage.getItem('token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://weddingbazaarph-testing.up.railway.app';
        
        const response = await fetch(
          `${apiUrl}/analytics/heatmap.php?page=${encodeURIComponent(selectedPage)}&period=${period}&type=${viewType}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        
        const result = await response.json();
        
        if (result.success) {
          if (viewType === 'clicks') {
            setHeatmapData(result.heatmapData || []);
            setTopElements(result.topElements || []);
          } else if (viewType === 'scroll') {
            setScrollDistribution(result.scrollDistribution || []);
            setAvgScrollDepth(result.avgScrollDepth || 0);
          } else if (viewType === 'geo') {
            setGeoData(result.geoData || []);
          }
        }
      } catch (err) {
        console.error('Failed to fetch heatmap data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHeatmapData();
  }, [selectedPage, period, viewType]);

  // Draw heatmap on canvas
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current || viewType !== 'clicks') return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const container = containerRef.current;
    const { width, height } = container.getBoundingClientRect();
    
    canvas.width = width;
    canvas.height = height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    if (heatmapData.length === 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No click data for this page', width / 2, height / 2);
      return;
    }

    // Find max value for normalization
    const maxValue = Math.max(...heatmapData.map(p => p.value));
    
    // Scale factor from normalized viewport (1920x1080) to canvas size
    const scaleX = width / 1920;
    const scaleY = height / 1080;
    
    // Draw heatmap points
    heatmapData.forEach(point => {
      const x = point.x * scaleX;
      const y = point.y * scaleY;
      const intensity = point.value / maxValue;
      const radius = 20 + intensity * 30;
      
      // Create radial gradient
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      
      // Color based on intensity (blue -> green -> yellow -> red)
      if (intensity < 0.25) {
        gradient.addColorStop(0, `rgba(0, 0, 255, ${intensity * 2})`);
        gradient.addColorStop(1, 'rgba(0, 0, 255, 0)');
      } else if (intensity < 0.5) {
        gradient.addColorStop(0, `rgba(0, 255, 0, ${intensity * 1.5})`);
        gradient.addColorStop(1, 'rgba(0, 255, 0, 0)');
      } else if (intensity < 0.75) {
        gradient.addColorStop(0, `rgba(255, 255, 0, ${intensity})`);
        gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
      } else {
        gradient.addColorStop(0, `rgba(255, 0, 0, ${intensity})`);
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
      }
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [heatmapData, viewType]);

  // Draw geographic heatmap on canvas
  useEffect(() => {
    if (!geoCanvasRef.current || viewType !== 'geo') return;
    
    const canvas = geoCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 600;
    const height = 700;
    canvas.width = width;
    canvas.height = height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw background (water/ocean)
    ctx.fillStyle = '#1a365d';
    ctx.fillRect(0, 0, width, height);
    
    // Simple Philippines outline (approximate)
    ctx.strokeStyle = '#4a5568';
    ctx.lineWidth = 2;
    
    // Function to project lat/lng to canvas coordinates
    const projectToCanvas = (lat: number, lng: number): [number, number] => {
      const x = ((lng - PH_BOUNDS.minLng) / (PH_BOUNDS.maxLng - PH_BOUNDS.minLng)) * width;
      const y = height - ((lat - PH_BOUNDS.minLat) / (PH_BOUNDS.maxLat - PH_BOUNDS.minLat)) * height;
      return [x, y];
    };
    
    // Draw major Philippine islands (simplified shapes)
    ctx.fillStyle = '#2d3748';
    ctx.strokeStyle = '#4a5568';
    
    // Luzon (simplified)
    ctx.beginPath();
    const luzonPoints = [
      [18.5, 120.5], [19.5, 121], [18.8, 122], [17.5, 121.5],
      [16.5, 120.5], [15, 121], [14, 121.5], [14.5, 122.5],
      [14, 123], [13.5, 123.5], [14, 124], [15, 123.5], [16, 122],
      [17, 121.5], [18, 121]
    ];
    const [startX, startY] = projectToCanvas(luzonPoints[0][0], luzonPoints[0][1]);
    ctx.moveTo(startX, startY);
    luzonPoints.forEach(([lat, lng]) => {
      const [x, y] = projectToCanvas(lat, lng);
      ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Visayas (simplified - Cebu/Bohol area)
    ctx.beginPath();
    ctx.arc(...projectToCanvas(10.3, 123.9), 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Mindanao (simplified)
    ctx.beginPath();
    ctx.arc(...projectToCanvas(7.5, 125), 50, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    if (geoData.length === 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No geographic data available', width / 2, height / 2);
      return;
    }

    // Find max value for normalization
    const maxViews = Math.max(...geoData.map(p => p.views));
    
    // Draw city markers with heatmap effect
    geoData.forEach(point => {
      const [x, y] = projectToCanvas(point.lat, point.lng);
      const intensity = point.views / maxViews;
      const radius = 15 + intensity * 35;
      
      // Create radial gradient (pink theme)
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, `rgba(236, 72, 153, ${0.5 + intensity * 0.5})`);
      gradient.addColorStop(0.5, `rgba(236, 72, 153, ${0.3 + intensity * 0.3})`);
      gradient.addColorStop(1, 'rgba(236, 72, 153, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw city label
      ctx.fillStyle = 'white';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(point.city, x, y - radius - 5);
      
      // Draw view count
      ctx.fillStyle = '#ec4899';
      ctx.font = '10px sans-serif';
      ctx.fillText(`${point.views} views`, x, y + 4);
    });
  }, [geoData, viewType]);

  const getScrollColor = (depth: number) => {
    if (depth >= 75) return 'bg-green-500';
    if (depth >= 50) return 'bg-yellow-500';
    if (depth >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Heatmaps</h1>
          <p className="text-dark-400 text-sm">Visualize user interactions and behavior</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {/* View Type Toggle */}
          <div className="flex bg-dark-800 rounded-lg p-1">
            <button
              onClick={() => setViewType('clicks')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors ${
                viewType === 'clicks'
                  ? 'bg-pink-500 text-white'
                  : 'text-dark-300 hover:text-white'
              }`}
            >
              <MousePointer className="w-4 h-4" />
              Clicks
            </button>
            <button
              onClick={() => setViewType('scroll')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors ${
                viewType === 'scroll'
                  ? 'bg-pink-500 text-white'
                  : 'text-dark-300 hover:text-white'
              }`}
            >
              <ArrowDown className="w-4 h-4" />
              Scroll
            </button>
            <button
              onClick={() => setViewType('geo')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors ${
                viewType === 'geo'
                  ? 'bg-pink-500 text-white'
                  : 'text-dark-300 hover:text-white'
              }`}
            >
              <MapPin className="w-4 h-4" />
              Geographic
            </button>
          </div>
          
          {/* Period Selector */}
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-dark-800 border border-dark-700 rounded-lg px-3 py-1.5 text-white text-sm"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          
          {/* Page Selector */}
          <select
            value={selectedPage}
            onChange={(e) => setSelectedPage(e.target.value)}
            className="bg-dark-800 border border-dark-700 rounded-lg px-3 py-1.5 text-white text-sm max-w-[200px]"
          >
            {pages.map((page) => (
              <option key={page} value={page}>{page}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <Card className="p-8">
          <div className="flex items-center justify-center gap-3 text-dark-400">
            <RefreshCw className="w-5 h-5 animate-spin" />
            Loading heatmap data...
          </div>
        </Card>
      ) : viewType === 'clicks' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Heatmap Canvas */}
          <Card className="lg:col-span-2 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Click Heatmap</h3>
              <span className="text-dark-400 text-sm">{heatmapData.length} click points</span>
            </div>
            
            <div 
              ref={containerRef}
              className="relative bg-dark-900 rounded-lg overflow-hidden"
              style={{ aspectRatio: '16/9', minHeight: '400px' }}
            >
              {/* Page preview placeholder */}
              <div className="absolute inset-0 flex items-center justify-center text-dark-600 text-sm">
                <div className="text-center">
                  <Eye className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p>Page: {selectedPage}</p>
                  <p className="text-xs mt-1">Heatmap overlay</p>
                </div>
              </div>
              
              {/* Canvas overlay */}
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
                style={{ mixBlendMode: 'screen' }}
              />
              
              {/* Legend */}
              <div className="absolute bottom-4 right-4 bg-dark-800/90 rounded-lg p-3">
                <p className="text-xs text-dark-400 mb-2">Click Intensity</p>
                <div className="flex items-center gap-1">
                  <span className="w-4 h-4 rounded bg-blue-500"></span>
                  <span className="w-4 h-4 rounded bg-green-500"></span>
                  <span className="w-4 h-4 rounded bg-yellow-500"></span>
                  <span className="w-4 h-4 rounded bg-red-500"></span>
                </div>
                <div className="flex justify-between text-[10px] text-dark-500 mt-1">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Top Clicked Elements */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Top Clicked Elements</h3>
            
            {topElements.length > 0 ? (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {topElements.map((element, i) => (
                  <div key={i} className="bg-dark-800 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-pink-400 text-sm font-mono">
                        &lt;{element.element_tag}&gt;
                      </span>
                      <span className="text-white font-semibold">{element.clicks}</span>
                    </div>
                    {element.element_id && (
                      <p className="text-dark-400 text-xs">#{element.element_id}</p>
                    )}
                    {element.element_text && (
                      <p className="text-dark-500 text-xs truncate mt-1">
                        &quot;{element.element_text}&quot;
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-dark-500">
                <Layers className="w-12 h-12 mb-3 opacity-50" />
                <p>No click data available</p>
                <p className="text-xs mt-1">for this page and period</p>
              </div>
            )}
          </Card>
        </div>
      ) : (
        /* Scroll Depth View */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scroll Depth Visualization */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Scroll Depth Distribution</h3>
            
            <div className="space-y-3">
              {[100, 90, 75, 50, 25, 10].map((depth) => {
                const bucket = scrollDistribution.find(s => s.depth_bucket === depth);
                const count = bucket?.count || 0;
                const maxCount = Math.max(...scrollDistribution.map(s => s.count || 0), 1);
                const percentage = Math.round((count / maxCount) * 100);
                
                return (
                  <div key={depth}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-dark-300 text-sm">{depth}% scrolled</span>
                      <span className="text-white text-sm">{count} visitors</span>
                    </div>
                    <div className="w-full h-6 bg-dark-700 rounded overflow-hidden">
                      <div
                        className={`h-full ${getScrollColor(depth)} transition-all`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Scroll Stats */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Scroll Metrics</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-dark-800 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-white">{avgScrollDepth}%</p>
                <p className="text-dark-400 text-sm">Average Scroll Depth</p>
              </div>
              <div className="bg-dark-800 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-white">
                  {scrollDistribution.reduce((acc, s) => acc + (s.count || 0), 0)}
                </p>
                <p className="text-dark-400 text-sm">Total Scroll Events</p>
              </div>
            </div>

            {/* Scroll depth visual */}
            <div className="relative h-64 bg-gradient-to-b from-green-500/20 via-yellow-500/20 to-red-500/20 rounded-lg overflow-hidden">
              <div 
                className="absolute left-0 right-0 border-t-2 border-dashed border-pink-500 flex items-center justify-center"
                style={{ top: `${100 - avgScrollDepth}%` }}
              >
                <span className="bg-pink-500 text-white text-xs px-2 py-0.5 rounded">
                  Avg: {avgScrollDepth}%
                </span>
              </div>
              
              {/* Percentage markers */}
              {[0, 25, 50, 75, 100].map((mark) => (
                <div 
                  key={mark}
                  className="absolute left-2 text-xs text-dark-400"
                  style={{ top: `${100 - mark}%`, transform: 'translateY(-50%)' }}
                >
                  {mark}%
                </div>
              ))}
              
              {/* Visual indicator */}
              <div className="absolute right-4 top-4 text-right text-xs text-dark-400">
                <p>Top of page</p>
              </div>
              <div className="absolute right-4 bottom-4 text-right text-xs text-dark-400">
                <p>Bottom of page</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Geographic Heatmap View */}
      {viewType === 'geo' && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Canvas */}
          <Card className="lg:col-span-2 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Geographic Heatmap - Philippines</h3>
              <span className="text-dark-400 text-sm">{geoData.length} locations</span>
            </div>
            <div className="flex justify-center bg-dark-900 rounded-lg overflow-hidden">
              <canvas
                ref={geoCanvasRef}
                className="max-w-full"
                style={{ maxHeight: '700px' }}
              />
            </div>
            <p className="text-dark-400 text-xs text-center mt-2">
              Circle size and intensity indicate activity volume
            </p>
          </Card>

          {/* Location Stats */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Top Locations</h3>
            
            <div className="space-y-3">
              {geoData.length > 0 ? (
                geoData.sort((a, b) => b.views - a.views).slice(0, 10).map((location, index) => {
                  const maxViews = geoData[0]?.views || 1;
                  const percentage = (location.views / maxViews) * 100;
                  
                  return (
                    <div key={location.city}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white text-sm flex items-center gap-2">
                          <span className="text-pink-400 font-bold">{index + 1}.</span>
                          {location.city}
                        </span>
                        <span className="text-dark-300 text-sm">{location.views} views</span>
                      </div>
                      <div className="w-full h-2 bg-dark-700 rounded overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-pink-500 to-pink-400 transition-all"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-dark-400">
                  <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No location data available</p>
                  <p className="text-sm mt-1">Location tracking requires user consent</p>
                </div>
              )}
            </div>

            {/* Total stats */}
            {geoData.length > 0 && (
              <div className="mt-6 pt-4 border-t border-dark-700">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-dark-800 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-white">
                      {geoData.reduce((acc, l) => acc + l.views, 0)}
                    </p>
                    <p className="text-dark-400 text-xs">Total Views</p>
                  </div>
                  <div className="bg-dark-800 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-white">
                      {geoData.reduce((acc, l) => acc + l.sessions, 0)}
                    </p>
                    <p className="text-dark-400 text-xs">Total Sessions</p>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
