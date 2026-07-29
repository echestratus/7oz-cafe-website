export default function Loading() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-4 px-6 py-24">
      <div className="h-3 w-24 rounded-full bg-border" />
      <div className="h-12 w-3/4 rounded-[12px] bg-surface-secondary" />
      <div className="h-6 w-1/2 rounded-[8px] bg-surface-secondary" />
    </main>
  );
}
