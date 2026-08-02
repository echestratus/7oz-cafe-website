'use client';

import { AuthGuard } from '@/features/auth/components/auth-guard';
import { LoyaltyManager } from '@/features/loyalty/components/loyalty-manager';

export default function LoyaltyPage() {
  return (
    <AuthGuard permission="loyalty.manage">
      <LoyaltyManager />
    </AuthGuard>
  );
}
