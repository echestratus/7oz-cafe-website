export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center gap-8 px-6 py-24">
      <p className="text-sm tracking-[0.2em] text-[var(--color-text-secondary)] uppercase">
        7Oz Espresso Cafe
      </p>
      <h1 className="max-w-3xl text-5xl leading-tight text-[var(--color-text)] md:text-7xl">
        Crafted espresso. Calm spaces. Coming soon.
      </h1>
      <p className="max-w-xl text-lg text-[var(--color-text-secondary)]">
        The public website workspace is ready. Content, reservations, and membership flows will land
        in upcoming phases.
      </p>
    </main>
  );
}
