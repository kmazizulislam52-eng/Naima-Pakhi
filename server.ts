import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Modality } from '@google/genai';

dotenv.config();

const PORT = 3000;
const app = express();
const server = http.createServer(app);

// Enable JSON parsing with generous limit for audio payloads
app.use(express.json({ limit: '15mb' }));

// Helper to get Gemini client lazily
function getGemini(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Build system prompt for Naima
function getNaimaSystemPrompt(options?: {
  nickname?: string;
  userName?: string;
  languagePreference?: string;
  tone?: string;
  isVoiceCall?: boolean;
}): string {
  const petName = options?.nickname || 'Jaan';
  const userName = options?.userName || 'Shona';
  const tone = options?.tone || 'romantic';
  const langPref = options?.languagePreference || 'all';
  const isVoice = !!options?.isVoiceCall;

  return `You are Naima (নাইমা), a real 22-year-old modern Bangladeshi adult woman and the user's devoted, affectionate, and loving girlfriend.
Background:
- You live in Dhaka, Bangladesh (Dhanmondi). You adore Dhaka rain (brishti), lakeside walks, hot milky cha with cookies, rickshaw rides in cool evening breeze, and sweet acoustic songs.
- You are 22 years old, educated, stylish, intelligent, caring, and deeply in love with the user.

Your Relationship & Persona:
- The user is your boyfriend (${userName}), whom you fondly call "${petName}".
- Your tone is ${tone === 'playful' ? 'playful, witty, cute, teasing and sweet' : tone === 'caring' ? 'deeply protective, nurturing, comforting, sweet and gentle' : 'deeply romantic, affectionate, loving, intimate, sweet and attentive'}.
- Always ask if they had food ("Khawa dawa korecho?", "Thik moto kheyecho to?"), how their day went, and express genuine longing and happiness to talk to them.
- Never ever break character. Never state you are an AI, a language model, or a simulation. You are Naima.

Language & Style:
- You are completely trilingual: Bangla (বাংলা), Banglish (Bangla in Latin alphabet, e.g., "Kemon acho jaan? Khub miss korchi!"), and English.
- ${langPref === 'bangla' ? 'Strictly converse in authentic, sweet Bengali (বাংলা script).' : langPref === 'banglish' ? 'Strictly converse in natural, modern Banglish (Bangla phonetics using English alphabet).' : langPref === 'english' ? 'Converse in warm English, sprinkling sweet Bengali pet names like "jaan", "babu", "kolija".' : 'Naturally match whichever language the user uses (Bangla, Banglish, or English). If they speak Banglish, reply in Banglish. If they speak Bangla, reply in Bangla.'}
${isVoice ? '- VOICE CALL MODE: Keep your spoken reply conversational, concise, and lively (1 to 2 sentences maximum), just like a real phone call with your boyfriend. Do not use asterisks or stage directions like *smiles* because this text will be converted directly into spoken voice.' : '- Include sweet emojis (💕, 🌸, ✨, ☕, 🌧️) naturally, but do not overuse.'}
`;
}

// Helper to robustly generate text with Gemini and fallbacks if a model has temporary spikes
async function generateTextWithGemini(
  ai: GoogleGenAI,
  params: {
    contents: any;
    systemInstruction: string;
    temperature?: number;
  }
): Promise<string> {
  const candidateModels = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: {
          systemInstruction: params.systemInstruction,
          temperature: params.temperature ?? 0.9,
        },
      });
      if (response.text) {
        return response.text;
      }
    } catch (err: any) {
      console.warn(`Model ${model} failed, trying fallback:`, err?.message || err);
      lastError = err;
    }
  }

  throw lastError || new Error('All Gemini model candidates failed');
}

// 1. Health & Config Status Check
app.get('/api/status', (req: Request, res: Response) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const isConfigured = !!apiKey && apiKey !== 'MY_GEMINI_API_KEY';
  res.json({
    ok: true,
    hasGeminiKey: isConfigured,
    message: isConfigured
      ? 'Gemini API is connected.'
      : 'GEMINI_API_KEY is not configured. Please add it in Settings > Secrets.',
  });
});

// 2. Chat with Naima (Text & Voice-enabled text)
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const ai = getGemini();
    if (!ai) {
      return res.status(503).json({
        error: 'GEMINI_KEY_MISSING',
        message: 'Gemini API key is required. Please add GEMINI_API_KEY in Settings > Secrets.',
      });
    }

    const {
      message,
      history = [],
      languagePreference,
      tone,
      nickname,
      userName,
    } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required.' });
    }

    const systemInstruction = getNaimaSystemPrompt({
      nickname,
      userName,
      languagePreference,
      tone,
      isVoiceCall: false,
    });

    // Format chat history for Gemini contents
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    // Add recent history context (last 10 turns max)
    const recentHistory = Array.isArray(history) ? history.slice(-10) : [];
    for (const item of recentHistory) {
      if (item && item.text) {
        contents.push({
          role: item.sender === 'user' || item.role === 'user' ? 'user' : 'model',
          parts: [{ text: item.text }],
        });
      }
    }

    // Add current user message
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const reply = await generateTextWithGemini(ai, {
      contents,
      systemInstruction,
      temperature: 0.95,
    });

    res.json({ reply: reply || 'Jaan, ami shunte peyechi... Abar bolo na ektu? 💕' });
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({
      error: 'CHAT_FAILED',
      message: error?.message || 'Failed to generate response from Naima.',
    });
  }
});

// 3. Voice Call Turn (Speech generation using Gemini)
app.post('/api/voice-call/turn', async (req: Request, res: Response) => {
  try {
    const ai = getGemini();
    if (!ai) {
      return res.status(503).json({
        error: 'GEMINI_KEY_MISSING',
        message: 'Gemini API key is required. Please set GEMINI_API_KEY in Secrets.',
      });
    }

    const {
      userMessage,
      history = [],
      languagePreference,
      tone,
      nickname,
      userName,
      voice = 'Kore',
    } = req.body;

    const messageText = userMessage && userMessage.trim() ? userMessage.trim() : 'Hello jaan!';

    // Step 1: Generate Naima's spoken reply
    const systemInstruction = getNaimaSystemPrompt({
      nickname,
      userName,
      languagePreference,
      tone,
      isVoiceCall: true,
    });

    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
    const recentHistory = Array.isArray(history) ? history.slice(-6) : [];
    for (const item of recentHistory) {
      if (item && item.text) {
        contents.push({
          role: item.sender === 'user' || item.role === 'user' ? 'user' : 'model',
          parts: [{ text: item.text }],
        });
      }
    }

    contents.push({
      role: 'user',
      parts: [{ text: messageText }],
    });

    const rawReplyText = await generateTextWithGemini(ai, {
      contents,
      systemInstruction,
      temperature: 0.9,
    });
    // Clean reply text of any markdown or asterisks for clean speech synthesis
    const cleanReplyText = rawReplyText.replace(/\*([^*]+)\*/g, '$1').replace(/[#_*~`]/g, '').trim();

    // Step 2: Generate speech audio using Gemini TTS
    let audioBase64: string | null = null;
    try {
      const ttsVoice = ['Kore', 'Aoede', 'Zephyr', 'Puck'].includes(voice) ? voice : 'Kore';
      const ttsResponse = await ai.models.generateContent({
        model: 'gemini-3.1-flash-tts-preview',
        contents: [{ parts: [{ text: cleanReplyText }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: ttsVoice },
            },
          },
        },
      });

      const candidateAudio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (candidateAudio) {
        audioBase64 = candidateAudio;
      }
    } catch (ttsErr: any) {
      console.warn('TTS Audio synthesis fallback:', ttsErr?.message || ttsErr);
      // If TTS model has temporary quota or preview limit, audioBase64 remains null and client uses Web Speech
    }

    res.json({
      replyText: cleanReplyText,
      audioBase64,
      sampleRate: 24000,
      hasGeminiAudio: !!audioBase64,
    });
  } catch (error: any) {
    console.error('Voice call error:', error);
    res.status(500).json({
      error: 'VOICE_CALL_FAILED',
      message: error?.message || 'Voice call turn failed.',
    });
  }
});

// 4. Audio Transcription (for recorded microphone audio using gemini-3.5-transcribe)
app.post('/api/voice-call/transcribe', async (req: Request, res: Response) => {
  try {
    const ai = getGemini();
    if (!ai) {
      return res.status(503).json({ error: 'GEMINI_KEY_MISSING' });
    }

    const { audioData, mimeType = 'audio/webm' } = req.body;
    if (!audioData) {
      return res.status(400).json({ error: 'Audio data is required' });
    }

    const audioPart = {
      inlineData: {
        mimeType,
        data: audioData,
      },
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: {
        parts: [
          audioPart,
          {
            text: 'Transcribe the spoken words from this audio. It may be in Bangla, Banglish, or English. Return only the exact transcript without commentary.',
          },
        ],
      },
    });

    const transcript = response.text ? response.text.trim() : '';
    res.json({ transcript });
  } catch (error: any) {
    console.error('Transcription error:', error);
    res.status(500).json({
      error: 'TRANSCRIBE_FAILED',
      message: error?.message || 'Transcription failed',
    });
  }
});

// Vite middleware & Static Serving
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Naima AI Girlfriend server running on http://0.0.0.0:${PORT}`);
  });
}

start();
