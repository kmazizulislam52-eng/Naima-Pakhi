/**
 * Speech Recognition utility supporting multilingual browser speech recognition
 * (Bangla, English, Hindi, Urdu, Arabic, Spanish, French, Chinese, Japanese, Korean, etc.)
 * with automatic utterance pause detection and MediaRecorder capture.
 */

export interface SpeechRecognitionResultState {
  transcript: string;
  isFinal: boolean;
}

export class SpeechRecognizer {
  private recognition: any = null;
  private isListening = false;
  private onResultCallback?: (text: string, isFinal: boolean) => void;
  private onUtteranceCompleteCallback?: (text: string) => void;
  private onErrorCallback?: (err: any) => void;
  private onEndCallback?: () => void;
  private silenceTimer: any = null;
  private currentSpokenText = '';
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];

  constructor() {
    const SpeechRecClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecClass) {
      this.recognition = new SpeechRecClass();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      // Default to Bengali or user's preference
      this.recognition.lang = 'bn-BD';

      this.recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        const text = (final || interim).trim();
        if (text) {
          this.currentSpokenText = text;
          if (this.onResultCallback) {
            this.onResultCallback(text, !!final);
          }

          // Clear previous silence timer
          if (this.silenceTimer) {
            clearTimeout(this.silenceTimer);
            this.silenceTimer = null;
          }

          // If speech is marked final or silence occurs for 1.3s, fire utterance complete
          if (final) {
            if (this.onUtteranceCompleteCallback) {
              this.onUtteranceCompleteCallback(this.currentSpokenText);
              this.currentSpokenText = '';
            }
          } else {
            this.silenceTimer = setTimeout(() => {
              if (this.currentSpokenText.trim() && this.onUtteranceCompleteCallback) {
                this.onUtteranceCompleteCallback(this.currentSpokenText);
                this.currentSpokenText = '';
              }
            }, 1300);
          }
        }
      };

      this.recognition.onerror = (event: any) => {
        if (event.error === 'no-speech') return;
        console.warn('Speech recognition notice:', event.error);
        if (this.onErrorCallback) this.onErrorCallback(event.error);
      };

      this.recognition.onend = () => {
        if (this.isListening) {
          try {
            this.recognition.start();
          } catch (e) {
            this.isListening = false;
            if (this.onEndCallback) this.onEndCallback();
          }
        } else {
          if (this.onEndCallback) this.onEndCallback();
        }
      };
    }
  }

  public setLanguage(lang: string): void {
    if (this.recognition) {
      // Map friendly language preference to BCP-47 tags
      const langMap: Record<string, string> = {
        bangla: 'bn-BD',
        banglish: 'bn-BD',
        english: 'en-US',
        hindi: 'hi-IN',
        urdu: 'ur-PK',
        arabic: 'ar-SA',
        spanish: 'es-ES',
        french: 'fr-FR',
        chinese: 'zh-CN',
        japanese: 'ja-JP',
        korean: 'ko-KR',
      };
      this.recognition.lang = langMap[lang.toLowerCase()] || lang || 'bn-BD';
    }
  }

  public start(callbacks: {
    onResult: (text: string, isFinal: boolean) => void;
    onUtteranceComplete?: (text: string) => void;
    onError?: (err: any) => void;
    onEnd?: () => void;
  }): void {
    this.onResultCallback = callbacks.onResult;
    this.onUtteranceCompleteCallback = callbacks.onUtteranceComplete;
    this.onErrorCallback = callbacks.onError;
    this.onEndCallback = callbacks.onEnd;
    this.isListening = true;
    this.currentSpokenText = '';

    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }

    if (this.recognition) {
      try {
        this.recognition.start();
      } catch (err) {
        // Recognition may already be running
      }
    }
  }

  public stop(): void {
    this.isListening = false;
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
    }
  }

  public isSupported(): boolean {
    return !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition;
  }
}
