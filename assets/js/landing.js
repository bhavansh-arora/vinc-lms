// VINC Lab landing page behaviour.
import { COURSES, GRADES, FORMS, WEIGHTS, LEARNING_OUTCOMES, projectById, projectsOfGrade } from './data/courses.js';
import { art, icon } from './art.js';

const LEADS_INBOX = 'vincdeeptech@gmail.com';
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cssVar = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const FORM_VAR = { life: '--olive', machines: '--rust', services: '--plum' };
const DEMO_LOGIN = { 6: 'student', 7: 'student7', 8: 'student8' };
const TECH = { 6: 'Scratch games and simple machines', 7: 'An AI Assistant with Teachable Machine', 8: 'Home Automation with Arduino' };
let courseGrade = 6;

/* ---------- Theme ---------- */
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
};
const savedTheme = store.get('vinclab-theme');
if (savedTheme) document.documentElement.dataset.theme = savedTheme;
$('#theme-btn').addEventListener('click', () => {
  const dark = document.documentElement.dataset.theme
    ? document.documentElement.dataset.theme === 'dark'
    : matchMedia('(prefers-color-scheme: dark)').matches;
  const next = dark ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  store.set('vinclab-theme', next);
  drawDonut();
});

/* ---------- Header ---------- */
const menuBtn = $('#menu-btn'), nav = $('#nav');
menuBtn.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', open);
});
$$('#nav a').forEach(a => a.addEventListener('click', () => { nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); }));
const bar = $('#progress-bar');
const timeline = $('#timeline');
function onScroll() {
  const h = document.documentElement;
  bar.style.transform = `scaleX(${h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight)})`;
  const r = timeline.getBoundingClientRect();
  const p = Math.min(1, Math.max(0, (innerHeight * 0.75 - r.top) / r.height));
  timeline.style.setProperty('--tp', p.toFixed(3));
}
addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ---------- Hero canvas: bubbles rising through a soft node network ---------- */
(function heroCanvas() {
  const c = $('#bg-canvas'); const ctx = c.getContext('2d');
  let w, h, dpr, nodes = [], bubbles = [], mouse = { x: -999, y: -999 };
  const palette = () => [cssVar('--olive'), cssVar('--amber'), cssVar('--rust'), cssVar('--plum'), cssVar('--teal')];
  let colors = palette();
  function size() {
    dpr = Math.min(2, devicePixelRatio || 1);
    w = c.clientWidth; h = c.clientHeight;
    c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(Math.min(46, w * h / 26000));
    nodes = Array.from({ length: n }, (_, i) => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25, c: i % 5 }));
    bubbles = Array.from({ length: Math.round(n * .6) }, () => newBubble(true));
  }
  function newBubble(anywhere) {
    return { x: Math.random() * w, y: anywhere ? Math.random() * h : h + 20, r: 2 + Math.random() * 7, s: .25 + Math.random() * .6, ph: Math.random() * 6.28, c: Math.floor(Math.random() * 5) };
  }
  function frame(t) {
    ctx.clearRect(0, 0, w, h);
    for (const a of nodes) {
      a.x += a.vx; a.y += a.vy;
      const dx = mouse.x - a.x, dy = mouse.y - a.y, d = Math.hypot(dx, dy);
      if (d < 160) { a.x += dx * .004; a.y += dy * .004; }
      if (a.x < 0 || a.x > w) a.vx *= -1;
      if (a.y < 0 || a.y > h) a.vy *= -1;
    }
    ctx.lineWidth = 1;
    for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j], d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d < 130) { ctx.globalAlpha = (1 - d / 130) * .22; ctx.strokeStyle = colors[a.c]; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
    }
    for (const a of nodes) { ctx.globalAlpha = .55; ctx.fillStyle = colors[a.c]; ctx.beginPath(); ctx.arc(a.x, a.y, 2.4, 0, 6.28); ctx.fill(); }
    for (const b of bubbles) {
      b.y -= b.s; b.x += Math.sin(t / 900 + b.ph) * .3;
      if (b.y < -20) Object.assign(b, newBubble(false));
      ctx.globalAlpha = .18; ctx.strokeStyle = colors[b.c]; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 6.28); ctx.stroke();
      ctx.globalAlpha = .08; ctx.fillStyle = colors[b.c]; ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (!REDUCED) requestAnimationFrame(frame);
  }
  c.parentElement.addEventListener('pointermove', e => { const r = c.getBoundingClientRect(); mouse = { x: e.clientX - r.left, y: e.clientY - r.top }; });
  c.parentElement.addEventListener('pointerleave', () => { mouse = { x: -999, y: -999 }; });
  addEventListener('resize', size);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colors = palette(); });
  $('#theme-btn').addEventListener('click', () => setTimeout(() => { colors = palette(); }, 20));
  size(); requestAnimationFrame(frame);
})();

/* ---------- Orbit ---------- */
(function orbit() {
  const o = $('#orbit'); const planets = $$('.planet', o); const cap = $('#orbit-caption');
  const ICON = { life: 'leaf', machines: 'gear', services: 'hand' };
  planets.forEach(p => { $('.pi', p).innerHTML = icon(ICON[p.dataset.form]); });
  let angle = -90, paused = false, holdUntil = 0, last = performance.now();
  function place() {
    const rad = o.clientWidth * 0.42;
    planets.forEach((p, i) => {
      const a = (angle + i * 120) * Math.PI / 180;
      p.style.transform = `translate(${Math.cos(a) * rad}px, ${Math.sin(a) * rad}px)`;
    });
  }
  function tick(t) {
    if (!paused && !REDUCED && t > holdUntil) angle += (t - last) * 0.008;
    last = t; place(); requestAnimationFrame(tick);
  }
  o.addEventListener('pointerenter', () => { paused = true; });
  o.addEventListener('pointerleave', () => { paused = false; });
  o.addEventListener('pointerdown', () => { holdUntil = performance.now() + 6000; });
  o.addEventListener('focusin', () => { paused = true; });
  o.addEventListener('pointermove', e => {
    const r = o.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    $('.core', o).style.transform = `translate(${x * 14}px, ${y * 14}px)`;
  });
  planets.forEach(p => p.addEventListener('click', () => {
    planets.forEach(q => q.setAttribute('aria-pressed', q === p));
    const f = FORMS[p.dataset.form];
    cap.innerHTML = `<strong>${esc(f.name)}</strong><span class="muted">Two projects in every grade. Schools pick one each year.</span>
      ${GRADES.map(g => `<span class="pills"><span class="chip g-chip g${g}">Grade ${g}</span>${projectsOfGrade(g).filter(x => x.form === f.key).map(x => `<a class="chip" href="#course" data-open="${x.id}">${esc(x.title)}</a>`).join('')}</span>`).join('')}`;
    $$('[data-open]', cap).forEach(a => a.addEventListener('click', e => { e.preventDefault(); openDrawer(a.dataset.open); }));
  }));
  requestAnimationFrame(tick);
})();

/* ---------- Count-up numbers ---------- */
function countUp(el) {
  const to = +el.dataset.to; if (REDUCED) { el.textContent = to; return; }
  const t0 = performance.now(), ms = 1200;
  const step = t => { const k = Math.min(1, (t - t0) / ms); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}

/* ---------- Projects ---------- */
const grid = $('#projects');
let formFilter = 'all';
function renderProjects(animate) {
grid.innerHTML = projectsOfGrade(courseGrade).map(p => `
  <button class="pcard f-${p.form} reveal" data-id="${p.id}" data-form="${p.form}" aria-haspopup="dialog">
    <div class="art-box">${art(p.art)}</div>
    <div class="meta"><span class="form-tag">${esc(FORMS[p.form].short)}</span><span class="chip">Grade ${p.grade} · ${p.periods} periods</span></div>
    <h3>${esc(p.title)}</h3>
    <p>${esc(p.tagline)}</p>
    <span class="more">See the ${p.activities.length} activities ${icon('arrow')}</span>
  </button>`).join('');
grid.classList.toggle('swap', !!animate);
$$('.pcard', grid).forEach(card => {
  if (animate) card.classList.add('in');
  card.classList.toggle('dim', formFilter !== 'all' && card.dataset.form !== formFilter);
  card.addEventListener('click', () => openDrawer(card.dataset.id));
  card.addEventListener('pointermove', e => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
  });
});
}
renderProjects(false);
$$('.filter').forEach(b => b.addEventListener('click', () => {
  $$('.filter').forEach(x => x.setAttribute('aria-pressed', x === b));
  formFilter = b.dataset.filter;
  $$('.pcard', grid).forEach(c => c.classList.toggle('dim', formFilter !== 'all' && c.dataset.form !== formFilter));
}));
// Grade tabs for the course explorer
const gtabs = $('#grade-tabs');
gtabs.innerHTML = GRADES.map(g => `<button role="tab" class="g${g}" data-g="${g}" aria-selected="${g === courseGrade}" tabindex="${g === courseGrade ? 0 : -1}"><span class="gn">${g}</span>Grade ${g}</button>`).join('');
function selectGrade(g) {
  courseGrade = g;
  $$('[data-g]', gtabs).forEach(b => { const on = +b.dataset.g === g; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; });
  renderProjects(true);
}
$$('[data-g]', gtabs).forEach((b, i, all) => {
  b.addEventListener('click', () => selectGrade(+b.dataset.g));
  b.addEventListener('keydown', e => { if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return; const n = all[(i + (e.key === 'ArrowRight' ? 1 : all.length - 1)) % all.length]; selectGrade(+n.dataset.g); n.focus(); });
});

const drawer = $('#drawer'), inner = $('#drawer-inner');
function openDrawer(id) {
  const p = projectById(id); if (!p) return;
  const f = FORMS[p.form];
  inner.className = `drawer-inner f-${p.form}`;
  inner.innerHTML = `
    <button class="x" aria-label="Close">${icon('close')}</button>
    <p class="label" style="color:var(--f)">Grade ${p.grade} · ${esc(f.name)} · Project ${p.num}</p>
    <h2 id="drawer-title">${esc(p.title)}</h2>
    <p class="lead-sm">${esc(p.summary)}</p>
    <div class="facts"><span class="chip">${icon('book')} Kaushal Bodh Grade ${p.grade}, pp. ${p.pages[0]}–${p.pages[1]}</span><span class="chip">${icon('calendar')} ${p.periods} periods</span><span class="chip">${icon('school')} ${esc(p.subjects)}</span></div>
    <div class="art-box">${art(p.art)}</div>
    <h4>Activities</h4>
    <ol class="acts">${p.activities.map(a => `<li><span class="n">${a.n}</span><div><b>${esc(a.title)}</b><small>${esc(a.task)}</small></div><span class="pg">p. ${a.page}</span></li>`).join('')}</ol>
    <div class="cols2">
      <div><h4>Students will</h4><ul>${p.goals.map(g => `<li>${esc(g)}</li>`).join('')}</ul></div>
      <div><h4>Safety first</h4><ul>${p.safety.map(g => `<li>${esc(g)}</li>`).join('')}</ul></div>
      <div><h4>You'll need</h4><ul>${p.materials.map(g => `<li>${esc(g)}</li>`).join('')}</ul></div>
      <div><h4>Careers to explore</h4><ul>${p.careers.map(g => `<li>${esc(g)}</li>`).join('')}</ul></div>
    </div>
    <h4>How it's assessed</h4>
    <div class="weights-mini">${WEIGHTS.map((w, i) => `<i style="width:${w.weight}%;background:${segColor(i)}"></i>`).join('')}</div>
    <p class="small muted">${p.quiz.length}-question quiz · ${p.viva.length} viva prompts · activity book · portfolio · observation rubric</p>
    <p><a class="btn btn-primary" href="app.html#/login/${DEMO_LOGIN[p.grade]}">Open a Grade ${p.grade} student demo</a></p>`;
  $('.x', inner).addEventListener('click', () => drawer.close());
  drawer.showModal();
  inner.scrollTop = 0;
}
drawer.addEventListener('click', e => { if (e.target === drawer) drawer.close(); });

/* ---------- Planner ---------- */
const DEFAULT_PICKS = { 6: { life: 'g6p1', machines: 'g6p3', services: 'g6p6' }, 7: { life: 'g7p1', machines: 'g7p4', services: 'g7p6' }, 8: { life: 'g8p1', machines: 'g8p4', services: 'g8p5' } };
let planGrade = 6;
let picks = { ...DEFAULT_PICKS[6] };
const pickWrap = $('#planner-picks');
const pgTabs = $('#plan-grades');
pgTabs.innerHTML = GRADES.map(g => `<button class="g${g}" data-pg="${g}" aria-pressed="${g === planGrade}"><span class="gn">${g}</span>Grade ${g}</button>`).join('');
$$('[data-pg]', pgTabs).forEach(b => b.addEventListener('click', () => {
  planGrade = +b.dataset.pg; picks = { ...DEFAULT_PICKS[planGrade] };
  $$('[data-pg]', pgTabs).forEach(x => x.setAttribute('aria-pressed', x === b));
  renderPicks(); renderPlan();
}));
function renderPicks() {
  pickWrap.innerHTML = Object.values(FORMS).map(f => `
  <div class="pick-group f-${f.key}" role="group" aria-labelledby="pg-${f.key}">
    <h3 id="pg-${f.key}">${esc(f.name)}</h3>
    <div class="opts">${projectsOfGrade(planGrade).filter(p => p.form === f.key).map(p => `<button class="pick" data-form="${f.key}" data-id="${p.id}" aria-pressed="${picks[f.key] === p.id}">${esc(p.title)}<small>${p.periods} periods</small></button>`).join('')}</div>
  </div>`).join('');
  $$('.pick', pickWrap).forEach(b => b.addEventListener('click', () => {
    const f = b.dataset.form;
    picks[f] = picks[f] === b.dataset.id ? null : b.dataset.id;
    $$(`.pick[data-form="${f}"]`, pickWrap).forEach(x => x.setAttribute('aria-pressed', picks[f] === x.dataset.id));
    renderPlan();
  }));
}
renderPicks();
function renderPlan() {
  const total = COURSES[planGrade].periodsPerYear; // 160 periods ≈ 40 weeks × 4
  const chosen = ['life', 'machines', 'services'].map(f => projectById(picks[f])).filter(Boolean);
  const used = chosen.reduce((s, p) => s + p.periods, 0);
  const mela = 4;
  const free = Math.max(0, total - used - mela);
  const over = used + mela - total;
  const tl = $('#tl');
  tl.innerHTML = chosen.map(p => `<div class="seg ${p.form}" style="flex-grow:${p.periods}" title="${esc(p.title)}"><b>${esc(p.title)}</b><small>${Math.round(p.periods / 4)} wks · ${p.periods} periods</small></div>`).join('')
    + (chosen.length < 3 ? `<div class="seg empty" style="flex-grow:${Math.max(20, free)}"><b>Pick ${3 - chosen.length} more</b></div>` : (free > 0 ? `<div class="seg empty" style="flex-grow:${free}"><b>Buffer</b><small>${free} periods</small></div>` : ''))
    + `<div class="seg mela" style="flex-grow:${mela}"><b>Mela</b></div>`;
  const hours = Math.round(used * 40 / 60);
  let note = 'CBSE asks for one project from each form of work every year.';
  if (chosen.length === 3) note = over > 0
    ? `A complete Kaushal Bodh year, ${over} period${over > 1 ? 's' : ''} over the usual 160. Use a Saturday period or shorten one activity.`
    : `A complete Kaushal Bodh year with ${free} periods spare for revision, the viva week and Mela preparation.`;
  $('#planner-sum').innerHTML = `
    <div><b>${used}</b><span>project periods (about ${total} in a year)</span></div>
    <div><b>${hours} h</b><span>of hands-on work, of the 110 h CBSE asks for</span></div>
    <div><b>${chosen.length}/3</b><span>forms of work covered</span></div>
    <p class="note">${note}</p>`;
}
renderPlan();

/* ---------- Assessment calculator ---------- */
const SEG_VARS = ['--teal-2', '--amber', '--olive', '--plum', '--rust'];
function segColor(i) { return `var(${SEG_VARS[i]})`; }
const sample = { written: 90, viva: 75, book: 85, portfolio: 70, observation: 80 };
$('#sliders').innerHTML = WEIGHTS.map((w, i) => `
  <div class="slider" style="--c:var(${SEG_VARS[i]})">
    <label for="s-${w.key}">${esc(w.label)}<small>${w.weight}%</small></label>
    <output id="o-${w.key}" for="s-${w.key}">${sample[w.key]}%</output>
    <input type="range" id="s-${w.key}" min="0" max="100" step="5" value="${sample[w.key]}" data-key="${w.key}">
  </div>`).join('');
$('#legend').innerHTML = WEIGHTS.map((w, i) => `<li style="--c:var(${SEG_VARS[i]})"><i></i>${esc(w.label)} ${w.weight}%</li>`).join('');
$$('#sliders input').forEach(inp => inp.addEventListener('input', () => {
  sample[inp.dataset.key] = +inp.value;
  $(`#o-${inp.dataset.key}`).textContent = `${inp.value}%`;
  drawDonut();
}));
function band(score) {
  if (score >= 85) return 'Exemplary';
  if (score >= 70) return 'Proficient';
  if (score >= 50) return 'Developing';
  return 'Beginning';
}
function drawDonut() {
  const svg = $('#donut'); const R = 90, C = 2 * Math.PI * R, gap = 4;
  let off = 0, parts = '';
  WEIGHTS.forEach((w, i) => {
    const len = C * w.weight / 100;
    const color = cssVar(SEG_VARS[i]);
    const got = len * sample[w.key] / 100;
    parts += `<circle class="seg" cx="110" cy="110" r="${R}" stroke="${color}" stroke-opacity=".25" stroke-width="26"
      stroke-dasharray="${len - gap} ${C - len + gap}" stroke-dashoffset="${-off}" transform="rotate(-90 110 110)"><title>${w.label} ${w.weight}%</title></circle>
      <circle class="seg fill" cx="110" cy="110" r="${R}" stroke="${color}" stroke-width="26"
      stroke-dasharray="${Math.max(0, got - gap)} ${C}" stroke-dashoffset="${-off}" transform="rotate(-90 110 110)"/>`;
    off += len;
  });
  svg.innerHTML = `<title id="donut-title">Assessment weights</title><circle class="track" cx="110" cy="110" r="${R}" stroke-width="26"/>${parts}`;
  const score = Math.round(WEIGHTS.reduce((s, w) => s + w.weight * sample[w.key] / 100, 0));
  $('#score').textContent = score;
  $('#band').textContent = band(score);
}
drawDonut();

/* ---------- Dashboard tabs ---------- */
const tabs = $$('.dash-tabs [role="tab"]');
function selectTab(t) {
  tabs.forEach(x => { const on = x === t; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1; $('#' + x.getAttribute('aria-controls')).hidden = !on; });
}
tabs.forEach((t, i) => {
  t.addEventListener('click', () => selectTab(t));
  t.addEventListener('keydown', e => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
    selectTab(n); n.focus();
  });
});
$('.m-heat').innerHTML = Array.from({ length: 40 }, (_, i) => `<i style="--v:${20 + ((i * 37) % 80)};animation-delay:${i * 15}ms"></i>`).join('');

/* ---------- White-label preview ---------- */
const BRAND_COLORS = ['#1F6F66', '#2D5BA8', '#7A3FA0', '#B23A48', '#C26A12', '#3E7B2A', '#0F4C5C'];
let brandColor = BRAND_COLORS[0];
$('#swatches').innerHTML = BRAND_COLORS.map((c, i) => `<button type="button" class="swatch" style="--c:${c}" data-c="${c}" aria-pressed="${i === 0}" aria-label="Colour ${i + 1}"></button>`).join('');
const initials = s => s.split(/\s+/).filter(w => w && !/^(of|the|and|&)$/i.test(w)).slice(0, 2).map(w => w[0].toUpperCase()).join('') || 'S';
// "Greenwood Public School" → "Greenwood Skills Studio"; "St. Joseph's High School" → "St. Joseph's Skills Studio".
function studioName(school) {
  const words = school.split(/\s+/).filter(Boolean);
  if (!words.length) return '';
  const short = /^(st\.?|sri|shri|the|dr\.?|sir|new|dav|dps)$/i.test(words[0]) || words[0].length <= 3;
  return `${words.slice(0, short && words[1] ? 2 : 1).join(' ')} Skills Studio`;
}
function renderBrand() {
  const name = $('#b-name').value.trim() || 'Your School';
  const studio = $('#b-studio').value.trim() || `${name} Skill Studio`;
  $('#bp-school').textContent = name;
  $('#bp-studio').textContent = studio;
  $('#bp-badge').textContent = initials(name);
  $('#brand-preview').style.setProperty('--bc', brandColor);
}
$('#b-name').addEventListener('input', () => {
  const v = $('#b-name').value.trim();
  if (!$('#b-studio').dataset.touched) $('#b-studio').value = studioName(v);
  renderBrand();
});
$('#b-studio').addEventListener('input', () => { $('#b-studio').dataset.touched = '1'; renderBrand(); });
$$('.swatch').forEach(s => s.addEventListener('click', () => {
  $$('.swatch').forEach(x => x.setAttribute('aria-pressed', x === s));
  brandColor = s.dataset.c; renderBrand();
}));
$('#brand-form').addEventListener('submit', e => {
  e.preventDefault();
  store.set('vinclab-brand-draft', JSON.stringify({ name: $('#b-name').value.trim() || 'Your School', studio: $('#b-studio').value.trim(), color: brandColor }));
  location.href = 'app.html#/brand-demo';
});
renderBrand();

/* ---------- Learning outcomes ---------- */
const GOALS = [
  { title: 'Skills and knowledge of work', note: 'Tools, steps, care of equipment, safety', los: [1, 2, 3, 4, 5, 6] },
  { title: 'Vocations in the world of work', note: 'Why the work matters, quality and quantity', los: [7, 8, 9, 10, 11] },
  { title: 'Values while working', note: 'Observed by teachers in every activity', los: [12, 13, 14, 15, 16, 17] },
  { title: 'Skills for the home', note: 'Taking the learning home', los: [18] },
];
const WHERE = lo => {
  if (lo >= 12 && lo <= 17) return 'Teacher observation rubric (20%)';
  if ([1, 2, 3, 6].includes(lo)) return 'Viva rubric (30%) and activity book (30%)';
  if ([7, 8, 9].includes(lo)) return 'Viva rubric (30%) and written test (10%)';
  if (lo === 18) return '"Try it at home" tasks in the portfolio (10%)';
  return 'Activity book (30%) and portfolio (10%)';
};
$('#lo-grid').innerHTML = GOALS.map((g, i) => `
  <div class="lo-col reveal"><h3>CG ${i + 1} · ${esc(g.title)}</h3><p>${esc(g.note)}</p>
  <div class="chips">${g.los.map(l => `<button class="lo" data-lo="${l}" aria-pressed="false">LO ${l}</button>`).join('')}</div></div>`).join('');
$$('.lo').forEach(b => b.addEventListener('click', () => {
  $$('.lo').forEach(x => x.setAttribute('aria-pressed', x === b));
  const l = +b.dataset.lo;
  $('#lo-detail').innerHTML = `<b>LO ${l}.</b> ${esc(LEARNING_OUTCOMES[l])}.<br><span class="muted">Measured in: ${esc(WHERE(l))}</span>`;
}));

/* ---------- Roadmap ---------- */
$('#road').innerHTML = GRADES.map(g => `
  <div class="road-card g${g} reveal"><span class="big" aria-hidden="true">${g}</span>
    <span class="chip live">Live</span>
    <h3>Grade ${g}</h3><ul>${projectsOfGrade(g).map(p => `<li>${esc(p.title)}</li>`).join('')}</ul>
    <p class="tech">${icon('flask')} ${esc(TECH[g])}</p>
    <a class="btn btn-ghost btn-sm demo" href="app.html#/login/${DEMO_LOGIN[g]}">Try a Grade ${g} student</a></div>`).join('');

/* ---------- Enquiry ---------- */
const form = $('#enquiry'), msg = $('#form-msg');
form.addEventListener('submit', async e => {
  e.preventDefault();
  let ok = true;
  $$('[required]', form).forEach(f => { const bad = !f.value.trim(); f.setAttribute('aria-invalid', bad); if (bad) ok = false; });
  const contact = form.contact.value.trim();
  if (contact && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact) && !/^[+\d][\d\s-]{7,}$/.test(contact)) { form.contact.setAttribute('aria-invalid', 'true'); ok = false; }
  if (!ok) { msg.textContent = 'Please fill in your name, school and a valid email or phone number.'; $('[aria-invalid="true"]', form)?.focus(); return; }
  if (form._honey.value) return;
  const data = Object.fromEntries(new FormData(form));
  delete data._honey;
  msg.textContent = 'Sending…';
  const btn = $('button[type="submit"]', form); btn.disabled = true;
  try {
    const r = await fetch(`https://formsubmit.co/ajax/${LEADS_INBOX}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ ...data, _subject: `VINC Lab pilot request: ${data.school}`, _template: 'table' }),
    });
    if (!r.ok) throw new Error(r.status);
    form.reset();
    msg.textContent = 'Thank you. We will get back to you within two working days.';
  } catch {
    const body = encodeURIComponent(Object.entries(data).map(([k, v]) => `${k}: ${v}`).join('\n'));
    msg.innerHTML = `We couldn't send that just now. <a href="mailto:${LEADS_INBOX}?subject=${encodeURIComponent('VINC Lab pilot request')}&body=${body}">Email it to us instead</a>.`;
  } finally { btn.disabled = false; }
});

/* ---------- Reveal + counters + magnetic buttons ---------- */
$$('section .section-head, .timeline li, .planner, .dash-tabs, .faq details, .brand-form, .phone').forEach(el => el.classList.add('reveal'));
const io = new IntersectionObserver(entries => entries.forEach(en => {
  if (!en.isIntersecting) return;
  en.target.classList.add('in');
  if (en.target.matches('.count')) countUp(en.target);
  io.unobserve(en.target);
}), { threshold: 0.12 });
$$('.reveal, .count').forEach(el => io.observe(el));
if (!REDUCED) $$('.magnetic').forEach(b => {
  b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .15}px, ${(e.clientY - r.top - r.height / 2) * .25}px)`; });
  b.addEventListener('pointerleave', () => { b.style.transform = ''; });
});
