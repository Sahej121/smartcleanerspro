'use client';
import { useState, useEffect } from 'react';

export default function LogisticsMap({ tasks }) {
  const [activeNode, setActiveNode] = useState(null);
  const [optimizerRunning, setOptimizerRunning] = useState(false);

  // Mock geocoding for tasks that don't have coordinates
  const processedTasks = tasks.map((task, i) => ({
    ...task,
    lat: task.lat || (28.6139 + (Math.random() - 0.5) * 0.1), // Mock Delhi coords
    lng: task.lng || (77.2090 + (Math.random() - 0.5) * 0.1),
  }));

  return (
    <div className="bg-theme-surface border border-theme-border rounded-[3rem] overflow-hidden relative shadow-2xl group min-h-[500px]">
      {/* Map Background Placeholder (Simulated Map) */}
      <div className="absolute inset-0 bg-[#0f172a] overflow-hidden">
        {/* Grid lines */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90(#1e293b 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        
        {/* Connection Lines (Routes) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
          <path d="M 100 100 L 200 150 L 300 120" stroke="#10b981" strokeWidth="2" fill="none" strokeDasharray="5,5" className="animate-pulse" />
        </svg>

        {/* Dynamic Nodes */}
        {processedTasks.map((task, i) => {
          // Map coordinates to 0-100%
          const x = ((task.lng - 77.1) / 0.2) * 100;
          const y = ((task.lat - 28.5) / 0.2) * 100;
          
          const isPickup = task.pickup_status !== 'completed' && task.pickup_status !== 'cancelled';
          const color = isPickup ? '#f59e0b' : '#10b981';

          return (
            <div 
              key={task.id}
              className="absolute group/node"
              style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
              onMouseEnter={() => setActiveNode(task)}
              onMouseLeave={() => setActiveNode(null)}
            >
              {/* Pulse effect for active node or in_transit */}
              {(task.pickup_status === 'in_transit' || task.delivery_status === 'in_transit') && (
                <div className="absolute inset-0 w-8 h-8 -left-2 -top-2 rounded-full animate-ping opacity-20" style={{ backgroundColor: color }}></div>
              )}
              
              <div 
                className={`w-4 h-4 rounded-full border-2 border-white shadow-lg cursor-pointer transition-all duration-300 ${activeNode?.id === task.id ? 'scale-150 z-50' : 'z-10'}`}
                style={{ backgroundColor: color }}
              ></div>

              {/* Tooltip */}
              {activeNode?.id === task.id && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-48 bg-theme-surface border border-theme-border p-3 rounded-2xl shadow-2xl z-[100] animate-fade-in pointer-events-none">
                  <p className="text-[9px] font-black uppercase tracking-widest text-theme-text-muted mb-1">
                    {isPickup ? 'Pickup' : 'Delivery'} • #{task.order_number}
                  </p>
                  <p className="text-xs font-black text-theme-text truncate">{task.customer_name}</p>
                  <p className="text-[8px] font-bold text-theme-text-muted mt-1 truncate">{task.customer_address}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Overlays */}
      <div className="absolute top-6 left-6 flex flex-col gap-3">
        <div className="bg-theme-surface/80 backdrop-blur-md border border-theme-border px-6 py-3 rounded-2xl flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[10px] font-black text-theme-text uppercase tracking-widest">Live Fleet Visualization</span>
        </div>
      </div>

      <div className="absolute top-6 right-6 flex gap-3">
        <button 
           className="bg-theme-surface/80 backdrop-blur-md border border-theme-border px-5 py-3 rounded-2xl flex items-center gap-2 hover:bg-theme-surface transition-all active:scale-95 shadow-sm"
           onClick={() => {
             setOptimizerRunning(true);
             setTimeout(() => setOptimizerRunning(false), 2000);
           }}
        >
          <span className={`material-symbols-outlined text-lg ${optimizerRunning ? 'animate-spin' : ''}`}>explore</span>
          <span className="text-[10px] font-black text-theme-text uppercase tracking-widest">
            {optimizerRunning ? 'Calculating...' : 'Optimize Routes'}
          </span>
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-6 left-6 bg-theme-surface/80 backdrop-blur-md border border-theme-border p-4 rounded-3xl flex gap-6">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
          <span className="text-[9px] font-black text-theme-text uppercase tracking-widest">Pickups</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
          <span className="text-[9px] font-black text-theme-text uppercase tracking-widest">Deliveries</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></div>
          <span className="text-[9px] font-black text-theme-text uppercase tracking-widest">In Transit</span>
        </div>
      </div>
    </div>
  );
}
