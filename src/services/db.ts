import type {
  AppBackupPayload,
  AssessmentAttempt,
  MistakeRecord,
  NotebookEntry,
  ReaderAnnotation,
  ReaderBookmark,
  ReaderPreferences,
  SpeechPreferences,
  StoredBookPackage,
  TopicProgress,
} from '../types/grammar';

const DB_NAME = 'nutshell-grammar-db';
const DB_VERSION = 1;

const STORES = {
  progress: 'progress',
  mistakes: 'mistakes',
  assessments: 'assessments',
  notebook: 'notebook',
  bookmarks: 'bookmarks',
  annotations: 'annotations',
  meta: 'meta',
  book: 'book',
} as const;

export const DEFAULT_SPEECH_PREFS: SpeechPreferences = {
  voiceURI: '',
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0,
  preferredLocale: 'de-DE',
};

export const DEFAULT_READER_PREFS: ReaderPreferences = {
  theme: 'light',
  fontSize: 17,
  lineHeight: 1.7,
  maxWidth: 'medium',
  showAppHelperInline: true,
};

let dbPromise: Promise<IDBDatabase | null> | null = null;
const memoryStores = new Map<string, Map<string, unknown>>();

function getMemoryStore(storeName: string): Map<string, unknown> {
  let map = memoryStores.get(storeName);
  if (!map) {
    map = new Map<string, unknown>();
    memoryStores.set(storeName, map);
  }
  return map;
}

function getKeyForStore(storeName: string, value: Record<string, unknown>): string {
  if (storeName === STORES.progress) return String(value.sectionId || '');
  if (storeName === STORES.meta) return String(value.key || '');
  return String(value.id || '');
}

function openDB(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;
  if (typeof indexedDB === 'undefined') {
    dbPromise = Promise.resolve(null);
    return dbPromise;
  }
  dbPromise = new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORES.progress)) {
          db.createObjectStore(STORES.progress, { keyPath: 'sectionId' });
        }
        if (!db.objectStoreNames.contains(STORES.mistakes)) {
          db.createObjectStore(STORES.mistakes, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.assessments)) {
          db.createObjectStore(STORES.assessments, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.notebook)) {
          db.createObjectStore(STORES.notebook, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.bookmarks)) {
          db.createObjectStore(STORES.bookmarks, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.annotations)) {
          db.createObjectStore(STORES.annotations, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.meta)) {
          db.createObjectStore(STORES.meta, { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains(STORES.book)) {
          db.createObjectStore(STORES.book, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

async function getAllFromStore<T>(storeName: string): Promise<T[]> {
  const db = await openDB();
  if (!db) return Array.from(getMemoryStore(storeName).values()) as T[];
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readonly');
      const req = tx.objectStore(storeName).getAll();
      req.onsuccess = () => resolve((req.result as T[]) || []);
      req.onerror = () => resolve(Array.from(getMemoryStore(storeName).values()) as T[]);
    } catch {
      resolve(Array.from(getMemoryStore(storeName).values()) as T[]);
    }
  });
}

async function putInStore<T>(storeName: string, value: T): Promise<void> {
  const key = getKeyForStore(storeName, value as unknown as Record<string, unknown>);
  if (key) getMemoryStore(storeName).set(key, value);
  const db = await openDB();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).put(value);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

async function deleteFromStore(storeName: string, key: string): Promise<void> {
  getMemoryStore(storeName).delete(key);
  const db = await openDB();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

async function clearStore(storeName: string): Promise<void> {
  getMemoryStore(storeName).clear();
  const db = await openDB();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

async function getMeta<T>(key: string, fallback: T): Promise<T> {
  const db = await openDB();
  if (!db) {
    const rec = getMemoryStore(STORES.meta).get(key) as { key: string; value: T } | undefined;
    return rec ? rec.value : fallback;
  }
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORES.meta, 'readonly');
      const req = tx.objectStore(STORES.meta).get(key);
      req.onsuccess = () => {
        const record = req.result as { key: string; value: T } | undefined;
        resolve(record ? record.value : fallback);
      };
      req.onerror = () => resolve(fallback);
    } catch {
      resolve(fallback);
    }
  });
}

async function setMeta<T>(key: string, value: T): Promise<void> {
  await putInStore(STORES.meta, { key, value });
}

export const dbService = {
  // Progress
  getAllProgress: () => getAllFromStore<TopicProgress>(STORES.progress),
  saveProgress: (progress: TopicProgress) => putInStore(STORES.progress, progress),

  // Mistakes
  getAllMistakes: () => getAllFromStore<MistakeRecord>(STORES.mistakes),
  saveMistake: (mistake: MistakeRecord) => putInStore(STORES.mistakes, mistake),
  deleteMistake: (id: string) => deleteFromStore(STORES.mistakes, id),

  // Assessments
  getAllAssessments: () => getAllFromStore<AssessmentAttempt>(STORES.assessments),
  saveAssessment: (attempt: AssessmentAttempt) => putInStore(STORES.assessments, attempt),

  // Notebook
  getAllNotebook: () => getAllFromStore<NotebookEntry>(STORES.notebook),
  saveNotebookEntry: (entry: NotebookEntry) => putInStore(STORES.notebook, entry),
  deleteNotebookEntry: (id: string) => deleteFromStore(STORES.notebook, id),

  // Reader bookmarks & annotations
  getAllBookmarks: () => getAllFromStore<ReaderBookmark>(STORES.bookmarks),
  saveBookmark: (bookmark: ReaderBookmark) => putInStore(STORES.bookmarks, bookmark),
  deleteBookmark: (id: string) => deleteFromStore(STORES.bookmarks, id),

  getAllAnnotations: () => getAllFromStore<ReaderAnnotation>(STORES.annotations),
  saveAnnotation: (annotation: ReaderAnnotation) => putInStore(STORES.annotations, annotation),
  deleteAnnotation: (id: string) => deleteFromStore(STORES.annotations, id),

  // Preferences & Last Location
  getSpeechPrefs: () => getMeta<SpeechPreferences>('speechPrefs', DEFAULT_SPEECH_PREFS),
  saveSpeechPrefs: (prefs: SpeechPreferences) => setMeta('speechPrefs', prefs),

  getReaderPrefs: () => getMeta<ReaderPreferences>('readerPrefs', DEFAULT_READER_PREFS),
  saveReaderPrefs: (prefs: ReaderPreferences) => setMeta('readerPrefs', prefs),

  getLastLocation: () =>
    getMeta<AppBackupPayload['lastLocation']>('lastLocation', null),
  saveLastLocation: (loc: NonNullable<AppBackupPayload['lastLocation']>) =>
    setMeta('lastLocation', loc),

  // Stored custom/imported textbook package
  getStoredBook: async (): Promise<StoredBookPackage | null> => {
    const db = await openDB();
    if (!db) {
      return (getMemoryStore(STORES.book).get('active-book') as StoredBookPackage) || null;
    }
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORES.book, 'readonly');
        const req = tx.objectStore(STORES.book).get('active-book');
        req.onsuccess = () => resolve((req.result as StoredBookPackage) || null);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  },
  saveStoredBook: (pkg: StoredBookPackage) => putInStore(STORES.book, pkg),
  clearStoredBook: () => deleteFromStore(STORES.book, 'active-book'),

  // Full Export / Restore JSON Backup
  exportBackup: async (): Promise<AppBackupPayload> => {
    const [
      progress,
      mistakes,
      assessments,
      notebook,
      bookmarks,
      annotations,
      speechPrefs,
      readerPrefs,
      lastLocation,
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

    return {
      version: 1,
      exportedAt: Date.now(),
      progress,
      mistakes,
      assessments,
      notebook,
      bookmarks,
      annotations,
      speechPrefs,
      readerPrefs,
      lastLocation,
    };
  },

  importBackup: async (payload: AppBackupPayload): Promise<void> => {
    if (!payload || typeof payload !== 'object' || payload.version !== 1) {
      throw new Error('Invalid backup format. Expected a version 1 Nutshell Grammar backup file.');
    }

    await Promise.all([
      clearStore(STORES.progress),
      clearStore(STORES.mistakes),
      clearStore(STORES.assessments),
      clearStore(STORES.notebook),
      clearStore(STORES.bookmarks),
      clearStore(STORES.annotations),
    ]);

    for (const item of payload.progress || []) await dbService.saveProgress(item);
    for (const item of payload.mistakes || []) await dbService.saveMistake(item);
    for (const item of payload.assessments || []) await dbService.saveAssessment(item);
    for (const item of payload.notebook || []) await dbService.saveNotebookEntry(item);
    for (const item of payload.bookmarks || []) await dbService.saveBookmark(item);
    for (const item of payload.annotations || []) await dbService.saveAnnotation(item);
    if (payload.speechPrefs) await dbService.saveSpeechPrefs(payload.speechPrefs);
    if (payload.readerPrefs) await dbService.saveReaderPrefs(payload.readerPrefs);
    if (payload.lastLocation) await dbService.saveLastLocation(payload.lastLocation);
  },

  resetLearningData: async (): Promise<void> => {
    await Promise.all([
      clearStore(STORES.progress),
      clearStore(STORES.mistakes),
      clearStore(STORES.assessments),
      clearStore(STORES.notebook),
      clearStore(STORES.bookmarks),
      clearStore(STORES.annotations),
    ]);
    await setMeta('lastLocation', null);
  },
};
