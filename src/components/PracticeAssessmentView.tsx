import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  BookOpen,
  Sparkles,
  Award,
  RotateCcw,
  Loader2,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { BOOK_CHAPTERS, getSectionById } from '../data/bookStructure';
import { EXERCISE_SETS } from '../data/bookExercises';
import type {
  AssessmentAttempt,
  ExerciseItem,
  ExerciseSet,
  MistakeRecord,
} from '../types/grammar';
import { SpeakButton } from './PronunciationBar';

interface PracticeAssessmentViewProps {
  initialSectionFilter?: string | null;
  revisionSectionIds?: string[] | null;
  onClearRevisionFilter: () => void;
  onRecordPracticeResult: (payload: {
    sectionId: string;
    chapterNumber: number;
    correctCount: number;
    totalCount: number;
    mistakes: Omit<MistakeRecord, 'id' | 'occurrences' | 'resolvedCount' | 'firstSeenAt' | 'lastSeenAt'>[];
  }) => void;
  onRecordAssessment: (attempt: Omit<AssessmentAttempt, 'id' | 'completedAt'>) => void;
  onOpenSection: (sectionId: string) => void;
}

function normalizeAnswer(val: string): string {
  return val
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.,!?]+$/g, '');
}

export function PracticeAssessmentView({
  initialSectionFilter,
  revisionSectionIds,
  onClearRevisionFilter,
  onRecordPracticeResult,
  onRecordAssessment,
  onOpenSection,
}: PracticeAssessmentViewProps) {
  const [mode, setMode] = useState<'practice' | 'assessment'>('practice');
  const [chapterFilter, setChapterFilter] = useState<number | 'ALL'>(() => {
    if (initialSectionFilter) {
      return getSectionById(initialSectionFilter)?.chapterNumber ?? 'ALL';
    }
    return 'ALL';
  });
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'book-original' | 'app-generated'>('ALL');
  const [activeSet, setActiveSet] = useState<ExerciseSet | null>(() => {
    if (initialSectionFilter) {
      const exact = EXERCISE_SETS.find((e) => e.sectionId === initialSectionFilter);
      if (exact) return exact;
      const ch = getSectionById(initialSectionFilter)?.chapterNumber;
      return EXERCISE_SETS.find((e) => e.chapterNumber === ch) || null;
    }
    return null;
  });

  // Active runner state (strictly NO answers revealed before submission!)
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [assessmentMeta, setAssessmentMeta] = useState<{
    mode: AssessmentAttempt['mode'];
    label: string;
    chapters: number[];
  } | null>(null);

  // Optional AI practice generation state
  const [aiChapter, setAiChapter] = useState<number>(1);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const filteredSets = useMemo(() => {
    return EXERCISE_SETS.filter((e) => {
      if (revisionSectionIds && revisionSectionIds.length > 0) {
        return revisionSectionIds.includes(e.sectionId);
      }
      if (chapterFilter !== 'ALL' && e.chapterNumber !== chapterFilter) return false;
      if (sourceFilter !== 'ALL' && e.source !== sourceFilter) return false;
      return true;
    });
  }, [chapterFilter, sourceFilter, revisionSectionIds]);

  const startExerciseSet = (
    set: ExerciseSet,
    meta?: { mode: AssessmentAttempt['mode']; label: string; chapters: number[] }
  ) => {
    setActiveSet(set);
    setAnswers({});
    setSubmitted(false);
    setAssessmentMeta(meta || null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const buildAssessment = (
    testMode: AssessmentAttempt['mode'],
    targetChapter?: number
  ) => {
    let pool: { item: ExerciseItem; set: ExerciseSet }[] = [];
    for (const set of EXERCISE_SETS) {
      if (testMode === 'chapter' && targetChapter && set.chapterNumber !== targetChapter) continue;
      for (const item of set.items) {
        pool.push({ item, set });
      }
    }
    // Deterministic spread across pool
    const limit = testMode === 'chapter' ? 8 : testMode === 'mixed' ? 10 : 15;
    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, limit);
    const chapters = Array.from(new Set(shuffled.map((p) => p.set.chapterNumber)));

    const syntheticSet: ExerciseSet = {
      id: `assessment-${testMode}-${Date.now()}`,
      title:
        testMode === 'chapter' && targetChapter
          ? `Chapter ${targetChapter} Assessment`
          : testMode === 'mixed'
            ? 'Mixed-Topic Grammar Assessment'
            : 'Cumulative Book Assessment (Chapters 1–15)',
      instructionEn:
        'Complete all questions below. Answers and detailed textbook explanations appear strictly after you submit.',
      chapterNumber: targetChapter || chapters[0] || 1,
      sectionId: shuffled[0]?.set.sectionId || '1.1',
      pageRef: `Chapters ${chapters.sort((a, b) => a - b).join(', ')}`,
      source: 'book-original',
      type: 'multiple-choice',
      items: shuffled.map((entry) => ({
        ...entry.item,
        id: `${entry.set.sectionId}::${entry.set.chapterNumber}::${entry.set.id}::${entry.item.id}`,
      })),
    };

    startExerciseSet(syntheticSet, {
      mode: testMode,
      label: syntheticSet.title,
      chapters,
    });
  };

  const handleGenerateAiPractice = async () => {
    const ch = BOOK_CHAPTERS.find((c) => c.number === aiChapter);
    if (!ch) return;
    const sec = ch.sections[0];
    setAiLoading(true);
    setAiError(null);
    try {
      const resp = await fetch('/api/generate-practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterNumber: ch.number,
          sectionId: sec.id,
          topicTitle: `${ch.titleDe} — ${ch.titleEn}`,
          ruleContext: sec.originalRuleSummary,
        }),
      });
      if (!resp.ok) {
        let msg = 'AI practice generation requires the Express backend server.';
        try {
          const d = await resp.json();
          if (d?.error) msg = d.error;
        } catch {
          // static host
        }
        throw new Error(msg);
      }
      const data = await resp.json();
      const generatedItems: ExerciseItem[] = (data.items || []).map(
        (raw: Record<string, unknown>, idx: number) => ({
          id: `ai-${ch.number}-${Date.now()}-${idx}`,
          prompt: String(raw.prompt || ''),
          options: Array.isArray(raw.options) ? raw.options.map(String) : undefined,
          acceptedAnswers: [String(raw.displayAnswer || '')],
          displayAnswer: String(raw.displayAnswer || ''),
          explanation: String(raw.explanation || ''),
          ruleSummary: String(raw.ruleSummary || `Ch ${ch.number}`),
          avoidMistakeTip: String(raw.avoidMistakeTip || ''),
          englishTranslation: raw.englishTranslation ? String(raw.englishTranslation) : undefined,
          errorCategory: String(raw.errorCategory || ch.titleEn),
        })
      );

      if (generatedItems.length === 0) {
        throw new Error('No practice questions were returned. Please try again.');
      }

      startExerciseSet({
        id: `ai-set-${ch.number}-${Date.now()}`,
        title: `AI-Generated Extra A1 Drill — Ch ${ch.number}: ${ch.titleEn}`,
        instructionEn:
          'Supplementary AI-Generated practice aligned to this textbook chapter. Submit all answers for instant feedback.',
        chapterNumber: ch.number,
        sectionId: sec.id,
        pageRef: ch.pageRange,
        source: 'ai-generated',
        type: 'multiple-choice',
        items: generatedItems,
      });
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Failed to generate AI practice.');
    } finally {
      setAiLoading(false);
    }
  };

  const evaluateItem = (item: ExerciseItem): boolean => {
    const userVal = normalizeAnswer(answers[item.id] || '');
    if (!userVal) return false;
    return item.acceptedAnswers.some((acc) => normalizeAnswer(acc) === userVal);
  };

  const handleSubmit = () => {
    if (!activeSet || submitted) return;
    setSubmitted(true);

    // Group results by section so real topic mastery & mistakes persist accurately
    const perSection = new Map<
      string,
      {
        chapterNumber: number;
        correct: number;
        total: number;
        mistakes: Omit<MistakeRecord, 'id' | 'occurrences' | 'resolvedCount' | 'firstSeenAt' | 'lastSeenAt'>[];
      }
    >();

    let totalCorrect = 0;
    const missedSections = new Set<string>();

    for (const item of activeSet.items) {
      const ok = evaluateItem(item);
      if (ok) totalCorrect++;

      // Unpack synthetic assessment metadata if present
      let secId = activeSet.sectionId;
      let chNum = activeSet.chapterNumber;
      let exId = activeSet.id;
      let origItemId = item.id;
      if (item.id.includes('::')) {
        const [s, c, e, orig] = item.id.split('::');
        secId = s;
        chNum = Number(c);
        exId = e;
        origItemId = orig;
      }

      if (!perSection.has(secId)) {
        perSection.set(secId, { chapterNumber: chNum, correct: 0, total: 0, mistakes: [] });
      }
      const bucket = perSection.get(secId)!;
      bucket.total++;
      if (ok) {
        bucket.correct++;
      } else {
        missedSections.add(secId);
        bucket.mistakes.push({
          sectionId: secId,
          chapterNumber: chNum,
          pageRef: activeSet.pageRef,
          exerciseId: exId,
          itemId: origItemId,
          prompt: item.prompt,
          userAnswer: answers[item.id] || '(blank)',
          correctAnswer: item.displayAnswer,
          errorType: item.errorCategory,
          explanation: `${item.explanation} (${item.ruleSummary})`,
        });
      }
    }

    perSection.forEach((data, secId) => {
      onRecordPracticeResult({
        sectionId: secId,
        chapterNumber: data.chapterNumber,
        correctCount: data.correct,
        totalCount: data.total,
        mistakes: data.mistakes,
      });
    });

    if (assessmentMeta) {
      const pct = Math.round((totalCorrect / Math.max(1, activeSet.items.length)) * 100);
      onRecordAssessment({
        mode: assessmentMeta.mode,
        label: assessmentMeta.label,
        chapterNumbers: assessmentMeta.chapters,
        scorePercent: pct,
        correctCount: totalCorrect,
        totalCount: activeSet.items.length,
        missedSectionIds: Array.from(missedSections),
      });
    }
  };

  // ==================== ACTIVE EXERCISE / ASSESSMENT RUNNER ====================
  if (activeSet) {
    const answeredCount = activeSet.items.filter((i) => (answers[i.id] || '').trim().length > 0).length;
    const correctCount = submitted ? activeSet.items.filter((i) => evaluateItem(i)).length : 0;
    const scorePct = submitted
      ? Math.round((correctCount / Math.max(1, activeSet.items.length)) * 100)
      : 0;

    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131C26] p-6 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setActiveSet(null)}
              className="text-xs font-semibold text-[#1E3A5F] dark:text-sky-400 hover:underline cursor-pointer"
            >
              ← Back to All Exercises & Assessments
            </button>
            <div className="flex items-center gap-2 text-xs font-mono">
              {activeSet.source === 'book-original' ? (
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                  Original Textbook · {activeSet.pageRef}
                  {activeSet.answerKeyPageRef ? ` · Key ${activeSet.answerKeyPageRef}` : ''}
                </span>
              ) : (
                <span className="text-sky-700 dark:text-sky-400 font-semibold">
                  {activeSet.source === 'ai-generated' ? 'AI-Generated Practice' : 'Application-Generated Drill'} · {activeSet.pageRef}
                </span>
              )}
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl font-display font-semibold text-slate-900 dark:text-white">
            {activeSet.title}
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-300">{activeSet.instructionEn}</p>

          {submitted && (
            <div
              className={`mt-4 rounded-xl border p-4 flex flex-wrap items-center justify-between gap-4 ${
                scorePct >= 80
                  ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/30'
                  : 'border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/30'
              }`}
            >
              <div className="space-y-0.5">
                <p className="text-base font-display font-semibold text-slate-900 dark:text-white tabular-nums">
                  Score: {correctCount} / {activeSet.items.length} ({scorePct}%)
                </p>
                <p className="text-xs text-slate-700 dark:text-slate-300">
                  {scorePct >= 80
                    ? 'Strong mastery! Your progress has been updated.'
                    : 'Any missed items have been logged in your Mistake Lab with their exact textbook rules for easy revision.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAnswers({});
                  setSubmitted(false);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry Set</span>
              </button>
            </div>
          )}
        </div>

        {/* Questions List */}
        <div className="space-y-4">
          {activeSet.items.map((item, idx) => {
            const val = answers[item.id] || '';
            const isCorrect = submitted ? evaluateItem(item) : false;

            return (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131C26] p-5 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[11px] font-mono text-slate-400">
                      Question {idx + 1} of {activeSet.items.length} · {item.errorCategory}
                    </span>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
                      {item.prompt}
                    </p>
                    {item.hint && !submitted && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">Hint: {item.hint}</p>
                    )}
                  </div>
                  <SpeakButton text={item.prompt.replace(/___+/g, '')} />
                </div>

                {/* Answer Input (Choice or Fill-in-the-Blank) */}
                {item.options && item.options.length > 0 ? (
                  <div className="space-y-2">
                    {item.options.map((opt) => {
                      const chosen = val === opt;
                      const isRightOpt = item.acceptedAnswers.some(
                        (a) => normalizeAnswer(a) === normalizeAnswer(opt)
                      );

                      let cls =
                        'border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 hover:border-[#1E3A5F]';
                      if (submitted) {
                        if (isRightOpt) {
                          cls =
                            'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-semibold';
                        } else if (chosen) {
                          cls =
                            'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200';
                        }
                      } else if (chosen) {
                        cls =
                          'border-[#1E3A5F] dark:border-sky-400 bg-sky-50/70 dark:bg-sky-950/40 text-slate-900 dark:text-white font-semibold';
                      }

                      return (
                        <button
                          key={opt}
                          type="button"
                          disabled={submitted}
                          onClick={() => setAnswers((prev) => ({ ...prev, [item.id]: opt }))}
                          className={`w-full text-left rounded-lg border px-3.5 py-2.5 text-xs transition-colors cursor-pointer disabled:cursor-default ${cls}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <input
                    type="text"
                    disabled={submitted}
                    value={val}
                    onChange={(e) => setAnswers((prev) => ({ ...prev, [item.id]: e.target.value }))}
                    placeholder="Type your German answer here..."
                    className="w-full max-w-md rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white disabled:opacity-75"
                  />
                )}

                {/* Detailed Post-Submission 5-Part Pedagogical Feedback */}
                {submitted && (
                  <div
                    className={`rounded-xl border p-4 text-xs space-y-1.5 ${
                      isCorrect
                        ? 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/25'
                        : 'border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/25'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={`font-semibold inline-flex items-center gap-1.5 ${
                          isCorrect
                            ? 'text-emerald-800 dark:text-emerald-300'
                            : 'text-rose-800 dark:text-rose-300'
                        }`}
                      >
                        {isCorrect ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                        <span>
                          {isCorrect
                            ? 'Correct!'
                            : `Incorrect — Official Answer: ${item.displayAnswer}`}
                        </span>
                      </p>
                      <SpeakButton text={item.displayAnswer} label="Hear Answer" />
                    </div>

                    <p className="text-slate-800 dark:text-slate-200">
                      <strong>Why:</strong> {item.explanation}
                    </p>
                    <p className="text-slate-700 dark:text-slate-300">
                      <strong>Rule & Book Reference:</strong> {item.ruleSummary}
                    </p>
                    {item.englishTranslation && (
                      <p className="italic text-slate-600 dark:text-slate-400">
                        English: “{item.englishTranslation}”
                      </p>
                    )}
                    <p className="text-[#1E3A5F] dark:text-sky-400">
                      <strong>Tip to remember:</strong> {item.avoidMistakeTip}
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        onOpenSection(
                          item.id.includes('::') ? item.id.split('::')[0] : activeSet.sectionId
                        )
                      }
                      className="underline font-semibold text-[#1E3A5F] dark:text-sky-400 cursor-pointer pt-1"
                    >
                      Review Textbook Lesson →
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Submit Bar */}
        {!submitted && (
          <div className="sticky bottom-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-[#131C26]/95 backdrop-blur p-4 flex flex-wrap items-center justify-between gap-3 shadow-md">
            <span className="text-xs text-slate-600 dark:text-slate-300 tabular-nums">
              Answered {answeredCount} of {activeSet.items.length} questions · Answers stay hidden until submission.
            </span>
            <button
              type="button"
              disabled={answeredCount === 0}
              onClick={handleSubmit}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1E3A5F] hover:bg-[#162C49] disabled:opacity-40 text-white px-5 py-2.5 text-xs font-semibold cursor-pointer"
            >
              <span>Submit & Grade Answers</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    );
  }

  // ==================== PRACTICE & ASSESSMENT HUB ====================
  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131C26] p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-semibold text-slate-900 dark:text-white">
              Grammar Practice Arena & Assessments
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Includes all 26 original textbook exercises (verified against official Keys pp. 183–191) plus clearly labeled Application-Generated A1 drills.
            </p>
          </div>

          <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-700 p-1 bg-slate-50 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => setMode('practice')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                mode === 'practice'
                  ? 'bg-[#1E3A5F] text-white'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Exercises (32 Sets)
            </button>
            <button
              type="button"
              onClick={() => setMode('assessment')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                mode === 'assessment'
                  ? 'bg-[#1E3A5F] text-white'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Graded Assessments
            </button>
          </div>
        </div>

        {revisionSectionIds && revisionSectionIds.length > 0 && (
          <div className="rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-4 py-2.5 flex items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
            <span>
              Targeted Revision Filter Active — Showing exercises for your weak sections ({revisionSectionIds.join(', ')}).
            </span>
            <button
              type="button"
              onClick={onClearRevisionFilter}
              className="underline font-semibold cursor-pointer"
            >
              Show All
            </button>
          </div>
        )}
      </header>

      {mode === 'practice' ? (
        <div className="space-y-6">
          {/* Filters + Optional AI Practice Generator */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={chapterFilter}
                onChange={(e) =>
                  setChapterFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))
                }
                aria-label="Filter by chapter"
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#131C26] px-3 py-2 text-xs text-slate-900 dark:text-white"
              >
                <option value="ALL">All 15 Chapters</option>
                {BOOK_CHAPTERS.map((c) => (
                  <option key={c.number} value={c.number}>
                    Ch {c.number}: {c.titleDe} ({c.titleEn})
                  </option>
                ))}
              </select>

              <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-[#131C26]">
                {(
                  [
                    ['ALL', 'All Sources'],
                    ['book-original', 'Official Book (Ex. 1–26)'],
                    ['app-generated', 'A1 Supplementary'],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSourceFilter(id)}
                    className={`px-3 py-2 text-xs cursor-pointer ${
                      sourceFilter === id
                        ? 'bg-[#1E3A5F] text-white font-semibold'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional AI Practice Generator */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={aiChapter}
                onChange={(e) => setAiChapter(Number(e.target.value))}
                aria-label="Choose chapter for AI practice"
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#131C26] px-2.5 py-2 text-xs text-slate-900 dark:text-white"
              >
                {BOOK_CHAPTERS.map((c) => (
                  <option key={c.number} value={c.number}>
                    Ch {c.number}: {c.titleEn}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={aiLoading}
                onClick={handleGenerateAiPractice}
                className="inline-flex items-center gap-1.5 rounded-lg border border-sky-600 dark:border-sky-500 text-sky-800 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/40 px-3 py-2 text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                {aiLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>Generate Extra AI Drill</span>
              </button>
            </div>
          </div>

          {aiError && (
            <div className="rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-4 py-2.5 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{aiError}</span>
            </div>
          )}

          {/* Exercise Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSets.map((ex) => (
              <div
                key={ex.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131C26] p-5 flex flex-col justify-between gap-4 hover:border-[#1E3A5F] dark:hover:border-sky-500 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
                    <span className="text-amber-700 dark:text-amber-400 font-semibold">
                      Ch {ex.chapterNumber} · Sec {ex.sectionId}
                    </span>
                    <span
                      className={
                        ex.source === 'book-original'
                          ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                          : 'text-sky-700 dark:text-sky-400'
                      }
                    >
                      {ex.source === 'book-original' ? (
                        <span className="inline-flex items-center gap-1">
                          <BookOpen className="w-3 h-3" /> Official Book
                        </span>
                      ) : (
                        'App-Generated A1'
                      )}
                    </span>
                  </div>

                  <h2 className="text-sm font-display font-semibold text-slate-900 dark:text-white">
                    {ex.title}
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {ex.instructionEn}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                    {ex.items.length} items · {ex.pageRef}
                  </span>
                  <button
                    type="button"
                    onClick={() => startExerciseSet(ex)}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#1E3A5F] hover:bg-[#162C49] text-white px-3 py-1.5 text-xs font-semibold cursor-pointer"
                  >
                    <span>Start</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ==================== GRADED ASSESSMENTS ==================== */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131C26] p-6 flex flex-col justify-between gap-4">
            <div className="space-y-2">
              <Award className="w-6 h-6 text-[#1E3A5F] dark:text-sky-400" />
              <h2 className="text-lg font-display font-semibold text-slate-900 dark:text-white">
                Chapter Test
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Assess your accuracy on a single chapter from the book. Updates your topic mastery and records an official assessment score.
              </p>
              <select
                value={aiChapter}
                onChange={(e) => setAiChapter(Number(e.target.value))}
                className="w-full mt-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white"
              >
                {BOOK_CHAPTERS.map((c) => (
                  <option key={c.number} value={c.number}>
                    Ch {c.number}: {c.titleDe} ({c.titleEn})
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => buildAssessment('chapter', aiChapter)}
              className="w-full rounded-xl bg-[#1E3A5F] hover:bg-[#162C49] text-white py-2.5 text-xs font-semibold cursor-pointer"
            >
              Start Chapter {aiChapter} Test
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131C26] p-6 flex flex-col justify-between gap-4">
            <div className="space-y-2">
              <Award className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              <h2 className="text-lg font-display font-semibold text-slate-900 dark:text-white">
                Mixed-Topic Assessment (10 Qs)
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                A balanced 10-question diagnostic drawn across articles, cases, pronouns, adjectives, word order, verbs, and prepositions.
              </p>
            </div>
            <button
              type="button"
              onClick={() => buildAssessment('mixed')}
              className="w-full rounded-xl bg-[#1E3A5F] hover:bg-[#162C49] text-white py-2.5 text-xs font-semibold cursor-pointer"
            >
              Start Mixed Assessment
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131C26] p-6 flex flex-col justify-between gap-4">
            <div className="space-y-2">
              <Award className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-lg font-display font-semibold text-slate-900 dark:text-white">
                Cumulative Book Exam (15 Qs)
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Comprehensive revision across all 15 chapters of <em>German Grammar in a Nutshell</em> with full post-exam diagnostics.
              </p>
            </div>
            <button
              type="button"
              onClick={() => buildAssessment('cumulative')}
              className="w-full rounded-xl bg-[#1E3A5F] hover:bg-[#162C49] text-white py-2.5 text-xs font-semibold cursor-pointer"
            >
              Start Cumulative Exam
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
