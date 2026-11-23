import DOMPurify from 'dompurify';
import JSZip from 'jszip';
import type { ImportedBookAsset, StoredBookPackage } from '../types/grammar';

export const APPENDIX_PDF_URL =
  './assets/aistudio/German_Grammar_in_a_Nutshell__D_-_kurz_und_schmeralos___Christine_e31092ac.pdf';

export interface ParsedBookPage {
  anchorId: string;
  pageNumber: number;
  chapterNumber: number;
  html: string;
  plainText: string;
  missingImages: string[];
}

export interface ParsedBookDocument {
  title: string;
  sourceName: string;
  isCustomImport: boolean;
  pages: ParsedBookPage[];
  missingImageRefs: string[];
  totalPages: number;
}

/**
 * Maps authentic printed page numbers (1–197) from
 * "German Grammar in a Nutshell" (Langenscheidt) to its 15 chapters + Front Matter + Appendix.
 */
export function inferChapterFromPage(pageNum: number): number {
  if (pageNum <= 11) return 0; // Front matter, Contents & Preface (pp. 1–11)
  if (pageNum <= 20) return 1; // 1 Artikel (pp. 12–20)
  if (pageNum <= 35) return 2; // 2 Substantive (pp. 21–35)
  if (pageNum <= 50) return 3; // 3 Pronomen (pp. 36–50)
  if (pageNum <= 59) return 4; // 4 Adjektive (pp. 51–59)
  if (pageNum <= 66) return 5; // 5 Adverbien & Modalpartikel (pp. 60–66)
  if (pageNum <= 72) return 6; // 6 Wortstellung (pp. 67–72)
  if (pageNum <= 88) return 7; // 7 Verben (pp. 73–88)
  if (pageNum <= 94) return 8; // 8 Präsens & Imperativ (pp. 89–94)
  if (pageNum <= 108) return 9; // 9 Vergangenheit (pp. 95–108)
  if (pageNum <= 112) return 10; // 10 Futur (pp. 109–112)
  if (pageNum <= 120) return 11; // 11 Konjunktiv (pp. 113–120)
  if (pageNum <= 131) return 12; // 12 Passiv (pp. 121–131)
  if (pageNum <= 139) return 13; // 13 Präpositionen (pp. 132–139)
  if (pageNum <= 156) return 14; // 14 Satzverbindungen (pp. 140–156)
  if (pageNum <= 164) return 15; // 15 Wortbildung (pp. 157–164)
  return 16; // Appendix: Verbs, Glossary, Answer Keys & Indexes (pp. 165–197)
}

/**
 * Verified mapping of image references found in the Calibre HTML export of
 * "German Grammar in a Nutshell" (mostly small chapter cartoons & publisher cover graphics).
 */
const KNOWN_ILLUSTRATION_CAPTIONS: Record<string, string> = {
  'images/000010.jpg': 'Chapter 1 Cartoon — Der Mann, das Kind, die Frau (p. 12)',
  'images/000014.jpg': 'Chapter 1.1 Cartoon — Suitcase / Der Koffer (p. 13)',
  'images/000031.jpg': 'Chapter 2 Cartoon — Substantive / Nouns (p. 21)',
  'images/000032.jpg': 'Chapter 2 Cartoon — Nouns & Articles (p. 26)',
  'images/000034.jpg': 'Chapter 3 Cartoon — Pronomen / Pronouns (p. 36)',
  'images/000035.jpg': 'Chapter 3 Cartoon — Indefinite Pronouns (p. 48)',
  'images/000036.jpg': 'Chapter 4 Cartoon — Adjektive / Adjectives (p. 51)',
  'images/000037.jpg': 'Chapter 5 Cartoon — Adverbien & Modalpartikel (p. 60)',
  'images/000038.jpg': 'TeKaMoLo Mnemonic Cartoon — Tea-drinking CaMeL (p. 63)',
  'images/000039.jpg': 'Chapter 6 Cartoon — Wortstellung / Word Order (p. 67)',
  'images/000040.jpg': 'Chapter 7 Cartoon — Verben / Verbs (p. 73)',
  'images/000041.jpg': 'Chapter 7 Cartoon — Present vs. Progressive Note (p. 77)',
  'images/000042.jpg': 'Chapter 8 Cartoon — Präsens & Imperativ (p. 89)',
  'images/000043.jpg': 'Chapter 9 Cartoon — Vergangenheit / Past Tenses (p. 95)',
  'images/000001.jpg': 'Chapter 9.3 Cartoon — Perfekt (p. 104)',
  'images/000002.jpg': 'Chapter 10 Cartoon — Futur / Future Tense (p. 109)',
  'images/000003.jpg': 'Chapter 11 Cartoon — Konjunktiv / Subjunctive (p. 113)',
  'images/000004.jpg': 'Chapter 12 Cartoon — Passiv / Passive (p. 121)',
  'images/000005.jpg': 'Chapter 12.2 Cartoon — Passive Alternatives (p. 129)',
  'images/000006.jpg': 'Chapter 13 Cartoon — Präpositionen / Prepositions (p. 132)',
  'images/000007.jpg': 'Two-Way Prepositions Illustration Part 1 — Felix & the Ball (p. 136)',
  'images/000008.jpg': 'Two-Way Prepositions Illustration Part 2 — Felix & the Ball (p. 136)',
  'images/000009.jpg': 'Two-Way Prepositions Illustration Part 3 — Felix & the Ball (p. 136)',
  'images/000011.jpg': 'Chapter 14 Cartoon — Satzverbindungen / Sentence-Linkers (p. 140)',
  'images/000012.jpg': 'Chapter 14.3 Cartoon — Relative Clauses (p. 147)',
  'images/000013.jpg': 'Chapter 14.3 Illustration — Inserted Relative Clause (p. 148)',
  'images/000015.jpg': 'Chapter 15 Cartoon — Wortbildung / Word Formation (p. 157)',
};

// Decorative cover badges and back-cover publisher ads that do not carry grammar content
const DECORATIVE_COVER_IMAGES = new Set([
  'images/000020.jpg',
  'images/000021.jpg',
  'images/000022.jpg',
  'images/000023.jpg',
  'images/000024.jpg',
  'images/000025.jpg',
  'images/000033.jpg',
  'images/000016.jpg',
  'images/000017.jpg',
  'images/000018.jpg',
  'images/000019.jpg',
  'images/000026.jpg',
  'images/000027.jpg',
  'images/000028.jpg',
  'images/000029.jpg',
  'images/000030.jpg',
]);

function normalizeAssetPath(rawPath: string): string {
  return rawPath.replace(/^\.?\//, '').replace(/\\/g, '/').trim();
}

export function sanitizeTextbookHtml(rawHtml: string): string {
  return DOMPurify.sanitize(rawHtml, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: [
      'script',
      'iframe',
      'object',
      'embed',
      'form',
      'input',
      'textarea',
      'style',
      'link',
      'meta',
      'base',
    ],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'style'],
    ALLOW_DATA_ATTR: true,
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Converts Calibre anchor numbers (`calibre_link-N`) in the supplied Langenscheidt HTML
 * to their verified printed book page numbers (`calibre_link-11` = p. 10 Vorwort,
 * `calibre_link-13` = p. 12 Ch 1, `calibre_link-166` = p. 165 Appendix, `calibre_link-184` = p. 183 Key).
 */
function calibreLinkToPrintedPage(linkNum: number, hasKnownCalibreStructure: boolean): number {
  if (!hasKnownCalibreStructure) return linkNum;
  if (linkNum >= 11 && linkNum <= 198) return linkNum - 1;
  return linkNum;
}

/**
 * Parses an HTML textbook document (either the preloaded Langenscheidt HTML
 * or a user-imported HTML/ZIP bundle), unwraps Calibre container divs so all
 * 200 pages split accurately by chapter, resolves embedded assets, replaces
 * missing chapter cartoons with quiet captions, and marks German phrases clickable.
 */
export function parseBookHtmlDocument(
  htmlString: string,
  assets: ImportedBookAsset[],
  meta: { title: string; sourceName: string; isCustomImport: boolean }
): ParsedBookDocument {
  const assetMap = new Map<string, string>();
  for (const asset of assets) {
    const norm = normalizeAssetPath(asset.path);
    assetMap.set(norm, asset.dataUrl);
    const basename = norm.split('/').pop();
    if (basename && !assetMap.has(basename)) {
      assetMap.set(basename, asset.dataUrl);
    }
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');
  const body = doc.body;

  // Remove dangerous elements before DOM processing
  body.querySelectorAll('script, iframe, object, embed, style, link').forEach((el) => el.remove());

  const missingSet = new Set<string>();

  // Resolve images or build quiet, unobtrusive captions for missing cartoons
  body.querySelectorAll('img').forEach((img) => {
    const rawSrc = img.getAttribute('src') || '';
    const normSrc = normalizeAssetPath(rawSrc);
    const basename = normSrc.split('/').pop() || normSrc;
    const resolved = assetMap.get(normSrc) || assetMap.get(basename);

    if (resolved) {
      img.setAttribute('src', resolved);
      img.setAttribute('loading', 'lazy');
      img.setAttribute('class', 'my-4 max-w-full rounded-lg border border-slate-200 dark:border-slate-700');
    } else if (rawSrc && !rawSrc.startsWith('data:image/')) {
      if (DECORATIVE_COVER_IMAGES.has(normSrc)) {
        // Quietly remove purely decorative cover/ad graphics when unbundled
        img.remove();
        return;
      }
      missingSet.add(normSrc || rawSrc);
      const caption =
        KNOWN_ILLUSTRATION_CAPTIONS[normSrc] ||
        `Original book cartoon (${normSrc || 'image'})`;
      const placeholder = doc.createElement('div');
      placeholder.setAttribute('class', 'tb-missing-image');
      placeholder.setAttribute('data-missing-src', normSrc);
      placeholder.innerHTML = `<div class="my-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/50 px-3.5 py-2 text-xs text-slate-500 dark:text-slate-400 italic">${escapeHtml(caption)}</div>`;
      img.replaceWith(placeholder);
    }
  });

  // Clean links so internal cross-references work inside the SPA
  body.querySelectorAll('a').forEach((a) => {
    const href = a.getAttribute('href') || '';
    if (href.startsWith('#')) {
      a.setAttribute('data-internal-anchor', href.slice(1));
      a.removeAttribute('href');
      a.setAttribute('class', 'text-sky-700 dark:text-sky-400 underline cursor-pointer');
    } else if (/^https?:\/\//i.test(href)) {
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
    } else {
      a.removeAttribute('href');
    }
  });

  // Mark bold German example spans as interactive clickable phrases
  body.querySelectorAll('b, strong').forEach((el) => {
    const txt = (el.textContent || '').trim();
    if (txt.length >= 3 && txt.length <= 140 && /[a-zA-ZäöüÄÖÜß]/.test(txt)) {
      if (!/^\d+(\.\d+)?$/.test(txt)) {
        el.setAttribute('data-german-phrase', txt);
        el.setAttribute('class', `${el.getAttribute('class') || ''} tb-german-clickable`.trim());
        el.setAttribute('title', 'Click to inspect grammar & hear German pronunciation');
      }
    }
  });

  // CRITICAL FIX: Unwrap single-child container divs (such as Calibre's <div class="calibre" id="calibre_link-0">)
  // so sibling page markers (<p id="calibre_link-1">, <p id="calibre_link-2">, ...) are iterated directly!
  let container: Element = body;
  while (
    container.children.length === 1 &&
    container.firstElementChild &&
    container.firstElementChild.tagName === 'DIV'
  ) {
    container = container.firstElementChild;
  }

  const calibreAnchors = Array.from(container.querySelectorAll('[id^="calibre_link-"]'));
  const hasKnownCalibreStructure = calibreAnchors.length > 150;
  const pages: ParsedBookPage[] = [];

  if (calibreAnchors.length > 5) {
    const topNodes = Array.from(container.children);
    let currentAnchor = 'calibre_link-1';
    let currentPageNum = 1;
    let bucketHtml: string[] = [];
    let bucketText: string[] = [];
    let bucketMissing: string[] = [];

    const flushBucket = () => {
      if (bucketHtml.length === 0) return;
      const joined = sanitizeTextbookHtml(bucketHtml.join('\n'));
      const plain = bucketText.join(' ').replace(/\s+/g, ' ').trim();
      if (plain.length > 0 || joined.includes('tb-missing-image') || joined.includes('<img')) {
        pages.push({
          anchorId: currentAnchor,
          pageNumber: currentPageNum,
          chapterNumber: inferChapterFromPage(currentPageNum),
          html: joined,
          plainText: plain,
          missingImages: [...bucketMissing],
        });
      }
      bucketHtml = [];
      bucketText = [];
      bucketMissing = [];
    };

    for (const node of topNodes) {
      const idAttr = node.getAttribute('id') || '';
      const match = idAttr.match(/^calibre_link-(\d+)$/);
      const innerAnchor = !match ? node.querySelector('[id^="calibre_link-"]') : null;
      const innerMatch = innerAnchor?.getAttribute('id')?.match(/^calibre_link-(\d+)$/);

      if (match) {
        flushBucket();
        currentAnchor = idAttr;
        currentPageNum = calibreLinkToPrintedPage(parseInt(match[1], 10), hasKnownCalibreStructure);
      } else if (innerMatch && bucketHtml.length > 0) {
        flushBucket();
        currentAnchor = innerAnchor!.getAttribute('id')!;
        currentPageNum = calibreLinkToPrintedPage(parseInt(innerMatch[1], 10), hasKnownCalibreStructure);
      }

      node.querySelectorAll('[data-missing-src]').forEach((m) => {
        const src = m.getAttribute('data-missing-src');
        if (src) bucketMissing.push(src);
      });

      bucketHtml.push(node.outerHTML);
      bucketText.push(node.textContent || '');
    }
    flushBucket();
  } else {
    // Generic HTML textbook import
    const sanitized = sanitizeTextbookHtml(container.innerHTML);
    pages.push({
      anchorId: 'imported-page-1',
      pageNumber: 1,
      chapterNumber: 1,
      html: sanitized,
      plainText: (container.textContent || '').replace(/\s+/g, ' ').trim(),
      missingImages: Array.from(missingSet),
    });
  }

  return {
    title: meta.title,
    sourceName: meta.sourceName,
    isCustomImport: meta.isCustomImport,
    pages,
    missingImageRefs: Array.from(missingSet),
    totalPages: pages.length,
  };
}

/**
 * Loads the pre-supplied Langenscheidt HTML book from public/assets/aistudio/
 * if available (tries both relative and root paths and guards against SPA fallback HTML).
 */
export async function loadPreloadedBookPackage(): Promise<StoredBookPackage | null> {
  const candidateUrls = [
    './assets/aistudio/index_c68e1c20.html',
    '/assets/aistudio/index_c68e1c20.html',
  ];

  let htmlText = '';
  for (const url of candidateUrls) {
    try {
      const resp = await fetch(url);
      if (!resp.ok) continue;
      const text = await resp.text();
      // Guard against Vite/PWA SPA fallback returning the React index.html shell
      if (text.length > 5000 && !text.includes('<div id="root"></div>')) {
        htmlText = text;
        break;
      }
    } catch {
      // Try next candidate
    }
  }

  if (!htmlText) return null;

  let cssText = '';
  try {
    const cssResp = await fetch('./assets/aistudio/style_f6c433ea.css');
    if (cssResp.ok) {
      const t = await cssResp.text();
      if (!t.includes('<div id="root"></div>')) cssText = t;
    }
  } catch {
    // Optional CSS
  }

  return {
    id: 'active-book',
    title: 'German Grammar in a Nutshell (Langenscheidt)',
    sourceName: 'Supplied index.html + style.css + Appendix PDF (pp. 163–195)',
    importedAt: Date.now(),
    htmlFiles: [{ name: 'index.html', content: htmlText }],
    cssContent: cssText,
    assets: [],
    missingImageRefs: [],
    isCustomImport: false,
  };
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function guessMimeFromExt(name: string): string {
  const ext = name.toLowerCase().split('.').pop() || '';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'png') return 'image/png';
  if (ext === 'gif') return 'image/gif';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'svg') return 'image/svg+xml';
  return 'application/octet-stream';
}

/**
 * Imports user-supplied HTML, CSS, Image files, or a complete ZIP archive
 * into a StoredBookPackage ready for IndexedDB persistence.
 */
export async function importTextbookFiles(
  files: FileList | File[],
  existingPackage: StoredBookPackage | null
): Promise<StoredBookPackage> {
  const fileArray = Array.from(files);
  const htmlFiles: { name: string; content: string }[] = [];
  let cssContent = existingPackage?.cssContent || '';
  const assetMap = new Map<string, ImportedBookAsset>();

  for (const existingAsset of existingPackage?.assets || []) {
    assetMap.set(normalizeAssetPath(existingAsset.path), existingAsset);
  }

  for (const file of fileArray) {
    const lowerName = file.name.toLowerCase();
    if (lowerName.endsWith('.zip')) {
      const zip = await JSZip.loadAsync(file);
      const entries = Object.values(zip.files);
      for (const entry of entries) {
        if (entry.dir) continue;
        const entryName = normalizeAssetPath(entry.name);
        const lowerEntry = entryName.toLowerCase();
        if (lowerEntry.startsWith('__macosx/')) continue;

        if (lowerEntry.endsWith('.html') || lowerEntry.endsWith('.htm') || lowerEntry.endsWith('.xhtml')) {
          const text = await entry.async('text');
          htmlFiles.push({ name: entryName, content: text });
        } else if (lowerEntry.endsWith('.css')) {
          const css = await entry.async('text');
          cssContent = `${cssContent}\n${css}`.trim();
        } else if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(lowerEntry)) {
          const b64 = await entry.async('base64');
          const mime = guessMimeFromExt(entryName);
          assetMap.set(entryName, {
            path: entryName,
            mimeType: mime,
            dataUrl: `data:${mime};base64,${b64}`,
          });
        }
      }
    } else if (lowerName.endsWith('.html') || lowerName.endsWith('.htm') || lowerName.endsWith('.xhtml')) {
      const text = await readFileAsText(file);
      htmlFiles.push({ name: file.name, content: text });
    } else if (lowerName.endsWith('.css')) {
      const css = await readFileAsText(file);
      cssContent = `${cssContent}\n${css}`.trim();
    } else if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(lowerName)) {
      const dataUrl = await readFileAsDataUrl(file);
      const relPath =
        'webkitRelativePath' in file && (file as File & { webkitRelativePath?: string }).webkitRelativePath
          ? normalizeAssetPath((file as File & { webkitRelativePath: string }).webkitRelativePath)
          : `images/${file.name}`;
      assetMap.set(relPath, {
        path: relPath,
        mimeType: file.type || guessMimeFromExt(file.name),
        dataUrl,
      });
    }
  }

  const finalHtmlFiles =
    htmlFiles.length > 0 ? htmlFiles : existingPackage?.htmlFiles || [];

  if (finalHtmlFiles.length === 0) {
    throw new Error(
      'No HTML textbook file found. Please upload an .html file or a .zip archive containing the textbook HTML (plus optional CSS and images).'
    );
  }

  const assets = Array.from(assetMap.values());
  const combinedHtml = finalHtmlFiles.map((f) => f.content).join('\n');
  const parsedCheck = parseBookHtmlDocument(combinedHtml, assets, {
    title: 'Imported German Grammar Textbook',
    sourceName: fileArray.map((f) => f.name).join(', '),
    isCustomImport: true,
  });

  return {
    id: 'active-book',
    title:
      htmlFiles.length === 0 && existingPackage
        ? existingPackage.title
        : 'German Grammar in a Nutshell (Imported)',
    sourceName:
      htmlFiles.length === 0 && existingPackage
        ? `${existingPackage.sourceName} + ${fileArray.length} image(s)`
        : fileArray.map((f) => f.name).join(', '),
    importedAt: Date.now(),
    htmlFiles: finalHtmlFiles,
    cssContent,
    assets,
    missingImageRefs: parsedCheck.missingImageRefs,
    isCustomImport: true,
  };
}
