'use client';

import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';

export function LoyaltyPageCta() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const hydrated = useAuthStore((state) => state.hydrated);

  if (!hydrated) {
    return null;
  }

  if (accessToken) {
    return (
      <div className="flex flex-wrap gap-3">
        <Button href="/account#loyalty-rewards">Redeem in your account</Button>
        <Button href="/account" variant="outline">
          View points balance
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Button href={`/login?next=${encodeURIComponent('/account#loyalty-rewards')}`}>
        Sign in to redeem
      </Button>
      <Button href="/register" variant="outline">
        Create account
      </Button>
    </div>
  );
}
