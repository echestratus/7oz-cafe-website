'use client';

import { AuthGuard } from '@/features/auth/components/auth-guard';
import { CustomersManager } from '@/features/customers/components/customers-manager';

export default function CustomersPage() {
  return (
    <AuthGuard permission="customer.read">
      <CustomersManager />
    </AuthGuard>
  );
}
