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
  ArrowLeft,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';

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
  const { user } = useAuth();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Filters
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [urgency, setUrgency] = useState('');
  
  // Job posting form
  const [jobForm, setJobForm] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    event_date: '',
    budget_min: '',
    budget_max: '',
    urgency: 'medium',
    requirements: '',
    expires_in_days: '30'
  });
  
  // Apply form
  const [applyForm, setApplyForm] = useState({
    cover_letter: '',
    proposed_price: '',
    availability_confirmed: false,
    portfolio_links: ''
  });

  useEffect(() => {
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

  const handleCreateJob = async () => {
    if (!user) return;
    
    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/community/jobs/create.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coordinator_id: user.id,
          title: jobForm.title,
          description: jobForm.description,
          category: jobForm.category,
          location: jobForm.location,
          event_date: jobForm.event_date || null,
          budget_min: jobForm.budget_min ? parseFloat(jobForm.budget_min) : null,
          budget_max: jobForm.budget_max ? parseFloat(jobForm.budget_max) : null,
          urgency: jobForm.urgency,
          requirements: jobForm.requirements.split('\n').filter(r => r.trim()),
          expires_in_days: parseInt(jobForm.expires_in_days)
        })
      });
      
      const result = await response.json();
      if (result.success) {
        setShowCreateModal(false);
        setJobForm({
          title: '', description: '', category: '', location: '',
          event_date: '', budget_min: '', budget_max: '', urgency: 'medium',
          requirements: '', expires_in_days: '30'
        });
        fetchJobs();
      } else {
        alert(result.error || 'Failed to create job');
      }
    } catch (error) {
      console.error('Failed to create job:', error);
      alert('Failed to create job posting');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApply = async () => {
    if (!user || !selectedJob) return;
    
    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/community/jobs/apply.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: selectedJob.id,
          vendor_id: user.id,
          cover_letter: applyForm.cover_letter,
          proposed_price: applyForm.proposed_price ? parseFloat(applyForm.proposed_price) : null,
          availability_confirmed: applyForm.availability_confirmed,
          portfolio_links: applyForm.portfolio_links.split('\n').filter(l => l.trim())
        })
      });
      
      const result = await response.json();
      if (result.success) {
        setShowApplyModal(false);
        setSelectedJob(null);
        setApplyForm({
          cover_letter: '', proposed_price: '', availability_confirmed: false, portfolio_links: ''
        });
        alert('Application submitted successfully!');
        fetchJobs();
      } else {
        alert(result.error || 'Failed to apply');
      }
    } catch (error) {
      console.error('Failed to apply:', error);
      alert('Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  const openApplyModal = (job: JobPosting) => {
    setSelectedJob(job);
    setShowApplyModal(true);
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
                          <Button size="sm" onClick={() => openApplyModal(job)}>
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

      {/* Create Job Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Post a Job</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Job Title *</label>
                <input
                  type="text"
                  value={jobForm.title}
                  onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                  placeholder="e.g., Photographer for Beach Wedding"
                  className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-2 text-white focus:border-pink-500 focus:outline-none"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Category *</label>
                  <select
                    value={jobForm.category}
                    onChange={(e) => setJobForm({ ...jobForm, category: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-2 text-white focus:border-pink-500 focus:outline-none"
                  >
                    <option value="">Select category</option>
                    {categoryOptions.filter(c => c.value).map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Location *</label>
                  <input
                    type="text"
                    value={jobForm.location}
                    onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                    placeholder="e.g., Boracay, Aklan"
                    className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-2 text-white focus:border-pink-500 focus:outline-none"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description *</label>
                <textarea
                  value={jobForm.description}
                  onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                  placeholder="Describe the wedding, requirements, and what you're looking for..."
                  rows={4}
                  className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-2 text-white focus:border-pink-500 focus:outline-none resize-none"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Event Date</label>
                  <input
                    type="date"
                    value={jobForm.event_date}
                    onChange={(e) => setJobForm({ ...jobForm, event_date: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-2 text-white focus:border-pink-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Urgency</label>
                  <select
                    value={jobForm.urgency}
                    onChange={(e) => setJobForm({ ...jobForm, urgency: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-2 text-white focus:border-pink-500 focus:outline-none"
                  >
                    <option value="low">Low - Flexible timeline</option>
                    <option value="medium">Medium - Within a few weeks</option>
                    <option value="high">High - Within a week</option>
                    <option value="urgent">Urgent - ASAP</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Budget Min (₱)</label>
                  <input
                    type="number"
                    value={jobForm.budget_min}
                    onChange={(e) => setJobForm({ ...jobForm, budget_min: e.target.value })}
                    placeholder="0"
                    className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-2 text-white focus:border-pink-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Budget Max (₱)</label>
                  <input
                    type="number"
                    value={jobForm.budget_max}
                    onChange={(e) => setJobForm({ ...jobForm, budget_max: e.target.value })}
                    placeholder="0"
                    className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-2 text-white focus:border-pink-500 focus:outline-none"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Requirements (one per line)</label>
                <textarea
                  value={jobForm.requirements}
                  onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value })}
                  placeholder="Must have own equipment&#10;Experience with beach weddings&#10;Available for full day coverage"
                  rows={3}
                  className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-2 text-white focus:border-pink-500 focus:outline-none resize-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Expires In</label>
                <select
                  value={jobForm.expires_in_days}
                  onChange={(e) => setJobForm({ ...jobForm, expires_in_days: e.target.value })}
                  className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-2 text-white focus:border-pink-500 focus:outline-none"
                >
                  <option value="7">7 days</option>
                  <option value="14">14 days</option>
                  <option value="30">30 days</option>
                  <option value="60">60 days</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-dark-700">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateJob}
                disabled={submitting || !jobForm.title || !jobForm.category || !jobForm.location || !jobForm.description}
              >
                {submitting ? 'Posting...' : 'Post Job'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Apply Modal */}
      {showApplyModal && selectedJob && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">Apply for Job</h2>
                <p className="text-gray-400 text-sm mt-1">{selectedJob.title}</p>
              </div>
              <button onClick={() => { setShowApplyModal(false); setSelectedJob(null); }} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Cover Letter *</label>
                <textarea
                  value={applyForm.cover_letter}
                  onChange={(e) => setApplyForm({ ...applyForm, cover_letter: e.target.value })}
                  placeholder="Introduce yourself and explain why you're a great fit for this job..."
                  rows={5}
                  className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-2 text-white focus:border-pink-500 focus:outline-none resize-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Proposed Price (₱)</label>
                <input
                  type="number"
                  value={applyForm.proposed_price}
                  onChange={(e) => setApplyForm({ ...applyForm, proposed_price: e.target.value })}
                  placeholder="Your quoted price for this job"
                  className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-2 text-white focus:border-pink-500 focus:outline-none"
                />
                {selectedJob.budget_min || selectedJob.budget_max ? (
                  <p className="text-xs text-gray-500 mt-1">
                    Client budget: {selectedJob.budget_min && `₱${selectedJob.budget_min.toLocaleString()}`}
                    {selectedJob.budget_min && selectedJob.budget_max && ' - '}
                    {selectedJob.budget_max && `₱${selectedJob.budget_max.toLocaleString()}`}
                  </p>
                ) : null}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Portfolio Links (one per line)</label>
                <textarea
                  value={applyForm.portfolio_links}
                  onChange={(e) => setApplyForm({ ...applyForm, portfolio_links: e.target.value })}
                  placeholder="https://yourportfolio.com&#10;https://instagram.com/youraccount"
                  rows={3}
                  className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-2 text-white focus:border-pink-500 focus:outline-none resize-none"
                />
              </div>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyForm.availability_confirmed}
                  onChange={(e) => setApplyForm({ ...applyForm, availability_confirmed: e.target.checked })}
                  className="w-4 h-4 rounded border-dark-600 text-pink-500 focus:ring-pink-500"
                />
                <span className="text-sm text-gray-300">
                  I confirm I am available on {selectedJob.event_date 
                    ? new Date(selectedJob.event_date).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })
                    : 'the event date'}
                </span>
              </label>
            </div>
            
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-dark-700">
              <Button variant="outline" onClick={() => { setShowApplyModal(false); setSelectedJob(null); }}>
                Cancel
              </Button>
              <Button 
                onClick={handleApply}
                disabled={submitting || !applyForm.cover_letter}
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
