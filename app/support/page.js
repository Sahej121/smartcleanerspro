'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SupportPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: '', description: '', priority: 'medium' });

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/support');
      const data = await res.json();
      setTickets(data);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCreateTicket = async () => {
    if (!newTicket.subject) return;
    try {
      await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTicket),
      });
      setShowCreateModal(false);
      setNewTicket({ subject: '', description: '', priority: 'medium' });
      fetchTickets();
    } catch (error) {
      console.error('Failed to create ticket:', error);
    }
  };

  const helpTopics = [
    { title: 'POS Operations', icon: 'point_of_sale', desc: 'Processing orders, payments, and adjusting transactions.', color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
    { title: 'Setup & Hardware', icon: 'print', desc: 'Connecting thermal printers, barcode scanners, and scales.', color: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
    { title: 'Account & Billing', icon: 'credit_card', desc: 'Managing subscriptions, invoices, and billing preferences.', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
    { title: 'Garment Care Directory', icon: 'styler', desc: 'Best practices for treating specific fabrics and stains.', color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20' },
    { title: 'Staff Management', icon: 'badge', desc: 'Adding roles, managing PIN codes, and tracking hours.', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
    { title: 'Reporting & Analytics', icon: 'monitoring', desc: 'Exporting EOFY reports, sales tracking, and insights.', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' }
  ];

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffHours = diffMs / (1000 * 60 * 60);
    
    if (diffHours < 24) return `Today, ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    if (diffHours < 48) return `Yesterday, ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusLabel = (status) => {
    if (status === 'in_progress') return 'In Progress';
    if (status === 'resolved') return 'Resolved';
    if (status === 'open') return 'Open';
    if (status === 'closed') return 'Closed';
    return status;
  };

  return (
    <div className="min-h-screen bg-background p-4 lg:p-8 font-sans selection:bg-primary/30 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3"></div>

      <div className="max-w-7xl mx-auto space-y-6 lg:space-y-10 relative z-10">
        
        {/* Navigation & Header */}
        <div className="animate-fade-in-up">
          <button 
            onClick={() => router.back()}
            className="mb-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-theme-text-muted hover:text-theme-text hover:bg-theme-surface-container px-4 py-2 rounded-[1rem] border border-transparent hover:border-theme-border transition-all w-fit active:scale-95"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Go Back
          </button>
          
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-[1.2rem] bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_30px_rgba(16,185,129,0.1)] text-primary">
                 <span className="material-symbols-outlined text-2xl">support_agent</span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-black tracking-tighter text-theme-text font-headline">Support Center</h1>
            </div>
            <p className="text-theme-text-muted font-bold text-lg">Help documentation, guides, and master node concierge services.</p>
          </div>
        </div>

        {/* Hero Search Section */}
        <div className="bg-surface/80 border border-theme-border rounded-[3rem] p-8 lg:p-12 relative overflow-hidden flex flex-col items-center text-center shadow-xl backdrop-blur-3xl animate-fade-in-up stagger-1">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>

          <div className="relative z-10 max-w-3xl w-full">
            <h2 className="text-3xl lg:text-4xl font-black text-theme-text font-headline mb-4 tracking-tighter">How can we assist your production?</h2>
            <p className="text-theme-text-muted text-sm font-bold mb-10">Search our robust knowledge base to recalibrate your workflow and hardware parameters.</p>
            
            <div className="relative w-full group/search">
              <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-theme-text-muted group-focus-within/search:text-primary transition-colors text-2xl z-20">search</span>
              <input
                type="text"
                placeholder="e.g. 'Resolving Bottleneck AI delays'"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-theme-surface-container border border-theme-border rounded-[2rem] py-6 pl-16 pr-8 text-base font-black placeholder:text-theme-text-muted/60 text-theme-text focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary/50 shadow-lg transition-all"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
          
          {/* Left Col: Topics Grid */}
          <div className="lg:col-span-2 space-y-6 animate-fade-in-up stagger-2">
            <h3 className="text-sm font-black text-theme-text-muted uppercase tracking-[0.3em] flex items-center gap-2 border-b border-theme-border/50 pb-4">
               <span className="material-symbols-outlined text-[16px]">menu_book</span> Knowledge Base Topics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {helpTopics.map((topic, i) => (
                <div key={i} className="bg-surface border border-theme-border rounded-[2.5rem] p-6 shadow-sm hover:-translate-y-1 hover:shadow-lg hover:border-theme-text transition-all cursor-pointer group flex gap-5 items-start">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border shadow-inner ${topic.bg} ${topic.color} group-hover:scale-110 group-hover:-rotate-3 transition-transform`}>
                    <span className="material-symbols-outlined text-2xl drop-shadow-sm">{topic.icon}</span>
                  </div>
                  <div>
                    <h4 className="text-base font-black text-theme-text mb-2 transition-colors">{topic.title}</h4>
                    <p className="text-xs text-theme-text-muted leading-relaxed font-bold">{topic.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Col: Tickets & Contact */}
          <div className="lg:col-span-1 space-y-8 animate-fade-in-up stagger-3">
            
            {/* Contact Concierge */}
            <div className="primary-gradient rounded-[2.5rem] p-8 text-white shadow-xl shadow-primary/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl translate-x-1/2 -translate-y-1/4 group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-white/20">
                  <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>support_agent</span>
                </div>
                <h3 className="text-2xl font-black font-headline mb-2 tracking-tighter">Atelier Concierge</h3>
                <p className="text-white/80 text-xs font-bold mb-8 leading-relaxed">
                  Need specialized assistance? Connect with your dedicated Enterprise support specialist securely.
                </p>
                <button className="w-full bg-white text-primary py-4 rounded-[1.2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-lg hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:-translate-y-0.5 transition-all active:scale-95 flex items-center justify-center gap-3">
                  <span className="material-symbols-outlined text-lg">chat_bubble</span>
                  Start Secure Chat
                </button>
              </div>
            </div>

            {/* Recent Tickets */}
            <div className="bg-surface border border-theme-border rounded-[2.5rem] p-8 shadow-sm space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-theme-border/50">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-theme-text-muted flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">assignment</span> Recent Tickets
                </h3>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="w-8 h-8 rounded-[0.8rem] bg-theme-surface-container border border-theme-border hover:bg-theme-text text-theme-text-muted hover:text-background flex items-center justify-center transition-all shadow-inner active:scale-95"
                >
                   <span className="material-symbols-outlined text-[16px]">add</span>
                </button>
              </div>
              
              <div className="space-y-4">
                {loadingTickets ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 rounded-full border-4 border-theme-border border-t-primary animate-spin mx-auto mb-4"></div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-text-muted animate-pulse">Syncing Queries...</p>
                  </div>
                ) : tickets.length > 0 ? (
                  tickets.slice(0, 5).map((ticket, i) => (
                    <div key={ticket.id} className="p-4 rounded-[1.5rem] bg-theme-surface-container/50 border border-theme-border/50 hover:border-primary/50 transition-colors cursor-pointer group">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] font-black tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">TKT-{ticket.id}</span>
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                          ticket.status === 'resolved' || ticket.status === 'closed' ? 'bg-theme-surface-container text-theme-text-muted border-theme-border' : 
                          ticket.status === 'open' ? 'bg-primary/10 text-primary border-primary/30 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                        }`}>
                          {getStatusLabel(ticket.status)}
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-theme-text mb-2 leading-snug group-hover:text-primary transition-colors">{ticket.subject}</h4>
                      <p className="text-[9px] uppercase font-black tracking-widest text-theme-text-muted">{formatDate(ticket.created_at)}</p>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center opacity-60">
                     <span className="material-symbols-outlined text-3xl text-theme-text-muted mb-2">inbox</span>
                     <p className="text-[10px] font-black uppercase tracking-widest text-theme-text-muted">No Active Tickets</p>
                  </div>
                )}
              </div>
              
              <button className="w-full py-4 text-[10px] font-black uppercase tracking-[0.2em] text-theme-text-muted bg-theme-surface-container border border-theme-border hover:bg-theme-border rounded-[1.2rem] transition-colors mt-4">
                View Ticket History
              </button>
            </div>

          </div>
        </div>

        {/* Create Ticket Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-3xl flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="absolute w-[500px] h-[500px] bg-primary/10 blur-[100px] rounded-full pointer-events-none"></div>

            <div className="relative z-10 bg-surface rounded-[3rem] w-[95%] sm:w-full max-w-lg shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-theme-border overflow-hidden animate-scale-in">
              <div className="p-8 border-b border-theme-border/50 flex justify-between items-center bg-theme-surface-container/30">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-[1.2rem] bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                    <span className="material-symbols-outlined text-2xl">confirmation_number</span>
                  </div>
                  <div>
                    <h3 className="font-black text-2xl font-headline tracking-tighter text-theme-text">New Request</h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-text-muted mt-1">Submit technical parameters</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-12 h-12 flex items-center justify-center rounded-[1rem] bg-theme-surface-container border border-theme-border hover:bg-theme-text text-theme-text-muted hover:text-background transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-theme-text-muted mb-3 block">Subject Vector</label>
                  <input
                    type="text"
                    autoFocus
                    className="w-full bg-theme-surface-container border border-theme-border rounded-[1.5rem] p-5 text-sm font-black focus:ring-4 focus:ring-primary/20 focus:border-primary/50 outline-none transition-all placeholder:text-theme-text-muted/60 text-theme-text"
                    placeholder="Brief summary of the anomaly"
                    value={newTicket.subject}
                    onChange={e => setNewTicket({ ...newTicket, subject: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-theme-text-muted mb-3 block">Diagnostic Description</label>
                  <textarea
                    rows={4}
                    className="w-full bg-theme-surface-container border border-theme-border rounded-[1.5rem] p-5 text-sm font-black focus:ring-4 focus:ring-primary/20 focus:border-primary/50 outline-none transition-all placeholder:text-theme-text-muted/60 text-theme-text resize-none"
                    placeholder="Detailed system logs or description..."
                    value={newTicket.description}
                    onChange={e => setNewTicket({ ...newTicket, description: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-theme-text-muted mb-3 block">Incident Priority</label>
                  <select
                    className="w-full bg-theme-surface-container border border-theme-border rounded-[1.5rem] p-5 text-sm font-black focus:ring-4 focus:ring-primary/20 focus:border-primary/50 outline-none transition-all appearance-none text-theme-text"
                    value={newTicket.priority}
                    onChange={e => setNewTicket({ ...newTicket, priority: e.target.value })}
                  >
                    <option value="low">Standard Maintenance (Low)</option>
                    <option value="medium">Degraded Performance (Medium)</option>
                    <option value="high">Critical System Failure (High)</option>
                  </select>
                </div>
              </div>

              <div className="p-8 pt-0 flex justify-end gap-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-8 py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] text-theme-text-muted hover:bg-theme-surface-container transition-colors"
                >
                  Abort
                </button>
                <button
                  onClick={handleCreateTicket}
                  disabled={!newTicket.subject}
                  className="px-8 py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] text-white primary-gradient shadow-lg shadow-primary/20 hover:shadow-primary/40 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-3 active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px]">send</span>
                  Inject Request
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        .animate-fade-in-up {
          animation: fadeInUp 0.5s ease forwards;
        }
        .animate-scale-in {
          animation: scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
