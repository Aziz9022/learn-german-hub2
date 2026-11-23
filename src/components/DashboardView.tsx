import {
  ArrowRight,
  BookOpen,
  Compass,
  FlaskConical,
  AlertCircle,
  Bookmark,
  CheckCircle2,
  Target,
  Sparkles,
  FileText,
} from 'lucide-react';
import { ALL_SECTIONS, BOOK_CHAPTERS, BOOK_METADATA, getSectionById } from '../data/bookStructure';
import { EXERCISE_SETS } from '../data/bookExercises';
import type {
  AssessmentAttempt,
  MistakeRecord,
  NavSection,
  NotebookEntry,
  TopicProgress,
} from '../types/grammar';

interface DashboardViewProps {
  progressMap: Record<string, TopicProgress>;
  mistakes: MistakeRecord[];
  assessments: AssessmentAttempt[];
  notebook: NotebookEntry[];
  lastLocation: { sectionId: string; chapterNumber: number; anchorId?: string; updatedAt: number } | null;
  onNavigate: (tab: NavSection) => void;
  onOpenSection: (sectionId: string) => void;
  onStartRevisionDrill: (sectionIds: string[]) => void;
}

export function DashboardView({
  progressMap,
  mistakes,
  assessments,
  notebook,
  lastLocation,
  onNavigate,
  onOpenSection,
  onStartRevisionDrill,
}: DashboardViewProps) {
  const totalSections = ALL_SECTIONS.length;
  const practicedSections = Object.values(progressMap).filter((p) => p.totalAnswered > 0);
  const masteredSections = Object.values(progressMap).filter((p) => p.masteryScore >= 80 && p.totalAnswered >= 2);
  const overallMastery =
    practicedSections.length > 0
      ? Math.round(
          Object.values(progressMap).reduce((sum, p) => sum + p.masteryScore, 0) / totalSections
        )
      : 0;

  const avgQuizScore =
    assessments.length > 0
      ? Math.round(assessments.reduce((s, a) => s + a.scorePercent, 0) / assessments.length)
      : null;

  const resumeSection =
    (lastLocation && getSectionById(lastLocation.sectionId)) || ALL_SECTIONS[0];

  const recentlyStudied = Object.values(progressMap)
    .sort((a, b) => b.lastVisitedAt - a.lastVisitedAt)
    .slice(0, 4);

  const difficultConcepts = Object.values(progressMap)
    .filter((p) => p.totalAnswered > 0 && p.masteryScore < 75)
    .sort((a, b) => a.masteryScore - b.masteryScore)
    .slice(0, 4);

  const recurringMistakes = [...mistakes]
    .sort((a, b) => b.occurrences - a.occurrences || b.lastSeenAt - a.lastSeenAt)
    .slice(0, 5);

  const bookExercisesCount = EXERCISE_SETS.filter((e) => e.source === 'book-original').length;

  return (
    <div className="space-y-8">
      {/* Editorial Hero + Continue Learning */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131C26] p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <p className="text-xs font-semibold tracking-wider uppercase text-amber-700 dark:text-amber-400">
              {BOOK_METADATA.titleEn} · {BOOK_METADATA.publisher.split(',')[0]}
            </p>
            <h1 className="text-2xl sm:text-3xl font-display font-semibold tracking-tight text-slate-900 dark:text-white">
              Willkommen! Your Interactive German Grammar Workspace
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Built directly around all {BOOK_METADATA.totalChapters} chapters and {bookExercisesCount} official exercises of{' '}
              <span className="font-medium text-slate-800 dark:text-slate-100">{BOOK_METADATA.titleDe}</span>, paired with beginner-friendly A1 explanations, interactive laboratories, and native German pronunciation.
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col gap-2.5">
            <button
              type="button"
              onClick={() => onOpenSection(resumeSection.id)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1E3A5F] hover:bg-[#162C49] text-white px-5 py-3 text-sm font-semibold transition-colors cursor-pointer"
            >
              <span>
                {lastLocation ? `Resume ${resumeSection.sectionCode}: ${resumeSection.titleEn}` : 'Start Chapter 1.1: Articles'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('reader')}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/70 text-slate-800 dark:text-slate-200 px-5 py-2.5 text-sm font-medium transition-colors cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>Open Original Textbook Reader</span>
            </button>
          </div>
        </div>

        {/* Clean Unboxed KPI Strip (Zero-Pill Discipline) */}
        <div className="mt-7 pt-6 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Overall Mastery</p>
            <p className="mt-1 text-2xl font-display font-semibold tabular-nums text-slate-900 dark:text-white">
              {overallMastery}%
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {masteredSections.length} of {totalSections} topics mastered
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Assessment Average</p>
            <p className="mt-1 text-2xl font-display font-semibold tabular-nums text-slate-900 dark:text-white">
              {avgQuizScore !== null ? `${avgQuizScore}%` : '—'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {assessments.length} assessment{assessments.length === 1 ? '' : 's'} taken
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Active Mistakes</p>
            <p className="mt-1 text-2xl font-display font-semibold tabular-nums text-slate-900 dark:text-white">
              {mistakes.length}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {mistakes.length > 0 ? 'Ready for targeted revision' : 'Clean slate so far'}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Personal Notebook</p>
            <p className="mt-1 text-2xl font-display font-semibold tabular-nums text-slate-900 dark:text-white">
              {notebook.length}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Saved rules, tables & notes</p>
          </div>
        </div>
      </section>

      {/* Quick Study Modes */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: 'Book Learning Path',
            desc: 'All 15 chapters with side-by-side Textbook Rules & Simple A1 Guides',
            icon: Compass,
            tab: 'path' as NavSection,
          },
          {
            title: 'Grammar Laboratory',
            desc: 'Interactive Article Matrices, Signal Jumper, V2 Bracket & Two-Way Prepositions',
            icon: FlaskConical,
            tab: 'lab' as NavSection,
          },
          {
            title: 'Practice & Tests',
            desc: 'All 26 authentic book exercises with official keys + A1 assessments',
            icon: Target,
            tab: 'practice' as NavSection,
          },
          {
            title: 'Sentence Analyzer',
            desc: 'Break down any German sentence word-by-word with rule & AI insights',
            icon: Sparkles,
            tab: 'analyzer' as NavSection,
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.tab}
              type="button"
              onClick={() => onNavigate(card.tab)}
              className="group text-left rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131C26] p-5 hover:border-[#1E3A5F] dark:hover:border-sky-500 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <Icon className="w-5 h-5 text-[#1E3A5F] dark:text-sky-400" />
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#1E3A5F] dark:group-hover:text-sky-400 transition-transform group-hover:translate-x-0.5" />
              </div>
              <h2 className="mt-3 text-base font-display font-semibold text-slate-900 dark:text-white">
                {card.title}
              </h2>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {card.desc}
              </p>
            </button>
          );
        })}
      </section>

      {/* Main 2-Column Workspace: Revision & Mistakes | Textbook Chapters Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Revision Recommendations, Recent Mistakes, Saved Notes */}
        <div className="lg:col-span-5 space-y-6">
          {/* Revision Recommendations */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131C26] p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-display font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Topics Needing Revision</span>
              </h2>
              {difficultConcepts.length > 0 && (
                <button
                  type="button"
                  onClick={() => onStartRevisionDrill(difficultConcepts.map((d) => d.sectionId))}
                  className="text-xs font-semibold text-[#1E3A5F] dark:text-sky-400 hover:underline cursor-pointer"
                >
                  Practice Weak Topics
                </button>
              )}
            </div>

            {difficultConcepts.length === 0 ? (
              <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Complete exercises in the Practice Arena to measure real mastery. Topics below 75% accuracy automatically appear here for targeted revision.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
                {difficultConcepts.map((item) => {
                  const sec = getSectionById(item.sectionId);
                  if (!sec) return null;
                  return (
                    <li key={item.sectionId} className="py-2.5 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => onOpenSection(sec.id)}
                        className="text-left hover:underline cursor-pointer"
                      >
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {sec.sectionCode} {sec.titleEn}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Ch {sec.chapterNumber} · {sec.pageRange} · {item.correctCount}/{item.totalAnswered} correct
                        </p>
                      </button>
                      <span className="text-xs font-mono font-semibold tabular-nums text-amber-700 dark:text-amber-400">
                        {item.masteryScore}%
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Recent Mistakes */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131C26] p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-display font-semibold text-slate-900 dark:text-white">
                Recent & Recurring Mistakes
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('mistakes')}
                className="text-xs font-semibold text-[#1E3A5F] dark:text-sky-400 hover:underline cursor-pointer"
              >
                Open Mistake Lab
              </button>
            </div>
            {recurringMistakes.length === 0 ? (
              <p className="mt-3 text-xs text-slate-600 dark:text-slate-400">
                No logged mistakes yet. Every incorrect exercise answer is saved here with its exact textbook rule so you can turn errors into mastery.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
                {recurringMistakes.map((m) => (
                  <li key={m.id} className="py-2.5 text-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{m.errorType}</span>
                      <span className="font-mono tabular-nums">
                        Ch {m.chapterNumber} · {m.occurrences}×
                      </span>
                    </div>
                    <p className="text-slate-800 dark:text-slate-200 line-clamp-1">{m.prompt}</p>
                    <p className="text-emerald-700 dark:text-emerald-400 font-medium">
                      Correct: {m.correctAnswer}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Recently Studied & Saved Notes */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131C26] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-display font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-[#1E3A5F] dark:text-sky-400" />
                <span>Saved Grammar Notes</span>
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('notebook')}
                className="text-xs font-semibold text-[#1E3A5F] dark:text-sky-400 hover:underline cursor-pointer"
              >
                View All ({notebook.length})
              </button>
            </div>

            {notebook.length === 0 ? (
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Save any rule, table, German example, or analyzed sentence to build your personal revision notebook.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {notebook.slice(0, 3).map((entry) => (
                  <li key={entry.id} className="py-2 text-xs">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{entry.title}</p>
                    <p className="text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                      {entry.germanText || entry.content}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            {recentlyStudied.length > 0 && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Recently Studied
                </p>
                <div className="space-y-1.5">
                  {recentlyStudied.map((p) => {
                    const sec = getSectionById(p.sectionId);
                    if (!sec) return null;
                    return (
                      <button
                        key={p.sectionId}
                        type="button"
                        onClick={() => onOpenSection(sec.id)}
                        className="w-full flex items-center justify-between text-xs py-1 text-left text-slate-700 dark:text-slate-300 hover:text-[#1E3A5F] dark:hover:text-sky-400 cursor-pointer"
                      >
                        <span>
                          {sec.sectionCode} {sec.titleEn}
                        </span>
                        <span className="font-mono tabular-nums text-slate-400">{p.masteryScore}%</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Authentic 15-Chapter Textbook Learning Path Overview */}
        <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131C26] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-display font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#1E3A5F] dark:text-sky-400" />
                <span>Actual Textbook Learning Path (Chapters 1–15)</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Follows the exact Table of Contents of German Grammar in a Nutshell — no fabricated chapters.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('path')}
              className="text-xs font-semibold text-[#1E3A5F] dark:text-sky-400 hover:underline cursor-pointer shrink-0"
            >
              Full Syllabus
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {BOOK_CHAPTERS.map((ch) => {
              const secCount = ch.sections.length;
              const avgChMastery = Math.round(
                ch.sections.reduce((sum, s) => sum + (progressMap[s.id]?.masteryScore || 0), 0) /
                  Math.max(1, secCount)
              );
              const practicedInCh = ch.sections.filter((s) => (progressMap[s.id]?.totalAnswered || 0) > 0).length;
              const isMastered = avgChMastery >= 80 && practicedInCh === secCount;

              return (
                <div
                  key={ch.id}
                  className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => onOpenSection(ch.sections[0].id)}
                    className="flex-1 text-left min-w-0 cursor-pointer"
                  >
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono text-xs font-semibold text-amber-700 dark:text-amber-400 tabular-nums shrink-0">
                        Ch {String(ch.number).padStart(2, '0')}
                      </span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {ch.titleDe} · {ch.titleEn}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {ch.pageRange} · {secCount} section{secCount === 1 ? '' : 's'}
                      {ch.subtitleDe ? ` · „${ch.subtitleDe}“` : ''}
                    </p>
                  </button>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="w-20 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden hidden sm:block">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isMastered ? 'bg-emerald-600' : 'bg-[#1E3A5F] dark:bg-sky-500'
                        }`}
                        style={{ width: `${avgChMastery}%` }}
                      />
                    </div>
                    <span className="w-10 text-right font-mono text-xs font-medium tabular-nums text-slate-600 dark:text-slate-300">
                      {isMastered ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 inline" />
                      ) : (
                        `${avgChMastery}%`
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
