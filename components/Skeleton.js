'use client';

export default function Skeleton({ className, variant = 'rect' }) {
  const baseClass = "animate-pulse bg-zinc-200 dark:bg-zinc-800 rounded-md";
  const variants = {
    rect: "",
    circle: "rounded-full",
    text: "h-4 w-full",
    heading: "h-8 w-3/4",
  };

  return (
    <div className={`${baseClass} ${variants[variant]} ${className}`}></div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="p-4 lg:p-8 space-y-6 lg:space-y-8">
      {/* Page Header Skeleton */}
      <div className="flex justify-between items-end border-b border-slate-100 pb-6">
        <div className="space-y-2 w-1/3">
          <Skeleton variant="heading" className="w-full" />
          <Skeleton variant="text" className="w-1/2" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="w-24 h-10 rounded-[1rem]" />
          <Skeleton className="w-32 h-10 rounded-[1rem]" />
        </div>
      </div>

      {/* Top Metrics Bento Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-8 rounded-[2.5rem] bg-surface-container-lowest border border-outline-variant/10 shadow-sm space-y-4">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <Skeleton variant="text" className="w-1/2 h-2" />
            <Skeleton variant="heading" className="w-full" />
            <Skeleton variant="text" className="w-1/3 h-2" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart Skeleton */}
        <div className="lg:col-span-2 bg-theme-surface rounded-[3rem] p-8 lg:p-10 border border-theme-border shadow-xl h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-10">
            <Skeleton variant="heading" className="w-1/4" />
            <Skeleton className="w-24 h-6 rounded-xl" />
          </div>
          <div className="flex-1 flex items-end gap-3">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <Skeleton key={i} className="flex-1 rounded-t-2xl" style={{ height: `${Math.random() * 60 + 20}%` }} />
            ))}
          </div>
        </div>

        {/* Status Mix Skeleton */}
        <div className="bg-theme-surface rounded-[3rem] p-8 lg:p-10 border border-theme-border shadow-xl space-y-8">
          <Skeleton variant="heading" className="w-1/2" />
          <div className="space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton variant="text" className="w-1/4 h-2" />
                  <Skeleton variant="text" className="w-10 h-2" />
                </div>
                <Skeleton className="w-full h-2 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
