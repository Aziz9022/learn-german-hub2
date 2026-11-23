import { useCallback, useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Compass,
  BookOpen,
  FlaskConical,
  GitBranch,
  Sparkles,
  Target,
  AlertCircle,
  NotebookPen,
  Settings,
  Sun,
  Moon,
  Menu,
  X,
} from 'lucide-react';
import {
  DEFAULT_READER_PREFS,
  DEFAULT_SPEECH_PREFS,
  dbService,
} from './services/db';
import {
  importTextbookFiles,
  loadPreloadedBookPackage,
  parseBookHtmlDocument,
  type ParsedBookDocument,
} from './services/bookParser';
import { speechService } from './services/speechService';
import type {
  AssessmentAttempt,
  MistakeRecord,
  NavSection,
  NotebookEntry,
  ReaderAnnotation,
  ReaderBookmark,
  ReaderPreferences,
  SpeechPreferences,
  StoredBookPackage,
  TopicProgress,
} from './types/grammar';
import { DashboardView } from './components/DashboardView';
import { LearningPathView } from './components/LearningPathView';
import { TextbookReaderView } from './components/TextbookReaderView';
import { GrammarLabView } from './components/GrammarLabView';
import { VisualiserView } from './components/VisualiserView';
import { SentenceAnalyzerView } from './components/SentenceAnalyzerView';
import { PracticeAssessmentView } from './components/PracticeAssessmentView';
import { MistakeLabView } from './components/MistakeLabView';
import { NotebookView } from './components/NotebookView';
import { ImportSettingsView } from './components/ImportSettingsView';
import { OfflineIndicator, PWAInstallButton } from './components/PWAStatus';
import { PronunciationBar } from './components/PronunciationBar';

const PRIMARY_NAV: { id: NavSection; label: string; shortLabel: string; icon: typeof BookOpen }[] = [
  { id: 'dashboard', label: 'Dashboard', shortLabel: 'Home', icon: LayoutDashboard },
  { id: 'path', label: 'Learning Path', shortLabel: 'Path', icon: Compass },
  { id: 'reader', label: 'Textbook', shortLabel: 'Book', icon: BookOpen },
  { id: 'lab', label: 'Grammar Lab', shortLabel: 'Lab', icon: FlaskConical },
  { id: 'visualiser', label: 'Visualiser', shortLabel: 'Visuals', icon: GitBranch },
  { id: 'analyzer', label: 'Analyzer', shortLabel: 'Analyze', icon: Sparkles },
  { id: 'practice', label: 'Practice & Tests', shortLabel: 'Practice', icon: Target },
  { id: 'mistakes', label: 'Mistakes', shortLabel: 'Mistakes', icon: AlertCircle },
  { id: 'notebook', label: 'Notebook', shortLabel: 'Notes', icon: NotebookPen },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<NavSection>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Navigation context targets
  const [selectedSectionId, setSelectedSectionId] = useState<string>('1.1');
  const [readerJump, setReaderJump] = useState<{
    anchorId?: string;
    chapterNumber?: number;
    pageNumber?: number;
    nonce?: number;
  }>({});
  const [practiceSectionFilter, setPracticeSectionFilter] = useState<string | null>(null);
  const [revisionSectionIds, setRevisionSectionIds] = useState<string[] | null>(null);

  // Persistent IndexedDB state
  const [progressMap, setProgressMap] = useState<Record<string, TopicProgress>>({});
  const [mistakes, setMistakes] = useState<MistakeRecord[]>([]);
  const [assessments, setAssessments] = useState<AssessmentAttempt[]>([]);
  const [notebook, setNotebook] = useState<NotebookEntry[]>([]);
  const [bookmarks, setBookmarks] = useState<ReaderBookmark[]>([]);
  const [annotations, setAnnotations] = useState<ReaderAnnotation[]>([]);
  const [speechPrefs, setSpeechPrefs] = useState<SpeechPreferences>(DEFAULT_SPEECH_PREFS);
  const [readerPrefs, setReaderPrefs] = useState<ReaderPreferences>(DEFAULT_READER_PREFS);
  const [lastLocation, setLastLocation] = useState<{
    sectionId: string;
    chapterNumber: number;
    anchorId?: string;
    updatedAt: number;
  } | null>(null);

  // Textbook HTML state
  const [bookPkg, setBookPkg] = useState<StoredBookPackage | null>(null);
  const [bookDoc, setBookDoc] = useState<ParsedBookDocument | null>(null);
  const [loadingBook, setLoadingBook] = useState(true);

  const hydrateLearningData = useCallback(async () => {
    try {
      const [
        progList,
        mistakeList,
        assessList,
        noteList,
        bmList,
        annList,
        spPrefs,
        rdPrefs,
        lastLoc,
      ] = await Promise.all([
        dbService.getAllProgress(),
        dbService.getAllMistakes(),
        dbService.getAllAssessments(),
        dbService.getAllNotebook(),
        dbService.getAllBookmarks(),
        dbService.getAllAnnotations(),
        dbService.getSpeechPrefs(),
        dbService.getReaderPrefs(),
        dbService.getLastLocation(),
      ]);

      const pMap: Record<string, TopicProgress> = {};
      for (const p of progList) pMap[p.sectionId] = p;
      setProgressMap(pMap);
      setMistakes(mistakeList);
      setAssessments(assessList);
      setNotebook(noteList);
      setBookmarks(bmList);
      setAnnotations(annList);
      setSpeechPrefs(spPrefs);
      setReaderPrefs(rdPrefs);
      setLastLocation(lastLoc);
      if (lastLoc?.sectionId) setSelectedSectionId(lastLoc.sectionId);
      speechService.init(spPrefs);
    } catch {
      speechService.init(DEFAULT_SPEECH_PREFS);
    }
  }, []);

  const hydrateBook = useCallback(async () => {
    setLoadingBook(true);
    try {
      let pkg: StoredBookPackage | null = null;
      try {
        pkg = await dbService.getStoredBook();
      } catch {
        pkg = null;
      }
      if (!pkg) {
        pkg = await loadPreloadedBookPackage();
      }
      if (pkg) {
        setBookPkg(pkg);
        const combined = pkg.htmlFiles.map((f) => f.content).join('\n');
        const parsed = parseBookHtmlDocument(combined, pkg.assets, {
          title: pkg.title,
          sourceName: pkg.sourceName,
          isCustomImport: pkg.isCustomImport,
        });
        setBookDoc(parsed);
      } else {
        setBookPkg(null);
        setBookDoc(null);
      }
    } catch {
      setBookPkg(null);
      setBookDoc(null);
    } finally {
      setLoadingBook(false);
    }
  }, []);

  useEffect(() => {
    hydrateLearningData();
    hydrateBook();
  }, [hydrateLearningData, hydrateBook]);

  // Apply Tailwind v4 dark class to root HTML element
  useEffect(() => {
    const root = document.documentElement;
    if (readerPrefs.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [readerPrefs.theme]);

  const handleUpdateSpeechPrefs = async (next: SpeechPreferences) => {
    setSpeechPrefs(next);
    speechService.setPreferences(next);
    await dbService.saveSpeechPrefs(next);
  };

  const handleUpdateReaderPrefs = async (next: ReaderPreferences) => {
    setReaderPrefs(next);
    await dbService.saveReaderPrefs(next);
  };

  const handleToggleTheme = () => {
    handleUpdateReaderPrefs({
      ...readerPrefs,
      theme: readerPrefs.theme === 'dark' ? 'light' : 'dark',
    });
  };

  const handleOpenSection = async (sectionId: string) => {
    const chapterNumber = parseInt(sectionId.split('.')[0], 10) || 1;
    setSelectedSectionId(sectionId);
    setActiveTab('path');
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const loc = { sectionId, chapterNumber, updatedAt: Date.now() };
    setLastLocation(loc);
    await dbService.saveLastLocation(loc);

    const existing = progressMap[sectionId];
    const updated: TopicProgress = existing
      ? { ...existing, lastVisitedAt: Date.now() }
      : {
          sectionId,
          chapterNumber,
          lastVisitedAt: Date.now(),
          readingCompleted: false,
          attemptsCount: 0,
          correctCount: 0,
          totalAnswered: 0,
          masteryScore: 0, // Never inflated just by opening a lesson!
          assessmentPassed: false,
        };
    setProgressMap((prev) => ({ ...prev, [sectionId]: updated }));
    await dbService.saveProgress(updated);
  };

  const handleMarkReadingComplete = async (sectionId: string) => {
    const chapterNumber = parseInt(sectionId.split('.')[0], 10) || 1;
    const existing = progressMap[sectionId];
    const updated: TopicProgress = existing
      ? { ...existing, readingCompleted: true, lastVisitedAt: Date.now() }
      : {
          sectionId,
          chapterNumber,
          lastVisitedAt: Date.now(),
          readingCompleted: true,
          attemptsCount: 0,
          correctCount: 0,
          totalAnswered: 0,
          masteryScore: 0, // Mastery strictly requires real practice/assessment performance
          assessmentPassed: false,
        };
    setProgressMap((prev) => ({ ...prev, [sectionId]: updated }));
    await dbService.saveProgress(updated);
  };

  const handleRecordPracticeResult = async (payload: {
    sectionId: string;
    chapterNumber: number;
    correctCount: number;
    totalCount: number;
    mistakes: Omit<MistakeRecord, 'id' | 'occurrences' | 'resolvedCount' | 'firstSeenAt' | 'lastSeenAt'>[];
  }) => {
    const existing = progressMap[payload.sectionId];
    const totalAnswered = (existing?.totalAnswered || 0) + payload.totalCount;
    const correctCount = (existing?.correctCount || 0) + payload.correctCount;
    const masteryScore = Math.round((correctCount / Math.max(1, totalAnswered)) * 100);

    const updatedProgress: TopicProgress = {
      sectionId: payload.sectionId,
      chapterNumber: payload.chapterNumber,
      lastVisitedAt: Date.now(),
      lastPracticedAt: Date.now(),
      readingCompleted: existing?.readingCompleted ?? true,
      attemptsCount: (existing?.attemptsCount || 0) + 1,
      correctCount,
      totalAnswered,
      masteryScore,
      assessmentPassed: (existing?.assessmentPassed || false) || masteryScore >= 80,
    };

    setProgressMap((prev) => ({ ...prev, [payload.sectionId]: updatedProgress }));
    await dbService.saveProgress(updatedProgress);

    // Upsert persistent mistakes (increment frequency if same item missed again!)
    if (payload.mistakes.length > 0) {
      const nextMistakes = [...mistakes];
      for (const m of payload.mistakes) {
        const keyId = `${m.exerciseId}::${m.itemId}`;
        const idx = nextMistakes.findIndex((x) => x.id === keyId);
        const now = Date.now();
        const record: MistakeRecord =
          idx >= 0
            ? {
                ...nextMistakes[idx],
                userAnswer: m.userAnswer,
                occurrences: nextMistakes[idx].occurrences + 1,
                lastSeenAt: now,
              }
            : {
                ...m,
                id: keyId,
                occurrences: 1,
                resolvedCount: 0,
                firstSeenAt: now,
                lastSeenAt: now,
              };
        if (idx >= 0) nextMistakes[idx] = record;
        else nextMistakes.push(record);
        await dbService.saveMistake(record);
      }
      setMistakes(nextMistakes);
    }
  };

  const handleRecordAssessment = async (
    attempt: Omit<AssessmentAttempt, 'id' | 'completedAt'>
  ) => {
    const full: AssessmentAttempt = {
      ...attempt,
      id: `assess-${Date.now()}`,
      completedAt: Date.now(),
    };
    setAssessments((prev) => [full, ...prev]);
    await dbService.saveAssessment(full);
  };

  const handleDeleteMistake = async (id: string) => {
    setMistakes((prev) => prev.filter((m) => m.id !== id));
    await dbService.deleteMistake(id);
  };

  const handleAddNotebookEntry = async (
    entry: Omit<NotebookEntry, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    const now = Date.now();
    const full: NotebookEntry = {
      ...entry,
      id: `note-${now}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: now,
      updatedAt: now,
    };
    setNotebook((prev) => [full, ...prev]);
    await dbService.saveNotebookEntry(full);
  };

  const handleUpdateNotebookEntry = async (entry: NotebookEntry) => {
    setNotebook((prev) => prev.map((n) => (n.id === entry.id ? entry : n)));
    await dbService.saveNotebookEntry(entry);
  };

  const handleDeleteNotebookEntry = async (id: string) => {
    setNotebook((prev) => prev.filter((n) => n.id !== id));
    await dbService.deleteNotebookEntry(id);
  };

  const handleAddBookmark = async (b: Omit<ReaderBookmark, 'id' | 'createdAt'>) => {
    const full: ReaderBookmark = { ...b, id: `bm-${Date.now()}`, createdAt: Date.now() };
    setBookmarks((prev) => [full, ...prev]);
    await dbService.saveBookmark(full);
  };

  const handleDeleteBookmark = async (id: string) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
    await dbService.deleteBookmark(id);
  };

  const handleAddAnnotation = async (a: Omit<ReaderAnnotation, 'id' | 'createdAt'>) => {
    const full: ReaderAnnotation = { ...a, id: `ann-${Date.now()}`, createdAt: Date.now() };
    setAnnotations((prev) => [full, ...prev]);
    await dbService.saveAnnotation(full);
  };

  const handleDeleteAnnotation = async (id: string) => {
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
    await dbService.deleteAnnotation(id);
  };

  const handleImportBookFiles = async (files: FileList) => {
    const nextPkg = await importTextbookFiles(files, bookPkg);
    await dbService.saveStoredBook(nextPkg);
    setBookPkg(nextPkg);
    const combined = nextPkg.htmlFiles.map((f) => f.content).join('\n');
    setBookDoc(
      parseBookHtmlDocument(combined, nextPkg.assets, {
        title: nextPkg.title,
        sourceName: nextPkg.sourceName,
        isCustomImport: true,
      })
    );
  };

  const handleResetToPreloadedBook = async () => {
    await dbService.clearStoredBook();
    await hydrateBook();
  };

  const handleNavigate = (tab: NavSection) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F7F4] dark:bg-[#0D131A] text-[#17202A] dark:text-[#EDF2F7] transition-colors">
      <OfflineIndicator />

      {/* Clean 3-Zone Top Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#111923]/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Zone 1: Brand Identity */}
          <button
            type="button"
            onClick={() => handleNavigate('dashboard')}
            className="flex items-center gap-2.5 text-left shrink-0 cursor-pointer"
          >
            <span className="w-8 h-8 rounded-lg bg-[#1E3A5F] text-white font-display font-bold text-sm flex items-center justify-center border border-amber-500/60">
              De
            </span>
            <div className="leading-tight">
              <p className="text-sm font-display font-semibold text-slate-900 dark:text-white">
                Grammar in a Nutshell
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:block">
                Interactive German Studio
              </p>
            </div>
          </button>

          {/* Zone 2: Desktop Primary Navigation */}
          <nav aria-label="Main navigation" className="hidden xl:flex items-center gap-1">
            {PRIMARY_NAV.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavigate(item.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-[#1E3A5F] text-white font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {item.label}
                  {item.id === 'mistakes' && mistakes.length > 0 && (
                    <span
                      className={`ml-1 font-mono text-[10px] tabular-nums ${
                        active ? 'text-amber-300' : 'text-amber-700 dark:text-amber-400'
                      }`}
                    >
                      ({mistakes.length})
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Utilities (PWA Install, Theme Toggle, Settings, Mobile Drawer Toggle) */}
          <div className="flex items-center gap-1.5 shrink-0">
            <PWAInstallButton />

            <button
              type="button"
              onClick={handleToggleTheme}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              aria-label="Toggle dark and light theme"
              title={readerPrefs.theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {readerPrefs.theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            <button
              type="button"
              onClick={() => handleNavigate('settings')}
              className={`p-2 rounded-lg border cursor-pointer transition-colors ${
                activeTab === 'settings'
                  ? 'border-[#1E3A5F] bg-[#1E3A5F] text-white'
                  : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              aria-label="Import, Voice & Settings"
              title="Import, Voice & Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="xl:hidden p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              aria-label="Open navigation menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Tablet / Mobile Expandable Drawer Navigation */}
        {mobileMenuOpen && (
          <div className="xl:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111923] px-4 py-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PRIMARY_NAV.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavigate(item.id)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium cursor-pointer ${
                    active
                      ? 'bg-[#1E3A5F] text-white font-semibold'
                      : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            progressMap={progressMap}
            mistakes={mistakes}
            assessments={assessments}
            notebook={notebook}
            lastLocation={lastLocation}
            onNavigate={handleNavigate}
            onOpenSection={handleOpenSection}
            onStartRevisionDrill={(ids) => {
              setRevisionSectionIds(ids);
              setPracticeSectionFilter(null);
              handleNavigate('practice');
            }}
          />
        )}

        {activeTab === 'path' && (
          <LearningPathView
            selectedSectionId={selectedSectionId}
            progressMap={progressMap}
            onSelectSection={handleOpenSection}
            onMarkReadingComplete={handleMarkReadingComplete}
            onOpenInReader={(anchorId, chapterNumber) => {
              setReaderJump({ anchorId, chapterNumber, nonce: Date.now() });
              handleNavigate('reader');
            }}
            onStartSectionPractice={(secId) => {
              setPracticeSectionFilter(secId);
              setRevisionSectionIds(null);
              handleNavigate('practice');
            }}
            onSaveToNotebook={handleAddNotebookEntry}
          />
        )}

        {activeTab === 'reader' && (
          <TextbookReaderView
            bookDoc={bookDoc}
            loadingBook={loadingBook}
            initialAnchorId={readerJump.anchorId}
            initialChapterNumber={readerJump.chapterNumber}
            initialPageNumber={readerJump.pageNumber}
            jumpNonce={readerJump.nonce}
            readerPrefs={readerPrefs}
            bookmarks={bookmarks}
            annotations={annotations}
            onUpdateReaderPrefs={handleUpdateReaderPrefs}
            onAddBookmark={handleAddBookmark}
            onDeleteBookmark={handleDeleteBookmark}
            onAddAnnotation={handleAddAnnotation}
            onDeleteAnnotation={handleDeleteAnnotation}
            onSaveToNotebook={handleAddNotebookEntry}
            onOpenSettings={() => handleNavigate('settings')}
            onOpenSection={handleOpenSection}
          />
        )}

        {activeTab === 'lab' && (
          <GrammarLabView
            onJumpToReaderPage={(pageNumber) => {
              setReaderJump({ pageNumber, nonce: Date.now() });
              handleNavigate('reader');
            }}
          />
        )}

        {activeTab === 'visualiser' && <VisualiserView />}

        {activeTab === 'analyzer' && (
          <SentenceAnalyzerView
            onOpenSection={handleOpenSection}
            onSaveToNotebook={handleAddNotebookEntry}
          />
        )}

        {activeTab === 'practice' && (
          <PracticeAssessmentView
            initialSectionFilter={practiceSectionFilter}
            revisionSectionIds={revisionSectionIds}
            onClearRevisionFilter={() => setRevisionSectionIds(null)}
            onRecordPracticeResult={handleRecordPracticeResult}
            onRecordAssessment={handleRecordAssessment}
            onOpenSection={handleOpenSection}
          />
        )}

        {activeTab === 'mistakes' && (
          <MistakeLabView
            mistakes={mistakes}
            onDeleteMistake={handleDeleteMistake}
            onStartRevisionDrill={(ids) => {
              setRevisionSectionIds(ids);
              setPracticeSectionFilter(null);
              handleNavigate('practice');
            }}
            onOpenSection={handleOpenSection}
            onSaveToNotebook={handleAddNotebookEntry}
          />
        )}

        {activeTab === 'notebook' && (
          <NotebookView
            entries={notebook}
            onAddEntry={handleAddNotebookEntry}
            onUpdateEntry={handleUpdateNotebookEntry}
            onDeleteEntry={handleDeleteNotebookEntry}
            onOpenSection={handleOpenSection}
          />
        )}

        {activeTab === 'settings' && (
          <ImportSettingsView
            bookPkg={bookPkg}
            missingImagesCount={bookDoc?.missingImageRefs.length || 0}
            speechPrefs={speechPrefs}
            readerPrefs={readerPrefs}
            onUpdateSpeechPrefs={handleUpdateSpeechPrefs}
            onUpdateReaderPrefs={handleUpdateReaderPrefs}
            onImportBookFiles={handleImportBookFiles}
            onResetToPreloadedBook={handleResetToPreloadedBook}
            onReloadAllData={hydrateLearningData}
          />
        )}
      </main>

      {/* Global German Speech Playback Bar */}
      <PronunciationBar
        prefs={speechPrefs}
        onUpdatePrefs={handleUpdateSpeechPrefs}
        onOpenSettings={() => handleNavigate('settings')}
      />
    </div>
  );
}
