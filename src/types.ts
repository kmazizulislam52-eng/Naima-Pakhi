export type AppTab = 'home' | 'chat' | 'call' | 'settings';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'naima';
  text: string;
  timestamp: number;
  audioBase64?: string;
  detectedLanguage?: string;
}

export type LanguagePreference =
  | 'auto'
  | 'bangla'
  | 'banglish'
  | 'english'
  | 'hindi'
  | 'urdu'
  | 'arabic'
  | 'spanish'
  | 'french'
  | 'chinese'
  | 'japanese'
  | 'korean';

export type GirlfriendTone = 'romantic' | 'playful' | 'caring';

// Supported Gemini Adult Female Voices
export type VoiceName = 'Aoede' | 'Kore' | 'Leda' | 'Callirrhoe';

export interface UserSettings {
  nickname: string; // What Naima calls the user (e.g. Jaan, Babu, Shona, Sweetheart)
  userName: string; // User's name
  languagePreference: LanguagePreference;
  tone: GirlfriendTone;
  voice: VoiceName;
  theme: 'dark' | 'light';
  autoVoicePlayback: boolean;
}

export interface CallStatus {
  status: 'idle' | 'calling' | 'connected' | 'speaking' | 'listening' | 'ended';
  duration: number; // in seconds
  isMuted: boolean;
  isSpeakerMuted: boolean;
}

export interface ApiStatus {
  ok: boolean;
  hasGeminiKey: boolean;
  message?: string;
}

