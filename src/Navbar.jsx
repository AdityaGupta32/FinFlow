import React, { useState } from 'react';
// Optimized single import for all icons
import { 
  Layers, User, LogOut, Settings, ChevronDown, 
  LogIn, X, Home, LayoutDashboard 
} from 'lucide-react';

const Navbar = ({ user, onSignOut, onLoginClick, onHomeClick, onDashboardClick }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 w-full px-6 py-4 md:px-12 flex justify-between items-center z-[100] backdrop-blur-xl bg-fintech-primary/80 border-b border-white/5">
        {/* Brand / Home Link */}
        <div 
          className="flex items-center gap-2 text-fintech-accent font-bold text-2xl cursor-pointer hover:scale-105 transition-transform"
          onClick={onHomeClick}
        >
          <Layers className="w-8 h-8" />
          <span>FinFlow<span className="text-white">.ai</span></span>
        </div>
        
        <div className="flex items-center gap-6">
          {/* Main Navigation Links */}
          <div className="hidden md:flex gap-6 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
            <button onClick={onHomeClick} className="hover:text-white transition-colors flex items-center gap-2 group">
              <Home size={14} className="group-hover:text-fintech-accent transition-colors" /> Home
            </button>
            
            {/* Dashboard link appears only if authenticated */}
            {user && (
              <button onClick={onDashboardClick} className="hover:text-fintech-accent text-fintech-accent transition-colors flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-500">
                <LayoutDashboard size={14} /> Dashboard
              </button>
            )}
            
            <a href="#process" className="hover:text-white transition-colors">Pipeline</a>
          </div>

          {user ? (
            /* --- AUTHENTICATED PROFILE SECTION --- */
            <div className="relative">
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-3 px-3 py-2 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all cursor-pointer group"
              >
                {user.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-8 h-8 rounded-full border border-fintech-accent/30" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-fintech-accent/20 flex items-center justify-center text-fintech-accent border border-fintech-accent/30"><User size={18} /></div>
                )}
                <div className="hidden md:block text-left">
                  <p className="text-xs font-black text-white leading-none">
                    {user.user_metadata?.full_name || "Aditya Gupta"}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1 uppercase font-bold tracking-tighter">B.Tech AIML</p>
                </div>
                <ChevronDown size={14} className={`text-gray-500 transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-4 w-64 bg-fintech-card border border-white/10 rounded-2xl shadow-2xl p-2 animate-in fade-in zoom-in duration-200">
                  <div className="px-4 py-3 border-b border-white/5 mb-2">
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Neural Identity</p>
                    <p className="text-sm text-gray-300 truncate font-medium">{user.email}</p>
                  </div>
                  <button onClick={() => { setIsSettingsOpen(true); setIsProfileOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-white/5 rounded-xl text-left group transition-colors">
                    <Settings size={18} className="text-gray-500 group-hover:text-fintech-accent" /> Profile Settings
                  </button>
                  <button onClick={() => { onSignOut(); setIsProfileOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 rounded-xl mt-1 text-left transition-colors">
                    <LogOut size={18} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={onLoginClick} className="flex items-center gap-2 px-6 py-2.5 bg-white text-fintech-primary font-bold rounded-xl hover:bg-fintech-accent transition-all duration-300 shadow-lg shadow-white/5 cursor-pointer active:scale-95">
              <LogIn size={18} /> <span>Login</span>
            </button>
          )}
        </div>
      </nav>

      {/* --- PROFILE SETTINGS MODAL --- */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-fintech-primary/80 backdrop-blur-sm p-4">
          <div className="bg-fintech-card w-full max-w-md border border-white/10 rounded-3xl p-8 shadow-2xl animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Neural Settings</h2>
              <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors"><X size={24} /></button>
            </div>
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                <img src={user?.user_metadata?.avatar_url} className="w-12 h-12 rounded-full border border-fintech-accent/20" alt="Avatar" />
                <div className="overflow-hidden">
                  <p className="font-bold text-white truncate">{user?.user_metadata?.full_name}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
              </div>
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-bold uppercase tracking-widest text-center">Verified AIML Student</div>
            </div>
            <button onClick={() => setIsSettingsOpen(false)} className="w-full mt-8 py-4 bg-fintech-accent text-fintech-primary font-black rounded-xl hover:bg-white transition-all">Close Settings</button>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;