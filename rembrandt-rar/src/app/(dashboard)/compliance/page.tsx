'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { LoadingState } from '@/components/shared';
import { Shield, AlertTriangle, FileText, Activity, TrendingUp, Clock } from 'lucide-react';
import Link from 'next/link';

export default function CompliancePage() {
  const { data: reviewStats, isLoading: reviewsLoading } = useQuery({
    queryKey: ['compliance-review-stats'],
    queryFn: () => api.get('/compliance/reviews/stats').then(r => r.data.data),
  });

  const { data: sarStats, isLoading: sarsLoading } = useQuery({
    queryKey: ['compliance-sar-stats'],
    queryFn: () => api.get('/compliance/sars', { params: { limit: 1 } }).then(r => ({
      total: r.data.pagination.total,
      pending: 0, // We'll calculate from data if needed
    })),
  });

  const { data: auditStats, isLoading: auditLoading } = useQuery({
    queryKey: ['compliance-audit-stats'],
    queryFn: () => api.get('/compliance/audit-logs/stats').then(r => r.data.data),
  });

  const isLoading = reviewsLoading || sarsLoading || auditLoading;

  const statCards = [
    {
      title: 'Pending Reviews',
      value: reviewStats?.byStatus?.find((s: any) => s.status === 'PENDING')?._count || 0,
      icon: Clock,
      color: '#f59e0b',
      href: '/compliance/reviews?status=PENDING',
    },
    {
      title: 'Total Reviews',
      value: reviewStats?.total || 0,
      icon: Shield,
      color: '#3b82f6',
      href: '/compliance/reviews',
    },
    {
      title: 'SARs Filed',
      value: sarStats?.total || 0,
      icon: AlertTriangle,
      color: '#ef4444',
      href: '/compliance/sars',
    },
    {
      title: 'Audit Logs',
      value: auditStats?.totalLogs || 0,
      icon: FileText,
      color: '#8b5cf6',
      href: '/compliance/audit-logs',
    },
  ];

  const quickActions = [
    {
      title: 'Compliance Reviews',
      description: 'Review flagged transactions and user activities',
      icon: Shield,
      href: '/compliance/reviews',
      color: '#3b82f6',
    },
    {
      title: 'Suspicious Activity Reports',
      description: 'Manage and file SARs for regulatory compliance',
      icon: AlertTriangle,
      href: '/compliance/sars',
      color: '#ef4444',
    },
    {
      title: 'Audit Logs',
      description: 'View complete audit trail of compliance actions',
      icon: FileText,
      href: '/compliance/audit-logs',
      color: '#8b5cf6',
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' }}>
          Compliance Dashboard
        </h1>
        <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--rar-text-muted)' }}>
          Monitor and manage compliance reviews, SARs, and audit logs
        </p>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : (
        <>
          {/* Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 20,
            marginBottom: 32,
          }}>
            {statCards.map((stat) => (
              <Link
                key={stat.title}
                href={stat.href}
                className="glass-card"
                style={{
                  padding: 20,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textDecoration: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: `${stat.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <stat.icon size={20} style={{ color: stat.color }} />
                  </div>
                  <TrendingUp size={16} style={{ color: 'var(--rar-text-muted)' }} />
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--rar-text)', marginBottom: 4 }}>
                  {stat.value.toLocaleString()}
                </div>
                <div style={{ fontSize: 13, color: 'var(--rar-text-muted)' }}>
                  {stat.title}
                </div>
              </Link>
            ))}
          </div>

          {/* Quick Actions */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Quick Actions</h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 16,
            }}>
              {quickActions.map((action) => (
                <Link
                  key={action.title}
                  href={action.href}
                  className="glass-card"
                  style={{
                    padding: 20,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textDecoration: 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: `${action.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <action.icon size={24} style={{ color: action.color }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--rar-text)', marginBottom: 4 }}>
                        {action.title}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--rar-text-muted)', lineHeight: 1.5 }}>
                        {action.description}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Recent Activity</h2>
            <div className="glass-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <Activity size={20} style={{ color: 'var(--rar-accent)' }} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>Latest Compliance Actions</span>
              </div>
              {reviewStats?.byStatus && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {reviewStats.byStatus.map((stat: any) => (
                    <div key={stat.status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: 'var(--rar-text-muted)' }}>
                        {stat.status.replace('_', ' ')}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--rar-text)' }}>
                        {stat._count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
