'use client';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ reset }: ErrorPageProps) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-6 px-6 py-24">
      <p className="text-sm tracking-[0.18em] text-text-secondary uppercase">Error</p>
      <h1 className="font-heading text-5xl text-text">Something went wrong</h1>
      <p className="text-lg text-text-secondary">
        Please try again. If the issue continues, refresh the page shortly.
      </p>
      <button
        type="button"
        onClick={reset}
        className="w-fit rounded-[12px] bg-primary px-5 py-3 text-sm text-white hover:bg-primary-hover"
      >
        Try again
      </button>
    </main>
  );
}
