'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAdminStore } from '@/store/adminStore';
import { Shield, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { setAdmin } = useAdminStore();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authApi.post('/login', { email, password });
      const { token, user } = res.data;

      if (!user.adminRole || !['SUPER_ADMIN', 'MODERATOR', 'FINANCE_MANAGER', 'SUPPORT_AGENT'].includes(user.adminRole)) {
        setError('Access denied. This portal is restricted to authorized administrators.');
        setLoading(false);
        return;
      }

      setAdmin({
        id: user.id,
        username: user.username,
        displayName: user.displayName || user.username,
        email: user.email,
        role: user.adminRole,
        permissions: user.adminPermissions || [],
        avatarUrl: user.avatarUrl,
      }, token);

      router.replace('/');
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Authentication failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-gradient" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      <div className="glass-card" style={{
        width: '100%',
        maxWidth: 420,
        padding: '40px 36px',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64,
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 8px 32px rgba(59, 130, 246, 0.3)',
          }}>
            <Shield size={32} color="white" />
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>
            RembrandtRAR
          </h1>
          <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--rar-text-muted)' }}>
            Krieta Platform Governance
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 14px', marginBottom: 20,
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 8, fontSize: 13, color: '#f87171',
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--rar-text-secondary)', marginBottom: 6 }}>
              Email Address
            </label>
            <input
              className="rar-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@krieta.com"
              required
              autoFocus
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--rar-text-secondary)', marginBottom: 6 }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                className="rar-input"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
                required
                style={{ paddingRight: 42 }}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'var(--rar-text-muted)',
                  cursor: 'pointer', padding: 0,
                }}
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{
              width: '100%', padding: '12px 16px', fontSize: 15, fontWeight: 600,
              background: loading ? 'var(--rar-text-muted)' : undefined,
            }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                Authenticating...
              </span>
            ) : 'Sign In to RembrandtRAR'}
          </button>
        </form>

        {/* Footer */}
        <p style={{
          textAlign: 'center', marginTop: 24, fontSize: 11,
          color: 'var(--rar-text-muted)',
        }}>
          Unauthorized access is strictly prohibited and monitored.
          <br />All actions are logged and audited.
        </p>
      </div>
    </div>
  );
}
