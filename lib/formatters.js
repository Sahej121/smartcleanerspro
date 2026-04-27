/**
 * Shared utility functions for the SmartCleanersPro POS
 */

export const formatCurrency = (val, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0
  }).format(val || 0);
};

export const formatDate = (d, type = 'short') => {
  if (!d) return '—';
  const date = new Date(d);
  if (type === 'time') {
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('en-IN', { 
    day: 'numeric', 
    month: type === 'long' ? 'long' : 'short',
    year: type === 'long' ? 'numeric' : undefined
  });
};

export const getStatusColor = (status) => {
  const map = {
    'received': 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    'sorting': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    'washing': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    'dry_cleaning': 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    'drying': 'bg-sky-500/10 text-sky-600 border-sky-500/20',
    'ironing': 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
    'quality_check': 'bg-teal-500/10 text-teal-600 border-teal-500/20',
    'ready': 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    'delivered': 'bg-slate-100 text-slate-500 border-slate-200',
    'cancelled': 'bg-red-500/10 text-red-600 border-red-500/20'
  };
  return map[status] || 'bg-slate-100 text-slate-400 border-slate-200';
};

export const getTimeAgo = (date) => {
  if (!date) return '';
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "m ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  return Math.floor(seconds) + "s ago";
};
