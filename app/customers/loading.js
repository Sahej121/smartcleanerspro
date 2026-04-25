export default function CustomersLoading() {
  return (
    <div className="min-h-screen bg-background p-4 lg:p-8 animate-pulse">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Skeleton */}
        <div className="h-48 bg-surface border border-theme-border rounded-[3rem]"></div>

        {/* Action Bar Skeleton */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="h-14 w-full md:w-96 bg-surface border border-theme-border rounded-[1.5rem]"></div>
          <div className="flex gap-4 w-full md:w-auto">
            <div className="h-14 w-24 bg-surface border border-theme-border rounded-[1.5rem]"></div>
            <div className="h-14 w-32 bg-emerald-600/20 rounded-[1.5rem]"></div>
          </div>
        </div>

        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-80 bg-surface rounded-[2.5rem] border border-theme-border"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
