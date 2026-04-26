'use client';

export default function DuplicateWarningModal({ isOpen, onConfirm, onCancel, data, t }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-on-surface/40 backdrop-blur-md animate-fade-in">
      <div className="bg-theme-surface rounded-[2.5rem] p-8 max-w-sm w-full mx-4 shadow-2xl border border-amber-100 animate-scale-in">
        <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-4xl">warning</span>
        </div>
        <h3 className="text-xl font-black text-center text-theme-text mb-2">Duplicate Detected</h3>
        <p className="text-sm text-center text-theme-text-muted mb-8 px-2">
          An order for this customer was created less than 5 minutes ago. Are you sure you want to create another one?
        </p>
        <div className="flex flex-col gap-3">
          <button 
            onClick={() => onConfirm(true)}
            className="w-full py-4 bg-amber-500 text-white rounded-2xl font-black text-sm shadow-lg shadow-amber-200 active:scale-95 transition-all"
          >
            Yes, Create Anyway
          </button>
          <button 
            onClick={onCancel}
            className="w-full py-4 bg-theme-surface-container text-theme-text-muted rounded-2xl font-bold text-sm hover:bg-slate-200 active:scale-95 transition-all"
          >
            No, Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
