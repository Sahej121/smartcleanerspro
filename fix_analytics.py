import re

file_path = '/Users/sahej/dry_cleaners/app/admin/analytics/staff/page.js'

with open(file_path, 'r') as f:
    c = f.read()

# Replace backgrounds and borders
c = c.replace('bg-white/70 backdrop-blur-xl', 'bg-theme-surface hover:bg-theme-surface-container transition-all')
c = c.replace('border-white', 'border-theme-border/50 hover:border-theme-border')
c = c.replace('shadow-xl shadow-slate-200/50', 'shadow-sm')
c = c.replace('shadow-2xl shadow-emerald-900/20', 'shadow-sm')
c = c.replace('shadow-xl shadow-slate-200/60', 'shadow-sm')

# Strip crazy glows
c = re.sub(r'<div className="absolute [^>]+blur-[^>]+></div>', '', c)

# Replace emerald-950 text with theme-text
c = c.replace('text-emerald-950', 'text-theme-text')
c = c.replace('text-emerald-900', 'text-theme-text')
c = c.replace('bg-emerald-950 text-white', 'bg-theme-surface-container text-theme-text border border-theme-border/50')
c = c.replace('text-emerald-400/70', 'text-theme-text-muted')

# Replace white and slate text
c = c.replace('text-slate-500', 'text-theme-text-muted')
c = c.replace('text-slate-400', 'text-theme-text-muted')
c = c.replace('text-slate-800', 'text-theme-text')

# Summary blocks and pills
c = c.replace('bg-white/50 backdrop-blur-md text-emerald-700 px-4 py-2 rounded-2xl border border-emerald-100/50', 'bg-theme-surface-container/50 text-theme-text-muted px-4 py-2 rounded-2xl border border-theme-border/50')
c = c.replace('bg-emerald-50 text-emerald-500', 'bg-theme-surface-container text-primary border-theme-border')
c = c.replace('bg-slate-50 text-slate-400', 'bg-theme-surface-container text-theme-text-muted border-theme-border')

c = c.replace('bg-emerald-50 w-fit px-3 py-1 rounded-full border border-emerald-100 text-emerald-600', 'bg-theme-surface-container w-fit px-3 py-1 rounded-full border border-theme-border text-primary')
c = c.replace('bg-emerald-50', 'bg-theme-surface-container/50 text-theme-text')
c = c.replace('border-emerald-100', 'border-theme-border/50')
c = c.replace('text-emerald-700', 'text-primary')
c = c.replace('text-emerald-600', 'text-primary')
c = c.replace('bg-slate-100', 'bg-theme-surface-container')

# Trend pill fix specifically for throughput trend
c = c.replace('text-[10px] font-black text-emerald-600 mt-4 flex items-center gap-2 bg-emerald-50 w-fit px-3 py-1 rounded-full border border-emerald-100', 'text-[10px] font-black text-primary mt-4 flex items-center gap-2 bg-theme-surface-container/50 w-fit px-3 py-1 rounded-full border border-theme-border/50')

# Table specific resets
c = c.replace('hover:bg-emerald-50/40', 'hover:bg-theme-surface-container')
c = c.replace('bg-slate-50/50', 'bg-theme-surface-container/30')
c = c.replace('bg-gradient-to-tr from-emerald-100 to-white', 'bg-theme-surface-container text-primary')
c = c.replace('bg-white border border-slate-100', 'bg-theme-surface-container border border-theme-border/50 text-theme-text-muted')

with open(file_path, 'w') as f:
    f.write(c)

print('Done')
