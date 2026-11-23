import { useState } from 'react';
import {
  BookOpen,
  Sparkles,
  CheckCircle2,
  BookmarkPlus,
  Clock,
  ArrowRight,
  AlertTriangle,
  ExternalLink,
  Check,
  X,
} from 'lucide-react';
import { BOOK_CHAPTERS, getSectionById } from '../data/bookStructure';
import { getExercisesBySection } from '../data/bookExercises';
import type { BookSection, NotebookEntry, TopicProgress } from '../types/grammar';
import { SpeakButton } from './PronunciationBar';

interface LearningPathViewProps {
  selectedSectionId: string;
  progressMap: Record<string, TopicProgress>;
  onSelectSection: (sectionId: string) => void;
  onMarkReadingComplete: (sectionId: string) => void;
  onOpenInReader: (anchorId: string, chapterNumber: number) => void;
  onStartSectionPractice: (sectionId: string) => void;
  onSaveToNotebook: (entry: Omit<NotebookEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export function LearningPathView({
  selectedSectionId,
  progressMap,
  onSelectSection,
  onMarkReadingComplete,
  onOpenInReader,
  onStartSectionPractice,
  onSaveToNotebook,
}: LearningPathViewProps) {
  const section: BookSection =
    getSectionById(selectedSectionId) || BOOK_CHAPTERS[0].sections[0];
  const chapter = BOOK_CHAPTERS.find((c) => c.number === section.chapterNumber) || BOOK_CHAPTERS[0];
  const progress = progressMap[section.id];
  const sectionExercises = getExercisesBySection(section.id);

  const [quickChoice, setQuickChoice] = useState<number | null>(null);
  const [quickSubmitted, setQuickSubmitted] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);

  const handleSelectSection = (id: string) => {
    setQuickChoice(null);
    setQuickSubmitted(false);
    setSavedFeedback(null);
    onSelectSection(id);
  };

  const handleSaveRule = () => {
    onSaveToNotebook({
      category: 'rule',
      title: `${section.sectionCode} ${section.titleDe} (${section.titleEn})`,
      content: `${section.originalRuleSummary}\n\n[A1 Structure] ${section.beginnerGuide.structure}`,
      germanText: section.originalExamples[0]?.german,
      englishText: section.originalExamples[0]?.english,
      chapterNumber: section.chapterNumber,
      sectionId: section.id,
      pageRef: section.pageRange,
      source: 'book-original',
    });
    setSavedFeedback('Saved to Notebook');
    setTimeout(() => setSavedFeedback(null), 2200);
  };

  const quickQ = section.beginnerGuide.quickCheckQuestion;
  const isQuickCorrect = quickSubmitted && quickChoice === quickQ.correctIndex;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Chapter / Section Tree */}
      <aside className="lg:col-span-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131C26] p-4 max-h-[78vh] overflow-y-auto grammar-scroll">
        <div className="pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-display font-semibold text-slate-900 dark:text-white">
            Book Syllabus (Chapters 1–15)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Book → Chapter → Concept → Lesson → Practice
          </p>
        </div>

        <div className="space-y-4">
          {BOOK_CHAPTERS.map((ch) => (
            <div key={ch.id} className="space-y-1">
              <div className="flex items-baseline justify-between px-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Ch {ch.number} · {ch.titleDe}
                </p>
                <span className="text-[11px] font-mono text-slate-400">{ch.pageRange}</span>
              </div>
              <div className="space-y-0.5">
                {ch.sections.map((sec) => {
                  const active = sec.id === section.id;
                  const p = progressMap[sec.id];
                  const mastery = p?.masteryScore || 0;
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => handleSelectSection(sec.id)}
                      className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#1E3A5F] text-white font-semibold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                      }`}
                    >
                      <span className="truncate">
                        <span className="font-mono mr-1.5 opacity-80">{sec.sectionCode}</span>
                        {sec.titleEn}
                      </span>
                      <span
                        className={`font-mono text-[11px] tabular-nums shrink-0 ${
                          active
                            ? 'text-sky-200'
                            : mastery >= 80
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-400'
                        }`}
                      >
                        {mastery > 0 ? `${mastery}%` : p?.readingCompleted ? 'Read' : '—'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Right Active Concept Lesson */}
      <article className="lg:col-span-8 space-y-6">
        {/* Lesson Header */}
        <header className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131C26] p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>
              Chapter {chapter.number}: {chapter.titleDe} ({chapter.titleEn}) · Section {section.sectionCode} · {section.pageRange}
            </span>
            <span className="inline-flex items-center gap-1 font-mono tabular-nums">
              <Clock className="w-3.5 h-3.5" />
              ~{section.estimatedMinutes} min
            </span>
          </div>

          <h1 className="mt-2 text-2xl font-display font-semibold text-slate-900 dark:text-white">
            {section.titleDe} — {section.titleEn}
          </h1>

          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            <span className="font-semibold text-slate-800 dark:text-slate-100">Learning Objective:</span>{' '}
            {section.learningObjective}
          </p>

          {section.prerequisites.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-medium">Prerequisites:</span>
              {section.prerequisites.map((preId) => {
                const pre = getSectionById(preId);
                if (!pre) return null;
                return (
                  <button
                    key={preId}
                    type="button"
                    onClick={() => handleSelectSection(preId)}
                    className="underline hover:text-[#1E3A5F] dark:hover:text-sky-400 cursor-pointer"
                  >
                    {pre.sectionCode} {pre.titleEn}
                  </button>
                );
              })}
            </div>
          )}

          {/* Status & Action Controls */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
              <span>
                Mastery:{' '}
                <strong className="font-mono tabular-nums text-slate-900 dark:text-white">
                  {progress?.masteryScore || 0}%
                </strong>{' '}
                (from practice)
              </span>
              <span>
                Reading:{' '}
                <strong className="text-slate-900 dark:text-white">
                  {progress?.readingCompleted ? 'Completed' : 'In Progress'}
                </strong>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenInReader(section.anchorId, section.chapterNumber)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Read Original Page ({section.pageRange})</span>
              </button>
              <button
                type="button"
                onClick={handleSaveRule}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                <BookmarkPlus className="w-3.5 h-3.5" />
                <span>{savedFeedback || 'Save Rule'}</span>
              </button>
              {!progress?.readingCompleted && (
                <button
                  type="button"
                  onClick={() => onMarkReadingComplete(section.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 text-xs font-semibold cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark Read</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* SECTION A: ORIGINAL TEXTBOOK CONTENT (Strictly Labeled) */}
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-[#FCFBF8] dark:bg-[#111922] p-6 space-y-5">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#1E3A5F] dark:text-sky-400" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[#1E3A5F] dark:text-sky-300">
                A. Original Textbook Content
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
              Langenscheidt · {section.pageRange}
            </span>
          </div>

          <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
            {section.originalRuleSummary}
          </p>

          {/* Original Textbook Examples with German TTS */}
          {section.originalExamples.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Original Book Examples
              </h3>
              <div className="space-y-2">
                {section.originalExamples.map((ex) => (
                  <div
                    key={ex.id}
                    className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#15202B] p-3.5 flex flex-col sm:flex-row sm:items-start justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {ex.german}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                        {ex.english}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {ex.grammarNote} <span className="font-mono">({ex.pageRef})</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <SpeakButton text={ex.german} label="Listen" />
                      <SpeakButton text={ex.german} rate={0.7} label="Slow" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reconstructed Original Grammar Tables */}
          {section.tables.map((tbl) => (
            <div key={tbl.id} className="space-y-2">
              <div className="flex items-baseline justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  {tbl.title}
                </h3>
                <span className="text-[11px] font-mono text-slate-400">{tbl.pageRef}</span>
              </div>
              <div className="overflow-x-auto grammar-scroll rounded-lg border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200">
                      {tbl.headers.map((h) => (
                        <th key={h} className="px-3 py-2 font-semibold border-b border-slate-200 dark:border-slate-700 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-[#15202B]">
                    {tbl.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            className={`px-3 py-2 ${
                              cIdx === 0
                                ? 'font-semibold text-slate-900 dark:text-white whitespace-nowrap'
                                : 'text-slate-700 dark:text-slate-300 font-mono text-[11px]'
                            }`}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {tbl.caption && (
                <p className="text-xs text-slate-500 dark:text-slate-400">{tbl.caption}</p>
              )}
            </div>
          ))}
        </section>

        {/* SECTION B: APPLICATION-GENERATED BEGINNER (EARLY A1) STEP-BY-STEP GUIDE */}
        <section className="rounded-xl border border-sky-200/80 dark:border-sky-900/60 bg-white dark:bg-[#131C26] p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-700 dark:text-sky-400" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-sky-800 dark:text-sky-300">
                B. Simple English Step-by-Step A1 Guide
              </h2>
            </div>
            <span className="text-xs font-medium text-sky-700 dark:text-sky-400">
              Application-Generated Assistance
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="rounded-lg bg-slate-50 dark:bg-slate-900/60 p-3.5 space-y-1">
              <p className="font-semibold text-slate-900 dark:text-white">1. What It Means</p>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {section.beginnerGuide.whatItMeans}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 dark:bg-slate-900/60 p-3.5 space-y-1">
              <p className="font-semibold text-slate-900 dark:text-white">2. Why It Is Used</p>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {section.beginnerGuide.whyUsed}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 dark:bg-slate-900/60 p-3.5 space-y-1">
              <p className="font-semibold text-slate-900 dark:text-white">3. When to Use It</p>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {section.beginnerGuide.whenUsed}
              </p>
            </div>
          </div>

          {/* 4 & 5: Structure + Components */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/50 p-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              4. Grammatical Formula & Key Components
            </p>
            <p className="font-mono text-xs sm:text-sm font-semibold text-[#1E3A5F] dark:text-sky-300">
              {section.beginnerGuide.structure}
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-slate-700 dark:text-slate-300">
              {section.beginnerGuide.components.map((c, idx) => (
                <li key={idx}>{c}</li>
              ))}
            </ul>
          </div>

          {/* 6-8: Walkthrough Examples */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              5. How the Grammar Works in Action
            </p>
            {section.beginnerGuide.exampleWalkthroughs.map((w, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-slate-200 dark:border-slate-800 p-3.5 flex flex-col sm:flex-row sm:items-start justify-between gap-3"
              >
                <div className="space-y-1 text-xs">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{w.german}</p>
                  <p className="text-slate-600 dark:text-slate-400 italic">{w.english}</p>
                  <p className="text-slate-700 dark:text-slate-300">{w.breakdown}</p>
                </div>
                <SpeakButton text={w.german} label="Hear" />
              </div>
            ))}
          </div>

          {/* 9: Common Mistakes */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>6. Common Beginner Mistakes to Avoid</span>
            </p>
            <div className="space-y-2">
              {section.beginnerGuide.commonMistakes.map((m, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-amber-200/80 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 p-3.5 text-xs space-y-1"
                >
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    <span className="text-rose-700 dark:text-rose-400 line-through">✗ {m.wrong}</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold">✓ {m.right}</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300">{m.reason}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 10–11: Quick Understanding Check (No answer revealed before submit!) */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              7. Quick Understanding Check (Application-Generated)
            </p>
            <p className="text-sm font-medium text-slate-900 dark:text-white">{quickQ.prompt}</p>
            <div className="space-y-2">
              {quickQ.options.map((opt, idx) => {
                const selected = quickChoice === idx;
                let style =
                  'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#15202B] text-slate-800 dark:text-slate-200 hover:border-[#1E3A5F]';
                if (quickSubmitted) {
                  if (idx === quickQ.correctIndex) {
                    style =
                      'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-semibold';
                  } else if (selected) {
                    style =
                      'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200';
                  }
                } else if (selected) {
                  style =
                    'border-[#1E3A5F] dark:border-sky-400 bg-sky-50/70 dark:bg-sky-950/40 text-slate-900 dark:text-white font-semibold';
                }
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={quickSubmitted}
                    onClick={() => setQuickChoice(idx)}
                    className={`w-full text-left rounded-lg border px-3.5 py-2.5 text-xs transition-colors cursor-pointer disabled:cursor-default ${style}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {!quickSubmitted ? (
              <button
                type="button"
                disabled={quickChoice === null}
                onClick={() => setQuickSubmitted(true)}
                className="rounded-lg bg-[#1E3A5F] hover:bg-[#162C49] disabled:opacity-40 text-white px-4 py-2 text-xs font-semibold cursor-pointer"
              >
                Check Answer
              </button>
            ) : (
              <div
                className={`rounded-lg p-3 text-xs flex items-start gap-2 ${
                  isQuickCorrect
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200'
                }`}
              >
                {isQuickCorrect ? (
                  <Check className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <X className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-semibold">
                    {isQuickCorrect ? 'Correct!' : 'Not quite — here is why:'}
                  </p>
                  <p className="mt-0.5">{quickQ.explanation}</p>
                </div>
              </div>
            )}
          </div>

          {/* CTA to Practice Exercises */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {sectionExercises.length > 0
                ? `${sectionExercises.length} exercise set(s) linked to Section ${section.sectionCode}`
                : `Ready to practice Chapter ${section.chapterNumber}?`}
            </p>
            <button
              type="button"
              onClick={() => onStartSectionPractice(section.id)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1E3A5F] hover:bg-[#162C49] text-white px-4 py-2.5 text-xs font-semibold cursor-pointer"
            >
              <span>Practice Section {section.sectionCode} Exercises</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      </article>
    </div>
  );
}
