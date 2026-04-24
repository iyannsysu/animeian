export default function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-xl border border-ink-800/60">
      <div className="skeleton aspect-[2/3] w-full" />
      <div className="space-y-2 p-2.5">
        <div className="skeleton h-3 w-full rounded" />
        <div className="skeleton h-3 w-2/3 rounded" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
