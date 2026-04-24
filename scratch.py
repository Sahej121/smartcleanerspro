import re

with open('app/operations/assembly/page.js', 'r') as f:
    content = f.read()

# Fix isPro check
content = content.replace(
    "const isPro = user?.tier === 'pro' || user?.role === 'owner';",
    "const isPro = user?.role === 'owner' || hasFeature(user?.tier, 'assemblyWorkflow');"
)

# Replace light mode colors with theme-aware ones
mapping = {
    r'\bbg-slate-50\b': 'bg-background',
    r'\bbg-white\b': 'bg-surface',
    r'\bbg-slate-100\b': 'bg-theme-surface-container',
    r'\btext-slate-900\b': 'text-theme-text',
    r'\btext-slate-800\b': 'text-theme-text',
    r'\btext-slate-700\b': 'text-theme-text',
    r'\btext-slate-600\b': 'text-theme-text-muted',
    r'\btext-slate-500\b': 'text-theme-text-muted',
    r'\btext-slate-400\b': 'text-theme-text-muted',
    r'\bborder-slate-200\b': 'border-theme-border',
    r'\bborder-slate-300\b': 'border-theme-border',
}

for k, v in mapping.items():
    content = re.sub(k, v, content)

with open('app/operations/assembly/page.js', 'w') as f:
    f.write(content)
print("done")
