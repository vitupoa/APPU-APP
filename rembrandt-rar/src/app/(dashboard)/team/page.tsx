'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDate, getInitials } from '@/lib/utils';
import { LoadingState, StatusBadge } from '@/components/shared';
import { Shield, Crown } from 'lucide-react';

export default function TeamPage() {
  const { data: team, isLoading } = useQuery({
    queryKey: ['admin-team'],
    queryFn: () => api.get('/team').then(r => r.data),
  });

  if (isLoading) return <LoadingState />;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>Admin Team</h1>
        <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--rar-text-muted)' }}>
          All administrators with access to RembrandtRAR
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {(Array.isArray(team) ? team : []).map((admin: any) => (
          <div key={admin.id} className="glass-card stat-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                background: admin.role === 'SUPER_ADMIN'
                  ? 'linear-gradient(135deg, #f59e0b, #ef4444)'
                  : 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, fontWeight: 800, color: 'white', flexShrink: 0,
              }}>
                {admin.avatarUrl ? (
                  <img src={admin.avatarUrl} alt="" style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover' }} />
                ) : getInitials(admin.displayName || admin.username)}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                    {admin.displayName || admin.username}
                  </h3>
                  {admin.role === 'SUPER_ADMIN' && <Crown size={16} color="#f59e0b" />}
                </div>
                <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--rar-text-muted)' }}>
                  @{admin.username}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: 'var(--rar-text-muted)' }}>Role</span>
                <span className={`badge ${admin.role === 'SUPER_ADMIN' ? 'badge-warning' : 'badge-info'}`}>
                  {admin.role?.replace(/_/g, ' ')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: 'var(--rar-text-muted)' }}>Email</span>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{admin.email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: 'var(--rar-text-muted)' }}>Status</span>
                <StatusBadge status={admin.adminStatus || 'ACTIVE'} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: 'var(--rar-text-muted)' }}>Since</span>
                <span style={{ fontSize: 13 }}>{admin.adminProfile?.createdAt ? formatDate(admin.adminProfile.createdAt) : formatDate(admin.createdAt)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
