import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const MODEL_NAME = 'gemini-4-hydrogen';

function createGeminiClient(): GoogleGenAI | null {
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

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (_req, res) => {
    const hasKey = Boolean(
      process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'
    );
    res.json({ ok: true, aiConfigured: hasKey });
  });

  /**
   * POST /api/analyze-sentence
   * Optional AI-enhanced German sentence analysis tailored to a beginner/early A1 learner
   * and referencing chapters from "German Grammar in a Nutshell" (Langenscheidt).
   */
  app.post('/api/analyze-sentence', async (req, res) => {
    try {
      const rawSentence = typeof req.body?.sentence === 'string' ? req.body.sentence.trim() : '';
      if (!rawSentence || rawSentence.length > 320) {
        res.status(400).json({
          error: 'Please provide a valid German sentence (1–320 characters).',
        });
        return;
      }

      const ai = createGeminiClient();
      if (!ai) {
        res.status(503).json({
          error:
            'AI sentence enhancement is unavailable because GEMINI_API_KEY is not configured on this server. The built-in rule-based analyzer remains fully available offline.',
        });
        return;
      }

      const systemInstruction = `You are a patient German grammar instructor teaching a beginner (early A1) learner based strictly on the textbook "German Grammar in a Nutshell" by Langenscheidt (Chapters 1-15: 1 Articles, 2 Nouns, 3 Pronouns, 4 Adjectives, 5 Adverbs & Modal Particles, 6 Word Order, 7 Verbs/Modals/Prefixes, 8 Present & Imperative, 9 Past Tenses, 10 Future, 11 Subjunctive, 12 Passive, 13 Prepositions, 14 Sentence-Linkers, 15 Word Formation).
Explain in very simple English. Never pretend certainty when a German form is ambiguous (for example "sie" = she/they/formal you, or "der" = masc nom / fem dat / fem gen / pl gen). Explicitly list genuine ambiguities.`;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Analyze this German sentence for an early A1 beginner learner: "${rawSentence}"`,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              englishTranslation: { type: Type.STRING },
              wordOrderPattern: { type: Type.STRING },
              clauseType: { type: Type.STRING },
              sentenceBracket: {
                type: Type.OBJECT,
                properties: {
                  position1: { type: Type.STRING },
                  finiteVerb: { type: Type.STRING },
                  middleField: { type: Type.STRING },
                  endBracket: { type: Type.STRING },
                },
                required: ['position1', 'finiteVerb', 'middleField', 'endBracket'],
              },
              tokens: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    word: { type: Type.STRING },
                    lemma: { type: Type.STRING },
                    partOfSpeech: { type: Type.STRING },
                    englishGloss: { type: Type.STRING },
                    gender: { type: Type.STRING },
                    caseInfo: { type: Type.STRING },
                    grammaticalRole: { type: Type.STRING },
                    verbInfo: { type: Type.STRING },
                    chapterNumber: { type: Type.INTEGER },
                    sectionId: { type: Type.STRING },
                    notes: { type: Type.STRING },
                    alternatives: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                  },
                  required: ['word', 'partOfSpeech', 'englishGloss'],
                },
              },
              grammarNotes: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              ambiguities: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: [
              'englishTranslation',
              'wordOrderPattern',
              'clauseType',
              'tokens',
              'grammarNotes',
              'ambiguities',
            ],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json({
        sentence: rawSentence,
        ...parsed,
        source: 'ai-generated',
      });
    } catch (err) {
      console.error('[POST /api/analyze-sentence] error:', err);
      res.status(500).json({
        error: 'Failed to generate AI sentence analysis. Please try again or use the offline Rule-Based Analyzer.',
      });
    }
  });

  /**
   * POST /api/generate-practice
   * Generates clearly labeled AI supplementary A1 practice questions for a specific
   * verified chapter/section of "German Grammar in a Nutshell".
   */
  app.post('/api/generate-practice', async (req, res) => {
    try {
      const chapterNumber = Number(req.body?.chapterNumber);
      const sectionId = typeof req.body?.sectionId === 'string' ? req.body.sectionId.slice(0, 20) : '';
      const topicTitle = typeof req.body?.topicTitle === 'string' ? req.body.topicTitle.slice(0, 120) : '';
      const ruleContext = typeof req.body?.ruleContext === 'string' ? req.body.ruleContext.slice(0, 800) : '';

      if (!Number.isInteger(chapterNumber) || chapterNumber < 1 || chapterNumber > 15 || !topicTitle) {
        res.status(400).json({ error: 'Invalid chapter or topic context.' });
        return;
      }

      const ai = createGeminiClient();
      if (!ai) {
        res.status(503).json({
          error:
            'AI practice generation requires a server-side GEMINI_API_KEY. Built-in official textbook exercises (Exercises 1–26) and offline practice sets remain fully available.',
        });
        return;
      }

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Create 4 beginner (early A1) German grammar practice questions for Chapter ${chapterNumber} (${sectionId} — ${topicTitle}).
Rule reference from the textbook: ${ruleContext}
Keep vocabulary simple, practical, and everyday. Provide 4 multiple-choice options per question, exact correct answer matching one option, simple English explanation, rule summary, English translation, and a short tip to avoid the common mistake.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    prompt: { type: Type.STRING },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    displayAnswer: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                    ruleSummary: { type: Type.STRING },
                    avoidMistakeTip: { type: Type.STRING },
                    englishTranslation: { type: Type.STRING },
                    errorCategory: { type: Type.STRING },
                  },
                  required: [
                    'prompt',
                    'options',
                    'displayAnswer',
                    'explanation',
                    'ruleSummary',
                    'avoidMistakeTip',
                    'errorCategory',
                  ],
                },
              },
            },
            required: ['items'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{"items":[]}');
      res.json({
        chapterNumber,
        sectionId,
        source: 'ai-generated',
        items: Array.isArray(parsed.items) ? parsed.items : [],
      });
    } catch (err) {
      console.error('[POST /api/generate-practice] error:', err);
      res.status(500).json({
        error: 'Could not generate AI supplementary practice right now. Use the official book exercises or offline drills instead.',
      });
    }
  });

  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV !== 'production') {
    // Clear any previously installed dev service worker from browsers so stale
    // cached HTML never conflicts with Vite dev module transforms.
    app.get(['/dev-sw.js', '/sw.js'], (_req, res) => {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.send(`
        self.addEventListener('install', () => self.skipWaiting());
        self.addEventListener('activate', (event) => {
          event.waitUntil((async () => {
            try {
              const keys = await caches.keys();
              await Promise.all(keys.map((k) => caches.delete(k)));
              await self.registration.unregister();
            } catch {}
          })());
        });
      `);
    });

    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: {
          server: httpServer,
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`German Grammar in a Nutshell server running on http://localhost:${PORT}`);
  });
}

startServer();
