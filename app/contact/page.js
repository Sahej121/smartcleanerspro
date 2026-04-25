'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { fetchWithRetry } from '@/lib/fetchWithRetry';
import MarketingNavbar from '@/components/marketing/MarketingNavbar';
import MarketingFooter from '@/components/marketing/MarketingFooter';
import { Section } from '@/components/marketing/MarketingSection';

export default function ContactPage() {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    storeName: '',
    volume: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Optimistic Update: instantly show success
    setSubmitted(true);

    // Fire API silently in the background with retries
    fetchWithRetry('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
    .catch((err) => {
      // If retries completely fail, revert to explicit failure state
      setSubmitted(false);
      setError('Connection failed after multiple attempts. Please try again.');
    });
  };

  return (
    <div className="min-h-screen bg-[#f8faf9] selection:bg-emerald-500/30">
      <MarketingNavbar />
      
      <div className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          
          {/* Left Side: Info */}
          <div className="lg:col-span-5 space-y-12">
            <header>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full border border-emerald-100 mb-6 font-black text-[10px] uppercase tracking-widest text-emerald-700">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                Direct Access
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-slate-900 mb-6 font-headline leading-tight">
                Connect with our<br />
                <span className="text-emerald-700">Architects</span>
              </h1>
              <p className="text-lg text-slate-500 font-medium leading-relaxed">
                Whether you're scaling a multi-site operation or upgrading your facility's hardware, our team is ready to assist.
              </p>
            </header>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
              <article className="glass-panel-light p-8 rounded-[2.5rem] border border-white bg-white/40 shadow-xl shadow-slate-900/5">
                <h3 className="text-lg font-black text-slate-900">{t('get_started_today')}</h3>
                <p className="mt-3 text-sm text-slate-600">
                  {t('contact_setup_desc')}
                </p>
                <div className="mt-6 flex gap-3">
                  <Link href="/pricing" className="rounded-full px-6 py-3 text-xs font-black uppercase tracking-widest text-white primary-gradient shadow-lg">
                    {t('view_pricing')}
                  </Link>
                </div>
              </article>

              <article className="glass-panel-light p-8 rounded-[2.5rem] border border-white bg-white/40 shadow-xl shadow-slate-900/5">
                <h3 className="text-lg font-black text-slate-900">Direct Inquiries</h3>
                <p className="mt-3 text-sm text-slate-600">Specific requirements for Enterprise or Bulk hardware?</p>
                <ul className="mt-5 space-y-3 text-sm font-bold text-slate-500">
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-500 text-lg">mail</span>
                    sehajbudhiraja@yahoo.in
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-500 text-lg">public</span>
                    Global Deployment Available
                  </li>
                </ul>
              </article>
            </div>
          </div>

          {/* Right Side: Form */}
          <div className="lg:col-span-7">
            <div className={`glass-panel p-10 lg:p-14 rounded-[3.5rem] border border-white bg-white/60 shadow-2xl relative overflow-hidden ${submitted ? 'bg-emerald-50' : ''}`}>
              {submitted ? (
                <div className="text-center py-20 animate-in fade-in zoom-in duration-700">
                  <div className="w-20 h-20 bg-emerald-500 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-500/20">
                    <span className="material-symbols-outlined text-4xl">check_circle</span>
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 mb-4 uppercase tracking-tight">Inquiry Received</h2>
                  <p className="text-slate-500 font-medium max-w-sm mx-auto mb-10">
                    An Enterprise Architect has been assigned to your case and will reach out to <strong>{formData.email}</strong> within 24 hours.
                  </p>
                  <button 
                    onClick={() => setSubmitted(false)}
                    className="text-emerald-700 font-black text-xs uppercase tracking-widest hover:underline"
                  >
                    Send another inquiry
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-10">
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Enterprise Inquiry</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Scalable Framework Request</p>
                  </div>

                  {error && (
                    <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600">
                      <span className="material-symbols-outlined text-lg">error</span>
                      <p className="text-xs font-bold">{error}</p>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">Full Name</label>
                        <input 
                          type="text" 
                          required
                          className="w-full bg-white/80 border-none rounded-2xl py-4 px-6 text-sm font-bold shadow-inner focus:ring-2 focus:ring-emerald-500/20 transition-all"
                          value={formData.name}
                          onChange={e => setFormData({...formData, name: e.target.value})}
                          placeholder="George Blank"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">Professional Email</label>
                        <input 
                          type="email" 
                          required
                          className="w-full bg-white/80 border-none rounded-2xl py-4 px-6 text-sm font-bold shadow-inner focus:ring-2 focus:ring-emerald-500/20 transition-all"
                          value={formData.email}
                          onChange={e => setFormData({...formData, email: e.target.value})}
                          placeholder="george@atelier.io"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">Store / Brand Name</label>
                        <input 
                          type="text" 
                          className="w-full bg-white/80 border-none rounded-2xl py-4 px-6 text-sm font-bold shadow-inner focus:ring-2 focus:ring-emerald-500/20 transition-all"
                          value={formData.storeName}
                          onChange={e => setFormData({...formData, storeName: e.target.value})}
                          placeholder="The Pristine Collective"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">Monthly Volume</label>
                        <select 
                          className="w-full bg-white/80 border-none rounded-2xl py-4 px-6 text-sm font-bold shadow-inner focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none cursor-pointer"
                          value={formData.volume}
                          onChange={e => setFormData({...formData, volume: e.target.value})}
                        >
                          <option value="">Select volume...</option>
                          <option value="1-3">1-3 Multi-sites</option>
                          <option value="4-10">4-10 Multi-sites</option>
                          <option value="10+">10+ Global Locations</option>
                          <option value="factory">Industrial Factory</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">Specific Requirements</label>
                      <textarea 
                        className="w-full bg-white/80 border-none rounded-3xl py-6 px-6 text-sm font-bold shadow-inner focus:ring-2 focus:ring-emerald-500/20 transition-all min-h-[150px] resize-none"
                        value={formData.message}
                        onChange={e => setFormData({...formData, message: e.target.value})}
                        placeholder="Tell us about your technical requirements, hardware needs, or migration timeline..."
                      />
                    </div>

                    <button 
                      type="submit" 
                      disabled={loading}
                      className="w-full primary-gradient text-white py-6 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-emerald-900/10 hover:shadow-emerald-900/30 active:scale-95 transition-all overflow-hidden relative group"
                    >
                      <span className="relative z-10">{loading ? 'Submitting Inquiry...' : 'Initialize Enterprise Request'}</span>
                      <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[0%] transition-transform duration-500 skew-x-12"></div>
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>

        </div>
      </div>

      <MarketingFooter />
    </div>
  );
}
