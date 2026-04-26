'use client';
import { useState } from 'react';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '16px 0' }}>
      <button
        className="btn btn-ghost btn-sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Previous
      </button>
      <span style={{ fontSize: 13, color: 'var(--rar-text-muted)', padding: '0 12px' }}>
        Page {page} of {totalPages}
      </span>
      <button
        className="btn btn-ghost btn-sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </button>
    </div>
  );
}

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder = 'Search...' }: SearchBarProps) {
  const [local, setLocal] = useState(value);

  return (
    <input
      className="rar-input"
      style={{ maxWidth: 320 }}
      placeholder={placeholder}
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onKeyDown={(e) => { if (e.key === 'Enter') onChange(local); }}
      onBlur={() => onChange(local)}
    />
  );
}

export function StatusBadge({ status }: { status: string }) {
  const s = status?.toUpperCase();
  let cls = 'badge-neutral';
  if (['ACTIVE', 'APPROVED', 'COMPLETED', 'RELEASED', 'VERIFIED'].includes(s)) cls = 'badge-success';
  else if (['PENDING', 'PENDING_REVIEW', 'IN_PROGRESS', 'FLAGGED'].includes(s)) cls = 'badge-warning';
  else if (['SUSPENDED', 'REJECTED', 'CANCELLED', 'DELETED', 'BANNED', 'FAILED'].includes(s)) cls = 'badge-danger';
  else if (['DRAFT', 'UPCOMING'].includes(s)) cls = 'badge-info';

  return <span className={`badge ${cls}`}>{status?.replace(/_/g, ' ')}</span>;
}

export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
      <div className="spinner" style={{ marginBottom: 16 }} />
      <p style={{ color: 'var(--rar-text-muted)', fontSize: 14 }}>{message}</p>
    </div>
  );
}

export function EmptyState({ message = 'No data found', icon }: { message?: string; icon?: React.ReactNode }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--rar-text-muted)' }}>
      {icon && <div style={{ marginBottom: 12, opacity: 0.5 }}>{icon}</div>}
      <p style={{ fontSize: 14 }}>{message}</p>
    </div>
  );
}
