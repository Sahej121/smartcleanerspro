export default function Loading() {
  return (
    <div className="p-4 lg:p-8 space-y-8 animate-pulse selection:bg-emerald-500/10">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-surface-container-lowest border border-theme-border p-8 rounded-[3rem]">
        <div className="flex items-center gap-6 w-full">
          <div className="w-16 h-16 rounded-[1.5rem] bg-theme-surface-container shadow-sm"></div>
          <div className="space-y-3">
             <div className="h-4 w-24 bg-theme-surface-container rounded-full"></div>
             <div className="h-10 w-48 bg-theme-surface-container rounded-xl"></div>
             <div className="h-3 w-64 bg-theme-surface-container/60 rounded-full"></div>
          </div>
        </div>
        <div className="h-14 w-40 bg-theme-surface-container rounded-[1.5rem]"></div>
      </div>

      {/* Tabs & Search Skeleton */}
      <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
        <div className="flex gap-2 p-2 bg-theme-surface-container/30 border border-theme-border rounded-[2rem] w-full md:w-auto overflow-hidden">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-10 w-24 bg-theme-surface-container rounded-[1.25rem]"></div>
          ))}
        </div>
        <div className="h-14 w-full md:w-80 bg-theme-surface-container rounded-[1.5rem]"></div>
      </div>

      {/* Registry Table Skeleton */}
      <div className="bg-surface-container-lowest rounded-[2.5rem] border border-theme-border overflow-hidden">
        <div className="border-b border-theme-border h-16 bg-theme-surface-container/20 flex items-center px-8 gap-12">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className={`h-3 bg-theme-surface-container rounded-full ${i === 1 ? 'w-24' : 'w-16'}`}></div>
          ))}
        </div>
        <div className="divide-y divide-theme-border/50">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="px-8 py-8 flex items-center justify-between gap-12">
               <div className="h-4 w-20 bg-theme-surface-container rounded-md"></div>
               <div className="flex-1 flex items-center gap-3">
                 <div className="w-8 h-8 rounded-xl bg-theme-surface-container"></div>
                 <div className="space-y-2">
                    <div className="h-3 w-32 bg-theme-surface-container rounded-full"></div>
                    <div className="h-2 w-20 bg-theme-surface-container/60 rounded-full"></div>
                 </div>
               </div>
               <div className="h-6 w-24 bg-theme-surface-container/40 rounded-full"></div>
               <div className="h-6 w-20 bg-theme-surface-container/40 rounded-full"></div>
               <div className="h-4 w-20 bg-theme-surface-container rounded-md"></div>
               <div className="h-8 w-8 bg-theme-surface-container rounded-xl ml-auto"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
