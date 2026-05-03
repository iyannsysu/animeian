import { SkeletonGrid } from "@/components/SkeletonCard";

export default function Loading() {
  return (
    <div className="container-page space-y-8">
      <div className="skeleton h-48 rounded-2xl sm:h-64" />
      <div>
        <div className="skeleton mb-3 h-6 w-48 rounded" />
        <SkeletonGrid count={12} />
      </div>
    </div>
  );
}
