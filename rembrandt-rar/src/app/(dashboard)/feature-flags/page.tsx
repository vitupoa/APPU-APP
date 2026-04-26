'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { LoadingState, Pagination } from '@/components/shared';
import { Modal } from '@/components/Modal';
import { Flag, Plus, Trash2 } from 'lucide-react';

const SCOPE_OPTIONS = ['GLOBAL', 'CONTINENT', 'COUNTRY', 'REGION', 'CITY', 'USER'];

const CORE_FEATURES = [
  { key: 'chama', label: 'Chama System' },
  { key: 'live_streaming', label: 'Live Streaming' },
  { key: 'teams_contests', label: 'Teams Contests' },
  { key: 'individual_contests', label: 'Individual Contests' },
  { key: 'wallet', label: 'Wallet & Payments' },
  { key: 'marketplace', label: 'Marketplace' },
  { key: 'brand_marketplace', label: 'Brand Marketplace' },
  { key: 'chat', label: 'Chat & Messaging' },
  { key: 'stories', label: 'Stories' },
  { key: 'shorts', label: 'Shorts' },
  { key: 'feed', label: 'Feed / Drips' },
  { key: 'garage_services', label: 'Garage Services' },
  { key: 'car_imports', label: 'Car Imports' },
];

export default function FeatureFlagsPage() {
  const [page, setPage] = useState(1);
  const [createModal, setCreateModal] = useState(false);
  const [form, setForm] = useState({ featureKey: CORE_FEATURES[0].key, enabled: true, scope: 'GLOBAL', scopeValue: '', description: '' });
  const [customKey, setCustomKey] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['feature-flags', page],
    queryFn: () => api.get('/feature-flags', { params: { page, limit: 20 } }).then(r => r.data),
  });

  const { data: summary } = useQuery({
    queryKey: ['feature-flags-summary'],
    queryFn: () => api.get('/feature-flags/summary').then(r => r.data),
  });

  const createMut = useMutation({
    mutationFn: (data: any) => api.post('/feature-flags', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feature-flags'] });
      setCreateModal(false);
      setForm({ featureKey: '', enabled: true, scope: 'GLOBAL', scopeValue: '', description: '' });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/feature-flags/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feature-flags'] }),
  });

  const toggleMut = useMutation({
    mutationFn: (vars: { id: string; enabled: boolean; featureKey: string; scope: string; scopeValue?: string }) =>
      api.post('/feature-flags', { featureKey: vars.featureKey, enabled: vars.enabled, scope: vars.scope, scopeValue: vars.scopeValue }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feature-flags'] }),
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>Feature Flags</h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--rar-text-muted)' }}>
            Hierarchical feature flag management (Global → Continent → Country → City → User)
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreateModal(true)}>
          <Plus size={16} /> New Flag
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
          {Object.entries(summary).map(([key, val]) => (
            <div key={key} className="glass-card" style={{ padding: '16px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: 12, color: 'var(--rar-text-muted)', margin: '0 0 4px', textTransform: 'uppercase', fontWeight: 600 }}>{key}</p>
              <p style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>{String(val)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Quick Core Feature Toggles */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Flag size={18} /> Global Core Features
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {CORE_FEATURES.map(feat => {
            const flag = data?.items?.find((f: any) => f.featureKey === feat.key && f.scope === 'GLOBAL');
            const isEnabled = flag ? flag.enabled : true; // Default to true if not set
            
            return (
              <div key={feat.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--rar-bg)', borderRadius: 12, border: '1px solid var(--rar-border)' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--rar-text)' }}>{feat.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--rar-text-muted)', marginTop: 2, fontFamily: 'monospace' }}>{feat.key}</div>
                </div>
                <div
                  className={`toggle ${isEnabled ? 'active' : ''}`}
                  onClick={() => {
                    toggleMut.mutate({
                      id: flag?.id || '',
                      featureKey: feat.key,
                      enabled: !isEnabled,
                      scope: 'GLOBAL',
                      scopeValue: ''
                    });
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Flags Table */}
      {isLoading ? <LoadingState /> : (
        <div className="glass-card" style={{ overflow: 'auto' }}>
          <table className="rar-table">
            <thead>
              <tr>
                <th>Feature Key</th>
                <th>Scope</th>
                <th>Scope Value</th>
                <th>Status</th>
                <th>Description</th>
                <th>Updated</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.items?.map((flag: any) => (
                <tr key={flag.id}>
                  <td>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--rar-text)', fontFamily: 'monospace' }}>
                      {flag.featureKey}
                    </span>
                  </td>
                  <td><span className="badge badge-info">{flag.scope}</span></td>
                  <td style={{ fontSize: 13 }}>{flag.scopeValue || '—'}</td>
                  <td>
                    <div
                      className={`toggle ${flag.enabled ? 'active' : ''}`}
                      onClick={() => toggleMut.mutate({
                        id: flag.id, enabled: !flag.enabled,
                        featureKey: flag.featureKey, scope: flag.scope, scopeValue: flag.scopeValue,
                      })}
                    />
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--rar-text-muted)', maxWidth: 200 }}>
                    {flag.description || '—'}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--rar-text-muted)' }}>{formatDate(flag.updatedAt)}</td>
                  <td>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button className="btn btn-sm btn-danger" onClick={() => {
                        if (confirm(`Delete flag "${flag.featureKey}"?`)) deleteMut.mutate(flag.id);
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

      {/* Create Modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Create Feature Flag">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--rar-text-secondary)' }}>Feature Key</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {!customKey ? (
                <select 
                  className="rar-select" 
                  style={{ flex: 1 }} 
                  value={form.featureKey} 
                  onChange={e => {
                    if (e.target.value === 'custom') {
                      setCustomKey(true);
                      setForm(p => ({ ...p, featureKey: '' }));
                    } else {
                      setForm(p => ({ ...p, featureKey: e.target.value, description: CORE_FEATURES.find(c => c.key === e.target.value)?.label || '' }));
                    }
                  }}
                >
                  {CORE_FEATURES.map(f => <option key={f.key} value={f.key}>{f.label} ({f.key})</option>)}
                  <option value="custom">+ Custom Key...</option>
                </select>
              ) : (
                <div style={{ display: 'flex', flex: 1, gap: 8 }}>
                  <input className="rar-input" style={{ flex: 1 }} value={form.featureKey} onChange={e => setForm(p => ({ ...p, featureKey: e.target.value }))} placeholder="e.g. custom_feature" />
                  <button className="btn btn-ghost btn-sm" onClick={() => { setCustomKey(false); setForm(p => ({ ...p, featureKey: CORE_FEATURES[0].key })); }}>Back to List</button>
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--rar-text-secondary)', marginBottom: 6 }}>Scope</label>
              <select className="rar-select" style={{ width: '100%' }} value={form.scope} onChange={e => setForm(p => ({ ...p, scope: e.target.value }))}>
                {SCOPE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--rar-text-secondary)', marginBottom: 6 }}>Scope Value</label>
              <input className="rar-input" value={form.scopeValue} onChange={e => setForm(p => ({ ...p, scopeValue: e.target.value }))} placeholder="e.g. KE, nairobi" disabled={form.scope === 'GLOBAL'} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--rar-text-secondary)', marginBottom: 6 }}>Description</label>
            <input className="rar-input" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="What does this flag control?" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className={`toggle ${form.enabled ? 'active' : ''}`} onClick={() => setForm(p => ({ ...p, enabled: !p.enabled }))} />
            <span style={{ fontSize: 13, color: 'var(--rar-text-secondary)' }}>{form.enabled ? 'Enabled' : 'Disabled'}</span>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => setCreateModal(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={!form.featureKey || createMut.isPending} onClick={() => createMut.mutate(form)}>
              {createMut.isPending ? 'Creating...' : 'Create Flag'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
