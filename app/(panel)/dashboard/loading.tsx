function SkeletonBlock({ className }: { className: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-[color-mix(in_srgb,var(--border)_45%,transparent)] ${className}`}
    />
  );
}

export default function DashboardLoading() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="app-card rounded-2xl border p-6 sm:p-8">
        <SkeletonBlock className="h-4 w-36" />
        <SkeletonBlock className="mt-5 h-10 w-72 max-w-full" />
        <SkeletonBlock className="mt-3 h-4 w-full max-w-xl" />
        <div className="mt-6 flex flex-wrap gap-3">
          <SkeletonBlock className="h-11 w-32" />
          <SkeletonBlock className="h-11 w-32" />
          <SkeletonBlock className="h-11 w-32" />
        </div>
      </div>

      <div className="app-card rounded-2xl border p-6">
        <SkeletonBlock className="h-5 w-52" />
        <SkeletonBlock className="mt-3 h-4 w-full max-w-2xl" />
        <div className="mt-6 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonBlock className="h-20 w-full" key={index} />
          ))}
        </div>
        <SkeletonBlock className="mt-5 h-10 w-52" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            className="app-card rounded-2xl border p-5"
            key={index}
          >
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="mt-4 h-9 w-20" />
            <SkeletonBlock className="mt-5 h-3 w-full" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div className="app-card rounded-2xl border p-5" key={index}>
            <SkeletonBlock className="h-10 w-10" />
            <SkeletonBlock className="mt-4 h-5 w-44" />
            <SkeletonBlock className="mt-5 h-20 w-full" />
            <SkeletonBlock className="mt-3 h-20 w-full" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div className="app-card rounded-2xl border p-5" key={index}>
            <SkeletonBlock className="h-5 w-36" />
            <SkeletonBlock className="mt-5 h-16 w-full" />
            <SkeletonBlock className="mt-3 h-16 w-full" />
            <SkeletonBlock className="mt-3 h-16 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
