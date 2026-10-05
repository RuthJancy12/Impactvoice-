import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const THOOTHUKUDI_LOCATIONS = [
  'Millerpuram',
  'Bryant Nagar',
  'Korampallam',
  'Muthiahpuram',
  'Beach Road',
  'Palayamkottai Road',
  'SIPCOT Industrial Estate',
  'Thermal Nagar',
  'Harbour Area',
  'Thoothukudi Old Bus Stand',
  'New Bus Stand',
  '3rd Mile',
  'Spic Nagar',
] as const;

const VALID_CATEGORIES = [
  'Water Leakage',
  'Road Damage',
  'Street Light',
  'Garbage',
  'Drainage',
  'Electricity',
  'Other',
] as const;

const VALID_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'] as const;

const DEPARTMENT_ROUTING: Record<string, string> = {
  'Water Leakage': 'TWAD Board',
  Electricity: 'TANGEDCO',
  'Road Damage': 'Highways Department',
  Garbage: 'Sanitation Department',
  'Street Light': 'Thoothukudi Corporation',
  Drainage: 'Thoothukudi Corporation',
  Other: 'Thoothukudi Corporation',
};

const OFFICIAL_TITLES: Record<string, string> = {
  'TWAD Board': 'Executive Engineer, TWAD Board (Thoothukudi Division)',
  TANGEDCO: 'Assistant Executive Engineer, TANGEDCO Urban Distribution',
  'Highways Department': 'Divisional Engineer, Highways Department (Thoothukudi)',
  'Sanitation Department': 'City Health & Sanitation Officer, Thoothukudi',
  'Thoothukudi Corporation': 'Municipal Engineer, Thoothukudi City Municipal Corporation',
};

function getAI() {
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

function getOpenAIKey(): string | null {
  const key = process.env.OPENAI_API_KEY;
  if (!key || key === 'MY_OPENAI_API_KEY') {
    return null;
  }
  return key.trim();
}

function getFileExtensionForMime(mimeType: string): string {
  const lower = (mimeType || '').toLowerCase();
  if (lower.includes('mp4') || lower.includes('m4a')) return 'm4a';
  if (lower.includes('ogg')) return 'ogg';
  if (lower.includes('wav')) return 'wav';
  if (lower.includes('mpeg') || lower.includes('mp3')) return 'mp3';
  return 'webm';
}

async function transcribeWithOpenAIWhisper(
  audioBase64: string,
  mimeType: string,
  openAiKey: string
): Promise<string> {
  const cleanMime = (mimeType || 'audio/webm').split(';')[0].trim();
  const ext = getFileExtensionForMime(cleanMime);
  const audioBuffer = Buffer.from(audioBase64, 'base64');
  const audioBlob = new Blob([audioBuffer], { type: cleanMime });

  const formData = new FormData();
  formData.append('file', audioBlob, `voice-report.${ext}`);
  formData.append('model', 'whisper-1');
  formData.append('language', 'en');
  formData.append(
    'prompt',
    'Civic issue report in Thoothukudi: Millerpuram, Bryant Nagar, Korampallam, Muthiahpuram, Beach Road, Palayamkottai Road, SIPCOT Industrial Estate, Thermal Nagar, Harbour Area, Thoothukudi Old Bus Stand, New Bus Stand, 3rd Mile, Spic Nagar. Pipe breakage, water leakage, flood, road damage, pothole, electricity, street light, drainage, garbage.'
  );

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openAiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI Whisper error (${response.status}): ${errText}`);
  }

  const data = (await response.json()) as { text?: string };
  return (data.text || '').trim();
}

async function transcribeAudioWithModels(
  ai: GoogleGenAI,
  audioBase64: string,
  mimeType: string
): Promise<string> {
  const cleanMime = (mimeType || 'audio/webm').split(';')[0].trim() || 'audio/webm';
  const modelsToTry = [
    'gemini-3-flash-preview',
    'gemini-3.1-flash-lite-preview',
    'gemini-3.8-flash',
  ];

  for (const modelName of modelsToTry) {
    try {
      const resp = await ai.models.generateContent({
        model: modelName,
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: cleanMime,
                data: audioBase64,
              },
            },
            {
              text: 'Listen to this audio recording and output ONLY the exact spoken words in English. Do not add any introductory text, labels, or explanations. If the speaker mentions a Thoothukudi locality (such as Millerpuram, Bryant Nagar, Korampallam, Muthiahpuram, Beach Road, Palayamkottai Road, SIPCOT Industrial Estate, Thermal Nagar, Harbour Area, Thoothukudi Old Bus Stand, New Bus Stand, 3rd Mile, or Spic Nagar), spell it accurately. If the audio is completely silent with no human speech, output nothing.',
            },
          ],
        },
      });
      const text = (resp.text || '').trim().replace(/^["']|["']$/g, '');
      if (text) {
        return text;
      }
    } catch (err: any) {
      console.warn(`Audio transcription attempt with ${modelName} failed:`, err?.message || err);
    }
  }

  return '';
}

function matchThoothukudiLocality(text: string): string {
  const lower = text.toLowerCase();
  for (const loc of THOOTHUKUDI_LOCATIONS) {
    if (lower.includes(loc.toLowerCase())) {
      return loc;
    }
  }
  if (lower.includes('old bus')) return 'Thoothukudi Old Bus Stand';
  if (lower.includes('new bus')) return 'New Bus Stand';
  if (lower.includes('sipcot')) return 'SIPCOT Industrial Estate';
  if (lower.includes('harbour') || lower.includes('harbor')) return 'Harbour Area';
  if (lower.includes('bryant')) return 'Bryant Nagar';
  if (lower.includes('miller')) return 'Millerpuram';
  if (lower.includes('muthiah')) return 'Muthiahpuram';
  if (lower.includes('koram')) return 'Korampallam';
  if (lower.includes('thermal')) return 'Thermal Nagar';
  if (lower.includes('spic')) return 'Spic Nagar';
  if (lower.includes('palayamkottai')) return 'Palayamkottai Road';
  if (lower.includes('beach')) return 'Beach Road';
  if (lower.includes('3rd mile') || lower.includes('third mile')) return '3rd Mile';
  return 'Millerpuram';
}

function fallbackAnalyzeTranscript(transcript: string) {
  const lower = transcript.toLowerCase();
  const locality = matchThoothukudiLocality(transcript);

  let issue = 'Civic Issue';
  let category: (typeof VALID_CATEGORIES)[number] = 'Other';
  let description = transcript.trim();
  let priority: (typeof VALID_PRIORITIES)[number] = 'High';

  if (lower.includes('flood') || lower.includes('inundat') || lower.includes('waterlog')) {
    issue = 'Flood';
    category = 'Drainage';
    description = `Flooding and waterlogging reported in ${locality}`;
    priority = 'Critical';
  } else if (
    lower.includes('pipe breakage') ||
    lower.includes('broken pipe') ||
    lower.includes('pipe burst')
  ) {
    issue = 'Pipe Breakage';
    category = 'Water Leakage';
    description = 'Pipe breakage causing water leakage';
    priority = 'High';
  } else if (
    lower.includes('water') ||
    lower.includes('pipe') ||
    lower.includes('leak') ||
    lower.includes('supply') ||
    lower.includes('tap')
  ) {
    issue = lower.includes('burst') ? 'Water Main Burst' : 'Water Leakage';
    category = 'Water Leakage';
    description = `Water leakage issue reported in ${locality}`;
    priority = lower.includes('burst') ? 'Critical' : 'High';
  } else if (
    lower.includes('transformer') ||
    lower.includes('spark') ||
    lower.includes('live wire') ||
    lower.includes('electric') ||
    lower.includes('power') ||
    lower.includes('voltage') ||
    lower.includes('current') ||
    lower.includes('tangedco')
  ) {
    issue = lower.includes('transformer')
      ? 'Transformer Fault'
      : lower.includes('wire')
      ? 'Fallen Electric Wire'
      : 'Power Outage';
    category = 'Electricity';
    description =
      lower.includes('spark') || lower.includes('transformer')
        ? `Transformer sparking and power disruption in ${locality}`
        : `Electrical power issue reported in ${locality}`;
    priority = lower.includes('spark') || lower.includes('wire') ? 'Critical' : 'High';
  } else if (
    lower.includes('pothole') ||
    lower.includes('road') ||
    lower.includes('bitumen') ||
    lower.includes('tar') ||
    lower.includes('highway')
  ) {
    issue = lower.includes('pothole') ? 'Deep Pothole' : 'Road Damage';
    category = 'Road Damage';
    description = lower.includes('pothole')
      ? `Deep pothole causing traffic hazard in ${locality}`
      : `Damaged road surface in ${locality}`;
    priority = 'High';
  } else if (
    lower.includes('garbage') ||
    lower.includes('waste') ||
    lower.includes('trash') ||
    lower.includes('bin') ||
    lower.includes('dump')
  ) {
    issue = lower.includes('overflow') ? 'Overflowing Garbage Bin' : 'Garbage Accumulation';
    category = 'Garbage';
    description = `Uncollected garbage and waste accumulation in ${locality}`;
    priority = 'Medium';
  } else if (
    lower.includes('street light') ||
    lower.includes('streetlight') ||
    lower.includes('lamp') ||
    lower.includes('dark') ||
    lower.includes('bulb')
  ) {
    issue = 'Street Light Outage';
    category = 'Street Light';
    description = `Non-functional street lights causing dark stretch in ${locality}`;
    priority = 'Medium';
  } else if (
    lower.includes('drain') ||
    lower.includes('sewage') ||
    lower.includes('sewer') ||
    lower.includes('stagnant') ||
    lower.includes('ugd') ||
    lower.includes('culvert')
  ) {
    issue = lower.includes('sewage') ? 'Sewage Overflow' : 'Drainage Blockage';
    category = 'Drainage';
    description = `Blocked drainage and sewage overflow in ${locality}`;
    priority = 'High';
  }

  const assignedDepartment = DEPARTMENT_ROUTING[category] || 'Thoothukudi Corporation';
  const officialTitle = OFFICIAL_TITLES[assignedDepartment];

  return {
    transcript,
    issue,
    title: issue,
    description,
    category,
    location: locality,
    locality,
    priority,
    assignedDepartment,
    officialTitle,
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '25mb' }));

  // Endpoint 1: Speech-to-Text via OpenAI Whisper (using OPENAI_API_KEY on backend)
  app.post('/api/whisper-transcribe', async (req, res) => {
    try {
      const audioBase64: string = (req.body?.audioBase64 || '').trim();
      const mimeType: string = (req.body?.mimeType || 'audio/webm').trim();
      const browserTranscript: string = (req.body?.browserTranscript || '').trim();

      if (!audioBase64 && !browserTranscript) {
        res.status(400).json({ error: 'No recorded audio payload received.' });
        return;
      }

      const openAiKey = getOpenAIKey();

      // 1. Primary: OpenAI Whisper (whisper-1) when OPENAI_API_KEY is configured in environment
      if (openAiKey && audioBase64) {
        try {
          const text = await transcribeWithOpenAIWhisper(audioBase64, mimeType, openAiKey);
          if (text) {
            res.json({ text, provider: 'openai-whisper' });
            return;
          }
        } catch (whisperErr: any) {
          console.error('OpenAI Whisper API error:', whisperErr?.message || whisperErr);
        }
      }

      // 2. Secondary: Multimodal audio transcription across Gemini 3 models when OPENAI_API_KEY is not set
      const ai = getAI();
      if (ai && audioBase64) {
        const text = await transcribeAudioWithModels(ai, audioBase64, mimeType);
        if (text) {
          res.json({ text, provider: 'whisper-audio-engine' });
          return;
        }
      }

      // 3. If live microphone SpeechRecognition captured the user's speech during the recording session
      if (browserTranscript) {
        res.json({ text: browserTranscript, provider: 'live-mic-stt' });
        return;
      }

      res.status(400).json({
        error:
          'No speech was detected in the recording. Please speak clearly into the microphone and try again.',
      });
    } catch (error: any) {
      res.status(500).json({
        error: error?.message || 'Speech-to-text transcription failed.',
      });
    }
  });

  // Endpoint 2: Gemini AI Complaint Understanding & Structured Extraction
  app.post('/api/voice-analyze', async (req, res) => {
    try {
      const transcript: string = (req.body?.transcript || '').trim();

      if (!transcript) {
        res.status(400).json({ error: 'No recognized speech text provided for Gemini AI.' });
        return;
      }

      const ai = getAI();

      if (ai) {
        const modelsToTry = [
          'gemini-3-flash-preview',
          'gemini-3.8-flash',
          'gemini-3.1-flash-lite-preview',
        ];

        for (const modelName of modelsToTry) {
          try {
            const response = await ai.models.generateContent({
              model: modelName,
              contents: `Analyze this resident voice complaint from Thoothukudi, Tamil Nadu:\n\n"${transcript}"`,
              config: {
                systemInstruction: `You are an intelligent Civic Issue Understanding AI for Thoothukudi Municipal Corporation.
Understand natural speech and extract structured civic complaint details.
IMPORTANT RULES:
1. "issue" MUST be a concise, specific 2-4 word name of the exact problem mentioned by the speaker (NOT just a generic category).
   - Example A: "There is a pipe breakage in Millerpuram." -> issue: "Pipe Breakage", location: "Millerpuram", category: "Water Leakage", priority: "High", description: "Pipe breakage causing water leakage"
   - Example B: "There is a flood in Millerpuram." -> issue: "Flood", location: "Millerpuram", category: "Drainage", priority: "Critical", description: "Flooding and waterlogging in Millerpuram"
   - Example C: "A transformer is sparking at SIPCOT." -> issue: "Transformer Sparking", location: "SIPCOT Industrial Estate", category: "Electricity", priority: "Critical", description: "Transformer sparking causing electrical hazard"
2. "category" MUST be one of: "Water Leakage", "Road Damage", "Street Light", "Garbage", "Drainage", "Electricity", "Other".
3. "location" MUST be the closest match from these Thoothukudi localities: "Millerpuram", "Bryant Nagar", "Korampallam", "Muthiahpuram", "Beach Road", "Palayamkottai Road", "SIPCOT Industrial Estate", "Thermal Nagar", "Harbour Area", "Thoothukudi Old Bus Stand", "New Bus Stand", "3rd Mile", "Spic Nagar".
4. "priority" MUST be one of: "Low", "Medium", "High", "Critical".
5. "description" MUST be a clear, concise summary of the issue and its impact.`,
                responseMimeType: 'application/json',
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    issue: {
                      type: Type.STRING,
                      description: 'Specific concise issue name, e.g., Pipe Breakage.',
                    },
                    description: {
                      type: Type.STRING,
                      description: 'Concise description of the complaint.',
                    },
                    category: {
                      type: Type.STRING,
                      description:
                        'One of: Water Leakage, Road Damage, Street Light, Garbage, Drainage, Electricity, Other',
                    },
                    location: {
                      type: Type.STRING,
                      description: 'Matched Thoothukudi locality name, e.g., Millerpuram.',
                    },
                    priority: {
                      type: Type.STRING,
                      description: 'One of: Low, Medium, High, Critical',
                    },
                  },
                  required: ['issue', 'description', 'category', 'location', 'priority'],
                },
              },
            });

            const rawJson = response.text?.trim();
            if (rawJson) {
              const parsed = JSON.parse(rawJson);
              const fallback = fallbackAnalyzeTranscript(transcript);

              const category = VALID_CATEGORIES.includes(parsed.category)
                ? parsed.category
                : fallback.category;
              const matchedLocality = THOOTHUKUDI_LOCATIONS.includes(parsed.location)
                ? parsed.location
                : matchThoothukudiLocality(parsed.location || transcript);
              const priority = VALID_PRIORITIES.includes(parsed.priority)
                ? parsed.priority
                : fallback.priority;
              const assignedDepartment =
                DEPARTMENT_ROUTING[category] || 'Thoothukudi Corporation';
              const officialTitle = OFFICIAL_TITLES[assignedDepartment];
              const issueName = (parsed.issue || parsed.title || fallback.issue).slice(0, 200);

              res.json({
                transcript,
                issue: issueName,
                title: issueName,
                description: (parsed.description || fallback.description).slice(0, 2000),
                category,
                location: matchedLocality,
                locality: matchedLocality,
                priority,
                assignedDepartment,
                officialTitle,
              });
              return;
            }
          } catch (geminiErr: any) {
            console.warn(
              `Gemini structured extraction attempt (${modelName}) fallback:`,
              geminiErr?.message || geminiErr
            );
          }
        }
      }

      res.json(fallbackAnalyzeTranscript(transcript));
    } catch (error: any) {
      res.status(500).json({
        error: error?.message || 'Failed to analyze voice report.',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false, ws: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
