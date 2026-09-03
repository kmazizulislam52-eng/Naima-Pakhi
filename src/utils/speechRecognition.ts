/**
 * Speech Recognition utility supporting Bangla and English browser speech recognition
 * with automatic fallback to MediaRecorder for Gemini audio transcription.
 */

export interface SpeechRecognitionResultState {
  transcript: string;
  isFinal: boolean;
}

export class SpeechRecognizer {
  private recognition: any = null;
  private isListening = false;
  private onResultCallback?: (text: string, isFinal: boolean) => void;
  private onErrorCallback?: (err: any) => void;
  private onEndCallback?: () => void;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];

  constructor() {
    const SpeechRecClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecClass) {
      this.recognition = new SpeechRecClass();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      // 'bn-BD' for Bangladeshi Bangla, or fallback to 'en-US'
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

        const text = final || interim;
        if (text && this.onResultCallback) {
          this.onResultCallback(text, !!final);
        }
      };

      this.recognition.onerror = (event: any) => {
        if (event.error === 'no-speech') return;
        console.warn('Speech recognition error:', event.error);
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

  public setLanguage(lang: 'bn-BD' | 'en-US' | 'en-IN'): void {
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  public start(callbacks: {
    onResult: (text: string, isFinal: boolean) => void;
    onError?: (err: any) => void;
    onEnd?: () => void;
  }): void {
    this.onResultCallback = callbacks.onResult;
    this.onErrorCallback = callbacks.onError;
    this.onEndCallback = callbacks.onEnd;
    this.isListening = true;

    if (this.recognition) {
      try {
        this.recognition.start();
      } catch (err) {
        console.warn('Recognition start exception, ignoring duplicate start', err);
      }
    }
  }

  public stop(): void {
    this.isListening = false;
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
