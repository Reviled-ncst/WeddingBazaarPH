'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Database, Play, CheckCircle, XCircle, Clock, 
  RefreshCw, AlertTriangle, FileCode, Loader2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getToken } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/wedding-bazaar-api';

interface MigrationResult {
  status: 'success' | 'skipped' | 'failed' | 'pending';
  description?: string;
  reason?: string;
  error?: string;
  statements_executed?: number;
  execution_time_ms?: number;
  would_run?: boolean;
}

interface MigrationStatus {
  success: boolean;
  executed: Array<{
    id: number;
    migration: string;
    batch: number;
    executed_at: string;
    execution_time_ms?: number;
    status: string;
  }>;
  pending: string[];
  available: Record<string, string>;
}

interface RunResult {
  success: boolean;
  dry_run: boolean;
  auth_method: string;
  batch: number;
  summary: {
    success: number;
    skipped: number;
    failed: number;
    total_time_ms: number;
  };
  results: Record<string, MigrationResult>;
  errors?: Record<string, string>;
}

export default function MigrationsPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<MigrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/migrations/status.php`);
      const data = await res.json();
      if (data.success) {
        setStatus(data);
      } else {
        setError(data.message || 'Failed to fetch migration status');
      }
    } catch (err) {
      setError('Failed to connect to API');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const runMigrations = async (dryRun = false, specificMigration?: string) => {
    const token = getToken();
    if (!token) {
      setError('Please log in as admin to run migrations');
      return;
    }

    try {
      setRunning(true);
      setError(null);
      setRunResult(null);

      let url = `${API_URL}/migrations/run.php`;
      const params = new URLSearchParams();
      if (dryRun) params.append('dry_run', '1');
      if (specificMigration) params.append('migration', specificMigration);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await res.json();
      setRunResult(data);

      if (data.success && !dryRun) {
        // Refresh status after successful run
        await fetchStatus();
      }
    } catch (err) {
      setError('Failed to run migrations');
    } finally {
      setRunning(false);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-dark-950 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Admin Access Required</h1>
            <p className="text-dark-400">Please log in as an administrator to access migrations.</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="w-8 h-8 text-pink-400" />
            <div>
              <h1 className="text-2xl font-bold text-white">Database Migrations</h1>
              <p className="text-dark-400">Manage database schema and seed data</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => fetchStatus()}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="p-4 border-red-500/50 bg-red-500/10">
            <div className="flex items-center gap-2 text-red-400">
              <XCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </Card>
        )}

        {/* Actions */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Actions</h2>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => runMigrations(true)}
              disabled={running}
              variant="outline"
            >
              {running ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileCode className="w-4 h-4 mr-2" />}
              Dry Run (Preview)
            </Button>
            <Button
              onClick={() => runMigrations(false)}
              disabled={running || (status?.pending?.length === 0)}
            >
              {running ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
              Run All Pending
            </Button>
          </div>
        </Card>

        {/* Run Result */}
        {runResult && (
          <Card className={`p-6 ${runResult.success ? 'border-green-500/50' : 'border-red-500/50'}`}>
            <div className="flex items-center gap-2 mb-4">
              {runResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400" />
              )}
              <h2 className="text-lg font-semibold text-white">
                {runResult.dry_run ? 'Dry Run Result' : 'Migration Result'}
              </h2>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="bg-dark-800 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-400">{runResult.summary.success}</div>
                <div className="text-xs text-dark-400">Success</div>
              </div>
              <div className="bg-dark-800 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-yellow-400">{runResult.summary.skipped}</div>
                <div className="text-xs text-dark-400">Skipped</div>
              </div>
              <div className="bg-dark-800 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-red-400">{runResult.summary.failed}</div>
                <div className="text-xs text-dark-400">Failed</div>
              </div>
              <div className="bg-dark-800 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-400">{runResult.summary.total_time_ms}ms</div>
                <div className="text-xs text-dark-400">Total Time</div>
              </div>
            </div>

            <div className="space-y-2">
              {Object.entries(runResult.results).map(([name, result]) => (
                <div key={name} className="flex items-center justify-between bg-dark-800 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    {result.status === 'success' && <CheckCircle className="w-4 h-4 text-green-400" />}
                    {result.status === 'skipped' && <Clock className="w-4 h-4 text-yellow-400" />}
                    {result.status === 'failed' && <XCircle className="w-4 h-4 text-red-400" />}
                    {result.status === 'pending' && <FileCode className="w-4 h-4 text-blue-400" />}
                    <div>
                      <div className="text-white font-medium">{name}</div>
                      <div className="text-dark-400 text-sm">
                        {result.description || result.reason || result.error}
                      </div>
                    </div>
                  </div>
                  {result.execution_time_ms && (
                    <span className="text-dark-400 text-sm">{result.execution_time_ms}ms</span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Pending Migrations */}
        {status && status.pending.length > 0 && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Pending Migrations ({status.pending.length})</h2>
            <div className="space-y-2">
              {status.pending.map(name => (
                <div key={name} className="flex items-center justify-between bg-dark-800 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-yellow-400" />
                    <div>
                      <div className="text-white font-medium">{name}</div>
                      <div className="text-dark-400 text-sm">{status.available[name]}</div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => runMigrations(false, name)}
                    disabled={running}
                  >
                    Run
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Executed Migrations */}
        {status && status.executed.length > 0 && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Migration History</h2>
            <div className="space-y-2">
              {status.executed.map(migration => (
                <div key={migration.id} className="flex items-center justify-between bg-dark-800 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    {migration.status === 'success' ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                    <div>
                      <div className="text-white font-medium">{migration.migration}</div>
                      <div className="text-dark-400 text-sm">
                        Batch {migration.batch} • {new Date(migration.executed_at).toLocaleString()}
                        {migration.execution_time_ms && ` • ${migration.execution_time_ms}ms`}
                      </div>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    migration.status === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {migration.status}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Empty State */}
        {status && status.pending.length === 0 && status.executed.length === 0 && (
          <Card className="p-8 text-center">
            <Database className="w-16 h-16 text-dark-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">No migrations found</h2>
            <p className="text-dark-400">Run a dry run to see available migrations.</p>
          </Card>
        )}

        {/* Loading */}
        {loading && !status && (
          <Card className="p-8 text-center">
            <Loader2 className="w-8 h-8 text-pink-400 animate-spin mx-auto mb-4" />
            <p className="text-dark-400">Loading migration status...</p>
          </Card>
        )}
      </div>
    </div>
  );
}
