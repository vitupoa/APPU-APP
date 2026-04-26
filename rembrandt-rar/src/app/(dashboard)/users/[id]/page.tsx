'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDate, formatCurrency, getInitials } from '@/lib/utils';
import { LoadingState, StatusBadge } from '@/components/shared';
import { Modal } from '@/components/Modal';
import { useAdminStore } from '@/store/adminStore';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, Shield, UserX, UserCheck, KeyRound, Edit3 } from 'lucide-react';

export default function UserDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { isSuperAdmin } = useAdminStore();
  const qc = useQueryClient();
  const [roleModal, setRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState('MODERATOR');
  const [editModal, setEditModal] = useState(false);
  const [profileData, setProfileData] = useState({ username: '', displayName: '', accountType: '', country: '', currency: '' });
  const [pwModal, setPwModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const { data: user, isLoading } = useQuery({
    queryKey: ['user-detail', id],
    queryFn: () => api.get(`/users/${id}`).then(r => r.data),
  });

  const assignRoleMut = useMutation({
    mutationFn: (role: string) => api.post(`/users/${id}/role`, { role }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['user-detail', id] }); setRoleModal(false); },
  });

  const revokeRoleMut = useMutation({
    mutationFn: () => api.delete(`/users/${id}/role`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['user-detail', id] }),
  });

  const resetPwMut = useMutation({
    mutationFn: () => api.post(`/users/${id}/reset-password`),
  });

  const changePwMut = useMutation({
    mutationFn: () => api.put(`/users/${id}/password`, { password: newPassword }),
    onSuccess: () => {
      setPwModal(false);
      setNewPassword('');
      alert('Password updated successfully');
    }
  });

  const editProfileMut = useMutation({
    mutationFn: (data: any) => Promise.all([
      api.put(`/users/${id}/name`, { username: data.username, displayName: data.displayName }),
      api.put(`/users/${id}/profile`, { accountType: data.accountType, country: data.country, currency: data.currency })
    ]),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['user-detail', id] }); setEditModal(false); },
  });

  if (isLoading) return <LoadingState />;
  if (!user) return <p style={{ color: 'var(--rar-text-muted)' }}>User not found</p>;

  return (
    <div>
      {/* Back */}
      <button className="btn btn-ghost btn-sm" onClick={() => router.back()} style={{ marginBottom: 20 }}>
        <ArrowLeft size={16} /> Back to Users
      </button>

      {/* Header Card */}
      <div className="glass-card" style={{ padding: 28, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 800, color: 'white', flexShrink: 0,
          }}>
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover' }} />
            ) : getInitials(user.displayName || user.username)}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>
              {user.displayName || user.username}
            </h2>
            <p style={{ margin: '2px 0', fontSize: 14, color: 'var(--rar-text-muted)' }}>
              @{user.username} · {user.email}
            </p>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              {user.isSuspended ? <StatusBadge status="SUSPENDED" /> : <StatusBadge status="ACTIVE" />}
              {user.isVerified && <StatusBadge status="VERIFIED" />}
              {user.adminRole && <span className="badge badge-info">{user.adminRole}</span>}
              <span className="badge badge-neutral">{user.accountType || 'USER'}</span>
            </div>
          </div>

          {/* Super Admin Actions */}
          {isSuperAdmin() && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => {
                setProfileData({ 
                  username: user.username, 
                  displayName: user.displayName || '',
                  accountType: user.accountType || 'USER',
                  country: user.country || '',
                  currency: user.currency || ''
                });
                setEditModal(true);
              }}>
                <Edit3 size={14} /> Edit Profile
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setRoleModal(true)}>
                <Shield size={14} /> Assign Role
              </button>
              {user.adminRole && (
                <button className="btn btn-danger btn-sm" onClick={() => {
                  if (confirm('Revoke admin role?')) revokeRoleMut.mutate();
                }}>
                  Revoke Role
                </button>
              )}
              <button className="btn btn-ghost btn-sm" onClick={() => setPwModal(true)}>
                <KeyRound size={14} /> Change PW
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => {
                if (confirm('Reset user password? A temporary password will be emailed.')) resetPwMut.mutate();
              }}>
                 Reset (Email)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Detail Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Account Info */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Account Info</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              ['User ID', user.id],
              ['Phone', user.phone || 'N/A'],
              ['Country', user.country || 'N/A'],
              ['Joined', formatDate(user.createdAt)],
              ['Last Active', user.lastLoginAt ? formatDate(user.lastLoginAt) : 'N/A'],
              ['Wallet Unlocked', user.isWalletUnlocked ? 'Yes' : 'No'],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: 'var(--rar-text-muted)' }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Wallet */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Wallet</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              ['Balance', formatCurrency(user.wallet?.balance ?? 0)],
              ['Total Earned', formatCurrency(user.wallet?.totalEarned ?? 0)],
              ['Total Withdrawn', formatCurrency(user.wallet?.totalWithdrawn ?? 0)],
              ['Total Tips Sent', formatCurrency(user.wallet?.totalTipsSent ?? 0)],
              ['Total Tips Received', formatCurrency(user.wallet?.totalTipsReceived ?? 0)],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: 'var(--rar-text-muted)' }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Content Stats */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Content</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              ['Shorts', user._count?.shorts ?? 0],
              ['Posts', user._count?.posts ?? 0],
              ['Contests Created', user._count?.contestsCreated ?? 0],
              ['Followers', user._count?.followers ?? 0],
              ['Following', user._count?.following ?? 0],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: 'var(--rar-text-muted)' }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{String(val)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Suspensions History */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Suspension History</h3>
          {user.suspensions?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {user.suspensions.map((s: any) => (
                <div key={s.id} style={{ padding: 12, background: 'var(--rar-bg)', borderRadius: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{s.reason}</div>
                  <div style={{ fontSize: 12, color: 'var(--rar-text-muted)', marginTop: 4 }}>
                    {formatDate(s.createdAt)} · {s.isActive ? '🔴 Active' : '✅ Expired'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--rar-text-muted)' }}>No suspensions on record</p>
          )}
        </div>
      </div>

      {/* Role Assignment Modal */}
      <Modal open={roleModal} onClose={() => setRoleModal(false)} title="Assign Admin Role">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <select className="rar-select" style={{ width: '100%' }} value={selectedRole} onChange={e => setSelectedRole(e.target.value)}>
            <option value="MODERATOR">Moderator</option>
            <option value="FINANCE_MANAGER">Finance Manager</option>
            <option value="SUPPORT_AGENT">Support Agent</option>
          </select>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => setRoleModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={() => assignRoleMut.mutate(selectedRole)} disabled={assignRoleMut.isPending}>
              {assignRoleMut.isPending ? 'Assigning...' : 'Assign Role'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal open={editModal} onClose={() => setEditModal(false)} title="Edit User Profile">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--rar-text-secondary)', marginBottom: 6 }}>Username</label>
            <input className="rar-input" value={profileData.username} onChange={e => setProfileData(p => ({ ...p, username: e.target.value }))} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--rar-text-secondary)', marginBottom: 6 }}>Display Name</label>
            <input className="rar-input" value={profileData.displayName} onChange={e => setProfileData(p => ({ ...p, displayName: e.target.value }))} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--rar-text-secondary)', marginBottom: 6 }}>Account Type</label>
            <select className="rar-select" style={{ width: '100%' }} value={profileData.accountType} onChange={e => setProfileData(p => ({ ...p, accountType: e.target.value }))}>
              <option value="CREATOR">Creator</option>
              <option value="BUSINESS">Business</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--rar-text-secondary)', marginBottom: 6 }}>Country</label>
              <input className="rar-input" value={profileData.country} onChange={e => setProfileData(p => ({ ...p, country: e.target.value }))} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--rar-text-secondary)', marginBottom: 6 }}>Currency</label>
              <input className="rar-input" value={profileData.currency} onChange={e => setProfileData(p => ({ ...p, currency: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button className="btn btn-ghost" onClick={() => setEditModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={() => editProfileMut.mutate(profileData)} disabled={editProfileMut.isPending}>
              {editProfileMut.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Manual Password Change Modal */}
      <Modal open={pwModal} onClose={() => setPwModal(false)} title="Set Custom Password">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 13, color: 'var(--rar-text-muted)', margin: 0 }}>
            This will forcefully change the user's password and log them out of all active sessions.
          </p>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--rar-text-secondary)', marginBottom: 6 }}>New Password</label>
            <input type="password" placeholder="Enter new password" className="rar-input" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => setPwModal(false)}>Cancel</button>
            <button className="btn btn-danger" onClick={() => changePwMut.mutate()} disabled={changePwMut.isPending || newPassword.length < 8}>
              {changePwMut.isPending ? 'Changing...' : 'Force Change Password'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
