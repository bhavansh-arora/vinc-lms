// Checks Hindi content files against their English originals: same structure, same ids, numbers
// and lab logic; only display text may differ.
//   node scripts/check-hindi-data.mjs                 (all files that have a Hindi version)
//   node scripts/check-hindi-data.mjs g6p1 grade6     (only these)
// Prints problems and a count of English strings left untranslated. Exit code 1 on any problem.
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// Fields that hold code values (ids, references, expressions, colours) and must not change.
const FROZEN = new Set(['amount', 'anim', 'answer', 'art', 'bin', 'board', 'bookUrl', 'canvas', 'check', 'collect', 'color', 'colorNear',
  'container', 'dir', 'emoji', 'fix', 'form', 'FORM', 'icon', 'id', 'key', 'kind', 'medium', 'meter', 'mode', 'needs', 'next', 'output',
  'palette', 'parts', 'place', 'plant', 'preset', 'rule', 'scene', 'sprite', 'start', 'texture', 'tint', 'to', 'tool', 'truth', 'type',
  'vessel', 'who', 'lo', 'pages']);
const looksLikeCode = s => /^[a-z][\w-]*$/.test(s) || /^#[0-9a-f]{3,8}$/i.test(s) || /^https?:/.test(s) || /^[\p{Extended_Pictographic}‍️\s]+$/u.test(s);
const hasLatinWords = s => /[A-Za-z]{3,}/.test(s.replace(/VINC Lab|Kaushal Bodh|NCERT|CBSE|Scratch|Arduino|LED|QR|AI|UPI|URL|https?:\S+/g, ''));

const pairs = [];
const want = process.argv.slice(2);
for (const n of [6, 7, 8]) pairs.push([`grade${n}`, `assets/js/data/grade${n}.js`, `assets/js/data/hi/grade${n}.js`]);
for (const g of [6, 7, 8]) for (let p = 1; p <= 6; p++) pairs.push([`g${g}p${p}`, `assets/js/data/lessons/g${g}p${p}.js`, `assets/js/data/lessons/hi/g${g}p${p}.js`]);

let problems = 0;
for (const [name, en, hi] of pairs) {
  if (want.length && !want.includes(name)) continue;
  if (!existsSync(resolve(ROOT, hi))) { if (want.length) { console.log(`${name}: no Hindi file (${hi})`); problems++; } continue; }
  let E, H;
  try { E = await import(resolve(ROOT, en)); H = await import(resolve(ROOT, hi)); }
  catch (e) { console.log(`${name}: cannot load: ${e.message}`); problems++; continue; }
  const out = [];
  let strings = 0, same = 0;
  const sameList = [];
  const walk = (e, h, path, key) => {
    if (out.length > 40) return;
    if (Array.isArray(e)) {
      if (!Array.isArray(h)) return out.push(`${path}: should be a list`);
      if (e.length !== h.length) return out.push(`${path}: ${h.length} items, English has ${e.length}`);
      return e.forEach((x, i) => walk(x, h[i], `${path}[${i}]`, key));
    }
    if (e && typeof e === 'object') {
      if (!h || typeof h !== 'object' || Array.isArray(h)) return out.push(`${path}: should be an object`);
      const ek = Object.keys(e), hk = Object.keys(h);
      for (const k of ek) if (!(k in h)) out.push(`${path}.${k}: missing`);
      for (const k of hk) if (!(k in e)) out.push(`${path}.${k}: not in English (keys must not be translated)`);
      return ek.forEach(k => k in h && walk(e[k], h[k], `${path}.${k}`, k));
    }
    if (typeof e === 'string') {
      if (typeof h !== 'string') return out.push(`${path}: should be text`);
      if (FROZEN.has(key) || looksLikeCode(e)) { if (e !== h) out.push(`${path}: must stay "${e}" (code value), found "${h}"`); return; }
      strings++;
      if (e === h && hasLatinWords(e)) { same++; if (sameList.length < 8) sameList.push(`${path}: "${e.slice(0, 60)}"`); }
      return;
    }
    if (e !== h) out.push(`${path}: must stay ${JSON.stringify(e)}, found ${JSON.stringify(h)}`);
  };
  for (const k of Object.keys(E)) { if (!(k in H)) out.push(`export ${k}: missing`); else walk(E[k], H[k], k, k); }
  for (const k of Object.keys(H)) if (!(k in E)) out.push(`export ${k}: not in English`);
  problems += out.length;
  console.log(`${name}: ${out.length ? `${out.length} problem(s)` : 'structure OK'}; ${strings} text strings, ${same} still in English`);
  for (const l of out.slice(0, 40)) console.log('   ✗ ' + l);
  for (const l of sameList) console.log('   · untranslated ' + l);
}
process.exit(problems ? 1 : 0);
