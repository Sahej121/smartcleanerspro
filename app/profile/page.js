'use client';
import { useState } from 'react';
import { useUser } from '@/lib/UserContext';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function ProfilePage() {
  const { user, role } = useUser();
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    language: user?.language || 'en'
  });

  const handleSave = async (e) => {
    e.preventDefault();
    // Simulate API call
    setIsEditing(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-page-fade-in pb-12">
      {/* Hero Section */}
      <div className="relative h-48 lg:h-64 rounded-3xl overflow-hidden shadow-2xl shadow-primary/10">
        <div className="absolute inset-0 premium-gradient opacity-90"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
        <div className="absolute bottom-0 left-0 right-0 p-8 flex items-end gap-6 bg-gradient-to-t from-black/50 to-transparent">
          <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-3xl border-4 border-white/20 p-1 backdrop-blur-md shadow-2xl">
            <div className="w-full h-full rounded-2xl bg-white flex items-center justify-center text-primary text-4xl lg:text-5xl font-black shadow-inner">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
          </div>
          <div className="mb-2">
            <h1 className="text-3xl lg:text-4xl font-black text-white drop-shadow-md">{user?.name || 'User Profile'}</h1>
            <p className="text-white/80 font-bold flex items-center gap-2 mt-1">
              <span className="px-3 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] uppercase tracking-widest">{role}</span>
              <span className="text-sm">•</span>
              <span className="text-sm">{user?.email || 'sahej@smartcleaners.pro'}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Info Cards */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-theme-surface border border-theme-border rounded-3xl p-6 shadow-sm">
            <h3 className="text-xs font-black text-theme-text-muted uppercase tracking-widest mb-4">Account Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-theme-surface-container rounded-2xl">
                <div>
                  <p className="text-[10px] font-bold text-theme-text-muted uppercase">Orders</p>
                  <p className="text-xl font-black text-theme-text">128</p>
                </div>
                <span className="material-symbols-outlined text-primary bg-primary/10 p-2 rounded-xl">shopping_bag</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-theme-surface-container rounded-2xl">
                <div>
                  <p className="text-[10px] font-bold text-theme-text-muted uppercase">Loyalty Points</p>
                  <p className="text-xl font-black text-theme-text">2,450</p>
                </div>
                <span className="material-symbols-outlined text-amber-500 bg-amber-500/10 p-2 rounded-xl">stars</span>
              </div>
            </div>
          </div>

          <div className="bg-theme-surface border border-theme-border rounded-3xl p-6 shadow-sm">
            <h3 className="text-xs font-black text-theme-text-muted uppercase tracking-widest mb-4">Quick Links</h3>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-theme-surface-container transition-all text-sm font-bold text-theme-text">
                <span className="material-symbols-outlined text-primary">security</span>
                Security Settings
              </button>
              <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-theme-surface-container transition-all text-sm font-bold text-theme-text">
                <span className="material-symbols-outlined text-primary">history</span>
                Order History
              </button>
              <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-theme-surface-container transition-all text-sm font-bold text-theme-text">
                <span className="material-symbols-outlined text-primary">notifications</span>
                Notification Prefs
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Form */}
        <div className="lg:col-span-2">
          <div className="bg-theme-surface border border-theme-border rounded-3xl p-8 shadow-sm h-full">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-xl font-black text-theme-text">Account Settings</h2>
                <p className="text-xs text-theme-text-muted font-medium mt-1">Manage your personal information, security, and preferences.</p>
              </div>
              {!isEditing && (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary text-xs font-black hover:bg-primary/20 transition-all"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                  Edit Profile
                </button>
              )}
            </div>

            <form onSubmit={handleSave} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-theme-text-muted uppercase tracking-wider ml-1">Full Name</label>
                  <input 
                    type="text" 
                    disabled={!isEditing}
                    className="w-full bg-theme-surface-container border border-theme-border rounded-2xl px-4 py-3 text-sm font-bold text-theme-text outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-60"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-theme-text-muted uppercase tracking-wider ml-1">Email Address</label>
                  <input 
                    type="email" 
                    disabled={!isEditing}
                    className="w-full bg-theme-surface-container border border-theme-border rounded-2xl px-4 py-3 text-sm font-bold text-theme-text outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-60"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              {/* Security Section */}
              <div className="pt-6 border-t border-theme-border">
                <h3 className="text-sm font-black text-theme-text mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg text-primary">security</span>
                  Security & Password
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-theme-text-muted uppercase tracking-wider ml-1">Current Password</label>
                    <input 
                      type="password" 
                      disabled={!isEditing}
                      placeholder="••••••••"
                      className="w-full bg-theme-surface-container border border-theme-border rounded-2xl px-4 py-3 text-sm font-bold text-theme-text outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-60"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-theme-text-muted uppercase tracking-wider ml-1">New Password</label>
                    <input 
                      type="password" 
                      disabled={!isEditing}
                      placeholder="Enter new password"
                      className="w-full bg-theme-surface-container border border-theme-border rounded-2xl px-4 py-3 text-sm font-bold text-theme-text outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-60"
                    />
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="flex gap-4 pt-4 border-t border-theme-border">
                  <button 
                    type="submit"
                    className="px-8 py-3 rounded-2xl bg-primary text-white text-sm font-black hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
                  >
                    Save Changes
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-8 py-3 rounded-2xl bg-theme-surface-container text-theme-text text-sm font-black hover:bg-theme-border transition-all"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
