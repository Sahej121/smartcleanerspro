export default function StaffLoading() {
  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto min-h-screen animate-pulse">
      <div className="page-header mb-8">
        <div>
          <div className="h-10 w-64 bg-theme-border rounded-xl mb-3"></div>
          <div className="h-4 w-96 bg-theme-border/50 rounded-lg"></div>
        </div>
        <div className="h-12 w-32 bg-theme-border rounded-xl"></div>
      </div>

      <div className="stats-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="stat-card h-24 bg-theme-border/30 rounded-3xl border border-theme-border"></div>
        ))}
      </div>

      <div className="card h-96 bg-theme-border/20 rounded-[2.5rem] border border-theme-border"></div>
    </div>
  );
}
