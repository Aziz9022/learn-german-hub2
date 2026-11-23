import { useEffect, useState } from 'react';
import {
  Volume2,
  Pause,
  Play,
  Square,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import { speechService, type GermanVoiceInfo, type SpeechPlaybackState } from '../services/speechService';
import type { SpeechPreferences } from '../types/grammar';

interface PronunciationBarProps {
  prefs: SpeechPreferences;
  onUpdatePrefs: (next: SpeechPreferences) => void;
  onOpenSettings: () => void;
}

export function PronunciationBar({
  prefs,
  onUpdatePrefs,
  onOpenSettings,
}: PronunciationBarProps) {
  const [state, setState] = useState<SpeechPlaybackState>(() => speechService.getState());
  const [voices, setVoices] = useState<GermanVoiceInfo[]>(() => speechService.getGermanVoices());

  useEffect(() => {
    const unsubState = speechService.subscribeState(setState);
    const unsubVoices = speechService.subscribeVoices(setVoices);
    return () => {
      unsubState();
      unsubVoices();
    };
  }, []);

  const speedOptions = [
    { label: '0.5×', value: 0.5 },
    { label: '0.75×', value: 0.75 },
    { label: '1.0×', value: 1.0 },
  ];

  const isActive = state.status === 'playing' || state.status === 'paused';

  return (
    <div className="border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#111923]/95 backdrop-blur-sm">
      {state.warning && (
        <div className="bg-amber-50 dark:bg-amber-950/60 border-b border-amber-200 dark:border-amber-800 px-4 py-2 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <span>{state.warning}</span>
          </div>
          <button
            type="button"
            onClick={onOpenSettings}
            className="shrink-0 underline font-semibold hover:text-amber-700 dark:hover:text-amber-100 cursor-pointer"
          >
            Voice Setup
          </button>
        </div>
      )}

      {(isActive || state.currentText) && (
        <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <Volume2 className="w-4 h-4 text-[#1E3A5F] dark:text-sky-400 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">
                {state.currentText}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                German TTS · {voices.find((v) => v.voiceURI === prefs.voiceURI)?.lang || prefs.preferredLocale}
                {state.totalSentences > 1 && state.activeSentenceIndex >= 0
                  ? ` · Sentence ${state.activeSentenceIndex + 1} of ${state.totalSentences}`
                  : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {state.status === 'playing' ? (
              <button
                type="button"
                onClick={() => speechService.pause()}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
                aria-label="Pause German pronunciation"
                title="Pause"
              >
                <Pause className="w-3.5 h-3.5" />
              </button>
            ) : state.status === 'paused' ? (
              <button
                type="button"
                onClick={() => speechService.resume()}
                className="p-2 rounded-lg bg-[#1E3A5F] text-white hover:bg-[#162C49] cursor-pointer"
                aria-label="Resume German pronunciation"
                title="Resume"
              >
                <Play className="w-3.5 h-3.5" />
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => speechService.replay()}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
              aria-label="Replay"
              title="Replay"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => speechService.stop()}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
              aria-label="Stop"
              title="Stop"
            >
              <Square className="w-3.5 h-3.5" />
            </button>

            <div className="ml-1 inline-flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
              {speedOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onUpdatePrefs({ ...prefs, rate: opt.value })}
                  className={`px-2 py-1 text-[11px] font-mono tabular-nums cursor-pointer transition-colors ${
                    Math.abs(prefs.rate - opt.value) < 0.05
                      ? 'bg-[#1E3A5F] text-white font-semibold'
                      : 'bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface SpeakButtonProps {
  text: string;
  size?: 'sm' | 'md';
  label?: string;
  rate?: number;
  className?: string;
}

export function SpeakButton({
  text,
  size = 'sm',
  label,
  rate,
  className = '',
}: SpeakButtonProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        speechService.speak(text, rate);
      }}
      className={`inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:border-[#1E3A5F] dark:hover:border-sky-400 text-slate-700 dark:text-slate-200 hover:text-[#1E3A5F] dark:hover:text-sky-300 transition-colors cursor-pointer ${
        size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-xs font-medium'
      } ${className}`}
      title={`Listen in German: "${text}"`}
    >
      <Volume2 className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      {label && <span>{label}</span>}
    </button>
  );
}
