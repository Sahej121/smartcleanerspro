'use client';
import { useState } from 'react';
import { useUser } from '@/lib/UserContext';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function ProfilePage() {
  const { user, role } = useUser();
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleSave = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: data.message || 'Profile updated successfully!' });
        setIsEditing(false);
        // Clear passwords
        setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
        // Reload page after a short delay to refresh user context
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update profile' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
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
              <span className="text-sm">{user?.email || 'user@example.com'}</span>
            </p>
          </div>
        </div>
      </div>

      {message.text && (
        <div className={`p-4 rounded-2xl font-bold flex items-center gap-3 animate-fade-in-up ${
          message.type === 'success' ? 'bg-emerald-50 border border-emerald-100 text-emerald-800' : 'bg-red-50 border border-red-100 text-red-800'
        }`}>
          <span className="material-symbols-outlined">{message.type === 'success' ? 'check_circle' : 'error'}</span>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Info Cards */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-theme-surface border border-theme-border rounded-3xl p-6 shadow-sm">
            <h3 className="text-xs font-black text-theme-text-muted uppercase tracking-widest mb-4">Account Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-theme-surface-container rounded-2xl">
                <div>
                  <p className="text-[10px] font-bold text-theme-text-muted uppercase">Status</p>
                  <p className="text-xl font-black text-emerald-600">Active</p>
                </div>
                <span className="material-symbols-outlined text-primary bg-primary/10 p-2 rounded-xl">verified_user</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-theme-surface-container rounded-2xl">
                <div>
                  <p className="text-[10px] font-bold text-theme-text-muted uppercase">Role</p>
                  <p className="text-xl font-black text-theme-text capitalize">{role}</p>
                </div>
                <span className="material-symbols-outlined text-amber-500 bg-amber-500/10 p-2 rounded-xl">shield</span>
              </div>
            </div>
          </div>

          <div className="bg-theme-surface border border-theme-border rounded-3xl p-6 shadow-sm">
            <h3 className="text-xs font-black text-theme-text-muted uppercase tracking-widest mb-4">Security</h3>
            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-theme-surface-container flex items-center gap-3">
                <span className="material-symbols-outlined text-emerald-500">lock</span>
                <span className="text-xs font-bold text-theme-text">Password set</span>
              </div>
              <div className="p-3 rounded-xl bg-theme-surface-container flex items-center gap-3">
                <span className="material-symbols-outlined text-emerald-500">mail</span>
                <span className="text-xs font-bold text-theme-text">Email verified</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Form */}
        <div className="lg:col-span-2">
          <div className="bg-theme-surface border border-theme-border rounded-3xl p-8 shadow-sm h-full">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-xl font-black text-theme-text">Account Settings</h2>
                <p className="text-xs text-theme-text-muted font-medium mt-1">Manage your personal information and security.</p>
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
                    required
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
                    required
                  />
                </div>
              </div>

              {/* Security Section */}
              <div className="pt-6 border-t border-theme-border">
                <h3 className="text-sm font-black text-theme-text mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg text-primary">security</span>
                  Change Password
                </h3>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-theme-text-muted uppercase tracking-wider ml-1">Current Password</label>
                    <input 
                      type="password" 
                      disabled={!isEditing}
                      placeholder="Required to change password"
                      className="w-full bg-theme-surface-container border border-theme-border rounded-2xl px-4 py-3 text-sm font-bold text-theme-text outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-60"
                      value={formData.currentPassword}
                      onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-theme-text-muted uppercase tracking-wider ml-1">New Password</label>
                      <input 
                        type="password" 
                        disabled={!isEditing}
                        placeholder="Min 8 characters"
                        className="w-full bg-theme-surface-container border border-theme-border rounded-2xl px-4 py-3 text-sm font-bold text-theme-text outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-60"
                        value={formData.newPassword}
                        onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-theme-text-muted uppercase tracking-wider ml-1">Confirm New Password</label>
                      <input 
                        type="password" 
                        disabled={!isEditing}
                        placeholder="Repeat new password"
                        className="w-full bg-theme-surface-container border border-theme-border rounded-2xl px-4 py-3 text-sm font-bold text-theme-text outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-60"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="flex gap-4 pt-4 border-t border-theme-border">
                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="px-8 py-3 rounded-2xl bg-primary text-white text-sm font-black hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        name: user?.name || '',
                        email: user?.email || '',
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                      });
                      setMessage({ type: '', text: '' });
                    }}
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

