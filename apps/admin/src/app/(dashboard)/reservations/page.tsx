'use client';

import { AuthGuard } from '@/features/auth/components/auth-guard';
import { ReservationsManager } from '@/features/reservations/components/reservations-manager';

export default function ReservationsPage() {
  return (
    <AuthGuard permission="reservation.manage">
      <ReservationsManager />
    </AuthGuard>
  );
}
