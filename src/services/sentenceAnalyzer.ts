import type { AnalyzedToken, SentenceAnalysisResult } from '../types/grammar';

interface LexEntry {
  pos: string;
  gloss: string;
  lemma?: string;
  gender?: AnalyzedToken['gender'];
  caseInfo?: string;
  verbInfo?: string;
  chapterNumber: number;
  sectionId: string;
  label: string;
  notes?: string;
  alternatives?: string[];
}

const LEXICON: Record<string, LexEntry> = {
  // Definite Articles (Ch 1.2)
  der: {
    pos: 'Definite Article',
    gloss: 'the',
    gender: 'masculine',
    caseInfo: 'Masc. Nom. (or Fem. Dat./Gen., Pl. Gen.)',
    chapterNumber: 1,
    sectionId: '1.2',
    label: 'Ch 1.2 Forms of the Article (pp. 15–17)',
    alternatives: [
      'Masculine Nominative (subject: der Mann)',
      'Feminine Dative (indirect object / after dative prep: mit der Frau)',
      'Feminine or Plural Genitive (possession)',
    ],
  },
  die: {
    pos: 'Definite Article',
    gloss: 'the',
    gender: 'feminine',
    caseInfo: 'Fem. Nom./Acc. or Plural Nom./Acc.',
    chapterNumber: 1,
    sectionId: '1.2',
    label: 'Ch 1.2 Forms of the Article (pp. 15–17)',
    alternatives: ['Feminine Nominative / Accusative', 'Plural Nominative / Accusative'],
  },
  das: {
    pos: 'Definite Article',
    gloss: 'the',
    gender: 'neuter',
    caseInfo: 'Neut. Nom. or Acc.',
    chapterNumber: 1,
    sectionId: '1.2',
    label: 'Ch 1.2 Forms of the Article (pp. 15–17)',
    alternatives: ['Neuter Nominative (subject)', 'Neuter Accusative (direct object)', 'Demonstrative pronoun "that"'],
  },
  den: {
    pos: 'Definite Article',
    gloss: 'the',
    gender: 'masculine',
    caseInfo: 'Masc. Acc. (or Plural Dat.)',
    chapterNumber: 1,
    sectionId: '1.2',
    label: 'Ch 1.2 Forms of the Article (pp. 15–17)',
    alternatives: ['Masculine Accusative (direct object: den Mann)', 'Plural Dative (indirect object: den Kindern)'],
  },
  dem: {
    pos: 'Definite Article',
    gloss: 'the',
    gender: 'masculine',
    caseInfo: 'Masc. or Neut. Dative',
    chapterNumber: 1,
    sectionId: '1.2',
    label: 'Ch 1.2 Forms of the Article (pp. 15–17)',
    alternatives: ['Masculine Dative', 'Neuter Dative'],
  },
  des: {
    pos: 'Definite Article',
    gloss: 'of the',
    gender: 'masculine',
    caseInfo: 'Masc. or Neut. Genitive',
    chapterNumber: 1,
    sectionId: '1.2',
    label: 'Ch 1.2 Forms of the Article (pp. 15–17)',
  },
  // Indefinite & Negative Articles
  ein: {
    pos: 'Indefinite Article',
    gloss: 'a / an',
    caseInfo: 'Masc. Nom. or Neut. Nom./Acc. (no signal ending!)',
    chapterNumber: 1,
    sectionId: '1.1',
    label: 'Ch 1.1 Indefinite & Definite Articles (pp. 13–14)',
  },
  eine: {
    pos: 'Indefinite Article',
    gloss: 'a / an',
    gender: 'feminine',
    caseInfo: 'Fem. Nom./Acc.',
    chapterNumber: 1,
    sectionId: '1.1',
    label: 'Ch 1.1 Indefinite & Definite Articles (pp. 13–14)',
  },
  einen: {
    pos: 'Indefinite Article',
    gloss: 'a / an',
    gender: 'masculine',
    caseInfo: 'Masc. Accusative',
    chapterNumber: 1,
    sectionId: '1.2',
    label: 'Ch 1.2 Forms of the Article (pp. 15–17)',
  },
  einem: {
    pos: 'Indefinite Article',
    gloss: 'a / an',
    caseInfo: 'Masc. or Neut. Dative',
    chapterNumber: 1,
    sectionId: '1.2',
    label: 'Ch 1.2 Forms of the Article (pp. 15–17)',
  },
  einer: {
    pos: 'Indefinite Article',
    gloss: 'a / an',
    gender: 'feminine',
    caseInfo: 'Fem. Dative or Genitive',
    chapterNumber: 1,
    sectionId: '1.2',
    label: 'Ch 1.2 Forms of the Article (pp. 15–17)',
  },
  kein: {
    pos: 'Negative Article',
    gloss: 'no / not a',
    caseInfo: 'Masc. Nom. or Neut. Nom./Acc.',
    chapterNumber: 1,
    sectionId: '1.1',
    label: 'Ch 1.1 Negation with kein (p. 14)',
  },
  keine: {
    pos: 'Negative Article',
    gloss: 'no / not any',
    caseInfo: 'Fem. or Pl. Nom./Acc.',
    chapterNumber: 1,
    sectionId: '1.1',
    label: 'Ch 1.1 Negation with kein (p. 14)',
  },
  keinen: {
    pos: 'Negative Article',
    gloss: 'no / not a',
    gender: 'masculine',
    caseInfo: 'Masc. Accusative (or Pl. Dative)',
    chapterNumber: 1,
    sectionId: '1.2',
    label: 'Ch 1.2 Forms of the Article (pp. 15–17)',
  },
  // Contractions (Ch 1.2 p. 16)
  am: { pos: 'Prep + Article Contraction', gloss: 'at/on the (an + dem)', caseInfo: 'Dative', chapterNumber: 1, sectionId: '1.2', label: 'Ch 1.2 Contractions (p. 16)' },
  ans: { pos: 'Prep + Article Contraction', gloss: 'to/onto the (an + das)', caseInfo: 'Accusative', chapterNumber: 1, sectionId: '1.2', label: 'Ch 1.2 Contractions (p. 16)' },
  aufs: { pos: 'Prep + Article Contraction', gloss: 'onto the (auf + das)', caseInfo: 'Accusative', chapterNumber: 1, sectionId: '1.2', label: 'Ch 1.2 Contractions (p. 16)' },
  beim: { pos: 'Prep + Article Contraction', gloss: 'at/near the (bei + dem)', caseInfo: 'Dative', chapterNumber: 1, sectionId: '1.2', label: 'Ch 1.2 Contractions (p. 16)' },
  im: { pos: 'Prep + Article Contraction', gloss: 'in the (in + dem)', caseInfo: 'Dative (Wo?)', chapterNumber: 1, sectionId: '1.2', label: 'Ch 1.2 Contractions (p. 16)' },
  ins: { pos: 'Prep + Article Contraction', gloss: 'into the (in + das)', caseInfo: 'Accusative (Wohin?)', chapterNumber: 1, sectionId: '1.2', label: 'Ch 1.2 Contractions (p. 16)' },
  vom: { pos: 'Prep + Article Contraction', gloss: 'from the (von + dem)', caseInfo: 'Dative', chapterNumber: 1, sectionId: '1.2', label: 'Ch 1.2 Contractions (p. 16)' },
  zum: { pos: 'Prep + Article Contraction', gloss: 'to the (zu + dem)', caseInfo: 'Dative', chapterNumber: 1, sectionId: '1.2', label: 'Ch 1.2 Contractions (p. 16)' },
  zur: { pos: 'Prep + Article Contraction', gloss: 'to the (zu + der)', caseInfo: 'Fem. Dative', chapterNumber: 1, sectionId: '1.2', label: 'Ch 1.2 Contractions (p. 16)' },
  // Personal & Possessive & Reflexive Pronouns (Ch 3)
  ich: { pos: 'Personal Pronoun', gloss: 'I', caseInfo: 'Nominative (1st sg.)', chapterNumber: 3, sectionId: '3.1', label: 'Ch 3.1 Personal Pronouns (pp. 37–39)' },
  du: { pos: 'Personal Pronoun', gloss: 'you (informal sg.)', caseInfo: 'Nominative (2nd sg.)', chapterNumber: 3, sectionId: '3.1', label: 'Ch 3.1 Personal Pronouns (pp. 37–39)' },
  er: { pos: 'Personal Pronoun', gloss: 'he / it (masc.)', gender: 'masculine', caseInfo: 'Nominative (3rd sg.)', chapterNumber: 3, sectionId: '3.1', label: 'Ch 3.1 Personal Pronouns (pp. 37–39)' },
  sie: {
    pos: 'Personal Pronoun',
    gloss: 'she / they / you (formal if capitalized)',
    caseInfo: 'Nominative or Accusative',
    chapterNumber: 3,
    sectionId: '3.1',
    label: 'Ch 3.1 Personal Pronouns (pp. 37–39)',
    alternatives: ['she (3rd sg. feminine, verb ends in -t)', 'they (3rd pl., verb ends in -en)', 'you formal "Sie" (always capitalized, verb ends in -en)'],
  },
  es: { pos: 'Personal Pronoun', gloss: 'it (neuter)', gender: 'neuter', caseInfo: 'Nominative or Accusative', chapterNumber: 3, sectionId: '3.1', label: 'Ch 3.1 Personal Pronouns (pp. 37–39)' },
  wir: { pos: 'Personal Pronoun', gloss: 'we', caseInfo: 'Nominative (1st pl.)', chapterNumber: 3, sectionId: '3.1', label: 'Ch 3.1 Personal Pronouns (pp. 37–39)' },
  ihr: {
    pos: 'Pronoun / Possessive',
    gloss: 'you all (informal pl.) / her / their / to her',
    caseInfo: 'Context-dependent',
    chapterNumber: 3,
    sectionId: '3.1',
    label: 'Ch 3.1–3.2 Pronouns & Possessives (pp. 37–42)',
    alternatives: ['you all (2nd pl. nominative)', 'to her (3rd sg. fem. dative)', 'her / their (possessive article)'],
  },
  mich: { pos: 'Personal / Reflexive Pronoun', gloss: 'me / myself', caseInfo: 'Accusative', chapterNumber: 3, sectionId: '3.1', label: 'Ch 3.1 & 3.5 Pronouns (pp. 37, 48)' },
  mir: { pos: 'Personal / Reflexive Pronoun', gloss: 'to me / myself', caseInfo: 'Dative', chapterNumber: 3, sectionId: '3.1', label: 'Ch 3.1 & 3.5 Pronouns (pp. 37, 48)' },
  dich: { pos: 'Personal / Reflexive Pronoun', gloss: 'you / yourself', caseInfo: 'Accusative', chapterNumber: 3, sectionId: '3.1', label: 'Ch 3.1 & 3.5 Pronouns' },
  dir: { pos: 'Personal / Reflexive Pronoun', gloss: 'to you / yourself', caseInfo: 'Dative', chapterNumber: 3, sectionId: '3.1', label: 'Ch 3.1 & 3.5 Pronouns' },
  ihn: { pos: 'Personal Pronoun', gloss: 'him / it (masc.)', gender: 'masculine', caseInfo: 'Accusative', chapterNumber: 3, sectionId: '3.1', label: 'Ch 3.1 Personal Pronouns' },
  ihm: { pos: 'Personal Pronoun', gloss: 'to him / to it', caseInfo: 'Dative', chapterNumber: 3, sectionId: '3.1', label: 'Ch 3.1 Personal Pronouns' },
  uns: { pos: 'Personal / Reflexive Pronoun', gloss: 'us / to us / ourselves', caseInfo: 'Accusative or Dative', chapterNumber: 3, sectionId: '3.1', label: 'Ch 3.1 Personal Pronouns' },
  euch: { pos: 'Personal / Reflexive Pronoun', gloss: 'you all / yourselves', caseInfo: 'Accusative or Dative', chapterNumber: 3, sectionId: '3.1', label: 'Ch 3.1 Personal Pronouns' },
  ihnen: { pos: 'Personal Pronoun', gloss: 'to them / to you (formal Ihnen)', caseInfo: 'Dative', chapterNumber: 3, sectionId: '3.1', label: 'Ch 3.1 Personal Pronouns' },
  sich: { pos: 'Reflexive Pronoun', gloss: 'himself / herself / itself / themselves', caseInfo: 'Accusative or Dative (3rd person)', chapterNumber: 3, sectionId: '3.5', label: 'Ch 3.5 Reflexive Pronouns (pp. 48–50)' },
  mein: { pos: 'Possessive Article', gloss: 'my', caseInfo: 'Masc. Nom. or Neut. Nom./Acc.', chapterNumber: 3, sectionId: '3.2', label: 'Ch 3.2 Possessive Articles (pp. 40–42)' },
  meine: { pos: 'Possessive Article', gloss: 'my', caseInfo: 'Fem. or Pl. Nom./Acc.', chapterNumber: 3, sectionId: '3.2', label: 'Ch 3.2 Possessive Articles' },
  meinen: { pos: 'Possessive Article', gloss: 'my', caseInfo: 'Masc. Acc. or Pl. Dat.', chapterNumber: 3, sectionId: '3.2', label: 'Ch 3.2 Possessive Articles' },
  meinem: { pos: 'Possessive Article', gloss: 'my', caseInfo: 'Masc./Neut. Dative', chapterNumber: 3, sectionId: '3.2', label: 'Ch 3.2 Possessive Articles' },
  meiner: { pos: 'Possessive Article', gloss: 'my', caseInfo: 'Fem. Dat./Gen.', chapterNumber: 3, sectionId: '3.2', label: 'Ch 3.2 Possessive Articles' },
  dein: { pos: 'Possessive Article', gloss: 'your (informal)', caseInfo: 'Masc. Nom. or Neut. Nom./Acc.', chapterNumber: 3, sectionId: '3.2', label: 'Ch 3.2 Possessive Articles' },
  deine: { pos: 'Possessive Article', gloss: 'your (informal)', caseInfo: 'Fem. or Pl. Nom./Acc.', chapterNumber: 3, sectionId: '3.2', label: 'Ch 3.2 Possessive Articles' },
  sein: { pos: 'Possessive / Verb', gloss: 'his / its OR verb "to be"', chapterNumber: 3, sectionId: '3.2', label: 'Ch 3.2 Possessives / Ch 7.1 sein', alternatives: ['Possessive article "his/its"', 'Auxiliary verb infinitive "to be"'] },
  seine: { pos: 'Possessive Article', gloss: 'his / its', caseInfo: 'Fem. or Pl. Nom./Acc.', chapterNumber: 3, sectionId: '3.2', label: 'Ch 3.2 Possessive Articles' },
  seinem: { pos: 'Possessive Article', gloss: 'his / its', caseInfo: 'Masc./Neut. Dative', chapterNumber: 3, sectionId: '3.2', label: 'Ch 3.2 Possessive Articles' },
  seinen: { pos: 'Possessive Article', gloss: 'his / its', caseInfo: 'Masc. Acc. or Pl. Dat.', chapterNumber: 3, sectionId: '3.2', label: 'Ch 3.2 Possessive Articles' },
  // Interrogatives (Ch 3.4)
  wer: { pos: 'Interrogative Pronoun', gloss: 'who?', caseInfo: 'Nominative', chapterNumber: 3, sectionId: '3.4', label: 'Ch 3.4 Interrogative Pronouns (pp. 46–48)' },
  wen: { pos: 'Interrogative Pronoun', gloss: 'whom?', caseInfo: 'Accusative', chapterNumber: 3, sectionId: '3.4', label: 'Ch 3.4 Interrogative Pronouns' },
  wem: { pos: 'Interrogative Pronoun', gloss: 'to whom?', caseInfo: 'Dative', chapterNumber: 3, sectionId: '3.4', label: 'Ch 3.4 Interrogative Pronouns' },
  wessen: { pos: 'Interrogative Pronoun', gloss: 'whose?', caseInfo: 'Genitive', chapterNumber: 3, sectionId: '3.4', label: 'Ch 3.4 Interrogative Pronouns' },
  was: { pos: 'Interrogative Pronoun', gloss: 'what?', chapterNumber: 3, sectionId: '3.4', label: 'Ch 3.4 Interrogative Pronouns' },
  wo: { pos: 'Interrogative Adverb', gloss: 'where? (position)', chapterNumber: 13, sectionId: '13.3', label: 'Ch 13.3 Wo? vs. Wohin?' },
  wohin: { pos: 'Interrogative Adverb', gloss: 'where to? (direction)', chapterNumber: 13, sectionId: '13.3', label: 'Ch 13.3 Wo? vs. Wohin?' },
  wann: { pos: 'Interrogative Adverb', gloss: 'when?', chapterNumber: 6, sectionId: '6', label: 'Ch 6 W-Questions (p. 68)' },
  warum: { pos: 'Interrogative Adverb', gloss: 'why?', chapterNumber: 6, sectionId: '6', label: 'Ch 6 W-Questions (p. 68)' },
  wie: { pos: 'Interrogative / Comparison', gloss: 'how? / as', chapterNumber: 4, sectionId: '4.2', label: 'Ch 4.2 Comparison & Ch 6 Questions' },
  // Auxiliaries & Modals (Ch 7, 8, 9, 10, 11, 12)
  bin: { pos: 'Auxiliary / Main Verb', lemma: 'sein', gloss: 'am', verbInfo: '1st sg. Present (sein)', chapterNumber: 7, sectionId: '7.1', label: 'Ch 7.1 Auxiliary Verbs (pp. 75–77)' },
  bist: { pos: 'Auxiliary / Main Verb', lemma: 'sein', gloss: 'are', verbInfo: '2nd sg. Present (sein)', chapterNumber: 7, sectionId: '7.1', label: 'Ch 7.1 Auxiliary Verbs' },
  ist: { pos: 'Auxiliary / Main Verb', lemma: 'sein', gloss: 'is', verbInfo: '3rd sg. Present (sein)', chapterNumber: 7, sectionId: '7.1', label: 'Ch 7.1 Auxiliary Verbs' },
  sind: { pos: 'Auxiliary / Main Verb', lemma: 'sein', gloss: 'are', verbInfo: '1st/3rd pl. Present (sein)', chapterNumber: 7, sectionId: '7.1', label: 'Ch 7.1 Auxiliary Verbs' },
  seid: { pos: 'Auxiliary / Main Verb', lemma: 'sein', gloss: 'are (ihr)', verbInfo: '2nd pl. Present (sein)', chapterNumber: 7, sectionId: '7.1', label: 'Ch 7.1 Auxiliary Verbs' },
  war: { pos: 'Auxiliary / Main Verb', lemma: 'sein', gloss: 'was', verbInfo: '1st/3rd sg. Präteritum (sein)', chapterNumber: 9, sectionId: '9.1', label: 'Ch 9.1 Präteritum (p. 98)' },
  waren: { pos: 'Auxiliary / Main Verb', lemma: 'sein', gloss: 'were', verbInfo: '1st/3rd pl. Präteritum (sein)', chapterNumber: 9, sectionId: '9.1', label: 'Ch 9.1 Präteritum' },
  wäre: { pos: 'Subjunctive Verb', lemma: 'sein', gloss: 'would be / were', verbInfo: 'Konjunktiv II (sein)', chapterNumber: 11, sectionId: '11.2', label: 'Ch 11.2 Konjunktiv II (p. 119)' },
  habe: { pos: 'Auxiliary / Main Verb', lemma: 'haben', gloss: 'have', verbInfo: '1st sg. Present (haben)', chapterNumber: 7, sectionId: '7.1', label: 'Ch 7.1 Auxiliary Verbs' },
  hast: { pos: 'Auxiliary / Main Verb', lemma: 'haben', gloss: 'have', verbInfo: '2nd sg. Present (haben)', chapterNumber: 7, sectionId: '7.1', label: 'Ch 7.1 Auxiliary Verbs' },
  hat: { pos: 'Auxiliary / Main Verb', lemma: 'haben', gloss: 'has', verbInfo: '3rd sg. Present (haben)', chapterNumber: 7, sectionId: '7.1', label: 'Ch 7.1 Auxiliary Verbs' },
  haben: { pos: 'Auxiliary / Main Verb', lemma: 'haben', gloss: 'have / to have', verbInfo: 'Infinitive or 1st/3rd pl. Present', chapterNumber: 7, sectionId: '7.1', label: 'Ch 7.1 Auxiliary Verbs' },
  hatte: { pos: 'Auxiliary / Main Verb', lemma: 'haben', gloss: 'had', verbInfo: '1st/3rd sg. Präteritum (haben)', chapterNumber: 9, sectionId: '9.1', label: 'Ch 9.1 Präteritum' },
  hätte: { pos: 'Subjunctive Verb', lemma: 'haben', gloss: 'would have / had', verbInfo: 'Konjunktiv II (haben)', chapterNumber: 11, sectionId: '11.2', label: 'Ch 11.2 Konjunktiv II (p. 119)' },
  werde: { pos: 'Auxiliary Verb', lemma: 'werden', gloss: 'will / become / am (passive)', verbInfo: '1st sg. Present (werden)', chapterNumber: 10, sectionId: '10.1', label: 'Ch 7.1, 10.1 Futur & Ch 12 Passiv' },
  wirst: { pos: 'Auxiliary Verb', lemma: 'werden', gloss: 'will / become', verbInfo: '2nd sg. Present (werden)', chapterNumber: 10, sectionId: '10.1', label: 'Ch 10.1 Futur I' },
  wird: { pos: 'Auxiliary Verb', lemma: 'werden', gloss: 'will / becomes / is (passive)', verbInfo: '3rd sg. Present (werden)', chapterNumber: 10, sectionId: '10.1', label: 'Ch 10.1 Futur / Ch 12 Passiv' },
  werden: { pos: 'Auxiliary Verb', lemma: 'werden', gloss: 'will / become / be (passive)', verbInfo: 'Infinitive or 1st/3rd pl. Present', chapterNumber: 10, sectionId: '10.1', label: 'Ch 10.1 Futur / Ch 12 Passiv' },
  wurde: { pos: 'Auxiliary Verb', lemma: 'werden', gloss: 'became / was (passive)', verbInfo: '1st/3rd sg. Präteritum (werden)', chapterNumber: 12, sectionId: '12.1', label: 'Ch 12.1 Vorgangspassiv (p. 124)' },
  würde: { pos: 'Subjunctive Auxiliary', lemma: 'werden', gloss: 'would', verbInfo: 'Konjunktiv II (werden)', chapterNumber: 11, sectionId: '11.2', label: 'Ch 11.2 würde + Infinitiv (p. 118)' },
  kann: { pos: 'Modal Verb', lemma: 'können', gloss: 'can / am able to', verbInfo: '1st/3rd sg. Present (sends infinitive to end)', chapterNumber: 7, sectionId: '7.2', label: 'Ch 7.2 Modal Verbs (pp. 77–82)' },
  kannst: { pos: 'Modal Verb', lemma: 'können', gloss: 'can', verbInfo: '2nd sg. Present', chapterNumber: 7, sectionId: '7.2', label: 'Ch 7.2 Modal Verbs' },
  können: { pos: 'Modal Verb', lemma: 'können', gloss: 'can / to be able to', verbInfo: 'Infinitive or 1st/3rd pl. Present', chapterNumber: 7, sectionId: '7.2', label: 'Ch 7.2 Modal Verbs' },
  könnte: { pos: 'Modal Verb (Subjunctive)', lemma: 'können', gloss: 'could (polite/unreal)', verbInfo: 'Konjunktiv II', chapterNumber: 11, sectionId: '11.2', label: 'Ch 11.2 Konjunktiv II' },
  muss: { pos: 'Modal Verb', lemma: 'müssen', gloss: 'must / have to', verbInfo: '1st/3rd sg. Present', chapterNumber: 7, sectionId: '7.2', label: 'Ch 7.2 Modal Verbs' },
  müssen: { pos: 'Modal Verb', lemma: 'müssen', gloss: 'must / have to', verbInfo: 'Infinitive or 1st/3rd pl. Present', chapterNumber: 7, sectionId: '7.2', label: 'Ch 7.2 Modal Verbs' },
  darf: { pos: 'Modal Verb', lemma: 'dürfen', gloss: 'may / am allowed to', verbInfo: '1st/3rd sg. Present', chapterNumber: 7, sectionId: '7.2', label: 'Ch 7.2 Modal Verbs' },
  soll: { pos: 'Modal Verb', lemma: 'sollen', gloss: 'should / supposed to', verbInfo: '1st/3rd sg. Present', chapterNumber: 7, sectionId: '7.2', label: 'Ch 7.2 Modal Verbs' },
  will: { pos: 'Modal Verb', lemma: 'wollen', gloss: 'want(s) to', verbInfo: '1st/3rd sg. Present', chapterNumber: 7, sectionId: '7.2', label: 'Ch 7.2 Modal Verbs' },
  möchte: { pos: 'Modal Verb', lemma: 'mögen', gloss: 'would like to', verbInfo: '1st/3rd sg. Polite Konjunktiv II of mögen', chapterNumber: 7, sectionId: '7.2', label: 'Ch 7.2 Modal Verbs (p. 79)' },
  // Prepositions (Ch 13)
  durch: { pos: 'Preposition (Accusative)', gloss: 'through', caseInfo: 'Always takes Accusative', chapterNumber: 13, sectionId: '13.1', label: 'Ch 13.1 Accusative Prepositions (p. 133)' },
  für: { pos: 'Preposition (Accusative)', gloss: 'for', caseInfo: 'Always takes Accusative', chapterNumber: 13, sectionId: '13.1', label: 'Ch 13.1 Accusative Prepositions (p. 133)' },
  gegen: { pos: 'Preposition (Accusative)', gloss: 'against / around', caseInfo: 'Always takes Accusative', chapterNumber: 13, sectionId: '13.1', label: 'Ch 13.1 Accusative Prepositions' },
  ohne: { pos: 'Preposition (Accusative)', gloss: 'without', caseInfo: 'Always takes Accusative', chapterNumber: 13, sectionId: '13.1', label: 'Ch 13.1 Accusative Prepositions' },
  um: { pos: 'Preposition (Accusative)', gloss: 'around / at (time)', caseInfo: 'Always takes Accusative', chapterNumber: 13, sectionId: '13.1', label: 'Ch 13.1 Accusative Prepositions' },
  bis: { pos: 'Preposition (Accusative)', gloss: 'until / to', caseInfo: 'Accusative', chapterNumber: 13, sectionId: '13.1', label: 'Ch 13.1 Accusative Prepositions' },
  aus: { pos: 'Preposition (Dative)', gloss: 'from / out of', caseInfo: 'Always takes Dative', chapterNumber: 13, sectionId: '13.2', label: 'Ch 13.2 Dative Prepositions (p. 134)' },
  bei: { pos: 'Preposition (Dative)', gloss: 'at / near / with', caseInfo: 'Always takes Dative', chapterNumber: 13, sectionId: '13.2', label: 'Ch 13.2 Dative Prepositions' },
  mit: { pos: 'Preposition (Dative)', gloss: 'with', caseInfo: 'Always takes Dative', chapterNumber: 13, sectionId: '13.2', label: 'Ch 13.2 Dative Prepositions' },
  nach: { pos: 'Preposition (Dative)', gloss: 'after / to (city/country)', caseInfo: 'Always takes Dative', chapterNumber: 13, sectionId: '13.2', label: 'Ch 13.2 Dative Prepositions' },
  seit: { pos: 'Preposition (Dative)', gloss: 'since / for (time)', caseInfo: 'Always takes Dative', chapterNumber: 13, sectionId: '13.2', label: 'Ch 13.2 Dative Prepositions' },
  von: { pos: 'Preposition (Dative)', gloss: 'from / by / of', caseInfo: 'Always takes Dative', chapterNumber: 13, sectionId: '13.2', label: 'Ch 13.2 Dative Prepositions' },
  zu: { pos: 'Preposition (Dative) / Infinitive Particle', gloss: 'to / too', caseInfo: 'Takes Dative (or + Infinitiv)', chapterNumber: 13, sectionId: '13.2', label: 'Ch 13.2 Dative Prepositions / Ch 14.4 Infinitivsätze' },
  an: { pos: 'Two-Way Preposition', gloss: 'at / on (vertical)', caseInfo: 'Wohin? = Accusative · Wo? = Dative', chapterNumber: 13, sectionId: '13.3', label: 'Ch 13.3 Wechselpräpositionen (pp. 135–137)' },
  auf: { pos: 'Two-Way Preposition', gloss: 'on / onto (horizontal)', caseInfo: 'Wohin? = Accusative · Wo? = Dative', chapterNumber: 13, sectionId: '13.3', label: 'Ch 13.3 Wechselpräpositionen' },
  hinter: { pos: 'Two-Way Preposition', gloss: 'behind', caseInfo: 'Wohin? = Accusative · Wo? = Dative', chapterNumber: 13, sectionId: '13.3', label: 'Ch 13.3 Wechselpräpositionen' },
  in: { pos: 'Two-Way Preposition', gloss: 'in / into', caseInfo: 'Wohin? = Accusative · Wo? = Dative', chapterNumber: 13, sectionId: '13.3', label: 'Ch 13.3 Wechselpräpositionen' },
  neben: { pos: 'Two-Way Preposition', gloss: 'next to', caseInfo: 'Wohin? = Accusative · Wo? = Dative', chapterNumber: 13, sectionId: '13.3', label: 'Ch 13.3 Wechselpräpositionen' },
  über: { pos: 'Two-Way Preposition', gloss: 'over / above / about', caseInfo: 'Wohin? = Accusative · Wo? = Dative', chapterNumber: 13, sectionId: '13.3', label: 'Ch 13.3 Wechselpräpositionen' },
  unter: { pos: 'Two-Way Preposition', gloss: 'under / below', caseInfo: 'Wohin? = Accusative · Wo? = Dative', chapterNumber: 13, sectionId: '13.3', label: 'Ch 13.3 Wechselpräpositionen' },
  vor: { pos: 'Two-Way Preposition', gloss: 'in front of / ago', caseInfo: 'Wohin? = Accusative · Wo? = Dative', chapterNumber: 13, sectionId: '13.3', label: 'Ch 13.3 Wechselpräpositionen' },
  zwischen: { pos: 'Two-Way Preposition', gloss: 'between', caseInfo: 'Wohin? = Accusative · Wo? = Dative', chapterNumber: 13, sectionId: '13.3', label: 'Ch 13.3 Wechselpräpositionen' },
  wegen: { pos: 'Preposition (Genitive)', gloss: 'because of', caseInfo: 'Genitive (often Dative in spoken German)', chapterNumber: 13, sectionId: '13.4', label: 'Ch 13.4 Genitive Prepositions (p. 138)' },
  trotz: { pos: 'Preposition (Genitive)', gloss: 'despite / in spite of', caseInfo: 'Genitive', chapterNumber: 13, sectionId: '13.4', label: 'Ch 13.4 Genitive Prepositions' },
  während: { pos: 'Preposition (Genitive)', gloss: 'during', caseInfo: 'Genitive', chapterNumber: 13, sectionId: '13.4', label: 'Ch 13.4 Genitive Prepositions' },
  // Conjunctions & Subjunctions (Ch 14)
  und: { pos: 'Coordinating Conjunction', gloss: 'and', notes: 'Position 0 — does NOT change word order', chapterNumber: 14, sectionId: '14.1', label: 'Ch 14.1 Konjunktionen (p. 140)' },
  aber: { pos: 'Coordinating Conjunction / Modal Particle', gloss: 'but (or surprise particle)', notes: 'Position 0 as conjunction', chapterNumber: 14, sectionId: '14.1', label: 'Ch 14.1 Konjunktionen & Ch 5.2 Modalpartikel' },
  oder: { pos: 'Coordinating Conjunction', gloss: 'or', notes: 'Position 0 — does NOT change word order', chapterNumber: 14, sectionId: '14.1', label: 'Ch 14.1 Konjunktionen' },
  denn: { pos: 'Coordinating Conjunction / Modal Particle', gloss: 'because / for (or friendly question particle)', notes: 'Position 0 as conjunction', chapterNumber: 14, sectionId: '14.1', label: 'Ch 14.1 Konjunktionen & Ch 5.2' },
  sondern: { pos: 'Coordinating Conjunction', gloss: 'but rather (after negation)', notes: 'Position 0', chapterNumber: 14, sectionId: '14.1', label: 'Ch 14.1 Konjunktionen' },
  weil: { pos: 'Subordinating Conjunction', gloss: 'because', notes: 'Sends conjugated verb to the END of the clause!', chapterNumber: 14, sectionId: '14.2', label: 'Ch 14.2 Subjunktionen (pp. 142–146)' },
  dass: { pos: 'Subordinating Conjunction', gloss: 'that', notes: 'Sends conjugated verb to the END of the clause!', chapterNumber: 14, sectionId: '14.2', label: 'Ch 14.2 Subjunktionen' },
  wenn: { pos: 'Subordinating Conjunction', gloss: 'if / whenever', notes: 'Sends conjugated verb to the END of the clause!', chapterNumber: 14, sectionId: '14.2', label: 'Ch 14.2 Subjunktionen' },
  ob: { pos: 'Subordinating Conjunction', gloss: 'whether / if', notes: 'Sends conjugated verb to the END of the clause!', chapterNumber: 14, sectionId: '14.2', label: 'Ch 14.2 Subjunktionen' },
  obwohl: { pos: 'Subordinating Conjunction', gloss: 'although', notes: 'Sends conjugated verb to the END of the clause!', chapterNumber: 14, sectionId: '14.2', label: 'Ch 14.2 Subjunktionen' },
  als: { pos: 'Subordinating Conjunction / Comparison', gloss: 'when (single past event) / than', chapterNumber: 14, sectionId: '14.2', label: 'Ch 14.2 Subjunktionen & Ch 4.2' },
  damit: { pos: 'Subordinating Conjunction', gloss: 'so that', notes: 'Sends conjugated verb to the END of the clause!', chapterNumber: 14, sectionId: '14.2', label: 'Ch 14.2 & 14.4' },
  nachdem: { pos: 'Subordinating Conjunction', gloss: 'after', notes: 'Sends conjugated verb to the END of the clause!', chapterNumber: 14, sectionId: '14.2', label: 'Ch 14.2 & Ch 9.4' },
  bevor: { pos: 'Subordinating Conjunction', gloss: 'before', notes: 'Sends conjugated verb to the END of the clause!', chapterNumber: 14, sectionId: '14.2', label: 'Ch 14.2 Subjunktionen' },
  // Common adverbs & modal particles (Ch 5)
  nicht: { pos: 'Negation Particle', gloss: 'not', chapterNumber: 1, sectionId: '1.1', label: 'Ch 1.1 Negation (p. 14)' },
  heute: { pos: 'Time Adverb (T)', gloss: 'today', chapterNumber: 5, sectionId: '5.1', label: 'Ch 5.1 Adverbs & TeKaMoLo (pp. 60–63)' },
  gestern: { pos: 'Time Adverb (T)', gloss: 'yesterday', chapterNumber: 5, sectionId: '5.1', label: 'Ch 5.1 Adverbs & TeKaMoLo' },
  morgen: { pos: 'Time Adverb (T)', gloss: 'tomorrow', chapterNumber: 5, sectionId: '5.1', label: 'Ch 5.1 Adverbs & TeKaMoLo' },
  immer: { pos: 'Time Adverb (T)', gloss: 'always', chapterNumber: 5, sectionId: '5.1', label: 'Ch 5.1 Adverbs' },
  oft: { pos: 'Time Adverb (T)', gloss: 'often', chapterNumber: 5, sectionId: '5.1', label: 'Ch 5.1 Adverbs' },
  gern: { pos: 'Manner Adverb (M)', gloss: 'gladly / like to', chapterNumber: 5, sectionId: '5.1', label: 'Ch 5.1 Adverbs (p. 62)' },
  gerne: { pos: 'Manner Adverb (M)', gloss: 'gladly / like to', chapterNumber: 5, sectionId: '5.1', label: 'Ch 5.1 Adverbs' },
  sehr: { pos: 'Degree Adverb', gloss: 'very', chapterNumber: 5, sectionId: '5.1', label: 'Ch 5.1 Adverbs' },
  hier: { pos: 'Location Adverb (L)', gloss: 'here', chapterNumber: 5, sectionId: '5.1', label: 'Ch 5.1 Adverbs' },
  dort: { pos: 'Location Adverb (L)', gloss: 'there', chapterNumber: 5, sectionId: '5.1', label: 'Ch 5.1 Adverbs' },
  eigentlich: { pos: 'Modal Particle', gloss: 'actually / by the way', chapterNumber: 5, sectionId: '5.2', label: 'Ch 5.2 Modal Particles (pp. 64–66)' },
  mal: { pos: 'Modal Particle', gloss: 'just / briefly (softens requests)', chapterNumber: 5, sectionId: '5.2', label: 'Ch 5.2 Modal Particles' },
  doch: { pos: 'Modal Particle / Conjunction', gloss: 'after all / really / on the contrary', chapterNumber: 5, sectionId: '5.2', label: 'Ch 5.2 Modal Particles' },
  ja: { pos: 'Modal Particle / Answer', gloss: 'yes / as you know', chapterNumber: 5, sectionId: '5.2', label: 'Ch 5.2 Modal Particles' },
  schon: { pos: 'Time Adverb / Modal Particle', gloss: 'already / surely', chapterNumber: 5, sectionId: '5.2', label: 'Ch 5.2 Modal Particles' },
  // Frequent Book Verbs & Nouns
  gibt: { pos: 'Finite Verb', lemma: 'geben', gloss: 'gives', verbInfo: '3rd sg. Present (stem vowel e→i; takes Dat + Acc)', chapterNumber: 2, sectionId: '2.3', label: 'Ch 2.3 Cases & Ch 8.1 Present' },
  gebe: { pos: 'Finite Verb', lemma: 'geben', gloss: 'give', verbInfo: '1st sg. Present', chapterNumber: 8, sectionId: '8.1', label: 'Ch 8.1 Present Tense' },
  geht: { pos: 'Finite Verb', lemma: 'gehen', gloss: 'goes / walks', verbInfo: '3rd sg. Present', chapterNumber: 8, sectionId: '8.1', label: 'Ch 8.1 Present Tense' },
  gehe: { pos: 'Finite Verb', lemma: 'gehen', gloss: 'go', verbInfo: '1st sg. Present', chapterNumber: 8, sectionId: '8.1', label: 'Ch 8.1 Present Tense' },
  fährt: { pos: 'Finite Verb', lemma: 'fahren', gloss: 'drives / goes by vehicle', verbInfo: '3rd sg. Present (a→ä)', chapterNumber: 8, sectionId: '8.1', label: 'Ch 8.1 Present Tense (p. 90)' },
  komme: { pos: 'Finite Verb', lemma: 'kommen', gloss: 'come', verbInfo: '1st sg. Present', chapterNumber: 8, sectionId: '8.1', label: 'Ch 8.1 Present Tense' },
  kommt: { pos: 'Finite Verb', lemma: 'kommen', gloss: 'comes', verbInfo: '3rd sg. Present', chapterNumber: 8, sectionId: '8.1', label: 'Ch 8.1 Present Tense' },
  lerne: { pos: 'Finite Verb', lemma: 'lernen', gloss: 'learn', verbInfo: '1st sg. Present (weak verb)', chapterNumber: 8, sectionId: '8.1', label: 'Ch 8.1 Present Tense' },
  lernt: { pos: 'Finite Verb', lemma: 'lernen', gloss: 'learns', verbInfo: '3rd sg. Present (weak verb)', chapterNumber: 8, sectionId: '8.1', label: 'Ch 8.1 Present Tense' },
  lernen: { pos: 'Verb', lemma: 'lernen', gloss: 'learn / to learn', verbInfo: 'Infinitive or 1st/3rd pl. Present', chapterNumber: 8, sectionId: '8.1', label: 'Ch 8.1 Present Tense' },
  gelernt: { pos: 'Past Participle (Partizip II)', lemma: 'lernen', gloss: 'learned', verbInfo: 'Weak Partizip II (ge- + stem + -t)', chapterNumber: 9, sectionId: '9.2', label: 'Ch 9.2 Partizip II (p. 100)' },
  gemacht: { pos: 'Past Participle (Partizip II)', lemma: 'machen', gloss: 'done / made', verbInfo: 'Weak Partizip II', chapterNumber: 9, sectionId: '9.2', label: 'Ch 9.2 Partizip II' },
  gegangen: { pos: 'Past Participle (Partizip II)', lemma: 'gehen', gloss: 'gone', verbInfo: 'Strong Partizip II (uses sein in Perfekt)', chapterNumber: 9, sectionId: '9.3', label: 'Ch 9.3 Perfekt with sein (p. 104)' },
  gefahren: { pos: 'Past Participle (Partizip II)', lemma: 'fahren', gloss: 'driven / traveled', verbInfo: 'Strong Partizip II (usually sein in Perfekt)', chapterNumber: 9, sectionId: '9.3', label: 'Ch 9.3 Perfekt' },
  gekauft: { pos: 'Past Participle (Partizip II)', lemma: 'kaufen', gloss: 'bought', verbInfo: 'Weak Partizip II (uses haben)', chapterNumber: 9, sectionId: '9.2', label: 'Ch 9.2 Partizip II' },
  kaufe: { pos: 'Finite Verb', lemma: 'kaufen', gloss: 'buy', verbInfo: '1st sg. Present', chapterNumber: 8, sectionId: '8.1', label: 'Ch 8.1 Present Tense' },
  kauft: { pos: 'Finite Verb', lemma: 'kaufen', gloss: 'buys', verbInfo: '3rd sg. Present', chapterNumber: 8, sectionId: '8.1', label: 'Ch 8.1 Present Tense' },
  trinke: { pos: 'Finite Verb', lemma: 'trinken', gloss: 'drink', verbInfo: '1st sg. Present', chapterNumber: 8, sectionId: '8.1', label: 'Ch 8.1 Present Tense' },
  trinkt: { pos: 'Finite Verb', lemma: 'trinken', gloss: 'drinks', verbInfo: '3rd sg. Present', chapterNumber: 8, sectionId: '8.1', label: 'Ch 8.1 Present Tense' },
  helfe: { pos: 'Finite Verb (Dative)', lemma: 'helfen', gloss: 'help', verbInfo: '1st sg. Present — takes Dative object!', chapterNumber: 2, sectionId: '2.3', label: 'Ch 2.3 Dative Verbs (p. 31 & p. 172)' },
  hilft: { pos: 'Finite Verb (Dative)', lemma: 'helfen', gloss: 'helps', verbInfo: '3rd sg. Present (e→i) — takes Dative object!', chapterNumber: 2, sectionId: '2.3', label: 'Ch 2.3 Dative Verbs' },
  steht: { pos: 'Finite Verb (Position)', lemma: 'stehen', gloss: 'stands / is standing', verbInfo: '3rd sg. Present (triggers Wo? = Dative)', chapterNumber: 13, sectionId: '13.3', label: 'Ch 13.3 Wo? vs. Wohin?' },
  stellt: { pos: 'Finite Verb (Action)', lemma: 'stellen', gloss: 'puts / places upright', verbInfo: '3rd sg. Present (triggers Wohin? = Accusative)', chapterNumber: 13, sectionId: '13.3', label: 'Ch 13.3 Wo? vs. Wohin?' },
  liegt: { pos: 'Finite Verb (Position)', lemma: 'liegen', gloss: 'lies / is lying', verbInfo: '3rd sg. Present (triggers Wo? = Dative)', chapterNumber: 13, sectionId: '13.3', label: 'Ch 13.3 Wo? vs. Wohin?' },
  legt: { pos: 'Finite Verb (Action)', lemma: 'legen', gloss: 'lays / places flat', verbInfo: '3rd sg. Present (triggers Wohin? = Accusative)', chapterNumber: 13, sectionId: '13.3', label: 'Ch 13.3 Wo? vs. Wohin?' },
  rufe: { pos: 'Finite Verb', lemma: 'anrufen', gloss: 'call (check for separable prefix "an" at end)', verbInfo: '1st sg. Present', chapterNumber: 7, sectionId: '7.3', label: 'Ch 7.3 Verbs with Prefixes (pp. 82–86)' },
  ruft: { pos: 'Finite Verb', lemma: 'anrufen', gloss: 'calls', verbInfo: '3rd sg. Present', chapterNumber: 7, sectionId: '7.3', label: 'Ch 7.3 Verbs with Prefixes' },
  mann: { pos: 'Noun', gloss: 'man / husband', gender: 'masculine', chapterNumber: 1, sectionId: '1.1', label: 'Ch 1 & 2 Nouns' },
  frau: { pos: 'Noun', gloss: 'woman / wife / Mrs.', gender: 'feminine', chapterNumber: 1, sectionId: '1.1', label: 'Ch 1 & 2 Nouns' },
  kind: { pos: 'Noun', gloss: 'child', gender: 'neuter', chapterNumber: 1, sectionId: '1.1', label: 'Ch 1 & 2 Nouns' },
  kinder: { pos: 'Noun (Plural)', gloss: 'children', gender: 'plural', chapterNumber: 2, sectionId: '2.2', label: 'Ch 2.2 Plural' },
  buch: { pos: 'Noun', gloss: 'book', gender: 'neuter', chapterNumber: 2, sectionId: '2.1', label: 'Ch 2.1 Gender' },
  tisch: { pos: 'Noun', gloss: 'table', gender: 'masculine', chapterNumber: 2, sectionId: '2.1', label: 'Ch 2.1 Gender' },
  schlüssel: { pos: 'Noun', gloss: 'key', gender: 'masculine', chapterNumber: 2, sectionId: '2.3', label: 'Ch 2.3 Cases (p. 32)' },
  kollegen: { pos: 'Noun (n-Declension)', lemma: 'Kollege', gloss: 'colleague', gender: 'masculine', caseInfo: 'Acc./Dat./Gen. sg. or Plural (-n)', chapterNumber: 2, sectionId: '2.4', label: 'Ch 2.4 n-Declension (p. 34)' },
  studenten: { pos: 'Noun (n-Declension)', lemma: 'Student', gloss: 'student', gender: 'masculine', caseInfo: 'Acc./Dat./Gen. sg. or Plural (-en)', chapterNumber: 2, sectionId: '2.4', label: 'Ch 2.4 n-Declension (p. 34)' },
  deutsch: { pos: 'Noun / Language', gloss: 'German', gender: 'neuter', chapterNumber: 1, sectionId: '1.3', label: 'Ch 1.3 Zero Article' },
  kaffee: { pos: 'Noun', gloss: 'coffee', gender: 'masculine', chapterNumber: 1, sectionId: '1.3', label: 'Ch 1.3 Zero Article' },
  wein: { pos: 'Noun', gloss: 'wine', gender: 'masculine', chapterNumber: 4, sectionId: '4.1', label: 'Ch 4.1 Adjective Endings (p. 54)' },
  bier: { pos: 'Noun', gloss: 'beer', gender: 'neuter', chapterNumber: 4, sectionId: '4.1', label: 'Ch 4.1 Adjective Endings (p. 54)' },
  milch: { pos: 'Noun', gloss: 'milk', gender: 'feminine', chapterNumber: 4, sectionId: '4.1', label: 'Ch 4.1 Adjective Endings (p. 54)' },
  haus: { pos: 'Noun', gloss: 'house', gender: 'neuter', chapterNumber: 2, sectionId: '2.1', label: 'Ch 2.1 Nouns' },
  hause: { pos: 'Noun (Set Phrase)', gloss: 'home (zu Hause / nach Hause)', gender: 'neuter', chapterNumber: 13, sectionId: '13.2', label: 'Ch 13.2 Dative Prepositions' },
  schule: { pos: 'Noun', gloss: 'school', gender: 'feminine', chapterNumber: 2, sectionId: '2.1', label: 'Ch 2.1 Gender (-e often feminine)' },
  berlin: { pos: 'Proper Noun (City)', gloss: 'Berlin', gender: 'neuter', chapterNumber: 1, sectionId: '1.3', label: 'Ch 1.3 Zero Article (cities)' },
  münchen: { pos: 'Proper Noun (City)', gloss: 'Munich', gender: 'neuter', chapterNumber: 1, sectionId: '1.3', label: 'Ch 1.3 Zero Article (cities)' },
  deutschland: { pos: 'Proper Noun (Country)', gloss: 'Germany', gender: 'neuter', chapterNumber: 1, sectionId: '1.3', label: 'Ch 1.3 Zero Article (countries)' },
  freund: { pos: 'Noun', gloss: 'friend (male)', gender: 'masculine', chapterNumber: 2, sectionId: '2.1', label: 'Ch 2.1 Gender' },
  freundin: { pos: 'Noun', gloss: 'friend (female)', gender: 'feminine', chapterNumber: 2, sectionId: '2.1', label: 'Ch 2.1 Gender (-in = feminine)' },
  hund: { pos: 'Noun', gloss: 'dog', gender: 'masculine', chapterNumber: 2, sectionId: '2.1', label: 'Ch 2.1 Gender' },
  katze: { pos: 'Noun', gloss: 'cat', gender: 'feminine', chapterNumber: 2, sectionId: '2.1', label: 'Ch 2.1 Gender' },
  tag: { pos: 'Noun', gloss: 'day', gender: 'masculine', chapterNumber: 2, sectionId: '2.1', label: 'Ch 2.1 Gender' },
  zeit: { pos: 'Noun', gloss: 'time', gender: 'feminine', chapterNumber: 2, sectionId: '2.1', label: 'Ch 2.1 Gender' },
  arbeit: { pos: 'Noun', gloss: 'work / job', gender: 'feminine', chapterNumber: 2, sectionId: '2.1', label: 'Ch 2.1 Gender' },
  auto: { pos: 'Noun', gloss: 'car', gender: 'neuter', chapterNumber: 2, sectionId: '2.1', label: 'Ch 2.1 Gender (-o often neuter)' },
};

const SEPARABLE_PREFIXES = new Set([
  'ab', 'an', 'auf', 'aus', 'ein', 'her', 'hin', 'mit', 'nach', 'vor', 'weg', 'weiter', 'zu', 'zurück', 'raus', 'rein',
]);

const SUBJUNCTIONS = new Set([
  'weil', 'dass', 'wenn', 'ob', 'obwohl', 'als', 'damit', 'nachdem', 'bevor', 'seitdem', 'da', 'bis', 'während',
]);

const W_WORDS = new Set(['wer', 'wen', 'wem', 'wessen', 'was', 'wo', 'wohin', 'woher', 'wann', 'warum', 'wie', 'welche', 'welcher', 'welches']);

function inferNounGenderBySuffix(word: string): { gender: AnalyzedToken['gender']; note: string } | null {
  const lower = word.toLowerCase();
  if (/(heit|keit|ung|schaft|tät|ion|ei|enz|ik|in)$/.test(lower)) {
    return { gender: 'feminine', note: 'Suffix rule (Ch 2.1 p. 25): this ending strongly indicates feminine (die).' };
  }
  if (/(chen|lein|ment|tum|trum|nis)$/.test(lower)) {
    return { gender: 'neuter', note: 'Suffix rule (Ch 2.1 p. 24): this ending strongly indicates neuter (das).' };
  }
  if (/(ismus|ling|ist|ant|ent|or|ig)$/.test(lower)) {
    return { gender: 'masculine', note: 'Suffix rule (Ch 2.1 p. 23): this ending strongly indicates masculine (der).' };
  }
  return null;
}

export function analyzeGermanSentenceLocally(rawSentence: string): SentenceAnalysisResult {
  const sentence = rawSentence.trim();
  const rawWords = sentence.split(/\s+/).filter(Boolean);
  const tokens: AnalyzedToken[] = [];
  const grammarNotes: string[] = [];
  const ambiguities: string[] = [];
  const relatedMap = new Map<string, { chapterNumber: number; sectionId: string; title: string }>();

  const addChapterRef = (chapterNumber: number, sectionId: string, title: string) => {
    const key = `${chapterNumber}-${sectionId}`;
    if (!relatedMap.has(key)) {
      relatedMap.set(key, { chapterNumber, sectionId, title });
    }
  };

  let hasSubjunction = false;
  let hasModalOrAux = false;
  let finiteVerbIndex = -1;
  let endBracketWords: string[] = [];

  rawWords.forEach((raw, idx) => {
    const cleanWord = raw.replace(/^[„"‚'([¡¿]+|[.,!?;:„"‚')\]»«]+$/g, '');
    const lower = cleanWord.toLowerCase();
    const isCapitalized = /^[A-ZÄÖÜ]/.test(cleanWord);
    const lex = LEXICON[lower];

    if (SUBJUNCTIONS.has(lower)) {
      hasSubjunction = true;
    }

    if (lex) {
      const isModalOrAux =
        lex.pos.includes('Modal') || lex.pos.includes('Auxiliary') || lex.pos.includes('Subjunctive');
      if (isModalOrAux && finiteVerbIndex === -1 && idx <= 2) {
        hasModalOrAux = true;
        finiteVerbIndex = idx;
      } else if (lex.pos.includes('Finite Verb') && finiteVerbIndex === -1 && idx <= 2) {
        finiteVerbIndex = idx;
      }

      if (lower === 'sie' && isCapitalized && idx > 0) {
        tokens.push({
          word: raw,
          cleanWord,
          partOfSpeech: 'Formal Personal Pronoun',
          englishGloss: 'you (formal)',
          caseInfo: 'Nominative or Accusative',
          grammaticalRole: idx === 0 ? 'Subject (likely)' : 'Subject / Object',
          bookRef: { chapterNumber: 3, sectionId: '3.1', label: 'Ch 3.1 Formal Sie (p. 38)' },
          confidence: 'rule-based',
          notes: 'Capitalized "Sie" inside a sentence is always formal "you".',
        });
      } else {
        if (lex.alternatives && lex.alternatives.length > 1) {
          ambiguities.push(`"${cleanWord}" can be: ${lex.alternatives.join(' OR ')}.`);
        }
        tokens.push({
          word: raw,
          cleanWord,
          lemma: lex.lemma,
          partOfSpeech: lex.pos,
          englishGloss: lex.gloss,
          gender: lex.gender,
          caseInfo: lex.caseInfo,
          verbInfo: lex.verbInfo,
          bookRef: { chapterNumber: lex.chapterNumber, sectionId: lex.sectionId, label: lex.label },
          confidence: lex.alternatives ? 'uncertain' : 'rule-based',
          notes: lex.notes,
          alternatives: lex.alternatives,
        });
      }

      addChapterRef(lex.chapterNumber, lex.sectionId, lex.label);
      return;
    }

    // Heuristic 1: Separable prefix at sentence/clause end
    const isClauseEnd = idx === rawWords.length - 1 || /[,.;!?]$/.test(raw);
    if (isClauseEnd && SEPARABLE_PREFIXES.has(lower) && !isCapitalized) {
      endBracketWords.push(cleanWord);
      tokens.push({
        word: raw,
        cleanWord,
        partOfSpeech: 'Separable Verb Prefix',
        englishGloss: `detached prefix "${cleanWord}-"`,
        grammaticalRole: 'End of Verbal Bracket',
        bookRef: { chapterNumber: 7, sectionId: '7.3', label: 'Ch 7.3 Separable Prefixes (pp. 82–86)' },
        confidence: 'rule-based',
        notes: 'In main clauses, separable prefixes jump to the very end of the sentence.',
      });
      addChapterRef(7, '7.3', 'Ch 7.3 Verbs with Prefixes (pp. 82–86)');
      return;
    }

    // Heuristic 2: Past Participle (ge-...-t / ge-...-en / -iert)
    if (
      !isCapitalized &&
      ((lower.startsWith('ge') && (lower.endsWith('t') || lower.endsWith('en')) && lower.length >= 5) ||
        lower.endsWith('iert'))
    ) {
      endBracketWords.push(cleanWord);
      tokens.push({
        word: raw,
        cleanWord,
        partOfSpeech: 'Past Participle (Partizip II)',
        englishGloss: 'past participle form',
        grammaticalRole: 'End of Verbal Bracket',
        verbInfo: lower.endsWith('iert')
          ? '-ieren verb (no ge- prefix, ends in -t)'
          : lower.endsWith('t')
            ? 'Likely weak verb (ge- + stem + -t)'
            : 'Likely strong verb (ge- + stem + -en)',
        bookRef: { chapterNumber: 9, sectionId: '9.2', label: 'Ch 9.2 Partizip II (pp. 99–103)' },
        confidence: 'rule-based',
      });
      addChapterRef(9, '9.2', 'Ch 9.2 Partizip II (pp. 99–103)');
      return;
    }

    // Heuristic 3: Capitalized non-initial word -> German Noun!
    if (isCapitalized && idx > 0) {
      const genderHint = inferNounGenderBySuffix(cleanWord);
      tokens.push({
        word: raw,
        cleanWord,
        partOfSpeech: 'Noun',
        englishGloss: '(capitalized German noun)',
        gender: genderHint ? genderHint.gender : 'unknown',
        bookRef: { chapterNumber: 2, sectionId: '2.1', label: 'Ch 2.1 Nouns & Gender (pp. 21–26)' },
        confidence: genderHint ? 'rule-based' : 'uncertain',
        notes:
          genderHint?.note ||
          'All German nouns are capitalized. Check the preceding article or dictionary for exact gender.',
      });
      addChapterRef(2, '2.1', 'Ch 2.1 Nouns & Gender (pp. 21–26)');
      return;
    }

    // Heuristic 4: Adjective ending before a capitalized noun
    const nextRaw = rawWords[idx + 1] || '';
    const nextClean = nextRaw.replace(/^[„"‚'([]+|[.,!?;:„"‚')\]]+$/g, '');
    if (
      !isCapitalized &&
      /^[A-ZÄÖÜ]/.test(nextClean) &&
      /(e|en|er|es|em)$/.test(lower) &&
      lower.length >= 4
    ) {
      const ending = lower.match(/(en|er|es|em|e)$/)?.[1] || '';
      tokens.push({
        word: raw,
        cleanWord,
        partOfSpeech: 'Attributive Adjective (likely)',
        englishGloss: `adjective before "${nextClean}"`,
        caseInfo: `Ending "-${ending}"`,
        bookRef: { chapterNumber: 4, sectionId: '4.1', label: 'Ch 4.1 Adjective Endings (pp. 52–56)' },
        confidence: 'uncertain',
        notes: 'Stands directly before a noun, so it takes an adjective ending (-e, -en, -er, -es, or -em).',
      });
      addChapterRef(4, '4.1', 'Ch 4.1 Adjective Endings (pp. 52–56)');
      return;
    }

    // Heuristic 5: Infinitive or conjugated verb in position 2 or clause end
    if (!isCapitalized && (idx === 1 || isClauseEnd) && /(en|st|t|e)$/.test(lower) && lower.length >= 4) {
      if (idx === 1 && finiteVerbIndex === -1) finiteVerbIndex = idx;
      if (isClauseEnd && hasModalOrAux && lower.endsWith('en')) endBracketWords.push(cleanWord);
      tokens.push({
        word: raw,
        cleanWord,
        partOfSpeech: isClauseEnd && lower.endsWith('en') ? 'Verb (Infinitive / Final Verb)' : 'Verb (inferred)',
        englishGloss: '(verb form detected by position & ending)',
        verbInfo: lower.endsWith('en')
          ? 'Infinitive or 1st/3rd plural'
          : lower.endsWith('st')
            ? '2nd person singular (du)'
            : lower.endsWith('t')
              ? '3rd sg. (er/sie/es) or 2nd pl. (ihr)'
              : '1st person singular (ich)',
        bookRef: { chapterNumber: 8, sectionId: '8.1', label: 'Ch 8.1 Present Tense (pp. 89–90)' },
        confidence: 'uncertain',
      });
      addChapterRef(8, '8.1', 'Ch 8.1 Present Tense');
      return;
    }

    // Fallback: Honest uncertain token
    ambiguities.push(`"${cleanWord}" is outside the offline A1 dictionary — click "Enhance with AI" for a deeper translation and morphological breakdown.`);
    tokens.push({
      word: raw,
      cleanWord,
      partOfSpeech: isCapitalized ? 'Noun or Sentence-Initial Word' : 'Unclassified Word',
      englishGloss: '(not in local A1 dictionary)',
      confidence: 'uncertain',
      notes: 'Offline rule engine only classifies high-confidence grammar patterns without guessing.',
    });
  });

  // Determine Clause Type & Word Order Pattern (Ch 6)
  const firstClean = tokens[0]?.cleanWord.toLowerCase() || '';
  const endsWithQuestion = sentence.endsWith('?');
  const endsWithExclamation = sentence.endsWith('!');

  let clauseType = 'Main Statement (Aussagesatz)';
  let wordOrderPattern = 'V2 — Conjugated verb in Position 2 (Ch 6, p. 67)';

  if (endsWithQuestion && W_WORDS.has(firstClean)) {
    clauseType = 'W-Question (W-Frage)';
    wordOrderPattern = 'W-Word in Position 1 → Conjugated verb in Position 2 (Ch 6, p. 68)';
    addChapterRef(6, '6', 'Ch 6 Word Order (pp. 67–72)');
  } else if (endsWithQuestion) {
    clauseType = 'Yes/No Question (Ja/Nein-Frage)';
    wordOrderPattern = 'V1 — Conjugated verb in Position 1 (Ch 6, p. 68)';
    addChapterRef(6, '6', 'Ch 6 Word Order (pp. 67–72)');
  } else if (endsWithExclamation && finiteVerbIndex === 0) {
    clauseType = 'Imperative Command / Request (Imperativsatz)';
    wordOrderPattern = 'V1 — Verb in Position 1 (Ch 8.3, pp. 92–94)';
    addChapterRef(8, '8.3', 'Ch 8.3 Imperative (pp. 92–94)');
  } else if (hasSubjunction) {
    clauseType = 'Complex Sentence with Subordinate Clause (Nebensatz)';
    wordOrderPattern = 'Subjunction sends the conjugated verb to the END of the subordinate clause (Ch 6 & 14.2)';
    addChapterRef(14, '14.2', 'Ch 14.2 Subjunktionen (pp. 142–146)');
  } else {
    addChapterRef(6, '6', 'Ch 6 Word Order (pp. 67–72)');
  }

  // Grammar observations
  if (hasSubjunction) {
    grammarNotes.push('A subordinating conjunction (Subjunktion) was detected. Remember: the conjugated verb moves to the very end of that clause.');
  }
  if (endBracketWords.length > 0) {
    grammarNotes.push(`Sentence Bracket (Satzklammer) detected: the closing part (${endBracketWords.join(', ')}) stands at the end of the clause while the conjugated verb stays in Position 2.`);
  }
  const hasDativePrep = tokens.some((t) => t.partOfSpeech === 'Preposition (Dative)');
  const hasAccPrep = tokens.some((t) => t.partOfSpeech === 'Preposition (Accusative)');
  const hasTwoWayPrep = tokens.some((t) => t.partOfSpeech === 'Two-Way Preposition');
  if (hasDativePrep) grammarNotes.push('Contains a Dative preposition (Ch 13.2): the following noun phrase must be in the Dative case.');
  if (hasAccPrep) grammarNotes.push('Contains an Accusative preposition (Ch 13.1): the following noun phrase must be in the Accusative case.');
  if (hasTwoWayPrep) grammarNotes.push('Contains a Two-Way Preposition (Wechselpräposition, Ch 13.3): check whether the verb shows movement/direction (Wohin? → Accusative) or static position (Wo? → Dative).');

  // Build sentence bracket display
  const pos1 = tokens[0]?.cleanWord || '—';
  const finiteV = finiteVerbIndex >= 0 ? tokens[finiteVerbIndex]?.cleanWord : tokens[1]?.cleanWord || '—';
  const endB = endBracketWords.length > 0 ? endBracketWords.join(' ') : '—';
  const middleTokens = tokens
    .filter((_, i) => i !== 0 && i !== (finiteVerbIndex >= 0 ? finiteVerbIndex : 1))
    .filter((t) => !endBracketWords.includes(t.cleanWord))
    .map((t) => t.cleanWord);

  return {
    sentence,
    englishTranslation:
      'Local rule-based gloss (word-by-word above). Click "Enhance with AI" for a full natural English translation.',
    wordOrderPattern,
    clauseType,
    sentenceBracket: {
      position1: pos1,
      finiteVerb: finiteV,
      middleField: middleTokens.length > 0 ? middleTokens.join(' ') : '—',
      endBracket: endB,
    },
    tokens,
    grammarNotes:
      grammarNotes.length > 0
        ? grammarNotes
        : ['Main clause structure: keep the conjugated verb strictly in Position 2 (Ch 6, p. 67).'],
    relatedChapters: Array.from(relatedMap.values()),
    ambiguities,
    source: 'rule-based',
  };
}

export async function analyzeGermanSentenceWithAI(sentence: string): Promise<SentenceAnalysisResult> {
  const resp = await fetch('/api/analyze-sentence', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sentence }),
  });

  if (!resp.ok) {
    let errMsg = 'AI sentence enhancement is unavailable on this host.';
    try {
      const data = await resp.json();
      if (data?.error) errMsg = data.error;
    } catch {
      // Static host (e.g. GitHub Pages) returns 404 HTML
      errMsg = 'AI enhancement requires the Express backend server. Offline rule-based analysis remains fully available.';
    }
    throw new Error(errMsg);
  }

  const data = await resp.json();
  const tokens: AnalyzedToken[] = (data.tokens || []).map((t: Record<string, unknown>) => ({
    word: String(t.word || ''),
    cleanWord: String(t.word || '').replace(/^[„"‚'([]+|[.,!?;:„"‚')\]]+$/g, ''),
    lemma: t.lemma ? String(t.lemma) : undefined,
    partOfSpeech: String(t.partOfSpeech || 'Word'),
    englishGloss: String(t.englishGloss || ''),
    gender: (t.gender as AnalyzedToken['gender']) || undefined,
    caseInfo: t.caseInfo ? String(t.caseInfo) : undefined,
    grammaticalRole: t.grammaticalRole ? String(t.grammaticalRole) : undefined,
    verbInfo: t.verbInfo ? String(t.verbInfo) : undefined,
    bookRef:
      typeof t.chapterNumber === 'number' && t.chapterNumber >= 1 && t.chapterNumber <= 15
        ? {
            chapterNumber: t.chapterNumber,
            sectionId: String(t.sectionId || `${t.chapterNumber}`),
            label: `Ch ${t.chapterNumber}${t.sectionId ? ` (${t.sectionId})` : ''}`,
          }
        : undefined,
    confidence: Array.isArray(t.alternatives) && t.alternatives.length > 0 ? 'uncertain' : 'ai-generated',
    notes: t.notes ? String(t.notes) : undefined,
    alternatives: Array.isArray(t.alternatives) ? t.alternatives.map(String) : undefined,
  }));

  const relatedChapters: { chapterNumber: number; sectionId: string; title: string }[] = [];
  const seen = new Set<string>();
  for (const tok of tokens) {
    if (tok.bookRef && !seen.has(tok.bookRef.sectionId)) {
      seen.add(tok.bookRef.sectionId);
      relatedChapters.push({
        chapterNumber: tok.bookRef.chapterNumber,
        sectionId: tok.bookRef.sectionId,
        title: tok.bookRef.label,
      });
    }
  }

  return {
    sentence: String(data.sentence || sentence),
    englishTranslation: String(data.englishTranslation || ''),
    wordOrderPattern: String(data.wordOrderPattern || ''),
    clauseType: String(data.clauseType || ''),
    sentenceBracket: data.sentenceBracket,
    tokens,
    grammarNotes: Array.isArray(data.grammarNotes) ? data.grammarNotes.map(String) : [],
    relatedChapters,
    ambiguities: Array.isArray(data.ambiguities) ? data.ambiguities.map(String) : [],
    source: 'ai-generated',
  };
}
