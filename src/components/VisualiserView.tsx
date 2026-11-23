import { useState } from 'react';
import { Sparkles, CheckCircle2, RotateCcw } from 'lucide-react';
import { SpeakButton } from './PronunciationBar';

export function VisualiserView() {
  // 1. Partizip II Decision Tree State (Ch 9.2)
  const [p2Prefix, setP2Prefix] = useState<'none' | 'separable' | 'inseparable'>('none');
  const [p2Ieren, setP2Ieren] = useState(false);
  const [p2Class, setP2Class] = useState<'weak' | 'strong' | 'mixed'>('weak');

  // 2. Adjective Ending Decision Tree State (Ch 4.1)
  const [adjPos, setAdjPos] = useState<'after' | 'before'>('before');
  const [adjHasSignal, setAdjHasSignal] = useState<'yes' | 'no'>('yes');
  const [adjSlot, setAdjSlot] = useState<'boot' | 'other'>('boot');

  // 3. Tense Timeline Active Node (Ch 8–10)
  const [activeTense, setActiveTense] = useState<
    'plusquam' | 'prat' | 'perfekt' | 'prasens' | 'futur1' | 'futur2'
  >('perfekt');

  const computePartizipResult = () => {
    if (p2Ieren) {
      return {
        formula: 'NO ge- + stem + -t',
        example: 'studieren → studiert · telefonieren → telefoniert',
        audio: 'studieren, studiert',
        note: 'Verbs ending in -ieren NEVER take ge- (Ch 9.2, p. 100).',
      };
    }
    if (p2Prefix === 'inseparable') {
      return {
        formula:
          p2Class === 'strong'
            ? 'prefix + (changed) stem + -en (NO ge-!)'
            : 'prefix + stem + -t (NO ge-!)',
        example:
          p2Class === 'strong'
            ? 'verstehen → verstanden · bekommen → bekommen'
            : 'bezahlen → bezahlt · verkaufen → verkauft',
        audio: p2Class === 'strong' ? 'verstehen, verstanden' : 'bezahlen, bezahlt',
        note: 'Inseparable prefixes (be-, emp-, ent-, er-, ge-, miss-, ver-, zer-) block ge- completely (p. 102).',
      };
    }
    if (p2Prefix === 'separable') {
      return {
        formula:
          p2Class === 'strong'
            ? 'prefix + ge + (changed) stem + -en'
            : 'prefix + ge + stem + -t',
        example:
          p2Class === 'strong'
            ? 'anrufen → angerufen · aufstehen → aufgestanden'
            : 'einkaufen → eingekauft · abholen → abgeholt',
        audio: p2Class === 'strong' ? 'anrufen, angerufen' : 'einkaufen, eingekauft',
        note: 'Separable prefixes sandwich -ge- directly between prefix and base verb (p. 102).',
      };
    }
    if (p2Class === 'weak') {
      return {
        formula: 'ge- + stem + -(e)t',
        example: 'lernen → gelernt · machen → gemacht · arbeiten → gearbeitet',
        audio: 'lernen, gelernt',
        note: 'Book nickname: "Average Citizens" — completely predictable! (p. 100)',
      };
    }
    if (p2Class === 'strong') {
      return {
        formula: 'ge- + (often changed vowel) stem + -en',
        example: 'sprechen → gesprochen · gehen → gegangen · trinken → getrunken',
        audio: 'sprechen, gesprochen',
        note: 'Book nickname: "Rebels" — check A-B-A / A-B-B / A-B-C groups in Appendix pp. 165–170.',
      };
    }
    return {
      formula: 'ge- + changed vowel stem + -t',
      example: 'bringen → gebracht · denken → gedacht · wissen → gewusst',
      audio: 'bringen, gebracht',
      note: 'Book nickname: "Spies" — change vowel like strong verbs, but end in -t like weak verbs! (p. 101)',
    };
  };

  const p2Result = computePartizipResult();

  const TENSE_NODES = {
    plusquam: {
      label: 'Plusquamperfekt',
      sub: 'Earlier Past',
      formula: 'hatte / war + Partizip II',
      example: 'Nachdem ich gegessen hatte, ging ich los.',
      en: 'After I had eaten, I set off.',
      ref: 'Ch 9.4 (pp. 106–108)',
    },
    prat: {
      label: 'Präteritum',
      sub: 'Written Past (+ war/hatte/modals)',
      formula: 'verb stem + -te / vowel change',
      example: 'Gestern war ich müde und blieb zu Hause.',
      en: 'Yesterday I was tired and stayed home.',
      ref: 'Ch 9.1 (pp. 96–99)',
    },
    perfekt: {
      label: 'Perfekt',
      sub: 'Spoken Everyday Past',
      formula: 'haben / sein + Partizip II',
      example: 'Ich habe gestern Deutsch gelernt.',
      en: 'I studied German yesterday.',
      ref: 'Ch 9.3 (pp. 104–106)',
    },
    prasens: {
      label: 'Präsens',
      sub: 'Now, Habits, "seit", & Planned Future',
      formula: 'stem + -e / -st / -t / -en',
      example: 'Ich lerne seit zwei Monaten Deutsch.',
      en: 'I have been learning German for two months.',
      ref: 'Ch 8.1–8.2 (pp. 89–92)',
    },
    futur1: {
      label: 'Futur I',
      sub: 'Future Promise / Forecast / Guess',
      formula: 'werden + Infinitiv',
      example: 'Ich werde morgen nach Berlin fahren.',
      en: 'I will travel to Berlin tomorrow.',
      ref: 'Ch 10.1 (pp. 109–110)',
    },
    futur2: {
      label: 'Futur II',
      sub: 'Completed by Future / Past Guess',
      formula: 'werden + Partizip II + haben/sein',
      example: 'Bis Freitag werde ich fertig geworden sein.',
      en: 'By Friday I will have finished.',
      ref: 'Ch 10.2 (pp. 111–112)',
    },
  };

  const activeTenseInfo = TENSE_NODES[activeTense];

  return (
    <div className="space-y-6">
      {/* Honest Application-Generated Banner */}
      <header className="rounded-2xl border border-sky-200 dark:border-sky-900/60 bg-white dark:bg-[#131C26] p-6">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Application-Generated Interactive Grammar Visualiser</span>
        </p>
        <h1 className="mt-1 text-2xl font-display font-semibold text-slate-900 dark:text-white">
          Visual Decision Trees & Grammar Maps
        </h1>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 max-w-2xl">
          Interactive diagrams designed to simplify the core decision points of <em>German Grammar in a Nutshell</em> for beginner learners.
        </p>
      </header>

      {/* Visualiser 1: Interactive German Tense Timeline */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131C26] p-6 space-y-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-display font-semibold text-slate-900 dark:text-white">
            1. Interactive German Tense Timeline (Ch 8, 9 & 10)
          </h2>
          <span className="text-xs font-mono text-slate-500">Click any point on the timeline</span>
        </div>

        <div className="relative pt-2 pb-1">
          <div className="hidden md:block absolute top-7 left-6 right-6 h-0.5 bg-slate-200 dark:bg-slate-700" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 relative">
            {(
              [
                'plusquam',
                'prat',
                'perfekt',
                'prasens',
                'futur1',
                'futur2',
              ] as const
            ).map((key) => {
              const node = TENSE_NODES[key];
              const isSelected = activeTense === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTense(key)}
                  className={`rounded-xl border p-3 text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#1E3A5F] bg-[#1E3A5F] text-white shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#15202B] text-slate-800 dark:text-slate-200 hover:border-sky-500'
                  }`}
                >
                  <p className="text-xs font-semibold">{node.label}</p>
                  <p
                    className={`text-[10px] mt-0.5 ${
                      isSelected ? 'text-sky-200' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {node.sub}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-mono text-[#1E3A5F] dark:text-sky-400">
              {activeTenseInfo.ref} · Formula: <strong>{activeTenseInfo.formula}</strong>
            </p>
            <p className="text-base font-display font-semibold text-slate-900 dark:text-white">
              {activeTenseInfo.example}
            </p>
            <p className="text-xs italic text-slate-600 dark:text-slate-400">{activeTenseInfo.en}</p>
          </div>
          <SpeakButton text={activeTenseInfo.example} size="md" label="Listen" />
        </div>
      </section>

      {/* Visualiser 2 & 3 Side-by-Side Decision Trees */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Partizip II Decision Tree */}
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131C26] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-display font-semibold text-slate-900 dark:text-white">
              2. Partizip II Decision Tree (Ch 9.2)
            </h2>
            <button
              type="button"
              onClick={() => {
                setP2Prefix('none');
                setP2Ieren(false);
                setP2Class('weak');
              }}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 inline-flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Step 1: Does the verb end in “-ieren” (studieren, telefonieren)?
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setP2Ieren(true)}
                  className={`px-3 py-1.5 rounded-lg border cursor-pointer ${
                    p2Ieren
                      ? 'bg-[#1E3A5F] text-white border-[#1E3A5F] font-semibold'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Yes (-ieren)
                </button>
                <button
                  type="button"
                  onClick={() => setP2Ieren(false)}
                  className={`px-3 py-1.5 rounded-lg border cursor-pointer ${
                    !p2Ieren
                      ? 'bg-[#1E3A5F] text-white border-[#1E3A5F] font-semibold'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            {!p2Ieren && (
              <>
                <div>
                  <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Step 2: Prefix type?
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      [
                        ['none', 'No Prefix'],
                        ['separable', 'Separable (an-, ein-, auf-...)'],
                        ['inseparable', 'Inseparable (be-, ver-, er-...)'],
                      ] as const
                    ).map(([id, lbl]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setP2Prefix(id)}
                        className={`px-2.5 py-1.5 rounded-lg border cursor-pointer ${
                          p2Prefix === id
                            ? 'bg-sky-700 text-white border-sky-700 font-semibold'
                            : 'border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Step 3: Verb Class (Book pp. 100–101)
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      [
                        ['weak', 'Weak ("Average Citizens")'],
                        ['strong', 'Strong ("Rebels")'],
                        ['mixed', 'Mixed ("Spies")'],
                      ] as const
                    ).map(([id, lbl]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setP2Class(id)}
                        className={`px-2.5 py-1.5 rounded-lg border cursor-pointer ${
                          p2Class === id
                            ? 'bg-amber-600 text-white border-amber-600 font-semibold'
                            : 'border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/25 p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Resulting Formula
              </span>
              <SpeakButton text={p2Result.audio} />
            </div>
            <p className="font-mono text-sm font-semibold text-slate-900 dark:text-white">
              {p2Result.formula}
            </p>
            <p className="text-xs font-medium text-slate-800 dark:text-slate-200">{p2Result.example}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">{p2Result.note}</p>
          </div>
        </section>

        {/* Adjective Ending Decision Flowchart */}
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131C26] p-6 space-y-4">
          <h2 className="text-lg font-display font-semibold text-slate-900 dark:text-white">
            3. Adjective Ending Decision Flowchart (Ch 4.1)
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Q1: Where is the adjective?
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setAdjPos('after')}
                  className={`px-3 py-1.5 rounded-lg border cursor-pointer ${
                    adjPos === 'after'
                      ? 'bg-[#1E3A5F] text-white border-[#1E3A5F] font-semibold'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  After sein/werden (Das Bier ist kühl)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjPos('before')}
                  className={`px-3 py-1.5 rounded-lg border cursor-pointer ${
                    adjPos === 'before'
                      ? 'bg-[#1E3A5F] text-white border-[#1E3A5F] font-semibold'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Directly BEFORE a noun
                </button>
              </div>
            </div>

            {adjPos === 'before' && (
              <div>
                <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Q2: Does an article before it ALREADY show the Key Signal?
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjHasSignal('yes')}
                    className={`px-3 py-1.5 rounded-lg border cursor-pointer ${
                      adjHasSignal === 'yes'
                        ? 'bg-sky-700 text-white border-sky-700 font-semibold'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Yes (der/die/das/den/dem/einen/einem/einer...)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjHasSignal('no')}
                    className={`px-3 py-1.5 rounded-lg border cursor-pointer ${
                      adjHasSignal === 'no'
                        ? 'bg-sky-700 text-white border-sky-700 font-semibold'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    No (Zero article OR bare “ein/kein/mein”)
                  </button>
                </div>
              </div>
            )}

            {adjPos === 'before' && adjHasSignal === 'yes' && (
              <div>
                <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Q3: Which case/number slot?
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjSlot('boot')}
                    className={`px-3 py-1.5 rounded-lg border cursor-pointer ${
                      adjSlot === 'boot'
                        ? 'bg-amber-600 text-white border-amber-600 font-semibold'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Nom Singular OR Fem/Neut Acc Singular
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjSlot('other')}
                    className={`px-3 py-1.5 rounded-lg border cursor-pointer ${
                      adjSlot === 'other'
                        ? 'bg-amber-600 text-white border-amber-600 font-semibold'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Masc. Accusative, ANY Dative/Genitive, OR ANY Plural
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 p-4 space-y-1.5">
            {adjPos === 'after' ? (
              <>
                <p className="font-mono text-sm font-semibold text-slate-900 dark:text-white">
                  Ending = NONE (Base Form!)
                </p>
                <p className="text-xs text-slate-700 dark:text-slate-300">
                  Example: <strong>Der Wein ist trocken. Das Bier ist kühl.</strong> (Predicative adjectives never change — p. 52.)
                </p>
              </>
            ) : adjHasSignal === 'no' ? (
              <>
                <p className="font-mono text-sm font-semibold text-slate-900 dark:text-white">
                  Ending = KEY SIGNAL JUMPS TO ADJECTIVE (-er / -es / -e / -em / -en)
                </p>
                <p className="text-xs text-slate-700 dark:text-slate-300">
                  Example: <strong>ein trockener Wein</strong>, <strong>ein kühles Bier</strong>, <strong>aus heiterem Himmel</strong>! (Gen. m/n exception: -en before -es noun.)
                </p>
              </>
            ) : adjSlot === 'boot' ? (
              <>
                <p className="font-mono text-sm font-semibold text-slate-900 dark:text-white">
                  Ending = -e
                </p>
                <p className="text-xs text-slate-700 dark:text-slate-300">
                  Example: <strong>der trockene Wein</strong>, <strong>das kühle Bier</strong>, <strong>die warme Milch</strong>.
                </p>
              </>
            ) : (
              <>
                <p className="font-mono text-sm font-semibold text-slate-900 dark:text-white">
                  Ending = -en (Always!)
                </p>
                <p className="text-xs text-slate-700 dark:text-slate-300">
                  Example: <strong>den trockenen Wein</strong>, <strong>mit einem blauen Auge</strong>, <strong>die guten Getränke</strong>.
                </p>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
