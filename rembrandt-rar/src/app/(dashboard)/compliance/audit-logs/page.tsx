'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { LoadingState, Pagination } from '@/components/shared';
import { FileText, Filter } from 'lucide-react';

export default function ComplianceAuditLogsPage() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['compliance-audit-logs', page, actionFilter],
    queryFn: () => api.get('/compliance/audit-logs', {
      params: {
        page,
        limit: 30,
        action: actionFilter || undefined,
      }
    }).then(r => r.data),
  });

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>
          Compliance Audit Logs
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--rar-text-muted)' }}>
          Complete audit trail of all compliance actions
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <Filter size={16} style={{ color: 'var(--rar-text-muted)' }} />
        <select
          className="rar-select"
          value={actionFilter}
          onChange={e => { setActionFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Actions</option>
          <option value="COMPLIANCE_REVIEW_CREATED">Review Created</option>
          <option value="COMPLIANCE_REVIEW_ASSIGNED">Review Assigned</option>
          <option value="COMPLIANCE_REVIEW_DECISION">Review Decision</option>
          <option value="SAR_CREATED">SAR Created</option>
          <option value="SAR_STATUS_UPDATED">SAR Status Updated</option>
        </select>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : (
        <div className="glass-card" style={{ overflow: 'auto' }}>
          <table className="rar-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th>Performed By</th>
                <th>Target User</th>
                <th>IP Address</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {data?.data?.map((log: any) => (
                <tr key={log.id}>
                  <td style={{ fontSize: 12, color: 'var(--rar-text-muted)', whiteSpace: 'nowrap' }}>
                    {formatDate(log.created_at)}
                  </td>
                  <td>
                    <span style={{
                      fontSize: 12,
                      fontFamily: 'monospace',
                      padding: '3px 8px',
                      background: 'var(--rar-accent-glow)',
                      borderRadius: 4,
                      color: 'var(--rar-accent)',
                      fontWeight: 600,
                    }}>
                      {log.action_type}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--rar-text-muted)' }}>
                    {log.performed_by === 'SYSTEM' ? 'SYSTEM' : log.performed_by?.slice(0, 8) + '...'}
                  </td>
                  <td style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--rar-text-muted)' }}>
                    {log.target_user_id ? log.target_user_id.slice(0, 8) + '...' : '—'}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--rar-text-muted)' }}>
                    {log.ip_address || '—'}
                  </td>
                  <td style={{
                    fontSize: 12,
                    maxWidth: 300,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: 'var(--rar-text-muted)'
                  }}>
                    {log.action_details ? JSON.stringify(log.action_details).slice(0, 80) + '...' : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            page={page}
            totalPages={Math.ceil((data?.pagination?.total || 0) / 30)}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
