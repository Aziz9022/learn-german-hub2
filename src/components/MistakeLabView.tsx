import { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Trash2, ArrowRight, BookmarkPlus } from 'lucide-react';
import type { MistakeRecord, NotebookEntry } from '../types/grammar';
import { SpeakButton } from './PronunciationBar';

interface MistakeLabViewProps {
  mistakes: MistakeRecord[];
  onDeleteMistake: (id: string) => void;
  onStartRevisionDrill: (sectionIds: string[]) => void;
  onOpenSection: (sectionId: string) => void;
  onSaveToNotebook: (entry: Omit<NotebookEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export function MistakeLabView({
  mistakes,
  onDeleteMistake,
  onStartRevisionDrill,
  onOpenSection,
  onSaveToNotebook,
}: MistakeLabViewProps) {
  const [chapterFilter, setChapterFilter] = useState<number | 'ALL'>('ALL');
  const [savedId, setSavedId] = useState<string | null>(null);

  const groupedByCategory = useMemo(() => {
    const map = new Map<string, { count: number; sections: Set<string> }>();
    for (const m of mistakes) {
      const entry = map.get(m.errorType) || { count: 0, sections: new Set<string>() };
      entry.count += m.occurrences;
      entry.sections.add(m.sectionId);
      map.set(m.errorType, entry);
    }
    return Array.from(map.entries())
      .map(([category, info]) => ({
        category,
        count: info.count,
        sectionIds: Array.from(info.sections),
      }))
      .sort((a, b) => b.count - a.count);
  }, [mistakes]);

  const filtered = useMemo(() => {
    return [...mistakes]
      .filter((m) => chapterFilter === 'ALL' || m.chapterNumber === chapterFilter)
      .sort((a, b) => b.occurrences - a.occurrences || b.lastSeenAt - a.lastSeenAt);
  }, [mistakes, chapterFilter]);

  const uniqueChapters = Array.from(new Set(mistakes.map((m) => m.chapterNumber))).sort(
    (a, b) => a - b
  );

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131C26] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold text-slate-900 dark:text-white">
            Grammar Mistake Laboratory
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Tracks recurring grammar errors persistently across exercises and assessments so you can target exact weak patterns.
          </p>
        </div>

        {mistakes.length > 0 && (
          <button
            type="button"
            onClick={() =>
              onStartRevisionDrill(Array.from(new Set(mistakes.map((m) => m.sectionId))))
            }
            className="inline-flex items-center gap-2 rounded-xl bg-[#1E3A5F] hover:bg-[#162C49] text-white px-4 py-2.5 text-xs font-semibold cursor-pointer shrink-0"
          >
            <span>Launch Targeted Revision Drill</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </header>

      {mistakes.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131C26] p-12 text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
          <h2 className="text-base font-display font-semibold text-slate-900 dark:text-white">
            No Active Mistakes Logged
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            Whenever you miss a question in the Practice Arena or an Assessment, it will automatically be recorded here with its frequency, chapter reference, and textbook rule.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Recurring Pattern Summary */}
          <aside className="lg:col-span-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131C26] p-5 space-y-4">
            <h2 className="text-sm font-display font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>Recurring Error Patterns</span>
            </h2>
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {groupedByCategory.map((g) => (
                <li key={g.category} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{g.category}</p>
                    <button
                      type="button"
                      onClick={() => onStartRevisionDrill(g.sectionIds)}
                      className="text-[11px] underline text-[#1E3A5F] dark:text-sky-400 cursor-pointer"
                    >
                      Drill this pattern →
                    </button>
                  </div>
                  <span className="font-mono font-semibold tabular-nums text-amber-700 dark:text-amber-400">
                    {g.count}×
                  </span>
                </li>
              ))}
            </ul>
          </aside>

          {/* Detailed Mistake Log */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 tabular-nums">
                Showing {filtered.length} logged mistake{filtered.length === 1 ? '' : 's'}
              </span>
              <select
                value={chapterFilter}
                onChange={(e) =>
                  setChapterFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))
                }
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#131C26] px-3 py-1.5 text-xs text-slate-900 dark:text-white"
              >
                <option value="ALL">All Chapters</option>
                {uniqueChapters.map((c) => (
                  <option key={c} value={c}>
                    Chapter {c}
                  </option>
                ))}
              </select>
            </div>

            {filtered.map((m) => (
              <div
                key={m.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131C26] p-5 space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-mono text-amber-700 dark:text-amber-400 font-semibold">
                    {m.errorType} · Ch {m.chapterNumber} ({m.pageRef}) · Missed {m.occurrences}×
                  </span>
                  <div className="flex items-center gap-2">
                    <SpeakButton text={m.correctAnswer} />
                    <button
                      type="button"
                      onClick={() => {
                        onSaveToNotebook({
                          category: 'mistake',
                          title: `Mistake Note: ${m.errorType}`,
                          germanText: m.correctAnswer,
                          content: `Prompt: ${m.prompt}\nMy answer: ${m.userAnswer}\nCorrect: ${m.correctAnswer}\nRule: ${m.explanation}`,
                          chapterNumber: m.chapterNumber,
                          sectionId: m.sectionId,
                          pageRef: m.pageRef,
                          source: 'app-generated',
                        });
                        setSavedId(m.id);
                        setTimeout(() => setSavedId(null), 1800);
                      }}
                      className="text-slate-500 hover:text-[#1E3A5F] dark:hover:text-sky-400 cursor-pointer inline-flex items-center gap-1"
                    >
                      <BookmarkPlus className="w-3.5 h-3.5" />
                      <span>{savedId === m.id ? 'Saved' : 'Note'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteMistake(m.id)}
                      className="text-slate-400 hover:text-emerald-600 cursor-pointer inline-flex items-center gap-1"
                      title="Mark resolved & remove from Mistake Lab"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Resolve</span>
                    </button>
                  </div>
                </div>

                <p className="text-sm font-medium text-slate-900 dark:text-white">{m.prompt}</p>
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs">
                  <span className="text-rose-700 dark:text-rose-400">
                    Your Answer: <span className="line-through">{m.userAnswer}</span>
                  </span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                    Correct Answer: {m.correctAnswer}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">{m.explanation}</p>
                <button
                  type="button"
                  onClick={() => onOpenSection(m.sectionId)}
                  className="text-xs font-semibold underline text-[#1E3A5F] dark:text-sky-400 cursor-pointer"
                >
                  Open Section {m.sectionId} Lesson →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
