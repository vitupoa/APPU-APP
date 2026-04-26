'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { LoadingState } from '@/components/shared';
import { Wallet, DollarSign, AlertTriangle, TrendingDown } from 'lucide-react';

export default function BulkDeductionPage() {
  const qc = useQueryClient();
  const [fiatAmount, setFiatAmount] = useState('');
  const [currency, setCurrency] = useState('KES');
  const [reason, setReason] = useState('');
  const [result, setResult] = useState<any>(null);

  const { data: wallets, isLoading } = useQuery({
    queryKey: ['platform-wallets'],
    queryFn: () => api.get('/wallet/platform').then(r => r.data),
  });

  const deductMut = useMutation({
    mutationFn: () => api.post('/wallet/bulk-deduct', {
      fiatAmount: parseInt(fiatAmount),
      currency: currency.toUpperCase(),
      reason,
    }),
    onSuccess: (res) => {
      setResult(res.data);
      qc.invalidateQueries({ queryKey: ['platform-wallets'] });
    },
  });

  const CURRENCIES = [
    { code: 'KES', symbol: 'Ksh', name: 'Kenyan Shilling' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'TZS', symbol: 'Tsh', name: 'Tanzanian Shilling' },
    { code: 'UGX', symbol: 'USh', name: 'Ugandan Shilling' },
    { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
    { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi' },
    { code: 'RWF', symbol: 'FRw', name: 'Rwandan Franc' },
  ];

  const selectedCurrency = CURRENCIES.find(c => c.code === currency);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>Bulk Wallet Deduction</h1>
        <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--rar-text-muted)' }}>
          Deduct a fiat amount from all users with the specified currency.
        </p>
      </div>

      {/* Platform Revenue Wallet */}
      <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Wallet size={18} /> Platform Revenue Wallet
        </h3>
        {isLoading ? <LoadingState /> : (
          <div style={{ display: 'flex', gap: 24 }}>
            {wallets?.map((w: any) => (
              <div key={w.id} style={{ padding: 16, background: 'var(--rar-bg)', borderRadius: 12, minWidth: 180 }}>
                <div style={{ fontSize: 12, color: 'var(--rar-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{w.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>{Number(w.krBalance).toLocaleString()} Kr</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Deduction Form */}
      <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrendingDown size={18} /> Execute Bulk Deduction
        </h3>

        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--rar-text-secondary)', marginBottom: 6 }}>
              Currency
            </label>
            <select className="rar-select" style={{ width: '100%' }} value={currency} onChange={e => setCurrency(e.target.value)}>
              {CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>{c.symbol} — {c.name} ({c.code})</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--rar-text-secondary)', marginBottom: 6 }}>
              Amount ({selectedCurrency?.symbol})
            </label>
            <input
              type="number"
              className="rar-input"
              placeholder="e.g. 1"
              value={fiatAmount}
              onChange={e => {
                const val = e.target.value.replace(/\./g, '');
                setFiatAmount(val);
              }}
              min="1"
              step="1"
            />
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--rar-text-secondary)', marginBottom: 6 }}>
            Reason (internal audit trail)
          </label>
          <input
            className="rar-input"
            placeholder="e.g. Monthly platform maintenance fee"
            value={reason}
            onChange={e => setReason(e.target.value)}
          />
        </div>

        <div style={{ padding: 14, background: 'rgba(255,180,0,0.08)', borderRadius: 10, border: '1px solid rgba(255,180,0,0.2)', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <AlertTriangle size={18} style={{ color: '#e8a000', flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: 13, color: 'var(--rar-text-secondary)' }}>
            This will deduct <strong>{selectedCurrency?.symbol}{fiatAmount || '0'}</strong> from <strong>every user</strong> whose fiat currency is set to <strong>{currency}</strong>.
            Only users with sufficient Kr balance will be affected. The total deducted amount will be credited to the platform revenue wallet.
          </div>
        </div>

        <button
          className="btn btn-danger"
          onClick={() => {
            if (confirm(`CONFIRM: Deduct ${selectedCurrency?.symbol}${fiatAmount} from ALL ${currency} users?`)) {
              deductMut.mutate();
            }
          }}
          disabled={!fiatAmount || parseInt(fiatAmount) <= 0 || deductMut.isPending}
          style={{ width: '100%' }}
        >
          {deductMut.isPending ? 'Processing Deduction...' : `Execute Bulk Deduction (${selectedCurrency?.symbol}${fiatAmount || '0'} × all ${currency} users)`}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="glass-card" style={{ padding: 24, borderLeft: '4px solid var(--rar-success)' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: 'var(--rar-success)' }}>✅ Deduction Complete</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            {[
              ['Users Affected', result.usersAffected],
              ['Kr Per User', result.krPerUser?.toFixed(6)],
              ['Total Kr Deducted', result.totalKrDeducted?.toFixed(4)],
            ].map(([label, val]) => (
              <div key={label as string} style={{ padding: 12, background: 'var(--rar-bg)', borderRadius: 8 }}>
                <div style={{ fontSize: 12, color: 'var(--rar-text-muted)' }}>{label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
