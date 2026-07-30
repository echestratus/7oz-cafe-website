'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { authFieldClassName } from '@/features/auth/lib/form-styles';
import { ApiClientError } from '@/lib/api-client';
import { verifyEmail } from '@/services/auth';

const verifySchema = z.object({
  token: z.string().trim().min(1, 'Verification token is required.'),
});

type VerifyValues = z.infer<typeof verifySchema>;

export function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VerifyValues>({
    resolver: zodResolver(verifySchema),
    defaultValues: { token: searchParams.get('token') ?? '' },
  });

  async function onSubmit(values: VerifyValues) {
    setFormError(null);
    try {
      await verifyEmail(values.token);
      setVerified(true);
    } catch (error) {
      setFormError(
        error instanceof ApiClientError
          ? error.message
          : 'Unable to verify email. Please try again.',
      );
    }
  }

  if (verified) {
    return (
      <div className="space-y-6 rounded-media bg-surface-secondary/90 p-8 md:p-10">
        <p className="text-eyebrow">Verified</p>
        <h2 className="text-section-title text-text">Your email is confirmed</h2>
        <p className="text-sm leading-relaxed text-text-secondary">
          You can now sign in and view your membership and loyalty account.
        </p>
        <Button href="/login" className="w-full">
          Sign in
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 rounded-media bg-surface-secondary/90 p-8 md:p-10"
      noValidate
    >
      <label className="block space-y-2 text-sm">
        <span className="text-text">Verification token</span>
        <input
          type="text"
          className={authFieldClassName}
          aria-invalid={Boolean(errors.token)}
          {...register('token')}
        />
        {errors.token ? (
          <p className="text-sm text-red-700" role="alert">
            {errors.token.message}
          </p>
        ) : null}
      </label>

      {formError ? (
        <p className="text-sm text-red-700" role="alert">
          {formError}
        </p>
      ) : null}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Verifying…' : 'Verify email'}
      </Button>

      <p className="text-sm text-text-secondary">
        Ready to sign in?{' '}
        <Link href="/login" className="text-text underline-offset-4 hover:underline">
          Go to login
        </Link>
      </p>
    </form>
  );
}
