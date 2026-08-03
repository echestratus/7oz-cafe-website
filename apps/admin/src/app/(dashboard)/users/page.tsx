'use client';

import { AuthGuard } from '@/features/auth/components/auth-guard';
import { StaffUsersManager } from '@/features/users/components/staff-users-manager';

export default function StaffUsersPage() {
  return (
    <AuthGuard permission="user.manage">
      <StaffUsersManager />
    </AuthGuard>
  );
}
