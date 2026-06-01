'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAdminStore } from '@/store/adminStore';
import {
  LayoutDashboard, Users, Film, Wallet, Flag, Settings,
  ScrollText, Shield, Megaphone, FileWarning, LogOut, ChevronLeft, Store, ShieldAlert, ShieldBan, TrendingDown, Database, FileCheck, CreditCard, DollarSign, MapPin, ShieldCheck
} from 'lucide-react';
import { useState } from 'react';
import { cn, getInitials } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, perm: 'analytics.view' },
  { href: '/users', label: 'Users', icon: Users, perm: 'users.view' },
  { href: '/content', label: 'Content', icon: Film, perm: 'content.view' },
  { href: '/sponsored', label: 'Sponsored Campaigns', icon: Megaphone, perm: 'content.view' },
  { href: '/ads', label: 'Ad Management', icon: DollarSign, superOnly: true },
  { href: '/locations', label: 'Locations', icon: MapPin, superOnly: true },
  { href: '/financials', label: 'Financials', icon: Wallet, perm: 'withdrawals.view' },
  { href: '/kyc', label: 'KYC Verification', icon: FileCheck, financialOnly: true },
  { href: '/withdrawals', label: 'Withdrawals', icon: CreditCard, financialOnly: true },
  { href: '/compliance', label: 'Compliance', icon: ShieldCheck, superOnly: true },
  { href: '/bulk-deduction', label: 'Bulk Deduction', icon: TrendingDown, superOnly: true },
  { href: '/feature-flags', label: 'Feature Flags', icon: Flag, superOnly: true },
  { href: '/auto-admire', label: 'Auto-Admire', icon: Users, superOnly: true },
  { href: '/announcements', label: 'Announcements', icon: Megaphone, perm: 'announcements.send' },
  { href: '/shops', label: 'Shop Moderation', icon: Store, perm: 'shops.view' },
  { href: '/chamas', label: 'Chama Moderation', icon: ShieldAlert, perm: 'chamas.view' },
  { href: '/names', label: 'Name Rules', icon: ShieldBan, perm: 'names.manage' },
  { href: '/database', label: 'Database Monitor', icon: Database, superOnly: true },
  { href: '/settings', label: 'Settings', icon: Settings, superOnly: true },
  { href: '/audit-logs', label: 'Audit Logs', icon: ScrollText, perm: 'audit_logs.view' },
  { href: '/team', label: 'Admin Team', icon: Shield, superOnly: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, hasPermission, isSuperAdmin, logout } = useAdminStore();
  const [collapsed, setCollapsed] = useState(false);

  const visibleItems = navItems.filter(item => {
    if (item.superOnly) return isSuperAdmin();
    if (item.financialOnly) return isSuperAdmin() || hasPermission('financial_management');
    if (item.perm) return hasPermission(item.perm);
    return true;
  });

  return (
    <aside
      style={{
        width: collapsed ? '72px' : 'var(--rar-sidebar-w)',
        minHeight: '100vh',
        background: 'var(--rar-surface)',
        borderRight: '1px solid var(--rar-border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 40,
        overflow: 'hidden',
      }}
    >
      {/* Logo */}
      <div style={{
        padding: '20px 16px',
        borderBottom: '1px solid var(--rar-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
          <div style={{
            width: 36, height: 36,
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 14, color: 'white',
            flexShrink: 0,
          }}>
            RR
          </div>
          {!collapsed && (
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--rar-text)', whiteSpace: 'nowrap' }}>
                RembrandtRAR
              </div>
              <div style={{ fontSize: 11, color: 'var(--rar-text-muted)', whiteSpace: 'nowrap' }}>
                Super Admin
              </div>
            </div>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--rar-text-muted)',
            cursor: 'pointer',
            padding: 4,
            transform: collapsed ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.3s ease',
          }}
        >
          <ChevronLeft size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
        {visibleItems.map(item => {
          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn('nav-link', isActive && 'active')}
              title={collapsed ? item.label : undefined}
              style={collapsed ? { justifyContent: 'center', padding: '10px' } : undefined}
            >
              <item.icon size={20} style={{ flexShrink: 0 }} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid var(--rar-border)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        <div style={{
          width: 36, height: 36,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, color: 'white',
          flexShrink: 0,
        }}>
          {user ? getInitials(user.displayName || user.username) : '?'}
        </div>
        {!collapsed && (
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--rar-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.displayName || user?.username}
            </div>
            <div style={{ fontSize: 11, color: 'var(--rar-text-muted)' }}>
              {user?.role?.replace('_', ' ')}
            </div>
          </div>
        )}
        {!collapsed && (
          <button
            onClick={logout}
            title="Sign Out"
            style={{
              background: 'transparent', border: 'none',
              color: 'var(--rar-text-muted)', cursor: 'pointer', padding: 4,
            }}
          >
            <LogOut size={18} />
          </button>
        )}
      </div>
    </aside>
  );
}
