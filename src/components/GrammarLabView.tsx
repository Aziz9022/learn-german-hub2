import { useState } from 'react';
import { FlaskConical, Search, ArrowRightLeft, ExternalLink } from 'lucide-react';
import {
  APPENDIX_DATIVE_VERBS,
  APPENDIX_GERMAN_INDEX,
  APPENDIX_GLOSSARY,
  APPENDIX_IRREGULAR_VERBS,
  APPENDIX_PHRASAL_VERBS,
} from '../data/bookAppendix';
import { APPENDIX_PDF_URL } from '../services/bookParser';
import { SpeakButton } from './PronunciationBar';

type LabModule =
  | 'articles'
  | 'nouns'
  | 'adjectives'
  | 'word-order'
  | 'verbs'
  | 'prepositions-compounds';

const LAB_TABS: { id: LabModule; label: string; chapters: string }[] = [
  { id: 'articles', label: 'Articles & Signals', chapters: 'Ch 1' },
  { id: 'nouns', label: 'Nouns & n-Declension', chapters: 'Ch 2' },
  { id: 'adjectives', label: 'Adjective Signal Jumper', chapters: 'Ch 4' },
  { id: 'word-order', label: 'Word Order & Brackets', chapters: 'Ch 5–6, 14' },
  { id: 'verbs', label: 'Verbs & Appendix Tables', chapters: 'Ch 7–12, App.' },
  { id: 'prepositions-compounds', label: 'Prepositions & Compounds', chapters: 'Ch 13, 15' },
];

type GrammarCase = 'Nom' | 'Acc' | 'Dat' | 'Gen';
type GrammarGender = 'Masc' | 'Neut' | 'Fem' | 'Pl';

const ARTICLE_MATRIX: Record<
  'der' | 'ein' | 'kein' | 'dieser' | 'mein',
  Record<GrammarCase, Record<GrammarGender, string>>
> = {
  der: {
    Nom: { Masc: 'der', Neut: 'das', Fem: 'die', Pl: 'die' },
    Acc: { Masc: 'den', Neut: 'das', Fem: 'die', Pl: 'die' },
    Dat: { Masc: 'dem', Neut: 'dem', Fem: 'der', Pl: 'den' },
    Gen: { Masc: 'des', Neut: 'des', Fem: 'der', Pl: 'der' },
  },
  ein: {
    Nom: { Masc: 'ein', Neut: 'ein', Fem: 'eine', Pl: '—' },
    Acc: { Masc: 'einen', Neut: 'ein', Fem: 'eine', Pl: '—' },
    Dat: { Masc: 'einem', Neut: 'einem', Fem: 'einer', Pl: '—' },
    Gen: { Masc: 'eines', Neut: 'eines', Fem: 'einer', Pl: '—' },
  },
  kein: {
    Nom: { Masc: 'kein', Neut: 'kein', Fem: 'keine', Pl: 'keine' },
    Acc: { Masc: 'keinen', Neut: 'kein', Fem: 'keine', Pl: 'keine' },
    Dat: { Masc: 'keinem', Neut: 'keinem', Fem: 'keiner', Pl: 'keinen' },
    Gen: { Masc: 'keines', Neut: 'keines', Fem: 'keiner', Pl: 'keiner' },
  },
  dieser: {
    Nom: { Masc: 'dieser', Neut: 'dieses', Fem: 'diese', Pl: 'diese' },
    Acc: { Masc: 'diesen', Neut: 'dieses', Fem: 'diese', Pl: 'diese' },
    Dat: { Masc: 'diesem', Neut: 'diesem', Fem: 'dieser', Pl: 'diesen' },
    Gen: { Masc: 'dieses', Neut: 'dieses', Fem: 'dieser', Pl: 'dieser' },
  },
  mein: {
    Nom: { Masc: 'mein', Neut: 'mein', Fem: 'meine', Pl: 'meine' },
    Acc: { Masc: 'meinen', Neut: 'mein', Fem: 'meine', Pl: 'meine' },
    Dat: { Masc: 'meinem', Neut: 'meinem', Fem: 'meiner', Pl: 'meinen' },
    Gen: { Masc: 'meines', Neut: 'meines', Fem: 'meiner', Pl: 'meiner' },
  },
};

const SIGNAL_KEY: Record<GrammarCase, Record<GrammarGender, string>> = {
  Nom: { Masc: '-r', Neut: '-s', Fem: '-e', Pl: '-e' },
  Acc: { Masc: '-n', Neut: '-s', Fem: '-e', Pl: '-e' },
  Dat: { Masc: '-m', Neut: '-m', Fem: '-r', Pl: '-n' },
  Gen: { Masc: '-s', Neut: '-s', Fem: '-r', Pl: '-r' },
};

const ADJ_NOUNS: Record<GrammarGender, { adj: string; noun: string; genNoun: string; datPlNoun: string; en: string }> = {
  Masc: { adj: 'trocken', noun: 'Wein', genNoun: 'Weines', datPlNoun: 'Wein', en: 'dry wine' },
  Neut: { adj: 'kühl', noun: 'Bier', genNoun: 'Bieres', datPlNoun: 'Bier', en: 'cool beer' },
  Fem: { adj: 'warm', noun: 'Milch', genNoun: 'Milch', datPlNoun: 'Milch', en: 'warm milk' },
  Pl: { adj: 'gut', noun: 'Getränke', genNoun: 'Getränke', datPlNoun: 'Getränken', en: 'good drinks' },
};

function computeAdjectivePhrase(
  artType: 'definite' | 'indefinite' | 'zero',
  c: GrammarCase,
  g: GrammarGender
): { article: string; adjStem: string; adjEnding: string; noun: string; signalCarrier: 'article' | 'adjective' | 'noun'; explanation: string } {
  const item = ADJ_NOUNS[g];
  const nounForm =
    c === 'Gen' && (g === 'Masc' || g === 'Neut')
      ? item.genNoun
      : c === 'Dat' && g === 'Pl'
        ? item.datPlNoun
        : item.noun;

  if (artType === 'definite') {
    const art = ARTICLE_MATRIX.der[c][g];
    const isBoot =
      (c === 'Nom' && g !== 'Pl') || (c === 'Acc' && (g === 'Neut' || g === 'Fem'));
    return {
      article: art,
      adjStem: item.adj,
      adjEnding: isBoot ? 'e' : 'en',
      noun: nounForm,
      signalCarrier: 'article',
      explanation: `Definite article "${art}" ALREADY carries the Key Signal (${SIGNAL_KEY[c][g]}), so the adjective takes the weak ending "-${isBoot ? 'e' : 'en'}" (Ch 4.1, p. 54).`,
    };
  }

  if (artType === 'indefinite') {
    const art = g === 'Pl' ? ARTICLE_MATRIX.kein[c][g] : ARTICLE_MATRIX.ein[c][g];
    const lacksSignal =
      (c === 'Nom' && (g === 'Masc' || g === 'Neut')) || (c === 'Acc' && g === 'Neut');
    if (lacksSignal) {
      const jumped = g === 'Masc' ? 'er' : 'es';
      return {
        article: art,
        adjStem: item.adj,
        adjEnding: jumped,
        noun: nounForm,
        signalCarrier: 'adjective',
        explanation: `"${art}" has NO signal ending here! The Key Signal (${SIGNAL_KEY[c][g]}) JUMPS onto the adjective → -${jumped}! (Ch 4.1, p. 54)`,
      };
    }
    const isFemNomAcc = g === 'Fem' && (c === 'Nom' || c === 'Acc');
    return {
      article: art,
      adjStem: item.adj,
      adjEnding: isFemNomAcc ? 'e' : 'en',
      noun: nounForm,
      signalCarrier: 'article',
      explanation: `"${art}" already shows the Key Signal (${SIGNAL_KEY[c][g]}), so the adjective stays weak (-${isFemNomAcc ? 'e' : 'en'}).`,
    };
  }

  // Zero article
  if (c === 'Gen' && (g === 'Masc' || g === 'Neut')) {
    return {
      article: 'Ø',
      adjStem: item.adj,
      adjEnding: 'en',
      noun: nounForm,
      signalCarrier: 'noun',
      explanation:
        'Book Exception (p. 55): Without an article in Genitive Masc/Neut, the noun itself shows "-es" (Weines/Bieres), so the adjective takes "-en"!',
    };
  }
  const strongMap: Record<GrammarCase, Record<GrammarGender, string>> = {
    Nom: { Masc: 'er', Neut: 'es', Fem: 'e', Pl: 'e' },
    Acc: { Masc: 'en', Neut: 'es', Fem: 'e', Pl: 'e' },
    Dat: { Masc: 'em', Neut: 'em', Fem: 'er', Pl: 'en' },
    Gen: { Masc: 'en', Neut: 'en', Fem: 'er', Pl: 'er' },
  };
  const end = strongMap[c][g];
  return {
    article: 'Ø',
    adjStem: item.adj,
    adjEnding: end,
    noun: nounForm,
    signalCarrier: 'adjective',
    explanation: `No article is present, so the full Key Signal (${SIGNAL_KEY[c][g]}) jumps directly onto the adjective → "-${end}"!`,
  };
}

interface GrammarLabViewProps {
  onJumpToReaderPage?: (pageNumber: number) => void;
}

export function GrammarLabView({ onJumpToReaderPage }: GrammarLabViewProps = {}) {
  const [activeLab, setActiveLab] = useState<LabModule>('articles');

  // Lab 1: Articles state
  const [artKind, setArtKind] = useState<'der' | 'ein' | 'kein' | 'dieser' | 'mein'>('der');
  const [artCase, setArtCase] = useState<GrammarCase>('Nom');
  const [artGender, setArtGender] = useState<GrammarGender>('Masc');

  // Lab 2: Nouns state
  const [nounInput, setNounInput] = useState('Wohnung');
  const [nDeclCase, setNDeclCase] = useState<GrammarCase>('Acc');

  // Lab 3: Adjective Signal Jumper state
  const [adjArtType, setAdjArtType] = useState<'definite' | 'indefinite' | 'zero'>('indefinite');
  const [adjCase, setAdjCase] = useState<GrammarCase>('Nom');
  const [adjGender, setAdjGender] = useState<GrammarGender>('Masc');

  // Lab 4: Word Order Sandbox state
  const [sentenceMode, setSentenceMode] = useState<
    'normal' | 'inverted' | 'question' | 'modal' | 'subordinate'
  >('normal');

  // Lab 5: Verbs & Appendix state
  const [appendixTab, setAppendixTab] = useState<
    'irregular' | 'dative' | 'phrasal' | 'glossary' | 'index'
  >('irregular');
  const [appendixSearch, setAppendixSearch] = useState('');
  const [verbGroupFilter, setVerbGroupFilter] = useState<string>('ALL');

  // Lab 6: Wechselpräpositionen & Compounds state
  const [spatialMode, setSpatialMode] = useState<'wohin' | 'wo'>('wohin');
  const [spatialPrep, setSpatialPrep] = useState<string>('auf');
  const [compFirst, setCompFirst] = useState(0);
  const [compSecond, setCompSecond] = useState(0);

  const sampleNounByGender: Record<GrammarGender, { base: string; gen: string; datPl: string; en: string }> = {
    Masc: { base: 'Mann', gen: 'Mannes', datPl: 'Mann', en: 'man' },
    Neut: { base: 'Kind', gen: 'Kindes', datPl: 'Kind', en: 'child' },
    Fem: { base: 'Frau', gen: 'Frau', datPl: 'Frau', en: 'woman' },
    Pl: { base: 'Kinder', gen: 'Kinder', datPl: 'Kindern', en: 'children' },
  };

  const activeArtWord = ARTICLE_MATRIX[artKind][artCase][artGender];
  const activeNounSample = sampleNounByGender[artGender];
  const activeNounDisplay =
    artCase === 'Gen' && (artGender === 'Masc' || artGender === 'Neut')
      ? activeNounSample.gen
      : artCase === 'Dat' && artGender === 'Pl'
        ? activeNounSample.datPl
        : activeNounSample.base;
  const assembledArticlePhrase =
    activeArtWord === '—' ? `${activeNounDisplay} (no indefinite plural)` : `${activeArtWord} ${activeNounDisplay}`;

  // Gender suffix detector (Ch 2.1)
  const detectGender = (raw: string) => {
    const w = raw.trim().toLowerCase();
    if (!w) return null;
    if (/(heit|keit|ung|schaft|tät|ion|ei|enz|ik|in)$/.test(w)) {
      const m = w.match(/(heit|keit|ung|schaft|tät|ion|ei|enz|ik|in)$/)?.[1];
      return { article: 'die', gender: 'Feminine', rule: `Ends in -${m} → reliable feminine suffix (Ch 2.1, p. 25).` };
    }
    if (/(chen|lein|ment|tum|trum|nis)$/.test(w)) {
      const m = w.match(/(chen|lein|ment|tum|trum|nis)$/)?.[1];
      return { article: 'das', gender: 'Neuter', rule: `Ends in -${m} → reliable neuter suffix (Ch 2.1, p. 24).` };
    }
    if (/(ismus|ling|ist|ant|ent|or|ig)$/.test(w)) {
      const m = w.match(/(ismus|ling|ist|ant|ent|or|ig)$/)?.[1];
      return { article: 'der', gender: 'Masculine', rule: `Ends in -${m} → reliable masculine suffix (Ch 2.1, p. 23).` };
    }
    return {
      article: '?',
      gender: 'Check Dictionary',
      rule: 'This noun does not carry one of the high-certainty book suffixes — learn its article directly with the word!',
    };
  };

  const detected = detectGender(nounInput);
  const adjComputed = computeAdjectivePhrase(adjArtType, adjCase, adjGender);
  const adjSentence =
    adjComputed.article === 'Ø'
      ? `${adjComputed.adjStem}${adjComputed.adjEnding} ${adjComputed.noun}`
      : `${adjComputed.article} ${adjComputed.adjStem}${adjComputed.adjEnding} ${adjComputed.noun}`;

  const WORD_ORDER_SCENES = {
    normal: {
      title: 'Standard Main Clause (V2)',
      rule: 'Subject takes Position 1; conjugated verb sits strictly in Position 2 (Ch 6, p. 67).',
      slots: [
        { label: 'Position 1 (Subject)', text: 'Ich', role: 'normal' },
        { label: 'Position 2 (Finite Verb)', text: 'fahre', role: 'verb' },
        { label: 'Middle (T → M → L)', text: 'morgen mit dem Zug nach Berlin', role: 'middle' },
        { label: 'End Bracket', text: '—', role: 'empty' },
      ],
      full: 'Ich fahre morgen mit dem Zug nach Berlin.',
      en: 'I am going to Berlin by train tomorrow.',
    },
    inverted: {
      title: 'Time-Fronted Main Clause (V2 Inversion)',
      rule: 'Move "Morgen" into Position 1 → the verb STAYS in Position 2 and the subject steps to Position 3! (Ch 6, p. 67)',
      slots: [
        { label: 'Position 1 (Time)', text: 'Morgen', role: 'accent' },
        { label: 'Position 2 (Finite Verb)', text: 'fahre', role: 'verb' },
        { label: 'Subject + Middle', text: 'ich mit dem Zug nach Berlin', role: 'middle' },
        { label: 'End Bracket', text: '—', role: 'empty' },
      ],
      full: 'Morgen fahre ich mit dem Zug nach Berlin.',
      en: 'Tomorrow I am going to Berlin by train.',
    },
    question: {
      title: 'Yes/No Question (V1)',
      rule: 'Conjugated verb jumps to Position 1; no "do/does" helper needed! (Ch 6, p. 68)',
      slots: [
        { label: 'Position 1 (Finite Verb)', text: 'Fährst', role: 'verb' },
        { label: 'Position 2 (Subject)', text: 'du', role: 'normal' },
        { label: 'Middle (T → M → L)', text: 'morgen mit dem Zug nach Berlin', role: 'middle' },
        { label: 'End', text: '?', role: 'empty' },
      ],
      full: 'Fährst du morgen mit dem Zug nach Berlin?',
      en: 'Are you going to Berlin by train tomorrow?',
    },
    modal: {
      title: 'Modal Verbal Bracket (Satzklammer)',
      rule: 'Conjugated modal sits in Position 2; the main verb infinitive closes the bracket at the VERY END! (Ch 6 & 7.2)',
      slots: [
        { label: 'Position 1 (Subject)', text: 'Ich', role: 'normal' },
        { label: 'Position 2 (Modal)', text: 'muss', role: 'verb' },
        { label: 'Middle Field', text: 'morgen mit dem Zug nach Berlin', role: 'middle' },
        { label: 'End Bracket (Infinitive)', text: 'fahren', role: 'verb' },
      ],
      full: 'Ich muss morgen mit dem Zug nach Berlin fahren.',
      en: 'I have to go to Berlin by train tomorrow.',
    },
    subordinate: {
      title: 'Subordinate Clause with "weil" (Verb-Final)',
      rule: 'Subjunktion "weil" kicks the conjugated verb all the way to the VERY END! (Ch 6 & 14.2)',
      slots: [
        { label: 'Main Clause + Comma', text: 'Ich packe meine Tasche,', role: 'normal' },
        { label: 'Subjunction', text: 'weil', role: 'accent' },
        { label: 'Subject + Middle', text: 'ich morgen nach Berlin', role: 'middle' },
        { label: 'End (Conjugated Verb!)', text: 'fahre', role: 'verb' },
      ],
      full: 'Ich packe meine Tasche, weil ich morgen nach Berlin fahre.',
      en: 'I am packing my bag because I am going to Berlin tomorrow.',
    },
  };

  const activeOrder = WORD_ORDER_SCENES[sentenceMode];

  const SPATIAL_PREPS: Record<
    string,
    { en: string; wohinDe: string; wohinEn: string; woDe: string; woEn: string }
  > = {
    auf: {
      en: 'on / onto (horizontal)',
      wohinDe: 'Ich lege die Akte auf den Tisch.',
      wohinEn: 'I put the file onto the table. (Action → Accusative: den Tisch)',
      woDe: 'Die Akte liegt auf dem Tisch.',
      woEn: 'The file is lying on the table. (Position → Dative: dem Tisch)',
    },
    in: {
      en: 'in / into',
      wohinDe: 'Ich lege das Buch in den Schrank.',
      wohinEn: 'I put the book into the cupboard. (Wohin? → Accusative: den Schrank)',
      woDe: 'Das Buch liegt in dem (im) Schrank.',
      woEn: 'The book is lying in the cupboard. (Wo? → Dative: im Schrank)',
    },
    an: {
      en: 'at / onto (vertical)',
      wohinDe: 'Sie hängt das Bild an die Wand.',
      wohinEn: 'She hangs the picture onto the wall. (Wohin? → Accusative: die Wand)',
      woDe: 'Das Bild hängt an der Wand.',
      woEn: 'The picture is hanging on the wall. (Wo? → Dative: der Wand)',
    },
    unter: {
      en: 'under / beneath',
      wohinDe: 'Die Katze läuft unter den Stuhl.',
      wohinEn: 'The cat runs under the chair. (Wohin? → Accusative: den Stuhl)',
      woDe: 'Die Katze schläft unter dem Stuhl.',
      woEn: 'The cat is sleeping under the chair. (Wo? → Dative: dem Stuhl)',
    },
    neben: {
      en: 'next to',
      wohinDe: 'Er stellt die Lampe neben das Bett.',
      wohinEn: 'He places the lamp next to the bed. (Wohin? → Accusative: das Bett)',
      woDe: 'Die Lampe steht neben dem Bett.',
      woEn: 'The lamp stands next to the bed. (Wo? → Dative: dem Bett)',
    },
    hinter: {
      en: 'behind',
      wohinDe: 'Felix wirft den Ball hinter den Baum.',
      wohinEn: 'Felix throws the ball behind the tree. (Wohin? → Accusative: den Baum)',
      woDe: 'Der Ball liegt hinter dem Baum.',
      woEn: 'The ball is lying behind the tree. (Wo? → Dative: dem Baum)',
    },
    vor: {
      en: 'in front of',
      wohinDe: 'Ich stelle das Fahrrad vor das Haus.',
      wohinEn: 'I park the bike in front of the house. (Wohin? → Accusative: das Haus)',
      woDe: 'Das Fahrrad steht vor dem Haus.',
      woEn: 'The bike is standing in front of the house. (Wo? → Dative: dem Haus)',
    },
    über: {
      en: 'over / above',
      wohinDe: 'Wir hängen die Lampe über den Esstisch.',
      wohinEn: 'We hang the lamp over the dining table. (Wohin? → Accusative: den Esstisch)',
      woDe: 'Die Lampe hängt über dem Esstisch.',
      woEn: 'The lamp hangs above the dining table. (Wo? → Dative: dem Esstisch)',
    },
    zwischen: {
      en: 'between',
      wohinDe: 'Ich lege den Schlüssel zwischen die Bücher.',
      wohinEn: 'I place the key between the books. (Wohin? → Accusative: die Bücher)',
      woDe: 'Der Schlüssel liegt zwischen den Büchern.',
      woEn: 'The key is lying between the books. (Wo? → Dative: den Büchern)',
    },
  };

  const COMP_MODIFIERS = [
    { word: 'Arbeit', link: 's', en: 'work' },
    { word: 'Wohnung', link: 's', en: 'apartment' },
    { word: 'Haus', link: '', en: 'house' },
    { word: 'Deutsch', link: '', en: 'German' },
    { word: 'Drucker', link: '', en: 'printer' },
  ];

  const COMP_HEADS = [
    { article: 'das', word: 'Zimmer', en: 'room' },
    { article: 'der', word: 'Schlüssel', en: 'key' },
    { article: 'das', word: 'Buch', en: 'book' },
    { article: 'die', word: 'Tür', en: 'door' },
    { article: 'das', word: 'Papier', en: 'paper' },
  ];

  const builtCompound = `${COMP_HEADS[compSecond].article} ${COMP_MODIFIERS[compFirst].word}${COMP_MODIFIERS[compFirst].link}${COMP_HEADS[compSecond].word.toLowerCase()}`;
  const builtCompoundEn = `${COMP_MODIFIERS[compFirst].en} ${COMP_HEADS[compSecond].en}`;

  const qLower = appendixSearch.trim().toLowerCase();

  return (
    <div className="space-y-6">
      {/* Distinct Laboratory Header (visually separated from Editorial Reader) */}
      <section className="rounded-2xl border border-slate-800 bg-[#0F172A] text-slate-100 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[11px] font-mono uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
              <FlaskConical className="w-3.5 h-3.5" />
              <span>Interactive Grammar Laboratory · Application-Generated Sandbox</span>
            </p>
            <h1 className="text-2xl font-display font-semibold text-white">
              Experiment with German Grammar Rules Live
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl">
              Every module corresponds directly to chapters in <em>German Grammar in a Nutshell</em>. Toggle cases, genders, sentence structures, and prepositions to watch endings and word order update immediately.
            </p>
          </div>
        </div>

        {/* Segmented Lab Module Selector */}
        <div className="mt-5 flex flex-wrap gap-2">
          {LAB_TABS.map((t) => {
            const active = activeLab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveLab(t.id)}
                className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                  active
                    ? 'bg-sky-500 text-slate-950 font-semibold'
                    : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <span>{t.label}</span>
                <span className={`ml-1.5 font-mono text-[10px] ${active ? 'text-slate-900' : 'text-slate-400'}`}>
                  {t.chapters}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ==================== LAB 1: ARTICLES & KEY SIGNALS ==================== */}
      {activeLab === 'articles' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131C26] p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-display font-semibold text-slate-900 dark:text-white">
                Interactive Article & Key Signal Builder
              </h2>
              <span className="text-xs font-mono text-slate-500">Ch 1.1–1.2 (pp. 13–17)</span>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">1. Article Family</p>
                <div className="flex flex-wrap gap-1.5">
                  {(['der', 'ein', 'kein', 'dieser', 'mein'] as const).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setArtKind(k)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold cursor-pointer border ${
                        artKind === k
                          ? 'bg-[#1E3A5F] text-white border-[#1E3A5F]'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">2. Case (Kasus)</p>
                <div className="flex flex-wrap gap-1.5">
                  {(['Nom', 'Acc', 'Dat', 'Gen'] as const).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setArtCase(c)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border ${
                        artCase === c
                          ? 'bg-sky-700 text-white border-sky-700'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {c === 'Nom' ? 'Nominative (Wer?)' : c === 'Acc' ? 'Accusative (Wen?)' : c === 'Dat' ? 'Dative (Wem?)' : 'Genitive (Wessen?)'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">3. Gender / Number</p>
                <div className="flex flex-wrap gap-1.5">
                  {(['Masc', 'Neut', 'Fem', 'Pl'] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setArtGender(g)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border ${
                        artGender === g
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {g === 'Masc' ? 'Masculine (Mann)' : g === 'Neut' ? 'Neuter (Kind)' : g === 'Fem' ? 'Feminine (Frau)' : 'Plural (Kinder)'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Stage Output */}
            <div className="rounded-xl border border-sky-200 dark:border-sky-900 bg-sky-50/60 dark:bg-sky-950/30 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-mono uppercase text-sky-800 dark:text-sky-400">
                  Assembled Noun Phrase · Key Signal {SIGNAL_KEY[artCase][artGender]}
                </p>
                <p className="mt-1 text-2xl font-display font-semibold text-slate-900 dark:text-white">
                  {assembledArticlePhrase}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  {artCase === 'Acc' && artGender === 'Masc'
                    ? 'Notice: Masculine is the ONLY gender that changes between Nominative and Accusative!'
                    : artCase === 'Dat' && artGender === 'Pl'
                      ? 'Notice: Dative Plural adds -n to the noun too (Kindern)!'
                      : artCase === 'Gen' && (artGender === 'Masc' || artGender === 'Neut')
                        ? 'Notice: Genitive Masc/Neut adds -(e)s to the noun!'
                        : `Standard ${artCase} ${artGender} form following Key Signal ${SIGNAL_KEY[artCase][artGender]}.`}
                </p>
              </div>
              {activeArtWord !== '—' && <SpeakButton text={`${activeArtWord} ${activeNounDisplay}`} size="md" label="Listen" />}
            </div>
          </div>

          <div className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131C26] p-6 space-y-4">
            <h3 className="text-sm font-display font-semibold text-slate-900 dark:text-white">
              Full {artKind}-Table (Click Any Cell to Inspect)
            </h3>
            <div className="overflow-x-auto grammar-scroll">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-200 dark:border-slate-800">
                    <th className="py-2 text-left">Case</th>
                    <th className="py-2 text-center">Masc</th>
                    <th className="py-2 text-center">Neut</th>
                    <th className="py-2 text-center">Fem</th>
                    <th className="py-2 text-center">Pl</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(['Nom', 'Acc', 'Dat', 'Gen'] as const).map((c) => (
                    <tr key={c}>
                      <td className="py-2 font-semibold text-slate-700 dark:text-slate-300">{c}</td>
                      {(['Masc', 'Neut', 'Fem', 'Pl'] as const).map((g) => {
                        const isSelected = c === artCase && g === artGender;
                        return (
                          <td key={g} className="p-1 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setArtCase(c);
                                setArtGender(g);
                              }}
                              className={`w-full rounded px-2 py-1.5 font-mono cursor-pointer transition-colors ${
                                isSelected
                                  ? 'bg-[#1E3A5F] text-white font-semibold'
                                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                              }`}
                            >
                              {ARTICLE_MATRIX[artKind][c][g]}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== LAB 2: NOUNS, GENDER SUFFIXES & N-DECLENSION ==================== */}
      {activeLab === 'nouns' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131C26] p-6 space-y-4">
            <h2 className="text-lg font-display font-semibold text-slate-900 dark:text-white">
              Gender Suffix Detector (Ch 2.1, pp. 22–25)
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Type any German noun (or pick a test word below) to check whether it matches one of the textbook’s high-reliability suffix rules.
            </p>
            <input
              type="text"
              value={nounInput}
              onChange={(e) => setNounInput(e.target.value)}
              placeholder="e.g. Wohnung, Mädchen, Mechanismus..."
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
            />
            <div className="flex flex-wrap gap-1.5">
              {['Freundschaft', 'Häuschen', 'Tourismus', 'Universität', 'Instrument', 'Präsident', 'Zeitung'].map(
                (sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => setNounInput(sample)}
                    className="rounded-md border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    {sample}
                  </button>
                )
              )}
            </div>
            {detected && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-display font-semibold text-slate-900 dark:text-white">
                    {detected.article !== '?' ? `${detected.article} ${nounInput}` : nounInput}
                  </p>
                  <p className="text-xs font-semibold text-[#1E3A5F] dark:text-sky-400">
                    {detected.gender}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{detected.rule}</p>
                </div>
                {detected.article !== '?' && (
                  <SpeakButton text={`${detected.article} ${nounInput}`} size="md" label="Hear" />
                )}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131C26] p-6 space-y-4">
            <h2 className="text-lg font-display font-semibold text-slate-900 dark:text-white">
              n-Declension Live Transformer (Ch 2.4, p. 34)
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Select a case to see how standard nouns stay unchanged while Type A (der Student) and Type B (der Name) add -(e)n!
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(['Nom', 'Acc', 'Dat', 'Gen'] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNDeclCase(c)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border ${
                    nDeclCase === c
                      ? 'bg-[#1E3A5F] text-white border-[#1E3A5F]'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="space-y-2.5 text-sm">
              {[
                {
                  type: 'Standard (der Mann)',
                  form: { Nom: 'der Mann', Acc: 'den Mann', Dat: 'dem Mann', Gen: 'des Mannes' }[nDeclCase],
                },
                {
                  type: 'n-Declension Type A (der Student)',
                  form: { Nom: 'der Student', Acc: 'den Studenten', Dat: 'dem Studenten', Gen: 'des Studenten' }[nDeclCase],
                },
                {
                  type: 'n-Declension Type A (-e: der Kollege)',
                  form: { Nom: 'der Kollege', Acc: 'den Kollegen', Dat: 'dem Kollegen', Gen: 'des Kollegen' }[nDeclCase],
                },
                {
                  type: 'n-Declension Type B (der Name)',
                  form: { Nom: 'der Name', Acc: 'den Namen', Dat: 'dem Namen', Gen: 'des Namens' }[nDeclCase],
                },
              ].map((row) => (
                <div
                  key={row.type}
                  className="rounded-lg border border-slate-200 dark:border-slate-800 px-4 py-2.5 flex items-center justify-between gap-2"
                >
                  <div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{row.type}</p>
                    <p className="font-mono font-semibold text-slate-900 dark:text-white">{row.form}</p>
                  </div>
                  <SpeakButton text={row.form} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== LAB 3: ADJECTIVE SIGNAL-ENDING JUMPER ==================== */}
      {activeLab === 'adjectives' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131C26] p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-display font-semibold text-slate-900 dark:text-white">
                The Signal-Ending Jumper (Ch 4.1, pp. 54–55)
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Watch how the Key Signal (<span className="font-mono">-r / -s / -e / -n / -m</span>) jumps onto the adjective whenever the article cannot carry it!
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-slate-500">1. Preceding Article</p>
              {(['definite', 'indefinite', 'zero'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setAdjArtType(t)}
                  className={`w-full text-left px-3 py-2 rounded-lg border text-xs font-medium cursor-pointer ${
                    adjArtType === t
                      ? 'bg-[#1E3A5F] text-white border-[#1E3A5F]'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {t === 'definite'
                    ? 'Definite (der / die / das)'
                    : t === 'indefinite'
                      ? 'Indefinite / Negative (ein / kein)'
                      : 'Zero Article (no article)'}
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-slate-500">2. Case</p>
              <div className="grid grid-cols-2 gap-1.5">
                {(['Nom', 'Acc', 'Dat', 'Gen'] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setAdjCase(c)}
                    className={`px-3 py-2 rounded-lg border text-xs font-semibold cursor-pointer ${
                      adjCase === c
                        ? 'bg-sky-700 text-white border-sky-700'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-slate-500">3. Book Example Noun</p>
              <div className="grid grid-cols-2 gap-1.5">
                {(['Masc', 'Neut', 'Fem', 'Pl'] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setAdjGender(g)}
                    className={`px-3 py-2 rounded-lg border text-xs font-semibold cursor-pointer ${
                      adjGender === g
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {g} ({ADJ_NOUNS[g].noun})
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Signal Stage */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/70 p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <div
                  className={`rounded-lg border px-4 py-3 text-center ${
                    adjComputed.signalCarrier === 'article'
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                  }`}
                >
                  <p className="text-[10px] uppercase font-mono text-slate-500">Article</p>
                  <p className="text-xl font-display font-semibold text-slate-900 dark:text-white">
                    {adjComputed.article}
                  </p>
                  {adjComputed.signalCarrier === 'article' && (
                    <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                      ● CARRIES SIGNAL
                    </p>
                  )}
                </div>

                <ArrowRightLeft className="w-4 h-4 text-slate-400" />

                <div
                  className={`rounded-lg border px-4 py-3 text-center ${
                    adjComputed.signalCarrier === 'adjective'
                      ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/50'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                  }`}
                >
                  <p className="text-[10px] uppercase font-mono text-slate-500">Adjective</p>
                  <p className="text-xl font-display font-semibold text-slate-900 dark:text-white">
                    {adjComputed.adjStem}
                    <span className="text-amber-700 dark:text-amber-400 underline decoration-2">
                      {adjComputed.adjEnding}
                    </span>
                  </p>
                  {adjComputed.signalCarrier === 'adjective' && (
                    <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                      ▲ SIGNAL JUMPED HERE!
                    </p>
                  )}
                </div>

                <div
                  className={`rounded-lg border px-4 py-3 text-center ${
                    adjComputed.signalCarrier === 'noun'
                      ? 'border-sky-600 bg-sky-50 dark:bg-sky-950/50'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                  }`}
                >
                  <p className="text-[10px] uppercase font-mono text-slate-500">Noun</p>
                  <p className="text-xl font-display font-semibold text-slate-900 dark:text-white">
                    {adjComputed.noun}
                  </p>
                  {adjComputed.signalCarrier === 'noun' && (
                    <p className="text-[10px] font-semibold text-sky-700 dark:text-sky-400">
                      ● SIGNAL ON NOUN (-es)
                    </p>
                  )}
                </div>
              </div>

              <SpeakButton text={adjSentence} size="md" label="Listen in German" />
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              {adjComputed.explanation}
            </p>
          </div>
        </div>
      )}

      {/* ==================== LAB 4: WORD ORDER & SENTENCE BRACKET ==================== */}
      {activeLab === 'word-order' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131C26] p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-display font-semibold text-slate-900 dark:text-white">
                German Sentence Bracket & Word Order Simulator (Ch 6 & 14)
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Transform the exact same idea across all 5 German word-order rules and watch where the verb moves!
              </p>
            </div>
            <SpeakButton text={activeOrder.full} size="md" label="Hear Sentence" />
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                ['normal', '1. Standard V2'],
                ['inverted', '2. Time-First V2'],
                ['question', '3. Yes/No Question (V1)'],
                ['modal', '4. Modal Bracket'],
                ['subordinate', '5. Subordinate "weil" (End)'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setSentenceMode(id)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer border ${
                  sentenceMode === id
                    ? 'bg-[#1E3A5F] text-white border-[#1E3A5F]'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {activeOrder.slots.map((slot, idx) => (
              <div
                key={idx}
                className={`rounded-xl border p-4 space-y-1.5 ${
                  slot.role === 'verb'
                    ? 'border-sky-600 bg-sky-50 dark:bg-sky-950/40'
                    : slot.role === 'accent'
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/50'
                }`}
              >
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {slot.label}
                </p>
                <p className="text-base font-display font-semibold text-slate-900 dark:text-white">
                  {slot.text}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-lg bg-slate-50 dark:bg-slate-900/60 p-4 space-y-1">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{activeOrder.full}</p>
            <p className="text-xs italic text-slate-600 dark:text-slate-400">{activeOrder.en}</p>
            <p className="text-xs text-[#1E3A5F] dark:text-sky-400 pt-1">{activeOrder.rule}</p>
          </div>
        </div>
      )}

      {/* ==================== LAB 5: VERBS & SEARCHABLE APPENDIX TABLES ==================== */}
      {activeLab === 'verbs' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131C26] p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-display font-semibold text-slate-900 dark:text-white">
                Complete Searchable Textbook Appendix (pp. 165–195)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                All {APPENDIX_IRREGULAR_VERBS.length} Irregular/Mixed Verbs, {APPENDIX_DATIVE_VERBS.length} Dative Verbs, {APPENDIX_PHRASAL_VERBS.length} Phrasal Verbs, {APPENDIX_GLOSSARY.length} Glossary terms & German Index verbatim from the print appendix.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={appendixSearch}
                  onChange={(e) => setAppendixSearch(e.target.value)}
                  placeholder="Filter verbs, prepositions, terms..."
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white"
                />
              </div>
              <a
                href={APPENDIX_PDF_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 shrink-0 rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-xs font-medium text-[#1E3A5F] dark:text-sky-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                title="View original scanned Appendix PDF (pp. 163–195)"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden md:inline">PDF</span>
              </a>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
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
                onClick={() => setAppendixTab(id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border ${
                  appendixTab === id
                    ? 'bg-[#1E3A5F] text-white border-[#1E3A5F]'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {appendixTab === 'irregular' && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1.5 text-xs">
                {(['ALL', 'A-B-A', 'A-B-B', 'A-B-C', 'mixed-other'] as const).map((grp) => (
                  <button
                    key={grp}
                    type="button"
                    onClick={() => setVerbGroupFilter(grp)}
                    className={`px-2.5 py-1 rounded border cursor-pointer ${
                      verbGroupFilter === grp
                        ? 'bg-sky-700 text-white border-sky-700 font-semibold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {grp === 'ALL' ? 'All Groups (146)' : grp === 'mixed-other' ? 'andere Verben' : `Group ${grp}`}
                  </button>
                ))}
              </div>
              <div className="overflow-x-auto grammar-scroll rounded-lg border border-slate-200 dark:border-slate-800 max-h-[28rem] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                    <tr>
                      <th className="px-3 py-2">Infinitive</th>
                      <th className="px-3 py-2">Present Tense</th>
                      <th className="px-3 py-2">Past Simple</th>
                      <th className="px-3 py-2">Present Perfect</th>
                      <th className="px-3 py-2">Translation</th>
                      <th className="px-3 py-2">Audio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {APPENDIX_IRREGULAR_VERBS.filter(
                      (v) =>
                        (verbGroupFilter === 'ALL' || v.group === verbGroupFilter) &&
                        (!qLower ||
                          v.infinitive.toLowerCase().includes(qLower) ||
                          v.present3rd.toLowerCase().includes(qLower) ||
                          v.pastSimple.toLowerCase().includes(qLower) ||
                          v.perfect.toLowerCase().includes(qLower) ||
                          v.english.toLowerCase().includes(qLower))
                    ).map((v) => (
                      <tr key={v.infinitive} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-3 py-2 font-semibold text-slate-900 dark:text-white">{v.infinitive}</td>
                        <td className="px-3 py-2 font-mono">{v.present3rd}</td>
                        <td className="px-3 py-2 font-mono">{v.pastSimple}</td>
                        <td className="px-3 py-2 font-mono text-[#1E3A5F] dark:text-sky-300">{v.perfect}</td>
                        <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{v.english}</td>
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
            </div>
          )}

          {appendixTab === 'dative' && (
            <div className="overflow-x-auto grammar-scroll rounded-lg border border-slate-200 dark:border-slate-800 max-h-[28rem] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                  <tr>
                    <th className="px-3 py-2">Verb</th>
                    <th className="px-3 py-2">Pattern</th>
                    <th className="px-3 py-2">English</th>
                    <th className="px-3 py-2">Page</th>
                    <th className="px-3 py-2">Audio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {APPENDIX_DATIVE_VERBS.filter(
                    (v) =>
                      !qLower ||
                      v.german.toLowerCase().includes(qLower) ||
                      v.english.toLowerCase().includes(qLower)
                  ).map((v, idx) => (
                    <tr key={`${v.german}-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-3 py-2 font-semibold text-slate-900 dark:text-white">{v.german}</td>
                      <td className="px-3 py-2 font-mono text-[11px] text-amber-700 dark:text-amber-400">
                        {v.pattern === 'dative-only' ? 'Dative only' : 'Dative + Accusative'}
                      </td>
                      <td className="px-3 py-2">{v.english}</td>
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

          {appendixTab === 'phrasal' && (
            <div className="overflow-x-auto grammar-scroll rounded-lg border border-slate-200 dark:border-slate-800 max-h-[28rem] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
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
                      !qLower ||
                      v.verb.toLowerCase().includes(qLower) ||
                      v.preposition.toLowerCase().includes(qLower) ||
                      v.caseRequired.toLowerCase().includes(qLower) ||
                      v.english.toLowerCase().includes(qLower)
                  ).map((v, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-3 py-2 font-semibold text-slate-900 dark:text-white">{v.verb}</td>
                      <td className="px-3 py-2 font-mono text-sky-700 dark:text-sky-400">{v.caseRequired}</td>
                      <td className="px-3 py-2">{v.english}</td>
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

          {appendixTab === 'glossary' && (
            <div className="overflow-x-auto grammar-scroll rounded-lg border border-slate-200 dark:border-slate-800 max-h-[28rem] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                  <tr>
                    <th className="px-3 py-2">English</th>
                    <th className="px-3 py-2">Deutsch</th>
                    <th className="px-3 py-2">Textbook Beispiel</th>
                    <th className="px-3 py-2">Page</th>
                    <th className="px-3 py-2">Audio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {APPENDIX_GLOSSARY.filter(
                    (g) =>
                      !qLower ||
                      g.german.toLowerCase().includes(qLower) ||
                      g.english.toLowerCase().includes(qLower) ||
                      g.example.toLowerCase().includes(qLower)
                  ).map((g) => (
                    <tr key={g.english} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-3 py-2 font-semibold text-slate-900 dark:text-white">{g.english}</td>
                      <td className="px-3 py-2 text-[#1E3A5F] dark:text-sky-300 font-medium">{g.german}</td>
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

          {appendixTab === 'index' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[28rem] overflow-y-auto grammar-scroll pr-1">
              {APPENDIX_GERMAN_INDEX.filter(
                (item) => !qLower || item.term.toLowerCase().includes(qLower) || item.pageLabel.includes(qLower)
              ).map((item) => (
                <div
                  key={item.term}
                  className="rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2 flex items-center justify-between gap-2 text-xs"
                >
                  <span className="font-medium text-slate-900 dark:text-slate-100 truncate">
                    {item.term}
                  </span>
                  <div className="flex flex-wrap gap-1 shrink-0">
                    {item.pages.map((pg) => (
                      <button
                        key={pg}
                        type="button"
                        onClick={() => onJumpToReaderPage?.(pg)}
                        className="rounded bg-slate-100 dark:bg-slate-800 hover:bg-[#1E3A5F] hover:text-white px-1.5 py-0.5 font-mono text-[11px] text-[#1E3A5F] dark:text-sky-400 cursor-pointer transition-colors"
                        title={`Open page ${pg} in Original Textbook Reader`}
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
      )}

      {/* ==================== LAB 6: WECHSELPRÄPOSITIONEN & COMPOUND BUILDER ==================== */}
      {activeLab === 'prepositions-compounds' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131C26] p-6 space-y-4">
            <h2 className="text-lg font-display font-semibold text-slate-900 dark:text-white">
              Wechselpräpositionen: Wohin? vs. Wo? (Ch 13.3, pp. 135–137)
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSpatialMode('wohin')}
                className={`rounded-lg border px-3 py-2.5 text-xs font-semibold cursor-pointer ${
                  spatialMode === 'wohin'
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                }`}
              >
                Wohin? (Direction / Action → Accusative)
              </button>
              <button
                type="button"
                onClick={() => setSpatialMode('wo')}
                className={`rounded-lg border px-3 py-2.5 text-xs font-semibold cursor-pointer ${
                  spatialMode === 'wo'
                    ? 'bg-emerald-700 text-white border-emerald-700'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                }`}
              >
                Wo? (Static Position → Dative)
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {Object.keys(SPATIAL_PREPS).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSpatialPrep(p)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold cursor-pointer border ${
                    spatialPrep === p
                      ? 'bg-[#1E3A5F] text-white border-[#1E3A5F]'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono font-semibold text-sky-700 dark:text-sky-400">
                  {spatialPrep} ({SPATIAL_PREPS[spatialPrep].en})
                </span>
                <SpeakButton
                  text={
                    spatialMode === 'wohin'
                      ? SPATIAL_PREPS[spatialPrep].wohinDe
                      : SPATIAL_PREPS[spatialPrep].woDe
                  }
                  label="Listen"
                />
              </div>
              <p className="text-base font-display font-semibold text-slate-900 dark:text-white">
                {spatialMode === 'wohin'
                  ? SPATIAL_PREPS[spatialPrep].wohinDe
                  : SPATIAL_PREPS[spatialPrep].woDe}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {spatialMode === 'wohin'
                  ? SPATIAL_PREPS[spatialPrep].wohinEn
                  : SPATIAL_PREPS[spatialPrep].woEn}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131C26] p-6 space-y-4">
            <h2 className="text-lg font-display font-semibold text-slate-900 dark:text-white">
              German Compound Word Builder (Ch 15.1, pp. 158–161)
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Combine any modifier + head noun. Notice that the <strong>LAST element</strong> ALWAYS sets the gender!
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-slate-500">1. Modifier (What kind?)</p>
                {COMP_MODIFIERS.map((m, idx) => (
                  <button
                    key={m.word}
                    type="button"
                    onClick={() => setCompFirst(idx)}
                    className={`w-full text-left px-3 py-1.5 rounded-lg border text-xs cursor-pointer ${
                      compFirst === idx
                        ? 'bg-[#1E3A5F] text-white border-[#1E3A5F] font-semibold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {m.word} ({m.en}) {m.link ? `+ -${m.link}-` : ''}
                  </button>
                ))}
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-slate-500">2. Head Noun (Sets Gender!)</p>
                {COMP_HEADS.map((h, idx) => (
                  <button
                    key={h.word}
                    type="button"
                    onClick={() => setCompSecond(idx)}
                    className={`w-full text-left px-3 py-1.5 rounded-lg border text-xs cursor-pointer ${
                      compSecond === idx
                        ? 'bg-amber-600 text-white border-amber-600 font-semibold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {h.article} {h.word} ({h.en})
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 p-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-mono uppercase text-amber-800 dark:text-amber-400">
                  Gender inherited from “{COMP_HEADS[compSecond].article} {COMP_HEADS[compSecond].word}”
                </p>
                <p className="text-xl font-display font-semibold text-slate-900 dark:text-white mt-0.5">
                  {builtCompound}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300">≈ “{builtCompoundEn}”</p>
              </div>
              <SpeakButton text={builtCompound} size="md" label="Hear" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
