'use client';
import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Database, Activity, Zap, Lock, TrendingUp, AlertCircle, Bell, Settings as SettingsIcon, X } from 'lucide-react';
import { Modal } from '@/components/Modal';

interface ConnectionStat {
  connections: string;
  state: string;
}

interface SlowQuery {
  query: string;
  calls: string;
  total_time: string;
  mean_time: string;
  max_time: string;
}

interface IndexUsage {
  schemaname: string;
  tablename: string;
  indexname: string;
  idx_scan: string;
  idx_tup_read: string;
}

interface TableStat {
  schemaname: string;
  tablename: string;
  row_count: string;
  total_size: string;
}

interface DatabaseStats {
  connections: ConnectionStat[];
  slowQueries: SlowQuery[];
  indexUsage: IndexUsage[];
  tableStats: TableStat[];
}

interface CacheHitRatio {
  cache_hit_ratio: string;
}

interface IndexHitRatio {
  index_hit_ratio: string;
}

interface Lock {
  locktype: string;
  mode: string;
  count: string;
}

interface PerformanceMetrics {
  cacheHitRatio: CacheHitRatio[];
  indexHitRatio: IndexHitRatio[];
  locks: Lock[];
}

interface Alert {
  type: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  data: any;
  timestamp: string;
}

interface AlertConfig {
  slowQueryThreshold: number;
  cacheHitRateThreshold: number;
  indexHitRateThreshold: number;
  connectionThreshold: number;
  enabled: boolean;
}

export default function DatabaseMonitoringPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'queries' | 'indexes' | 'performance'>('overview');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showAlertSettings, setShowAlertSettings] = useState(false);
  const [alertConfig, setAlertConfig] = useState<AlertConfig>({
    slowQueryThreshold: 200,
    cacheHitRateThreshold: 80,
    indexHitRateThreshold: 90,
    connectionThreshold: 100,
    enabled: true,
  });

  useEffect(() => {
    const token = localStorage.getItem('rar_token');
    if (!token) {
      setError('Authentication required');
      return;
    }

    const API_BASE = process.env.NEXT_PUBLIC_KRIETA_API_URL || 'http://localhost:3000';
    const newSocket = io(API_BASE, {
      path: '/socket.io/database-monitor',
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      setError(null);
      // Request current alert config
      newSocket.emit('get-alert-config');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      setError(err.message);
      setIsConnected(false);
    });

    newSocket.on('database-metrics', (data: { stats: DatabaseStats; performance: PerformanceMetrics }) => {
      setStats(data.stats);
      setPerformance(data.performance);
    });

    newSocket.on('database-alerts', (newAlerts: Alert[]) => {
      setAlerts(prev => [...newAlerts, ...prev].slice(0, 50)); // Keep last 50 alerts
    });

    newSocket.on('alert-config', (config: AlertConfig) => {
      setAlertConfig(config);
    });

    newSocket.on('alert-config-updated', (config: AlertConfig) => {
      setAlertConfig(config);
    });

    newSocket.on('error', (err: { message: string }) => {
      setError(err.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const handleRefresh = useCallback(() => {
    if (socket && isConnected) {
      socket.emit('refresh-metrics');
    }
  }, [socket, isConnected]);

  const handleUpdateAlertConfig = useCallback((updates: Partial<AlertConfig>) => {
    if (socket && isConnected) {
      const newConfig = { ...alertConfig, ...updates };
      socket.emit('update-alert-config', newConfig);
    }
  }, [socket, isConnected, alertConfig]);

  const dismissAlert = useCallback((index: number) => {
    setAlerts(prev => prev.filter((_, i) => i !== index));
  }, []);

  const isLoading = !stats || !performance;
  const unreadAlerts = alerts.filter(a => a.severity === 'critical' || a.severity === 'warning').length;

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{
          background: 'var(--rar-error-bg)',
          border: '1px solid var(--rar-error)',
          borderRadius: 8,
          padding: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <AlertCircle size={20} color="var(--rar-error)" />
          <div>
            <div style={{ fontWeight: 600, color: 'var(--rar-error)', marginBottom: 4 }}>
              Failed to connect to database monitoring
            </div>
            <div style={{ fontSize: 14, color: 'var(--rar-text-muted)' }}>
              {error}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalConnections = stats?.connections.reduce((sum, c) => sum + parseInt(c.connections), 0) || 0;
  const cacheHitRate = performance?.cacheHitRatio[0]?.cache_hit_ratio 
    ? (parseFloat(performance.cacheHitRatio[0].cache_hit_ratio) * 100).toFixed(2) 
    : '0';
  const indexHitRate = performance?.indexHitRatio[0]?.index_hit_ratio 
    ? (parseFloat(performance.indexHitRatio[0].index_hit_ratio) * 100).toFixed(2) 
    : '0';

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Database size={28} color="var(--rar-primary)" />
            <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--rar-text)' }}>
              Database Monitoring
            </h1>
            {isConnected && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 12px',
                background: '#10b98115',
                border: '1px solid #10b981',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                color: '#10b981',
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                Live
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => setShowAlertSettings(true)}
              style={{
                padding: '8px 16px',
                background: 'var(--rar-surface)',
                border: '1px solid var(--rar-border)',
                borderRadius: 8,
                color: 'var(--rar-text)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              <SettingsIcon size={16} />
              Alert Settings
            </button>
            {unreadAlerts > 0 && (
              <div style={{
                padding: '8px 16px',
                background: '#ef444415',
                border: '1px solid #ef4444',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 14,
                fontWeight: 600,
                color: '#ef4444',
              }}>
                <Bell size={16} />
                {unreadAlerts} Alert{unreadAlerts > 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
        <p style={{ color: 'var(--rar-text-muted)', fontSize: 14 }}>
          Real-time database performance metrics via WebSocket
        </p>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          {alerts.slice(0, 3).map((alert, i) => (
            <AlertBanner key={i} alert={alert} onDismiss={() => dismissAlert(i)} />
          ))}
        </div>
      )}

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 16,
        marginBottom: 24,
      }}>
        <StatCard
          icon={<Activity size={20} />}
          label="Active Connections"
          value={isLoading ? '...' : totalConnections.toString()}
          color="#3b82f6"
        />
        <StatCard
          icon={<Zap size={20} />}
          label="Cache Hit Rate"
          value={isLoading ? '...' : `${cacheHitRate}%`}
          color="#10b981"
          status={parseFloat(cacheHitRate) > 90 ? 'good' : parseFloat(cacheHitRate) > 70 ? 'warning' : 'bad'}
        />
        <StatCard
          icon={<TrendingUp size={20} />}
          label="Index Hit Rate"
          value={isLoading ? '...' : `${indexHitRate}%`}
          color="#8b5cf6"
          status={parseFloat(indexHitRate) > 95 ? 'good' : parseFloat(indexHitRate) > 80 ? 'warning' : 'bad'}
        />
        <StatCard
          icon={<Lock size={20} />}
          label="Database Locks"
          value={isLoading ? '...' : (performance?.locks.length || 0).toString()}
          color="#f59e0b"
        />
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: 8,
        borderBottom: '1px solid var(--rar-border)',
        marginBottom: 24,
      }}>
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'queries', label: 'Slow Queries' },
          { id: 'indexes', label: 'Index Usage' },
          { id: 'performance', label: 'Performance' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '12px 20px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--rar-primary)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--rar-primary)' : 'var(--rar-text-muted)',
              fontWeight: activeTab === tab.id ? 600 : 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--rar-text-muted)' }}>
          Loading database metrics...
        </div>
      ) : (
        <>
          {activeTab === 'overview' && <OverviewTab stats={stats} performance={performance} />}
          {activeTab === 'queries' && <SlowQueriesTab queries={stats?.slowQueries || []} />}
          {activeTab === 'indexes' && <IndexUsageTab indexes={stats?.indexUsage || []} />}
          {activeTab === 'performance' && <PerformanceTab stats={stats} performance={performance} />}
        </>
      )}

      {/* Alert Settings Modal */}
      {showAlertSettings && (
        <Modal onClose={() => setShowAlertSettings(false)} title="Alert Settings">
          <div style={{ padding: 24 }}>
            <div style={{ marginBottom: 24 }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--rar-text)',
                marginBottom: 8,
              }}>
                <input
                  type="checkbox"
                  checked={alertConfig.enabled}
                  onChange={(e) => handleUpdateAlertConfig({ enabled: e.target.checked })}
                  style={{ width: 18, height: 18 }}
                />
                Enable Alerts
              </label>
            </div>

            <div style={{ display: 'grid', gap: 20 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--rar-text)', marginBottom: 8, display: 'block' }}>
                  Slow Query Threshold (ms)
                </label>
                <input
                  type="number"
                  value={alertConfig.slowQueryThreshold}
                  onChange={(e) => handleUpdateAlertConfig({ slowQueryThreshold: parseInt(e.target.value) })}
                  disabled={!alertConfig.enabled}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--rar-border)',
                    borderRadius: 8,
                    fontSize: 14,
                    color: 'var(--rar-text)',
                    background: 'var(--rar-surface)',
                  }}
                />
                <p style={{ fontSize: 12, color: 'var(--rar-text-muted)', marginTop: 4 }}>
                  Alert when queries exceed this execution time
                </p>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--rar-text)', marginBottom: 8, display: 'block' }}>
                  Cache Hit Rate Threshold (%)
                </label>
                <input
                  type="number"
                  value={alertConfig.cacheHitRateThreshold}
                  onChange={(e) => handleUpdateAlertConfig({ cacheHitRateThreshold: parseInt(e.target.value) })}
                  disabled={!alertConfig.enabled}
                  min="0"
                  max="100"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--rar-border)',
                    borderRadius: 8,
                    fontSize: 14,
                    color: 'var(--rar-text)',
                    background: 'var(--rar-surface)',
                  }}
                />
                <p style={{ fontSize: 12, color: 'var(--rar-text-muted)', marginTop: 4 }}>
                  Alert when cache hit rate falls below this percentage
                </p>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--rar-text)', marginBottom: 8, display: 'block' }}>
                  Index Hit Rate Threshold (%)
                </label>
                <input
                  type="number"
                  value={alertConfig.indexHitRateThreshold}
                  onChange={(e) => handleUpdateAlertConfig({ indexHitRateThreshold: parseInt(e.target.value) })}
                  disabled={!alertConfig.enabled}
                  min="0"
                  max="100"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--rar-border)',
                    borderRadius: 8,
                    fontSize: 14,
                    color: 'var(--rar-text)',
                    background: 'var(--rar-surface)',
                  }}
                />
                <p style={{ fontSize: 12, color: 'var(--rar-text-muted)', marginTop: 4 }}>
                  Alert when index hit rate falls below this percentage
                </p>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--rar-text)', marginBottom: 8, display: 'block' }}>
                  Connection Threshold
                </label>
                <input
                  type="number"
                  value={alertConfig.connectionThreshold}
                  onChange={(e) => handleUpdateAlertConfig({ connectionThreshold: parseInt(e.target.value) })}
                  disabled={!alertConfig.enabled}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--rar-border)',
                    borderRadius: 8,
                    fontSize: 14,
                    color: 'var(--rar-text)',
                    background: 'var(--rar-surface)',
                  }}
                />
                <p style={{ fontSize: 12, color: 'var(--rar-text-muted)', marginTop: 4 }}>
                  Alert when active connections exceed this count
                </p>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function AlertBanner({ alert, onDismiss }: { alert: Alert; onDismiss: () => void }) {
  const severityColors = {
    info: { bg: '#3b82f615', border: '#3b82f6', text: '#3b82f6' },
    warning: { bg: '#f59e0b15', border: '#f59e0b', text: '#f59e0b' },
    critical: { bg: '#ef444415', border: '#ef4444', text: '#ef4444' },
  };

  const colors = severityColors[alert.severity];

  return (
    <div style={{
      background: colors.bg,
      border: `1px solid ${colors.border}`,
      borderRadius: 8,
      padding: 16,
      marginBottom: 12,
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
    }}>
      <AlertCircle size={20} color={colors.border} style={{ flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, color: colors.text, marginBottom: 4, textTransform: 'uppercase', fontSize: 12 }}>
          {alert.severity}
        </div>
        <div style={{ color: 'var(--rar-text)', fontSize: 14, marginBottom: 4 }}>
          {alert.message}
        </div>
        <div style={{ fontSize: 12, color: 'var(--rar-text-muted)' }}>
          {new Date(alert.timestamp).toLocaleString()}
        </div>
      </div>
      <button
        onClick={onDismiss}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--rar-text-muted)',
          cursor: 'pointer',
          padding: 4,
        }}
      >
        <X size={18} />
      </button>
    </div>
  );
}

function StatCard({ icon, label, value, color, status }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  status?: 'good' | 'warning' | 'bad';
}) {
  const statusColors = {
    good: '#10b981',
    warning: '#f59e0b',
    bad: '#ef4444',
  };

  return (
    <div style={{
      background: 'var(--rar-surface)',
      border: '1px solid var(--rar-border)',
      borderRadius: 12,
      padding: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: `${color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color,
        }}>
          {icon}
        </div>
        {status && (
          <div style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: statusColors[status],
            marginLeft: 'auto',
          }} />
        )}
      </div>
      <div style={{ fontSize: 13, color: 'var(--rar-text-muted)', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--rar-text)' }}>
        {value}
      </div>
    </div>
  );
}

function OverviewTab({ stats, performance }: { stats?: DatabaseStats; performance?: PerformanceMetrics }) {
  return (
    <div style={{ display: 'grid', gap: 24 }}>
      {/* Connections */}
      <Section title="Database Connections">
        <Table
          headers={['State', 'Count']}
          rows={stats?.connections.map(c => [
            c.state || 'unknown',
            c.connections,
          ]) || []}
        />
      </Section>

      {/* Top Tables */}
      <Section title="Largest Tables">
        <Table
          headers={['Table', 'Rows', 'Size']}
          rows={stats?.tableStats.slice(0, 10).map(t => [
            t.tablename,
            parseInt(t.row_count).toLocaleString(),
            t.total_size,
          ]) || []}
        />
      </Section>
    </div>
  );
}

function SlowQueriesTab({ queries }: { queries: SlowQuery[] }) {
  return (
    <Section title="Slow Queries (>100ms mean time)">
      {queries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--rar-text-muted)' }}>
          No slow queries detected
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {queries.map((q, i) => (
            <div key={i} style={{
              background: 'var(--rar-surface)',
              border: '1px solid var(--rar-border)',
              borderRadius: 8,
              padding: 16,
            }}>
              <div style={{
                fontFamily: 'monospace',
                fontSize: 13,
                color: 'var(--rar-text)',
                marginBottom: 12,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}>
                {q.query.length > 200 ? q.query.substring(0, 200) + '...' : q.query}
              </div>
              <div style={{ display: 'flex', gap: 24, fontSize: 13 }}>
                <div>
                  <span style={{ color: 'var(--rar-text-muted)' }}>Calls: </span>
                  <span style={{ color: 'var(--rar-text)', fontWeight: 600 }}>{q.calls}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--rar-text-muted)' }}>Mean: </span>
                  <span style={{ color: 'var(--rar-text)', fontWeight: 600 }}>
                    {parseFloat(q.mean_time).toFixed(2)}ms
                  </span>
                </div>
                <div>
                  <span style={{ color: 'var(--rar-text-muted)' }}>Max: </span>
                  <span style={{ color: 'var(--rar-text)', fontWeight: 600 }}>
                    {parseFloat(q.max_time).toFixed(2)}ms
                  </span>
                </div>
                <div>
                  <span style={{ color: 'var(--rar-text-muted)' }}>Total: </span>
                  <span style={{ color: 'var(--rar-text)', fontWeight: 600 }}>
                    {(parseFloat(q.total_time) / 1000).toFixed(2)}s
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

function IndexUsageTab({ indexes }: { indexes: IndexUsage[] }) {
  return (
    <Section title="Most Used Indexes">
      <Table
        headers={['Table', 'Index', 'Scans', 'Tuples Read']}
        rows={indexes.map(idx => [
          idx.tablename,
          idx.indexname,
          parseInt(idx.idx_scan).toLocaleString(),
          parseInt(idx.idx_tup_read).toLocaleString(),
        ])}
      />
    </Section>
  );
}

function PerformanceTab({ stats, performance }: { stats?: DatabaseStats; performance?: PerformanceMetrics }) {
  return (
    <div style={{ display: 'grid', gap: 24 }}>
      {/* Cache Performance */}
      <Section title="Cache Performance">
        <div style={{ padding: 16 }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: 'var(--rar-text-muted)', marginBottom: 8 }}>
              Cache Hit Ratio
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                flex: 1,
                height: 8,
                background: 'var(--rar-border)',
                borderRadius: 4,
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${parseFloat(performance?.cacheHitRatio[0]?.cache_hit_ratio || '0') * 100}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #10b981, #059669)',
                  transition: 'width 0.3s',
                }} />
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--rar-text)' }}>
                {(parseFloat(performance?.cacheHitRatio[0]?.cache_hit_ratio || '0') * 100).toFixed(2)}%
              </div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 13, color: 'var(--rar-text-muted)', marginBottom: 8 }}>
              Index Hit Ratio
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                flex: 1,
                height: 8,
                background: 'var(--rar-border)',
                borderRadius: 4,
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${parseFloat(performance?.indexHitRatio[0]?.index_hit_ratio || '0') * 100}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #8b5cf6, #7c3aed)',
                  transition: 'width 0.3s',
                }} />
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--rar-text)' }}>
                {(parseFloat(performance?.indexHitRatio[0]?.index_hit_ratio || '0') * 100).toFixed(2)}%
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Locks */}
      <Section title="Database Locks">
        <Table
          headers={['Lock Type', 'Mode', 'Count']}
          rows={performance?.locks.map(lock => [
            lock.locktype,
            lock.mode,
            lock.count,
          ]) || []}
        />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--rar-surface)',
      border: '1px solid var(--rar-border)',
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      <div style={{
        padding: 16,
        borderBottom: '1px solid var(--rar-border)',
        fontWeight: 600,
        color: 'var(--rar-text)',
      }}>
        {title}
      </div>
      <div>{children}</div>
    </div>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'var(--rar-bg)', borderBottom: '1px solid var(--rar-border)' }}>
            {headers.map((h, i) => (
              <th key={i} style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--rar-text-muted)',
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--rar-border)' }}>
              {row.map((cell, j) => (
                <td key={j} style={{
                  padding: '12px 16px',
                  fontSize: 14,
                  color: 'var(--rar-text)',
                }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
