import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { ChatView } from './components/ChatView';
import { VoiceCallView } from './components/VoiceCallView';
import { SettingsView } from './components/SettingsView';
import { AppTab, ChatMessage, UserSettings } from './types';
import { playGeminiPCM, speakWithBrowser } from './utils/audio';

const DEFAULT_SETTINGS: UserSettings = {
  nickname: 'Jaan',
  userName: 'Sweetheart',
  languagePreference: 'all',
  tone: 'romantic',
  voice: 'Kore',
  theme: 'dark',
  autoVoicePlayback: false,
};

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'init-1',
    sender: 'naima',
    text: 'Assalamu alaikum jaan! 💕 Khub miss korchilam tomake. Aajke shara din ki ki korle bolo na? Khawa dawa hoyeche thik moto?',
    timestamp: Date.now() - 1000 * 60 * 15,
  },
];

export default function App() {
  // Navigation
  const [currentTab, setCurrentTab] = useState<AppTab>('home');
  const [isCallActive, setIsCallActive] = useState(false);

  // Settings
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem('naima_settings');
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_SETTINGS;
  });

  // Chat messages
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('naima_chat_messages');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_MESSAGES;
  });

  // Chat typing indicator
  const [isTyping, setIsTyping] = useState(false);

  // Gemini API Key detection
  const [hasGeminiKey, setHasGeminiKey] = useState(true);

  // Check API health status on mount
  useEffect(() => {
    fetch('/api/status')
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.hasGeminiKey === 'boolean') {
          setHasGeminiKey(data.hasGeminiKey);
        }
      })
      .catch((err) => {
        console.warn('API status check error:', err);
      });
  }, []);

  // Sync settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('naima_settings', JSON.stringify(settings));
    } catch (e) {
      console.error(e);
    }
  }, [settings]);

  // Sync dark mode class to HTML root
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.theme]);

  // Sync messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('naima_chat_messages', JSON.stringify(messages));
    } catch (e) {
      console.error(e);
    }
  }, [messages]);

  // Toggle theme
  const toggleTheme = () => {
    setSettings((prev) => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark',
    }));
  };

  // Send message to Gemini AI
  const handleSendMessage = async (userText: string) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          history: updatedMessages.slice(-10),
          languagePreference: settings.languagePreference,
          tone: settings.tone,
          nickname: settings.nickname,
          userName: settings.userName,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to communicate with Naima');
      }

      const data = await res.json();
      const naimaReply = data.reply || 'Jaan, ami shunchi... Bolo na? 💕';

      const naimaMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'naima',
        text: naimaReply,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, naimaMsg]);

      // If auto-play voice is enabled, speak it
      if (settings.autoVoicePlayback) {
        speakWithBrowser(naimaReply);
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'naima',
        text: 'Amar network ektu problem korche jaan... Tomar kotha abar bolo na please? 💕',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  // Start Call Handler (Big Call Button)
  const handleStartCall = () => {
    setIsCallActive(true);
    setCurrentTab('call');
  };

  // End Call Handler
  const handleEndCall = () => {
    setIsCallActive(false);
    setCurrentTab('home');
  };

  // Clear chat history
  const handleClearHistory = () => {
    setMessages(INITIAL_MESSAGES);
    try {
      localStorage.removeItem('naima_chat_messages');
    } catch (e) {
      console.error(e);
    }
  };

  // Reset all data
  const handleResetAllData = () => {
    setSettings(DEFAULT_SETTINGS);
    setMessages(INITIAL_MESSAGES);
    try {
      localStorage.clear();
    } catch (e) {
      console.error(e);
    }
  };

  // Add a history turn during call
  const handleAddHistoryMessage = (msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
  };

  return (
    <div
      id="app-root-container"
      className={`min-h-screen transition-colors ${
        settings.theme === 'dark'
          ? 'bg-[#0a0a0b] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#1a1405] via-[#0a0a0b] to-[#0a0a0b] text-[#e2e2e7] selection:bg-[#d4af37] selection:text-[#0a0a0b]'
          : 'bg-[#f6f5f2] text-neutral-900 selection:bg-[#d4af37]/30'
      }`}
    >
      {/* If Call is active, show full-screen voice call overlay */}
      {isCallActive ? (
        <VoiceCallView
          onEndCall={handleEndCall}
          settings={settings}
          history={messages}
          onAddHistoryMessage={handleAddHistoryMessage}
          hasGeminiKey={hasGeminiKey}
        />
      ) : (
        <>
          <Navbar
            currentTab={currentTab}
            onTabChange={(tab) => {
              if (tab === 'call') {
                handleStartCall();
              } else {
                setCurrentTab(tab);
              }
            }}
            theme={settings.theme}
            onToggleTheme={toggleTheme}
            isCallActive={isCallActive}
          />

          <main id="app-main-content">
            {currentTab === 'home' && (
              <HomeView
                settings={settings}
                onNavigate={(tab) => {
                  if (tab === 'call') {
                    handleStartCall();
                  } else {
                    setCurrentTab(tab);
                  }
                }}
                onStartCall={handleStartCall}
                onSendMessageFromHome={handleSendMessage}
                theme={settings.theme}
                hasGeminiKey={hasGeminiKey}
              />
            )}

            {currentTab === 'chat' && (
              <ChatView
                messages={messages}
                onSendMessage={handleSendMessage}
                onStartCall={handleStartCall}
                onClearHistory={handleClearHistory}
                isTyping={isTyping}
                settings={settings}
                theme={settings.theme}
                hasGeminiKey={hasGeminiKey}
              />
            )}

            {currentTab === 'settings' && (
              <SettingsView
                settings={settings}
                onUpdateSettings={(updated) => setSettings((prev) => ({ ...prev, ...updated }))}
                onResetAllData={handleResetAllData}
                theme={settings.theme}
                hasGeminiKey={hasGeminiKey}
              />
            )}
          </main>
        </>
      )}
    </div>
  );
}
