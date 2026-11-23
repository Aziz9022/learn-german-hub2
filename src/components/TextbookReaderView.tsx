import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  Bookmark,
  BookmarkCheck,
  Highlighter,
  Type,
  ChevronLeft,
  ChevronRight,
  X,
  BookOpen,
  Sparkles,
  Upload,
  Trash2,
  BookmarkPlus,
  Table,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { BOOK_CHAPTERS } from '../data/bookStructure';
import {
  APPENDIX_DATIVE_VERBS,
  APPENDIX_GERMAN_INDEX,
  APPENDIX_GLOSSARY,
  APPENDIX_IRREGULAR_VERBS,
  APPENDIX_PHRASAL_VERBS,
} from '../data/bookAppendix';
import {
  APPENDIX_PDF_URL,
  inferChapterFromPage,
  type ParsedBookDocument,
} from '../services/bookParser';
import { analyzeGermanSentenceLocally } from '../services/sentenceAnalyzer';
import { speechService } from '../services/speechService';
import type {
  NotebookEntry,
  ReaderAnnotation,
  ReaderBookmark,
  ReaderPreferences,
  SentenceAnalysisResult,
} from '../types/grammar';
import { SpeakButton } from './PronunciationBar';

interface TextbookReaderViewProps {
  bookDoc: ParsedBookDocument | null;
  loadingBook: boolean;
  initialAnchorId?: string;
  initialChapterNumber?: number;
  initialPageNumber?: number;
  jumpNonce?: number;
  readerPrefs: ReaderPreferences;
  bookmarks: ReaderBookmark[];
  annotations: ReaderAnnotation[];
  onUpdateReaderPrefs: (next: ReaderPreferences) => void;
  onAddBookmark: (b: Omit<ReaderBookmark, 'id' | 'createdAt'>) => void;
  onDeleteBookmark: (id: string) => void;
  onAddAnnotation: (a: Omit<ReaderAnnotation, 'id' | 'createdAt'>) => void;
  onDeleteAnnotation: (id: string) => void;
  onSaveToNotebook: (entry: Omit<NotebookEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onOpenSettings: () => void;
  onOpenSection: (sectionId: string) => void;
}

const CHAPTER_NAV_OPTIONS = [
  { num: 0, label: 'Front Matter, Contents & Preface (pp. 1–11)' },
  ...BOOK_CHAPTERS.map((c) => ({
    num: c.number,
    label: `Ch ${c.number}: ${c.titleDe} — ${c.titleEn} (${c.pageRange})`,
  })),
  { num: 16, label: 'Appendix: Verb Tables, Glossary, Answer Keys & Index (pp. 165–197)' },
];

export function TextbookReaderView({
  bookDoc,
  loadingBook,
  initialAnchorId,
  initialChapterNumber,
  initialPageNumber,
  jumpNonce,
  readerPrefs,
  bookmarks,
  annotations,
  onUpdateReaderPrefs,
  onAddBookmark,
  onDeleteBookmark,
  onAddAnnotation,
  onDeleteAnnotation,
  onSaveToNotebook,
  onOpenSettings,
  onOpenSection,
}: TextbookReaderViewProps) {
  const [selectedChapter, setSelectedChapter] = useState<number>(() => {
    if (typeof initialPageNumber === 'number') return inferChapterFromPage(initialPageNumber);
    return initialChapterNumber ?? 1;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [pageJumpInput, setPageJumpInput] = useState('');
  const [appendixViewMode, setAppendixViewMode] = useState<'tables' | 'pdf' | 'html'>('tables');
  const [appendixTableTab, setAppendixTableTab] = useState<
    'irregular' | 'dative' | 'phrasal' | 'glossary' | 'index'
  >('irregular');
  const [appendixFilter, setAppendixFilter] = useState('');
  const [showTypography, setShowTypography] = useState(false);
  const [showNotesDrawer, setShowNotesDrawer] = useState(false);
  const [inspectedPhrase, setInspectedPhrase] = useState<string | null>(null);
  const [inspectedAnalysis, setInspectedAnalysis] = useState<SentenceAnalysisResult | null>(null);
  const [annotationDraft, setAnnotationDraft] = useState<{
    text: string;
    anchorId: string;
    note: string;
  } | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const pageContainerRef = useRef<HTMLDivElement>(null);

  const jumpToPrintedPage = (pageNum: number) => {
    const clamped = Math.max(1, Math.min(197, pageNum));
    const ch = inferChapterFromPage(clamped);
    setSelectedChapter(ch);
    if (ch === 16 && clamped >= 183 && clamped <= 191) {
      setAppendixViewMode('html');
    } else if (ch === 16 && clamped >= 165 && clamped <= 182) {
      setAppendixViewMode('tables');
      if (clamped <= 171) setAppendixTableTab('irregular');
      else if (clamped <= 174) setAppendixTableTab('dative');
      else if (clamped <= 179) setAppendixTableTab('phrasal');
      else setAppendixTableTab('glossary');
    }
    setTimeout(() => {
      const byPage = document.getElementById(`reader-page-${clamped}`);
      if (byPage) {
        byPage.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 100);
  };

  // Sync incoming jump requests from Learning Path, Dashboard, or Grammar Lab
  useEffect(() => {
    if (typeof initialPageNumber === 'number') {
      jumpToPrintedPage(initialPageNumber);
      return;
    }
    if (typeof initialChapterNumber === 'number') {
      setSelectedChapter(initialChapterNumber);
    }
    if (initialAnchorId && bookDoc) {
      const linkNumMatch = initialAnchorId.match(/^calibre_link-(\d+)$/);
      const desiredPage = linkNumMatch ? parseInt(linkNumMatch[1], 10) : null;
      const targetPage =
        (desiredPage !== null && bookDoc.pages.find((p) => p.pageNumber === desiredPage)) ||
        bookDoc.pages.find((p) => p.anchorId === initialAnchorId);

      if (targetPage) {
        setSelectedChapter(targetPage.chapterNumber);
        setTimeout(() => {
          const el =
            document.getElementById(`reader-page-${targetPage.pageNumber}`) ||
            document.getElementById(`reader-${targetPage.anchorId}`);
          el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 120);
      }
    }
  }, [initialAnchorId, initialChapterNumber, initialPageNumber, jumpNonce, bookDoc]);

  const chapterPages = useMemo(() => {
    if (!bookDoc) return [];
    const exact = bookDoc.pages.filter((p) => p.chapterNumber === selectedChapter);
    if (exact.length > 0) return exact;
    // Fallback for generic single-page custom HTML imports
    return bookDoc.pages.length === 1 ? bookDoc.pages : [];
  }, [bookDoc, selectedChapter]);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || !bookDoc || q.length < 2) return [];
    const hits: { anchorId: string; pageNumber: number; chapterNumber: number; snippet: string }[] = [];
    for (const page of bookDoc.pages) {
      const idx = page.plainText.toLowerCase().indexOf(q);
      if (idx !== -1) {
        const start = Math.max(0, idx - 55);
        const end = Math.min(page.plainText.length, idx + q.length + 85);
        hits.push({
          anchorId: page.anchorId,
          pageNumber: page.pageNumber,
          chapterNumber: page.chapterNumber,
          snippet: `${start > 0 ? '…' : ''}${page.plainText.slice(start, end)}${end < page.plainText.length ? '…' : ''}`,
        });
        if (hits.length >= 25) break;
      }
    }
    return hits;
  }, [bookDoc, searchQuery]);

  const chapterAnnotations = useMemo(
    () => annotations.filter((a) => a.chapterNumber === selectedChapter),
    [annotations, selectedChapter]
  );

  const handleInspectPhrase = (phrase: string) => {
    const trimmed = phrase.trim();
    if (!trimmed) return;
    setInspectedPhrase(trimmed);
    setInspectedAnalysis(analyzeGermanSentenceLocally(trimmed));
  };

  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    // Handle internal textbook cross-reference anchor clicks
    const anchorEl = target.closest('[data-internal-anchor]') as HTMLElement | null;
    if (anchorEl) {
      const anchorId = anchorEl.getAttribute('data-internal-anchor');
      if (anchorId && bookDoc) {
        const found = bookDoc.pages.find((p) => p.anchorId === anchorId);
        if (found) {
          setSelectedChapter(found.chapterNumber);
          setTimeout(() => {
            document
              .getElementById(`reader-page-${found.pageNumber}`)
              ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 80);
        }
      }
      return;
    }

    // Handle clicking a bold German example span
    const germanEl = target.closest('[data-german-phrase]') as HTMLElement | null;
    if (germanEl) {
      const phrase = germanEl.getAttribute('data-german-phrase');
      if (phrase) {
        handleInspectPhrase(phrase);
      }
    }
  };

  const handleCaptureSelection = () => {
    const sel = window.getSelection()?.toString().trim() || '';
    if (sel.length < 2 || sel.length > 260) return;
    const firstAnchor = chapterPages[0]?.anchorId || `ch-${selectedChapter}`;
    setAnnotationDraft({ text: sel, anchorId: firstAnchor, note: '' });
  };

  const handleSaveAnnotation = () => {
    if (!annotationDraft) return;
    onAddAnnotation({
      anchorId: annotationDraft.anchorId,
      chapterNumber: selectedChapter,
      selectedText: annotationDraft.text,
      note: annotationDraft.note.trim() || 'Highlighted textbook passage',
      color: 'amber',
    });
    setAnnotationDraft(null);
    setShowNotesDrawer(true);
  };

  const widthClass =
    readerPrefs.maxWidth === 'narrow'
      ? 'max-w-2xl'
      : readerPrefs.maxWidth === 'wide'
        ? 'max-w-5xl'
        : 'max-w-3xl';

  const currentChapterLabel =
    CHAPTER_NAV_OPTIONS.find((c) => c.num === selectedChapter)?.label || `Chapter ${selectedChapter}`;

  const isCurrentChapterBookmarked = bookmarks.some((b) => b.chapterNumber === selectedChapter);

  const handleToggleChapterBookmark = () => {
    const existing = bookmarks.find((b) => b.chapterNumber === selectedChapter);
    if (existing) {
      onDeleteBookmark(existing.id);
    } else {
      const firstPage = chapterPages[0];
      onAddBookmark({
        anchorId: firstPage?.anchorId || `ch-${selectedChapter}`,
        chapterNumber: selectedChapter,
        label: currentChapterLabel,
        excerpt: firstPage?.plainText.slice(0, 120) || currentChapterLabel,
      });
    }
  };

  const progressPercent = Math.round(((selectedChapter + 1) / CHAPTER_NAV_OPTIONS.length) * 100);
  const appQ = appendixFilter.trim().toLowerCase();

  return (
    <div className="space-y-4">
      {/* Compact Sticky Reader Toolbar */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131C26] p-3.5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Chapter Selector */}
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <BookOpen className="w-4 h-4 text-[#1E3A5F] dark:text-sky-400 shrink-0" />
            <select
              value={selectedChapter}
              onChange={(e) => setSelectedChapter(Number(e.target.value))}
              aria-label="Select textbook chapter"
              className="w-full max-w-md rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
            >
              {CHAPTER_NAV_OPTIONS.map((opt) => (
                <option key={opt.num} value={opt.num}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Page Jump */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const num = parseInt(pageJumpInput, 10);
              if (!Number.isNaN(num)) {
                jumpToPrintedPage(num);
                setPageJumpInput('');
              }
            }}
            className="flex items-center gap-1"
          >
            <input
              type="number"
              min={1}
              max={197}
              value={pageJumpInput}
              onChange={(e) => setPageJumpInput(e.target.value)}
              placeholder="p. #"
              aria-label="Jump to textbook page number"
              className="w-16 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2 py-1.5 text-xs font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
            />
            <button
              type="submit"
              className="rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              Go
            </button>
          </form>

          {/* Search Input */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search entire textbook..."
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 pl-8 pr-7 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Reader Action Controls */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleToggleChapterBookmark}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium cursor-pointer transition-colors ${
                isCurrentChapterBookmarked
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
              title="Bookmark this chapter"
            >
              {isCurrentChapterBookmarked ? (
                <BookmarkCheck className="w-3.5 h-3.5" />
              ) : (
                <Bookmark className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">Bookmark</span>
            </button>

            <button
              type="button"
              onClick={handleCaptureSelection}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              title="Highlight & annotate selected text"
            >
              <Highlighter className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Annotate</span>
            </button>

            <button
              type="button"
              onClick={() => setShowTypography((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium cursor-pointer ${
                showTypography
                  ? 'border-[#1E3A5F] bg-[#1E3A5F] text-white'
                  : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
              title="Adjust typography"
            >
              <Type className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Text</span>
            </button>

            <button
              type="button"
              onClick={() => setShowNotesDrawer((v) => !v)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              <span>Marks ({bookmarks.length + annotations.length})</span>
            </button>
          </div>
        </div>

        {/* Reading Progress Bar */}
        <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-[#1E3A5F] dark:bg-sky-500 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="font-mono tabular-nums">
            {bookDoc
              ? `${chapterPages.length} page(s) in chapter · ${bookDoc.totalPages} pages loaded · ${progressPercent}%`
              : 'Loading...'}
          </span>
        </div>

        {/* Adjustable Typography Panel */}
        {showTypography && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-6 text-xs">
            <label className="flex items-center gap-2">
              <span className="text-slate-600 dark:text-slate-300 font-medium">
                Font Size: <span className="font-mono">{readerPrefs.fontSize}px</span>
              </span>
              <input
                type="range"
                min={14}
                max={22}
                step={1}
                value={readerPrefs.fontSize}
                onChange={(e) =>
                  onUpdateReaderPrefs({ ...readerPrefs, fontSize: Number(e.target.value) })
                }
                className="w-24 accent-[#1E3A5F]"
              />
            </label>

            <label className="flex items-center gap-2">
              <span className="text-slate-600 dark:text-slate-300 font-medium">
                Line Spacing: <span className="font-mono">{readerPrefs.lineHeight.toFixed(1)}</span>
              </span>
              <input
                type="range"
                min={1.4}
                max={2.1}
                step={0.1}
                value={readerPrefs.lineHeight}
                onChange={(e) =>
                  onUpdateReaderPrefs({ ...readerPrefs, lineHeight: Number(e.target.value) })
                }
                className="w-24 accent-[#1E3A5F]"
              />
            </label>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-600 dark:text-slate-300 font-medium">Column:</span>
              {(['narrow', 'medium', 'wide'] as const).map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => onUpdateReaderPrefs({ ...readerPrefs, maxWidth: w })}
                  className={`px-2 py-1 rounded border text-xs capitalize cursor-pointer ${
                    readerPrefs.maxWidth === w
                      ? 'bg-[#1E3A5F] text-white border-[#1E3A5F]'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 max-h-56 overflow-y-auto grammar-scroll space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {searchResults.length} match{searchResults.length === 1 ? '' : 'es'} in textbook
            </p>
            {searchResults.map((hit) => (
              <button
                key={`${hit.anchorId}-${hit.pageNumber}`}
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  jumpToPrintedPage(hit.pageNumber);
                }}
                className="w-full text-left rounded-lg px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <span className="font-mono font-semibold text-[#1E3A5F] dark:text-sky-400 mr-2">
                  p. {hit.pageNumber}
                </span>
                <span className="text-slate-700 dark:text-slate-300">{hit.snippet}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Inline Annotation Composer */}
      {annotationDraft && (
        <div className="rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
              Save Highlight & Personal Note
            </p>
            <button
              type="button"
              onClick={() => setAnnotationDraft(null)}
              className="text-amber-700 dark:text-amber-300 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <blockquote className="text-xs italic text-slate-800 dark:text-slate-200 bg-white/80 dark:bg-slate-900/60 px-3 py-2 rounded border border-amber-200 dark:border-amber-900">
            “{annotationDraft.text}”
          </blockquote>
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              value={annotationDraft.note}
              onChange={(e) => setAnnotationDraft({ ...annotationDraft, note: e.target.value })}
              placeholder="Write your note (optional)..."
              className="flex-1 min-w-[200px] rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-white"
            />
            <button
              type="button"
              onClick={() => {
                handleInspectPhrase(annotationDraft.text);
                setAnnotationDraft(null);
              }}
              className="rounded-lg border border-[#1E3A5F] text-[#1E3A5F] dark:border-sky-400 dark:text-sky-300 px-3 py-1.5 text-xs font-semibold cursor-pointer"
            >
              Inspect German Grammar
            </button>
            <button
              type="button"
              onClick={handleSaveAnnotation}
              className="rounded-lg bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-1.5 text-xs font-semibold cursor-pointer"
            >
              Save Highlight
            </button>
          </div>
        </div>
      )}

      {/* Main Reader Grid: Original Book Content + Optional Side Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className={inspectedPhrase || showNotesDrawer ? 'lg:col-span-8' : 'lg:col-span-12'}>
          {/* Source Integrity Header */}
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400 px-1">
            <span>
              <strong className="text-slate-800 dark:text-slate-200">Original Textbook Source:</strong>{' '}
              {bookDoc?.title || 'German Grammar in a Nutshell'} · Click any bold German example to inspect & listen.
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedChapter(16);
                  setAppendixViewMode('tables');
                }}
                className="inline-flex items-center gap-1 text-[#1E3A5F] dark:text-sky-400 font-medium hover:underline cursor-pointer"
              >
                <Table className="w-3.5 h-3.5" />
                <span>Appendix Tables (pp. 165–195)</span>
              </button>
              <button
                type="button"
                onClick={onOpenSettings}
                className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:underline cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import Files</span>
              </button>
            </div>
          </div>

          {/* Appendix Mode Switcher when on Chapter 16 */}
          {selectedChapter === 16 && (
            <div className="mb-4 rounded-xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/60 dark:bg-sky-950/25 p-3.5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAppendixViewMode('tables')}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                    appendixViewMode === 'tables'
                      ? 'bg-[#1E3A5F] text-white'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>Structured Official Tables (pp. 165–195)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAppendixViewMode('pdf')}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                    appendixViewMode === 'pdf'
                      ? 'bg-[#1E3A5F] text-white'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Original PDF Pages (pp. 163–195)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAppendixViewMode('html')}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                    appendixViewMode === 'html'
                      ? 'bg-[#1E3A5F] text-white'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>HTML Pages & Answer Keys (pp. 165–197)</span>
                </button>
              </div>
              <a
                href={APPENDIX_PDF_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-[#1E3A5F] dark:text-sky-400 hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open PDF in Tab</span>
              </a>
            </div>
          )}

          {loadingBook ? (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131C26] p-12 text-center text-sm text-slate-500">
              Loading original textbook pages...
            </div>
          ) : selectedChapter === 16 && appendixViewMode === 'tables' ? (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-[#FFFEFB] dark:bg-[#121A24] p-5 sm:p-7 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-mono uppercase text-[#1E3A5F] dark:text-sky-400">
                    Original Textbook Appendix · Verified from Print PDF (pp. 165–195)
                  </p>
                  <h2 className="text-xl font-display font-semibold text-slate-900 dark:text-white mt-0.5">
                    Complete Reference Tables & German Index
                  </h2>
                </div>
                <input
                  type="text"
                  value={appendixFilter}
                  onChange={(e) => setAppendixFilter(e.target.value)}
                  placeholder="Filter rows..."
                  className="w-full sm:w-56 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    ['irregular', `Irregular & Mixed Verbs (${APPENDIX_IRREGULAR_VERBS.length})`],
                    ['dative', `Dative Verbs (${APPENDIX_DATIVE_VERBS.length})`],
                    ['phrasal', `Phrasal Verbs (${APPENDIX_PHRASAL_VERBS.length})`],
                    ['glossary', `Terminology (${APPENDIX_GLOSSARY.length})`],
                    ['index', `German Index (${APPENDIX_GERMAN_INDEX.length})`],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setAppendixTableTab(id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                      appendixTableTab === id
                        ? 'bg-[#1E3A5F] text-white border-[#1E3A5F]'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {appendixTableTab === 'irregular' && (
                <div className="overflow-x-auto grammar-scroll rounded-lg border border-slate-200 dark:border-slate-800 max-h-[62vh] overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-[#0E435A] text-white">
                      <tr>
                        <th className="px-3 py-2">Infinitive</th>
                        <th className="px-3 py-2">Present Tense</th>
                        <th className="px-3 py-2">Past Simple</th>
                        <th className="px-3 py-2">Present Perfect</th>
                        <th className="px-3 py-2">Translation</th>
                        <th className="px-3 py-2">Group</th>
                        <th className="px-3 py-2">Audio</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {APPENDIX_IRREGULAR_VERBS.filter(
                        (v) =>
                          !appQ ||
                          v.infinitive.toLowerCase().includes(appQ) ||
                          v.present3rd.toLowerCase().includes(appQ) ||
                          v.pastSimple.toLowerCase().includes(appQ) ||
                          v.perfect.toLowerCase().includes(appQ) ||
                          v.english.toLowerCase().includes(appQ)
                      ).map((v) => (
                        <tr key={v.infinitive} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="px-3 py-2 font-semibold text-slate-900 dark:text-white">{v.infinitive}</td>
                          <td className="px-3 py-2 font-mono">{v.present3rd}</td>
                          <td className="px-3 py-2 font-mono">{v.pastSimple}</td>
                          <td className="px-3 py-2 font-mono text-[#1E3A5F] dark:text-sky-300">{v.perfect}</td>
                          <td className="px-3 py-2 italic text-slate-600 dark:text-slate-300">{v.english}</td>
                          <td className="px-3 py-2 font-mono text-[11px] text-slate-500">
                            {v.group === 'mixed-other' ? 'andere' : v.group}
                          </td>
                          <td className="px-3 py-2">
                            <SpeakButton
                              text={`${v.infinitive.replace(/^\*/, '')}, ${v.pastSimple.split(' ')[0]}, ${v.perfect}`}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {appendixTableTab === 'dative' && (
                <div className="overflow-x-auto grammar-scroll rounded-lg border border-slate-200 dark:border-slate-800 max-h-[62vh] overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-[#0E435A] text-white">
                      <tr>
                        <th className="px-3 py-2">Verb</th>
                        <th className="px-3 py-2">Case Pattern</th>
                        <th className="px-3 py-2">English</th>
                        <th className="px-3 py-2">Page</th>
                        <th className="px-3 py-2">Audio</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {APPENDIX_DATIVE_VERBS.filter(
                        (v) =>
                          !appQ ||
                          v.german.toLowerCase().includes(appQ) ||
                          v.english.toLowerCase().includes(appQ)
                      ).map((v, i) => (
                        <tr key={`${v.german}-${i}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="px-3 py-2 font-semibold text-slate-900 dark:text-white">{v.german}</td>
                          <td className="px-3 py-2 font-mono text-[11px] text-amber-700 dark:text-amber-400">
                            {v.pattern === 'dative-only' ? 'Dative only' : 'Dative + Accusative'}
                          </td>
                          <td className="px-3 py-2 italic text-slate-700 dark:text-slate-300">{v.english}</td>
                          <td className="px-3 py-2 font-mono text-slate-400">{v.pageRef}</td>
                          <td className="px-3 py-2">
                            <SpeakButton text={v.example || v.german} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {appendixTableTab === 'phrasal' && (
                <div className="overflow-x-auto grammar-scroll rounded-lg border border-slate-200 dark:border-slate-800 max-h-[62vh] overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-[#0E435A] text-white">
                      <tr>
                        <th className="px-3 py-2">Verb</th>
                        <th className="px-3 py-2">Preposition + Case</th>
                        <th className="px-3 py-2">English</th>
                        <th className="px-3 py-2">Page</th>
                        <th className="px-3 py-2">Audio</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {APPENDIX_PHRASAL_VERBS.filter(
                        (v) =>
                          !appQ ||
                          v.verb.toLowerCase().includes(appQ) ||
                          v.caseRequired.toLowerCase().includes(appQ) ||
                          v.english.toLowerCase().includes(appQ)
                      ).map((v, i) => (
                        <tr key={`${v.verb}-${v.preposition}-${i}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="px-3 py-2 font-semibold text-slate-900 dark:text-white">{v.verb}</td>
                          <td className="px-3 py-2 font-mono text-[#1E3A5F] dark:text-sky-300">{v.caseRequired}</td>
                          <td className="px-3 py-2 italic text-slate-700 dark:text-slate-300">{v.english}</td>
                          <td className="px-3 py-2 font-mono text-slate-400">{v.pageRef}</td>
                          <td className="px-3 py-2">
                            <SpeakButton text={`${v.verb} ${v.preposition.split(';')[0]}`} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {appendixTableTab === 'glossary' && (
                <div className="overflow-x-auto grammar-scroll rounded-lg border border-slate-200 dark:border-slate-800 max-h-[62vh] overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-[#0E435A] text-white">
                      <tr>
                        <th className="px-3 py-2">Englisch</th>
                        <th className="px-3 py-2">Deutsch</th>
                        <th className="px-3 py-2">Beispiel</th>
                        <th className="px-3 py-2">Page</th>
                        <th className="px-3 py-2">Audio</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {APPENDIX_GLOSSARY.filter(
                        (g) =>
                          !appQ ||
                          g.english.toLowerCase().includes(appQ) ||
                          g.german.toLowerCase().includes(appQ) ||
                          g.example.toLowerCase().includes(appQ)
                      ).map((g) => (
                        <tr key={g.english} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="px-3 py-2 font-semibold text-slate-900 dark:text-white">{g.english}</td>
                          <td className="px-3 py-2 font-medium text-[#1E3A5F] dark:text-sky-300">{g.german}</td>
                          <td className="px-3 py-2 italic text-slate-700 dark:text-slate-300">{g.example}</td>
                          <td className="px-3 py-2 font-mono text-slate-400">{g.pageRef}</td>
                          <td className="px-3 py-2">
                            <SpeakButton text={g.example} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {appendixTableTab === 'index' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-[62vh] overflow-y-auto grammar-scroll pr-1">
                  {APPENDIX_GERMAN_INDEX.filter(
                    (row) => !appQ || row.term.toLowerCase().includes(appQ) || row.pageLabel.includes(appQ)
                  ).map((row) => (
                    <div
                      key={row.term}
                      className="rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2 flex items-center justify-between gap-2 text-xs"
                    >
                      <span className="font-medium text-slate-900 dark:text-slate-100 truncate">
                        {row.term}
                      </span>
                      <div className="flex flex-wrap gap-1 shrink-0">
                        {row.pages.map((pg) => (
                          <button
                            key={pg}
                            type="button"
                            onClick={() => jumpToPrintedPage(pg)}
                            className="rounded bg-slate-100 dark:bg-slate-800 hover:bg-[#1E3A5F] hover:text-white px-1.5 py-0.5 font-mono text-[11px] text-[#1E3A5F] dark:text-sky-400 cursor-pointer transition-colors"
                            title={`Jump to page ${pg} in Textbook Reader`}
                          >
                            p.{pg}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : selectedChapter === 16 && appendixViewMode === 'pdf' ? (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121A24] p-4 shadow-sm space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-300">
                <span>
                  Original print pages 163–195 (Word Formation, Irregular Verbs, Dative Verbs, Phrasal Verbs, Terminology, Keys & German Index)
                </span>
                <a
                  href={APPENDIX_PDF_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-[#1E3A5F] dark:text-sky-400 hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Fullscreen PDF</span>
                </a>
              </div>
              <iframe
                src={APPENDIX_PDF_URL}
                title="German Grammar in a Nutshell — Original Appendix Tables PDF (pp. 163–195)"
                className="w-full h-[75vh] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100"
              />
            </div>
          ) : !bookDoc ? (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131C26] p-10 text-center space-y-4">
              <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
              <h2 className="text-lg font-display font-semibold text-slate-900 dark:text-white">
                Import Your Textbook Copy Locally
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                No local HTML textbook file is currently loaded. Upload your HTML, CSS, image files, or ZIP archive in Settings to read the full book offline inside IndexedDB.
              </p>
              <button
                type="button"
                onClick={onOpenSettings}
                className="inline-flex items-center gap-2 rounded-xl bg-[#1E3A5F] text-white px-4 py-2.5 text-xs font-semibold cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Import Textbook Files</span>
              </button>
            </div>
          ) : (
            <div
              ref={pageContainerRef}
              onClick={handleContentClick}
              className={`${widthClass} mx-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-[#FFFEFB] dark:bg-[#121A24] px-6 sm:px-10 py-8 shadow-sm`}
              style={{
                fontSize: `${readerPrefs.fontSize}px`,
                lineHeight: readerPrefs.lineHeight,
              }}
            >
              {chapterPages.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No pages matched this chapter in the imported HTML file. Try selecting another chapter above.
                </p>
              ) : (
                <div className="space-y-8">
                  {chapterPages.map((page) => (
                    <section
                      key={page.anchorId}
                      id={`reader-page-${page.pageNumber}`}
                      data-anchor-id={`reader-${page.anchorId}`}
                      className="pb-6 border-b border-slate-100 dark:border-slate-800/80 last:border-b-0 scroll-mt-24"
                    >
                      <div className="mb-3 flex items-center justify-between text-[11px] font-mono text-slate-400">
                        <span>ORIGINAL TEXTBOOK · PAGE {page.pageNumber}</span>
                        <SpeakButton
                          text={page.plainText.slice(0, 260)}
                          label="Read Snippet"
                        />
                      </div>
                      <div
                        className="textbook-prose text-slate-800 dark:text-slate-200"
                        dangerouslySetInnerHTML={{ __html: page.html }}
                      />
                    </section>
                  ))}
                </div>
              )}

              {/* Bottom Chapter Navigation */}
              <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={selectedChapter <= 0}
                  onClick={() => {
                    setSelectedChapter((c) => Math.max(0, c - 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous Chapter</span>
                </button>
                <span className="text-xs font-mono text-slate-500">
                  Section {selectedChapter} / 16
                </span>
                <button
                  type="button"
                  disabled={selectedChapter >= 16}
                  onClick={() => {
                    setSelectedChapter((c) => Math.min(16, c + 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#1E3A5F] hover:bg-[#162C49] text-white px-3.5 py-2 text-xs font-semibold disabled:opacity-40 cursor-pointer"
                >
                  <span>Next Chapter</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Interactive Side Panel: German Example Explanation OR Bookmarks & Highlights */}
        {(inspectedPhrase || showNotesDrawer) && (
          <aside className="lg:col-span-4 sticky top-20 space-y-4">
            {inspectedPhrase && inspectedAnalysis && (
              <div className="rounded-xl border border-sky-200 dark:border-sky-900/60 bg-white dark:bg-[#131C26] p-5 space-y-4 shadow-sm">
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-400 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Application-Generated Example Inspector</span>
                    </p>
                    <h3 className="mt-1 text-base font-display font-semibold text-slate-900 dark:text-white">
                      {inspectedPhrase}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setInspectedPhrase(null)}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer"
                    aria-label="Close inspector"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <SpeakButton text={inspectedPhrase} size="md" label="Listen (1.0×)" rate={1.0} />
                  <SpeakButton text={inspectedPhrase} size="md" label="Slow (0.7×)" rate={0.7} />
                  <button
                    type="button"
                    onClick={() => {
                      onSaveToNotebook({
                        category: 'example',
                        title: `Textbook Example (Ch ${selectedChapter})`,
                        germanText: inspectedPhrase,
                        content: `${inspectedAnalysis.clauseType} · ${inspectedAnalysis.wordOrderPattern}`,
                        chapterNumber: selectedChapter,
                        source: 'book-original',
                      });
                      setSavedNotice('Saved!');
                      setTimeout(() => setSavedNotice(null), 2000);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <BookmarkPlus className="w-3.5 h-3.5" />
                    <span>{savedNotice || 'Save'}</span>
                  </button>
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Word-by-Word Breakdown (click any word to hear it)
                  </p>
                  <div className="space-y-1.5 max-h-60 overflow-y-auto grammar-scroll pr-1">
                    {inspectedAnalysis.tokens.map((tok, i) => (
                      <div
                        key={i}
                        onClick={() => speechService.speak(tok.cleanWord, 0.85)}
                        className="rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-3 py-2 text-xs hover:border-sky-400 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {tok.word}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {tok.partOfSpeech}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 mt-0.5">{tok.englishGloss}</p>
                        {(tok.caseInfo || tok.verbInfo) && (
                          <p className="text-[11px] text-sky-700 dark:text-sky-400 mt-0.5">
                            {tok.caseInfo || tok.verbInfo}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {speechService.getPronunciationHints(inspectedPhrase).length > 0 && (
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-900/60 p-3 text-xs space-y-1">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      Pronunciation Tips
                    </p>
                    <ul className="list-disc pl-4 space-y-0.5 text-slate-600 dark:text-slate-400">
                      {speechService
                        .getPronunciationHints(inspectedPhrase)
                        .slice(0, 3)
                        .map((hint, idx) => (
                          <li key={idx}>{hint}</li>
                        ))}
                    </ul>
                  </div>
                )}

                {inspectedAnalysis.relatedChapters.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Related Textbook Lessons
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {inspectedAnalysis.relatedChapters.slice(0, 3).map((rc) => (
                        <button
                          key={rc.sectionId}
                          type="button"
                          onClick={() => onOpenSection(rc.sectionId)}
                          className="text-xs underline text-[#1E3A5F] dark:text-sky-400 cursor-pointer"
                        >
                          {rc.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {showNotesDrawer && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131C26] p-5 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-display font-semibold text-slate-900 dark:text-white">
                    Bookmarks & Annotations
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowNotesDrawer(false)}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Bookmarks ({bookmarks.length})
                  </p>
                  {bookmarks.length === 0 ? (
                    <p className="text-xs text-slate-500">No bookmarks yet.</p>
                  ) : (
                    bookmarks.map((b) => (
                      <div
                        key={b.id}
                        className="flex items-center justify-between gap-2 text-xs py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0"
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedChapter(b.chapterNumber)}
                          className="text-left text-slate-800 dark:text-slate-200 hover:underline truncate cursor-pointer"
                        >
                          {b.label}
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteBookmark(b.id)}
                          className="text-slate-400 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Chapter {selectedChapter} Highlights ({chapterAnnotations.length})
                  </p>
                  {chapterAnnotations.length === 0 ? (
                    <p className="text-xs text-slate-500">
                      Select text in the textbook and click “Annotate” to save notes here.
                    </p>
                  ) : (
                    chapterAnnotations.map((a) => (
                      <div
                        key={a.id}
                        className="rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900 p-2.5 text-xs space-y-1"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="italic text-slate-800 dark:text-slate-200">
                            “{a.selectedText}”
                          </p>
                          <button
                            type="button"
                            onClick={() => onDeleteAnnotation(a.id)}
                            className="text-slate-400 hover:text-rose-600 cursor-pointer shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400">{a.note}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
