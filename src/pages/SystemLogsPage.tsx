import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Terminal,
  Activity,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Download,
  Copy,
  Check,
  Search,
  Filter,
  Clock,
  Cpu,
  Database,
  Shield,
  ChevronDown,
  ChevronRight,
  Layers,
  Server,
} from 'lucide-react';
import { systemApi } from '../api';
import type {
  SystemLogEntry,
  SystemLogLevel,
  SystemStatus,
} from '../types';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Spinner } from '../components/common/Tabs';

export const SystemLogsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  // State
  const [logs, setLogs] = useState<SystemLogEntry[]>([]);
  const [errors, setErrors] = useState<SystemLogEntry[]>([]);
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'errors' | 'telemetry'>('all');

  // Filters
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [limit, setLimit] = useState<number>(200);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(5000); // 5s default

  // Selection / Detail View
  const [selectedEntry, setSelectedEntry] = useState<SystemLogEntry | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Auto-refresh timer ref
  const autoRefreshTimerRef = useRef<any>(null);

  const fetchLogsAndStatus = useCallback(
    async (showSpinner = false) => {
      if (showSpinner) setIsRefreshing(true);
      try {
        const [statusRes, logsRes, errorsRes] = await Promise.all([
          systemApi.getStatus().catch(() => null),
          systemApi.getLogs({
            level: selectedLevel !== 'all' ? selectedLevel : undefined,
            module: selectedModule || undefined,
            search: searchQuery || undefined,
            limit,
          }).catch(() => ({ total: 0, limit, logs: [] })),
          systemApi.getErrors({
            search: searchQuery || undefined,
            limit: 100,
          }).catch(() => ({ total: 0, limit: 100, errors: [] })),
        ]);

        if (statusRes) setStatus(statusRes);
        if (logsRes) setLogs(logsRes.logs);
        if (errorsRes) setErrors(errorsRes.errors);
      } catch (err: any) {
        if (showSpinner) {
          showToast(err?.message || 'Could not connect to system logs endpoint', 'error');
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [selectedLevel, selectedModule, searchQuery, limit, showToast]
  );

  // Initial load & when filters change
  useEffect(() => {
    fetchLogsAndStatus();
  }, [fetchLogsAndStatus]);

  // Setup auto-refresh
  useEffect(() => {
    if (autoRefreshTimerRef.current) {
      clearInterval(autoRefreshTimerRef.current);
      autoRefreshTimerRef.current = null;
    }

    if (autoRefreshInterval > 0) {
      autoRefreshTimerRef.current = setInterval(() => {
        fetchLogsAndStatus(false);
      }, autoRefreshInterval);
    }

    return () => {
      if (autoRefreshTimerRef.current) {
        clearInterval(autoRefreshTimerRef.current);
      }
    };
  }, [autoRefreshInterval, fetchLogsAndStatus]);

  const handleClearLogs = async () => {
    setIsClearing(true);
    try {
      await systemApi.clearLogs();
      setLogs([]);
      setErrors([]);
      setIsClearModalOpen(false);
      showToast('In-memory log and error buffers have been emptied.', 'success');
      fetchLogsAndStatus();
    } catch (err: any) {
      showToast(err?.message || 'Server error clearing logs', 'error');
    } finally {
      setIsClearing(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (d > 0) return `${d}d ${h}h ${m}m ${s}s`;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const getLevelBadge = (level: SystemLogLevel) => {
    switch (level) {
      case 'fatal':
        return <Badge variant="danger" size="sm" className="bg-rose-950 text-rose-200 border-rose-800 font-bold uppercase">FATAL</Badge>;
      case 'error':
        return <Badge variant="danger" size="sm" className="font-semibold uppercase">ERROR</Badge>;
      case 'warn':
        return <Badge variant="warning" size="sm" className="font-semibold uppercase">WARN</Badge>;
      case 'info':
        return <Badge variant="primary" size="sm" className="font-semibold uppercase">INFO</Badge>;
      case 'debug':
        return <Badge variant="secondary" size="sm" className="font-mono text-gray-500 uppercase">DEBUG</Badge>;
      default:
        return <Badge variant="secondary" size="sm">{level}</Badge>;
    }
  };

  const getStatusBadge = (statusCode?: number) => {
    if (!statusCode) return null;
    if (statusCode >= 500) {
      return <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-100 text-rose-800 border border-rose-200">{statusCode}</span>;
    }
    if (statusCode >= 400) {
      return <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-200">{statusCode}</span>;
    }
    if (statusCode >= 300) {
      return <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-800 border border-blue-200">{statusCode}</span>;
    }
    return <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">{statusCode}</span>;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-slate-500 font-medium">Connecting to system telemetry & log stream...</p>
      </div>
    );
  }

  const isAccessAllowed = user?.role === 'owner' || user?.role === 'admin';

  if (!isAccessAllowed) {
    return (
      <div className="max-w-xl mx-auto mt-12 p-8 bg-white rounded-2xl border border-gray-200 shadow-sm text-center">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <Shield className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-gray-900">Administrator Access Required</h2>
        <p className="text-sm text-gray-500 mt-2">
          Real-time system diagnostics and backend error logs are restricted to platform owners and administrators.
        </p>
      </div>
    );
  }

  const currentList = activeTab === 'errors' ? errors : logs;

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Quick Stats */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">System Logs & Telemetry</h1>
            <Badge variant="purple" size="sm">Live Feed</Badge>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Real-time backend inspection, error tracing, unhandled exception tracking, and service telemetry.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Auto Refresh Dropdown */}
          <div className="flex items-center bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 shadow-sm text-xs font-medium text-gray-700">
            <Clock className="w-3.5 h-3.5 text-gray-400 mr-1.5" />
            <span className="mr-2 text-gray-500">Auto-refresh:</span>
            <select
              value={autoRefreshInterval}
              onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
              className="bg-transparent text-xs font-semibold text-primary-600 focus:outline-none cursor-pointer"
            >
              <option value={3000}>3 seconds</option>
              <option value={5000}>5 seconds</option>
              <option value={10000}>10 seconds</option>
              <option value={30000}>30 seconds</option>
              <option value={0}>Off (Manual)</option>
            </select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLogsAndStatus(true)}
            isLoading={isRefreshing}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const url = systemApi.getDownloadLogUrl('app');
              window.open(url, '_blank');
            }}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Download app.log
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const url = systemApi.getDownloadLogUrl('error');
              window.open(url, '_blank');
            }}
            icon={<Download className="w-3.5 h-3.5 text-rose-500" />}
          >
            Download error.log
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsClearModalOpen(true)}
            className="text-rose-600 hover:bg-rose-50 border-rose-200 hover:border-rose-300"
            icon={<Trash2 className="w-3.5 h-3.5" />}
          >
            Clear Buffer
          </Button>
        </div>
      </div>

      {/* Server Status Metrics Row */}
      {status && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="p-3.5 bg-gradient-to-br from-white to-gray-50/50">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
              <Activity className="w-3.5 h-3.5 text-emerald-500" />
              <span>Status</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-bold text-gray-900 capitalize">{status.status}</span>
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5">Env: {status.environment}</p>
          </Card>

          <Card className="p-3.5 bg-gradient-to-br from-white to-gray-50/50">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
              <Database className="w-3.5 h-3.5 text-primary-500" />
              <span>Database</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className={`w-2 h-2 rounded-full ${status.database === 'connected' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              <span className="text-sm font-bold text-gray-900 truncate">
                {status.database === 'connected' ? 'Connected' : 'Error'}
              </span>
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5">PostgreSQL Pool</p>
          </Card>

          <Card className="p-3.5 bg-gradient-to-br from-white to-gray-50/50">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              <span>Uptime</span>
            </div>
            <p className="text-sm font-bold text-gray-900 mt-1.5">{formatUptime(status.uptimeSeconds)}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Continuous running</p>
          </Card>

          <Card className="p-3.5 bg-gradient-to-br from-white to-gray-50/50">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
              <Cpu className="w-3.5 h-3.5 text-indigo-500" />
              <span>Runtime</span>
            </div>
            <p className="text-sm font-bold text-gray-900 mt-1.5">{status.nodeVersion}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{status.platform} ({status.arch})</p>
          </Card>

          <Card className="p-3.5 bg-gradient-to-br from-white to-gray-50/50">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
              <Server className="w-3.5 h-3.5 text-amber-500" />
              <span>Memory Heap</span>
            </div>
            <p className="text-sm font-bold text-gray-900 mt-1.5">{status.memory.heapUsedMb} MB</p>
            <p className="text-[10px] text-gray-400 mt-0.5">of {status.memory.heapTotalMb} MB (RSS: {status.memory.rssMb}MB)</p>
          </Card>

          <Card className="p-3.5 bg-gradient-to-br from-white to-gray-50/50">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
              <Terminal className="w-3.5 h-3.5 text-rose-500" />
              <span>In-Memory</span>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-sm font-bold text-gray-900">{status.logStats.inMemoryLogsCount} logs</span>
              {status.logStats.inMemoryErrorsCount > 0 && (
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">
                  {status.logStats.inMemoryErrorsCount} errs
                </span>
              )}
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5">Circular Buffer</p>
          </Card>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-6">
          <button
            onClick={() => setActiveTab('all')}
            className={`py-3 px-1 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'all'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>All Logs Stream</span>
            <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700 font-semibold">
              {logs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('errors')}
            className={`py-3 px-1 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'errors'
                ? 'border-rose-600 text-rose-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <AlertCircle className="w-4 h-4 text-rose-500" />
            <span>Errors & Stack Traces</span>
            {errors.length > 0 && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-rose-100 text-rose-700 font-bold">
                {errors.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('telemetry')}
            className={`py-3 px-1 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'telemetry'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Server Health & Telemetry</span>
          </button>
        </nav>
      </div>

      {activeTab === 'telemetry' ? (
        /* Detailed Server Telemetry Tab */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <CardHeader className="pb-4 border-b border-gray-100">
              <CardTitle className="text-base flex items-center gap-2">
                <Server className="w-4 h-4 text-primary-600" />
                Backend Node.js Environment
              </CardTitle>
              <CardDescription>Process runtime statistics and system environment info.</CardDescription>
            </CardHeader>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500">Node Version</span>
                <span className="font-mono font-medium text-gray-900">{status?.nodeVersion}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500">Platform & Arch</span>
                <span className="font-mono font-medium text-gray-900">{status?.platform} ({status?.arch})</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500">Server Uptime</span>
                <span className="font-mono font-medium text-gray-900">{status ? formatUptime(status.uptimeSeconds) : '-'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500">Environment Mode</span>
                <Badge variant={status?.environment === 'production' ? 'success' : 'warning'} size="sm">
                  {status?.environment}
                </Badge>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500">PostgreSQL Status</span>
                <span className="font-semibold text-emerald-600">{status?.database}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-gray-500">Server Time (UTC)</span>
                <span className="font-mono text-xs text-gray-700">{status?.timestamp}</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <CardHeader className="pb-4 border-b border-gray-100">
              <CardTitle className="text-base flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-600" />
                Memory & Buffer Allocation
              </CardTitle>
              <CardDescription>Live heap memory consumption and circular buffer metrics.</CardDescription>
            </CardHeader>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500">Heap Used</span>
                <span className="font-mono font-bold text-gray-900">{status?.memory.heapUsedMb} MB</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500">Heap Total</span>
                <span className="font-mono font-medium text-gray-900">{status?.memory.heapTotalMb} MB</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500">Resident Set Size (RSS)</span>
                <span className="font-mono font-medium text-gray-900">{status?.memory.rssMb} MB</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500">External Memory</span>
                <span className="font-mono font-medium text-gray-900">{status?.memory.externalMb} MB</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500">In-Memory General Logs</span>
                <span className="font-mono font-medium text-gray-900">{status?.logStats.inMemoryLogsCount} / 1000 items</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-gray-500">In-Memory Error Buffer</span>
                <span className="font-mono font-medium text-gray-900">{status?.logStats.inMemoryErrorsCount} / 250 items</span>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        /* Logs Stream or Errors Stream */
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by keyword, request ID, URL, tenant ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                />
              </div>

              {/* Level Filter (Only for All Logs tab) */}
              {activeTab === 'all' && (
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <Filter className="w-3.5 h-3.5 text-gray-400" />
                  <span>Level:</span>
                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  >
                    <option value="all">All Levels</option>
                    <option value="info">Info</option>
                    <option value="warn">Warn</option>
                    <option value="error">Error</option>
                    <option value="fatal">Fatal</option>
                    <option value="debug">Debug</option>
                  </select>
                </div>
              )}

              {/* Module Filter */}
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Layers className="w-3.5 h-3.5 text-gray-400" />
                <span>Module:</span>
                <select
                  value={selectedModule}
                  onChange={(e) => setSelectedModule(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                >
                  <option value="">All Modules</option>
                  <option value="app">app</option>
                  <option value="meta-onboarding">meta-onboarding</option>
                  <option value="templates">templates</option>
                  <option value="links">links</option>
                  <option value="webhooks">webhooks</option>
                  <option value="flows">flows</option>
                  <option value="campaigns">campaigns</option>
                  <option value="channels">channels</option>
                  <option value="contacts">contacts</option>
                  <option value="deals">deals</option>
                </select>
              </div>

              {/* Limit */}
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <span>Limit:</span>
                <select
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                >
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                  <option value={500}>500</option>
                  <option value={1000}>1000</option>
                </select>
              </div>
            </div>

            <div className="text-xs text-gray-400 font-mono">
              Showing {currentList.length} items
            </div>
          </div>

          {/* Logs Terminal View Container */}
          <div className="bg-slate-950 text-slate-200 rounded-2xl border border-slate-800 shadow-xl overflow-hidden font-mono text-xs">
            {/* Terminal Window Header Bar */}
            <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                <span className="text-xs text-slate-400 font-semibold ml-2 font-sans flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-primary-400" />
                  backend-stdout: {activeTab === 'errors' ? 'error.log' : 'app.log'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                <span>Press row to inspect payload</span>
              </div>
            </div>

            {/* List of Entries */}
            <div className="divide-y divide-slate-800/60 max-h-[620px] overflow-y-auto scrollbar-thin">
              {currentList.length === 0 ? (
                <div className="py-16 px-4 text-center text-slate-500">
                  <Terminal className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="font-sans font-medium text-sm">No log entries matching the selected criteria.</p>
                  <p className="text-xs text-slate-600 mt-1 font-sans">Incoming server events and errors will appear here automatically.</p>
                </div>
              ) : (
                currentList.map((entry) => {
                  const isSelected = selectedEntry?.id === entry.id;
                  const isErrorLevel = entry.level === 'error' || entry.level === 'fatal';
                  const isWarnLevel = entry.level === 'warn';

                  return (
                    <div
                      key={entry.id}
                      onClick={() => setSelectedEntry(isSelected ? null : entry)}
                      className={`px-4 py-2.5 transition-colors cursor-pointer flex flex-col gap-1.5 ${
                        isSelected
                          ? 'bg-slate-800/80'
                          : isErrorLevel
                          ? 'bg-rose-950/20 hover:bg-rose-950/40'
                          : isWarnLevel
                          ? 'bg-amber-950/10 hover:bg-amber-950/25'
                          : 'hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-2 text-[11px]">
                        {/* Timestamp */}
                        <span className="text-slate-400 select-none">
                          {entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString() : '--:--:--'}
                        </span>

                        {/* Level */}
                        {getLevelBadge(entry.level)}

                        {/* Module Tag */}
                        {entry.module && (
                          <span className="text-primary-400 font-semibold bg-primary-950/60 px-1.5 py-0.5 rounded border border-primary-800/40">
                            [{entry.module}]
                          </span>
                        )}

                        {/* HTTP Status Code */}
                        {getStatusBadge(entry.statusCode)}

                        {/* Duration */}
                        {entry.durationMs !== undefined && (
                          <span className="text-slate-500 text-[10px]">
                            {entry.durationMs}ms
                          </span>
                        )}

                        {/* Req ID */}
                        {entry.reqId && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(entry.reqId!, entry.id);
                            }}
                            title="Click to copy Request ID"
                            className="text-slate-500 hover:text-slate-300 text-[10px] cursor-copy flex items-center gap-1"
                          >
                            <span>req: {entry.reqId.substring(0, 8)}...</span>
                            {copiedId === entry.id ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-2.5 h-2.5 opacity-60" />
                            )}
                          </span>
                        )}

                        {/* Message */}
                        <span
                          className={`flex-1 font-medium break-all ${
                            isErrorLevel
                              ? 'text-rose-300'
                              : isWarnLevel
                              ? 'text-amber-200'
                              : 'text-slate-200'
                          }`}
                        >
                          {entry.message}
                        </span>

                        <div className="text-slate-500 shrink-0">
                          {isSelected ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </div>
                      </div>

                      {/* Expandable Details Tray */}
                      {isSelected && (
                        <div
                          className="mt-2 p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-3 text-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                                Event Full Trace & Metadata
                              </span>
                              {entry.reqId && (
                                <Badge variant="secondary" size="sm" className="bg-slate-800 text-slate-300 border-slate-700">
                                  ID: {entry.reqId}
                                </Badge>
                              )}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(JSON.stringify(entry, null, 2), entry.id + '-full')}
                              className="h-7 text-[11px] bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700"
                              icon={
                                copiedId === entry.id + '-full' ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )
                              }
                            >
                              {copiedId === entry.id + '-full' ? 'Copied' : 'Copy JSON'}
                            </Button>
                          </div>

                          {/* Error Stack Trace (if present) */}
                          {entry.error && (
                            <div className="space-y-1">
                              <div className="text-rose-400 font-semibold flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span>Error: {entry.error.name || 'Error'} — {entry.error.message}</span>
                              </div>
                              {entry.error.stack && (
                                <pre className="p-3 bg-rose-950/30 text-rose-300 rounded-lg border border-rose-900/50 overflow-x-auto text-[11px] whitespace-pre-wrap leading-relaxed">
                                  {entry.error.stack}
                                </pre>
                              )}
                              {entry.error.details && (
                                <div className="mt-1">
                                  <span className="text-slate-400 text-[10px]">Error Details:</span>
                                  <pre className="p-2 bg-slate-950 text-slate-300 rounded border border-slate-800 text-[11px] overflow-x-auto">
                                    {JSON.stringify(entry.error.details, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Request Metadata & Sanitize Object */}
                          {entry.meta && Object.keys(entry.meta).length > 0 && (
                            <div className="space-y-1">
                              <span className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
                                Context Meta:
                              </span>
                              <pre className="p-3 bg-slate-950 text-emerald-400 rounded-lg border border-slate-800 overflow-x-auto text-[11px] whitespace-pre leading-relaxed">
                                {JSON.stringify(entry.meta, null, 2)}
                              </pre>
                            </div>
                          )}

                          {/* Metadata Summary Chips */}
                          <div className="flex flex-wrap gap-2 text-[11px] text-slate-400 pt-1">
                            {entry.tenantId && (
                              <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                                Tenant: {entry.tenantId}
                              </span>
                            )}
                            {entry.userId && (
                              <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                                User: {entry.userId}
                              </span>
                            )}
                            <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                              ISO: {entry.timestamp}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal to Clear In-Memory Logs */}
      <Modal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        title="Clear In-Memory Log Buffers?"
        description="This will purge the current in-memory log buffer (up to 1,000 entries) and error buffer (up to 250 entries). Disk logs in logs/app.log and logs/error.log will be preserved."
      >
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>
              This operation clears real-time memory caches immediately. Active WebSocket or polling feeds will start collecting from empty.
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setIsClearModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleClearLogs}
              isLoading={isClearing}
              icon={<Trash2 className="w-4 h-4" />}
            >
              Confirm & Clear
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
