'use client';

import React from 'react';

export default function PaymentSection({
  total,
  payments,
  setPayments,
  payAtPickup,
  setPayAtPickup,
  selectedCustomer,
  redeemedPoints,
  setRedeemedPoints,
  totalRaw,
  submitting,
  handleSubmitOrder,
  setCurrentStep,
  t
}) {
  const balanceDue = total - payments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);

  return (
    <div className="flex-1 flex flex-col items-center justify-center animate-fade-in-up">
      <div className="w-full max-w-2xl bg-theme-surface rounded-[2rem] p-8 shadow-xl border border-theme-border/50 card-hover overflow-y-auto max-h-[90vh] no-scrollbar">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-theme-surface-container text-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">payments</span>
            </div>
            <h2 className="text-2xl font-black font-headline text-theme-text">Payment Settlement</h2>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-theme-text-muted/70 uppercase tracking-widest">Balance Due</p>
            <div className="text-3xl font-black text-theme-text font-headline">
              ₹{balanceDue.toLocaleString('en-IN')}
            </div>
          </div>
        </div>
        {/* Pay at Pickup Toggle */}
        <label className="flex items-center justify-between p-4 bg-theme-surface-container rounded-2xl cursor-pointer mb-6 group hover:bg-theme-surface-container transition-colors">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-theme-text-muted/70 group-hover:text-emerald-600">directions_run</span>
            <span className="text-sm font-bold text-theme-text">Pay at Collection</span>
          </div>
          <input 
            type="checkbox" 
            className="w-5 h-5 accent-emerald-600"
            checked={payAtPickup}
            onChange={(e) => {
              setPayAtPickup(e.target.checked);
              if (e.target.checked) setPayments([]);
            }}
          />
        </label>

        {selectedCustomer?.loyalty_points > 0 && (
          <div className="mb-6 p-5 bg-amber-50 rounded-2xl border border-amber-100 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-600">stars</span>
                <span className="text-xs font-black uppercase tracking-widest text-amber-900">Loyalty Rewards</span>
              </div>
              <span className="text-xs font-bold text-amber-700">{selectedCustomer.loyalty_points} Points Available</span>
            </div>
            <div className="flex items-center gap-4">
              <input 
                type="range" 
                min="0" 
                max={Math.min(selectedCustomer.loyalty_points, totalRaw)}
                value={redeemedPoints}
                onChange={(e) => setRedeemedPoints(parseInt(e.target.value))}
                className="flex-1 h-2 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
              />
              <div className="w-20 text-right">
                <span className="text-sm font-black text-amber-900">₹{redeemedPoints}</span>
              </div>
            </div>
            <p className="text-[10px] font-medium text-amber-600 mt-2 italic">1 point = ₹1 discount. Points will be deducted upon confirmation.</p>
          </div>
        )}

        {!payAtPickup && (
          <div className="space-y-6">
            {/* Active Payments */}
            {payments.map((p, idx) => (
              <div key={idx} className="p-5 rounded-2xl border-2 border-emerald-500 bg-theme-surface-container/30 animate-scale-in">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-600 text-lg">
                      {p.method === 'cash' ? 'payments' : p.method === 'card' ? 'credit_card' : 'qr_code_scanner'}
                    </span>
                    <span className="text-xs font-black uppercase tracking-widest text-theme-text">{p.method}</span>
                  </div>
                  <button onClick={() => setPayments(payments.filter((_, i) => i !== idx))} className="text-theme-text-muted/70 hover:text-red-500 transition-colors">
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black uppercase text-theme-text-muted/70 tracking-wider block mb-1">Amount to Charge</label>
                    <input 
                      type="number" 
                      className="w-full bg-theme-surface border border-theme-border rounded-xl p-3 text-sm font-black text-theme-text outline-none"
                      value={p.amount}
                      onChange={(e) => {
                        const newPayments = [...payments];
                        newPayments[idx].amount = e.target.value;
                        setPayments(newPayments);
                      }}
                    />
                  </div>
                  {p.method === 'cash' && (
                    <div>
                      <label className="text-[9px] font-black uppercase text-theme-text-muted/70 tracking-wider block mb-1">Tendered</label>
                      <input 
                        type="number" 
                        className="w-full bg-theme-surface border border-theme-border rounded-xl p-3 text-sm font-black text-theme-text outline-none"
                        placeholder="Enter amount..."
                        value={p.tendered || ''}
                        onChange={(e) => {
                          const newPayments = [...payments];
                          newPayments[idx].tendered = e.target.value;
                          setPayments(newPayments);
                        }}
                      />
                    </div>
                  )}
                </div>
                {p.method === 'cash' && p.tendered > p.amount && (
                  <div className="mt-4 pt-4 border-t border-theme-border flex justify-between items-center">
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Return Change</span>
                    <span className="text-lg font-black text-theme-text">₹{(p.tendered - p.amount).toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>
            ))}

            {/* Add Payment Method */}
            <div className="grid grid-cols-3 gap-3">
              {['cash', 'card', 'online'].map(m => (
                <button 
                  key={m}
                  disabled={payments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0) >= total}
                  onClick={() => {
                    const remaining = total - payments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);
                    setPayments([...payments, { method: m, amount: remaining > 0 ? remaining : 0 }]);
                  }}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-theme-border bg-theme-surface hover:border-theme-border hover:bg-theme-surface-container transition-all group disabled:opacity-30"
                >
                  <span className="material-symbols-outlined text-theme-text-muted/70 group-hover:text-emerald-600">
                    {m === 'cash' ? 'payments' : m === 'card' ? 'credit_card' : 'qr_code_scanner'}
                  </span>
                  <span className="text-[10px] font-bold uppercase text-theme-text-muted/70 group-hover:text-theme-text">{m}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-4 pt-8 mt-8 border-t border-theme-border">
          <button 
            onClick={() => setCurrentStep(3)} 
            disabled={submitting}
            className="px-8 py-4 rounded-2xl bg-theme-surface border border-theme-border font-bold text-theme-text-muted hover:bg-theme-surface-container transition-colors disabled:opacity-50"
          >
            Back
          </button>
          <button 
            onClick={() => handleSubmitOrder()} 
            disabled={submitting || (!payAtPickup && payments.length === 0)} 
            className="flex-1 px-8 py-4 rounded-2xl primary-gradient text-white font-black shadow-xl shadow-emerald-900/10 active:scale-95 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
            ) : (
              <>
                <span className="material-symbols-outlined text-xl">verified_user</span>
                {payAtPickup ? 'Create Order (Pending)' : 'Finalize & Post Payment'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
