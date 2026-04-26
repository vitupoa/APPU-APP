'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminStore, initAdminFromStorage } from '@/store/adminStore';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAdminStore();
  const router = useRouter();

  useEffect(() => {
    initAdminFromStorage();
  }, []);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: 'var(--rar-bg)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--rar-text-muted)', fontSize: 14 }}>
            Authenticating...
          </p>
        </div>
      </div>
    );
  }

  if (!user) return null;
  return <>{children}</>;
}
