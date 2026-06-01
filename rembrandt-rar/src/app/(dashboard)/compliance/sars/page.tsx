'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { LoadingState, Pagination } from '@/components/shared';
import { AlertTriangle, Filter, Download, FileText, Plus } from 'lucide-react';
import { Modal } from '@/components/Modal';

export default function SARsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedSAR, setSelectedSAR] = useState<any>(null);
  const [template, setTemplate] = useState<any>(null);

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['compliance-sars', page, statusFilter, severityFilter],
    queryFn: () => api.get('/compliance/sars', {
      params: {
        page,
        limit: 30,
        status: statusFilter || undefined,
        severity: severityFilter || undefined,
      }
    }).then(r => r.data),
  });

  const updateStatusMutation = useMutation({
    mutationFn: (data: { sarId: string; status: string; regulatory_body?: string }) =>
      api.put(`/compliance/sars/${data.sarId}/status`, {
        status: data.status,
        regulatory_body: data.regulatory_body,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-sars'] });
    },
  });

  const loadTemplateMutation = useMutation({
    mutationFn: (sarId: string) =>
      api.get(`/compliance/sars/${sarId}/template`).then(r => r.data.data),
    onSuccess: (data) => {
      setTemplate(data);
      setShowTemplateModal(true);
    },
  });

  const handleExport = async (format: 'CSV' | 'PDF') => {
    try {
      const response = await api.get('/compliance/sars/export', {
        params: { format, status: statusFilter || undefined, severity: severityFilter || undefined },
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sars-${Date.now()}.${format.toLowerCase()}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const getSeverityBadge = (severity: string) => {
    const styles: Record<string, { bg: string; color: string }> = {
      LOW: { bg: '#10b98115', color: '#10b981' },
      MEDIUM: { bg: '#f59e0b15', color: '#f59e0b' },
      HIGH: { bg: '#ef444415', color: '#ef4444' },
      CRITICAL: { bg: '#dc262615', color: '#dc2626' },
    };
    const style = styles[severity] || styles.MEDIUM;
    return (
      <span style={{
        padding: '4px 10px',
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 600,
        background: style.bg,
        color: style.color,
      }}>
        {severity}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; color: string }> = {
      DRAFT: { bg: '#6b728015', color: '#6b7280' },
      FILED: { bg: '#3b82f615', color: '#3b82f6' },
      ACKNOWLEDGED: { bg: '#10b98115', color: '#10b981' },
      CLOSED: { bg: '#6b728015', color: '#6b7280' },
    };
    const style = styles[status] || styles.DRAFT;
    return (
      <span style={{
        padding: '4px 10px',
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 600,
        background: style.bg,
        color: style.color,
      }}>
        {status}
      </span>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>
            Suspicious Activity Reports
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--rar-text-muted)' }}>
            Manage and file SARs for regulatory compliance
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="rar-btn" onClick={() => handleExport('CSV')}>
            <Download size={16} />
            Export CSV
          </button>
          <button className="rar-btn" onClick={() => handleExport('PDF')}>
            <Download size={16} />
            Export PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <Filter size={16} style={{ color: 'var(--rar-text-muted)' }} />
        <select
          className="rar-select"
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="FILED">Filed</option>
          <option value="ACKNOWLEDGED">Acknowledged</option>
          <option value="CLOSED">Closed</option>
        </select>
        <select
          className="rar-select"
          value={severityFilter}
          onChange={e => { setSeverityFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Severities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </select>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : (
        <div className="glass-card" style={{ overflow: 'auto' }}>
          <table className="rar-table">
            <thead>
              <tr>
                <th>Created</th>
                <th>Report #</th>
                <th>User ID</th>
                <th>Activity Type</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Filed</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.data?.map((sar: any) => (
                <tr key={sar.id}>
                  <td style={{ fontSize: 12, color: 'var(--rar-text-muted)', whiteSpace: 'nowrap' }}>
                    {formatDate(sar.created_at)}
                  </td>
                  <td style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 600 }}>
                    {sar.report_number || 'DRAFT'}
                  </td>
                  <td style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--rar-text-muted)' }}>
                    {sar.user_id?.slice(0, 8)}...
                  </td>
                  <td>
                    <span className="badge badge-neutral">
                      {sar.activity_type}
                    </span>
                  </td>
                  <td>{getSeverityBadge(sar.severity)}</td>
                  <td>{getStatusBadge(sar.status)}</td>
                  <td style={{ fontSize: 12, color: 'var(--rar-text-muted)' }}>
                    {sar.filed_at ? formatDate(sar.filed_at) : '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="rar-btn rar-btn-sm"
                        onClick={() => {
                          setSelectedSAR(sar);
                          loadTemplateMutation.mutate(sar.id);
                        }}
                        title="View Template"
                      >
                        <FileText size={14} />
                      </button>
                      {sar.status === 'DRAFT' && (
                        <button
                          className="rar-btn rar-btn-sm rar-btn-primary"
                          onClick={() => updateStatusMutation.mutate({ sarId: sar.id, status: 'FILED', regulatory_body: 'FinCEN' })}
                          disabled={updateStatusMutation.isPending}
                        >
                          File
                        </button>
                      )}
                    </div>
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

      {/* Template Modal */}
      {showTemplateModal && template && (
        <Modal
          isOpen={showTemplateModal}
          onClose={() => {
            setShowTemplateModal(false);
            setTemplate(null);
            setSelectedSAR(null);
          }}
          title="SAR Template"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxHeight: '70vh', overflowY: 'auto' }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Report Information</h3>
              <div style={{ fontSize: 13, color: 'var(--rar-text-muted)', lineHeight: 1.6 }}>
                <div><strong>Report Number:</strong> {template.report_number}</div>
                <div><strong>Filing Date:</strong> {formatDate(template.filing_date)}</div>
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Subject Information</h3>
              <div style={{ fontSize: 13, color: 'var(--rar-text-muted)', lineHeight: 1.6 }}>
                <div><strong>Name:</strong> {template.subject_information.name}</div>
                <div><strong>Email:</strong> {template.subject_information.email}</div>
                <div><strong>Country:</strong> {template.subject_information.country}</div>
                <div><strong>KYC Status:</strong> {template.subject_information.kyc_status}</div>
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Suspicious Activity</h3>
              <div style={{ fontSize: 13, color: 'var(--rar-text-muted)', lineHeight: 1.6 }}>
                <div><strong>Type:</strong> {template.suspicious_activity.type}</div>
                <div><strong>Severity:</strong> {template.suspicious_activity.severity}</div>
                <div><strong>Description:</strong> {template.suspicious_activity.description}</div>
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Risk Assessment</h3>
              <div style={{ fontSize: 13, color: 'var(--rar-text-muted)', lineHeight: 1.6 }}>
                <div><strong>Risk Score:</strong> {template.risk_assessment.risk_score}</div>
                <div><strong>Risk Level:</strong> {template.risk_assessment.risk_level}</div>
                <div><strong>Risk Factors:</strong></div>
                <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                  {template.risk_assessment.risk_factors.map((factor: string, i: number) => (
                    <li key={i}>{factor}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Recommendation</h3>
              <div style={{ fontSize: 13, color: 'var(--rar-text-muted)', lineHeight: 1.6 }}>
                {template.recommendation}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
