import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  PhoneCall,
  Volume2,
  Trash2,
  Mic,
  MicOff,
  Sparkles,
  Heart,
  Smile,
} from 'lucide-react';
import { ChatMessage, UserSettings } from '../types';
import { playGeminiPCM, speakWithBrowser, stopAllAudio } from '../utils/audio';
import { SpeechRecognizer } from '../utils/speechRecognition';

interface ChatViewProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  onStartCall: () => void;
  onClearHistory: () => void;
  isTyping: boolean;
  settings: UserSettings;
  theme: 'dark' | 'light';
  hasGeminiKey: boolean;
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  onSendMessage,
  onStartCall,
  onClearHistory,
  isTyping,
  settings,
  theme,
  hasGeminiKey,
}) => {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognizerRef = useRef<SpeechRecognizer | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Handle message submission
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || isTyping) return;

    setInputText('');
    await onSendMessage(text);
  };

  // Toggle voice dictation in chat
  const handleToggleVoiceInput = () => {
    if (isRecording) {
      recognizerRef.current?.stop();
      setIsRecording(false);
      return;
    }

    if (!recognizerRef.current) {
      recognizerRef.current = new SpeechRecognizer();
    }

    setIsRecording(true);
    recognizerRef.current.start({
      onResult: (text: string) => {
        setInputText(text);
      },
      onError: (err) => {
        console.warn('Speech error:', err);
        setIsRecording(false);
      },
      onEnd: () => {
        setIsRecording(false);
      },
    });
  };

  // Play audio for a specific message
  const handlePlayMessageAudio = async (msg: ChatMessage) => {
    if (playingMessageId === msg.id) {
      stopAllAudio();
      setPlayingMessageId(null);
      return;
    }

    setPlayingMessageId(msg.id);

    if (msg.audioBase64) {
      try {
        await playGeminiPCM(msg.audioBase64, {
          onEnded: () => setPlayingMessageId(null),
        });
      } catch (e) {
        speakWithBrowser(msg.text, {
          onEnded: () => setPlayingMessageId(null),
        });
      }
    } else {
      speakWithBrowser(msg.text, {
        onEnded: () => setPlayingMessageId(null),
      });
    }
  };

  const romanticSuggestions = [
    'Ki korcho jaan? 💕',
    'Khawa dawa hoyeche?',
    'Ami tomake khub bhalobashi',
    'Tell me a romantic story in Banglish',
    'Amake niye ekta kobita bolo',
  ];

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      {/* Chat Top Info Bar */}
      <div
        id="chat-header-bar"
        className={`px-4 py-3 border-b flex items-center justify-between transition-colors ${
          theme === 'dark'
            ? 'bg-[#0a0a0b]/90 border-[#27272a] text-[#e2e2e7]'
            : 'bg-white/90 border-neutral-200 text-neutral-800'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src="/naima_avatar.jpg"
              alt="Naima"
              className={`w-10 h-10 rounded-full object-cover border-2 shadow-sm ${
                theme === 'dark' ? 'border-[#d4af37]/60' : 'border-rose-500'
              }`}
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-[#0a0a0b]"></span>
          </div>
          <div>
            <h2 className="text-sm font-bold flex items-center gap-1.5">
              <span className={theme === 'dark' ? 'font-serif italic text-[#d4af37] tracking-wider text-base font-normal' : ''}>
                Naima
              </span>
              <span className={`text-xs ${theme === 'dark' ? 'text-[#a1a1aa]' : 'text-rose-500 font-normal'}`}>
                · নাইমা
              </span>
            </h2>
            <p className="text-[10px] uppercase tracking-wider text-[#71717a] flex items-center gap-1">
              <span>Bangla · Banglish · English</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Call Button right inside chat */}
          <button
            id="chat-call-btn"
            onClick={onStartCall}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-sm transition-all cursor-pointer ${
              theme === 'dark'
                ? 'bg-[#d4af37] hover:bg-[#c49f27] text-[#0a0a0b] shadow-[0_0_12px_rgba(212,175,55,0.25)]'
                : 'bg-rose-600 hover:bg-rose-500 text-white'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Call Naima</span>
          </button>

          {/* Clear history button */}
          <button
            id="clear-chat-btn"
            onClick={() => {
              if (window.confirm('Clear conversation history with Naima?')) {
                onClearHistory();
              }
            }}
            title="Clear Chat History"
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              theme === 'dark'
                ? 'text-[#71717a] hover:text-[#d4af37] hover:bg-[#1c1c21]'
                : 'text-neutral-400 hover:text-rose-500 hover:bg-neutral-100'
            }`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div
        id="chat-messages-container"
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth"
      >
        {/* Warning if Gemini API key missing */}
        {!hasGeminiKey && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs">
            <span className="font-semibold">Notice: </span>
            GEMINI_API_KEY is not configured yet. You can still test the UI, but please configure
            GEMINI_API_KEY in Secrets for live Gemini responses.
          </div>
        )}

        {/* Date badge */}
        <div className="flex justify-center">
          <span className={`text-[10px] uppercase tracking-[0.2em] px-3.5 py-1 rounded-full border ${
            theme === 'dark'
              ? 'bg-[#1c1c21] border-[#27272a] text-[#71717a]'
              : 'bg-neutral-100 border-neutral-200 text-neutral-500'
          }`}>
            Conversation with Naima
          </span>
        </div>

        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-end gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <img
                  src="/naima_avatar.jpg"
                  alt="Naima"
                  className={`w-8 h-8 rounded-full object-cover border flex-shrink-0 mb-1 ${
                    theme === 'dark' ? 'border-[#d4af37]/40' : 'border-rose-400'
                  }`}
                />
              )}

              <div
                className={`max-w-[82%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm relative group leading-relaxed ${
                  isUser
                    ? theme === 'dark'
                      ? 'bg-[#d4af37]/12 text-[#f3e3ad] border border-[#d4af37]/35 rounded-br-none shadow-[0_2px_10px_rgba(212,175,55,0.08)]'
                      : 'bg-rose-600 text-white rounded-br-none'
                    : theme === 'dark'
                    ? 'bg-[#1c1c21] border border-[#27272a] text-[#e2e2e7] rounded-bl-none shadow-[0_2px_10px_rgba(0,0,0,0.25)]'
                    : 'bg-white border border-neutral-200 text-neutral-800 rounded-bl-none'
                }`}
              >
                <div className="whitespace-pre-wrap break-words font-sans">
                  {msg.text}
                </div>

                <div
                  className={`mt-1.5 flex items-center justify-between text-[10px] gap-2 ${
                    isUser
                      ? theme === 'dark'
                        ? 'text-[#a1a1aa]'
                        : 'text-rose-100'
                      : 'text-[#71717a]'
                  }`}
                >
                  <span>
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>

                  {!isUser && (
                    <button
                      id={`play-msg-btn-${msg.id}`}
                      onClick={() => handlePlayMessageAudio(msg)}
                      className={`flex items-center gap-1 transition-colors cursor-pointer text-[11px] ${
                        theme === 'dark' ? 'text-[#d4af37] hover:text-[#f3e3ad]' : 'hover:text-rose-500'
                      }`}
                      title="Listen to Naima say this"
                    >
                      <Volume2
                        className={`w-3.5 h-3.5 ${
                          playingMessageId === msg.id ? (theme === 'dark' ? 'text-[#d4af37] animate-pulse' : 'text-rose-500 animate-pulse') : ''
                        }`}
                      />
                      <span>{playingMessageId === msg.id ? 'Playing...' : 'Listen'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Real-time Typing Indicator */}
        {isTyping && (
          <div className="flex items-end gap-2.5 justify-start">
            <img
              src="/naima_avatar.jpg"
              alt="Naima"
              className={`w-8 h-8 rounded-full object-cover border flex-shrink-0 mb-1 ${
                theme === 'dark' ? 'border-[#d4af37]/40' : 'border-rose-400'
              }`}
            />
            <div
              className={`rounded-2xl rounded-bl-none px-4 py-3 text-xs flex items-center gap-2.5 border shadow-sm ${
                theme === 'dark'
                  ? 'bg-[#1c1c21] border-[#27272a] text-[#d4af37]'
                  : 'bg-white border-neutral-200 text-rose-600'
              }`}
            >
              <div className="flex gap-1 items-center">
                <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${theme === 'dark' ? 'bg-[#d4af37]' : 'bg-rose-500'}`}></span>
                <span className={`w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:0.2s] ${theme === 'dark' ? 'bg-[#d4af37]' : 'bg-rose-500'}`}></span>
                <span className={`w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:0.4s] ${theme === 'dark' ? 'bg-[#d4af37]' : 'bg-rose-500'}`}></span>
              </div>
              <span className="font-serif italic text-sm tracking-wide">Naima is replying...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Replies Carousel */}
      <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar">
        {romanticSuggestions.map((text, i) => (
          <button
            key={i}
            id={`suggestion-chip-${i}`}
            onClick={() => {
              setInputText(text);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors border flex-shrink-0 cursor-pointer ${
              theme === 'dark'
                ? 'bg-[#1c1c21] border-[#27272a] text-[#a1a1aa] hover:border-[#d4af37]/50 hover:text-[#f3e3ad]'
                : 'bg-neutral-100 border-neutral-200 text-neutral-700 hover:border-neutral-300'
            }`}
          >
            {text}
          </button>
        ))}
      </div>

      {/* Chat Input Bar */}
      <div
        id="chat-input-area"
        className={`p-3.5 border-t backdrop-blur-md transition-colors ${
          theme === 'dark'
            ? 'bg-[#0a0a0b] border-[#27272a]'
            : 'bg-white border-neutral-200'
        }`}
      >
        <form onSubmit={handleSubmit} className="flex items-center gap-2.5">
          {/* Voice dictation button */}
          <button
            type="button"
            id="mic-dictate-btn"
            onClick={handleToggleVoiceInput}
            title={isRecording ? 'Stop voice input' : 'Speak your message'}
            className={`p-2.5 rounded-full border transition-all cursor-pointer ${
              isRecording
                ? 'bg-rose-600 text-white border-rose-600 animate-pulse'
                : theme === 'dark'
                ? 'bg-[#1c1c21] border-[#27272a] text-[#d4af37] hover:bg-[#27272a]'
                : 'bg-neutral-100 border-neutral-200 hover:bg-neutral-200 text-neutral-700'
            }`}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Text input */}
          <input
            id="chat-message-input"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isRecording
                ? 'Listening to you... (Bangla or English)'
                : `Message Naima in Bangla, Banglish or English...`
            }
            className={`flex-1 px-4 py-2.5 rounded-full text-sm outline-none border transition-colors ${
              theme === 'dark'
                ? 'bg-[#1c1c21] border-[#27272a] text-[#e2e2e7] placeholder-[#71717a] focus:border-[#d4af37]/60'
                : 'bg-neutral-50 border-neutral-200 text-neutral-800 placeholder-neutral-400 focus:border-rose-400'
            }`}
          />

          {/* Send button */}
          <button
            id="chat-send-btn"
            type="submit"
            disabled={!inputText.trim() || isTyping}
            className={`p-2.5 rounded-full font-semibold transition-all cursor-pointer ${
              inputText.trim() && !isTyping
                ? theme === 'dark'
                  ? 'bg-[#d4af37] hover:bg-[#c49f27] text-[#0a0a0b] shadow-[0_0_12px_rgba(212,175,55,0.3)]'
                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow-md'
                : 'bg-[#27272a] text-[#71717a] border border-transparent cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
