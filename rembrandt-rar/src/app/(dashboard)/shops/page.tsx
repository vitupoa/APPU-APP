'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { LoadingState, Pagination, StatusBadge } from '@/components/shared';
import { Store, ShieldAlert, Trash2 } from 'lucide-react';

export default function ShopsPage() {
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['shops', page],
    queryFn: () => api.get('/shops', { params: { page, limit: 20 } }).then(r => r.data),
  });

  const moderateMut = useMutation({
    mutationFn: (vars: { id: string; action: string }) => api.post(`/shops/${vars.id}/moderate`, { action: vars.action }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shops'] }),
  });

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>Shop Moderation</h1>
        <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--rar-text-muted)' }}>
          Monitor and moderate platform marketplace products and shops
        </p>
      </div>

      {isLoading ? <LoadingState /> : (
        <div className="glass-card" style={{ overflow: 'auto' }}>
          <table className="rar-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Seller</th>
                <th>Price</th>
                <th>Status</th>
                <th>Created</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.items?.map((product: any) => (
                <tr key={product.id}>
                  <td>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 6, background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Store size={18} color="var(--rar-text-muted)" />
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{product.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--rar-text-muted)' }}>ID: {product.id.slice(0, 8)}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: 13 }}>@{product.seller?.username}</td>
                  <td style={{ fontWeight: 600 }}>{product.price} {product.currency}</td>
                  <td><StatusBadge status={product.status} /></td>
                  <td style={{ fontSize: 12, color: 'var(--rar-text-muted)' }}>{formatDate(product.createdAt)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button className="btn btn-warning btn-sm" onClick={() => {
                        if (confirm('Unlist this product?')) moderateMut.mutate({ id: product.id, action: 'unlist' });
                      }}>
                        <ShieldAlert size={14} /> Unlist
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => {
                        if (confirm('Delete this product?')) moderateMut.mutate({ id: product.id, action: 'delete' });
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
