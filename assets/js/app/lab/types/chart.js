// VINC Lab · chart — collect data, build a chart, answer questions.
// Observation cards slide in from a deck; the child taps the matching row on a clipboard tally sheet and a
// pencil draws the tally mark (five-bar gates). Then the chart appears: bars the child drags up to match the
// tally (or that grow with a spring), a pie that sweeps round, or a pictograph whose icons drop in. Then
// questions with big tappable answers that light up the chart.
//
// Config (SPEC §2.8) plus optional extras:
//   collect[] items may be objects: { key, note: 'Dripping tap in the kitchen', sprite?, emoji? }
//   build: true|false   bar charts only — the child drags each bar to the right height (default: true when
//                       the data was collected by tallying, false for `values`)
//   per: 2              pictograph: how many items one icon stands for (default picks one that fits)
//   unit: 'taps'        word used in labels ("5 taps")
//   questions[].options [..]   explicit answer options (category keys or numbers)
//   questions[].why     shown after the right answer
import { h, esc, shake, pop, sparkle } from '../kit.js';
import { t } from '../../../i18n.js';

export const meta = { title: 'Tally and chart', needs: ['gsap'] };

const PAL = ['teal', 'amber', 'plum', 'olive', 'rust'];
const NAMED = new Set(['teal', 'amber', 'plum', 'olive', 'rust', 'ok', 'bad', 'warn', 'lf']);
const EMOJI = { tap: '🚰', 'leaking-tap': '🚰', bucket: '🪣', mug: '☕', shower: '🚿', toilet: '🚽', 'washing-machine': '🧺', tomato: '🍅', carrot: '🥕', spinach: '🥬', mango: '🥭', apple: '🍎', banana: '🍌', bee: '🐝', butterfly: '🦋', ladybird: '🐞', ant: '🐜', sparrow: '🐦', pigeon: '🐦', myna: '🐦', cow: '🐄', goat: '🐐', hen: '🐔', girl: '👧', boy: '👦', bicycle: '🚲', 'toy-car': '🚗', tv: '📺', newspaper: '📰', billboard: '🪧', smartphone: '📱', poster: '🖼️', radio: '📻', 'old-radio': '📻', lunchbox: '🍱', sandwich: '🥪', 'fruit-salad': '🥗', poha: '🍚', soap: '🧼', toothbrush: '🪥', mask: '😷', heart: '❤️', 'plastic-bottle': '🧴', newspaperbin: '🗞️', dustbin: '🗑️', recycle: '♻️', 'kitchen-waste': '🥬', 'dry-leaves': '🍂', leaf: '🍃', flower: '🌼', tree: '🌳', sun: '☀️', rain: '🌧️', cloud: '☁️' };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const trunc = (s, n) => (s = String(s ?? '')).length > n ? `${s.slice(0, n - 1)}…` : s;
const colorOf = (cat, i) => { const c = cat.color || PAL[i % PAL.length]; return NAMED.has(c) ? `var(--${c})` : c; };
const fmtN = n => (Math.round(n * 10) / 10).toLocaleString('en-IN');

function artOf(api, item) {
  if (!item) return '';
  if (item.sprite && api.hasSprite(item.sprite)) return api.sprite(item.sprite);
  const e = item.emoji || (item.sprite && EMOJI[item.sprite]);
  return e ? `<span class="lab-emoji" aria-hidden="true">${esc(e)}</span>` : '';
}
function svgArt(api, item, x, y, s, extra = '') {
  if (!item) return '';
  if (item.sprite && api.hasSprite(item.sprite)) return api.sprite(item.sprite).replace('<svg ', `<svg x="${x}" y="${y}" width="${s}" height="${s}" style="width:${s}px;height:${s}px" ${extra} `);
  const e = item.emoji || (item.sprite && EMOJI[item.sprite]) || '●';
  return `<text x="${x + s / 2}" y="${y + s / 2 + s * .04}" font-size="${s * .78}" text-anchor="middle" dominant-baseline="central" ${extra}>${esc(e)}</text>`;
}
function seededShuffle(arr, seed) { const a = [...arr]; let s = seed || 7; const r = () => (s = s * 16807 % 2147483647) / 2147483647; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

/* tally geometry: viewBox 0 0 W 40 */
function markPath(m, jit) {
  const gI = Math.floor(m / 5), pos = m % 5, x0 = 10 + gI * 50;
  if (pos < 4) { const x = x0 + pos * 9; return `M${x + jit[0]} ${6 + jit[1]}L${x - 1 + jit[2]} ${34 + jit[1]}`; }
  return `M${x0 - 5} ${31}L${x0 + 33} ${9 + jit[0]}`;
}
const PENCIL = '<g class="ct-pencil" opacity="0"><g transform="rotate(32)"><rect x="-3.5" y="-40" width="7" height="30" rx="1.5" fill="#F2B33D"/><rect x="-3.5" y="-40" width="2.4" height="30" fill="#FFD36E"/><rect x="-3.5" y="-45" width="7" height="6" rx="2" fill="#E58FA0"/><rect x="-3.5" y="-40" width="7" height="2.5" fill="#B9B9B9"/><path d="M-3.5 -10L0 0L3.5 -10Z" fill="#EBCB9E"/><path d="M-1.2 -3.5L0 0L1.2 -3.5Z" fill="#3A3A44"/></g></g>';

let UID = 0;
export function mount(stage, cfg, api) {
  const g = api.gsap, uid = `ct${++UID}`;
  const cats = (cfg.categories || []).map((c, i) => ({ ...c, col: colorOf(c, i) }));
  const byKey = Object.fromEntries(cats.map(c => [c.key, c]));
  const obs = (cfg.collect || []).map(o => (typeof o === 'string' ? { key: o } : o)).filter(o => byKey[o.key]);
  const collecting = obs.length > 0;
  const counts = Object.fromEntries(cats.map(c => [c.key, 0]));
  if (!collecting) cats.forEach(c => { counts[c.key] = Math.max(0, Math.round(+(cfg.values?.[c.key] ?? 0))); });
  const kind = ['bar', 'pie', 'pictograph'].includes(cfg.kind) ? cfg.kind : 'bar';
  const build = kind === 'bar' && (cfg.build ?? collecting);
  const qs = cfg.questions || [];
  const unitWord = cfg.unit || '';
  const timers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, api.reduced ? Math.min(ms, 150) : ms));
  let oi = 0, busy = false, cardMiss = 0, phase = collecting ? 'collect' : 'chart';

  const root = h(`<div class="lab-chart k-${kind} ${collecting ? 'is-collect' : 'is-chart'}">
    <div class="ct-main">
      <div class="ct-desk">
        <div class="ct-deck" aria-hidden="true"><i></i><i></i><i></i><b class="ct-left"></b></div>
        <div class="ct-cardslot"></div>
      </div>
      <div class="ct-chartbox" hidden><svg class="ct-svg" role="img"></svg></div>
    </div>
    <div class="ct-side">
      <div class="ct-sheet">
        <div class="ct-clip" aria-hidden="true"><i></i></div>
        <p class="ct-sheet-h">${esc(collecting ? t('Tally sheet') : t('Our data'))}<small>${collecting ? t('{n} observations', { n: obs.length }) : ''}</small></p>
        <div class="ct-rows">${cats.map((c, i) => `<button type="button" class="ct-row" data-key="${esc(c.key)}" style="--c:${c.col}" aria-label="${esc(c.label)}: 0">
          <span class="ct-row-art">${artOf(api, c)}</span><span class="ct-row-lbl">${esc(c.label)}</span>
          <svg class="ct-tally" viewBox="0 0 210 40" preserveAspectRatio="xMinYMid meet" aria-hidden="true"><g class="ct-marks"></g>${PENCIL}</svg>
          <span class="ct-count">0</span><kbd>${i + 1}</kbd></button>`).join('')}</div>
      </div>
      <section class="ct-quiz" hidden aria-live="polite"></section>
    </div>
  </div>`);
  stage.append(root);
  const $ = s => root.querySelector(s);
  const rows = Object.fromEntries([...root.querySelectorAll('.ct-row')].map(r => [r.dataset.key, r]));
  const svg = $('.ct-svg');

  /* ---------- tally drawing ---------- */
  const jitters = {};
  function drawMark(key, animate) {
    const row = rows[key], n = counts[key] - 1, marks = row.querySelector('.ct-marks');
    const vbW = Math.max(210, 10 + Math.ceil((n + 1) / 5) * 50);
    row.querySelector('.ct-tally').setAttribute('viewBox', `0 0 ${vbW} 40`);
    const jit = (jitters[key] ||= []);
    jit[n] = [Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1];
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', markPath(n, jit[n])); p.setAttribute('class', `ct-mark${n % 5 === 4 ? ' gate' : ''}`);
    marks.append(p);
    const cnt = row.querySelector('.ct-count');
    cnt.textContent = counts[key];
    row.setAttribute('aria-label', `${byKey[key].label}: ${counts[key]}`);
    if (!animate || api.reduced) return g.timeline();
    const pen = row.querySelector('.ct-pencil'), len = p.getTotalLength(), a = p.getPointAtLength(0), b = p.getPointAtLength(len);
    const tl = g.timeline();
    tl.set(pen, { x: a.x, y: a.y, opacity: 1 })
      .fromTo(p, { drawSVG: '0%' }, { drawSVG: '100%', duration: n % 5 === 4 ? .28 : .2, ease: 'power1.in' })
      .to(pen, { x: b.x, y: b.y, duration: n % 5 === 4 ? .28 : .2, ease: 'power1.in' }, '<')
      .to(pen, { opacity: 0, y: '-=8', duration: .25 })
      .fromTo(cnt, { scale: 1.6 }, { scale: 1, duration: .4, ease: 'back.out(3)' }, '<-.1');
    if (n % 5 === 4) tl.add(() => api.sound('pop'), .2);
    return tl;
  }

  /* ---------- phase 1: collect ---------- */
  const cardFor = o => {
    const c = byKey[o.key], art = artOf(api, o.sprite || o.emoji ? o : c);
    return h(`<div class="ct-card" style="--c:${c.col}"><span class="ct-card-no">#${oi + 1}</span><div class="ct-card-art">${art}</div>
      <p class="ct-card-note">${esc(o.note || t('Which row is this?'))}</p></div>`);
  };
  function updateDeck() {
    const left = obs.length - oi;
    $('.ct-left').textContent = left > 0 ? t('{n} to go', { n: left }) : t('done');
    root.querySelectorAll('.ct-deck i').forEach((d, i) => { d.style.visibility = left - 1 > i ? 'visible' : 'hidden'; });
  }
  function dealCard() {
    updateDeck();
    const slot = $('.ct-cardslot');
    slot.innerHTML = '';
    if (oi >= obs.length) return finishCollect();
    cardMiss = 0;
    const card = cardFor(obs[oi]);
    slot.append(card);
    if (!api.reduced) {
      const d = $('.ct-deck').getBoundingClientRect(), s = card.getBoundingClientRect();
      g.fromTo(card, { x: d.left + d.width / 2 - (s.left + s.width / 2), y: d.top + d.height / 2 - (s.top + s.height / 2), rotation: -14, scale: .5, opacity: 0 },
        { x: 0, y: 0, rotation: (oi % 2 ? 2 : -2), scale: 1, opacity: 1, duration: .45, ease: 'back.out(1.5)' });
      api.sound('whoosh');
    }
  }
  function tapRow(key) {
    if (phase !== 'collect' || busy || oi >= obs.length) return;
    const o = obs[oi], card = $('.ct-card'), row = rows[key];
    if (key !== o.key) {
      api.mistake(); cardMiss++;
      shake(api, card); shake(api, row);
      row.classList.add('no'); later(() => row.classList.remove('no'), 600);
      api.say(cardMiss > 1 ? t('This one goes in “{label}”. Look at the picture.', { label: byKey[o.key].label }) : t('Not {label}. Look at the card again!', { label: byKey[key].label }), 'bad');
      return;
    }
    busy = true;
    counts[key]++;
    api.sound('pop');
    const r = row.querySelector('.ct-tally').getBoundingClientRect(), c = card.getBoundingClientRect();
    const fly = api.reduced ? g.timeline() : g.timeline().to(card, { x: `+=${r.left + 20 - (c.left + c.width / 2)}`, y: `+=${r.top + r.height / 2 - (c.top + c.height / 2)}`, scale: .18, rotation: 20, opacity: .2, duration: .38, ease: 'power2.in' });
    fly.add(() => {
      row.classList.add('hit'); later(() => row.classList.remove('hit'), 350);
      const tl = drawMark(key, true);
      oi++;
      api.progress(.55 * oi / obs.length);
      const n = counts[key];
      if (n % 5 === 0) api.say(t('Five {label} — close the gate with a line across! That makes counting in fives easy.', { label: byKey[key].label.toLowerCase() }), 'good');
      else if (oi === 1) api.say(t('A tally mark! Keep going.'), 'good');
      tl.add(() => { busy = false; }, api.reduced ? 0 : '-=.3');
      dealCard();
    });
  }
  Object.values(rows).forEach(r => r.addEventListener('click', () => tapRow(r.dataset.key)));
  const onKey = e => {
    if (phase === 'collect' && /^[1-9]$/.test(e.key) && cats[+e.key - 1]) { e.preventDefault(); tapRow(cats[+e.key - 1].key); }
  };
  api.root.addEventListener('keydown', onKey);

  function finishCollect() {
    phase = 'between';
    api.say(t('Tally done! Now let’s turn the tally into a chart.'), 'good');
    root.querySelectorAll('.ct-row').forEach(r => r.classList.add('locked'));
    if (!api.reduced) g.fromTo(root.querySelectorAll('.ct-count'), { scale: 1 }, { scale: 1.35, duration: .18, yoyo: true, repeat: 1, stagger: .08 });
    later(showChart, 1300);
  }

  /* ---------- phase 2: chart ---------- */
  const vals = () => cats.map(c => counts[c.key]);
  const total = () => vals().reduce((a, b) => a + b, 0);
  let chartApi = null;
  function showChart() {
    phase = 'chart';
    root.classList.remove('is-collect'); root.classList.add('is-chart');
    root.querySelectorAll('.ct-row').forEach(r => { r.classList.add('locked'); r.tabIndex = -1; r.setAttribute('aria-disabled', 'true'); });
    $('.ct-desk').hidden = true;
    const box = $('.ct-chartbox'); box.hidden = false;
    chartApi = kind === 'pie' ? pieChart() : kind === 'pictograph' ? pictograph() : barChart();
    svg.setAttribute('aria-label', t(`${kind} chart: {list}`, { list: cats.map(c => `${c.label} ${counts[c.key]}`).join(', ') }));
    if (!api.reduced) g.from(box, { scale: .92, opacity: 0, duration: .5, ease: 'back.out(1.6)' });
    if (matchMedia('(max-width: 760px)').matches) box.scrollIntoView({ block: 'start', behavior: api.reduced ? 'auto' : 'smooth' });
    api.progress(collecting ? .6 : .15);
    chartApi.start(() => later(startQuiz, 700));
  }

  const isNarrow = () => root.getBoundingClientRect().width < 520;

  /* bar chart */
  function barChart() {
    const narrow = isNarrow(), W = narrow ? 400 : 600, x0 = narrow ? 50 : 58, x1 = W - 10, base = 262, topY = 26, n = cats.length;
    const maxV = Math.max(1, ...vals());
    const step = maxV <= 6 ? 1 : maxV <= 12 ? 2 : maxV <= 30 ? 5 : maxV <= 60 ? 10 : Math.ceil(maxV / 60) * 10;
    const top = Math.ceil((maxV + (build ? step : 0) + .001) / step) * step;
    const unit = (base - topY) / top, slot = (x1 - x0) / n, bw = Math.min(78, slot * .58);
    let grid = '';
    for (let v = 0; v <= top; v += step) { const y = base - v * unit; grid += `<path d="M${x0} ${y}H${x1}" class="ct-grid${v ? '' : ' zero'}"/><text x="${x0 - 10}" y="${y}" class="ct-ytick" text-anchor="end" dominant-baseline="central">${v}</text>`; }
    if (build) for (let v = 0; v <= top; v++) if (v % step) grid += `<path d="M${x0} ${base - v * unit}H${x1}" class="ct-grid minor"/>`;
    const barPath = (x, w, hh) => { if (hh <= .5) return `M${x} ${base}H${x + w}Z`; const r = Math.min(10, hh / 2, w / 2); return `M${x} ${base}V${base - hh + r}Q${x} ${base - hh} ${x + r} ${base - hh}H${x + w - r}Q${x + w} ${base - hh} ${x + w} ${base - hh + r}V${base}Z`; };
    svg.setAttribute('viewBox', `0 0 ${W} 360`);
    svg.innerHTML = `<defs><linearGradient id="${uid}sh" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".45" stop-color="#fff" stop-opacity=".06"/><stop offset="1" stop-color="#000" stop-opacity=".08"/></linearGradient></defs>
      ${grid}<text x="${x0 - 44}" y="${(base + topY) / 2}" class="ct-ylab" transform="rotate(-90 ${x0 - 44} ${(base + topY) / 2})" text-anchor="middle">${esc(unitWord ? t('Number of {unit}', { unit: unitWord }) : t('How many'))}</text>
      ${cats.map((c, i) => { const cx = x0 + slot * (i + .5); return `<g class="ct-col" data-key="${esc(c.key)}" style="--c:${c.col}" ${build ? `tabindex="0" role="slider" aria-label="${esc(t('{label} bar', { label: c.label }))}" aria-valuemin="0" aria-valuemax="${top}" aria-valuenow="0"` : ''}>
        <rect class="ct-hit" x="${cx - slot / 2}" y="${topY - 14}" width="${slot}" height="${base - topY + 70}" fill="transparent"/>
        <path class="ct-bar" d="${barPath(cx - bw / 2, bw, 0)}"/><path class="ct-sheen" d="${barPath(cx - bw / 2, bw, 0)}" fill="url(#${uid}sh)"/>
        <text class="ct-val" x="${cx}" y="${base - 10}" text-anchor="middle">${build ? '' : 0}</text>
        ${build ? `<g class="ct-grip" transform="translate(${cx} ${base})"><g class="ct-grip-in"><circle r="14"/><path d="M-5 -3h10M-5 2h10"/></g></g><g class="ct-ok" transform="translate(${cx + bw / 2 - 2} ${base})"><g class="ct-ok-in" opacity="0"><circle r="11"/><path d="M-5 0l3.5 3.5L5 -4"/></g></g>` : ''}
        ${svgArt(api, c, cx - 21, base + 8, 42)}<text class="ct-xlab" x="${cx}" y="${base + 68}" text-anchor="middle">${esc(trunc(c.label, Math.floor(slot / 7.6)))}</text></g>`; }).join('')}
      <path d="M${x0} ${base}H${x1}" class="ct-axis"/>`;
    const cols = [...svg.querySelectorAll('.ct-col')], cur = cats.map(() => 0), done = cats.map(() => false);
    function setBar(i, v) {
      const cx = x0 + slot * (i + .5), hh = Math.max(0, v * unit), col = cols[i];
      col.querySelector('.ct-bar').setAttribute('d', barPath(cx - bw / 2, bw, hh));
      col.querySelector('.ct-sheen').setAttribute('d', barPath(cx - bw / 2, bw, hh));
      const t = col.querySelector('.ct-val'); t.setAttribute('y', base - hh - 12);
      const shown = Math.round(v); if (!build || v > 0) t.textContent = shown;
      if (build) { col.querySelector('.ct-grip').setAttribute('transform', `translate(${cx} ${base - hh})`); col.querySelector('.ct-ok').setAttribute('transform', `translate(${cx + bw / 2 + 4} ${base - hh - 4})`); }
    }
    let onAllDone = null;
    function settle(i) {
      const want = counts[cats[i].key];
      if (cur[i] === want && !done[i]) {
        done[i] = true; cols[i].classList.add('done'); cols[i].setAttribute('aria-valuetext', t('{n}, correct', { n: cur[i] }));
        api.sound('good');
        g.fromTo(cols[i].querySelector('.ct-ok-in'), { opacity: 0, scale: 0, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: .4, ease: 'back.out(3)' });
        sparkle(api, cols[i].querySelector('.ct-bar'));
        const left = done.filter(d => !d).length;
        api.progress(.6 + .15 * (1 - left / cats.length));
        if (!left) { api.say(t('Every bar matches the tally. That is a bar chart!'), 'good'); onAllDone?.(); }
        else api.say(t(left > 1 ? 'Yes! {label}: {n}. {left} bars to go.' : 'Yes! {label}: {n}. {left} bar to go.', { label: cats[i].label, n: want, left }), 'good');
      } else if (!done[i] && cur[i] !== want) {
        api.say(t(cur[i] > want ? 'Too tall! Count the tally marks for {label} again.' : 'A bit short. The tally for {label} has more marks.', { label: cats[i].label }), 'hint');
      }
    }
    function setVal(i, v, snd) {
      if (done[i]) return;
      v = clamp(Math.round(v), 0, top);
      if (v === cur[i]) return;
      cur[i] = v; cols[i].setAttribute('aria-valuenow', v);
      g.to({ v: +cols[i].dataset.v || 0 }, { v, duration: .18, ease: 'power2.out', onUpdate() { cols[i].dataset.v = this.targets()[0].v; setBar(i, this.targets()[0].v); } });
      if (snd) api.sound('tick');
    }
    if (build) {
      const pt = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
      cols.forEach((col, i) => {
        let dragging = false;
        col.addEventListener('pointerdown', e => { if (done[i]) return; dragging = true; col.setPointerCapture(e.pointerId); col.classList.add('drag'); setVal(i, (base - pt(e).y) / unit, true); e.preventDefault(); });
        col.addEventListener('pointermove', e => { if (dragging) setVal(i, (base - pt(e).y) / unit, true); });
        const up = () => { if (!dragging) return; dragging = false; col.classList.remove('drag'); settle(i); };
        col.addEventListener('pointerup', up); col.addEventListener('pointercancel', up);
        col.addEventListener('keydown', e => {
          if (['ArrowUp', 'ArrowRight'].includes(e.key)) { e.preventDefault(); setVal(i, cur[i] + 1, true); }
          else if (['ArrowDown', 'ArrowLeft'].includes(e.key)) { e.preventDefault(); setVal(i, cur[i] - 1, true); }
          else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); settle(i); }
        });
      });
    }
    return {
      start(next) {
        if (build) {
          api.say(t('Build the bar chart: drag each bar up until it matches the tally. (Or tap a bar and use the arrow keys.)'), 'info');
          svg.classList.add('building');
          onAllDone = () => { svg.classList.remove('building'); g.to(svg.querySelectorAll('.ct-grip'), { opacity: 0, duration: .3 }); next(); };
          if (!api.reduced) g.fromTo(svg.querySelectorAll('.ct-grip-in'), { y: 0 }, { y: -10, duration: .35, yoyo: true, repeat: 3, stagger: .1, ease: 'power1.inOut' });
          return;
        }
        api.say(t('Watch the bars grow from the data!'), 'info');
        const tl = g.timeline({ onComplete: next });
        cats.forEach((c, i) => {
          const o = { v: 0 };
          tl.to(o, { v: counts[c.key], duration: 1.1, ease: 'elastic.out(1, .5)', onUpdate: () => setBar(i, o.v), onStart: () => api.sound('pop') }, .15 + i * .18);
        });
        cats.forEach((c, i) => setBar(i, 0));
      },
      highlight(keys) { cols.forEach(cl => cl.classList.toggle('hl', keys.includes(cl.dataset.key))); svg.classList.toggle('dim', keys.length > 0); keys.forEach(k => { const cl = cols.find(x => x.dataset.key === k); if (cl) pop(api, cl.querySelector('.ct-bar'), 1.05); }); },
    };
  }

  /* pie chart */
  function pieChart() {
    const narrow = isNarrow(), cx = narrow ? 200 : 170, cy = 170, R = narrow ? 150 : 146, tot = Math.max(1, total());
    const vs = vals();
    const rowH = narrow ? 46 : Math.min(52, 320 / cats.length), ly = narrow ? 340 : 170 - rowH * cats.length / 2;
    svg.setAttribute('viewBox', narrow ? `0 0 400 ${350 + rowH * cats.length}` : '0 0 600 350');
    svg.innerHTML = `<circle cx="${cx}" cy="${cy + 6}" r="${R}" class="ct-pieshadow"/><circle cx="${cx}" cy="${cy}" r="${R}" class="ct-piebg"/>
      ${cats.map((c, i) => `<g class="ct-slice" data-key="${esc(c.key)}" style="--c:${c.col}"><path class="ct-sl" d=""/><text class="ct-pct" text-anchor="middle" dominant-baseline="central" opacity="0"></text></g>`).join('')}
      <circle cx="${cx}" cy="${cy}" r="${R * .28}" class="ct-hole"/><text x="${cx}" y="${cy - 8}" class="ct-tot" text-anchor="middle" dominant-baseline="central">${tot}</text><text x="${cx}" y="${cy + 16}" class="ct-totl" text-anchor="middle">${esc(unitWord || t('in all'))}</text>
      ${cats.map((c, i) => `<g class="ct-leg" data-key="${esc(c.key)}" style="--c:${c.col}" transform="translate(${narrow ? 40 : 352} ${ly + i * rowH})"><g class="ct-leg-in"><rect x="0" y="${rowH / 2 - 9}" width="18" height="18" rx="5" class="ct-sw"/>${svgArt(api, c, 26, rowH / 2 - 17, 34)}
        <text x="68" y="${rowH / 2 - 7}" class="ct-legl" dominant-baseline="central">${esc(trunc(c.label, 17))}</text><text x="68" y="${rowH / 2 + 12}" class="ct-legv" dominant-baseline="central">${vs[i]} · ${fmtN(vs[i] / tot * 100)}%</text></g></g>`).join('')}`;
    const sl = [...svg.querySelectorAll('.ct-slice')];
    const P = (a, r = R) => [cx + r * Math.sin(a), cy - r * Math.cos(a)];
    function draw(p) {
      let a0 = 0; const sweep = p * Math.PI * 2;
      vs.forEach((v, i) => {
        const span = v / tot * Math.PI * 2, a1 = Math.min(a0 + span, sweep);
        const path = sl[i].querySelector('.ct-sl');
        if (a1 <= a0 + 1e-4) path.setAttribute('d', '');
        else {
          const e = Math.min(a1, a0 + Math.PI * 2 - 1e-3), [xa, ya] = P(a0), [xb, yb] = P(e);
          path.setAttribute('d', `M${cx} ${cy}L${xa.toFixed(2)} ${ya.toFixed(2)}A${R} ${R} 0 ${e - a0 > Math.PI ? 1 : 0} 1 ${xb.toFixed(2)} ${yb.toFixed(2)}Z`);
        }
        const t = sl[i].querySelector('.ct-pct'), [tx, ty] = P(a0 + span / 2, R * .66);
        t.setAttribute('x', tx); t.setAttribute('y', ty); t.textContent = span > .38 ? `${Math.round(v / tot * 100)}%` : '';
        sl[i].dataset.mid = a0 + span / 2;
        a0 += span;
      });
    }
    draw(0);
    return {
      start(next) {
        api.say(t('Watch the pie fill up: each slice is one part of the whole.'), 'info');
        const o = { p: 0 };
        g.timeline({ onComplete: next })
          .to(o, { p: 1, duration: 1.8, ease: 'power2.inOut', onUpdate: () => draw(o.p) })
          .fromTo(svg.querySelectorAll('.ct-pct'), { opacity: 0, scale: .4, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: .4, stagger: .1, ease: 'back.out(3)' })
          .fromTo(svg.querySelectorAll('.ct-leg-in'), { x: 30, opacity: 0 }, { x: 0, opacity: 1, duration: .4, stagger: .08, ease: 'power2.out' }, .4);
      },
      highlight(keys) {
        svg.classList.toggle('dim', keys.length > 0);
        sl.forEach(s => {
          const on = keys.includes(s.dataset.key), m = +s.dataset.mid;
          s.classList.toggle('hl', on);
          g.to(s, { x: on ? Math.sin(m) * 12 : 0, y: on ? -Math.cos(m) * 12 : 0, duration: .5, ease: 'back.out(2)' });
        });
        svg.querySelectorAll('.ct-leg').forEach(l => l.classList.toggle('hl', keys.includes(l.dataset.key)));
      },
    };
  }

  /* pictograph */
  function pictograph() {
    const narrow = isNarrow(), PW = narrow ? 420 : 600, vs = vals(), maxV = Math.max(1, ...vs), fit = narrow ? 6 : 9;
    const per = Math.max(1, Math.round(+cfg.per || Math.ceil(maxV / fit)));
    const rowH = 58, H = cats.length * rowH + 62, x0 = narrow ? 142 : 168, gap = narrow ? 44 : 46, sz = 40;
    svg.setAttribute('viewBox', `0 0 ${PW} ${H}`);
    let body = '';
    cats.forEach((c, i) => {
      const y = 10 + i * rowH, full = Math.floor(vs[i] / per), rem = vs[i] % per;
      body += `<g class="ct-prow" data-key="${esc(c.key)}" style="--c:${c.col}"><rect x="4" y="${y}" width="${PW - 8}" height="${rowH - 6}" rx="14" class="ct-prbg"/>
        ${svgArt(api, c, 12, y + 6, 40)}<text x="60" y="${y + rowH / 2 - 3}" class="ct-plab" dominant-baseline="central">${esc(trunc(c.label, narrow ? 8 : 13))}</text>`;
      for (let k = 0; k < full + (rem ? 1 : 0); k++) {
        const partial = k === full;
        const clip = partial ? `clip-path="url(#${uid}c${i})"` : '';
        if (partial) body += `<clipPath id="${uid}c${i}"><rect x="${x0 + k * gap}" y="${y}" width="${sz * rem / per}" height="${rowH}"/></clipPath>`;
        body += `<g class="ct-icon" ${clip}>${svgArt(api, c, x0 + k * gap, y + 6, sz)}</g>`;
      }
      body += `<text x="${PW - 14}" y="${y + rowH / 2 - 3}" class="ct-pval" text-anchor="end" dominant-baseline="central">${vs[i]}</text></g>`;
    });
    const ky = cats.length * rowH + 22;
    body += `<g class="ct-key" transform="translate(${PW / 2 - 300} 0)"><rect x="150" y="${ky - 4}" width="300" height="40" rx="20" class="ct-keybg"/>${svgArt(api, cats[0], 176, ky, 32)}<text x="216" y="${ky + 16}" dominant-baseline="central" class="ct-keyt">${t(per > 1 ? '= {n} {unit} (½ icon = less)' : '= {n} {unit}', { n: per, unit: esc(unitWord || (per > 1 ? t('items') : t('item'))) })}</text></g>`;
    svg.innerHTML = body;
    return {
      start(next) {
        api.say(per > 1 ? t('In this pictograph each picture stands for {n}. Watch them drop in!', { n: per }) : t('Watch the pictures drop in: one picture for each one you counted.'), 'info');
        const tl = g.timeline({ onComplete: next });
        svg.querySelectorAll('.ct-prow').forEach((r, i) => {
          tl.from(r.querySelectorAll('.ct-icon'), { y: -90, opacity: 0, duration: .55, ease: 'bounce.out', stagger: .07, onStart: () => api.sound('drop') }, i * .35)
            .from(r.querySelector('.ct-pval'), { scale: 0, transformOrigin: '50% 50%', duration: .3, ease: 'back.out(3)' }, '>-.2');
        });
        tl.from(svg.querySelector('.ct-key'), { y: 20, opacity: 0, duration: .4 }, '>');
      },
      highlight(keys) { svg.classList.toggle('dim', keys.length > 0); svg.querySelectorAll('.ct-prow').forEach(r => { r.classList.toggle('hl', keys.includes(r.dataset.key)); if (keys.includes(r.dataset.key)) pop(api, r, 1.02); }); },
    };
  }

  /* ---------- phase 3: questions ---------- */
  let qi = 0;
  const isCat = a => typeof a === 'string' && byKey[a];
  function optionsFor(q) {
    if (Array.isArray(q.options) && q.options.length) return q.options;
    if (isCat(q.answer)) return cats.map(c => c.key);
    const a = +q.answer, vs = vals(), pool = [];
    [...vs, a + 1, a - 1, a + 2, a - 2, total(), a * 2, Math.round(a / 2), a + 5, a + 3].forEach(x => { if (Number.isFinite(x) && x >= 0 && x !== a && !pool.includes(x)) pool.push(x); });
    return seededShuffle([a, ...pool.slice(0, 3)], qi * 31 + 7);
  }
  function startQuiz() {
    if (!qs.length) { api.complete(); return; }
    phase = 'quiz';
    const sheet = $('.ct-sheet'), quiz = $('.ct-quiz');
    const swap = () => { sheet.hidden = true; quiz.hidden = false; showQ(); };
    if (api.reduced) swap();
    else g.to(sheet, { x: 40, opacity: 0, duration: .3, ease: 'power2.in', onComplete: () => { swap(); g.from(quiz, { x: -40, opacity: 0, duration: .45, ease: 'power3.out' }); } });
  }
  function showQ() {
    const q = qs[qi], quiz = $('.ct-quiz'), opts = optionsFor(q);
    chartApi.highlight([]);
    quiz.innerHTML = `<p class="ct-qn">${t('Question {n} of {total}', { n: qi + 1, total: qs.length })}</p><h3 class="ct-ask">${esc(q.ask)}</h3>
      <div class="ct-opts ${opts.every(isCat) ? 'cats' : 'nums'}">${opts.map((o, i) => isCat(o)
        ? `<button type="button" class="ct-opt" data-v="${esc(o)}" style="--c:${byKey[o].col}"><span class="ct-opt-art">${artOf(api, byKey[o])}</span><span>${esc(byKey[o].label)}</span></button>`
        : `<button type="button" class="ct-opt num" data-v="${esc(o)}"><span class="ct-opt-n">${esc(typeof o === 'number' ? fmtN(o) : o)}</span></button>`).join('')}</div>
      <p class="ct-why" hidden></p>`;
    api.say(q.ask, 'info');
    if (!api.reduced) g.from(quiz.querySelectorAll('.ct-ask, .ct-opt'), { y: 18, opacity: 0, duration: .4, stagger: .05, ease: 'back.out(1.8)' });
    if (matchMedia('(max-width: 760px)').matches && qi > 0) quiz.scrollIntoView({ block: 'nearest', behavior: api.reduced ? 'auto' : 'smooth' });
    quiz.querySelectorAll('.ct-opt').forEach(b => b.addEventListener('click', () => answer(b)));
  }
  function answer(b) {
    if (busy) return;
    const q = qs[qi], v = b.dataset.v;
    const ok = isCat(q.answer) ? v === q.answer : Math.abs(+v - +q.answer) < 1e-6 || v === String(q.answer);
    if (!ok) {
      api.mistake(); b.classList.add('wrong'); b.disabled = true; shake(api, b);
      let why = t('Not quite. Look at the chart again.');
      if (byKey[v]) { why = `${t('Not {label} — it has {n}.', { label: byKey[v].label, n: counts[v] })} ${q.hint || t('Compare the chart again.')}`; chartApi.highlight([v]); }
      else if (q.hint) why = `${t('Not quite.')} ${q.hint}`;
      api.say(why, 'bad');
      return;
    }
    busy = true;
    b.classList.add('right');
    sparkle(api, b); pop(api, b, 1.08);
    const hl = isCat(q.answer) ? [q.answer] : cats.filter(c => counts[c.key] === +q.answer).map(c => c.key);
    chartApi.highlight(hl);
    $('.ct-quiz').querySelectorAll('.ct-opt').forEach(x => { if (x !== b) x.disabled = true; });
    const why = $('.ct-why');
    const say = q.why || (isCat(q.answer) ? t('Yes — {label} with {n}.', { label: byKey[q.answer].label, n: counts[q.answer] }) : t('Yes, that is right!'));
    why.textContent = say; why.hidden = false;
    if (!api.reduced) g.from(why, { y: 10, opacity: 0, duration: .35 });
    api.say(say, 'good');
    api.progress((collecting ? .75 : .3) + (collecting ? .25 : .7) * (qi + 1) / qs.length);
    later(() => {
      busy = false;
      if (++qi < qs.length) showQ();
      else api.complete();
    }, 1700);
  }

  /* ---------- start ---------- */
  if (collecting) {
    updateDeck();
    later(dealCard, 350);
    api.say(t('Look at each observation card, then tap the matching row to add a tally mark.'), 'info');
  } else {
    Object.keys(counts).forEach(k => { const n = counts[k]; counts[k] = 0; for (let i = 0; i < n; i++) { counts[k]++; drawMark(k, false); } });
    $('.ct-desk').hidden = true;
    later(showChart, 600);
  }

  return {
    destroy() {
      timers.forEach(clearTimeout);
      api.root.removeEventListener('keydown', onKey);
      g.killTweensOf(root.querySelectorAll('*'));
    },
  };
}

export const demo = {
  title: 'Water wasters at school',
  mission: 'Your team walked round the school and noted every place where water was being wasted. Tally what you saw, build a bar chart and find the biggest waster.',
  fact: 'A tap that drips once a second can waste more than 20 litres of water in a single day.',
  kind: 'bar',
  unit: 'places',
  categories: [
    { key: 'tap', label: 'Leaking tap', sprite: 'leaking-tap', color: 'teal' },
    { key: 'tank', label: 'Overflowing tank', sprite: 'water-tank', color: 'plum' },
    { key: 'pipe', label: 'Broken pipe', sprite: 'pipe', color: 'amber' },
    { key: 'bucket', label: 'Bucket left running', sprite: 'bucket', color: 'olive' },
  ],
  collect: [
    { key: 'tap', note: 'Tap dripping in the boys’ toilet' }, { key: 'bucket', note: 'Bucket overflowing near the garden' },
    { key: 'tap', note: 'Drinking-water tap left on' }, { key: 'pipe', note: 'Cracked pipe behind the canteen' },
    { key: 'tap', note: 'Washbasin tap will not close' }, { key: 'tank', note: 'Roof tank spilling over' },
    { key: 'tap', note: 'Tap dripping in the science lab' }, { key: 'bucket', note: 'Hose filling a bucket, nobody there' },
    { key: 'tap', note: 'Kitchen tap leaking' }, { key: 'pipe', note: 'Wet patch from the pipe near the gate' },
    { key: 'tap', note: 'Girls’ toilet tap dripping' }, { key: 'tank', note: 'Tank overflow pipe running' },
  ],
  questions: [
    { ask: 'Which problem did you see most often?', answer: 'tap', why: 'Leaking taps — 6 of them! Fixing a washer is cheap and saves lots of water.' },
    { ask: 'How many water wasters did you find in all?', answer: 12, hint: 'Add up all the bars.' },
    { ask: 'How many more leaking taps than broken pipes?', answer: 4, hint: 'Leaking taps take away broken pipes.', why: '6 − 2 = 4 more leaking taps.' },
  ],
  win: 'Great survey! Share your chart with the school so the leaks get fixed.',
};
