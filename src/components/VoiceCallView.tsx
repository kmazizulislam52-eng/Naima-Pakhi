import React, { useState, useEffect, useRef } from 'react';
import {
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Heart,
  Send,
  MessageSquare,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { UserSettings, ChatMessage } from '../types';
import { playGeminiPCM, speakWithBrowser, stopAllAudio, setSpeakerMute } from '../utils/audio';
import { SpeechRecognizer } from '../utils/speechRecognition';

interface VoiceCallViewProps {
  onEndCall: () => void;
  settings: UserSettings;
  history: ChatMessage[];
  onAddHistoryMessage: (msg: ChatMessage) => void;
  hasGeminiKey: boolean;
}

export const VoiceCallView: React.FC<VoiceCallViewProps> = ({
  onEndCall,
  settings,
  history,
  onAddHistoryMessage,
  hasGeminiKey,
}) => {
  // Call status
  const [callDuration, setCallDuration] = useState(0);
  const [callPhase, setCallPhase] = useState<'connecting' | 'connected' | 'speaking' | 'listening'>('connecting');
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [currentSubtitle, setCurrentSubtitle] = useState('Connecting to Naima...');
  const [lastUserSpeech, setLastUserSpeech] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showTextInput, setShowTextInput] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [isProcessingTurn, setIsProcessingTurn] = useState(false);
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);

  // References
  const timerRef = useRef<any>(null);
  const recognizerRef = useRef<SpeechRecognizer | null>(null);
  const isMountedRef = useRef(true);
  const speechTimeoutRef = useRef<any>(null);

  // Format call timer
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start call timer
  useEffect(() => {
    isMountedRef.current = true;

    // Connect after 1.5s
    const connectTimeout = setTimeout(() => {
      if (isMountedRef.current) {
        setCallPhase('connected');
        // Initial greeting turn from Naima
        triggerNaimaTurn('Jaan, tumi call korecho! Koto khushi lagche amar... Bolo na, kemon acho aajke?');
      }
    }, 1200);

    timerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => {
      isMountedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
      clearTimeout(connectTimeout);
      if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
      stopAllAudio();
      if (recognizerRef.current) {
        recognizerRef.current.stop();
      }
    };
  }, []);

  // Handle speaker mute state
  useEffect(() => {
    setSpeakerMute(isSpeakerMuted);
  }, [isSpeakerMuted]);

  // Start listening to the user via microphone
  const startListening = () => {
    if (isMicMuted) return;

    if (!recognizerRef.current) {
      recognizerRef.current = new SpeechRecognizer();
    }

    if (!recognizerRef.current.isSupported()) {
      // If browser doesn't support Web Speech API, prompt user to use typed speech or fallback
      setCurrentSubtitle('Mic listening active (Web Speech not supported in this browser, you can type below)');
      setShowTextInput(true);
      return;
    }

    try {
      setCallPhase('listening');
      recognizerRef.current.start({
        onResult: (text: string, isFinal: boolean) => {
          if (!isMountedRef.current) return;
          setLastUserSpeech(text);

          // Clear any pending debounce
          if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);

          // If speech is final or user paused for 1.2s, trigger Naima's response
          if (isFinal) {
            handleUserSpoke(text);
          } else {
            speechTimeoutRef.current = setTimeout(() => {
              handleUserSpoke(text);
            }, 1400);
          }
        },
        onError: (err: any) => {
          if (err === 'not-allowed' || err === 'permission-denied') {
            setMicPermissionDenied(true);
            setErrorMessage('Microphone access was denied. You can speak by typing below.');
            setShowTextInput(true);
          }
        },
      });
    } catch (e) {
      console.warn('Recognition start issue:', e);
    }
  };

  // Stop listening temporarily (e.g. while Naima is speaking)
  const pauseListening = () => {
    if (recognizerRef.current) {
      recognizerRef.current.stop();
    }
  };

  // Called when user finished a speech utterance
  const handleUserSpoke = async (spokenText: string) => {
    const clean = spokenText.trim();
    if (!clean || isProcessingTurn) return;

    pauseListening();
    setIsProcessingTurn(true);

    // Record message into history
    const userMsg: ChatMessage = {
      id: `call-user-${Date.now()}`,
      sender: 'user',
      text: clean,
      timestamp: Date.now(),
    };
    onAddHistoryMessage(userMsg);

    setCurrentSubtitle(`You: "${clean}"`);

    try {
      // Call Gemini backend for Voice turn
      const res = await fetch('/api/voice-call/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: clean,
          history: history.slice(-6),
          languagePreference: settings.languagePreference,
          tone: settings.tone,
          nickname: settings.nickname,
          userName: settings.userName,
          voice: settings.voice,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to get voice reply');
      }

      const data = await res.json();
      const replyText = data.replyText || 'Ami shunte peyechi jaan!';
      const audioBase64 = data.audioBase64;

      const naimaMsg: ChatMessage = {
        id: `call-naima-${Date.now()}`,
        sender: 'naima',
        text: replyText,
        timestamp: Date.now(),
        audioBase64,
      };
      onAddHistoryMessage(naimaMsg);

      // Play audio response from Naima
      await playNaimaSpokenResponse(replyText, audioBase64);
    } catch (err: any) {
      console.error('Call turn error:', err);
      const fallbackReply = 'Jaan, tomar voice ektu kete jacche... Abar ektu bolo na? 💕';
      await playNaimaSpokenResponse(fallbackReply, null);
    } finally {
      setIsProcessingTurn(false);
      setLastUserSpeech('');
    }
  };

  // Play Naima's spoken voice and update subtitles
  const playNaimaSpokenResponse = async (text: string, audioBase64: string | null) => {
    if (!isMountedRef.current) return;
    setCallPhase('speaking');
    setCurrentSubtitle(text);

    if (audioBase64 && !isSpeakerMuted) {
      try {
        await playGeminiPCM(audioBase64, {
          isSpeakerMuted,
          onEnded: () => {
            if (isMountedRef.current) {
              setCallPhase('listening');
              setCurrentSubtitle('Naima is listening to you...');
              startListening();
            }
          },
        });
        return;
      } catch (e) {
        console.warn('Gemini PCM playback failed, falling back to browser speech:', e);
      }
    }

    // Fallback Web Speech Synthesis
    speakWithBrowser(text, {
      isSpeakerMuted,
      onEnded: () => {
        if (isMountedRef.current) {
          setCallPhase('listening');
          setCurrentSubtitle('Naima is listening to you...');
          startListening();
        }
      },
    });
  };

  // Initial greeting turn
  const triggerNaimaTurn = (initialText: string) => {
    const naimaMsg: ChatMessage = {
      id: `call-naima-${Date.now()}`,
      sender: 'naima',
      text: initialText,
      timestamp: Date.now(),
    };
    onAddHistoryMessage(naimaMsg);
    playNaimaSpokenResponse(initialText, null);
  };

  // Handle manual typed speech in call
  const handleSendManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    const text = manualInput;
    setManualInput('');
    handleUserSpoke(text);
  };

  // Toggle Microphone Mute
  const toggleMute = () => {
    const nextMuted = !isMicMuted;
    setIsMicMuted(nextMuted);
    if (nextMuted) {
      pauseListening();
      setCurrentSubtitle('Your microphone is muted');
    } else {
      startListening();
      setCurrentSubtitle('Microphone unmuted · Speak to Naima');
    }
  };

  // Toggle Speaker Mute
  const toggleSpeaker = () => {
    const nextSpeakerMuted = !isSpeakerMuted;
    setIsSpeakerMuted(nextSpeakerMuted);
    setSpeakerMute(nextSpeakerMuted);
  };

  return (
    <div
      id="voice-call-screen"
      className="fixed inset-0 z-50 bg-[#0a0a0b] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1a1405] via-[#0a0a0b] to-[#0a0a0b] text-[#e2e2e7] flex flex-col justify-between overflow-hidden select-none"
    >
      {/* Top Header: Call details and timer */}
      <div className="pt-6 px-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#1c1c21] border border-[#27272a]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#d4af37]">
            Encrypted Call
          </span>
        </div>

        {/* Live Call Timer */}
        <div
          id="call-timer"
          className="px-4 py-1 rounded-full bg-[#1c1c21] border border-[#27272a] text-sm font-mono font-medium text-[#d4af37] shadow-sm"
        >
          {formatTimer(callDuration)}
        </div>

        <button
          id="call-toggle-text-btn"
          onClick={() => setShowTextInput(!showTextInput)}
          className="p-2.5 rounded-full bg-[#1c1c21] hover:bg-[#27272a] border border-[#27272a] text-[#d4af37] transition-colors cursor-pointer"
          title="Type to Naima in call"
        >
          <MessageSquare className="w-4 h-4" />
        </button>
      </div>

      {/* Main Avatar & Visualizer Arena */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 relative z-10">
        {/* Warning if API key missing */}
        {!hasGeminiKey && (
          <div className="mb-4 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>GEMINI_API_KEY is not set in Secrets. Add it to enable Gemini Live AI.</span>
          </div>
        )}

        {/* Outer concentric pulsing rings based on callPhase */}
        <div className="relative flex items-center justify-center">
          {callPhase === 'speaking' && (
            <>
              <div className="absolute w-80 h-80 rounded-full border border-[#d4af37]/30 bg-[#d4af37]/5 animate-ping [animation-duration:3s]"></div>
              <div className="absolute w-64 h-64 rounded-full border border-[#d4af37]/40 bg-[#d4af37]/10 animate-pulse"></div>
            </>
          )}

          {callPhase === 'listening' && (
            <div className="absolute w-68 h-68 rounded-full border-2 border-emerald-500/30 bg-emerald-500/5 animate-pulse"></div>
          )}

          {/* Naima Profile Photo */}
          <div className="relative z-20">
            <img
              src="/naima_avatar.jpg"
              alt="Naima in Voice Call"
              className={`w-44 h-44 sm:w-52 sm:h-52 rounded-full object-cover border-2 transition-all duration-300 shadow-2xl ${
                callPhase === 'speaking'
                  ? 'border-[#d4af37] scale-105 shadow-[0_0_35px_rgba(212,175,55,0.35)]'
                  : callPhase === 'listening'
                  ? 'border-emerald-400 scale-100 shadow-[0_0_30px_rgba(16,185,129,0.3)]'
                  : 'border-[#27272a] shadow-[0_0_20px_rgba(0,0,0,0.5)]'
              }`}
            />

            {/* Speaking audio wave animation badge */}
            {callPhase === 'speaking' && (
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#d4af37] text-[#0a0a0b] text-xs font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(212,175,55,0.4)]">
                <span className="w-1.5 h-3 bg-[#0a0a0b] voice-bar-1 rounded-full"></span>
                <span className="w-1.5 h-4 bg-[#0a0a0b] voice-bar-2 rounded-full"></span>
                <span className="w-1.5 h-3 bg-[#0a0a0b] voice-bar-3 rounded-full"></span>
                <span className="tracking-wide">Speaking</span>
              </div>
            )}

            {callPhase === 'listening' && (
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg">
                <Mic className="w-3.5 h-3.5 animate-pulse" />
                <span>Listening</span>
              </div>
            )}
          </div>
        </div>

        {/* Caller Info */}
        <div className="mt-8 text-center space-y-1">
          <h2 className="text-3xl font-serif italic tracking-widest text-[#d4af37] flex items-center justify-center gap-2">
            <span>NAIMA</span>
            <Heart className="w-4 h-4 fill-[#d4af37] text-[#d4af37]" />
          </h2>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#71717a] font-medium">
            Personal AI Companion · Dhaka
          </p>
        </div>

        {/* Live Subtitle Area */}
        <div
          id="call-subtitles"
          className="mt-6 max-w-lg w-full px-5 py-4 rounded-2xl bg-[#1c1c21] border border-[#27272a] text-center min-h-[76px] flex items-center justify-center shadow-xl"
        >
          {isProcessingTurn ? (
            <div className="flex items-center gap-2 text-[#d4af37] text-sm font-serif italic">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Naima is replying with love...</span>
            </div>
          ) : (
            <p className="text-sm sm:text-base font-serif italic text-[#f3e3ad] leading-relaxed">
              &ldquo;{currentSubtitle}&rdquo;
            </p>
          )}
        </div>

        {/* Last user speech preview */}
        {lastUserSpeech && (
          <p className="mt-2 text-xs text-[#71717a] font-mono italic">
            You: &ldquo;{lastUserSpeech}&rdquo;
          </p>
        )}

        {/* In-Call Text Input Drawer (if open or mic denied) */}
        {showTextInput && (
          <form
            onSubmit={handleSendManual}
            className="mt-4 w-full max-w-md flex items-center gap-2 px-2"
          >
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Type message to speak to Naima..."
              className="flex-1 px-4 py-2 rounded-full bg-[#1c1c21] border border-[#27272a] text-[#e2e2e7] text-sm outline-none focus:border-[#d4af37]"
            />
            <button
              type="submit"
              disabled={!manualInput.trim() || isProcessingTurn}
              className="p-2.5 rounded-full bg-[#d4af37] hover:bg-[#c49f27] text-[#0a0a0b] font-bold disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>

      {/* Bottom Voice Call Action Controls */}
      <div
        id="call-controls"
        className="pb-10 pt-4 px-6 max-w-md mx-auto w-full flex items-center justify-around z-20"
      >
        {/* 1. MUTE BUTTON */}
        <button
          id="call-mute-btn"
          onClick={toggleMute}
          className={`flex flex-col items-center gap-1.5 group cursor-pointer transition-all ${
            isMicMuted ? 'text-[#d4af37]' : 'text-[#a1a1aa] hover:text-white'
          }`}
        >
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center border transition-all ${
              isMicMuted
                ? 'bg-[#d4af37] text-[#0a0a0b] border-transparent font-bold shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                : 'bg-[#1c1c21] border-[#27272a] hover:bg-[#27272a]'
            }`}
          >
            {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </div>
          <span className="text-[11px] font-medium tracking-wide">{isMicMuted ? 'Unmute' : 'Mute'}</span>
        </button>

        {/* 2. BIG END CALL BUTTON */}
        <button
          id="call-end-btn"
          onClick={onEndCall}
          className="flex flex-col items-center gap-1.5 group cursor-pointer"
        >
          <div className="w-18 h-18 rounded-full bg-red-600 hover:bg-red-700 active:scale-95 text-white flex items-center justify-center shadow-[0_0_30px_rgba(220,38,38,0.4)] transition-all">
            <PhoneOff className="w-8 h-8" />
          </div>
          <span className="text-xs font-semibold text-red-400">End Call</span>
        </button>

        {/* 3. SPEAKER BUTTON */}
        <button
          id="call-speaker-btn"
          onClick={toggleSpeaker}
          className={`flex flex-col items-center gap-1.5 group cursor-pointer transition-all ${
            isSpeakerMuted ? 'text-[#d4af37]' : 'text-[#a1a1aa] hover:text-white'
          }`}
        >
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center border transition-all ${
              isSpeakerMuted
                ? 'bg-[#d4af37] text-[#0a0a0b] border-transparent font-bold shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                : 'bg-[#1c1c21] border-[#27272a] hover:bg-[#27272a]'
            }`}
          >
            {isSpeakerMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </div>
          <span className="text-[11px] font-medium tracking-wide">{isSpeakerMuted ? 'Speaker Off' : 'Speaker On'}</span>
        </button>
      </div>
    </div>
  );
};
