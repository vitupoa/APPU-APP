'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { LoadingState, Pagination } from '@/components/shared';
import { ScrollText, Filter } from 'lucide-react';

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [targetFilter, setTargetFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, actionFilter, targetFilter],
    queryFn: () => api.get('/logs', {
      params: { page, limit: 30, action: actionFilter || undefined, targetType: targetFilter || undefined }
    }).then(r => r.data),
  });

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>Audit Logs</h1>
        <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--rar-text-muted)' }}>
          Complete record of all administrative actions
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <Filter size={16} style={{ color: 'var(--rar-text-muted)' }} />
        <select className="rar-select" value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }}>
          <option value="">All Actions</option>
          <option value="user.suspend">User Suspend</option>
          <option value="user.unsuspend">User Unsuspend</option>
          <option value="user.verify">User Verify</option>
          <option value="user.delete">User Delete</option>
          <option value="user.role.assign">Role Assign</option>
          <option value="content.delete">Content Delete</option>
          <option value="content.hide">Content Hide</option>
          <option value="withdrawal.approve">Withdrawal Approve</option>
          <option value="withdrawal.reject">Withdrawal Reject</option>
          <option value="feature_flag.set">Feature Flag Set</option>
          <option value="config.update">Config Update</option>
          <option value="announcement.create">Announcement Create</option>
        </select>
        <select className="rar-select" value={targetFilter} onChange={e => { setTargetFilter(e.target.value); setPage(1); }}>
          <option value="">All Targets</option>
          <option value="user">User</option>
          <option value="short">Short</option>
          <option value="post">Post</option>
          <option value="contest">Contest</option>
          <option value="story">Story</option>
          <option value="withdrawal">Withdrawal</option>
          <option value="feature_flag">Feature Flag</option>
          <option value="config">Config</option>
          <option value="announcement">Announcement</option>
        </select>
      </div>

      {isLoading ? <LoadingState /> : (
        <div className="glass-card" style={{ overflow: 'auto' }}>
          <table className="rar-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Admin</th>
                <th>Action</th>
                <th>Target</th>
                <th>Target ID</th>
                <th>IP Address</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {data?.items?.map((log: any) => (
                <tr key={log.id}>
                  <td style={{ fontSize: 12, color: 'var(--rar-text-muted)', whiteSpace: 'nowrap' }}>
                    {formatDate(log.createdAt)}
                  </td>
                  <td style={{ fontSize: 13 }}>
                    <span style={{ fontWeight: 600, color: 'var(--rar-text)' }}>
                      {log.admin?.username || log.adminId?.slice(0, 8)}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      fontSize: 12, fontFamily: 'monospace', padding: '3px 8px',
                      background: 'var(--rar-accent-glow)', borderRadius: 4,
                      color: 'var(--rar-accent)', fontWeight: 600,
                    }}>
                      {log.action}
                    </span>
                  </td>
                  <td><span className="badge badge-neutral">{log.targetType}</span></td>
                  <td style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--rar-text-muted)' }}>
                    {log.targetId?.slice(0, 12)}...
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--rar-text-muted)' }}>{log.ipAddress || '—'}</td>
                  <td style={{ fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--rar-text-muted)' }}>
                    {log.details ? JSON.stringify(log.details).slice(0, 60) : '—'}
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
