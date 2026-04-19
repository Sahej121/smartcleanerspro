'use client';

export default function DashboardPreview() {
  return (
    <div className="relative group perspective-1000">
      <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-[3rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
      
      <div className="relative glass-card-matte rounded-[2.5rem] border border-white/40 shadow-2xl overflow-hidden transform group-hover:rotate-1 group-hover:-translate-y-2 transition-all duration-700">
        {/* Mockup Toolbar */}
        <div className="bg-slate-900/5 backdrop-blur-md px-6 py-4 border-b border-slate-200/20 flex items-center justify-between">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400 opacity-50"></div>
            <div className="w-3 h-3 rounded-full bg-amber-400 opacity-50"></div>
            <div className="w-3 h-3 rounded-full bg-emerald-400 opacity-50"></div>
          </div>
          <div className="px-4 py-1.5 rounded-full bg-white/40 border border-slate-200/40 text-[10px] font-black text-slate-400 tracking-widest uppercase">
            https://app.drycleanersflow.com
          </div>
          <div className="w-10"></div>
        </div>
        
        {/* Mockup Content */}
        <div className="p-8 bg-white/30">
          <div className="flex gap-8 mb-10">
            <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-xl">
              <span className="material-symbols-outlined text-3xl">analytics</span>
            </div>
            <div className="flex-1 pt-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Store Performance</p>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">$24,482.00</h3>
            </div>
          </div>
          
            <div className="col-span-12 h-[300px] rounded-3xl bg-white/40 border border-white/40 p-8 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <p className="text-xs font-black text-slate-800 uppercase tracking-widest">Recent Orders</p>
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                </div>
              </div>
              <div className="space-y-5 flex-1 overflow-hidden">
                {[
                  { title: 'Premium Suit Cleaning', status: 'In Production', color: 'bg-amber-500/10 text-amber-600', icon: 'checkroom', price: '$85.00' },
                  { title: 'Eco-Wash Bundle', status: 'Ready to Ship', color: 'bg-emerald-500/10 text-emerald-600', icon: 'local_laundry_service', price: '$120.00' },
                  { title: 'Express Shirt Press', status: 'Received', color: 'bg-blue-500/10 text-blue-600', icon: 'history', price: '$45.00' },
                  { title: 'Curtain Restoration', status: 'On Hold', color: 'bg-slate-500/10 text-slate-500', icon: 'texture', price: '$210.00' },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center pb-4 border-b border-slate-200/20 last:border-0 last:pb-0">
                    <div className="flex gap-4 items-center">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                        <span className="material-symbols-outlined text-slate-400 text-sm">{item.icon}</span>
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-800">{item.title}</p>
                        <p className="text-[10px] font-medium text-slate-400">#CF-842{i} • {item.price}</p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full ${item.color} text-[8px] font-black uppercase tracking-widest`}>
                      {item.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
        </div>
        
        {/* Floating Accent */}
        <div className="absolute top-20 -right-10 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl animate-pulse"></div>
      </div>
      
      {/* Floating Badge */}
      <div className="absolute -bottom-6 -right-6 glass-card-dark p-6 rounded-3xl shadow-2xl border border-white/10 transform rotate-6 animate-fade-in-up stagger-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl primary-gradient text-white flex items-center justify-center">
            <span className="material-symbols-outlined">auto_graph</span>
          </div>
          <div>
            <p className="text-white text-lg font-black tracking-tight">+42%</p>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Efficiency</p>
          </div>
        </div>
      </div>
    </div>
  );
}
