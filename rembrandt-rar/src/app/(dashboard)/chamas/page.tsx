'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { LoadingState, Pagination, StatusBadge } from '@/components/shared';
import { ShieldAlert, Trash2 } from 'lucide-react';

export default function ChamasPage() {
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['chamas', page],
    queryFn: () => api.get('/chamas', { params: { page, limit: 20 } }).then(r => r.data),
  });

  const moderateMut = useMutation({
    mutationFn: (vars: { id: string; action: string }) => api.post(`/chamas/${vars.id}/moderate`, { action: vars.action }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chamas'] }),
  });

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>Chama Moderation</h1>
        <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--rar-text-muted)' }}>
          Monitor and moderate platform investment groups
        </p>
      </div>

      {isLoading ? <LoadingState /> : (
        <div className="glass-card" style={{ overflow: 'auto' }}>
          <table className="rar-table">
            <thead>
              <tr>
                <th>Chama Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Members</th>
                <th>Created</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.items?.map((chama: any) => (
                <tr key={chama.id}>
                  <td>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{chama.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--rar-text-muted)' }}>ID: {chama.id.slice(0, 8)}</div>
                  </td>
                  <td><span className="badge badge-neutral">{chama.type}</span></td>
                  <td><StatusBadge status={chama.status} /></td>
                  <td style={{ fontSize: 13 }}>{chama._count?.members || 0}</td>
                  <td style={{ fontSize: 12, color: 'var(--rar-text-muted)' }}>{formatDate(chama.createdAt)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button className="btn btn-warning btn-sm" onClick={() => {
                        if (confirm('Suspend this Chama?')) moderateMut.mutate({ id: chama.id, action: 'suspend' });
                      }}>
                        <ShieldAlert size={14} /> Suspend
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => {
                        if (confirm('Delete this Chama permanently?')) moderateMut.mutate({ id: chama.id, action: 'delete' });
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
    </div>
  );
}
