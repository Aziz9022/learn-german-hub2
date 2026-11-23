import { useEffect, useState } from 'react';
import {
  Upload,
  Volume2,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Sun,
  Moon,
  Globe,
  RefreshCw,
} from 'lucide-react';
import { dbService } from '../services/db';
import { speechService, type GermanVoiceInfo } from '../services/speechService';
import type {
  AppBackupPayload,
  ReaderPreferences,
  SpeechPreferences,
  StoredBookPackage,
} from '../types/grammar';

interface ImportSettingsViewProps {
  bookPkg: StoredBookPackage | null;
  missingImagesCount: number;
  speechPrefs: SpeechPreferences;
  readerPrefs: ReaderPreferences;
  onUpdateSpeechPrefs: (next: SpeechPreferences) => void;
  onUpdateReaderPrefs: (next: ReaderPreferences) => void;
  onImportBookFiles: (files: FileList) => Promise<void>;
  onResetToPreloadedBook: () => Promise<void>;
  onReloadAllData: () => Promise<void>;
}

export function ImportSettingsView({
  bookPkg,
  missingImagesCount,
  speechPrefs,
  readerPrefs,
  onUpdateSpeechPrefs,
  onUpdateReaderPrefs,
  onImportBookFiles,
  onResetToPreloadedBook,
  onReloadAllData,
}: ImportSettingsViewProps) {
  const [voices, setVoices] = useState<GermanVoiceInfo[]>(() => speechService.getGermanVoices());
  const [importStatus, setImportStatus] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);
  const [backupStatus, setBackupStatus] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);
  const [importing, setImporting] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    const unsub = speechService.subscribeVoices(setVoices);
    speechService.refreshVoices();
    return unsub;
  }, []);

  const diag = speechService.getDiagnostics();

  const handleBookFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setImporting(true);
    setImportStatus(null);
    try {
      await onImportBookFiles(files);
      setImportStatus({
        type: 'ok',
        msg: `Successfully imported ${files.length} file(s) into local IndexedDB with DOMPurify sanitization.`,
      });
    } catch (err) {
      setImportStatus({
        type: 'err',
        msg: err instanceof Error ? err.message : 'Could not import textbook files.',
      });
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const handleExportBackup = async () => {
    try {
      const payload = await dbService.exportBackup();
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `german-grammar-nutshell-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setBackupStatus({ type: 'ok', msg: 'Backup JSON exported cleanly.' });
    } catch (err) {
      setBackupStatus({
        type: 'err',
        msg: err instanceof Error ? err.message : 'Export failed.',
      });
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBackupStatus(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as AppBackupPayload;
      await dbService.importBackup(parsed);
      await onReloadAllData();
      setBackupStatus({
        type: 'ok',
        msg: 'Learning progress, mistakes, assessments, notebook, and settings restored!',
      });
    } catch (err) {
      setBackupStatus({
        type: 'err',
        msg: err instanceof Error ? err.message : 'Invalid backup JSON file.',
      });
    } finally {
      e.target.value = '';
    }
  };

  const handleResetProgress = async () => {
    await dbService.resetLearningData();
    await onReloadAllData();
    setConfirmReset(false);
    setBackupStatus({ type: 'ok', msg: 'All personal learning progress and notes were cleared.' });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <header className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131C26] p-6">
        <h1 className="text-2xl font-display font-semibold text-slate-900 dark:text-white">
          Textbook Import, German Voice & Settings
        </h1>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
          Configure German Web Speech synthesis, import HTML/CSS/images/ZIP textbook packages locally into IndexedDB, export backups, or switch themes.
        </p>
      </header>

      {/* 1. German Pronunciation & Web Speech API Studio */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131C26] p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-display font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-[#1E3A5F] dark:text-sky-400" />
            <span>German Pronunciation (Browser Web Speech API)</span>
          </h2>
          <button
            type="button"
            onClick={() => setVoices(speechService.refreshVoices())}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-[#1E3A5F] cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Voices</span>
          </button>
        </div>

        {voices.length === 0 ? (
          <div className="rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-4 text-xs text-amber-950 dark:text-amber-200 space-y-1.5">
            <p className="font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>No German Voice Detected ({diag.totalBrowserVoices} total browser voices scanned)</span>
            </p>
            <p>
              To protect your pronunciation, this platform strictly refuses to fall back to an English voice for German text. Please install a German voice (<code>de-DE</code>, <code>de-AT</code>, or <code>de-CH</code>) in your operating system’s Text-to-Speech settings (Windows Speech, macOS Spoken Content, Android/iOS Speech Services), then click “Refresh Voices”.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <label className="space-y-1.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                German Voice ({voices.length} available)
              </span>
              <select
                value={speechPrefs.voiceURI}
                onChange={(e) => onUpdateSpeechPrefs({ ...speechPrefs, voiceURI: e.target.value })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white"
              >
                {voices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang}){v.localService ? ' · Offline' : ''}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                Preferred German Region
              </span>
              <select
                value={speechPrefs.preferredLocale}
                onChange={(e) =>
                  onUpdateSpeechPrefs({
                    ...speechPrefs,
                    preferredLocale: e.target.value as SpeechPreferences['preferredLocale'],
                  })
                }
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white"
              >
                <option value="de-DE">Germany (de-DE — Priority Default)</option>
                <option value="de-AT">Austria (de-AT)</option>
                <option value="de-CH">Switzerland (de-CH)</option>
              </select>
            </label>

            <label className="space-y-1.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex justify-between">
                <span>Playback Speed</span>
                <span className="font-mono tabular-nums">{speechPrefs.rate.toFixed(2)}×</span>
              </span>
              <input
                type="range"
                min={0.5}
                max={1.3}
                step={0.05}
                value={speechPrefs.rate}
                onChange={(e) => onUpdateSpeechPrefs({ ...speechPrefs, rate: Number(e.target.value) })}
                className="w-full accent-[#1E3A5F]"
              />
              <div className="flex gap-1.5">
                {[0.5, 0.75, 1.0].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => onUpdateSpeechPrefs({ ...speechPrefs, rate: r })}
                    className={`px-2.5 py-1 rounded border font-mono cursor-pointer ${
                      Math.abs(speechPrefs.rate - r) < 0.03
                        ? 'bg-[#1E3A5F] text-white border-[#1E3A5F]'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {r}× {r === 0.5 ? '(Very Slow)' : r === 0.75 ? '(Beginner)' : '(Normal)'}
                  </button>
                ))}
              </div>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1.5">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex justify-between">
                  <span>Pitch</span>
                  <span className="font-mono tabular-nums">{speechPrefs.pitch.toFixed(1)}</span>
                </span>
                <input
                  type="range"
                  min={0.8}
                  max={1.2}
                  step={0.1}
                  value={speechPrefs.pitch}
                  onChange={(e) =>
                    onUpdateSpeechPrefs({ ...speechPrefs, pitch: Number(e.target.value) })
                  }
                  className="w-full accent-[#1E3A5F]"
                />
              </label>

              <label className="space-y-1.5">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex justify-between">
                  <span>Volume</span>
                  <span className="font-mono tabular-nums">{Math.round(speechPrefs.volume * 100)}%</span>
                </span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={speechPrefs.volume}
                  onChange={(e) =>
                    onUpdateSpeechPrefs({ ...speechPrefs, volume: Number(e.target.value) })
                  }
                  className="w-full accent-[#1E3A5F]"
                />
              </label>
            </div>
          </div>
        )}

        <div className="pt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() =>
              speechService.speak(
                'Guten Tag! Herr Mayer gibt seinem Kollegen den Schlüssel. Wir lernen heute deutsche Grammatik.'
              )
            }
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#1E3A5F] hover:bg-[#162C49] text-white px-4 py-2 text-xs font-semibold cursor-pointer"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Test German Pronunciation</span>
          </button>
          <button
            type="button"
            onClick={() => speechService.speak('Ich fahre morgen mit dem Bus zur Arbeit.', 0.65)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <span>Test Slow Learner Speed (0.65×)</span>
          </button>
        </div>
      </section>

      {/* 2. Textbook Import (HTML, CSS, Images & ZIP) */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131C26] p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-display font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Upload className="w-5 h-5 text-[#1E3A5F] dark:text-sky-400" />
            <span>Textbook Source Import (HTML / CSS / Images / ZIP)</span>
          </h2>
          {bookPkg?.isCustomImport && (
            <button
              type="button"
              onClick={onResetToPreloadedBook}
              className="text-xs underline text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
            >
              Revert to Preloaded Copy
            </button>
          )}
        </div>

        <div className="rounded-lg bg-slate-50 dark:bg-slate-900/60 p-4 text-xs space-y-1">
          <p className="font-semibold text-slate-900 dark:text-white">
            Active Source: {bookPkg ? `${bookPkg.title} (${bookPkg.sourceName})` : 'None loaded'}
          </p>
          <p className="text-slate-600 dark:text-slate-400">
            Bundled Image Assets Stored Offline: <strong className="font-mono">{bookPkg?.assets.length || 0}</strong> · Optional Unbundled Cartoons/Covers: <strong className="font-mono">{missingImagesCount}</strong>
          </p>
          {missingImagesCount > 0 && (
            <p className="text-slate-600 dark:text-slate-400 pt-1">
              All official end-of-book reference tables (pp. 165–195) are already included from the supplied Appendix PDF. You may optionally upload the <code>images/</code> folder or a complete <code>.zip</code> archive below if you also want the decorative chapter cartoons stored offline.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 rounded-xl bg-[#1E3A5F] hover:bg-[#162C49] text-white px-4 py-2.5 text-xs font-semibold cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>{importing ? 'Importing & Sanitizing...' : 'Import ZIP / HTML / CSS / Images'}</span>
            <input
              type="file"
              multiple
              accept=".zip,.html,.htm,.xhtml,.css,.jpg,.jpeg,.png,.gif,.webp,.svg"
              onChange={handleBookFileChange}
              className="hidden"
              disabled={importing}
            />
          </label>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            All HTML is sanitized with DOMPurify (scripts & event handlers stripped). Files never leave your browser.
          </span>
        </div>

        {importStatus && (
          <p
            className={`text-xs flex items-center gap-1.5 ${
              importStatus.type === 'ok'
                ? 'text-emerald-700 dark:text-emerald-400'
                : 'text-rose-700 dark:text-rose-400'
            }`}
          >
            {importStatus.type === 'ok' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{importStatus.msg}</span>
          </p>
        )}
      </section>

      {/* 3. Theme, Backup & Restore */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131C26] p-6 space-y-4">
          <h2 className="text-base font-display font-semibold text-slate-900 dark:text-white">
            Appearance & Reading Theme
          </h2>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => onUpdateReaderPrefs({ ...readerPrefs, theme: 'light' })}
              className={`flex items-center justify-center gap-2 rounded-xl border py-3 text-xs font-semibold cursor-pointer ${
                readerPrefs.theme === 'light'
                  ? 'border-[#1E3A5F] bg-[#1E3A5F] text-white'
                  : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Sun className="w-4 h-4" />
              <span>Light Editorial</span>
            </button>
            <button
              type="button"
              onClick={() => onUpdateReaderPrefs({ ...readerPrefs, theme: 'dark' })}
              className={`flex items-center justify-center gap-2 rounded-xl border py-3 text-xs font-semibold cursor-pointer ${
                readerPrefs.theme === 'dark'
                  ? 'border-sky-500 bg-sky-600 text-white'
                  : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Moon className="w-4 h-4" />
              <span>Dark Study</span>
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131C26] p-6 space-y-4">
          <h2 className="text-base font-display font-semibold text-slate-900 dark:text-white">
            Backup & Restore Progress (IndexedDB)
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleExportBackup}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1E3A5F] text-white px-3.5 py-2 text-xs font-semibold cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON Backup</span>
            </button>
            <label className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
              <Upload className="w-3.5 h-3.5" />
              <span>Restore Backup</span>
              <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
            </label>
          </div>

          {!confirmReset ? (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="inline-flex items-center gap-1 text-xs text-rose-700 dark:text-rose-400 hover:underline cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset All Learning Progress</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-rose-700 dark:text-rose-400 font-semibold">Are you sure?</span>
              <button
                type="button"
                onClick={handleResetProgress}
                className="rounded bg-rose-600 text-white px-2.5 py-1 font-semibold cursor-pointer"
              >
                Yes, Reset
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="rounded border border-slate-300 dark:border-slate-700 px-2.5 py-1 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}

          {backupStatus && (
            <p
              className={`text-xs ${
                backupStatus.type === 'ok'
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-rose-700 dark:text-rose-400'
              }`}
            >
              {backupStatus.msg}
            </p>
          )}
        </section>
      </div>

      {/* 4. GitHub Pages Static Hosting & Copyright Safety Guide */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131C26] p-6 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
        <h2 className="text-base font-display font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Globe className="w-4 h-4 text-[#1E3A5F] dark:text-sky-400" />
          <span>GitHub Pages Deployment & Copyright Integrity</span>
        </h2>
        <p>
          This application is configured with relative Vite asset paths (<code>base: './'</code>) and full offline PWA caching so it deploys cleanly to GitHub Pages or any static host.
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Copyright Safety:</strong> Before pushing to a public GitHub repository, remove any copyrighted textbook HTML/image files from <code>public/assets/</code>. Learners can import their legally owned textbook HTML/CSS/ZIP directly into their private browser IndexedDB using the importer above.
          </li>
          <li>
            <strong>Zero-Backend Mode:</strong> On static hosts like GitHub Pages, the Textbook Reader, 15-Chapter Learning Path, Grammar Laboratory, Visualiser, Offline Rule-Based Sentence Analyzer, all 26 Official Exercises, Assessments, Mistake Lab, Notebook, and German Web Speech TTS run 100% locally in the browser.
          </li>
          <li>
            <strong>Build Command:</strong> Run <code>npm run build</code> and publish the generated <code>dist/</code> folder (or set <code>VITE_BASE_PATH=/your-repo/ npm run build</code>).
          </li>
        </ul>
      </section>
    </div>
  );
}
