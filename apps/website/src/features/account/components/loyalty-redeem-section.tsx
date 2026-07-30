'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { ApiClientError } from '@/lib/api-client';
import {
  getCustomerLoyaltyRewards,
  redeemLoyaltyReward,
  type CustomerLoyaltyReward,
  type LoyaltyRedemption,
} from '@/services/customer-loyalty';

interface LoyaltyRedeemSectionProps {
  balance: number;
}

function isOutOfStock(reward: CustomerLoyaltyReward): boolean {
  return reward.stock !== null && reward.stock <= 0;
}

export function LoyaltyRedeemSection({ balance }: LoyaltyRedeemSectionProps) {
  const queryClient = useQueryClient();
  const [confirmRewardId, setConfirmRewardId] = useState<string | null>(null);
  const [lastRedemption, setLastRedemption] = useState<LoyaltyRedemption | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const rewardsQuery = useQuery({
    queryKey: ['customer-loyalty-rewards'],
    queryFn: getCustomerLoyaltyRewards,
  });

  const redeemMutation = useMutation({
    mutationFn: redeemLoyaltyReward,
    onSuccess: async (result) => {
      setLastRedemption(result);
      setConfirmRewardId(null);
      setActionError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['customer-loyalty'] }),
        queryClient.invalidateQueries({ queryKey: ['customer-loyalty-history'] }),
        queryClient.invalidateQueries({ queryKey: ['customer-loyalty-rewards'] }),
      ]);
    },
    onError: (error) => {
      setActionError(
        error instanceof ApiClientError
          ? error.message
          : 'Unable to redeem this reward. Please try again.',
      );
    },
  });

  const rewards = rewardsQuery.data ?? [];

  return (
    <div id="loyalty-rewards" className="space-y-4 pt-4 scroll-mt-28">
      <h3 className="text-card-title text-text">Redeem rewards</h3>
      <p className="text-sm text-text-secondary">
        Choose a reward and confirm. Points are deducted when redemption succeeds.
      </p>

      {lastRedemption ? (
        <div
          className="space-y-3 rounded-[12px] border border-border bg-surface-secondary/90 p-5"
          role="status"
        >
          <p className="text-eyebrow">Redeemed</p>
          <p className="text-sm text-text">
            You redeemed <span className="font-medium">{lastRedemption.reward.title}</span> for{' '}
            {lastRedemption.pointsSpent} points.
          </p>
          <p className="text-sm text-text-secondary">
            New balance: {lastRedemption.account.balance} points.
          </p>
          <Button type="button" variant="outline" onClick={() => setLastRedemption(null)}>
            Redeem another
          </Button>
        </div>
      ) : null}

      {rewardsQuery.isLoading ? (
        <p className="text-sm text-text-secondary">Loading rewards…</p>
      ) : null}

      {rewardsQuery.error ? (
        <p className="text-sm text-red-700" role="alert">
          {rewardsQuery.error instanceof ApiClientError
            ? rewardsQuery.error.message
            : 'Unable to load rewards.'}
        </p>
      ) : null}

      {actionError ? (
        <p className="text-sm text-red-700" role="alert">
          {actionError}
        </p>
      ) : null}

      {!rewardsQuery.isLoading && !rewardsQuery.error && rewards.length === 0 ? (
        <p className="text-sm text-text-secondary">No rewards are available to redeem right now.</p>
      ) : null}

      {rewards.length > 0 ? (
        <ul className="space-y-4">
          {rewards.map((reward) => {
            const outOfStock = isOutOfStock(reward);
            const insufficient = balance < reward.pointsCost;
            const confirming = confirmRewardId === reward.id;
            const disabled =
              outOfStock || insufficient || redeemMutation.isPending || Boolean(lastRedemption);

            return (
              <li
                key={reward.id}
                className="space-y-3 border-t border-border pt-4 sm:flex sm:items-start sm:justify-between sm:gap-6"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium text-text">{reward.title}</p>
                  {reward.description ? (
                    <p className="text-sm text-text-secondary">{reward.description}</p>
                  ) : null}
                  <p className="text-sm text-text">{reward.pointsCost} points</p>
                  {outOfStock ? (
                    <p className="text-sm text-text-muted">Out of stock</p>
                  ) : null}
                  {!outOfStock && insufficient ? (
                    <p className="text-sm text-text-muted">
                      Need {reward.pointsCost - balance} more points
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2 sm:shrink-0">
                  {confirming ? (
                    <>
                      <Button
                        type="button"
                        disabled={redeemMutation.isPending}
                        onClick={() => {
                          setActionError(null);
                          redeemMutation.mutate(reward.id);
                        }}
                      >
                        {redeemMutation.isPending ? 'Redeeming…' : 'Confirm'}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={redeemMutation.isPending}
                        onClick={() => setConfirmRewardId(null)}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={disabled}
                      onClick={() => {
                        setActionError(null);
                        setConfirmRewardId(reward.id);
                      }}
                    >
                      Redeem
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
