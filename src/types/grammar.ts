export type ContentSource = 'book-original' | 'app-generated' | 'ai-generated';

export type NavSection =
  | 'dashboard'
  | 'path'
  | 'reader'
  | 'lab'
  | 'visualiser'
  | 'analyzer'
  | 'practice'
  | 'mistakes'
  | 'notebook'
  | 'settings';

export interface GrammarExample {
  id: string;
  german: string;
  english: string;
  pageRef: string;
  grammarNote: string;
  source: ContentSource;
}

export interface GrammarTableData {
  id: string;
  title: string;
  pageRef: string;
  headers: string[];
  rows: string[][];
  caption?: string;
  source: ContentSource;
}

export interface BeginnerGuide {
  whatItMeans: string;
  whyUsed: string;
  whenUsed: string;
  structure: string;
  components: string[];
  exampleWalkthroughs: { german: string; english: string; breakdown: string }[];
  commonMistakes: { wrong: string; right: string; reason: string }[];
  quickCheckQuestion: {
    prompt: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

export interface BookSection {
  id: string; // e.g. "1.1"
  chapterNumber: number;
  sectionCode: string; // e.g. "1.1" or "6"
  titleDe: string;
  titleEn: string;
  pageRange: string; // e.g. "pp. 13–14"
  anchorId: string; // Calibre anchor e.g. "calibre_link-13"
  estimatedMinutes: number;
  learningObjective: string;
  prerequisites: string[]; // section IDs
  originalRuleSummary: string; // Faithful summary of the book's explanation
  originalExamples: GrammarExample[];
  tables: GrammarTableData[];
  bookExerciseIds: string[]; // e.g. ["ex-1"]
  beginnerGuide: BeginnerGuide; // Explicitly labeled Application-Generated
}

export interface BookChapter {
  number: number; // 0 for Preface, 1–15 for Chapters, 16 for Appendix
  id: string;
  titleDe: string;
  titleEn: string;
  subtitleDe?: string;
  pageRange: string;
  anchorId: string;
  summary: string;
  sections: BookSection[];
}

export type ExerciseType =
  | 'fill-blank'
  | 'multiple-choice'
  | 'article-select'
  | 'case-id'
  | 'word-order'
  | 'correction'
  | 'conjugation'
  | 'translation'
  | 'classify';

export interface ExerciseItem {
  id: string;
  prompt: string;
  hint?: string;
  options?: string[]; // for MC / article-select / classify
  acceptedAnswers: string[]; // case/whitespace normalized matching
  displayAnswer: string;
  explanation: string;
  ruleSummary: string;
  avoidMistakeTip: string;
  englishTranslation?: string;
  errorCategory: string;
}

export interface ExerciseSet {
  id: string;
  bookExerciseNumber?: number; // 1–26 for original textbook exercises
  title: string;
  instructionDe?: string;
  instructionEn: string;
  chapterNumber: number;
  sectionId: string;
  pageRef: string;
  answerKeyPageRef?: string;
  source: ContentSource;
  type: ExerciseType;
  items: ExerciseItem[];
}

export interface TopicProgress {
  sectionId: string;
  chapterNumber: number;
  lastVisitedAt: number;
  readingCompleted: boolean;
  attemptsCount: number;
  correctCount: number;
  totalAnswered: number;
  masteryScore: number; // 0–100 derived strictly from practice/assessment accuracy
  assessmentPassed: boolean;
  lastPracticedAt?: number;
}

export interface MistakeRecord {
  id: string;
  sectionId: string;
  chapterNumber: number;
  pageRef: string;
  exerciseId: string;
  itemId: string;
  prompt: string;
  userAnswer: string;
  correctAnswer: string;
  errorType: string;
  explanation: string;
  occurrences: number;
  resolvedCount: number;
  firstSeenAt: number;
  lastSeenAt: number;
}

export interface AssessmentAttempt {
  id: string;
  mode: 'concept' | 'chapter' | 'mixed' | 'cumulative';
  label: string;
  chapterNumbers: number[];
  scorePercent: number;
  correctCount: number;
  totalCount: number;
  completedAt: number;
  missedSectionIds: string[];
}

export type NotebookCategory =
  | 'rule'
  | 'table'
  | 'example'
  | 'mistake'
  | 'sentence'
  | 'bookmark'
  | 'note';

export interface NotebookEntry {
  id: string;
  category: NotebookCategory;
  title: string;
  germanText?: string;
  englishText?: string;
  content: string;
  chapterNumber?: number;
  sectionId?: string;
  pageRef?: string;
  source: ContentSource;
  createdAt: number;
  updatedAt: number;
}

export interface ReaderBookmark {
  id: string;
  anchorId: string;
  chapterNumber: number;
  label: string;
  excerpt: string;
  createdAt: number;
}

export interface ReaderAnnotation {
  id: string;
  anchorId: string;
  chapterNumber: number;
  selectedText: string;
  note: string;
  color: 'amber' | 'sky' | 'emerald';
  createdAt: number;
}

export interface SpeechPreferences {
  voiceURI: string;
  rate: number; // 0.5, 0.75, 1.0, or custom 0.5–1.5
  pitch: number; // 0.8–1.2
  volume: number; // 0–1
  preferredLocale: 'de-DE' | 'de-AT' | 'de-CH';
}

export interface ReaderPreferences {
  theme: 'light' | 'dark';
  fontSize: number; // 15–22
  lineHeight: number; // 1.5–2.0
  maxWidth: 'narrow' | 'medium' | 'wide';
  showAppHelperInline: boolean;
}

export interface ImportedBookAsset {
  path: string; // normalized relative path e.g. "images/000001.jpg"
  mimeType: string;
  dataUrl: string; // stored cleanly in IndexedDB for offline access
}

export interface StoredBookPackage {
  id: 'active-book';
  title: string;
  sourceName: string;
  importedAt: number;
  htmlFiles: { name: string; content: string }[];
  cssContent: string;
  assets: ImportedBookAsset[];
  missingImageRefs: string[];
  isCustomImport: boolean;
}

export interface AnalyzedToken {
  word: string;
  cleanWord: string;
  lemma?: string;
  partOfSpeech: string;
  englishGloss: string;
  gender?: 'masculine' | 'feminine' | 'neuter' | 'plural' | 'unknown';
  caseInfo?: string;
  grammaticalRole?: string;
  verbInfo?: string;
  bookRef?: { chapterNumber: number; sectionId: string; label: string };
  confidence: 'rule-based' | 'ai-generated' | 'uncertain';
  notes?: string;
  alternatives?: string[];
}

export interface SentenceAnalysisResult {
  sentence: string;
  englishTranslation: string;
  wordOrderPattern: string;
  clauseType: string;
  sentenceBracket?: {
    position1: string;
    finiteVerb: string;
    middleField: string;
    endBracket: string;
  };
  tokens: AnalyzedToken[];
  grammarNotes: string[];
  relatedChapters: { chapterNumber: number; sectionId: string; title: string }[];
  ambiguities: string[];
  source: 'rule-based' | 'ai-generated';
}

export interface AppBackupPayload {
  version: number;
  exportedAt: number;
  progress: TopicProgress[];
  mistakes: MistakeRecord[];
  assessments: AssessmentAttempt[];
  notebook: NotebookEntry[];
  bookmarks: ReaderBookmark[];
  annotations: ReaderAnnotation[];
  speechPrefs: SpeechPreferences;
  readerPrefs: ReaderPreferences;
  lastLocation: {
    sectionId: string;
    chapterNumber: number;
    anchorId?: string;
    updatedAt: number;
  } | null;
}
