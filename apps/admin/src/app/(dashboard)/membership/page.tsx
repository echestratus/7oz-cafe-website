'use client';

import { AuthGuard } from '@/features/auth/components/auth-guard';
import { MembershipsManager } from '@/features/membership/components/memberships-manager';

export default function MembershipPage() {
  return (
    <AuthGuard permission="membership.manage">
      <MembershipsManager />
    </AuthGuard>
  );
}
