'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { LoadingState, Pagination } from '@/components/shared';
import { Modal } from '@/components/Modal';
import { Megaphone, Plus, Trash2 } from 'lucide-react';

export default function AnnouncementsPage() {
  const [page, setPage] = useState(1);
  const [createModal, setCreateModal] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', type: 'INFO', targetAudience: 'ALL', expiresAt: '' });
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['announcements', page],
    queryFn: () => api.get('/announcements', { params: { page, limit: 20 } }).then(r => r.data),
  });

  const createMut = useMutation({
    mutationFn: (data: any) => api.post('/announcements', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['announcements'] });
      setCreateModal(false);
      setForm({ title: '', message: '', type: 'INFO', targetAudience: 'ALL', expiresAt: '' });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/announcements/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['announcements'] }),
  });

  const typeColors: Record<string, string> = {
    INFO: 'badge-info', WARNING: 'badge-warning', CRITICAL: 'badge-danger', UPDATE: 'badge-success',
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>Announcements</h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--rar-text-muted)' }}>
            Broadcast messages to platform users
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreateModal(true)}>
          <Plus size={16} /> New Announcement
        </button>
      </div>

      {isLoading ? <LoadingState /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {data?.items?.map((ann: any) => (
            <div key={ann.id} className="glass-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <Megaphone size={18} color="var(--rar-accent)" />
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{ann.title}</h3>
                    <span className={`badge ${typeColors[ann.type] || 'badge-neutral'}`}>{ann.type}</span>
                    <span className="badge badge-neutral">{ann.targetAudience}</span>
                  </div>
                  <p style={{ margin: '0 0 8px', fontSize: 14, color: 'var(--rar-text-secondary)', lineHeight: 1.6 }}>
                    {ann.message}
                  </p>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--rar-text-muted)' }}>
                    <span>Created: {formatDate(ann.createdAt)}</span>
                    {ann.expiresAt && <span>Expires: {formatDate(ann.expiresAt)}</span>}
                  </div>
                </div>
                <button className="btn btn-sm btn-danger" onClick={() => {
                  if (confirm('Delete this announcement?')) deleteMut.mutate(ann.id);
                }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          <Pagination page={page} totalPages={Math.ceil((data?.total || 0) / (data?.limit || 20))} onPageChange={setPage} />
        </div>
      )}

      {/* Create Modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Create Announcement">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--rar-text-secondary)', marginBottom: 6 }}>Title</label>
            <input className="rar-input" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Announcement title" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--rar-text-secondary)', marginBottom: 6 }}>Message</label>
            <textarea className="rar-textarea" style={{ minHeight: 120 }} value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} placeholder="Write your announcement..." />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--rar-text-secondary)', marginBottom: 6 }}>Type</label>
              <select className="rar-select" style={{ width: '100%' }} value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                <option value="INFO">Info</option>
                <option value="WARNING">Warning</option>
                <option value="CRITICAL">Critical</option>
                <option value="UPDATE">Update</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--rar-text-secondary)', marginBottom: 6 }}>Target Audience</label>
              <select className="rar-select" style={{ width: '100%' }} value={form.targetAudience} onChange={e => setForm(p => ({ ...p, targetAudience: e.target.value }))}>
                <option value="ALL">All Users</option>
                <option value="CREATORS">Creators</option>
                <option value="BUSINESS">Business</option>
              </select>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--rar-text-secondary)', marginBottom: 6 }}>Expires At (optional)</label>
            <input className="rar-input" type="datetime-local" value={form.expiresAt} onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => setCreateModal(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={!form.title || !form.message || createMut.isPending} onClick={() => createMut.mutate(form)}>
              {createMut.isPending ? 'Publishing...' : 'Publish Announcement'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
