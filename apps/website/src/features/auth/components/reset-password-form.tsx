'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  authFieldClassName,
  passwordSchemaMessage,
} from '@/features/auth/lib/form-styles';
import { ApiClientError } from '@/lib/api-client';
import { resetPassword } from '@/services/auth';

const resetSchema = z
  .object({
    token: z.string().trim().min(1, 'Reset token is required.'),
    newPassword: z
      .string()
      .min(8, passwordSchemaMessage)
      .regex(/[A-Za-z]/, passwordSchemaMessage)
      .regex(/[0-9]/, passwordSchemaMessage),
    confirmPassword: z.string().min(1, 'Confirm your new password.'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

type ResetValues = z.infer<typeof resetSchema>;

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      token: searchParams.get('token') ?? '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: ResetValues) {
    setFormError(null);
    try {
      await resetPassword(values.token, values.newPassword);
      setDone(true);
    } catch (error) {
      setFormError(
        error instanceof ApiClientError
          ? error.message
          : 'Unable to reset password. Please try again.',
      );
    }
  }

  if (done) {
    return (
      <div className="space-y-6 rounded-media bg-surface-secondary/90 p-8 md:p-10">
        <p className="text-eyebrow">Updated</p>
        <h2 className="text-section-title text-text">Password reset complete</h2>
        <p className="text-sm leading-relaxed text-text-secondary">
          Sign in with your new password.
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
        <span className="text-text">Reset token</span>
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

      <label className="block space-y-2 text-sm">
        <span className="text-text">New password</span>
        <input
          type="password"
          autoComplete="new-password"
          className={authFieldClassName}
          aria-invalid={Boolean(errors.newPassword)}
          {...register('newPassword')}
        />
        {errors.newPassword ? (
          <p className="text-sm text-red-700" role="alert">
            {errors.newPassword.message}
          </p>
        ) : null}
      </label>

      <label className="block space-y-2 text-sm">
        <span className="text-text">Confirm password</span>
        <input
          type="password"
          autoComplete="new-password"
          className={authFieldClassName}
          aria-invalid={Boolean(errors.confirmPassword)}
          {...register('confirmPassword')}
        />
        {errors.confirmPassword ? (
          <p className="text-sm text-red-700" role="alert">
            {errors.confirmPassword.message}
          </p>
        ) : null}
      </label>

      {formError ? (
        <p className="text-sm text-red-700" role="alert">
          {formError}
        </p>
      ) : null}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Updating…' : 'Reset password'}
      </Button>

      <p className="text-sm text-text-secondary">
        <Link href="/login" className="text-text underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
