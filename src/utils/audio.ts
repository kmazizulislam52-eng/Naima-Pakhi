/**
 * Audio playback and speech handling utilities
 * Supports Gemini 24kHz raw PCM little-endian playback,
 * Web Speech API synthesis fallback, and mic recording.
 */

let activeAudioContext: AudioContext | null = null;
let currentSourceNode: AudioBufferSourceNode | null = null;
let currentGainNode: GainNode | null = null;

export function getAudioContext(): AudioContext {
  if (!activeAudioContext || activeAudioContext.state === 'closed') {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    activeAudioContext = new AudioContextClass({ sampleRate: 24000 });
  }
  if (activeAudioContext.state === 'suspended') {
    activeAudioContext.resume().catch(console.error);
  }
  return activeAudioContext;
}

/**
 * Stop any playing audio (Gemini PCM or browser speech)
 */
export function stopAllAudio(): void {
  try {
    if (currentSourceNode) {
      currentSourceNode.stop();
      currentSourceNode.disconnect();
      currentSourceNode = null;
    }
  } catch (e) {
    // ignore
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Play raw 16-bit PCM audio (24kHz) returned by Gemini TTS
 */
export function playGeminiPCM(
  base64Audio: string,
  options?: {
    isSpeakerMuted?: boolean;
    onEnded?: () => void;
  }
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      stopAllAudio();

      if (options?.isSpeakerMuted) {
        if (options?.onEnded) options.onEnded();
        resolve();
        return;
      }

      const ctx = getAudioContext();
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }

      const audioBuffer = ctx.createBuffer(1, float32Array.length, 24000);
      audioBuffer.copyToChannel(float32Array, 0);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;

      const gain = ctx.createGain();
      gain.gain.value = options?.isSpeakerMuted ? 0 : 1;
      currentGainNode = gain;

      source.connect(gain);
      gain.connect(ctx.destination);

      source.onended = () => {
        currentSourceNode = null;
        if (options?.onEnded) options.onEnded();
        resolve();
      };

      currentSourceNode = source;
      source.start();
    } catch (err) {
      console.error('PCM playback failed:', err);
      reject(err);
    }
  });
}

/**
 * Fallback Web Speech Synthesis for spoken text
 */
export function speakWithBrowser(
  text: string,
  options?: {
    isSpeakerMuted?: boolean;
    langCode?: string;
    onEnded?: () => void;
  }
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (options?.onEnded) options.onEnded();
    return;
  }

  stopAllAudio();

  if (options?.isSpeakerMuted) {
    if (options?.onEnded) options.onEnded();
    return;
  }

  // Remove asterisks, hashtags or emojis that cause weird speech
  const clean = text.replace(/[\*#_~`]/g, '').replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '');

  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.pitch = 1.1; // Gentle sweet pitch for adult girlfriend persona
  utterance.rate = 1.0;

  if (options?.langCode) {
    utterance.lang = options.langCode;
  }

  // Find most natural female voice for the language or general
  const voices = window.speechSynthesis.getVoices();
  const targetLang = options?.langCode?.toLowerCase().slice(0, 2);

  let femaleVoice = voices.find(
    (v) =>
      (!targetLang || v.lang.toLowerCase().startsWith(targetLang)) &&
      (v.name.toLowerCase().includes('female') ||
        v.name.toLowerCase().includes('natural') ||
        v.name.toLowerCase().includes('samantha') ||
        v.name.toLowerCase().includes('karen') ||
        v.name.toLowerCase().includes('victoria') ||
        v.name.toLowerCase().includes('google') ||
        v.name.toLowerCase().includes('zira')) &&
      !v.name.toLowerCase().includes('male')
  );

  if (!femaleVoice && targetLang) {
    femaleVoice = voices.find((v) => v.lang.toLowerCase().startsWith(targetLang));
  }

  if (femaleVoice) {
    utterance.voice = femaleVoice;
  }

  utterance.onend = () => {
    if (options?.onEnded) options.onEnded();
  };

  utterance.onerror = () => {
    if (options?.onEnded) options.onEnded();
  };

  window.speechSynthesis.speak(utterance);
}

/**
 * Set current speaker mute state
 */
export function setSpeakerMute(isMuted: boolean): void {
  if (currentGainNode) {
    currentGainNode.gain.value = isMuted ? 0 : 1;
  }
  if (isMuted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
