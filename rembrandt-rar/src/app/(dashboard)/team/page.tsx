'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDate, getInitials } from '@/lib/utils';
import { LoadingState, StatusBadge } from '@/components/shared';
import { Modal } from '@/components/Modal';
import { Shield, Crown, Plus, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAdminStore } from '@/store/adminStore';

type AdminRole = 'SUPER_ADMIN' | 'MODERATOR' | 'FINANCE_MANAGER' | 'SUPPORT_AGENT';

const ROLE_OPTIONS: { value: AdminRole; label: string; description: string }[] = [
  { value: 'SUPER_ADMIN', label: 'Super Admin', description: 'Full access to all features and settings' },
  { value: 'MODERATOR', label: 'Moderator', description: 'Content moderation and user management' },
  { value: 'FINANCE_MANAGER', label: 'Finance Manager', description: 'Financial operations and withdrawals' },
  { value: 'SUPPORT_AGENT', label: 'Support Agent', description: 'Customer support and basic operations' },
];

export default function TeamPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { isSuperAdmin } = useAdminStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    firstName: '',
    lastName: '',
    password: '',
    role: 'MODERATOR' as AdminRole,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      setShowAddModal(true);
    }
  }, [searchParams]);

  const { data: team, isLoading } = useQuery({
    queryKey: ['admin-team'],
    queryFn: () => api.get('/team').then(r => r.data),
  });

  const addAdminMutation = useMutation({
    mutationFn: (data: typeof formData) => api.post('/team/add', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-team'] });
      setShowAddModal(false);
      setFormData({
        email: '',
        username: '',
        firstName: '',
        lastName: '',
        password: '',
        role: 'MODERATOR',
      });
      setError('');
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Failed to add admin');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.email || !formData.username || !formData.firstName || !formData.lastName || !formData.password) {
      setError('All fields are required');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    addAdminMutation.mutate(formData);
  };

  if (isLoading) return <LoadingState />;

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>Admin Team</h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--rar-text-muted)' }}>
            All administrators with access to RembrandtRAR
          </p>
        </div>
        {isSuperAdmin() && (
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              padding: '10px 20px',
              background: 'var(--rar-primary)',
              border: 'none',
              borderRadius: 8,
              color: 'white',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Plus size={18} />
            Add Admin
          </button>
        )}
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

      {/* Add Admin Modal */}
      {showAddModal && (
        <Modal onClose={() => setShowAddModal(false)} title="Add New Admin">
          <form onSubmit={handleSubmit} style={{ padding: 24 }}>
            {error && (
              <div style={{
                padding: 12,
                background: '#ef444415',
                border: '1px solid #ef4444',
                borderRadius: 8,
                color: '#ef4444',
                fontSize: 14,
                marginBottom: 20,
              }}>
                {error}
              </div>
            )}

            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--rar-text)' }}>
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="admin@krieta.com"
                  required
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
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--rar-text)' }}>
                  Username *
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                  placeholder="admin_username"
                  required
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
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--rar-text)' }}>
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="John"
                    required
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
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--rar-text)' }}>
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Doe"
                    required
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
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--rar-text)' }}>
                  Password *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Minimum 8 characters"
                  required
                  minLength={8}
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
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--rar-text)' }}>
                  Role *
                </label>
                <div style={{ display: 'grid', gap: 12 }}>
                  {ROLE_OPTIONS.map((role) => (
                    <label
                      key={role.value}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                        padding: 12,
                        border: `2px solid ${formData.role === role.value ? 'var(--rar-primary)' : 'var(--rar-border)'}`,
                        borderRadius: 8,
                        cursor: 'pointer',
                        background: formData.role === role.value ? 'var(--rar-primary)10' : 'transparent',
                        transition: 'all 0.2s',
                      }}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={role.value}
                        checked={formData.role === role.value}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value as AdminRole })}
                        style={{ marginTop: 2 }}
                      />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--rar-text)', marginBottom: 2 }}>
                          {role.label}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--rar-text-muted)' }}>
                          {role.description}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                disabled={addAdminMutation.isPending}
                style={{
                  flex: 1,
                  padding: '10px 20px',
                  background: 'var(--rar-surface)',
                  border: '1px solid var(--rar-border)',
                  borderRadius: 8,
                  color: 'var(--rar-text)',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addAdminMutation.isPending}
                style={{
                  flex: 1,
                  padding: '10px 20px',
                  background: 'var(--rar-primary)',
                  border: 'none',
                  borderRadius: 8,
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: addAdminMutation.isPending ? 'not-allowed' : 'pointer',
                  opacity: addAdminMutation.isPending ? 0.6 : 1,
                }}
              >
                {addAdminMutation.isPending ? 'Adding...' : 'Add Admin'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
