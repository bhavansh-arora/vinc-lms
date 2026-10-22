// Language: English (default) or Hindi. People pick it with the language button; the choice is
// remembered in this browser. Switching reloads the page in the other language.
//
//   t('Log in')                        -> 'लॉग इन' in Hindi, 'Log in' in English
//   t('{n} students', { n: 5 })        -> '5 विद्यार्थी'
//   tx(serverMessage)                  -> like t(), and also tries the patterns (messages with names in them)
//
// English text is the key. Hindi text lives in assets/js/i18n/hi/*.js and is loaded only in Hindi
// (this module waits for it, so modules that import t() can use it straight away).
const KEY = 'vinclab:lang';
export const LANGS = { en: 'English', hi: 'हिंदी' };

let L = 'en';
try {
  const q = new URLSearchParams(location.search).get('lang');
  if (q && q in LANGS) localStorage.setItem(KEY, q);
  const v = localStorage.getItem(KEY);
  if (v && v in LANGS) L = v;
} catch { /* storage blocked: English */ }

let DICT = {}, PATTERNS = [];
if (L === 'hi') {
  try { const m = await import('./i18n/hi/index.js'); DICT = m.strings; PATTERNS = m.patterns; }
  catch (e) { console.error('Hindi text could not be loaded; showing English.', e); }
}
try { document.documentElement.lang = L === 'hi' ? 'hi' : 'en-IN'; document.documentElement.dataset.lang = L; } catch { /* no DOM */ }

export const lang = () => L;
export const isHi = () => L === 'hi';
// Locale for dates and numbers (digits stay 0–9 in both).
export const locale = () => (L === 'hi' ? 'hi-IN' : 'en-IN');

// Text that has no Hindi yet (shown in English). Tests read this.
export const missing = new Set();
try { window.__i18nMissing = missing; } catch { /* no window */ }

const fill = (s, vars) => (vars ? s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : s);

export function t(s, vars) {
  if (L === 'hi' && s) {
    const h = DICT[s];
    if (h != null) return fill(h, vars);
    missing.add(s);
  }
  return fill(s, vars);
}

// For text made elsewhere (server messages, saved activity-feed lines): exact match first, then
// patterns such as [/^(.+) is already linked to your account\.$/, '$1 पहले से आपके खाते से जुड़ा है।'].
export function tx(s) {
  if (L !== 'hi' || !s) return s;
  if (DICT[s] != null) return DICT[s];
  for (const [re, out] of PATTERNS) if (re.test(s)) return s.replace(re, (...m) => out.replace(/\$(\d)/g, (_, i) => { const v = m[+i] ?? ''; return DICT[v] ?? v; }));
  missing.add(s);
  return s;
}

export function setLang(l) {
  if (!(l in LANGS) || l === L) return;
  try { localStorage.setItem(KEY, l); } catch { /* ignore */ }
  location.reload();
}

// The language button: shows the other language's name; a click switches to it.
export function langButton(cls = '') {
  const other = L === 'hi' ? 'en' : 'hi';
  return `<button type="button" class="lang-btn ${cls}" data-lang-switch="${other}" lang="${other === 'hi' ? 'hi' : 'en'}" aria-label="${other === 'hi' ? 'हिंदी में देखें (View in Hindi)' : 'View in English (अंग्रेज़ी में देखें)'}"><span class="lang-ic" aria-hidden="true">अ/A</span><span class="lang-name">${LANGS[other]}</span></button>`;
}
// One listener for every language button on the page, wherever it was drawn.
try {
  document.addEventListener('click', e => {
    const b = e.target.closest?.('[data-lang-switch]');
    if (b) { e.preventDefault(); setLang(b.dataset.langSwitch); }
  });
} catch { /* no DOM */ }
