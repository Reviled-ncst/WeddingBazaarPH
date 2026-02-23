'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { 
  BarChart3, 
  Eye, 
  Users, 
  Clock, 
  MousePointer, 
  TrendingUp,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

interface AnalyticsData {
  overview: {
    totalPageViews: number;
    uniqueVisitors: number;
    avgTimeOnPage: number;
    avgScrollDepth: number;
    bounceRate: number;
    totalClicks: number;
  };
  topPages: Array<{
    page_path: string;
    views: number;
    unique_visitors: number;
    avg_time: number;
    avg_scroll: number;
  }>;
  deviceBreakdown: Array<{ device_type: string; count: number }>;
  browserBreakdown: Array<{ browser: string; count: number }>;
  dailyTrend: Array<{ date: string; page_views: number; unique_visitors: number }>;
  referrerSources: Array<{ source: string; count: number }>;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7d');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const token = localStorage.getItem('token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://weddingbazaarph-testing.up.railway.app';
        
        const response = await fetch(`${apiUrl}/analytics/stats.php?period=${period}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch analytics');
        }
        
        const result = await response.json();
        if (result.success) {
          setData(result);
        } else {
          setError(result.message || 'Failed to load analytics');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [period]);

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getDeviceIcon = (device: string) => {
    switch (device?.toLowerCase()) {
      case 'mobile': return <Smartphone className="w-4 h-4" />;
      case 'tablet': return <Tablet className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  const getDeviceTotal = () => {
    if (!data?.deviceBreakdown) return 0;
    return data.deviceBreakdown.reduce((acc, d) => acc + parseInt(String(d.count)), 0);
  };

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white mb-6">Analytics Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-4 bg-dark-700 rounded w-1/2 mb-3"></div>
              <div className="h-8 bg-dark-700 rounded w-3/4"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white mb-6">Analytics Dashboard</h1>
        <Card className="p-8 text-center">
          <BarChart3 className="w-16 h-16 text-dark-500 mx-auto mb-4" />
          <p className="text-dark-400 mb-4">{error}</p>
          <p className="text-dark-500 text-sm">
            Make sure the analytics tables are created by running the migration script.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
          <p className="text-dark-400 text-sm">Track visitor behavior and engagement</p>
        </div>
        
        {/* Period Selector */}
        <div className="flex gap-2">
          {['24h', '7d', '30d', '90d'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                period === p
                  ? 'bg-pink-500 text-white'
                  : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
              }`}
            >
              {p === '24h' ? '24 Hours' : p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <Eye className="w-5 h-5 text-blue-400" />
            <span className="text-green-400 text-xs flex items-center">
              <ArrowUp className="w-3 h-3" />
            </span>
          </div>
          <p className="text-2xl font-bold text-white">{formatNumber(data?.overview.totalPageViews || 0)}</p>
          <p className="text-dark-400 text-sm">Page Views</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-2xl font-bold text-white">{formatNumber(data?.overview.uniqueVisitors || 0)}</p>
          <p className="text-dark-400 text-sm">Unique Visitors</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-white">{formatTime(data?.overview.avgTimeOnPage || 0)}</p>
          <p className="text-dark-400 text-sm">Avg. Time on Page</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-yellow-400" />
          </div>
          <p className="text-2xl font-bold text-white">{data?.overview.avgScrollDepth || 0}%</p>
          <p className="text-dark-400 text-sm">Avg. Scroll Depth</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <ArrowDown className="w-5 h-5 text-red-400" />
          </div>
          <p className="text-2xl font-bold text-white">{data?.overview.bounceRate || 0}%</p>
          <p className="text-dark-400 text-sm">Bounce Rate</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <MousePointer className="w-5 h-5 text-pink-400" />
          </div>
          <p className="text-2xl font-bold text-white">{formatNumber(data?.overview.totalClicks || 0)}</p>
          <p className="text-dark-400 text-sm">Total Clicks</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Trend Chart */}
        <Card className="lg:col-span-2 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Traffic Trend</h3>
          {data?.dailyTrend && data.dailyTrend.length > 0 ? (
            <div className="h-64 flex items-end gap-1">
              {data.dailyTrend.map((day, i) => {
                const maxViews = Math.max(...data.dailyTrend.map(d => d.page_views));
                const height = maxViews > 0 ? (day.page_views / maxViews) * 100 : 0;
                
                return (
                  <div key={i} className="flex-1 flex flex-col items-center group">
                    <div className="relative w-full">
                      <div
                        className="w-full bg-pink-500/80 rounded-t transition-all group-hover:bg-pink-400"
                        style={{ height: `${Math.max(height, 4)}%`, minHeight: '4px' }}
                      ></div>
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-dark-700 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                        {day.page_views} views
                      </div>
                    </div>
                    <span className="text-[10px] text-dark-500 mt-1 rotate-45 origin-left">
                      {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-dark-500">
              No data available for this period
            </div>
          )}
        </Card>

        {/* Device Breakdown */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Device Breakdown</h3>
          <div className="space-y-4">
            {data?.deviceBreakdown && data.deviceBreakdown.length > 0 ? (
              data.deviceBreakdown.map((device) => {
                const total = getDeviceTotal();
                const percentage = total > 0 ? Math.round((device.count / total) * 100) : 0;
                
                return (
                  <div key={device.device_type}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="flex items-center gap-2 text-dark-300 text-sm capitalize">
                        {getDeviceIcon(device.device_type)}
                        {device.device_type || 'Unknown'}
                      </span>
                      <span className="text-white text-sm">{percentage}%</span>
                    </div>
                    <div className="w-full h-2 bg-dark-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-dark-500 text-center py-8">No device data</p>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pages */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Top Pages</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-dark-400 text-sm border-b border-dark-700">
                  <th className="text-left pb-3">Page</th>
                  <th className="text-right pb-3">Views</th>
                  <th className="text-right pb-3">Avg Time</th>
                  <th className="text-right pb-3">Scroll</th>
                </tr>
              </thead>
              <tbody>
                {data?.topPages && data.topPages.length > 0 ? (
                  data.topPages.slice(0, 10).map((page, i) => (
                    <tr key={i} className="border-b border-dark-800 hover:bg-dark-800/50">
                      <td className="py-3 text-white text-sm truncate max-w-[200px]" title={page.page_path}>
                        {page.page_path}
                      </td>
                      <td className="py-3 text-right text-dark-300 text-sm">{formatNumber(page.views)}</td>
                      <td className="py-3 text-right text-dark-300 text-sm">{formatTime(page.avg_time)}</td>
                      <td className="py-3 text-right text-dark-300 text-sm">{page.avg_scroll}%</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-dark-500">
                      No page data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Traffic Sources */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Traffic Sources</h3>
          <div className="space-y-3">
            {data?.referrerSources && data.referrerSources.length > 0 ? (
              data.referrerSources.map((source, i) => {
                const total = data.referrerSources.reduce((acc, s) => acc + parseInt(String(s.count)), 0);
                const percentage = total > 0 ? Math.round((source.count / total) * 100) : 0;
                
                return (
                  <div key={i} className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-dark-500" />
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-dark-300 text-sm">{source.source}</span>
                        <span className="text-white text-sm">{source.count} ({percentage}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-dark-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-dark-500 text-center py-8">No referrer data</p>
            )}
          </div>
        </Card>
      </div>

      {/* Browser Breakdown */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Browser Usage</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {data?.browserBreakdown && data.browserBreakdown.length > 0 ? (
            data.browserBreakdown.map((browser, i) => {
              const total = data.browserBreakdown.reduce((acc, b) => acc + parseInt(String(b.count)), 0);
              const percentage = total > 0 ? Math.round((browser.count / total) * 100) : 0;
              
              return (
                <div key={i} className="bg-dark-800 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-white">{percentage}%</p>
                  <p className="text-dark-400 text-sm">{browser.browser}</p>
                </div>
              );
            })
          ) : (
            <p className="col-span-full text-dark-500 text-center py-4">No browser data</p>
          )}
        </div>
      </Card>
    </div>
  );
}
