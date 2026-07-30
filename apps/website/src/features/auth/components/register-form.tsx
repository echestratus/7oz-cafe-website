'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  authFieldClassName,
  passwordSchemaMessage,
} from '@/features/auth/lib/form-styles';
import { ApiClientError } from '@/lib/api-client';
import { registerAccount } from '@/services/auth';

const registerSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name.'),
  email: z.string().trim().email('Enter a valid email address.'),
  password: z
    .string()
    .min(8, passwordSchemaMessage)
    .regex(/[A-Za-z]/, passwordSchemaMessage)
    .regex(/[0-9]/, passwordSchemaMessage),
});

type RegisterValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', password: '' },
  });

  async function onSubmit(values: RegisterValues) {
    setFormError(null);
    try {
      const result = await registerAccount(values);
      setRegisteredEmail(result.user.email);
      setVerificationToken(result.verificationToken ?? null);
    } catch (error) {
      setFormError(
        error instanceof ApiClientError
          ? error.message
          : 'Unable to create your account. Please try again.',
      );
    }
  }

  if (registeredEmail) {
    return (
      <div className="space-y-6 rounded-media bg-surface-secondary/90 p-8 md:p-10">
        <p className="text-eyebrow">Almost there</p>
        <h2 className="text-section-title text-text">Verify your email</h2>
        <p className="text-sm leading-relaxed text-text-secondary">
          We created an account for <span className="text-text">{registeredEmail}</span>. Verify
          your email before signing in.
        </p>
        {verificationToken ? (
          <div className="space-y-3 rounded-[12px] border border-border bg-surface p-4">
            <p className="text-sm text-text-secondary">
              Development mode: email delivery is not configured yet. Use this verification token:
            </p>
            <code className="block break-all text-xs text-text">{verificationToken}</code>
            <Button
              href={`/verify-email?token=${encodeURIComponent(verificationToken)}`}
              className="w-full"
            >
              Continue to verify
            </Button>
          </div>
        ) : (
          <Button href="/verify-email" className="w-full">
            Enter verification token
          </Button>
        )}
        <p className="text-sm text-text-secondary">
          Already verified?{' '}
          <Link href="/login" className="text-text underline-offset-4 hover:underline">
            Sign in
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
        <span className="text-text">Full name</span>
        <input
          type="text"
          autoComplete="name"
          className={authFieldClassName}
          aria-invalid={Boolean(errors.fullName)}
          {...register('fullName')}
        />
        {errors.fullName ? (
          <p className="text-sm text-red-700" role="alert">
            {errors.fullName.message}
          </p>
        ) : null}
      </label>

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

      <label className="block space-y-2 text-sm">
        <span className="text-text">Password</span>
        <input
          type="password"
          autoComplete="new-password"
          className={authFieldClassName}
          aria-invalid={Boolean(errors.password)}
          {...register('password')}
        />
        {errors.password ? (
          <p className="text-sm text-red-700" role="alert">
            {errors.password.message}
          </p>
        ) : null}
        <p className="text-xs text-text-muted">{passwordSchemaMessage}</p>
      </label>

      {formError ? (
        <p className="text-sm text-red-700" role="alert">
          {formError}
        </p>
      ) : null}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Creating account…' : 'Create account'}
      </Button>

      <p className="text-sm text-text-secondary">
        Already have an account?{' '}
        <Link href="/login" className="text-text underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
