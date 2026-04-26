'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { LoadingState, Pagination } from '@/components/shared';
import { Modal } from '@/components/Modal';
import { ShieldBan, BookmarkPlus, Plus, Trash2 } from 'lucide-react';

export default function NamesPage() {
  const [activeTab, setActiveTab] = useState<'prohibited' | 'reserved'>('prohibited');
  const [page, setPage] = useState(1);
  const [addModal, setAddModal] = useState(false);
  const [form, setForm] = useState({ name: '', reason: '', reservedFor: '' });
  const qc = useQueryClient();

  const { data: prohibited, isLoading: pLoading } = useQuery({
    queryKey: ['prohibited-names', page],
    queryFn: () => api.get('/names/prohibited', { params: { page } }).then(r => r.data),
    enabled: activeTab === 'prohibited',
  });

  const { data: reserved, isLoading: rLoading } = useQuery({
    queryKey: ['reserved-names', page],
    queryFn: () => api.get('/names/reserved', { params: { page } }).then(r => r.data),
    enabled: activeTab === 'reserved',
  });

  const addProhibitedMut = useMutation({
    mutationFn: (data: { name: string; reason?: string }) => api.post('/names/prohibited', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['prohibited-names'] }); setAddModal(false); setForm({ name: '', reason: '', reservedFor: '' }); },
  });

  const removeProhibitedMut = useMutation({
    mutationFn: (id: string) => api.delete(`/names/prohibited/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['prohibited-names'] }),
  });

  const addReservedMut = useMutation({
    mutationFn: (data: { username: string; reservedFor?: string }) => api.post('/names/reserved', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['reserved-names'] }); setAddModal(false); setForm({ name: '', reason: '', reservedFor: '' }); },
  });

  const removeReservedMut = useMutation({
    mutationFn: (id: string) => api.delete(`/names/reserved/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reserved-names'] }),
  });

  const isLoading = activeTab === 'prohibited' ? pLoading : rLoading;
  const items = activeTab === 'prohibited' ? prohibited?.items : reserved?.items;
  const totalPages = activeTab === 'prohibited' ? prohibited?.totalPages : reserved?.totalPages;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>Name Rules</h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--rar-text-muted)' }}>
            Manage prohibited names and reserved usernames
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setAddModal(true)}>
          <Plus size={16} /> Add {activeTab === 'prohibited' ? 'Prohibited Name' : 'Reserved Username'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--rar-surface)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        <button onClick={() => { setActiveTab('prohibited'); setPage(1); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 8, border: 'none',
            background: activeTab === 'prohibited' ? 'var(--rar-accent)' : 'transparent',
            color: activeTab === 'prohibited' ? 'white' : 'var(--rar-text-secondary)',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease',
          }}
        >
          <ShieldBan size={16} /> Prohibited Names
        </button>
        <button onClick={() => { setActiveTab('reserved'); setPage(1); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 8, border: 'none',
            background: activeTab === 'reserved' ? 'var(--rar-accent)' : 'transparent',
            color: activeTab === 'reserved' ? 'white' : 'var(--rar-text-secondary)',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease',
          }}
        >
          <BookmarkPlus size={16} /> Reserved Usernames
        </button>
      </div>

      {isLoading ? <LoadingState /> : (
        <div className="glass-card" style={{ overflow: 'auto' }}>
          <table className="rar-table">
            <thead>
              <tr>
                <th>{activeTab === 'prohibited' ? 'Name' : 'Username'}</th>
                <th>{activeTab === 'prohibited' ? 'Reason' : 'Reserved For'}</th>
                <th>Added</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(items || []).map((item: any) => (
                <tr key={item.id}>
                  <td>
                    <span style={{ fontSize: 14, fontWeight: 600, fontFamily: 'monospace', color: 'var(--rar-text)' }}>
                      {item.name || item.username}
                    </span>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--rar-text-secondary)' }}>
                    {item.reason || item.reservedFor || '—'}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--rar-text-muted)' }}>{formatDate(item.createdAt)}</td>
                  <td>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button className="btn btn-sm btn-danger" onClick={() => {
                        if (confirm(`Remove "${item.name || item.username}"?`)) {
                          if (activeTab === 'prohibited') removeProhibitedMut.mutate(item.id);
                          else removeReservedMut.mutate(item.id);
                        }
                      }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} totalPages={totalPages || 1} onPageChange={setPage} />
        </div>
      )}

      {/* Add Modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title={`Add ${activeTab === 'prohibited' ? 'Prohibited Name' : 'Reserved Username'}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--rar-text-secondary)', marginBottom: 6 }}>
              {activeTab === 'prohibited' ? 'Name Pattern' : 'Username'}
            </label>
            <input className="rar-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder={activeTab === 'prohibited' ? 'e.g. offensive_word' : 'e.g. krieta_official'} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--rar-text-secondary)', marginBottom: 6 }}>
              {activeTab === 'prohibited' ? 'Reason' : 'Reserved For'}
            </label>
            <input className="rar-input" value={activeTab === 'prohibited' ? form.reason : form.reservedFor} onChange={e => setForm(p => activeTab === 'prohibited' ? { ...p, reason: e.target.value } : { ...p, reservedFor: e.target.value })} placeholder={activeTab === 'prohibited' ? 'Why is this prohibited?' : 'Who is this reserved for?'} />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => setAddModal(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={!form.name} onClick={() => {
              if (activeTab === 'prohibited') addProhibitedMut.mutate({ name: form.name, reason: form.reason });
              else addReservedMut.mutate({ username: form.name, reservedFor: form.reservedFor });
            }}>
              Add
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
