'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { LoadingState } from '@/components/shared';
import { Settings, Save, AlertTriangle } from 'lucide-react';

export default function SettingsPage() {
  const qc = useQueryClient();
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const { data: configs, isLoading } = useQuery({
    queryKey: ['platform-configs'],
    queryFn: () => api.get('/settings').then(r => r.data),
  });

  const updateMut = useMutation({
    mutationFn: (vars: { key: string; value: string }) => api.put('/settings', vars),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['platform-configs'] }); setEditKey(null); },
  });

  const maintenanceMut = useMutation({
    mutationFn: (enabled: boolean) => api.post('/settings/maintenance', { enabled }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['platform-configs'] }),
  });

  const { data: feeConfig } = useQuery({
    queryKey: ['fee-config'],
    queryFn: () => api.get('/fees').then(r => r.data),
  });

  const isMaintenanceOn = Array.isArray(configs) && configs.some((c: any) =>
    c.key === 'maintenance_mode' && c.value === 'true'
  );

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>Platform Settings</h1>
        <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--rar-text-muted)' }}>
          Global platform configuration (Super Admin only)
        </p>
      </div>

      {/* Maintenance Mode Banner */}
      <div className="glass-card" style={{
        padding: '20px 24px', marginBottom: 24,
        border: isMaintenanceOn ? '1px solid rgba(245, 158, 11, 0.4)' : undefined,
        background: isMaintenanceOn ? 'rgba(245, 158, 11, 0.05)' : undefined,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <AlertTriangle size={22} color={isMaintenanceOn ? '#f59e0b' : 'var(--rar-text-muted)'} />
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Maintenance Mode</h3>
              <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--rar-text-muted)' }}>
                {isMaintenanceOn ? 'Platform is currently in maintenance mode. Users cannot access the app.' : 'Platform is operating normally.'}
              </p>
            </div>
          </div>
          <button
            className={`btn ${isMaintenanceOn ? 'btn-success' : 'btn-danger'}`}
            onClick={() => maintenanceMut.mutate(!isMaintenanceOn)}
            disabled={maintenanceMut.isPending}
          >
            {isMaintenanceOn ? 'Disable Maintenance' : 'Enable Maintenance'}
          </button>
        </div>
      </div>

      {/* Platform Configs */}
      <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Settings size={18} /> Configuration Keys
        </h3>
        {isLoading ? <LoadingState /> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(Array.isArray(configs) ? configs : []).map((config: any) => (
              <div key={config.id || config.key} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 16px', background: 'var(--rar-bg)', borderRadius: 8,
              }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, fontFamily: 'monospace', color: 'var(--rar-text)' }}>
                    {config.key}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {editKey === config.key ? (
                    <>
                      <input
                        className="rar-input"
                        style={{ width: 200, padding: '6px 10px' }}
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        autoFocus
                      />
                      <button className="btn btn-sm btn-primary" onClick={() => updateMut.mutate({ key: config.key, value: editValue })}>
                        <Save size={14} />
                      </button>
                      <button className="btn btn-sm btn-ghost" onClick={() => setEditKey(null)}>✕</button>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: 14, color: 'var(--rar-text-secondary)', fontFamily: 'monospace' }}>
                        {config.value}
                      </span>
                      <button className="btn btn-sm btn-ghost" onClick={() => { setEditKey(config.key); setEditValue(config.value); }}>
                        Edit
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
            {(!configs || (Array.isArray(configs) && configs.length === 0)) && (
              <p style={{ textAlign: 'center', color: 'var(--rar-text-muted)', padding: 20 }}>
                No configuration keys set. Use the API to create initial configs.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Fee Config */}
      {feeConfig && (
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>Fee Configuration</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {Object.entries(feeConfig).map(([key, val]) => (
              <div key={key} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 16px', background: 'var(--rar-bg)', borderRadius: 8,
              }}>
                <span style={{ fontSize: 13, color: 'var(--rar-text-muted)', textTransform: 'capitalize' }}>
                  {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}
                </span>
                <span style={{ fontSize: 14, fontWeight: 700 }}>{String(val)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
