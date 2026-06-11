export default function Loading() {
  return (
    <main className="min-h-screen bg-background px-4 py-12 sm:px-8">
      <div className="mx-auto max-w-lg">
        <div className="h-4 w-24 rounded bg-muted animate-pulse mb-8" />
        <div className="rounded-xl border-2 border-border overflow-hidden">
          <div className="h-1.5 w-full bg-muted" />
          <div className="p-5 space-y-4">
            <div className="h-6 w-48 rounded bg-muted animate-pulse" />
            <div className="h-4 w-32 rounded bg-muted animate-pulse" />
            <div className="h-80 rounded-lg bg-muted animate-pulse" />
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-11 w-11 rounded-full bg-muted animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
