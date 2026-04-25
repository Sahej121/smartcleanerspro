export default function OrdersLoading() {
  return (
    <div className="min-h-screen bg-background p-4 lg:p-8 animate-pulse">
      <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">
        {/* Header Skeleton */}
        <div className="h-48 bg-surface border border-theme-border rounded-[3rem]"></div>

        {/* Filters Skeleton */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="h-14 w-full md:w-96 bg-surface border border-theme-border rounded-[2rem]"></div>
          <div className="h-14 w-full md:w-80 bg-surface border border-theme-border rounded-[1.5rem]"></div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-surface rounded-[2.5rem] border border-theme-border h-[500px]"></div>
      </div>
    </div>
  );
}
