function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-2xl bg-white/[0.05] ${className}`} />;
}

export default function DashboardLoading() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="rounded-2xl border border-white/[0.07] bg-[#111114]/80 p-6 sm:p-8">
        <SkeletonBlock className="h-4 w-36" />
        <SkeletonBlock className="mt-5 h-10 w-72 max-w-full" />
        <SkeletonBlock className="mt-3 h-4 w-full max-w-xl" />
        <div className="mt-6 flex gap-3">
          <SkeletonBlock className="h-11 w-32" />
          <SkeletonBlock className="h-11 w-32" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            className="rounded-2xl border border-white/[0.07] bg-[#111114]/80 p-5"
            key={index}
          >
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="mt-4 h-9 w-20" />
            <SkeletonBlock className="mt-5 h-3 w-full" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                className="rounded-2xl border border-white/[0.07] bg-[#111114]/80 p-4"
                key={index}
              >
                <SkeletonBlock className="h-10 w-10" />
                <SkeletonBlock className="mt-5 h-4 w-32" />
                <SkeletonBlock className="mt-2 h-3 w-full" />
              </div>
            ))}
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <div
                className="rounded-2xl border border-white/[0.07] bg-[#111114]/80 p-5"
                key={index}
              >
                <SkeletonBlock className="h-4 w-28" />
                <SkeletonBlock className="mt-2 h-5 w-36" />
                <SkeletonBlock className="mt-6 h-20 w-full" />
                <SkeletonBlock className="mt-4 h-20 w-full" />
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3 2xl:grid-cols-1">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              className="rounded-2xl border border-white/[0.07] bg-[#111114]/80 p-5"
              key={index}
            >
              <SkeletonBlock className="h-10 w-10" />
              <SkeletonBlock className="mt-5 h-5 w-40" />
              <SkeletonBlock className="mt-3 h-4 w-full" />
              <SkeletonBlock className="mt-2 h-4 w-5/6" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
