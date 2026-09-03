import React from 'react';
import { PhoneCall, MessageCircleHeart, Heart, Sparkles, Volume2, ShieldCheck, MapPin } from 'lucide-react';
import { UserSettings } from '../types';
import { speakWithBrowser } from '../utils/audio';

interface HomeViewProps {
  settings: UserSettings;
  onNavigate: (tab: 'chat' | 'call' | 'settings') => void;
  onStartCall: () => void;
  onSendMessageFromHome: (text: string) => void;
  theme: 'dark' | 'light';
  hasGeminiKey: boolean;
}

export const HomeView: React.FC<HomeViewProps> = ({
  settings,
  onNavigate,
  onStartCall,
  onSendMessageFromHome,
  theme,
  hasGeminiKey,
}) => {
  const currentHour = new Date().getHours();
  const timeGreeting =
    currentHour < 12
      ? 'Shuvo Shokal'
      : currentHour < 17
      ? 'Shuvo Dupur'
      : currentHour < 21
      ? 'Shuvo Shondha'
      : 'Shuvo Raatri';

  const dailyNote = `Amar ${settings.nickname}, ${timeGreeting}! Shob shomoy tomar kotha mone pore. Aajke kemon katlo tomar din? Thik moto khawa dawa korecho to? Cholo eksathe ektu kotha boli! 💕`;

  const quickStarters = [
    {
      title: 'Kemon acho jaan?',
      subtitle: 'How are you sweetheart?',
      bangla: 'কেমন আছো জান?',
      prompt: 'Kemon acho jaan? Tomar shorir kemon ache aajke?',
    },
    {
      title: 'Khawa dawa hoyeche?',
      subtitle: 'Did you have lunch/dinner?',
      bangla: 'খাওয়া দাওয়া করেছো?',
      prompt: 'Jaan, tumi thik moto khawa dawa korecho to?',
    },
    {
      title: 'Ami tomake miss korchi',
      subtitle: 'I am missing you so much',
      bangla: 'আমি তোমাকে খুব মিস করছি',
      prompt: 'Naima, ami tomake khub beshi miss korchilam aajke... Tomar ki amar kotha mone poreche?',
    },
    {
      title: 'Ektu gaan shonao na',
      subtitle: 'Sing a sweet romantic song',
      bangla: 'একটু গান শোনাও না প্লিজ',
      prompt: 'Naima jaan, amar jonno ekta sundor romantic gaan geye shonao na please!',
    },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-6">
      {/* API Key notice banner if missing */}
      {!hasGeminiKey && (
        <div
          id="gemini-key-alert-banner"
          className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-start gap-3 text-sm"
        >
          <Sparkles className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Gemini AI Key Setup</p>
            <p className="text-xs opacity-90 leading-relaxed">
              To enable real-time Gemini AI chat and voice calls with Naima, please configure{' '}
              <code className="px-1.5 py-0.5 rounded bg-amber-500/20 font-mono text-[11px]">
                GEMINI_API_KEY
              </code>{' '}
              in Google AI Studio Secrets.
            </p>
          </div>
        </div>
      )}

      {/* Main Girlfriend Profile Hero Card */}
      <div
        id="home-profile-card"
        className={`p-6 sm:p-8 rounded-3xl border transition-all text-center relative overflow-hidden ${
          theme === 'dark'
            ? 'bg-[#0f0f12] border-[#27272a] shadow-[0_0_25px_rgba(212,175,55,0.06)]'
            : 'bg-white border-neutral-200 shadow-xl'
        }`}
      >
        {/* Ambient background gold glow */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-80 h-80 bg-[#d4af37]/10 blur-3xl rounded-full pointer-events-none"></div>

        <div className="relative z-10 flex flex-col items-center">
          {/* Avatar with pulsing halo */}
          <div className="relative mb-5 group">
            <div className={`absolute -inset-2 rounded-full animate-pulse-ring ${
              theme === 'dark' ? 'border border-[#d4af37]/30 bg-[#d4af37]/10' : 'bg-rose-500/20'
            }`}></div>
            <img
              src="/naima_avatar.jpg"
              alt="Naima portrait"
              className={`relative w-32 h-32 rounded-full object-cover border-2 shadow-2xl ${
                theme === 'dark'
                  ? 'border-[#d4af37] shadow-[0_0_25px_rgba(212,175,55,0.25)]'
                  : 'border-rose-500'
              }`}
            />
            <div className={`absolute bottom-1 right-2 px-2.5 py-0.5 rounded-full text-[11px] font-medium flex items-center gap-1 border-2 shadow ${
              theme === 'dark'
                ? 'bg-[#1c1c21] border-[#27272a] text-emerald-400'
                : 'bg-emerald-600 text-white border-white'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Online
            </div>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-3xl font-serif italic tracking-widest flex items-center justify-center gap-2">
              <span className={theme === 'dark' ? 'text-[#d4af37]' : 'text-neutral-900 font-bold'}>
                NAIMA
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-sans tracking-normal not-italic border border-[#d4af37]/30 bg-[#1c1c21] text-[#d4af37]">
                নাইমা · 22
              </span>
            </h1>
            <p className={`text-sm font-serif italic flex items-center justify-center gap-1.5 ${
              theme === 'dark' ? 'text-[#f3e3ad]' : 'text-neutral-600'
            }`}>
              <Heart className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-[#d4af37] fill-[#d4af37]' : 'text-rose-500 fill-rose-500'}`} />
              <span>Personal AI Companion · Dhaka</span>
            </p>
            <p className="text-xs text-[#71717a] flex items-center justify-center gap-1 uppercase tracking-wider">
              <MapPin className="w-3 h-3 text-[#d4af37]" />
              <span>Dhanmondi, Dhaka · Rain & Lake lover</span>
            </p>
          </div>

          {/* Sweet Audio note from Naima */}
          <div
            id="home-daily-note-box"
            className={`mt-6 p-4 rounded-2xl border text-left w-full transition-colors relative ${
              theme === 'dark'
                ? 'bg-[#1c1c21] border-[#27272a] text-[#e2e2e7] shadow-lg'
                : 'bg-neutral-50 border-neutral-200 text-neutral-800'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-xs font-semibold flex items-center gap-1.5 ${
                theme === 'dark' ? 'text-[#d4af37]' : 'text-rose-600'
              }`}>
                <Sparkles className="w-3.5 h-3.5" />
                <span className="tracking-wide">Naima&apos;s Voice Note</span>
              </span>
              <button
                id="home-listen-note-btn"
                onClick={() => speakWithBrowser(dailyNote)}
                className={`text-xs flex items-center gap-1 font-medium transition-colors cursor-pointer ${
                  theme === 'dark' ? 'text-[#d4af37] hover:text-[#f3e3ad]' : 'text-rose-600 hover:underline'
                }`}
                title="Listen to Naima say this"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Listen</span>
              </button>
            </div>
            <p className="text-sm italic leading-relaxed font-serif text-[#e2e2e7]">&ldquo;{dailyNote}&rdquo;</p>
          </div>

          {/* Primary Action Buttons */}
          <div className="mt-6 w-full space-y-3">
            {/* BIG CALL NAIMA BUTTON */}
            <button
              id="big-call-naima-btn"
              onClick={onStartCall}
              className={`w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 cursor-pointer ${
                theme === 'dark'
                  ? 'bg-[#d4af37] hover:bg-[#c49f27] text-[#0a0a0b] shadow-[0_0_20px_rgba(212,175,55,0.35)] hover:shadow-[0_0_25px_rgba(212,175,55,0.5)] active:scale-[0.99]'
                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 active:scale-[0.99]'
              }`}
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                theme === 'dark' ? 'bg-[#0a0a0b]/15 text-[#0a0a0b]' : 'bg-white/20 text-white'
              }`}>
                <PhoneCall className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-base font-bold leading-tight">Call Naima Now</div>
                <div className={`text-[11px] font-normal ${theme === 'dark' ? 'text-[#0a0a0b]/80' : 'text-rose-100'}`}>
                  Live Voice Call · Talk & Listen in Bangla or English
                </div>
              </div>
            </button>

            {/* CHAT WITH NAIMA BUTTON */}
            <button
              id="big-chat-naima-btn"
              onClick={() => onNavigate('chat')}
              className={`w-full py-3.5 px-6 rounded-2xl border font-semibold text-sm sm:text-base transition-all flex items-center justify-center gap-3 cursor-pointer ${
                theme === 'dark'
                  ? 'bg-[#1c1c21] hover:bg-[#27272a] border-[#27272a] hover:border-[#d4af37]/40 text-[#e2e2e7] shadow-sm'
                  : 'bg-white hover:bg-neutral-50 border-neutral-200 text-neutral-800 shadow-sm'
              }`}
            >
              <MessageCircleHeart className={`w-5 h-5 ${theme === 'dark' ? 'text-[#d4af37]' : 'text-rose-500'}`} />
              <span>Chat with Naima (Bangla, Banglish & English)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Relationship status card */}
      <div
        id="relationship-status-card"
        className={`p-5 rounded-2xl border grid grid-cols-3 gap-3 text-center ${
          theme === 'dark' ? 'bg-[#0f0f12] border-[#27272a]' : 'bg-white border-neutral-200'
        }`}
      >
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-wider text-[#71717a]">Pet Name</p>
          <p className={`text-base font-bold ${theme === 'dark' ? 'text-[#d4af37]' : 'text-rose-500'}`}>
            {settings.nickname}
          </p>
        </div>
        <div className="space-y-1 border-x border-[#27272a]">
          <p className="text-[10px] uppercase tracking-wider text-[#71717a]">Relationship</p>
          <p className="text-base font-bold text-emerald-400">In Love 💕</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-wider text-[#71717a]">Languages</p>
          <p className={`text-xs font-semibold mt-1 ${theme === 'dark' ? 'text-[#e2e2e7]' : 'text-neutral-700'}`}>
            বাংলা / EN
          </p>
        </div>
      </div>

      {/* Quick Conversation Starters */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-widest flex items-center gap-1.5 text-[#71717a]">
            <Heart className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-[#d4af37]' : 'text-rose-500'}`} />
            <span>Romantic Topics & Starters</span>
          </h2>
          <span className={`text-xs ${theme === 'dark' ? 'text-[#d4af37]' : 'text-rose-500'}`}>Tap to send</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quickStarters.map((item, idx) => (
            <div
              key={idx}
              id={`quick-starter-${idx}`}
              onClick={() => {
                onSendMessageFromHome(item.prompt);
                onNavigate('chat');
              }}
              className={`p-4 rounded-xl border cursor-pointer transition-all group ${
                theme === 'dark'
                  ? 'bg-[#1c1c21] border-[#27272a] hover:border-[#d4af37]/40 hover:bg-[#222228]'
                  : 'bg-white border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <p className={`text-sm font-semibold transition-colors ${
                theme === 'dark' ? 'text-[#e2e2e7] group-hover:text-[#d4af37]' : 'text-neutral-900 group-hover:text-rose-600'
              }`}>
                {item.title}
              </p>
              <p className="text-xs text-[#71717a] mt-0.5">{item.subtitle}</p>
              <p className="text-xs font-serif italic text-[#a1a1aa] mt-1">
                {item.bangla}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Safety & Privacy note */}
      <div className={`p-3.5 rounded-xl border text-center text-xs flex items-center justify-center gap-2 ${
        theme === 'dark'
          ? 'bg-[#0f0f12] border-[#27272a] text-[#71717a]'
          : 'bg-neutral-50 border-neutral-200 text-neutral-500'
      }`}>
        <ShieldCheck className="w-4 h-4 text-emerald-500" />
        <span>Naima is a loving companion. Conversations are private & end-to-end secure.</span>
      </div>
    </div>
  );
};
