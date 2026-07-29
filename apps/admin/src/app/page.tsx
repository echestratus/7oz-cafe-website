export default function AdminHomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center gap-6 px-6 py-24">
      <p className="text-sm tracking-[0.2em] text-[var(--color-text-secondary)] uppercase">
        7Oz Admin
      </p>
      <h1 className="text-5xl text-[var(--color-text)] md:text-6xl">Operations workspace ready</h1>
      <p className="max-w-xl text-lg text-[var(--color-text-secondary)]">
        The admin application scaffold is in place. Authentication, CMS, and operational modules
        will follow in later phases.
      </p>
    </main>
  );
}
