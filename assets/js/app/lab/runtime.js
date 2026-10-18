// VINC Lab virtual labs: the full-screen player every simulator runs inside.
// A lab type is a module in ./types/<type>.js exporting { meta, mount(stage, cfg, api), demo }.
// See ./SPEC.md for the contract and every type's config.
import { sprite, hasSprite } from './sprites.js';

const VENDOR = new URL('../../../vendor/', import.meta.url).href;
const CSS_DIR = new URL('../../../css/lab/', import.meta.url).href;
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const MUTE_KEY = 'vinclab:lab-mute';

/* ---------- Library loading (only when a lab opens) ---------- */
const loaded = {};
function script(src) {
  return loaded[src] ||= new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src; s.async = true;
    s.onload = res; s.onerror = () => { delete loaded[src]; rej(new Error(`Could not load ${src}`)); };
    document.head.append(s);
  });
}
function stylesheet(href) {
  return loaded[href] ||= new Promise(res => {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = href;
    l.onload = res; l.onerror = res; // a type may have no stylesheet
    document.head.append(l);
  });
}
const GSAP_PLUGINS = ['Draggable', 'InertiaPlugin', 'MotionPathPlugin', 'DrawSVGPlugin', 'MorphSVGPlugin', 'Physics2DPlugin', 'CustomEase'];
export async function loadGsap() {
  await script(`${VENDOR}gsap/gsap.min.js`);
  await Promise.all(GSAP_PLUGINS.map(n => script(`${VENDOR}gsap/${n}.min.js`)));
  const g = window.gsap;
  g.registerPlugin(...GSAP_PLUGINS.map(n => window[n]).filter(Boolean));
  if (REDUCED) g.globalTimeline.timeScale(4);
  return g;
}
export async function loadMatter() { await script(`${VENDOR}matter.min.js`); return window.Matter; }

/* ---------- Sound: tiny synthesised effects, no audio files ---------- */
let actx = null;
let muted = (() => { try { return localStorage.getItem(MUTE_KEY) === '1'; } catch { return false; } })();
const TONES = {
  click: [[660, .05, 'triangle', .05]],
  pop: [[520, .06, 'sine', .08], [880, .08, 'sine', .06]],
  good: [[660, .08, 'sine', .08], [990, .12, 'sine', .07]],
  bad: [[220, .12, 'sawtooth', .04], [180, .14, 'sawtooth', .035]],
  whoosh: [[300, .18, 'triangle', .04]],
  drop: [[400, .05, 'sine', .07]],
  win: [[523, .1, 'sine', .08], [659, .1, 'sine', .08], [784, .12, 'sine', .08], [1047, .25, 'sine', .08]],
  tick: [[1200, .03, 'square', .02]],
};
export function sound(kind = 'click') {
  if (muted || !TONES[kind]) return;
  try {
    actx ||= new (window.AudioContext || window.webkitAudioContext)();
    let t = actx.currentTime;
    for (const [f, d, type, vol] of TONES[kind]) {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t);
      if (kind === 'whoosh') o.frequency.exponentialRampToValueAtTime(900, t + d);
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
      o.connect(g).connect(actx.destination); o.start(t); o.stop(t + d + .02);
      t += d * .8;
    }
  } catch { /* audio not available */ }
}

/* ---------- The player ---------- */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.9 6 6.5.8-4.8 4.5 1.2 6.5L12 17.3l-5.8 3.1 1.2-6.5L2.6 9.4l6.5-.8z"/></svg>';

/**
 * Open a lab full screen.
 * @param {object} cfg   lab config (see SPEC.md); cfg.type picks the engine
 * @param {object} opts  { form: 'life'|'machines'|'services', label: 'Activity 3', best: 0..3,
 *                         onComplete({stars, score}), onPortfolio(dataUrl, title) }
 * @returns {Promise<{stars:number, score:number}|null>} resolves when the lab is closed
 */
export function openLab(cfg, opts = {}) {
  return new Promise(resolve => {
    let result = null;
    const d = document.createElement('dialog');
    d.className = `lab f-${opts.form || 'life'}`;
    d.setAttribute('aria-label', `Virtual lab: ${cfg.title || ''}`);
    d.innerHTML = `
      <header class="lab-top">
        <button class="lab-btn lab-x" type="button" aria-label="Close the lab">${ico('close')}</button>
        <div class="lab-ttl"><small>${esc(opts.label || 'Virtual lab')}</small><b>${esc(cfg.title || 'Virtual lab')}</b></div>
        <div class="lab-prog" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i></i></div>
        <div class="lab-stars" aria-label="Best: ${opts.best || 0} of 3 stars">${[1, 2, 3].map(i => `<span class="${i <= (opts.best || 0) ? 'on' : ''}">${STAR}</span>`).join('')}</div>
        <button class="lab-btn lab-snd" type="button" aria-pressed="${!muted}" aria-label="Sound">${ico(muted ? 'mute' : 'sound')}</button>
        <button class="lab-btn lab-re" type="button" aria-label="Start again">${ico('restart')}</button>
      </header>
      <div class="lab-body">
        <div class="lab-stage" tabindex="-1"></div>
        <div class="lab-say" aria-live="polite"><span class="lab-mascot">${sprite('mascot')}</span><p></p></div>
        <div class="lab-cover lab-start">
          <div class="lab-card">
            <span class="lab-card-ic">${sprite('mascot')}</span>
            <p class="lab-kicker">${esc(opts.label || 'Virtual lab')}</p>
            <h2>${esc(cfg.title || 'Virtual lab')}</h2>
            <p class="lab-mission">${esc(cfg.mission || '')}</p>
            ${cfg.fact ? `<p class="lab-fact"><b>Did you know?</b> ${esc(cfg.fact)}</p>` : ''}
            <button class="lab-go" type="button">${ico('play')} Start the lab</button>
          </div>
        </div>
      </div>`;
    document.body.append(d);
    const $ = s => d.querySelector(s);
    const stage = $('.lab-stage'), say = $('.lab-say p'), bar = $('.lab-prog i');
    let inst = null, cleanups = [], mistakes = 0, done = false, gsapRef = null;

    const api = {
      cfg, reduced: REDUCED, sound, sprite: (n, o) => sprite(n, o), hasSprite,
      art: item => itemArt(item),
      say(text, kind = 'info') {
        say.parentElement.className = `lab-say ${kind}`;
        say.textContent = text;
        if (gsapRef && !REDUCED) gsapRef.fromTo(say.parentElement, { y: 8, opacity: .4 }, { y: 0, opacity: 1, duration: .35, ease: 'back.out(2)' });
        if (kind === 'good') sound('good'); else if (kind === 'bad') sound('bad');
      },
      progress(f) {
        const v = Math.max(0, Math.min(1, f));
        $('.lab-prog').setAttribute('aria-valuenow', Math.round(v * 100));
        if (gsapRef) gsapRef.to(bar, { scaleX: v, duration: .5, ease: 'power2.out' }); else bar.style.transform = `scaleX(${v})`;
      },
      mistake() { mistakes++; },
      get mistakes() { return mistakes; },
      complete({ stars, score = 1, message } = {}) {
        if (done) return;
        done = true;
        const s = stars ?? (mistakes <= 1 ? 3 : mistakes <= 3 ? 2 : 1);
        result = { stars: s, score };
        api.progress(1);
        opts.onComplete?.(result);
        setTimeout(() => showWin(s, message || cfg.win || 'Brilliant work!'), REDUCED ? 0 : 650);
      },
      savePortfolio(dataUrl, title) { opts.onPortfolio?.(dataUrl, title); },
      onCleanup(fn) { cleanups.push(fn); },
      colors: () => { const cs = getComputedStyle(d); const v = n => cs.getPropertyValue(n).trim(); return { olive: v('--olive'), rust: v('--rust'), plum: v('--plum'), amber: v('--amber'), teal: v('--teal'), ink: v('--ink'), paper: v('--paper'), card: v('--card'), line: v('--line'), muted: v('--muted'), ok: v('--ok'), bad: v('--bad'), form: v('--lf') }; },
      root: d,
    };

    async function boot() {
      stage.innerHTML = '<div class="lab-loading"><span></span><span></span><span></span></div>';
      try {
        const mod = await import(`./types/${cfg.type}.js`);
        const needs = mod.meta?.needs || ['gsap'];
        const [g] = await Promise.all([loadGsap(), stylesheet(`${CSS_DIR}${cfg.type}.css`), needs.includes('matter') ? loadMatter().then(M => { api.Matter = M; }) : null]);
        gsapRef = g; api.gsap = g; api.Draggable = window.Draggable; api.MotionPathPlugin = window.MotionPathPlugin;
        return mod;
      } catch (e) {
        console.error(e);
        stage.innerHTML = `<div class="lab-err"><p>This lab could not load. Check your connection and try again.</p></div>`;
        return null;
      }
    }
    let modP = boot();

    async function start() {
      const mod = await modP; if (!mod) return;
      sound('whoosh');
      const cover = $('.lab-start');
      if (gsapRef && !REDUCED) await gsapRef.to(cover, { opacity: 0, scale: 1.04, duration: .35, ease: 'power2.in' });
      cover.hidden = true;
      run(mod);
    }
    function run(mod) {
      teardown();
      done = false; mistakes = 0; api.progress(0);
      stage.innerHTML = '';
      api.say(cfg.mission || 'Let\'s begin!');
      try { inst = mod.mount(stage, cfg, api) || null; } catch (e) { console.error(e); stage.innerHTML = '<div class="lab-err"><p>Something went wrong in this lab.</p></div>'; }
      if (gsapRef && !REDUCED) gsapRef.from(stage.children, { opacity: 0, y: 18, duration: .5, stagger: .06, ease: 'power3.out' });
    }
    function teardown() {
      try { inst?.destroy?.(); } catch (e) { console.error(e); }
      cleanups.forEach(f => { try { f(); } catch { /* ignore */ } }); cleanups = [];
      inst = null;
      d.querySelector('.lab-win')?.remove();
    }
    function showWin(stars, message) {
      sound('win');
      const w = document.createElement('div');
      w.className = 'lab-cover lab-win';
      w.innerHTML = `<div class="lab-card win">
        <div class="win-stars">${[1, 2, 3].map(i => `<span class="${i <= stars ? 'on' : ''}">${STAR}</span>`).join('')}</div>
        <h2>${stars === 3 ? 'Perfect!' : stars === 2 ? 'Great job!' : 'Lab complete!'}</h2>
        <p>${esc(message)}</p>
        <div class="win-btns"><button class="lab-go ghost" data-again type="button">${ico('restart')} Play again</button><button class="lab-go" data-close type="button">Back to the lesson ${ico('arrow')}</button></div>
      </div>`;
      d.querySelector('.lab-body').append(w);
      const best = Math.max(stars, opts.best || 0);
      d.querySelectorAll('.lab-stars span').forEach((s, i) => s.classList.toggle('on', i < best));
      if (gsapRef && !REDUCED) {
        const tl = gsapRef.timeline();
        tl.from(w, { opacity: 0, duration: .3 })
          .from(w.querySelector('.lab-card'), { scale: .8, y: 30, duration: .55, ease: 'back.out(1.8)' }, '<')
          .from(w.querySelectorAll('.win-stars span'), { scale: 0, rotate: -120, duration: .6, stagger: .15, ease: 'back.out(2.4)' }, '-=.2');
        burst(w.querySelector('.win-stars'), gsapRef);
      }
      w.querySelector('[data-again]').onclick = async () => { const mod = await modP; w.remove(); run(mod); };
      w.querySelector('[data-close]').onclick = () => close();
      w.querySelector('[data-close]').focus();
    }

    function close() {
      teardown();
      const fin = () => { d.close(); };
      if (gsapRef && !REDUCED) gsapRef.to(d, { opacity: 0, scale: .98, duration: .22, ease: 'power2.in', onComplete: fin }); else fin();
    }
    d.addEventListener('close', () => { teardown(); d.remove(); resolve(result); });
    d.addEventListener('cancel', e => { e.preventDefault(); close(); });
    $('.lab-x').onclick = close;
    $('.lab-go').onclick = start;
    $('.lab-re').onclick = async () => { const mod = await modP; if (!mod || !$('.lab-start').hidden) return; sound('click'); run(mod); };
    $('.lab-snd').onclick = e => {
      muted = !muted; try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch { /* ignore */ }
      e.currentTarget.innerHTML = ico(muted ? 'mute' : 'sound'); e.currentTarget.setAttribute('aria-pressed', String(!muted));
    };
    d.showModal();
    $('.lab-go').focus();
    modP.then(() => { if (gsapRef && !REDUCED) gsapRef.from(d.querySelector('.lab-start .lab-card'), { y: 40, opacity: 0, scale: .94, duration: .6, ease: 'back.out(1.6)' }); });
  });
}

// Item art for any config item: { sprite } -> sprite, { emoji } -> emoji, otherwise null.
export function itemArt(item, size) {
  if (!item) return '';
  if (item.sprite && hasSprite(item.sprite)) return sprite(item.sprite, { size });
  if (item.emoji) return `<span class="lab-emoji" aria-hidden="true">${esc(item.emoji)}</span>`;
  if (item.sprite) return `<span class="lab-emoji" aria-hidden="true">${esc(fallbackEmoji(item.sprite))}</span>`;
  return '';
}
const EMOJI = { tomato: '🍅', carrot: '🥕', chilli: '🌶️', potato: '🥔', onion: '🧅', lemon: '🍋', mango: '🥭', apple: '🍎', banana: '🍌', cow: '🐄', goat: '🐐', hen: '🐔', bee: '🐝', butterfly: '🦋', sun: '☀️', water: '💧', 'water-drop': '💧', star: '⭐', coin: '🪙', rupee: '₹' };
const fallbackEmoji = n => EMOJI[n] || '✨';

function burst(anchor, g) {
  const box = anchor.getBoundingClientRect();
  const host = anchor.closest('.lab');
  const hb = host.getBoundingClientRect();
  const colors = ['#D98A1C', '#1F6F66', '#C2502A', '#8C3557', '#4C7424', '#F0B44C'];
  for (let i = 0; i < 36; i++) {
    const p = document.createElement('i');
    p.className = 'lab-confetti';
    p.style.background = colors[i % colors.length];
    p.style.left = `${box.left - hb.left + box.width / 2}px`; p.style.top = `${box.top - hb.top + box.height / 2}px`;
    host.append(p);
    const a = Math.random() * Math.PI * 2, r = 120 + Math.random() * 220;
    g.to(p, { x: Math.cos(a) * r, y: Math.sin(a) * r * .7 + 160, rotation: Math.random() * 720, opacity: 0, duration: 1.4 + Math.random() * .6, ease: 'power2.out', onComplete: () => p.remove() });
  }
}

function ico(n) {
  const P = {
    close: '<path d="M6 6l12 12M18 6L6 18"/>', play: '<path d="M8 5v14l11-7z" fill="currentColor"/>', restart: '<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v5h5"/>',
    sound: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>', mute: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9l5 6M22 9l-5 6"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n]}</svg>`;
}
