import React, { useState, useEffect } from 'react';
import { 
  Layers, User, LogOut, Settings, ChevronDown, 
  LogIn, X, Home, LayoutDashboard 
} from 'lucide-react';

const Navbar = ({ user, onSignOut, onLoginClick, onHomeClick, onDashboardClick }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Add scroll listener to change opacity of navbar on scroll
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <nav className={`fixed top-0 w-full px-6 py-4 md:px-12 flex justify-between items-center z-[100] transition-all duration-300 ${
        scrolled 
          ? 'bg-white/70 backdrop-blur-xl border-b border-slate-200 py-3' 
          : 'bg-transparent py-5'
      }`}>
        
        {/* Brand / Home Link */}
        <div 
          className="flex items-center gap-2 text-blue-600 font-bold text-2xl cursor-pointer hover:scale-105 transition-transform"
          onClick={onHomeClick}
        >
          <div className="p-1.5 bg-blue-600 rounded-lg shadow-blue-200 shadow-lg">
            <Layers className="w-6 h-6 text-white" />
          </div>
          <span className="text-slate-900 tracking-tight">FinFlow<span className="text-blue-600">.ai</span></span>
        </div>
        
        <div className="flex items-center gap-6">
          {/* Main Navigation Links */}
          <div className="hidden md:flex gap-8 text-[11px] font-bold text-slate-500 uppercase tracking-[0.15em]">
            <button onClick={onHomeClick} className="hover:text-blue-600 transition-colors flex items-center gap-2 group">
               Home
            </button>
            
            {user && (
              <button onClick={onDashboardClick} className="hover:text-blue-600 text-slate-800 transition-colors flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-500">
                Dashboard
              </button>
            )}
            
            <a href="#process" className="hover:text-blue-600 transition-colors">Pipeline</a>
          </div>

          {user ? (
            /* --- AUTHENTICATED PROFILE SECTION --- */
            <div className="relative">
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-3 px-3 py-1.5 bg-white border border-slate-200 rounded-full hover:shadow-md transition-all cursor-pointer group"
              >
                {user.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-8 h-8 rounded-full border border-blue-100" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-blue-600 border border-slate-200"><User size={16} /></div>
                )}
                <div className="hidden md:block text-left">
                  <p className="text-xs font-bold text-slate-900 leading-none">
                    {user.user_metadata?.full_name || "Aditya Gupta"}
                  </p>
                </div>
                <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-4 w-64 bg-white border border-slate-200 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-2 animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-4 py-3 border-b border-slate-50 mb-2">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Neural Identity</p>
                    <p className="text-sm text-slate-600 truncate font-medium">{user.email}</p>
                  </div>
                  <button onClick={() => { setIsSettingsOpen(true); setIsProfileOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 rounded-xl text-left group transition-colors">
                    <Settings size={18} className="text-slate-400 group-hover:text-blue-600" /> Profile Settings
                  </button>
                  <button onClick={() => { onSignOut(); setIsProfileOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 rounded-xl mt-1 text-left transition-colors font-medium">
                    <LogOut size={18} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={onLoginClick} className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-blue-600 transition-all duration-300 shadow-lg shadow-slate-200 cursor-pointer active:scale-95">
              <LogIn size={18} /> <span>Login</span>
            </button>
          )}
        </div>
      </nav>

      {/* --- PROFILE SETTINGS MODAL (Light Theme) --- */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/20 backdrop-blur-md p-4">
          <div className="bg-white w-full max-w-md border border-slate-200 rounded-[2.5rem] p-8 shadow-[0_40px_80px_rgba(0,0,0,0.15)] animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Neural Settings</h2>
              <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-900 transition-colors"><X size={24} /></button>
            </div>
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-3xl border border-slate-100">
                <img src={user?.user_metadata?.avatar_url} className="w-14 h-14 rounded-full border-2 border-white shadow-sm" alt="Avatar" />
                <div className="overflow-hidden">
                  <p className="font-bold text-slate-900 truncate text-lg">{user?.user_metadata?.full_name}</p>
                  <p className="text-sm text-slate-500 truncate">{user?.email}</p>
                </div>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-600 text-[10px] font-bold uppercase tracking-[0.2em] text-center">Verified AIML Student</div>
            </div>
            <button onClick={() => setIsSettingsOpen(false)} className="w-full mt-8 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-blue-600 transition-all shadow-xl shadow-slate-200">Save & Close</button>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;