import { useState } from 'react';
import {
  Sparkles,
  Search,
  AlertTriangle,
  BookmarkPlus,
  Loader2,
  ShieldCheck,
  Volume2,
} from 'lucide-react';
import {
  analyzeGermanSentenceLocally,
  analyzeGermanSentenceWithAI,
} from '../services/sentenceAnalyzer';
import { speechService } from '../services/speechService';
import type { NotebookEntry, SentenceAnalysisResult } from '../types/grammar';
import { SpeakButton } from './PronunciationBar';

interface SentenceAnalyzerViewProps {
  onOpenSection: (sectionId: string) => void;
  onSaveToNotebook: (entry: Omit<NotebookEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

const SAMPLE_SENTENCES = [
  'Herr Mayer gibt seinem Kollegen den Schlüssel.',
  'Ich fahre morgen mit dem Bus zur Arbeit.',
  'Der Film fängt um 20 Uhr an.',
  'Ich bleibe zu Hause, weil ich heute müde bin.',
  'Ich lege die Akte auf den Tisch.',
  'Könnten Sie mir bitte helfen?',
  'Wir sind gestern nach Berlin gefahren.',
];

export function SentenceAnalyzerView({
  onOpenSection,
  onSaveToNotebook,
}: SentenceAnalyzerViewProps) {
  const [input, setInput] = useState(SAMPLE_SENTENCES[0]);
  const [result, setResult] = useState<SentenceAnalysisResult>(() =>
    analyzeGermanSentenceLocally(SAMPLE_SENTENCES[0])
  );
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [savedToast, setSavedToast] = useState(false);

  const handleLocalAnalyze = (text = input) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setAiError(null);
    setResult(analyzeGermanSentenceLocally(trimmed));
  };

  const handleAiEnhance = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const aiRes = await analyzeGermanSentenceWithAI(trimmed);
      setResult(aiRes);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI analysis unavailable.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSave = () => {
    onSaveToNotebook({
      category: 'sentence',
      title: `Analyzed: ${result.sentence.slice(0, 48)}`,
      germanText: result.sentence,
      englishText: result.englishTranslation,
      content: `${result.clauseType}\nWord Order: ${result.wordOrderPattern}\nNotes: ${result.grammarNotes.join(' ')}`,
      chapterNumber: result.relatedChapters[0]?.chapterNumber,
      sectionId: result.relatedChapters[0]?.sectionId,
      source: result.source === 'ai-generated' ? 'ai-generated' : 'app-generated',
    });
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Input Workspace */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131C26] p-6 space-y-4">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-400">
            Application-Generated Analysis Workspace
          </p>
          <h1 className="text-2xl font-display font-semibold text-slate-900 dark:text-white">
            German Sentence Analyzer
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Enter or paste any German sentence to inspect word order, sentence brackets, articles, cases, verbs, and textbook chapter links. Works 100% offline with our deterministic Rule-Based Engine, with optional AI enhancement.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleLocalAnalyze();
            }}
            placeholder="Type a German sentence (e.g., Ich gebe meinem Freund ein Buch.)"
            className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
          />
          <button
            type="button"
            onClick={() => handleLocalAnalyze()}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#1E3A5F] hover:bg-[#162C49] text-white px-4 py-2.5 text-xs font-semibold cursor-pointer shrink-0"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Analyze (Rule-Based)</span>
          </button>
          <button
            type="button"
            disabled={aiLoading}
            onClick={handleAiEnhance}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-sky-600 dark:border-sky-500 text-sky-800 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/40 px-4 py-2.5 text-xs font-semibold cursor-pointer shrink-0 disabled:opacity-50"
          >
            {aiLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>Enhance with AI</span>
          </button>
        </div>

        {/* Sample Book Sentences */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-slate-500 mr-1">Try textbook sentences:</span>
          {SAMPLE_SENTENCES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setInput(s);
                handleLocalAnalyze(s);
              }}
              className="rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-[11px] text-slate-700 dark:text-slate-300 hover:border-[#1E3A5F] cursor-pointer"
            >
              {s}
            </button>
          ))}
        </div>

        {aiError && (
          <div className="rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-4 py-2.5 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{aiError}</span>
          </div>
        )}
      </section>

      {/* Analysis Result */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131C26] p-6 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {result.source === 'ai-generated' ? (
                <span className="inline-flex items-center gap-1 font-semibold text-sky-700 dark:text-sky-400">
                  <Sparkles className="w-3.5 h-3.5" /> AI-Generated Deep Analysis
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" /> Offline Rule-Based Analysis
                </span>
              )}
              <span className="text-slate-400">·</span>
              <span className="text-slate-600 dark:text-slate-400">{result.clauseType}</span>
            </div>
            <h2 className="text-xl font-display font-semibold text-slate-900 dark:text-white">
              {result.sentence}
            </h2>
            <p className="text-xs italic text-slate-600 dark:text-slate-300">
              {result.englishTranslation}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <SpeakButton text={result.sentence} size="md" label="Listen (1.0×)" rate={1.0} />
            <SpeakButton text={result.sentence} size="md" label="Slow (0.7×)" rate={0.7} />
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
              <span>{savedToast ? 'Saved to Notebook!' : 'Save Analysis'}</span>
            </button>
          </div>
        </div>

        {/* Sentence Bracket Blueprint */}
        {result.sentenceBracket && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Sentence Structure & Word Order ({result.wordOrderPattern})
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'Position 1', val: result.sentenceBracket.position1, highlight: false },
                { label: 'Finite Verb (Bracket Open)', val: result.sentenceBracket.finiteVerb, highlight: true },
                { label: 'Middle Field', val: result.sentenceBracket.middleField, highlight: false },
                { label: 'End Bracket', val: result.sentenceBracket.endBracket, highlight: result.sentenceBracket.endBracket !== '—' },
              ].map((slot) => (
                <div
                  key={slot.label}
                  className={`rounded-lg border p-3 ${
                    slot.highlight
                      ? 'border-sky-600/60 bg-sky-50/70 dark:bg-sky-950/30'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50'
                  }`}
                >
                  <p className="text-[10px] font-mono uppercase text-slate-500">{slot.label}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                    {slot.val}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Token-by-Token Cards */}
        <div className="space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Word-by-Word Grammatical Breakdown (click any word to pronounce)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {result.tokens.map((tok, i) => (
              <div
                key={`${tok.word}-${i}`}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50 p-3.5 space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => speechService.speak(tok.cleanWord, 0.85)}
                    className="inline-flex items-center gap-1.5 text-left group cursor-pointer"
                    title="Pronounce this German word"
                  >
                    <span className="text-base font-display font-semibold text-slate-900 dark:text-white group-hover:text-[#1E3A5F] dark:group-hover:text-sky-400">
                      {tok.word}
                    </span>
                    <Volume2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#1E3A5F]" />
                  </button>
                  <span
                    className={`text-[10px] font-mono uppercase ${
                      tok.confidence === 'rule-based'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : tok.confidence === 'ai-generated'
                          ? 'text-sky-700 dark:text-sky-400'
                          : 'text-amber-700 dark:text-amber-400'
                    }`}
                  >
                    {tok.confidence === 'rule-based'
                      ? '● Rule'
                      : tok.confidence === 'ai-generated'
                        ? '● AI'
                        : '▲ Uncertain'}
                  </span>
                </div>

                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {tok.partOfSpeech}
                  {tok.lemma && tok.lemma.toLowerCase() !== tok.cleanWord.toLowerCase()
                    ? ` (from ${tok.lemma})`
                    : ''}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">{tok.englishGloss}</p>

                {tok.gender && tok.gender !== 'unknown' && (
                  <p className="text-[11px] font-mono text-amber-700 dark:text-amber-400">
                    Gender: {tok.gender}
                  </p>
                )}
                {tok.caseInfo && (
                  <p className="text-[11px] text-[#1E3A5F] dark:text-sky-400">{tok.caseInfo}</p>
                )}
                {tok.verbInfo && (
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400">{tok.verbInfo}</p>
                )}
                {tok.notes && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    {tok.notes}
                  </p>
                )}
                {tok.bookRef && (
                  <button
                    type="button"
                    onClick={() => onOpenSection(tok.bookRef!.sectionId)}
                    className="text-[11px] font-medium underline text-[#1E3A5F] dark:text-sky-400 cursor-pointer pt-0.5"
                  >
                    Open {tok.bookRef.label}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Grammar Notes & Explicit Ambiguities */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-2 text-xs">
            <p className="font-semibold text-slate-900 dark:text-white">Grammar Observations</p>
            <ul className="list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-300">
              {result.grammarNotes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 p-4 space-y-2 text-xs">
            <p className="font-semibold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Ambiguities & Alternative Interpretations</span>
            </p>
            {result.ambiguities.length === 0 ? (
              <p className="text-slate-600 dark:text-slate-400">
                No major grammatical ambiguities detected in this sentence.
              </p>
            ) : (
              <ul className="list-disc pl-4 space-y-1 text-slate-700 dark:text-slate-300">
                {result.ambiguities.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
