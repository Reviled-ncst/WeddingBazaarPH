'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Briefcase, 
  MapPin, 
  Calendar, 
  DollarSign,
  Clock,
  Users,
  Filter,
  Plus,
  Search,
  AlertCircle,
  CheckCircle,
  Star,
  ChevronDown,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/wedding-bazaar-api';

interface JobPosting {
  id: number;
  coordinator_id: number;
  title: string;
  description: string;
  category: string;
  location: string;
  event_date: string | null;
  budget_min: number | null;
  budget_max: number | null;
  requirements: string[];
  status: 'open' | 'filled' | 'cancelled' | 'expired';
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  applications_count: number;
  views_count: number;
  expires_at: string | null;
  created_at: string;
  coordinator_name: string;
  coordinator_rating: number;
  coordinator_reviews: number;
  weddings_completed: number;
}

const categoryOptions = [
  { value: '', label: 'All Categories' },
  { value: 'photographer', label: 'Photography' },
  { value: 'videographer', label: 'Videography' },
  { value: 'caterer', label: 'Catering' },
  { value: 'decorator', label: 'Decoration' },
  { value: 'florist', label: 'Florist' },
  { value: 'makeup', label: 'Makeup & Hair' },
  { value: 'music', label: 'Music & DJ' },
  { value: 'venue', label: 'Venue' },
];

const urgencyColors: Record<string, string> = {
  urgent: 'bg-red-500/20 text-red-400 border-red-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  low: 'bg-green-500/20 text-green-400 border-green-500/30',
};

export default function JobsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: number; role: string } | null>(null);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Filters
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [urgency, setUrgency] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Error parsing user');
      }
    }
    fetchJobs();
  }, [category, location, urgency]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (location) params.set('location', location);
      if (urgency) params.set('urgency', urgency);
      
      const response = await fetch(`${API_URL}/community/jobs/list.php?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        setJobs(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatBudget = (min: number | null, max: number | null) => {
    if (!min && !max) return 'Budget TBD';
    if (min && max) return `₱${min.toLocaleString()} - ₱${max.toLocaleString()}`;
    if (min) return `From ₱${min.toLocaleString()}`;
    return `Up to ₱${max?.toLocaleString()}`;
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Header */}
      <div className="bg-dark-900/50 border-b border-dark-800">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <Link href="/community" className="hover:text-pink-400 flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" />
              Community
            </Link>
            <span>/</span>
            <span className="text-white">Job Board</span>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Briefcase className="w-6 h-6 text-emerald-400" />
                Job Board
              </h1>
              <p className="text-gray-400 mt-1">
                Find opportunities posted by wedding coordinators
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowFilters(!showFilters)}
                className="md:hidden"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
              {user?.role === 'coordinator' && (
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Post a Job
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Filters Sidebar */}
          <div className={`md:w-64 flex-shrink-0 ${showFilters ? 'block' : 'hidden md:block'}`}>
            <Card className="p-4 sticky top-24">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filters
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm focus:border-pink-500 focus:outline-none"
                  >
                    {categoryOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Any location"
                      className="w-full bg-dark-800 border border-dark-700 rounded-lg pl-10 pr-3 py-2 text-white text-sm focus:border-pink-500 focus:outline-none"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Urgency</label>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value)}
                    className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm focus:border-pink-500 focus:outline-none"
                  >
                    <option value="">Any</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setCategory('');
                    setLocation('');
                    setUrgency('');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </Card>
          </div>

          {/* Jobs List */}
          <div className="flex-1">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-400 mx-auto"></div>
              </div>
            ) : jobs.length > 0 ? (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <Card key={job.id} className="p-6 hover:border-pink-500/30 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                      <div className="flex-1">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-semibold text-white hover:text-pink-400 transition-colors cursor-pointer">
                                {job.title}
                              </h3>
                              <Badge className={urgencyColors[job.urgency]}>
                                {job.urgency === 'urgent' && <AlertCircle className="w-3 h-3 mr-1" />}
                                {job.urgency.charAt(0).toUpperCase() + job.urgency.slice(1)}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-400">
                              Posted by{' '}
                              <Link href={`/coordinators/${job.coordinator_id}`} className="text-pink-400 hover:underline">
                                {job.coordinator_name}
                              </Link>
                              {' '}&bull;{' '}{getTimeAgo(job.created_at)}
                            </p>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                          {job.description}
                        </p>

                        {/* Meta Info */}
                        <div className="flex flex-wrap gap-4 text-sm">
                          <div className="flex items-center gap-1 text-gray-400">
                            <Briefcase className="w-4 h-4" />
                            <span className="capitalize">{job.category}</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-400">
                            <MapPin className="w-4 h-4" />
                            <span>{job.location}</span>
                          </div>
                          {job.event_date && (
                            <div className="flex items-center gap-1 text-gray-400">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(job.event_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-emerald-400">
                            <DollarSign className="w-4 h-4" />
                            <span>{formatBudget(job.budget_min, job.budget_max)}</span>
                          </div>
                        </div>

                        {/* Requirements Tags */}
                        {job.requirements && job.requirements.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {job.requirements.slice(0, 4).map((req, idx) => (
                              <span key={idx} className="px-2 py-1 bg-dark-800 text-gray-400 rounded text-xs">
                                {req}
                              </span>
                            ))}
                            {job.requirements.length > 4 && (
                              <span className="px-2 py-1 text-gray-500 text-xs">
                                +{job.requirements.length - 4} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 md:items-end">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Users className="w-4 h-4" />
                          <span>{job.applications_count} applications</span>
                        </div>
                        {user?.role === 'vendor' ? (
                          <Button size="sm">
                            Apply Now
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <Briefcase className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No Jobs Found</h3>
                <p className="text-gray-400 mb-4">
                  {category || location || urgency 
                    ? 'Try adjusting your filters to see more opportunities'
                    : 'No job postings available at the moment'}
                </p>
                {user?.role === 'coordinator' && (
                  <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Post the First Job
                  </Button>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Create Job Modal - Placeholder */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <Card className="max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4">Post a Job</h2>
            <p className="text-gray-400 mb-4">Job posting form coming soon...</p>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Close
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
