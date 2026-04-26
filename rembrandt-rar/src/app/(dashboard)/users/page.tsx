'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDate, getInitials } from '@/lib/utils';
import { LoadingState, Pagination, SearchBar, StatusBadge } from '@/components/shared';
import { Modal } from '@/components/Modal';
import { useAdminStore } from '@/store/adminStore';
import Link from 'next/link';
import { Eye, UserX, UserCheck, Shield, Trash2 } from 'lucide-react';

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterSuspended, setFilterSuspended] = useState<string>('');
  const [suspendModal, setSuspendModal] = useState<any>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendDuration, setSuspendDuration] = useState('72');
  const { isSuperAdmin } = useAdminStore();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, search, filterSuspended],
    queryFn: () => api.get('/users', {
      params: { page, limit: 20, search: search || undefined, isSuspended: filterSuspended || undefined }
    }).then(r => r.data),
  });

  const suspendMut = useMutation({
    mutationFn: (vars: { id: string; reason: string; durationHours: number }) =>
      api.post(`/users/${vars.id}/suspend`, { reason: vars.reason, durationHours: vars.durationHours }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setSuspendModal(null); },
  });

  const unsuspendMut = useMutation({
    mutationFn: (id: string) => api.post(`/users/${id}/unsuspend`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  const verifyMut = useMutation({
    mutationFn: (id: string) => api.post(`/users/${id}/verify`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>User Management</h1>
        <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--rar-text-muted)' }}>
          View, manage, and moderate platform users
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by name, email, or username..." />
        <select className="rar-select" value={filterSuspended} onChange={e => { setFilterSuspended(e.target.value); setPage(1); }}>
          <option value="">All Users</option>
          <option value="true">Suspended Only</option>
          <option value="false">Active Only</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? <LoadingState /> : (
        <div className="glass-card" style={{ overflow: 'auto' }}>
          <table className="rar-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Account Type</th>
                <th>Status</th>
                <th>Joined</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.items?.map((user: any) => (
                <tr key={user.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 700, color: 'white', flexShrink: 0,
                      }}>
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                        ) : getInitials(user.displayName || user.username)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--rar-text)', fontSize: 14 }}>
                          {user.displayName || user.username}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--rar-text-muted)' }}>@{user.username}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: 13 }}>{user.email}</td>
                  <td><span className="badge badge-info">{user.accountType || 'USER'}</span></td>
                  <td>
                    {user.isSuspended ? (
                      <StatusBadge status="SUSPENDED" />
                    ) : user.isVerified ? (
                      <StatusBadge status="VERIFIED" />
                    ) : (
                      <StatusBadge status="ACTIVE" />
                    )}
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--rar-text-muted)' }}>{formatDate(user.createdAt)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <Link href={`/users/${user.id}`}>
                        <button className="btn btn-ghost btn-sm" title="View Details"><Eye size={14} /></button>
                      </Link>
                      {!user.isVerified && (
                        <button className="btn btn-sm btn-success" title="Verify" onClick={() => verifyMut.mutate(user.id)}>
                          <UserCheck size={14} />
                        </button>
                      )}
                      {user.isSuspended ? (
                        <button className="btn btn-sm btn-primary" title="Unsuspend" onClick={() => unsuspendMut.mutate(user.id)}>
                          <UserCheck size={14} />
                        </button>
                      ) : (
                        <button className="btn btn-sm btn-danger" title="Suspend" onClick={() => { setSuspendModal(user); setSuspendReason(''); }}>
                          <UserX size={14} />
                        </button>
                      )}
                      {isSuperAdmin() && (
                        <button className="btn btn-sm btn-danger" title="Delete" onClick={() => {
                          if (confirm(`Permanently delete ${user.username}?`)) deleteMut.mutate(user.id);
                        }}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} totalPages={data?.totalPages || 1} onPageChange={setPage} />
        </div>
      )}

      {/* Suspend Modal */}
      <Modal open={!!suspendModal} onClose={() => setSuspendModal(null)} title={`Suspend ${suspendModal?.username}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--rar-text-secondary)', marginBottom: 6 }}>
              Reason for suspension
            </label>
            <textarea className="rar-textarea" value={suspendReason} onChange={e => setSuspendReason(e.target.value)} placeholder="Describe the reason..." />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--rar-text-secondary)', marginBottom: 6 }}>
              Duration (hours)
            </label>
            <select className="rar-select" style={{ width: '100%' }} value={suspendDuration} onChange={e => setSuspendDuration(e.target.value)}>
              <option value="24">24 hours</option>
              <option value="72">72 hours (3 days)</option>
              <option value="168">1 week</option>
              <option value="720">30 days</option>
              <option value="8760">1 year</option>
              <option value="0">Permanent</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => setSuspendModal(null)}>Cancel</button>
            <button
              className="btn btn-danger"
              disabled={!suspendReason || suspendMut.isPending}
              onClick={() => suspendMut.mutate({
                id: suspendModal.id, reason: suspendReason, durationHours: parseInt(suspendDuration)
              })}
            >
              {suspendMut.isPending ? 'Suspending...' : 'Confirm Suspension'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
