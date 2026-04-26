'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import { LoadingState, Pagination, StatusBadge } from '@/components/shared';
import { Modal } from '@/components/Modal';
import { useAdminStore } from '@/store/adminStore';
import { Wallet, ArrowDownToLine, ArrowUpFromLine, Clock, CheckCircle, XCircle, DollarSign } from 'lucide-react';

export default function FinancialsPage() {
  const [activeTab, setActiveTab] = useState<'withdrawals' | 'transactions' | 'escrows' | 'wallets'>('withdrawals');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [reviewModal, setReviewModal] = useState<any>(null);
  const [reviewAction, setReviewAction] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [reviewNote, setReviewNote] = useState('');
  const { isSuperAdmin } = useAdminStore();
  const qc = useQueryClient();

  const { data: withdrawals, isLoading: wLoading } = useQuery({
    queryKey: ['withdrawals', page, statusFilter],
    queryFn: () => api.get('/withdrawals', { params: { page, limit: 20, status: statusFilter || undefined } }).then(r => r.data),
    enabled: activeTab === 'withdrawals',
  });

  const { data: transactions, isLoading: tLoading } = useQuery({
    queryKey: ['transactions', page],
    queryFn: () => api.get('/transactions', { params: { page, limit: 20 } }).then(r => r.data),
    enabled: activeTab === 'transactions',
  });

  const { data: escrows, isLoading: eLoading } = useQuery({
    queryKey: ['escrows', page],
    queryFn: () => api.get('/escrows', { params: { page, limit: 20 } }).then(r => r.data),
    enabled: activeTab === 'escrows',
  });

  const { data: platformWallets, isLoading: pLoading } = useQuery({
    queryKey: ['platform-wallets'],
    queryFn: () => api.get('/wallet/platform').then(r => r.data),
    enabled: activeTab === 'wallets',
  });

  const reviewMut = useMutation({
    mutationFn: (vars: { id: string; decision: string; note: string }) =>
      api.post(`/withdrawals/${vars.id}/review`, { decision: vars.decision, note: vars.note }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['withdrawals'] }); setReviewModal(null); },
  });

  const overrideNameMut = useMutation({
    mutationFn: (id: string) => api.post(`/withdrawals/${id}/override-name`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['withdrawals'] }),
  });

  const releaseMut = useMutation({
    mutationFn: (id: string) => api.post(`/escrows/${id}/release`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['escrows'] }),
  });

  const refundMut = useMutation({
    mutationFn: (id: string) => api.post(`/escrows/${id}/refund`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['escrows'] }),
  });

  const tabs = [
    { key: 'withdrawals', label: 'Withdrawals', icon: ArrowDownToLine },
    { key: 'transactions', label: 'Transactions', icon: ArrowUpFromLine },
    { key: 'escrows', label: 'Escrows', icon: Clock },
    { key: 'wallets', label: 'Platform Wallets', icon: Wallet },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>Financial Controls</h1>
        <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--rar-text-muted)' }}>
          Manage withdrawals, transactions, escrows, and platform wallets
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--rar-surface)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => { setActiveTab(t.key as any); setPage(1); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 8, border: 'none',
              background: activeTab === t.key ? 'var(--rar-accent)' : 'transparent',
              color: activeTab === t.key ? 'white' : 'var(--rar-text-secondary)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease',
            }}
          >
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {/* WITHDRAWALS */}
      {activeTab === 'withdrawals' && (
        <>
          <div style={{ marginBottom: 16 }}>
            <select className="rar-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
          {wLoading ? <LoadingState /> : (
            <div className="glass-card" style={{ overflow: 'auto' }}>
              <table className="rar-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Name Match</th>
                    <th>Status</th>
                    <th>Requested</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals?.items?.map((w: any) => (
                    <tr key={w.id}>
                      <td style={{ fontSize: 13 }}>@{w.user?.username || 'unknown'}</td>
                      <td style={{ fontWeight: 700, fontSize: 14 }}>{formatCurrency(w.amount)}</td>
                      <td style={{ fontSize: 13 }}>{w.method || 'MPESA'}</td>
                      <td>
                        {w.nameMatchScore != null ? (
                          <span className={`badge ${w.nameMatchScore > 0.8 ? 'badge-success' : w.nameMatchScore > 0.5 ? 'badge-warning' : 'badge-danger'}`}>
                            {Math.round(w.nameMatchScore * 100)}%
                          </span>
                        ) : <span className="badge badge-neutral">N/A</span>}
                      </td>
                      <td><StatusBadge status={w.status} /></td>
                      <td style={{ fontSize: 13, color: 'var(--rar-text-muted)' }}>{formatDate(w.createdAt)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          {w.status === 'PENDING' && (
                            <>
                              <button className="btn btn-sm btn-success" onClick={() => {
                                setReviewModal(w); setReviewAction('APPROVED'); setReviewNote('');
                              }}>
                                <CheckCircle size={14} /> Approve
                              </button>
                              <button className="btn btn-sm btn-danger" onClick={() => {
                                setReviewModal(w); setReviewAction('REJECTED'); setReviewNote('');
                              }}>
                                <XCircle size={14} /> Reject
                              </button>
                            </>
                          )}
                          {isSuperAdmin() && w.nameMatchScore != null && w.nameMatchScore < 0.8 && (
                            <button className="btn btn-sm btn-ghost" onClick={() => overrideNameMut.mutate(w.id)}>
                              Override Name
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination page={page} totalPages={withdrawals?.totalPages || 1} onPageChange={setPage} />
            </div>
          )}
        </>
      )}

      {/* TRANSACTIONS */}
      {activeTab === 'transactions' && (
        tLoading ? <LoadingState /> : (
          <div className="glass-card" style={{ overflow: 'auto' }}>
            <table className="rar-table">
              <thead>
                <tr><th>ID</th><th>User</th><th>Type</th><th>Amount</th><th>Status</th><th>Date</th></tr>
              </thead>
              <tbody>
                {transactions?.items?.map((tx: any) => (
                  <tr key={tx.id}>
                    <td style={{ fontSize: 12, fontFamily: 'monospace' }}>{tx.id.slice(0, 8)}...</td>
                    <td style={{ fontSize: 13 }}>@{tx.user?.username || tx.userId?.slice(0, 8)}</td>
                    <td><span className="badge badge-info">{tx.type}</span></td>
                    <td style={{ fontWeight: 700 }}>{formatCurrency(tx.amount)}</td>
                    <td><StatusBadge status={tx.status} /></td>
                    <td style={{ fontSize: 13, color: 'var(--rar-text-muted)' }}>{formatDate(tx.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={page} totalPages={transactions?.totalPages || 1} onPageChange={setPage} />
          </div>
        )
      )}

      {/* ESCROWS */}
      {activeTab === 'escrows' && (
        eLoading ? <LoadingState /> : (
          <div className="glass-card" style={{ overflow: 'auto' }}>
            <table className="rar-table">
              <thead>
                <tr><th>ID</th><th>Amount</th><th>Status</th><th>Created</th><th style={{ textAlign: 'right' }}>Actions</th></tr>
              </thead>
              <tbody>
                {escrows?.items?.map((e: any) => (
                  <tr key={e.id}>
                    <td style={{ fontSize: 12, fontFamily: 'monospace' }}>{e.id.slice(0, 12)}...</td>
                    <td style={{ fontWeight: 700 }}>{formatCurrency(e.amount)}</td>
                    <td><StatusBadge status={e.status} /></td>
                    <td style={{ fontSize: 13, color: 'var(--rar-text-muted)' }}>{formatDate(e.createdAt)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        {e.status === 'HELD' && (
                          <>
                            <button className="btn btn-sm btn-success" onClick={() => releaseMut.mutate(e.id)}>Release</button>
                            <button className="btn btn-sm btn-danger" onClick={() => refundMut.mutate(e.id)}>Refund</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={page} totalPages={escrows?.totalPages || 1} onPageChange={setPage} />
          </div>
        )
      )}

      {/* PLATFORM WALLETS */}
      {activeTab === 'wallets' && (
        pLoading ? <LoadingState /> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {(Array.isArray(platformWallets) ? platformWallets : []).map((w: any) => (
              <div key={w.id} className="glass-card stat-card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ fontSize: 13, color: 'var(--rar-text-muted)', margin: '0 0 4px' }}>{w.name || w.type}</p>
                    <p style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>{formatCurrency(w.balance)}</p>
                  </div>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: 'rgba(16, 185, 129, 0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <DollarSign size={22} color="#10b981" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Review Modal */}
      <Modal open={!!reviewModal} onClose={() => setReviewModal(null)} title={`${reviewAction === 'APPROVED' ? 'Approve' : 'Reject'} Withdrawal`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {reviewModal && (
            <div style={{ padding: 16, background: 'var(--rar-bg)', borderRadius: 8 }}>
              <div style={{ fontSize: 13, color: 'var(--rar-text-muted)' }}>Amount</div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{formatCurrency(reviewModal.amount)}</div>
              <div style={{ fontSize: 12, color: 'var(--rar-text-muted)', marginTop: 4 }}>
                User: @{reviewModal.user?.username || 'unknown'} · Method: {reviewModal.method || 'MPESA'}
              </div>
            </div>
          )}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--rar-text-secondary)', marginBottom: 6 }}>Note</label>
            <textarea className="rar-textarea" value={reviewNote} onChange={e => setReviewNote(e.target.value)} placeholder="Add a note (optional)..." />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => setReviewModal(null)}>Cancel</button>
            <button
              className={`btn ${reviewAction === 'APPROVED' ? 'btn-success' : 'btn-danger'}`}
              disabled={reviewMut.isPending}
              onClick={() => reviewMut.mutate({ id: reviewModal.id, decision: reviewAction, note: reviewNote })}
            >
              {reviewMut.isPending ? 'Processing...' : `Confirm ${reviewAction === 'APPROVED' ? 'Approval' : 'Rejection'}`}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
