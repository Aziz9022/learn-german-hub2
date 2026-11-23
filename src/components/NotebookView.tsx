import { useMemo, useState } from 'react';
import { Plus, Search, Trash2, Download, Edit3, Check, X } from 'lucide-react';
import type { NotebookCategory, NotebookEntry } from '../types/grammar';
import { SpeakButton } from './PronunciationBar';

interface NotebookViewProps {
  entries: NotebookEntry[];
  onAddEntry: (entry: Omit<NotebookEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateEntry: (entry: NotebookEntry) => void;
  onDeleteEntry: (id: string) => void;
  onOpenSection: (sectionId: string) => void;
}

const CATEGORIES: { id: NotebookCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'rule', label: 'Rules' },
  { id: 'example', label: 'Examples' },
  { id: 'sentence', label: 'Analyzed' },
  { id: 'mistake', label: 'Mistakes' },
  { id: 'table', label: 'Tables' },
  { id: 'note', label: 'Personal Notes' },
];

export function NotebookView({
  entries,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
  onOpenSection,
}: NotebookViewProps) {
  const [category, setCategory] = useState<NotebookCategory | 'all'>('all');
  const [query, setQuery] = useState('');
  const [showComposer, setShowComposer] = useState(false);

  // New note form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<NotebookCategory>('note');
  const [newGerman, setNewGerman] = useState('');
  const [newEnglish, setNewEnglish] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newChapter, setNewChapter] = useState<string>('');

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...entries]
      .filter((e) => category === 'all' || e.category === category)
      .filter(
        (e) =>
          !q ||
          e.title.toLowerCase().includes(q) ||
          e.content.toLowerCase().includes(q) ||
          (e.germanText || '').toLowerCase().includes(q)
      )
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [entries, category, query]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    onAddEntry({
      category: newCategory,
      title: newTitle.trim(),
      germanText: newGerman.trim() || undefined,
      englishText: newEnglish.trim() || undefined,
      content: newContent.trim(),
      chapterNumber: newChapter ? Number(newChapter) : undefined,
      source: 'app-generated',
    });
    setNewTitle('');
    setNewGerman('');
    setNewEnglish('');
    setNewContent('');
    setNewChapter('');
    setShowComposer(false);
  };

  const handleExportMarkdown = () => {
    const lines = [
      '# My German Grammar Notebook — German Grammar in a Nutshell',
      `Exported: ${new Date().toLocaleString()}`,
      '',
      ...entries.map(
        (e) =>
          `## ${e.title} [${e.category}${e.chapterNumber ? ` · Ch ${e.chapterNumber}` : ''}]\n${
            e.germanText ? `**German:** ${e.germanText}\n` : ''
          }${e.englishText ? `*English:* ${e.englishText}\n` : ''}\n${e.content}\n`
      ),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'german-grammar-notebook.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131C26] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold text-slate-900 dark:text-white">
            Personal Grammar Notebook
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            All your saved rules, textbook examples, analyzed sentences, mistakes, and personal revision notes stored privately in IndexedDB.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={entries.length === 0}
            onClick={handleExportMarkdown}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Markdown</span>
          </button>
          <button
            type="button"
            onClick={() => setShowComposer((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#1E3A5F] hover:bg-[#162C49] text-white px-4 py-2 text-xs font-semibold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Note</span>
          </button>
        </div>
      </header>

      {/* New Note Composer */}
      {showComposer && (
        <form
          onSubmit={handleCreate}
          className="rounded-xl border border-sky-200 dark:border-sky-900 bg-white dark:bg-[#131C26] p-5 space-y-3"
        >
          <h2 className="text-sm font-display font-semibold text-slate-900 dark:text-white">
            Add Personal Grammar Note
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Note title (e.g. Dative Prepositions Chant)"
              className="sm:col-span-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white"
            />
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as NotebookCategory)}
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white"
            >
              <option value="note">Personal Note</option>
              <option value="rule">Grammar Rule</option>
              <option value="example">German Example</option>
              <option value="mistake">Mistake Reminder</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              value={newGerman}
              onChange={(e) => setNewGerman(e.target.value)}
              placeholder="German sentence / phrase (optional, enables TTS)"
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white"
            />
            <input
              type="text"
              value={newEnglish}
              onChange={(e) => setNewEnglish(e.target.value)}
              placeholder="English translation (optional)"
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white"
            />
            <input
              type="number"
              min={1}
              max={15}
              value={newChapter}
              onChange={(e) => setNewChapter(e.target.value)}
              placeholder="Chapter # (1–15, optional)"
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <textarea
            required
            rows={3}
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Write your explanation, reminder, or memory trick..."
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white"
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowComposer(false)}
              className="rounded-lg border border-slate-300 dark:border-slate-700 px-3.5 py-1.5 text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[#1E3A5F] text-white px-4 py-1.5 text-xs font-semibold cursor-pointer"
            >
              Save to Notebook
            </button>
          </div>
        </form>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs cursor-pointer border ${
                category === c.id
                  ? 'bg-[#1E3A5F] text-white border-[#1E3A5F] font-semibold'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#131C26] text-slate-700 dark:text-slate-300'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes..."
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#131C26] pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Notebook Entries */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131C26] p-12 text-center text-xs text-slate-500">
          No notebook entries match this filter yet. Click “New Note” or save any rule, example, mistake, or sentence from across the platform.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((entry) => {
            const isEditing = editingId === entry.id;
            return (
              <div
                key={entry.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131C26] p-5 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-mono uppercase text-slate-500">
                      {entry.category}
                      {entry.chapterNumber ? ` · Ch ${entry.chapterNumber}` : ''}
                      {entry.pageRef ? ` · ${entry.pageRef}` : ''}
                    </span>
                    <h3 className="text-sm font-display font-semibold text-slate-900 dark:text-white">
                      {entry.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {entry.germanText && <SpeakButton text={entry.germanText} />}
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(entry.id);
                        setEditContent(entry.content);
                      }}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                      aria-label="Edit note"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteEntry(entry.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                      aria-label="Delete note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {entry.germanText && (
                  <p className="text-sm font-semibold text-[#1E3A5F] dark:text-sky-300">
                    {entry.germanText}
                  </p>
                )}
                {entry.englishText && (
                  <p className="text-xs italic text-slate-600 dark:text-slate-400">
                    {entry.englishText}
                  </p>
                )}

                {isEditing ? (
                  <div className="space-y-2">
                    <textarea
                      rows={3}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-2 text-xs text-slate-900 dark:text-white"
                    />
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="inline-flex items-center gap-1 rounded border border-slate-300 dark:border-slate-700 px-2.5 py-1 text-xs cursor-pointer"
                      >
                        <X className="w-3 h-3" /> Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateEntry({
                            ...entry,
                            content: editContent,
                            updatedAt: Date.now(),
                          });
                          setEditingId(null);
                        }}
                        className="inline-flex items-center gap-1 rounded bg-[#1E3A5F] text-white px-2.5 py-1 text-xs font-semibold cursor-pointer"
                      >
                        <Check className="w-3 h-3" /> Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                    {entry.content}
                  </p>
                )}

                {entry.sectionId && (
                  <button
                    type="button"
                    onClick={() => onOpenSection(entry.sectionId!)}
                    className="text-[11px] underline text-[#1E3A5F] dark:text-sky-400 cursor-pointer"
                  >
                    Jump to Section {entry.sectionId} →
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
