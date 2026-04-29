# Phase 6: RembrandtRAR Web Dashboard & Hosting Guide

The **RembrandtRAR Super Admin System** backend is fully operational with role-based access control, comprehensive auditing, and core governance modules. Phase 6 covers the frontend implementation and production hosting.

Because the admin dashboard requires high security, separate physical infrastructure is recommended over integrating it into the primary Krieta mobile API or consumer frontend.

## 1. Technology Stack Recommendation

We recommend building the RembrandtRAR dashboard as a **Next.js (App Router)** web application.
* **Framework:** Next.js 16+ (React)
* **Styling:** Tailwind CSS + Shadcn UI (for clean, accessible, enterprise-grade admin components)
* **State Management:** Zustand (for global admin session and RBAC claims)
* **Data Fetching:** TanStack Query (React Query) + Axios
* **Authentication:** NextAuth.js (or custom JWT implementation syncing with Krieta's backend)

## 2. Setting Up the Project

Initialize the admin dashboard on your local machine:

```bash
npx create-next-app@latest rembrandt-rar-dashboard --typescript --tailwind --eslint
cd rembrandt-rar-dashboard
npm install axios zustand @tanstack/react-query lucide-react date-fns
```

## 3. Core Frontend Architecture

### A. API Service Configuration (`src/lib/api.ts`)
Set up an Axios instance that automatically attaches the Super Admin JWT to requests.

```typescript
import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_KRIETA_API_URL + '/api/v1/rar',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('rar_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### B. Global Store (`src/store/adminStore.ts`)
Manage the Admin's RBAC capabilities securely on the client.

```typescript
import { create } from 'zustand';

export type AdminRole = 'SUPER_ADMIN' | 'MODERATOR' | 'FINANCE_MANAGER' | 'SUPPORT_AGENT';

interface AdminState {
  user: { id: string; role: AdminRole; permissions: string[] } | null;
  setAdmin: (user: AdminState['user']) => void;
  logout: () => void;
  hasPermission: (perm: string) => boolean;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  user: null,
  setAdmin: (user) => set({ user }),
  logout: () => {
    localStorage.removeItem('rar_token');
    set({ user: null });
  },
  hasPermission: (perm) => {
    const state = get();
    if (!state.user) return false;
    if (state.user.role === 'SUPER_ADMIN') return true;
    return state.user.permissions.includes(perm);
  }
}));
```

### C. Dashboard Overview Component (`src/app/page.tsx`)
A simple component to fetch and display Phase 5 Analytics.

```tsx
'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function DashboardOverview() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboardOverview'],
    queryFn: async () => {
      const res = await api.get('/dashboard');
      return res.data;
    }
  });

  if (isLoading) return <div>Loading Secure Overview...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
      <div className="p-4 bg-white rounded shadow">
        <h3 className="text-gray-500 text-sm font-medium">Total Users</h3>
        <p className="text-3xl font-bold">{data.totalUsers}</p>
      </div>
      <div className="p-4 bg-white rounded shadow">
        <h3 className="text-gray-500 text-sm font-medium">Active Suspensions</h3>
        <p className="text-3xl font-bold">{data.activeSuspensions}</p>
      </div>
      <div className="p-4 bg-white rounded shadow">
        <h3 className="text-gray-500 text-sm font-medium">Pending Withdrawals</h3>
        <p className="text-3xl font-bold">{data.pendingWithdrawals}</p>
      </div>
    </div>
  );
}
```

## 4. Comprehensive Hosting & Deployment Guide

To ensure high availability and security, the RembrandtRAR frontend should be deployed independently from the mobile API backend. **Vercel** is the most optimal platform for Next.js.

### Step 1: Version Control & Repository Protection
1. Create a private GitHub/GitLab repository for the dashboard.
2. **CRITICAL:** Do not store the source code in the same repository as the public Krieta website to prevent accidental leakage of internal admin structures.

### Step 2: Vercel Deployment Workflow
1. Log in to [Vercel](https://vercel.com).
2. Click **Add New -> Project**.
3. Import your private `rembrandt-rar-dashboard` repository.
4. **Environment Variables Configuration:**
   Before clicking deploy, configure the following Environment Variables in the Vercel dashboard:
   * `NEXT_PUBLIC_KRIETA_API_URL`: Your production API URL (e.g., `https://api.krieta.com`).

### Step 3: Security Hardening (Vercel Firewall)
Because this is a Super Admin dashboard, you must lock down access to prevent brute-force attacks on the login page.
1. In Vercel, navigate to **Settings -> Security**.
2. **Vercel Web Application Firewall (WAF):**
   * Enable IP Blocking. Add a rule to only allow traffic from known IP ranges (e.g., your office VPN or static IP).
   * Enable DDoS mitigation.

### Step 4: Custom Domain
1. Map a cryptic or internal subdomain to the Vercel project, avoiding obvious names like `admin.krieta.com`.
2. Examples: `governance.krieta.com`, `sys-portal.krieta.com`, or `rar.krieta.com`.
3. Vercel automatically provisions enterprise-grade SSL certificates via Let's Encrypt.

### Step 5: Connecting the First Super Admin
Once the frontend is live:
1. SSH into your **production backend server**.
2. Run the bootstrap script created in Phase 1:
   ```bash
   node dist/modules/rembrandt-rar/scripts/create-superadmin.js
   ```
   *(Follow the prompt to create the initial Super Admin account.)*
3. Open your live dashboard URL (`rar.krieta.com`) and log in with those credentials.
4. From the frontend, you can now invite Sub-Admins, assign RBAC permissions, and manage Krieta.

---

### Final Implementation Checklist
- [x] **Phase 1:** Core Schema & RBAC Engine (Completed)
- [x] **Phase 2:** User & Content Moderation APIs (Completed)
- [x] **Phase 3:** Financial Escrow & Withdrawals (Completed)
- [x] **Phase 4:** Hierarchical Feature Flags (Completed)
- [x] **Phase 5:** Audit Logging & Analytics (Completed)
- [x] **Phase 6:** Frontend UI Architecture & Deployment Guide (Completed - Above)

The backend infrastructure is 100% production-ready. Let me know if you would like me to physically instantiate the Next.js frontend directory or if this guide meets your needs for handing off the deployment to your web operations team.
