import React from 'react';
import {
  Heart,
  Globe,
  Volume2,
  Moon,
  Sun,
  KeyRound,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { UserSettings, LanguagePreference, GirlfriendTone, VoiceName } from '../types';

interface SettingsViewProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onResetAllData: () => void;
  theme: 'dark' | 'light';
  hasGeminiKey: boolean;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onResetAllData,
  theme,
  hasGeminiKey,
}) => {
  const nicknames = ['Jaan', 'Shona', 'Babu', 'Kolija', 'Sweetheart', 'Hubby'];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <span className={theme === 'dark' ? 'font-serif italic text-[#d4af37] tracking-wider text-3xl font-normal' : ''}>
            Settings
          </span>
          <span className={`text-sm ${theme === 'dark' ? 'text-[#a1a1aa] font-serif' : 'text-rose-500 font-serif'}`}>
            · সেটিংস
          </span>
        </h1>
        <p className="text-xs text-[#71717a]">
          Personalize your relationship with Naima, language style, voice and theme.
        </p>
      </div>

      {/* 1. API Status & Gemini Configuration */}
      <div
        id="settings-api-status"
        className={`p-5 rounded-3xl border transition-colors ${
          theme === 'dark' ? 'bg-[#0f0f12] border-[#27272a]' : 'bg-white border-neutral-200'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <KeyRound className={`w-5 h-5 ${theme === 'dark' ? 'text-[#d4af37]' : 'text-rose-500'}`} />
            <h2 className="font-semibold text-sm">Google Gemini AI Engine</h2>
          </div>
          {hasGeminiKey ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Connected
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              Setup Needed
            </span>
          )}
        </div>

        <p className="text-xs text-[#a1a1aa] leading-relaxed">
          Naima uses Google Gemini models for human-like conversations in Bangla, Banglish, and
          English, plus Gemini Voice/TTS capabilities during voice calls.
        </p>

        {!hasGeminiKey && (
          <div className="mt-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
            <p className="font-semibold mb-1">How to enable live AI:</p>
            <p className="opacity-90">
              Open the <strong>Settings &gt; Secrets</strong> panel in Google AI Studio and configure
              your <code className="font-mono bg-amber-500/20 px-1 py-0.5 rounded text-amber-300">GEMINI_API_KEY</code>.
              The application automatically binds it server-side.
            </p>
          </div>
        )}
      </div>

      {/* 2. Relationship Customization */}
      <div
        id="settings-relationship"
        className={`p-5 rounded-3xl border space-y-4 transition-colors ${
          theme === 'dark' ? 'bg-[#0f0f12] border-[#27272a]' : 'bg-white border-neutral-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <Heart className={`w-5 h-5 ${theme === 'dark' ? 'text-[#d4af37]' : 'text-rose-500'}`} />
          <h2 className="font-semibold text-sm">Relationship & Pet Names</h2>
        </div>

        {/* User name */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#71717a]">Your Name</label>
          <input
            id="settings-user-name"
            type="text"
            value={settings.userName}
            onChange={(e) => onUpdateSettings({ userName: e.target.value })}
            placeholder="e.g. Arif, Fahim, Tanvir..."
            className={`w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none transition-colors ${
              theme === 'dark'
                ? 'bg-[#1c1c21] border-[#27272a] text-[#e2e2e7] focus:border-[#d4af37]/60'
                : 'bg-neutral-50 border-neutral-200 text-neutral-800'
            }`}
          />
        </div>

        {/* Pet Name Selection */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-[#71717a]">
            What Naima should call you:
          </label>
          <div className="flex flex-wrap gap-2">
            {nicknames.map((nick) => (
              <button
                key={nick}
                id={`petname-${nick}`}
                onClick={() => onUpdateSettings({ nickname: nick })}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                  settings.nickname === nick
                    ? theme === 'dark'
                      ? 'bg-[#d4af37] text-[#0a0a0b] border-[#d4af37] font-bold shadow-[0_0_10px_rgba(212,175,55,0.3)]'
                      : 'bg-rose-600 text-white border-rose-600 shadow-sm'
                    : theme === 'dark'
                    ? 'bg-[#1c1c21] border-[#27272a] text-[#a1a1aa] hover:border-[#d4af37]/40 hover:text-[#e2e2e7]'
                    : 'bg-neutral-100 border-neutral-200 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {nick}
              </button>
            ))}
          </div>
        </div>

        {/* Tone Selection */}
        <div className={`space-y-2 pt-2 border-t ${theme === 'dark' ? 'border-[#27272a]' : 'border-neutral-200'}`}>
          <label className="text-xs font-medium text-[#71717a]">Naima&apos;s Personality Vibe</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { id: 'romantic', title: 'Romantic & Caring', bangla: 'রোমান্টিক ও যত্নশীল' },
              { id: 'playful', title: 'Playful & Teasing', bangla: 'চঞ্চল ও মিষ্টি' },
              { id: 'caring', title: 'Deep & Emotional', bangla: 'গভীর অনুভূতিশীল' },
            ].map((t) => (
              <button
                key={t.id}
                id={`tone-${t.id}`}
                onClick={() => onUpdateSettings({ tone: t.id as GirlfriendTone })}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  settings.tone === t.id
                    ? theme === 'dark'
                      ? 'border-[#d4af37] bg-[#d4af37]/15 text-[#d4af37] font-semibold shadow-[0_0_10px_rgba(212,175,55,0.15)]'
                      : 'border-rose-500 bg-rose-500/10 text-rose-500 font-semibold'
                    : theme === 'dark'
                    ? 'border-[#27272a] bg-[#1c1c21] text-[#a1a1aa] hover:border-[#d4af37]/40'
                    : 'border-neutral-200 bg-neutral-50 text-neutral-700'
                }`}
              >
                <div className="text-xs font-semibold">{t.title}</div>
                <div className="text-[10px] opacity-75 mt-0.5">{t.bangla}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Language Preferences */}
      <div
        id="settings-language"
        className={`p-5 rounded-3xl border space-y-4 transition-colors ${
          theme === 'dark' ? 'bg-[#0f0f12] border-[#27272a]' : 'bg-white border-neutral-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <Globe className={`w-5 h-5 ${theme === 'dark' ? 'text-[#d4af37]' : 'text-rose-500'}`} />
          <h2 className="font-semibold text-sm">Language & Dialect</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            {
              id: 'all',
              label: 'Natural Mix (স্বাভাবিক মিশ্রণ)',
              desc: 'Matches whichever language you speak',
            },
            {
              id: 'bangla',
              label: 'Bangla Only (বাংলা)',
              desc: 'Pure sweet conversational Bengali script',
            },
            {
              id: 'banglish',
              label: 'Banglish (বাংলিশ)',
              desc: 'Bangla written in English alphabet (kemon acho jaan)',
            },
            {
              id: 'english',
              label: 'English with Pet Names',
              desc: 'Loving English with terms like jaan, babu',
            },
          ].map((item) => (
            <button
              key={item.id}
              id={`lang-pref-${item.id}`}
              onClick={() => onUpdateSettings({ languagePreference: item.id as LanguagePreference })}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                settings.languagePreference === item.id
                  ? theme === 'dark'
                    ? 'border-[#d4af37] bg-[#d4af37]/15 text-[#d4af37] font-semibold shadow-[0_0_10px_rgba(212,175,55,0.15)]'
                    : 'border-rose-500 bg-rose-500/10 text-rose-500 font-semibold'
                  : theme === 'dark'
                  ? 'border-[#27272a] bg-[#1c1c21] text-[#a1a1aa] hover:border-[#d4af37]/40'
                  : 'border-neutral-200 bg-neutral-50 text-neutral-700'
              }`}
            >
              <div className="text-xs font-semibold">{item.label}</div>
              <div className="text-[10px] text-[#71717a] mt-0.5">{item.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Voice Model Selection */}
      <div
        id="settings-voice"
        className={`p-5 rounded-3xl border space-y-4 transition-colors ${
          theme === 'dark' ? 'bg-[#0f0f12] border-[#27272a]' : 'bg-white border-neutral-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <Volume2 className={`w-5 h-5 ${theme === 'dark' ? 'text-[#d4af37]' : 'text-rose-500'}`} />
          <h2 className="font-semibold text-sm">Gemini AI Voice Persona</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(['Kore', 'Aoede', 'Zephyr', 'Puck'] as VoiceName[]).map((voice) => (
            <button
              key={voice}
              id={`voice-${voice}`}
              onClick={() => onUpdateSettings({ voice })}
              className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                settings.voice === voice
                  ? theme === 'dark'
                    ? 'border-[#d4af37] bg-[#d4af37]/15 text-[#d4af37] font-semibold shadow-[0_0_10px_rgba(212,175,55,0.15)]'
                    : 'border-rose-500 bg-rose-500/10 text-rose-500 font-semibold'
                  : theme === 'dark'
                  ? 'border-[#27272a] bg-[#1c1c21] text-[#a1a1aa] hover:border-[#d4af37]/40'
                  : 'border-neutral-200 bg-neutral-50 text-neutral-700'
              }`}
            >
              <div className="text-xs font-semibold">{voice}</div>
              <div className="text-[10px] text-[#71717a] mt-0.5">
                {voice === 'Kore'
                  ? 'Soft & Warm'
                  : voice === 'Aoede'
                  ? 'Sweet'
                  : voice === 'Zephyr'
                  ? 'Gentle'
                  : 'Lively'}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 5. Theme & Appearance */}
      <div
        id="settings-theme"
        className={`p-5 rounded-3xl border space-y-3 transition-colors ${
          theme === 'dark' ? 'bg-[#0f0f12] border-[#27272a]' : 'bg-white border-neutral-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="font-semibold text-sm">Sophisticated Dark Theme</h2>
            <p className="text-xs text-[#71717a]">Refined noir aesthetic with champagne gold accents</p>
          </div>
          <button
            id="settings-theme-toggle"
            onClick={() => onUpdateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
            className={`p-2.5 rounded-full border transition-all cursor-pointer ${
              theme === 'dark'
                ? 'bg-[#1c1c21] border-[#27272a] text-[#d4af37] hover:bg-[#27272a]'
                : 'bg-neutral-100 border-neutral-200 text-neutral-800 hover:bg-neutral-200'
            }`}
          >
            {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 6. Reset & Clear Data */}
      <div className="pt-2">
        <button
          id="reset-all-data-btn"
          onClick={() => {
            if (window.confirm('Reset all chat memories and restore default settings?')) {
              onResetAllData();
            }
          }}
          className="w-full py-3 rounded-2xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
          <span>Reset All Memories & Default Settings</span>
        </button>
      </div>
    </div>
  );
};
