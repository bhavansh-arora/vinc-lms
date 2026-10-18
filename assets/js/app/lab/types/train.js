// VINC Lab · train: teach a computer to recognise things, Teachable Machine style.
// 1 Collect: a "webcam" shows varied examples; hold Record on a class to suck frames into its bucket.
// 2 Train: an animated neural network learns (nodes pulse, signals flow, an accuracy line draws itself).
// 3 Test: new pictures get a prediction with confidence bars. Accuracy depends on how many samples
//   each class has, how balanced the classes are and how varied the photos were, so weak training
//   gives honest wrong guesses and the mascot explains why.
import { esc, sparkle, shuffle, onResize } from '../kit.js';

export const meta = { title: 'Teach the computer', needs: ['gsap'] };

const DEF_COLORS = ['#D98A1C', '#1F6F66', '#8C3557'];
const BGS = [
  { id: 'table', name: 'on a wooden table' }, { id: 'cloth', name: 'on a checked cloth' }, { id: 'leaves', name: 'on leaves' },
  { id: 'plain', name: 'on white paper' }, { id: 'hand', name: 'in a hand' }, { id: 'dark', name: 'in dim light' },
];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const sat = v => clamp(v, 0, 1);
function inkFor(hex) { // dark text on light class colours, white on dark ones
  const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(String(hex).trim());
  if (!m) return '#fff';
  const [r, g, b] = m.slice(1).map(x => parseInt(x, 16) / 255);
  return .299 * r + .587 * g + .114 * b > .62 ? '#2B1A10' : '#fff';
}
const r1 = n => Math.round(n * 10) / 10;
let UID = 0;

export function mount(stage, cfg, api) {
  const { gsap } = api;
  const P = `tr${++UID}`;
  const minS = Math.max(2, Math.round(cfg.minSamples || 6));
  const classes = (cfg.classes || []).slice(0, 3).map((c, i) => ({ ...c, i, color: c.tint || DEF_COLORS[i % 3], shots: [], combos: new Set() }));
  if (classes.length < 2) { stage.innerHTML = '<div class="lab-err"><p>This lab needs at least two classes.</p></div>'; return { destroy() {} }; }
  const byKey = Object.fromEntries(classes.map(c => [c.key, c]));
  const tests = (cfg.tests || []).filter(t => byKey[t.truth]);
  const timers = [];
  const later = (fn, ms) => { const t = setTimeout(fn, api.reduced ? Math.min(ms, 80) : ms); timers.push(t); return t; };
  let view = 'collect', active = classes[0], recording = null, recTimer = 0, idleTimer = 0, trained = null, rounds = 0, done = false, busy = false;

  /* ---------- tints as SVG filters (keep shading, change colour) ---------- */
  const tints = [...new Set([...classes.map(c => c.tint), ...classes.flatMap(c => (c.samples || []).map(s => s.tint)), ...tests.map(t => t.tint)].filter(Boolean))];
  const tintId = t => (t ? `${P}-t${tints.indexOf(t)}` : '');
  const tintDefs = tints.map(t => `<filter id="${tintId(t)}" color-interpolation-filters="sRGB"><feFlood flood-color="${esc(t)}" result="f"/><feComposite in="f" in2="SourceAlpha" operator="in" result="fa"/><feBlend in="fa" in2="SourceGraphic" mode="color" result="b"/><feComposite in="b" in2="SourceGraphic" operator="arithmetic" k1="0" k2=".62" k3=".38" k4="0"/></filter>`).join('');
  const filt = (tint, bright = 1, hue = 0) => `${tint ? `url(#${tintId(tint)}) ` : ''}brightness(${r1(bright * 100) / 100}) hue-rotate(${Math.round(hue)}deg)`;

  /* ---------- markup ---------- */
  const root = document.createElement('div');
  root.className = 'lab-train';
  root.innerHTML = `
    <svg class="tr-defs" width="0" height="0" aria-hidden="true"><defs>${tintDefs}</defs></svg>
    <ol class="tr-steps" aria-label="Steps">${['Collect', 'Train', 'Test'].map((s, i) => `<li class="tr-step${i === 0 ? ' on' : ''}" data-step="${i}"><b>${i + 1}</b><span>${s}</span></li>`).join('<li class="tr-step-line" aria-hidden="true"><i></i></li>')}</ol>
    <section class="tr-view tr-collect">
      <div class="tr-cam">
        <div class="tr-cam-top"><span class="tr-live"><i></i>LIVE</span><span class="tr-showing">Showing: <b></b></span></div>
        <div class="tr-screen"><div class="tr-belt"></div><div class="tr-rec" aria-hidden="true"><i></i>REC</div><div class="tr-corners" aria-hidden="true"></div><div class="tr-flashf"></div></div>
        <div class="tr-cam-base" aria-hidden="true"><span></span></div>
        <p class="tr-cam-tip">Tip: the camera shows the object at different angles, sizes and backgrounds. More variety = a smarter model.</p>
      </div>
      <div class="tr-classes">${classes.map(c => `
        <article class="tr-class" data-c="${c.i}" style="--cc:${esc(c.color)};--cc-ink:${inkFor(c.color)}">
          <header><span class="tr-cdot"></span><h3>${esc(c.label)}</h3><span class="tr-ring" aria-hidden="true"><svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="15"/><circle class="tr-ring-v" cx="18" cy="18" r="15" stroke-dasharray="94.2" stroke-dashoffset="94.2"/></svg><b>0</b></span></header>
          <div class="tr-bucket" aria-label="${esc(c.label)} samples"><p class="tr-empty">No samples yet</p></div>
          <div class="tr-cbtns"><button type="button" class="tr-recbtn" aria-label="Hold to record ${esc(c.label)}"><i></i><span>Hold to record</span></button><button type="button" class="tr-clear" aria-label="Clear ${esc(c.label)} samples" title="Clear">↺</button></div>
          <p class="tr-need">Need at least <b>${minS}</b></p>
        </article>`).join('')}</div>
      <div class="tr-go"><button type="button" class="tr-trainbtn" disabled><span aria-hidden="true">🧠</span> Train the model</button></div>
    </section>
    <section class="tr-view tr-train" hidden>
      <div class="tr-netwrap"><svg class="tr-net" viewBox="0 0 700 320" role="img" aria-label="A neural network learning"></svg></div>
      <div class="tr-stats">
        <div class="tr-epoch"><small>Epoch</small><b>0</b><span>/ <em>0</em></span></div>
        <div class="tr-chartwrap"><small>Accuracy</small><svg class="tr-chart" viewBox="0 0 300 150"><g class="tr-grid">${[0, 25, 50, 75, 100].map(v => `<line x1="34" x2="292" y1="${r1(132 - v * 1.2)}" y2="${r1(132 - v * 1.2)}"/><text x="28" y="${r1(136 - v * 1.2)}">${v}</text>`).join('')}</g><path class="tr-area" d=""/><path class="tr-line" d=""/><circle class="tr-head" r="5" cx="34" cy="132"/></svg><b class="tr-acc">0%</b></div>
        <button type="button" class="tr-testbtn" hidden><span aria-hidden="true">🔍</span> Test the model</button>
      </div>
    </section>
    <section class="tr-view tr-test" hidden>
      <div class="tr-cam tr-cam-test">
        <div class="tr-cam-top"><span class="tr-live"><i></i>PREVIEW</span><span class="tr-showing">New picture <b class="tr-tn"></b></span></div>
        <div class="tr-screen"><div class="tr-belt"></div><div class="tr-scan" aria-hidden="true"></div><div class="tr-verdict" hidden></div></div>
      </div>
      <div class="tr-pred">
        <h3 class="tr-h">The model thinks…</h3>
        <div class="tr-bars">${classes.map(c => `<div class="tr-bar" data-c="${c.i}" style="--cc:${esc(c.color)}"><span class="tr-bl">${esc(c.label)}</span><span class="tr-bt"><i></i></span><b>0%</b></div>`).join('')}</div>
        <ol class="tr-results">${tests.map((t, i) => `<li data-t="${i}" aria-label="Test ${i + 1}"></li>`).join('')}</ol>
        <div class="tr-summary" hidden></div>
      </div>
    </section>`;
  stage.append(root);
  const $ = s => root.querySelector(s);
  const cards = [...root.querySelectorAll('.tr-class')];
  onResize(api, stage, w => root.classList.toggle('is-wide', w >= 860));

  /* ---------- frames ---------- */
  let seed = 1234567;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  function variant(c) {
    const si = Math.floor(rnd() * (c.samples?.length || 1));
    const s = c.samples?.[si] || { emoji: '❓' };
    return { si, item: s, tint: s.tint || c.tint, bg: BGS[Math.floor(rnd() * BGS.length)].id, rot: Math.round((rnd() - .5) * 70), sc: r1(.7 + rnd() * .45), dx: Math.round((rnd() - .5) * 22), dy: Math.round((rnd() - .5) * 16), br: .82 + rnd() * .3, hue: (rnd() - .5) * 16 };
  }
  const frameHtml = (v, cls = 'tr-frame') => `<div class="${cls} tr-bg-${v.bg}"><div class="tr-obj" style="transform:translate(${v.dx}%, ${v.dy}%) rotate(${v.rot}deg) scale(${v.sc});filter:${filt(v.tint, v.bg === 'dark' ? v.br * .7 : v.br, v.hue)}">${api.art(v.item)}</div>${v.bg === 'hand' ? '<span class="tr-hand"></span>' : ''}</div>`;
  function showFrame(belt, v, speed = .5) {
    const el = document.createElement('div');
    el.innerHTML = frameHtml(v); const f = el.firstElementChild;
    const old = [...belt.children];
    belt.append(f);
    if (api.reduced) { old.forEach(o => o.remove()); return f; }
    gsap.fromTo(f, { xPercent: 100 }, { xPercent: 0, duration: speed, ease: 'power2.out' });
    old.forEach(o => gsap.to(o, { xPercent: -100, duration: speed, ease: 'power2.out', onComplete: () => o.remove() }));
    return f;
  }
  const camBelt = $('.tr-collect .tr-belt');
  let current = null;
  function idle() {
    clearTimeout(idleTimer);
    if (view !== 'collect' || recording) return;
    current = variant(active);
    showFrame(camBelt, current, .6);
    idleTimer = setTimeout(idle, api.reduced ? 2400 : 1500);
  }
  function setActive(c) {
    if (active === c && current) return;
    active = c;
    cards.forEach(k => k.classList.toggle('is-active', k === cards[c.i]));
    $('.tr-collect .tr-showing b').textContent = c.label;
    $('.tr-collect .tr-cam').style.setProperty('--cc', c.color);
    if (!api.reduced) gsap.fromTo('.lab-train .tr-collect .tr-screen', { filter: 'saturate(3) hue-rotate(40deg) blur(2px)' }, { filter: 'none', duration: .35, ease: 'power2.out' });
    idle();
  }

  /* ---------- recording ---------- */
  function capture() {
    const c = recording; if (!c) return;
    current = variant(c);
    const f = showFrame(camBelt, current, .16);
    c.shots.push(current); c.combos.add(`${current.si}|${current.bg}`);
    const card = cards[c.i], bucket = card.querySelector('.tr-bucket');
    bucket.querySelector('.tr-empty')?.remove();
    const th = document.createElement('div');
    th.innerHTML = frameHtml(current, 'tr-thumb'); const thumb = th.firstElementChild;
    bucket.prepend(thumb);
    const extra = bucket.querySelectorAll('.tr-thumb');
    if (extra.length > 40) extra[extra.length - 1].remove();
    updateCounts(c);
    api.sound('tick');
    if (!api.reduced) {
      const fl = $('.tr-collect .tr-flashf');
      gsap.fromTo(fl, { opacity: .55 }, { opacity: 0, duration: .25 });
      // the frame gets sucked into the bucket
      const a = f.getBoundingClientRect(), b = thumb.getBoundingClientRect(), rb = root.getBoundingClientRect();
      const ghost = document.createElement('div');
      ghost.className = 'tr-ghost'; ghost.innerHTML = frameHtml(current, 'tr-frame');
      root.append(ghost);
      gsap.set(ghost, { left: a.left - rb.left, top: a.top - rb.top, width: a.width, height: a.height });
      const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
      gsap.set(thumb, { opacity: 0 });
      gsap.to(ghost, { duration: .55, ease: 'power3.in', scale: b.width / a.width, rotation: (Math.random() - .5) * 40, motionPath: { path: [{ x: 0, y: 0 }, { x: dx * .35, y: dy * .2 - 40 }, { x: dx, y: dy }], curviness: 1.3 }, onComplete: () => { ghost.remove(); gsap.to(thumb, { opacity: 1, duration: .1 }); gsap.fromTo(thumb, { scale: 1.5 }, { scale: 1, duration: .3, ease: 'back.out(3)' }); } });
    }
  }
  function startRec(c) {
    if (view !== 'collect' || done) return;
    if (recording) stopRec();
    setActive(c);
    recording = c;
    cards[c.i].classList.add('is-rec'); root.classList.add('is-recording');
    clearTimeout(idleTimer);
    capture();
    recTimer = setInterval(capture, api.reduced ? 260 : 210);
  }
  function stopRec() {
    if (!recording) return;
    const c = recording; recording = null;
    clearInterval(recTimer);
    cards[c.i].classList.remove('is-rec'); root.classList.remove('is-recording');
    const n = c.shots.length;
    if (n < minS) api.say(`${c.label}: ${n} sample${n === 1 ? '' : 's'}. Keep holding to collect at least ${minS}.`, 'hint');
    else {
      const others = classes.filter(o => o.shots.length < minS);
      api.say(others.length ? `Great, ${n} samples of ${c.label}! Now show the camera some ${others[0].label}.` : `Every class has enough samples. Check they are balanced, then press Train!`, others.length ? 'info' : 'good');
    }
    later(idle, 500);
  }
  function updateCounts(c) {
    const card = cards[c.i], n = c.shots.length;
    card.querySelector('.tr-ring b').textContent = n;
    card.querySelector('.tr-ring-v').setAttribute('stroke-dashoffset', r1(94.2 * (1 - sat(n / minS))));
    card.classList.toggle('is-enough', n >= minS);
    if (n === minS) { api.sound('pop'); sparkle(api, card.querySelector('.tr-ring')); }
    const ready = classes.every(k => k.shots.length >= 2);
    $('.tr-trainbtn').disabled = !ready;
    $('.tr-trainbtn').classList.toggle('ready', classes.every(k => k.shots.length >= minS));
    if (view === 'collect') api.progress(.4 * classes.reduce((s2, k) => s2 + sat(k.shots.length / minS), 0) / classes.length);
  }
  cards.forEach((card, i) => {
    const c = classes[i], btn = card.querySelector('.tr-recbtn');
    btn.addEventListener('pointerdown', e => { e.preventDefault(); btn.setPointerCapture?.(e.pointerId); startRec(c); });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => btn.addEventListener(ev, () => recording === c && stopRec()));
    btn.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); startRec(c); } });
    btn.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); stopRec(); } });
    btn.addEventListener('contextmenu', e => e.preventDefault());
    card.querySelector('header').addEventListener('click', () => { setActive(c); api.sound('click'); });
    card.querySelector('.tr-clear').addEventListener('click', () => {
      if (!c.shots.length) return;
      c.shots = []; c.combos.clear();
      const b = card.querySelector('.tr-bucket');
      const go = () => { b.innerHTML = '<p class="tr-empty">No samples yet</p>'; };
      if (api.reduced) go(); else gsap.to(b.querySelectorAll('.tr-thumb'), { scale: 0, opacity: 0, duration: .25, stagger: .01, onComplete: go });
      updateCounts(c); api.sound('whoosh');
      api.say(`Cleared ${c.label}. Record again!`);
    });
  });

  /* ---------- the model (a simple, explainable stand-in for real training) ---------- */
  function model() {
    const maxN = Math.max(...classes.map(c => c.shots.length));
    const m = {};
    for (const c of classes) {
      const n = c.shots.length, kinds = Math.max(1, (c.samples?.length || 1) * BGS.length);
      const strength = .75 * sat(n / (1.25 * minS)) + .25 * sat(c.combos.size / Math.min(minS, kinds));
      const bal = maxN ? n / maxN : 0;
      m[c.key] = { n, strength, bal, q: strength * (.6 + .4 * bal), variety: c.combos.size };
    }
    return m;
  }
  function predict(M) {
    // difficulty spread evenly inside each class, in a shuffled order
    const out = [];
    for (const c of classes) {
      const ts = tests.map((t, i) => ({ t, i })).filter(x => x.t.truth === c.key);
      const order = shuffle(ts.map((_, j) => j), 97 + c.i * 13);
      ts.forEach((x, j) => { out[x.i] = { d: (order[j] + .5) / ts.length * .95 }; });
    }
    return tests.map((t, i) => {
      const T = byKey[t.truth], q = M[t.truth].q, d = out[i].d;
      const ok = q > d;
      const others = classes.filter(c => c !== T);
      const guess = ok ? T : others.reduce((a, b) => (M[b.key].n > M[a.key].n ? b : a));
      const conf = {};
      if (ok) {
        conf[T.key] = clamp(.55 + (q - d) * .7, .52, .98);
      } else conf[guess.key] = clamp(.5 + (d - q) * .9, .48, .86);
      const rest = 1 - (conf[guess.key] || 0);
      const share = classes.filter(c => !(c.key in conf));
      const wsum = share.reduce((s, c) => s + M[c.key].n + 1 + (c === T ? 4 : 0), 0);
      share.forEach(c => { conf[c.key] = rest * (M[c.key].n + 1 + (c === T ? 4 : 0)) / wsum; });
      return { ok, guess, conf };
    });
  }

  /* ---------- 2 · train ---------- */
  function goStep(n) {
    root.querySelectorAll('.tr-step').forEach((s, i) => { s.classList.toggle('on', i === n); s.classList.toggle('done', i < n); });
    root.querySelectorAll('.tr-step-line').forEach((l, i) => l.classList.toggle('done', i < n));
    const v = ['collect', 'train', 'test'][n];
    root.querySelectorAll('.tr-view').forEach(s => { s.hidden = !s.classList.contains(`tr-${v}`); });
    view = v;
    const sec = $(`.tr-${v}`);
    if (!api.reduced) gsap.from(sec, { x: 40, opacity: 0, duration: .45, ease: 'power3.out' });
    stage.scrollTop = 0;
  }
  $('.tr-trainbtn').addEventListener('click', () => {
    if (busy || done) return;
    stopRec(); clearTimeout(idleTimer);
    const low = classes.filter(c => c.shots.length < minS);
    if (low.length) api.say(`Training with only ${low.map(c => `${c.shots.length} ${c.label}`).join(' and ')} sample${low.length > 1 ? 's' : ''}… let's see how it does!`, 'hint');
    else api.say('Training! The computer looks at every sample again and again, and slowly finds patterns.');
    trained = model();
    goStep(1);
    runTraining();
  });

  function buildNet() {
    const net = $('.tr-net');
    const L = [[70, 5], [230, 6], [390, 6], [550, classes.length]];
    const ys = n => Array.from({ length: n }, (_, i) => r1(160 + (i - (n - 1) / 2) * (n > 3 ? 46 : 78)));
    const nodes = L.map(([x, n]) => ys(n).map(y => ({ x, y })));
    let lines = '';
    for (let l = 0; l < 3; l++) for (const a of nodes[l]) for (const b of nodes[l + 1]) lines += `<line class="tr-w" data-l="${l}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/>`;
    const thumbs = classes.flatMap(c => c.shots.slice(0, 2)).slice(0, 5);
    net.innerHTML = `<g class="tr-ws">${lines}</g><g class="tr-sigs"></g>
      ${nodes.map((ln, l) => ln.map((p, j) => `<g class="tr-node tr-node-${l}" transform="translate(${p.x} ${p.y})"><circle r="${l === 3 ? 17 : 13}" ${l === 3 ? `style="--cc:${classes[j].color}"` : ''}/></g>`).join('')).join('')}
      ${classes.map((c, j) => `<text class="tr-olab" x="${578}" y="${nodes[3][j].y}" dominant-baseline="central">${esc(c.label.length > 17 ? `${c.label.slice(0, 16)}…` : c.label)}</text>`).join('')}
      <g class="tr-inputs">${nodes[0].map((p, j) => `<g transform="translate(14 ${p.y - 17})"><rect width="34" height="34" rx="7" class="tr-in-bg" style="fill:${thumbs[j] ? classes.find(c => c.shots.includes(thumbs[j])).color : '#ccc'}"/><foreignObject width="34" height="34"><div xmlns="http://www.w3.org/1999/xhtml" class="tr-in-art">${thumbs[j] ? api.art(thumbs[j].item) : ''}</div></foreignObject></g>`).join('')}</g>
      <text class="tr-layer" x="70" y="22" text-anchor="middle">Input</text><text class="tr-layer" x="310" y="22" text-anchor="middle">Hidden layers</text><text class="tr-layer" x="550" y="22" text-anchor="middle">Output</text>`;
    return { net, nodes };
  }
  function runTraining() {
    busy = true;
    const { net, nodes } = buildNet();
    const M = trained;
    const final = clamp(classes.reduce((s, c) => s + M[c.key].q, 0) / classes.length, .35, .99);
    const E = api.reduced ? 8 : 24;
    $('.tr-epoch em').textContent = E;
    $('.tr-testbtn').hidden = true;
    const pts = [];
    const ws = [...net.querySelectorAll('.tr-w')];
    const start = 1 / classes.length;
    let e = 0;
    const step = () => {
      if (done || view !== 'train') return;
      e++;
      const acc = start + (final - start) * (1 - Math.exp(-e / (E / 4))) / (1 - Math.exp(-4)) + (e < E ? (Math.random() - .5) * .05 : 0);
      pts.push([34 + (e / E) * 258, 132 - clamp(acc, 0, 1) * 120]);
      $('.tr-epoch b').textContent = e;
      $('.tr-acc').textContent = `${Math.round(clamp(acc, 0, 1) * 100)}%`;
      const d = `M34 ${r1(132 - start * 120)}${pts.map(([x, y]) => `L${r1(x)} ${r1(y)}`).join('')}`;
      $('.tr-line').setAttribute('d', d);
      $('.tr-area').setAttribute('d', `${d}L${r1(pts.at(-1)[0])} 132L34 132Z`);
      $('.tr-head').setAttribute('cx', r1(pts.at(-1)[0])); $('.tr-head').setAttribute('cy', r1(pts.at(-1)[1]));
      api.progress(.4 + .25 * e / E);
      if (!api.reduced) {
        // a wave of signals flows left to right; weights change thickness as they learn
        const sigs = net.querySelector('.tr-sigs');
        for (let l = 0; l < 3; l++) {
          const pick = ws.filter(w => +w.dataset.l === l).sort(() => Math.random() - .5).slice(0, 4);
          pick.forEach(w => {
            const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            c.setAttribute('r', 4); c.setAttribute('class', 'tr-sig'); sigs.append(c);
            const x1 = +w.getAttribute('x1'), y1 = +w.getAttribute('y1'), x2 = +w.getAttribute('x2'), y2 = +w.getAttribute('y2');
            c.setAttribute('cx', x1); c.setAttribute('cy', y1);
            const o = { t: 0 };
            gsap.to(o, { t: 1, duration: .32, delay: l * .1, ease: 'none', onUpdate: () => { c.setAttribute('cx', r1(x1 + (x2 - x1) * o.t)); c.setAttribute('cy', r1(y1 + (y2 - y1) * o.t)); }, onComplete: () => c.remove() });
            gsap.fromTo(w, { strokeOpacity: .95 }, { strokeOpacity: .28, duration: .5, delay: l * .1 });
            gsap.to(w, { strokeWidth: .6 + Math.random() * 2.8 * (e / E + .2), duration: .3 });
          });
          gsap.fromTo(net.querySelectorAll(`.tr-node-${l + 1} circle`), { scale: 1, transformOrigin: '50% 50%' }, { scale: 1.25, duration: .12, yoyo: true, repeat: 1, delay: l * .1 + .25 });
        }
        api.sound('tick');
      }
      if (e < E) later(step, api.reduced ? 30 : 170);
      else finishTraining(final);
    };
    if (!api.reduced) gsap.from(net.querySelectorAll('.tr-node'), { scale: 0, transformOrigin: '50% 50%', duration: .4, stagger: .02, ease: 'back.out(3)' });
    later(step, 500);
  }
  function finishTraining(final) {
    busy = false;
    api.sound('good');
    const net = $('.tr-net');
    net.classList.add('is-trained');
    const btn = $('.tr-testbtn'); btn.hidden = false;
    if (!api.reduced) { gsap.from(btn, { scale: .6, opacity: 0, duration: .5, ease: 'back.out(2.5)' }); sparkle(api, $('.tr-acc')); }
    api.say(`Training done! On its own samples it gets about ${Math.round(final * 100)}% right. But the real test is pictures it has never seen…`, 'good');
    btn.focus({ preventScroll: true });
  }
  $('.tr-testbtn').addEventListener('click', () => { if (!busy) { goStep(2); runTests(); } });

  /* ---------- 3 · test ---------- */
  const testBelt = $('.tr-test .tr-belt');
  function runTests() {
    busy = true; rounds++;
    const R = predict(trained);
    root.querySelectorAll('.tr-results li').forEach(li => { li.className = ''; li.innerHTML = ''; });
    $('.tr-summary').hidden = true; $('.tr-summary').innerHTML = '';
    let i = 0, right = 0;
    const next = () => {
      if (done || view !== 'test') return;
      if (i >= tests.length) { summary(R, right); return; }
      const t = tests[i], r = R[i];
      const v = { si: 0, item: t, tint: t.tint, bg: BGS[(i * 2 + rounds) % BGS.length].id, rot: Math.round((rnd() - .5) * 30), sc: .9, dx: 0, dy: 0, br: 1, hue: 0 };
      showFrame(testBelt, v, .45);
      $('.tr-tn').textContent = `${i + 1} of ${tests.length}`;
      const vd = $('.tr-verdict'); vd.hidden = true;
      root.querySelectorAll('.tr-bar').forEach(b => { b.classList.remove('top'); b.querySelector('i').style.transform = 'scaleX(0)'; b.querySelector('b').textContent = '0%'; });
      const scan = $('.tr-scan');
      if (!api.reduced) gsap.fromTo(scan, { yPercent: -100, opacity: 1 }, { yPercent: 100, opacity: .2, duration: .7, ease: 'power1.inOut', delay: .3 });
      later(() => {
        classes.forEach(c => {
          const bar = root.querySelector(`.tr-bar[data-c="${c.i}"]`), val = r.conf[c.key] || 0;
          const o = { v: 0 };
          if (api.reduced) { bar.querySelector('i').style.transform = `scaleX(${val})`; bar.querySelector('b').textContent = `${Math.round(val * 100)}%`; }
          else {
            gsap.to(bar.querySelector('i'), { scaleX: val, duration: .7, ease: 'power3.out' });
            gsap.to(o, { v: val, duration: .7, ease: 'power3.out', onUpdate: () => { bar.querySelector('b').textContent = `${Math.round(o.v * 100)}%`; } });
          }
          bar.classList.toggle('top', c === r.guess);
        });
      }, 950);
      later(() => {
        const T = byKey[t.truth];
        vd.hidden = false;
        vd.className = `tr-verdict ${r.ok ? 'ok' : 'no'}`;
        vd.innerHTML = r.ok ? `<b>✓</b> ${esc(r.guess.label)}` : `<b>✗</b> Said ${esc(r.guess.label)}<small>It was really ${esc(T.label)}</small>`;
        if (!api.reduced) gsap.fromTo(vd, { scale: .4, rotation: -8, opacity: 0 }, { scale: 1, rotation: 0, opacity: 1, duration: .45, ease: 'back.out(2.6)' });
        const li = root.querySelector(`.tr-results li[data-t="${i}"]`);
        li.className = r.ok ? 'ok' : 'no'; li.innerHTML = r.ok ? '✓' : '✗';
        if (!api.reduced) gsap.fromTo(li, { scale: 0 }, { scale: 1, duration: .4, ease: 'back.out(3)' });
        api.sound(r.ok ? 'pop' : 'bad');
        if (r.ok) right++;
        api.progress(.65 + .3 * (i + 1) / tests.length);
        i++;
        later(next, 1250);
      }, 1800);
    };
    api.say('Here come new pictures the model has never seen. Watch its guesses!');
    later(next, 400);
  }
  function why(R) {
    const M = trained;
    const wrong = tests.map((t, i) => ({ t, r: R[i] })).filter(x => !x.r.ok);
    if (!wrong.length) return '';
    const T = byKey[wrong[0].t.truth], g = wrong[0].r.guess, m = M[T.key];
    const big = classes.reduce((a, b) => (M[b.key].n > M[a.key].n ? b : a));
    if (m.n < minS) return `It mixed up ${T.label}: you showed it only ${m.n} ${T.label} sample${m.n === 1 ? '' : 's'}. Collect at least ${minS}.`;
    if (m.bal < .7 && big !== T) return `It guessed ${g.label} too often because it saw ${M[big.key].n} ${big.label} samples but only ${m.n} of ${T.label}. Balance your classes.`;
    return `It got confused by new backgrounds and angles. Add more varied ${T.label} samples (hold Record longer).`;
  }
  function summary(R, right) {
    busy = false;
    const pct = Math.round(right / tests.length * 100);
    const pass = pct >= 75;
    const s = $('.tr-summary');
    s.hidden = false;
    s.className = `tr-summary ${pass ? 'pass' : 'fail'}`;
    const C = 2 * Math.PI * 26;
    s.innerHTML = `<div class="tr-score"><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="26"/><circle class="tr-score-v" cx="32" cy="32" r="26" stroke-dasharray="${r1(C)}" stroke-dashoffset="${r1(C)}"/></svg><b>${pct}%</b></div>
      <div><p><b>${right} of ${tests.length} correct.</b> ${pass ? (right === tests.length ? 'A perfect score!' : 'That passes the 75% mark!') : 'It needs 75% to pass.'}</p>${pass ? '' : `<p class="tr-why">${esc(why(R))}</p><div class="tr-sbtns"><button type="button" class="tr-more">📸 Collect more samples</button><button type="button" class="tr-retest ghost">🔁 Test again</button></div>`}</div>`;
    s.scrollIntoView({ block: 'nearest', behavior: api.reduced ? 'auto' : 'smooth' });
    if (!api.reduced) { gsap.from(s, { y: 20, opacity: 0, duration: .5, ease: 'back.out(2)' }); gsap.to(s.querySelector('.tr-score-v'), { strokeDashoffset: C * (1 - pct / 100), duration: 1, ease: 'power2.out' }); }
    else s.querySelector('.tr-score-v').style.strokeDashoffset = C * (1 - pct / 100);
    if (pass) {
      done = true;
      const extra = right < tests.length ? ` ${why(R)}` : '';
      api.say(`Your model passed with ${pct}%!${extra}`, 'good');
      later(() => api.complete({ message: cfg.win || `Your model scored ${pct}% on new pictures. Well trained!` }), 2200);
    } else {
      api.mistake();
      api.say(why(R), 'bad');
      s.querySelector('.tr-more').onclick = () => { goStep(0); later(idle, 300); api.say('Add more samples. Focus on the class the model got wrong, and keep the classes balanced.', 'hint'); };
      s.querySelector('.tr-retest').onclick = () => { api.say('Same model, same pictures: it will make the same mistakes. A model only gets better with better data!', 'hint'); };
    }
  }

  /* ---------- start ---------- */
  root.querySelectorAll('.tr-step').forEach(s => s.addEventListener('click', () => {
    if (+s.dataset.step === 0 && view === 'test' && !busy && !done) { goStep(0); later(idle, 300); }
  }));
  setActive(classes[0]);
  api.say(`Hold the red Record button on a class to show the camera examples. Collect at least ${minS} for every class, then train your model.`);
  if (!api.reduced) {
    gsap.from(cards, { x: 30, opacity: 0, duration: .5, stagger: .1, ease: 'power3.out', delay: .2 });
    gsap.from('.lab-train .tr-collect .tr-cam', { scale: .9, opacity: 0, duration: .55, ease: 'back.out(1.6)', delay: .1 });
  }

  return {
    destroy() {
      timers.forEach(clearTimeout); clearTimeout(idleTimer); clearInterval(recTimer);
      gsap.killTweensOf(root.querySelectorAll('*'));
      root.querySelectorAll('.tr-ghost').forEach(n => n.remove());
    },
  };
}

export const demo = {
  type: 'train',
  title: 'Leaf Doctor AI',
  mission: 'Teach the computer to tell a healthy leaf from a sick, spotted leaf, so farmers can catch plant disease early. Record varied samples for each class, train, then test.',
  fact: 'Apps that spot plant diseases from a phone photo are trained on lakhs of leaf pictures, taken in many fields, at many angles and in different light.',
  classes: [
    { key: 'healthy', label: 'Healthy leaf', tint: '#4C9A35', samples: [{ sprite: 'leaf', emoji: '🍃' }, { sprite: 'peepal-leaf', emoji: '🌿' }, { sprite: 'spinach', emoji: '🥬' }] },
    { key: 'sick', label: 'Sick leaf', tint: '#B5832A', samples: [{ sprite: 'leaf', emoji: '🍂', tint: '#A0522D' }, { sprite: 'dry-leaves', emoji: '🍂' }, { sprite: 'peepal-leaf', emoji: '🍁', tint: '#C9A227' }] },
  ],
  tests: [
    { sprite: 'leaf', emoji: '🍃', truth: 'healthy' },
    { sprite: 'dry-leaves', emoji: '🍂', truth: 'sick' },
    { sprite: 'spinach', emoji: '🥬', truth: 'healthy' },
    { sprite: 'leaf', emoji: '🍂', tint: '#B07030', truth: 'sick' },
    { sprite: 'peepal-leaf', emoji: '🌿', truth: 'healthy' },
    { sprite: 'peepal-leaf', emoji: '🍁', tint: '#C9A227', truth: 'sick' },
  ],
  minSamples: 6,
  win: 'Your Leaf Doctor learnt to spot sick leaves! Real farm apps work the same way, with many more photos.',
};
