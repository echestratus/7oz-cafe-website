'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { authFieldClassName } from '@/features/auth/lib/form-styles';
import { ApiClientError } from '@/lib/api-client';
import { login } from '@/services/auth';
import { useAuthStore } from '@/stores/auth-store';

const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setSession = useAuthStore((state) => state.setSession);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(values: LoginValues) {
    setFormError(null);
    try {
      const session = await login(values.email, values.password);
      setSession(session.accessToken, session.user);
      const next = searchParams.get('next');
      router.replace(next && next.startsWith('/') ? next : '/account');
      router.refresh();
    } catch (error) {
      setFormError(
        error instanceof ApiClientError
          ? error.message
          : 'Unable to sign in. Please try again.',
      );
    }
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

      <label className="block space-y-2 text-sm">
        <span className="text-text">Password</span>
        <input
          type="password"
          autoComplete="current-password"
          className={authFieldClassName}
          aria-invalid={Boolean(errors.password)}
          {...register('password')}
        />
        {errors.password ? (
          <p className="text-sm text-red-700" role="alert">
            {errors.password.message}
          </p>
        ) : null}
      </label>

      {formError ? (
        <p className="text-sm text-red-700" role="alert">
          {formError}
        </p>
      ) : null}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </Button>

      <div className="space-y-2 text-sm text-text-secondary">
        <p>
          New here?{' '}
          <Link href="/register" className="text-text underline-offset-4 hover:underline">
            Create an account
          </Link>
        </p>
        <p>
          <Link
            href="/forgot-password"
            className="text-text underline-offset-4 hover:underline"
          >
            Forgot password?
          </Link>
        </p>
      </div>
    </form>
  );
}
