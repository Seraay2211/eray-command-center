export default function NotesLoading() {
  return (
    <div className="animate-pulse">
      <div className="flex items-end justify-between">
        <div>
          <div className="h-2 w-24 rounded bg-white/[0.06]" />
          <div className="mt-4 h-8 w-36 rounded bg-white/[0.07]" />
          <div className="mt-3 h-4 w-80 max-w-full rounded bg-white/[0.05]" />
        </div>
        <div className="hidden h-10 w-28 rounded-lg bg-violet-500/15 sm:block" />
      </div>
      <div className="mt-7 h-24 rounded-2xl border border-white/[0.05] bg-white/[0.025]" />
      <div className="mt-5 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            className="h-64 rounded-2xl border border-white/[0.05] bg-white/[0.025]"
            key={index}
          />
        ))}
      </div>
    </div>
  );
}
