import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-6 px-6 py-24">
      <p className="text-sm tracking-[0.18em] text-text-secondary uppercase">404</p>
      <h1 className="font-heading text-5xl text-text">Page not found</h1>
      <p className="text-lg text-text-secondary">
        The page you are looking for is unavailable. Return home and continue exploring 7Oz.
      </p>
      <Link href="/" className="text-primary hover:text-primary-hover">
        Back to homepage
      </Link>
    </main>
  );
}
