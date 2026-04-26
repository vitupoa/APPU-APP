'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDate, truncate } from '@/lib/utils';
import { LoadingState, Pagination, SearchBar } from '@/components/shared';
import { Modal } from '@/components/Modal';
import { Film, FileText, Trophy, BookOpen, Trash2, EyeOff, CheckCircle } from 'lucide-react';

const contentTypes = [
  { key: 'short', label: 'Shorts', icon: Film },
  { key: 'post', label: 'Posts', icon: FileText },
  { key: 'contest', label: 'Contests', icon: Trophy },
  { key: 'story', label: 'Stories', icon: BookOpen },
  { key: 'live', label: 'Live Streams', icon: Film },
];

export default function ContentPage() {
  const [activeTab, setActiveTab] = useState('short');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [moderateModal, setModerateModal] = useState<any>(null);
  const [modAction, setModAction] = useState('hide');
  const [modReason, setModReason] = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['content', activeTab, page, search],
    queryFn: () => api.get(`/content/${activeTab}`, {
      params: { page, limit: 20, search: search || undefined }
    }).then(r => r.data),
  });

  const moderateMut = useMutation({
    mutationFn: (vars: { type: string; id: string; action: string; reason: string }) =>
      api.post(`/content/${vars.type}/${vars.id}/moderate`, { action: vars.action, reason: vars.reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['content'] });
      setModerateModal(null);
    },
  });

  const { data: logs } = useQuery({
    queryKey: ['moderation-logs'],
    queryFn: () => api.get('/content/moderation-logs', { params: { limit: 10 } }).then(r => r.data),
  });

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>Content Moderation</h1>
        <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--rar-text-muted)' }}>
          Review and moderate platform content
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--rar-surface)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {contentTypes.map(ct => (
          <button
            key={ct.key}
            onClick={() => { setActiveTab(ct.key); setPage(1); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 8, border: 'none',
              background: activeTab === ct.key ? 'var(--rar-accent)' : 'transparent',
              color: activeTab === ct.key ? 'white' : 'var(--rar-text-secondary)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <ct.icon size={16} />
            {ct.label}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: 20 }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search content..." />
      </div>

      {isLoading ? <LoadingState /> : (
        <div className="glass-card" style={{ overflow: 'auto' }}>
          <table className="rar-table">
            <thead>
              <tr>
                <th>Content</th>
                <th>Creator</th>
                <th>Created</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.items?.map((item: any) => (
                <tr key={item.id}>
                  <td>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      {item.mediaUrl && (
                        <div style={{ width: 60, height: 60, borderRadius: 8, overflow: 'hidden', background: '#111' }}>
                          {item.mediaUrl.match(/\.(mp4|mov|webm)$/i) || activeTab === 'short' || activeTab === 'live' ? (
                            <video src={item.mediaUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted loop onMouseOver={e => (e.target as HTMLVideoElement).play()} onMouseOut={e => (e.target as HTMLVideoElement).pause()} />
                          ) : (
                            <img src={item.mediaUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          )}
                        </div>
                      )}
                      <div style={{ maxWidth: 300 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--rar-text)' }}>
                          {truncate(item.caption || item.title || item.text || (activeTab === 'live' ? 'Live Stream' : 'Untitled'), 60)}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--rar-text-muted)', marginTop: 2 }}>
                          ID: {item.id.slice(0, 8)}... {item.status ? `· ${item.status}` : ''}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: 13 }}>
                      @{item.user?.username || item.creator?.username || 'unknown'}
                    </span>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--rar-text-muted)' }}>{formatDate(item.createdAt)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => {
                        setModerateModal(item); setModAction('hide'); setModReason('');
                      }}>
                        <EyeOff size={14} /> Moderate
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => {
                        if (confirm('Permanently delete this content?')) {
                          moderateMut.mutate({ type: activeTab, id: item.id, action: 'delete', reason: 'Admin deletion' });
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
          <Pagination page={page} totalPages={data?.totalPages || 1} onPageChange={setPage} />
        </div>
      )}

      {/* Recent Moderation Log */}
      {logs?.items?.length > 0 && (
        <div className="glass-card" style={{ padding: 24, marginTop: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Recent Moderation Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {logs.items.slice(0, 5).map((log: any) => (
              <div key={log.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 12px', background: 'var(--rar-bg)', borderRadius: 8,
              }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{log.action}</span>
                  <span style={{ fontSize: 13, color: 'var(--rar-text-muted)', marginLeft: 8 }}>
                    on {log.contentType} ({log.contentId?.slice(0, 8)}...)
                  </span>
                </div>
                <span style={{ fontSize: 12, color: 'var(--rar-text-muted)' }}>{formatDate(log.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Moderate Modal */}
      <Modal open={!!moderateModal} onClose={() => setModerateModal(null)} title="Moderate Content">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--rar-text-secondary)', marginBottom: 6 }}>Action</label>
            <select className="rar-select" style={{ width: '100%' }} value={modAction} onChange={e => setModAction(e.target.value)}>
              <option value="hide">Hide</option>
              <option value="flag">Flag for Review</option>
              <option value="delete">Delete Permanently</option>
              {activeTab === 'contest' && <option value="approve">Approve</option>}
              {activeTab === 'live' && (
                <>
                  <option value="pause">Pause Live</option>
                  <option value="stop">Stop Live</option>
                </>
              )}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--rar-text-secondary)', marginBottom: 6 }}>Reason</label>
            <textarea className="rar-textarea" value={modReason} onChange={e => setModReason(e.target.value)} placeholder="Describe the reason..." />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => setModerateModal(null)}>Cancel</button>
            <button
              className="btn btn-danger"
              disabled={moderateMut.isPending}
              onClick={() => moderateMut.mutate({
                type: activeTab, id: moderateModal.id, action: modAction, reason: modReason,
              })}
            >
              {moderateMut.isPending ? 'Processing...' : 'Confirm'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
