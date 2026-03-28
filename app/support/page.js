'use client';

import { useState, useEffect } from 'react';

export default function SupportPage() {
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
    { title: 'POS Operations', icon: 'point_of_sale', desc: 'Processing orders, payments, and adjusting transactions.', color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { title: 'Setup & Hardware', icon: 'print', desc: 'Connecting thermal printers, barcode scanners, and scales.', color: 'text-emerald-700', bg: 'bg-emerald-50' },
    { title: 'Account & Billing', icon: 'credit_card', desc: 'Managing subscriptions, invoices, and billing preferences.', color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Garment Care Directory', icon: 'styler', desc: 'Best practices for treating specific fabrics and stains.', color: 'text-amber-700', bg: 'bg-amber-50' },
    { title: 'Staff Management', icon: 'badge', desc: 'Adding roles, managing PIN codes, and tracking hours.', color: 'text-purple-600', bg: 'bg-purple-50' },
    { title: 'Reporting & Analytics', icon: 'monitoring', desc: 'Exporting EOFY reports, sales tracking, and insights.', color: 'text-rose-600', bg: 'bg-rose-50' }
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
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6 lg:space-y-10 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface mb-2 font-headline">Support Center</h1>
          <p className="text-on-surface-variant font-medium text-lg">Help documentation, guides, and concierge services.</p>
        </div>
      </div>

      {/* Hero Search Section */}
      <div className="bg-[#0b1c20] rounded-[2rem] lg:rounded-[2.5rem] p-8 lg:p-12 relative overflow-hidden flex flex-col items-center text-center shadow-xl shadow-emerald-900/10 animate-fade-in-up stagger-1">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-300/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4"></div>

        <div className="relative z-10 max-w-2xl w-full">
          <h2 className="text-3xl font-black text-white font-headline mb-4 tracking-tight">How can we assist you today?</h2>
          <p className="text-emerald-50 text-sm font-medium mb-8">Search our extensive knowledge base for instantaneous answers.</p>
          
          <div className="relative w-full group">
            <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 text-2xl z-20">search</span>
            <input
              type="text"
              placeholder="e.g. 'How to connect the receipt printer'"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white rounded-3xl py-5 pl-16 pr-8 text-base font-bold placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/30 text-on-surface shadow-2xl transition-all"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
        
        {/* Left Col: Topics Grid */}
        <div className="lg:col-span-2 space-y-8 animate-fade-in-up stagger-2">
          <h3 className="text-xl font-bold text-on-surface font-headline px-2">Knowledge Base Topics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {helpTopics.map((topic, i) => (
              <div key={i} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-100 transition-all cursor-pointer group flex gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${topic.bg} ${topic.color} group-hover:scale-110 group-hover:-rotate-3 transition-transform`}>
                  <span className="material-symbols-outlined text-2xl">{topic.icon}</span>
                </div>
                <div>
                  <h4 className="text-base font-bold text-on-surface mb-1 group-hover:text-emerald-700 transition-colors">{topic.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">{topic.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Tickets & Contact */}
        <div className="lg:col-span-1 space-y-8 animate-fade-in-up stagger-3">
          
          {/* Contact Concierge */}
          <div className="primary-gradient rounded-3xl p-8 text-white shadow-xl shadow-emerald-900/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl translate-x-4 -translate-y-8 group-hover:scale-150 transition-transform duration-700"></div>
            <div className="relative z-10">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>support_agent</span>
              </div>
              <h3 className="text-xl font-black font-headline mb-2">Atelier Concierge</h3>
              <p className="text-emerald-50 text-xs font-medium mb-6 leading-relaxed">
                Need specialized assistance? Connect with your dedicated support specialist directly.
              </p>
              <button className="w-full bg-white text-emerald-800 py-3.5 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-lg">chat_bubble</span>
                Start Live Chat
              </button>
            </div>
          </div>

          {/* Recent Tickets */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-5">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Recent Tickets</h3>
              <button
                onClick={() => setShowCreateModal(true)}
                className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors"
              >
                 <span className="material-symbols-outlined text-[16px]">add</span>
              </button>
            </div>
            
            <div className="space-y-4">
              {loadingTickets ? (
                <div className="text-center py-4">
                  <div className="w-6 h-6 rounded-full border-3 border-emerald-100 border-t-emerald-600 animate-spin mx-auto mb-2"></div>
                  <p className="text-xs text-slate-400">Loading...</p>
                </div>
              ) : tickets.length > 0 ? (
                tickets.slice(0, 5).map((ticket, i) => (
                  <div key={ticket.id} className="p-4 rounded-2xl bg-surface-container-lowest border border-slate-50 hover:border-emerald-100 transition-colors cursor-pointer group">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-black tracking-widest text-emerald-700">TKT-{ticket.id}</span>
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                        ticket.status === 'resolved' || ticket.status === 'closed' ? 'bg-slate-100 text-slate-500' : 
                        ticket.status === 'open' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {getStatusLabel(ticket.status)}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-on-surface mb-2 leading-snug group-hover:text-emerald-700 transition-colors">{ticket.subject}</h4>
                    <p className="text-[10px] uppercase font-bold text-slate-400">{formatDate(ticket.created_at)}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">No tickets yet</p>
              )}
            </div>
            
            <button className="w-full py-3 text-xs font-bold text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors mt-2">
              View Ticket History
            </button>
          </div>

        </div>
      </div>

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-surface-container-lowest rounded-[2rem] w-[95%] sm:w-full max-w-md shadow-2xl border border-outline-variant/20 overflow-hidden animate-fade-in-up">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <span className="material-symbols-outlined">confirmation_number</span>
                </div>
                <div>
                  <h3 className="font-extrabold text-on-surface text-lg">New Ticket</h3>
                  <p className="text-xs font-medium text-slate-500">Describe your issue below.</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200/50 text-slate-400 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1 block">Subject</label>
                <input
                  type="text"
                  autoFocus
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all placeholder:text-slate-300"
                  placeholder="Brief summary of the issue"
                  value={newTicket.subject}
                  onChange={e => setNewTicket({ ...newTicket, subject: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1 block">Description</label>
                <textarea
                  rows={3}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all placeholder:text-slate-300 resize-none"
                  placeholder="Detailed description..."
                  value={newTicket.description}
                  onChange={e => setNewTicket({ ...newTicket, description: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1 block">Priority</label>
                <select
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all appearance-none"
                  value={newTicket.priority}
                  onChange={e => setNewTicket({ ...newTicket, priority: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-200/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTicket}
                disabled={!newTicket.subject}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white primary-gradient shadow-md shadow-primary/20 hover:shadow-lg disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">send</span>
                Submit Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
