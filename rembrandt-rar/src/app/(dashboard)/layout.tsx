'use client';
import { Sidebar } from '@/components/Sidebar';
import { AuthGuard } from '@/components/AuthGuard';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <main style={{
          flex: 1,
          marginLeft: 'var(--rar-sidebar-w)',
          padding: '24px 32px',
          transition: 'margin-left 0.3s ease',
          minWidth: 0,
        }}>
          <div className="page-enter">
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
