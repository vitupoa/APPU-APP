'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { LoadingState, SearchBar } from '@/components/shared';
import { UserPlus, Trash2, ShieldCheck } from 'lucide-react';

export default function AutoAdmirePage() {
  const [newUserId, setNewUserId] = useState('');
  const qc = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['auto-admire'],
    queryFn: () => api.get('/auto-admire').then(r => r.data),
  });

  const addMut = useMutation({
    mutationFn: () => api.post('/auto-admire', { userId: newUserId }),
    onSuccess: () => {
      setNewUserId('');
      qc.invalidateQueries({ queryKey: ['auto-admire'] });
    },
  });

  const removeMut = useMutation({
    mutationFn: (id: string) => api.delete(`/auto-admire/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['auto-admire'] }),
  });

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>Auto-Admire Configuration</h1>
        <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--rar-text-muted)' }}>
          Manage accounts that users automatically admire upon signup.
        </p>
      </div>

      <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600 }}>Add Auto-Admire User</h3>
        <div style={{ display: 'flex', gap: 12 }}>
          <input 
            type="text" 
            className="rar-input" 
            placeholder="Enter User ID..." 
            value={newUserId} 
            onChange={e => setNewUserId(e.target.value)}
            style={{ flex: 1, maxWidth: 400 }}
          />
          <button 
            className="btn btn-primary" 
            onClick={() => addMut.mutate()} 
            disabled={!newUserId || addMut.isPending}
          >
            <UserPlus size={16} /> Add User
          </button>
        </div>
      </div>

      {isLoading ? <LoadingState /> : (
        <div className="glass-card" style={{ overflow: 'auto' }}>
          <table className="rar-table">
            <thead>
              <tr>
                <th>Account</th>
                <th>Type</th>
                <th>User ID</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users?.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '32px 0', color: 'var(--rar-text-muted)' }}>
                    No auto-admire users configured.
                  </td>
                </tr>
              )}
              {users?.map((user: any) => (
                <tr key={user.id}>
                  <td>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 20, background: 'var(--rar-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ShieldCheck size={20} color="white" />
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{user.displayName || user.username}</div>
                        <div style={{ fontSize: 12, color: 'var(--rar-text-muted)' }}>@{user.username}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="badge badge-neutral">{user.accountType}</span></td>
                  <td style={{ fontSize: 12, fontFamily: 'monospace' }}>{user.id}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button className="btn btn-danger btn-sm" onClick={() => {
                        if (confirm('Remove this user from auto-admire?')) removeMut.mutate(user.id);
                      }}>
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
