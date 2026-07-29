import type { ReactNode } from 'react';

import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AuthGuard } from '@/features/auth/components/auth-guard';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-background">
        <div className="hidden md:block">
          <AdminSidebar />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="border-b border-border px-4 py-3 md:hidden">
            <p className="font-heading text-xl text-text">7Oz Admin</p>
          </div>
          <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
