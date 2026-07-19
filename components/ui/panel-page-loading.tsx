interface PanelPageLoadingProps {
  detail?: boolean;
  label: string;
}

function Skeleton({ className }: { className: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-[color-mix(in_srgb,var(--border)_55%,transparent)] ${className}`}
    />
  );
}

export function PanelPageLoading({
  detail = true,
  label,
}: PanelPageLoadingProps) {
  return (
    <div aria-busy="true" aria-label={label} className="space-y-5">
      <div className="app-card rounded-2xl border p-5 sm:p-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-4 h-8 w-64 max-w-full" />
        <Skeleton className="mt-3 h-4 w-full max-w-lg" />
      </div>

      <div
        className={
          detail
            ? "grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.72fr)]"
            : "grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3"
        }
      >
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div className="app-card rounded-2xl border p-4" key={index}>
              <Skeleton className="h-5 w-2/5" />
              <Skeleton className="mt-4 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-3/4" />
            </div>
          ))}
        </div>
        {detail ? (
          <div className="app-card hidden min-h-80 rounded-2xl border p-5 lg:block">
            <Skeleton className="h-6 w-2/5" />
            <Skeleton className="mt-5 h-4 w-full" />
            <Skeleton className="mt-3 h-4 w-4/5" />
            <Skeleton className="mt-8 h-24 w-full" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
