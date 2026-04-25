export default function Loading() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center mb-4">
        <div className="h-10 w-48 bg-theme-surface-container rounded-2xl"></div>
        <div className="h-12 w-32 bg-theme-surface-container rounded-2xl"></div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-28 bg-theme-surface-container rounded-3xl"></div>
        ))}
      </div>

      {/* Search Bar Skeleton */}
      <div className="h-16 w-full bg-theme-surface-container rounded-2xl"></div>

      {/* Table Skeleton */}
      <div className="bg-theme-surface rounded-[2rem] border border-theme-border p-4">
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-20 bg-theme-surface-container/50 rounded-2xl"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
