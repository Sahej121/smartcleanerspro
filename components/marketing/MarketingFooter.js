import Link from 'next/link';

export default function MarketingFooter() {
  return (
    <footer className="border-t border-emerald-100 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <h3 className="text-xl font-black text-slate-900">DrycleanersFlow</h3>
          <p className="mt-3 max-w-md text-sm text-slate-600">
            Run dry cleaning operations, logistics, and customer lifecycle from one platform with role-based access and real-time visibility.
          </p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Platform</p>
          <div className="mt-3 flex flex-col gap-2 text-sm">
            <Link href="/features" className="text-slate-700 hover:text-emerald-700">Features</Link>
            <Link href="/how-it-works" className="text-slate-700 hover:text-emerald-700">How it Works</Link>
            <Link href="/pricing" className="text-slate-700 hover:text-emerald-700">Pricing</Link>
            <Link href="/contact" className="text-slate-700 hover:text-emerald-700">Contact</Link>
            <Link href="/policy" className="text-slate-700 hover:text-emerald-700">Policy</Link>
          </div>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Access</p>
          <div className="mt-3 flex flex-col gap-2 text-sm">
            <Link href="/login" className="text-slate-700 hover:text-emerald-700">Login</Link>
            <Link href="/signup" className="text-slate-700 hover:text-emerald-700">Create account</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-emerald-100/80 px-6 py-4 text-center text-xs font-semibold text-slate-500">
        © {new Date().getFullYear()} DrycleanersFlow. Built for modern ateliers.
      </div>
    </footer>
  );
}
