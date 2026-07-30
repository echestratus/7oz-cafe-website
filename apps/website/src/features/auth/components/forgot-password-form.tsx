'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { authFieldClassName } from '@/features/auth/lib/form-styles';
import { ApiClientError } from '@/lib/api-client';
import { forgotPassword } from '@/services/auth';

const forgotSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
});

type ForgotValues = z.infer<typeof forgotSchema>;

export function ForgotPasswordForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  });

  async function onSubmit(values: ForgotValues) {
    setFormError(null);
    try {
      const result = await forgotPassword(values.email);
      setResetToken(result.passwordResetToken ?? null);
      setSubmitted(true);
    } catch (error) {
      setFormError(
        error instanceof ApiClientError
          ? error.message
          : 'Unable to start password reset. Please try again.',
      );
    }
  }

  if (submitted) {
    return (
      <div className="space-y-6 rounded-media bg-surface-secondary/90 p-8 md:p-10">
        <p className="text-eyebrow">Check your inbox</p>
        <h2 className="text-section-title text-text">Reset link accepted</h2>
        <p className="text-sm leading-relaxed text-text-secondary">
          If an account exists for that email, a reset link will be sent.
        </p>
        {resetToken ? (
          <div className="space-y-3 rounded-[12px] border border-border bg-surface p-4">
            <p className="text-sm text-text-secondary">
              Development mode: use this reset token:
            </p>
            <code className="block break-all text-xs text-text">{resetToken}</code>
            <Button
              href={`/reset-password?token=${encodeURIComponent(resetToken)}`}
              className="w-full"
            >
              Continue to reset
            </Button>
          </div>
        ) : (
          <Button href="/reset-password" className="w-full">
            Enter reset token
          </Button>
        )}
        <p className="text-sm text-text-secondary">
          <Link href="/login" className="text-text underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        </p>
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
        <span className="text-text">Email</span>
        <input
          type="email"
          autoComplete="email"
          className={authFieldClassName}
          aria-invalid={Boolean(errors.email)}
          {...register('email')}
        />
        {errors.email ? (
          <p className="text-sm text-red-700" role="alert">
            {errors.email.message}
          </p>
        ) : null}
      </label>

      {formError ? (
        <p className="text-sm text-red-700" role="alert">
          {formError}
        </p>
      ) : null}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Sending…' : 'Send reset link'}
      </Button>

      <p className="text-sm text-text-secondary">
        <Link href="/login" className="text-text underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
