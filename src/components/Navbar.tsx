import React from 'react';
import { Home, MessageCircleHeart, PhoneCall, Settings, Moon, Sun } from 'lucide-react';
import { AppTab } from '../types';

interface NavbarProps {
  currentTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  isCallActive?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  theme,
  onToggleTheme,
  isCallActive = false,
}) => {
  return (
    <>
      {/* Top Header */}
      <header
        id="app-top-header"
        className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors ${
          theme === 'dark'
            ? 'bg-[#0a0a0b]/85 border-[#27272a] text-[#e2e2e7]'
            : 'bg-white/85 border-neutral-200 text-neutral-800'
        }`}
      >
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div
            id="brand-logo-btn"
            onClick={() => onTabChange('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="relative">
              <img
                src="/naima_avatar.jpg"
                alt="Naima"
                className={`w-10 h-10 rounded-full object-cover border-2 shadow-sm transition-colors ${
                  theme === 'dark'
                    ? 'border-[#d4af37]/50 group-hover:border-[#d4af37]'
                    : 'border-rose-500'
                }`}
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0a0a0b]"></span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-lg tracking-widest font-serif italic font-bold transition-colors ${
                  theme === 'dark' ? 'text-[#d4af37]' : 'text-rose-600'
                }`}>
                  NAIMA
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                  theme === 'dark'
                    ? 'bg-[#1c1c21] text-[#d4af37] border-[#d4af37]/30'
                    : 'bg-rose-50 text-rose-600 border-rose-200'
                }`}>
                  নাইমা · 22
                </span>
              </div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#71717a] flex items-center gap-1.5 font-medium mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Personal AI Companion · Online</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Direct Quick Call shortcut button in header */}
            <button
              id="header-quick-call-btn"
              onClick={() => onTabChange('call')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                isCallActive
                  ? 'bg-emerald-600 text-white hover:bg-emerald-500 animate-pulse shadow-lg'
                  : theme === 'dark'
                  ? 'bg-[#d4af37] hover:bg-[#c49f27] text-[#0a0a0b] shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:shadow-[0_0_20px_rgba(212,175,55,0.45)]'
                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow'
              }`}
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>{isCallActive ? 'In Call' : 'Call Naima'}</span>
            </button>

            {/* Theme Toggle */}
            <button
              id="theme-toggle-btn"
              onClick={onToggleTheme}
              aria-label="Toggle Theme"
              className={`p-2 rounded-full border transition-colors cursor-pointer ${
                theme === 'dark'
                  ? 'bg-[#1c1c21] border-[#27272a] text-[#d4af37] hover:bg-[#27272a]'
                  : 'bg-neutral-100 border-neutral-200 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Bottom Floating Navigation for Mobile & Desktop */}
      <nav
        id="app-bottom-nav"
        className={`fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-lg transition-colors ${
          theme === 'dark'
            ? 'bg-[#0f0f12]/95 border-[#27272a] text-[#a1a1aa]'
            : 'bg-white/95 border-neutral-200 text-neutral-600'
        }`}
      >
        <div className="max-w-md mx-auto px-6 h-16 flex items-center justify-around">
          <button
            id="nav-tab-home"
            onClick={() => onTabChange('home')}
            className={`flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              currentTab === 'home'
                ? theme === 'dark'
                  ? 'text-[#d4af37] font-semibold scale-105'
                  : 'text-rose-600 font-semibold scale-105'
                : 'hover:text-white opacity-80'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[11px] font-medium">Home</span>
            {currentTab === 'home' && (
              <span className={`w-1 h-1 rounded-full ${theme === 'dark' ? 'bg-[#d4af37]' : 'bg-rose-600'}`}></span>
            )}
          </button>

          <button
            id="nav-tab-chat"
            onClick={() => onTabChange('chat')}
            className={`flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              currentTab === 'chat'
                ? theme === 'dark'
                  ? 'text-[#d4af37] font-semibold scale-105'
                  : 'text-rose-600 font-semibold scale-105'
                : 'hover:text-white opacity-80'
            }`}
          >
            <MessageCircleHeart className="w-5 h-5" />
            <span className="text-[11px] font-medium">Chat</span>
            {currentTab === 'chat' && (
              <span className={`w-1 h-1 rounded-full ${theme === 'dark' ? 'bg-[#d4af37]' : 'bg-rose-600'}`}></span>
            )}
          </button>

          {/* Center Call Tab with distinctive badge */}
          <button
            id="nav-tab-call"
            onClick={() => onTabChange('call')}
            className={`flex flex-col items-center justify-center -mt-5 transition-all cursor-pointer ${
              currentTab === 'call' ? 'scale-110' : 'hover:scale-105'
            }`}
          >
            <div
              className={`w-13 h-13 rounded-full flex items-center justify-center shadow-lg transition-all ${
                isCallActive
                  ? 'bg-emerald-500 text-white shadow-emerald-500/40 animate-pulse'
                  : theme === 'dark'
                  ? 'bg-[#d4af37] text-[#0a0a0b] hover:bg-[#c49f27] shadow-[0_0_18px_rgba(212,175,55,0.35)]'
                  : 'bg-rose-600 text-white shadow-rose-500/40'
              }`}
            >
              <PhoneCall className="w-5 h-5" />
            </div>
            <span
              className={`text-[10px] mt-1 font-semibold ${
                currentTab === 'call'
                  ? theme === 'dark'
                    ? 'text-[#d4af37]'
                    : 'text-rose-600'
                  : 'text-[#71717a]'
              }`}
            >
              Voice Call
            </span>
          </button>

          <button
            id="nav-tab-settings"
            onClick={() => onTabChange('settings')}
            className={`flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              currentTab === 'settings'
                ? theme === 'dark'
                  ? 'text-[#d4af37] font-semibold scale-105'
                  : 'text-rose-600 font-semibold scale-105'
                : 'hover:text-white opacity-80'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="text-[11px] font-medium">Settings</span>
            {currentTab === 'settings' && (
              <span className={`w-1 h-1 rounded-full ${theme === 'dark' ? 'bg-[#d4af37]' : 'bg-rose-600'}`}></span>
            )}
          </button>
        </div>
      </nav>
    </>
  );
};
