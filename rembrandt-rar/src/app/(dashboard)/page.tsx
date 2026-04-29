'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatNumber, formatCurrency } from '@/lib/utils';
import { LoadingState } from '@/components/shared';
import { useAdminStore } from '@/store/adminStore';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, DollarSign, Film, TrendingUp, ArrowUpRight,
  ArrowDownRight, ShieldAlert, Clock, Settings, LogOut, UserPlus
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';

function StatCard({ title, value, icon: Icon, color, trend, trendValue }: {
  title: string; value: string | number; icon: any; color: string;
  trend?: 'up' | 'down'; trendValue?: string;
}) {
  return (
    <div className="glass-card stat-card" style={{ padding: '20px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: 13, color: 'var(--rar-text-muted)', margin: '0 0 8px', fontWeight: 500 }}>{title}</p>
          <p style={{ fontSize: 28, fontWeight: 800, margin: 0, color: 'var(--rar-text)', letterSpacing: '-0.02em' }}>
            {typeof value === 'number' ? formatNumber(value) : value}
          </p>
          {trend && trendValue && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
              {trend === 'up' ? <ArrowUpRight size={14} color="#10b981" /> : <ArrowDownRight size={14} color="#ef4444" />}
              <span style={{ fontSize: 12, color: trend === 'up' ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                {trendValue}
              </span>
              <span style={{ fontSize: 12, color: 'var(--rar-text-muted)' }}>vs last period</span>
            </div>
          )}
        </div>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: `${color}15`, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={22} color={color} />
        </div>
      </div>
    </div>
  );
}

const chartTooltipStyle = {
  contentStyle: {
    background: '#1e293b', border: '1px solid #334155',
    borderRadius: 8, fontSize: 13, color: '#f1f5f9',
  },
  labelStyle: { color: '#94a3b8' },
};

export default function DashboardPage() {
  const { logout, isSuperAdmin } = useAdminStore();
  const router = useRouter();
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  const { data: overview, isLoading } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: () => api.get('/dashboard').then(r => r.data),
  });

  const { data: growth } = useQuery({
    queryKey: ['user-growth'],
    queryFn: () => api.get('/dashboard/user-growth?days=30').then(r => r.data),
  });

  const { data: revenue } = useQuery({
    queryKey: ['revenue-chart'],
    queryFn: () => api.get('/dashboard/revenue?days=30').then(r => r.data),
  });

  const { data: contentStats } = useQuery({
    queryKey: ['content-stats'],
    queryFn: () => api.get('/dashboard/content-stats').then(r => r.data),
  });

  const { data: topCreators } = useQuery({
    queryKey: ['top-creators'],
    queryFn: () => api.get('/dashboard/top-creators?limit=5').then(r => r.data),
  });

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleAddAdmin = () => {
    router.push('/team?action=add');
    setShowSettingsMenu(false);
  };

  if (isLoading) return <LoadingState message="Loading dashboard..." />;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>
            Dashboard
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--rar-text-muted)' }}>
            Krieta platform overview and real-time analytics
          </p>
        </div>
        
        {/* Settings Menu */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowSettingsMenu(!showSettingsMenu)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'var(--rar-surface)',
              border: '1px solid var(--rar-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--rar-surface-active)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--rar-surface)'}
          >
            <Settings size={20} color="var(--rar-text)" />
          </button>

          {showSettingsMenu && (
            <>
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 999,
                }}
                onClick={() => setShowSettingsMenu(false)}
              />
              <div style={{
                position: 'absolute',
                top: 48,
                right: 0,
                width: 220,
                background: 'var(--rar-surface)',
                border: '1px solid var(--rar-border)',
                borderRadius: 12,
                boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                zIndex: 1000,
                overflow: 'hidden',
              }}>
                {isSuperAdmin() && (
                  <button
                    onClick={handleAddAdmin}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'transparent',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: 500,
                      color: 'var(--rar-text)',
                      transition: 'background 0.2s',
                      borderBottom: '1px solid var(--rar-border)',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--rar-surface-active)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <UserPlus size={18} />
                    Add Admin
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'transparent',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 500,
                    color: '#ef4444',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#ef444410'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard title="Total Users" value={overview?.totalUsers ?? 0} icon={Users} color="#3b82f6" trend="up" trendValue="+12.5%" />
        <StatCard title="Total Revenue" value={formatCurrency(overview?.totalRevenue ?? 0)} icon={DollarSign} color="#10b981" trend="up" trendValue="+8.2%" />
        <StatCard title="Total Content" value={overview?.totalContent ?? 0} icon={Film} color="#8b5cf6" />
        <StatCard title="Active Suspensions" value={overview?.activeSuspensions ?? 0} icon={ShieldAlert} color="#ef4444" />
        <StatCard title="Pending Withdrawals" value={overview?.pendingWithdrawals ?? 0} icon={Clock} color="#f59e0b" />
        <StatCard title="Active Creators" value={overview?.activeCreators ?? 0} icon={TrendingUp} color="#06b6d4" />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
        {/* User Growth Chart */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700 }}>User Growth (30 days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={growth || []}>
              <defs>
                <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip {...chartTooltipStyle} />
              <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} fill="url(#growthGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Chart */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700 }}>Revenue (30 days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={revenue || []}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip {...chartTooltipStyle} />
              <Bar dataKey="amount" fill="url(#revenueGrad)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Content Stats */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Content Breakdown</h3>
          {contentStats && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Object.entries(contentStats).map(([key, val]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, color: 'var(--rar-text-secondary)', textTransform: 'capitalize' }}>
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <span style={{ fontSize: 16, fontWeight: 700 }}>{formatNumber(val as number)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Creators */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Top Creators</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(topCreators || []).map((creator: any, i: number) => (
              <div key={creator.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'var(--rar-surface-active)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: 'var(--rar-text-muted)',
                }}>
                  {i + 1}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{creator.displayName || creator.username}</div>
                  <div style={{ fontSize: 12, color: 'var(--rar-text-muted)' }}>@{creator.username}</div>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--rar-accent)' }}>
                  {formatNumber(creator.totalContent || 0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
