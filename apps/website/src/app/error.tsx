'use client';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ reset }: ErrorPageProps) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-6 px-6 py-24">
      <p className="text-eyebrow">Error</p>
      <h1 className="text-page-title text-text">Something went wrong</h1>
      <p className="text-lede">
        Please try again. If the issue continues, refresh the page shortly.
      </p>
      <button
        type="button"
        onClick={reset}
        className="w-fit rounded-full bg-primary px-8 py-3 text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-white transition-colors duration-200 hover:bg-primary-hover"
      >
        Try again
      </button>
    </main>
  );
}
