'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { LoadingState, Pagination } from '@/components/shared';
import { Shield, Filter, CheckCircle, XCircle, AlertCircle, ArrowUpCircle } from 'lucide-react';
import { Modal } from '@/components/Modal';

export default function ComplianceReviewsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [decision, setDecision] = useState('');
  const [notes, setNotes] = useState('');

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['compliance-reviews', page, statusFilter, typeFilter],
    queryFn: () => api.get('/compliance/reviews', {
      params: {
        page,
        limit: 30,
        status: statusFilter || undefined,
        review_type: typeFilter || undefined,
      }
    }).then(r => r.data),
  });

  const submitDecisionMutation = useMutation({
    mutationFn: (data: { reviewId: string; decision: string; notes: string }) =>
      api.put(`/compliance/reviews/${data.reviewId}/decision`, {
        decision: data.decision,
        notes: data.notes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-reviews'] });
      setShowDecisionModal(false);
      setSelectedReview(null);
      setDecision('');
      setNotes('');
    },
  });

  const handleSubmitDecision = () => {
    if (!selectedReview || !decision) return;
    submitDecisionMutation.mutate({
      reviewId: selectedReview.id,
      decision,
      notes,
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; color: string }> = {
      PENDING: { bg: '#f59e0b15', color: '#f59e0b' },
      IN_REVIEW: { bg: '#3b82f615', color: '#3b82f6' },
      APPROVED: { bg: '#10b98115', color: '#10b981' },
      REJECTED: { bg: '#ef444415', color: '#ef4444' },
      ESCALATED: { bg: '#8b5cf615', color: '#8b5cf6' },
    };
    const style = styles[status] || styles.PENDING;
    return (
      <span style={{
        padding: '4px 10px',
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 600,
        background: style.bg,
        color: style.color,
      }}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>
          Compliance Reviews
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--rar-text-muted)' }}>
          Review and manage flagged transactions and user activities
        </p>
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
          <option value="PENDING">Pending</option>
          <option value="IN_REVIEW">In Review</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="ESCALATED">Escalated</option>
        </select>
        <select
          className="rar-select"
          value={typeFilter}
          onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Types</option>
          <option value="TRANSACTION">Transaction</option>
          <option value="USER_PROFILE">User Profile</option>
          <option value="WITHDRAWAL">Withdrawal</option>
          <option value="CHAMA">Chama</option>
          <option value="CONTEST">Contest</option>
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
                <th>Type</th>
                <th>User ID</th>
                <th>Transaction ID</th>
                <th>Status</th>
                <th>Reviewer</th>
                <th>Decision</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.data?.map((review: any) => (
                <tr key={review.id}>
                  <td style={{ fontSize: 12, color: 'var(--rar-text-muted)', whiteSpace: 'nowrap' }}>
                    {formatDate(review.created_at)}
                  </td>
                  <td>
                    <span className="badge badge-neutral">
                      {review.review_type}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--rar-text-muted)' }}>
                    {review.user_id?.slice(0, 8)}...
                  </td>
                  <td style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--rar-text-muted)' }}>
                    {review.transaction_id?.slice(0, 8)}...
                  </td>
                  <td>{getStatusBadge(review.status)}</td>
                  <td style={{ fontSize: 12, color: 'var(--rar-text-muted)' }}>
                    {review.reviewer_id ? review.reviewer_id.slice(0, 8) + '...' : '—'}
                  </td>
                  <td>
                    {review.decision ? (
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--rar-text)' }}>
                        {review.decision}
                      </span>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--rar-text-muted)' }}>—</span>
                    )}
                  </td>
                  <td>
                    {review.status === 'PENDING' || review.status === 'IN_REVIEW' ? (
                      <button
                        className="rar-btn rar-btn-sm"
                        onClick={() => {
                          setSelectedReview(review);
                          setShowDecisionModal(true);
                        }}
                      >
                        Review
                      </button>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--rar-text-muted)' }}>
                        Completed
                      </span>
                    )}
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

      {/* Decision Modal */}
      {showDecisionModal && selectedReview && (
        <Modal
          isOpen={showDecisionModal}
          onClose={() => {
            setShowDecisionModal(false);
            setSelectedReview(null);
            setDecision('');
            setNotes('');
          }}
          title="Submit Review Decision"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                Review Details
              </label>
              <div style={{ fontSize: 13, color: 'var(--rar-text-muted)', lineHeight: 1.6 }}>
                <div><strong>Type:</strong> {selectedReview.review_type}</div>
                <div><strong>User ID:</strong> {selectedReview.user_id}</div>
                <div><strong>Transaction ID:</strong> {selectedReview.transaction_id}</div>
                {selectedReview.notes && <div><strong>Notes:</strong> {selectedReview.notes}</div>}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                Decision *
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <button
                  className={`rar-btn ${decision === 'APPROVE' ? 'rar-btn-primary' : ''}`}
                  onClick={() => setDecision('APPROVE')}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}
                >
                  <CheckCircle size={16} />
                  Approve
                </button>
                <button
                  className={`rar-btn ${decision === 'REJECT' ? 'rar-btn-danger' : ''}`}
                  onClick={() => setDecision('REJECT')}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}
                >
                  <XCircle size={16} />
                  Reject
                </button>
                <button
                  className={`rar-btn ${decision === 'REQUEST_INFO' ? 'rar-btn-primary' : ''}`}
                  onClick={() => setDecision('REQUEST_INFO')}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}
                >
                  <AlertCircle size={16} />
                  Request Info
                </button>
                <button
                  className={`rar-btn ${decision === 'ESCALATE' ? 'rar-btn-primary' : ''}`}
                  onClick={() => setDecision('ESCALATE')}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}
                >
                  <ArrowUpCircle size={16} />
                  Escalate
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                Notes
              </label>
              <textarea
                className="rar-input"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add notes about your decision..."
                rows={4}
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                className="rar-btn"
                onClick={() => {
                  setShowDecisionModal(false);
                  setSelectedReview(null);
                  setDecision('');
                  setNotes('');
                }}
              >
                Cancel
              </button>
              <button
                className="rar-btn rar-btn-primary"
                onClick={handleSubmitDecision}
                disabled={!decision || submitDecisionMutation.isPending}
              >
                {submitDecisionMutation.isPending ? 'Submitting...' : 'Submit Decision'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
