import type { Metadata } from 'next';
import Image from 'next/image';

import { LoginForm } from '@/features/auth/components/login-form';

export const metadata: Metadata = {
  title: 'Sign in',
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-secondary px-6 py-16">
      <div className="w-full max-w-md rounded-[24px] border border-border bg-surface p-8 shadow-sm">
        <div className="mb-8 flex items-center gap-3">
          <Image
            src="/assets/logo/logo-7-oz-espresso-scaled.png"
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 object-contain"
          />
          <div>
            <p className="font-heading text-2xl text-text">7Oz Admin</p>
            <p className="text-sm text-text-secondary">Sign in to continue</p>
          </div>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
