import type { SpeechPreferences } from '../types/grammar';
import { DEFAULT_SPEECH_PREFS } from './db';

export interface GermanVoiceInfo {
  voiceURI: string;
  name: string;
  lang: string;
  localService: boolean;
  isDefault: boolean;
  raw: SpeechSynthesisVoice;
}

export interface SpeechPlaybackState {
  status: 'idle' | 'playing' | 'paused' | 'error';
  currentText: string;
  activeSentenceIndex: number;
  totalSentences: number;
  activeWordCharIndex: number;
  warning: string | null;
}

/**
 * Extensible TTS Provider contract so optional future AI/cloud German TTS
 * providers can be plugged in cleanly while keeping Browser Web Speech API
 * as the zero-cost offline default.
 */
export interface TTSProvider {
  readonly id: string;
  readonly label: string;
  isAvailable(): boolean;
  speak(text: string, prefs: SpeechPreferences, onBoundary?: (charIndex: number) => void): Promise<void>;
  pause(): void;
  resume(): void;
  stop(): void;
}

type StateListener = (state: SpeechPlaybackState) => void;
type VoiceListener = (voices: GermanVoiceInfo[]) => void;

class GermanSpeechService {
  private prefs: SpeechPreferences = { ...DEFAULT_SPEECH_PREFS };
  private germanVoices: GermanVoiceInfo[] = [];
  private allVoicesCount = 0;
  private initialized = false;
  private state: SpeechPlaybackState = {
    status: 'idle',
    currentText: '',
    activeSentenceIndex: -1,
    totalSentences: 0,
    activeWordCharIndex: -1,
    warning: null,
  };
  private lastSpokenText = '';
  private sentenceQueue: string[] = [];
  private currentSentenceIdx = 0;
  private cancelToken = 0;
  private stateListeners = new Set<StateListener>();
  private voiceListeners = new Set<VoiceListener>();

  init(initialPrefs?: SpeechPreferences) {
    if (initialPrefs) {
      this.prefs = { ...DEFAULT_SPEECH_PREFS, ...initialPrefs };
    }
    if (this.initialized || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      this.refreshVoices();
      return;
    }
    this.initialized = true;
    this.refreshVoices();
    window.speechSynthesis.addEventListener('voiceschanged', this.handleVoicesChanged);
  }

  private handleVoicesChanged = () => {
    this.refreshVoices();
  };

  isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  refreshVoices(): GermanVoiceInfo[] {
    if (!this.isSupported()) {
      this.germanVoices = [];
      this.allVoicesCount = 0;
      this.notifyVoices();
      return [];
    }

    const voices = window.speechSynthesis.getVoices();
    this.allVoicesCount = voices.length;

    const filtered = voices
      .filter((v) => /^de(-|_|$)/i.test(v.lang))
      .map((v) => ({
        voiceURI: v.voiceURI,
        name: v.name,
        lang: v.lang.replace('_', '-'),
        localService: v.localService,
        isDefault: v.default,
        raw: v,
      }))
      .sort((a, b) => {
        const rank = (lang: string) => {
          const lower = lang.toLowerCase();
          if (lower === this.prefs.preferredLocale.toLowerCase()) return 0;
          if (lower === 'de-de') return 1;
          if (lower === 'de-at') return 2;
          if (lower === 'de-ch') return 3;
          return 4;
        };
        const diff = rank(a.lang) - rank(b.lang);
        if (diff !== 0) return diff;
        return a.name.localeCompare(b.name);
      });

    this.germanVoices = filtered;

    // Auto-select best German voice if none selected or saved URI disappeared
    if (
      filtered.length > 0 &&
      (!this.prefs.voiceURI || !filtered.some((v) => v.voiceURI === this.prefs.voiceURI))
    ) {
      this.prefs = { ...this.prefs, voiceURI: filtered[0].voiceURI };
    }

    this.notifyVoices();
    return filtered;
  }

  getGermanVoices(): GermanVoiceInfo[] {
    if (this.germanVoices.length === 0 && this.isSupported()) {
      this.refreshVoices();
    }
    return this.germanVoices;
  }

  getDiagnostics(): {
    supported: boolean;
    totalBrowserVoices: number;
    germanVoicesCount: number;
    selectedVoiceName: string | null;
    selectedVoiceLang: string | null;
  } {
    const selected = this.resolveSelectedGermanVoice();
    return {
      supported: this.isSupported(),
      totalBrowserVoices: this.allVoicesCount,
      germanVoicesCount: this.germanVoices.length,
      selectedVoiceName: selected ? selected.name : null,
      selectedVoiceLang: selected ? selected.lang : null,
    };
  }

  setPreferences(next: SpeechPreferences) {
    this.prefs = { ...next };
    this.refreshVoices();
  }

  getPreferences(): SpeechPreferences {
    return { ...this.prefs };
  }

  getState(): SpeechPlaybackState {
    return { ...this.state };
  }

  subscribeState(fn: StateListener): () => void {
    this.stateListeners.add(fn);
    fn(this.getState());
    return () => this.stateListeners.delete(fn);
  }

  subscribeVoices(fn: VoiceListener): () => void {
    this.voiceListeners.add(fn);
    fn(this.getGermanVoices());
    return () => this.voiceListeners.delete(fn);
  }

  private emitState(patch: Partial<SpeechPlaybackState>) {
    this.state = { ...this.state, ...patch };
    const snapshot = this.getState();
    this.stateListeners.forEach((fn) => fn(snapshot));
  }

  private notifyVoices() {
    const list = [...this.germanVoices];
    this.voiceListeners.forEach((fn) => fn(list));
  }

  /**
   * Resolves an authentic German voice (de-DE / de-AT / de-CH).
   * STRICT RULE: Never silently returns an English or non-German voice!
   */
  private resolveSelectedGermanVoice(): GermanVoiceInfo | null {
    const voices = this.getGermanVoices();
    if (voices.length === 0) return null;
    const exact = voices.find((v) => v.voiceURI === this.prefs.voiceURI);
    return exact || voices[0];
  }

  private cleanGermanText(raw: string): string {
    return raw
      .replace(/\[[^\]]*\]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private splitIntoSentences(text: string): string[] {
    const cleaned = this.cleanGermanText(text);
    if (!cleaned) return [];
    const parts = cleaned
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    return parts.length > 0 ? parts : [cleaned];
  }

  speak(rawText: string, overrideRate?: number): boolean {
    const cleaned = this.cleanGermanText(rawText);
    if (!cleaned) return false;

    if (!this.isSupported()) {
      this.emitState({
        status: 'error',
        warning:
          'Your browser does not support Web Speech synthesis. Try Chrome, Edge, Safari, or Firefox on desktop/mobile.',
      });
      return false;
    }

    // Always cancel ongoing playback cleanly so utterances never overlap
    this.stop();

    const germanVoice = this.resolveSelectedGermanVoice();
    if (!germanVoice) {
      this.emitState({
        status: 'error',
        currentText: cleaned,
        activeSentenceIndex: -1,
        totalSentences: 0,
        activeWordCharIndex: -1,
        warning:
          'No German (de-DE / de-AT / de-CH) voice is currently available in your browser. Playback was blocked to prevent mispronouncing German with an English voice. Install a German system voice in your OS speech settings or check Settings → German Pronunciation.',
      });
      return false;
    }

    this.lastSpokenText = cleaned;
    this.sentenceQueue = this.splitIntoSentences(cleaned);
    this.currentSentenceIdx = 0;
    const token = ++this.cancelToken;

    this.emitState({
      status: 'playing',
      currentText: cleaned,
      activeSentenceIndex: 0,
      totalSentences: this.sentenceQueue.length,
      activeWordCharIndex: 0,
      warning: null,
    });

    this.speakSentenceAt(0, token, germanVoice, overrideRate ?? this.prefs.rate);
    return true;
  }

  private speakSentenceAt(
    idx: number,
    token: number,
    voice: GermanVoiceInfo,
    rate: number
  ) {
    if (token !== this.cancelToken) return;
    if (idx >= this.sentenceQueue.length) {
      this.emitState({
        status: 'idle',
        activeSentenceIndex: -1,
        activeWordCharIndex: -1,
      });
      return;
    }

    const sentence = this.sentenceQueue[idx];
    const utterance = new SpeechSynthesisUtterance(sentence);
    utterance.voice = voice.raw;
    utterance.lang = voice.lang || this.prefs.preferredLocale;
    utterance.rate = Math.min(1.5, Math.max(0.5, rate));
    utterance.pitch = Math.min(1.3, Math.max(0.7, this.prefs.pitch));
    utterance.volume = Math.min(1.0, Math.max(0.0, this.prefs.volume));

    utterance.onstart = () => {
      if (token !== this.cancelToken) return;
      this.emitState({
        status: 'playing',
        activeSentenceIndex: idx,
        activeWordCharIndex: 0,
      });
    };

    utterance.onboundary = (event) => {
      if (token !== this.cancelToken) return;
      if (event.name === 'word') {
        this.emitState({ activeWordCharIndex: event.charIndex });
      }
    };

    utterance.onend = () => {
      if (token !== this.cancelToken) return;
      this.currentSentenceIdx = idx + 1;
      this.speakSentenceAt(idx + 1, token, voice, rate);
    };

    utterance.onerror = (event) => {
      if (token !== this.cancelToken) return;
      if (event.error === 'canceled' || event.error === 'interrupted') {
        return;
      }
      this.emitState({
        status: 'error',
        warning: `German speech synthesis interrupted (${event.error}). Try selecting a local German voice in Settings.`,
      });
    };

    window.speechSynthesis.speak(utterance);
  }

  pause() {
    if (!this.isSupported()) return;
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      this.emitState({ status: 'paused' });
    }
  }

  resume() {
    if (!this.isSupported()) return;
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      this.emitState({ status: 'playing' });
    }
  }

  stop() {
    this.cancelToken++;
    if (this.isSupported()) {
      window.speechSynthesis.cancel();
    }
    this.sentenceQueue = [];
    this.currentSentenceIdx = 0;
    this.emitState({
      status: 'idle',
      activeSentenceIndex: -1,
      activeWordCharIndex: -1,
      warning: null,
    });
  }

  replay(overrideRate?: number) {
    if (this.lastSpokenText) {
      this.speak(this.lastSpokenText, overrideRate);
    }
  }

  /**
   * Beginner-friendly German pronunciation guide (clearly app-generated).
   */
  getPronunciationHints(germanWord: string): string[] {
    const w = germanWord.toLowerCase();
    const hints: string[] = [];
    if (w.includes('ei')) hints.push('"ei" sounds like English "eye"');
    if (w.includes('ie')) hints.push('"ie" sounds like long "ee" in "see"');
    if (w.includes('eu') || w.includes('äu')) hints.push('"eu / äu" sounds like "oy" in "boy"');
    if (w.includes('sch')) hints.push('"sch" sounds like "sh" in "shoe"');
    if (/^(sp|st)/.test(w)) hints.push('initial "sp/st" sounds like "shp / sht"');
    if (w.includes('ch')) hints.push('"ch" is soft after e/i/ä/ö/ü and throaty after a/o/u');
    if (w.includes('ä')) hints.push('"ä" sounds like "eh" (long) or "e" in "bed"');
    if (w.includes('ö')) hints.push('"ö" — say "eh" with rounded lips');
    if (w.includes('ü')) hints.push('"ü" — say "ee" with rounded lips');
    if (w.includes('ß')) hints.push('"ß" is always a sharp voiceless "ss"');
    if (w.startsWith('v')) hints.push('"v" usually sounds like English "f"');
    if (w.includes('w')) hints.push('"w" sounds like English "v"');
    if (w.includes('z')) hints.push('"z" sounds like sharp "ts" in "cats"');
    if (w.includes('j')) hints.push('"j" sounds like English "y" in "yes"');
    return hints;
  }
}

export const speechService = new GermanSpeechService();
