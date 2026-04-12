const fs = require('fs');

let content = fs.readFileSync('app/operations/assembly/page.js', 'utf8');

// Also fix the isPro check
content = content.replace(
  "const isPro = user?.tier === 'pro' || user?.role === 'owner';",
  "const isPro = user?.role === 'owner' || hasFeature(user?.tier, 'assemblyWorkflow');"
);

// Map common classes
const classMap = {
  'bg-slate-50': 'bg-background',
  'bg-white': 'bg-surface',
  'text-slate-900': 'text-theme-text',
  'text-slate-800': 'text-theme-text',
  'text-slate-700': 'text-theme-text',
  'text-slate-600': 'text-theme-text-muted',
  'text-slate-500': 'text-theme-text-muted',
  'text-slate-400': 'text-theme-text-muted',
  'border-slate-200': 'border-theme-border',
  'border-slate-300': 'border-theme-border',
  'bg-slate-100': 'bg-surface-container',
};

// Only replace classes that appear in className="" or template literals
// Specifically searching for full word matches for these Tailwind classes
for (const [key, value] of Object.entries(classMap)) {
  const regex = new RegExp(`\\b${key}\\b`, 'g');
  content = content.replace(regex, value);
}

// Special tweaks: 
// 1. In 'return ( <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8"> )'
// 2. In 'return ( <div id="assembly-workflow-page" className="min-h-screen bg-background text-theme-text p-4 ...'
// The regex handles this!

fs.writeFileSync('app/operations/assembly/page.js', content, 'utf8');
console.log('Refactored app/operations/assembly/page.js');
