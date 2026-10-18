// Student dashboard: home, project studio (activities, quiz, portfolio, scores), portfolio and badges.
import { FORMS, WEIGHTS, projectById, projectsOfGrade } from '../../data/courses.js';
import { db, save, school, section, projectsFor, progress, log, uid, gradeOf } from '../store.js';
import { projectScore, nextActivity, yearSummary, band, PORTFOLIO_TARGET } from '../scoring.js';
import { $, $$, esc, icon, art, ring, bar, fmtDate, timeAgo, daysUntil, toast, confetti, resizeImage, modal, FORM_COLOR, FORM_SOFT, PART_COLOR } from '../ui.js';
import { activityPage, loadLessons, lessonsFor, lessonOf, LAB_KIND, starsHtml } from './activity.js';

export const nav = () => [
  { path: '', label: 'Home', icon: 'home' },
  { path: 'projects', label: 'My projects', short: 'Projects', icon: 'flask' },
  { path: 'portfolio', label: 'Portfolio', icon: 'folder' },
  { path: 'scores', label: 'Scores & badges', short: 'Scores', icon: 'trophy' },
];

export function render(ctx) {
  const [page, pid, tab, n] = ctx.params;
  if (page === 'p' && projectById(pid) && tab === 'a') return activityPage(ctx, pid, +n);
  if (page === 'p' && projectById(pid)) return projectPage(ctx, pid, tab || 'activities');
  if (page === 'projects') return projectsPage(ctx);
  if (page === 'portfolio') return portfolioPage(ctx);
  if (page === 'scores') return scoresPage(ctx);
  return home(ctx);
}

/* ---------- data helpers ---------- */
function mine(me) {
  const ids = projectsFor(me);
  const prog = db().progress[me.id] || {};
  const year = yearSummary(prog, ids);
  const current = ids.find(id => !projectScore(prog[id], id).complete && projectScore(prog[id], id).done < projectById(id).activities.length) || ids[ids.length - 1];
  return { ids, prog, year, current };
}

export function badges(me) {
  const { ids, prog } = mine(me);
  const s = ids.map(id => ({ id, p: projectById(id), sc: projectScore(prog[id], id), pr: prog[id] }));
  const anyActs = s.some(x => x.sc.done > 0);
  const portfolio = s.reduce((n, x) => n + (x.pr?.portfolio.length || 0), 0);
  const formDone = f => s.some(x => x.p.form === f && x.sc.done === x.sc.total);
  return [
    { key: 'first', emoji: '🚀', name: 'First step', how: 'Finish your first activity', got: anyActs },
    { key: 'life', emoji: '🌱', name: 'Life lover', how: 'Finish every activity in your life-forms project', got: formDone('life') },
    { key: 'maker', emoji: '⚙️', name: 'Maker', how: 'Finish every activity in your machines project', got: formDone('machines') },
    { key: 'helper', emoji: '🤝', name: 'Helper', how: 'Finish every activity in your human-services project', got: formDone('services') },
    { key: 'whiz', emoji: '⭐', name: 'Quiz whiz', how: 'Score 9 or 10 on any quiz', got: s.some(x => x.pr?.quiz.some(q => q.score >= 9)) },
    { key: 'story', emoji: '📸', name: 'Storyteller', how: `Add ${PORTFOLIO_TARGET + 1} portfolio items`, got: portfolio > PORTFOLIO_TARGET },
    { key: 'safe', emoji: '🦺', name: 'Safety star', how: 'Get top marks for safety in a viva', got: s.some(x => x.pr?.viva?.safety === 4) },
    { key: 'lab', emoji: '🧪', name: 'Lab explorer', how: 'Play your first virtual lab', got: s.some(x => Object.keys(x.pr?.labs || {}).length) },
    { key: 'labstar', emoji: '🌟', name: 'Lab star', how: 'Get 3 stars in 5 virtual labs', got: s.reduce((n, x) => n + Object.values(x.pr?.labs || {}).filter(l => l.stars === 3).length, 0) >= 5 },
    { key: 'mela', emoji: '🏆', name: 'Mela ready', how: 'Complete all three projects', got: s.every(x => x.sc.complete) },
  ];
}

const hello = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };

function projectTile(me, id, prog) {
  const p = projectById(id), sc = projectScore(prog[id], id);
  return `<a class="ptile f-${p.form}" href="#/student/p/${id}">
    <div class="ptile-art">${art(p.art)}</div>
    <div class="ptile-body">
      <span class="form-tag">${esc(FORMS[p.form].short)}</span>
      <h3>${esc(p.title)}</h3>
      <div class="ptile-prog">${bar(sc.activityPct, FORM_COLOR[p.form])}<small>${sc.done}/${sc.total} activities</small></div>
      <small class="muted">${sc.score != null ? `Score so far ${sc.score}% · ${band(sc.score)}` : sc.done ? 'In progress' : 'Not started yet'}</small>
    </div>
  </a>`;
}

/* ---------- Home ---------- */
function home(ctx) {
  const { me } = ctx;
  const sch = school(me.schoolId), sec = section(sch, me.sectionId);
  const { ids, prog, year, current } = mine(me);
  const cp = projectById(current), next = nextActivity(prog[current], current);
  const quizBest = Math.max(0, ...ids.flatMap(id => (prog[id]?.quiz || []).map(q => q.score)));
  const pf = ids.reduce((n, id) => n + (prog[id]?.portfolio.length || 0), 0);
  const mela = daysUntil(sch.melaDate);
  const fb = ids.flatMap(id => (prog[id]?.feedback || []).map(f => ({ ...f, p: projectById(id).title }))).sort((a, b) => b.at - a.at).slice(0, 3);
  const bs = badges(me);
  return {
    title: 'Home',
    html: `
    <section class="hero-card">
      <div class="hc-copy">
        <p class="eyebrow">Grade ${sec?.grade || 6} · ${esc(sec?.name || '')} · Kaushal Bodh</p>
        <h2>${hello()}, ${esc(me.name.split(' ')[0])} 👋</h2>
        <p>${next ? `You're on <b>${esc(cp.title)}</b>. Next up: <b>${esc(next.title)}</b>.` : `You've finished all the activities in <b>${esc(cp.title)}</b>. Try the quiz!`}</p>
        <a class="btn btn-brand" href="#/student/p/${current}${next ? `/a/${next.n}` : ''}">${next ? 'Continue: open the lesson' : 'Open project'} ${icon('arrow')}</a>
      </div>
      <div class="hc-ring">${ring(year.activityPct, { size: 150, stroke: 14, sub: 'of the year' })}</div>
    </section>
    <div class="kpis">
      <div class="kpi"><span>${icon('check')}</span><b>${year.actsDone}<small>/${year.actsTotal}</small></b><p>Activities done</p></div>
      <div class="kpi"><span>${icon('quiz')}</span><b>${quizBest || '—'}<small>${quizBest ? '/10' : ''}</small></b><p>Best quiz score</p></div>
      <div class="kpi"><span>${icon('folder')}</span><b>${pf}</b><p>Portfolio items</p></div>
      <div class="kpi"><span>${icon('calendar')}</span><b>${mela > 0 ? mela : 0}<small> days</small></b><p>to the Kaushal Mela</p></div>
    </div>
    <h2 class="h-sec">Your projects this year</h2>
    <div class="ptiles">${ids.map(id => projectTile(me, id, prog)).join('')}</div>
    <div class="grid-2">
      <section class="card">
        <h2 class="h-card">${icon('star')} Badges</h2>
        <div class="badges">${bs.map(b => `<span class="bdg ${b.got ? 'got' : ''}" title="${esc(b.how)}"><i>${b.emoji}</i><small>${esc(b.name)}</small></span>`).join('')}</div>
      </section>
      <section class="card">
        <h2 class="h-card">${icon('bell')} From your teacher</h2>
        ${fb.length ? `<ul class="feed">${fb.map(f => `<li><b>${esc(f.by)}</b> <small class="muted">· ${esc(f.p)} · ${timeAgo(f.at)}</small><p>${esc(f.text)}</p></li>`).join('')}</ul>` : '<p class="muted">No feedback yet. Your teacher will leave notes here.</p>'}
      </section>
    </div>
    <section class="card try-home">
      <h2 class="h-card">${icon('home')} Try it at home</h2>
      <ul>${cp.home.map(h => `<li>${esc(h)}</li>`).join('')}</ul>
    </section>`,
  };
}

/* ---------- Projects list ---------- */
function projectsPage(ctx) {
  const { ids, prog } = mine(ctx.me);
  const g = gradeOf(ctx.me);
  const others = projectsOfGrade(g).filter(p => !ids.includes(p.id));
  return {
    title: 'My projects', nav: 'projects',
    html: `<p class="lead-in">Your school chose one project from each form of work for your section.</p>
      <div class="ptiles">${ids.map(id => projectTile(ctx.me, id, prog)).join('')}</div>
      <h2 class="h-sec">Other Grade ${g} projects</h2>
      <p class="muted">These are in your Kaushal Bodh book too. Your class may do them next year, or you can try them at home.</p>
      <div class="mini-list">${others.map(p => `<div class="mini f-${p.form}"><div class="mini-art">${art(p.art)}</div><div><b>${esc(p.title)}</b><small>${esc(p.tagline)} · pp. ${p.pages[0]}–${p.pages[1]}</small></div></div>`).join('')}</div>`,
  };
}

/* ---------- Project page ---------- */
const TABS = [['activities', 'Activities', 'check'], ['quiz', 'Quiz', 'quiz'], ['portfolio', 'Portfolio', 'folder'], ['scores', 'Scores', 'chart']];

function projectPage(ctx, pid, tab) {
  const { me } = ctx;
  const p = projectById(pid);
  const pr = progress(me.id, pid, true);
  const sc = projectScore(pr, pid);
  const head = `
    <section class="proj-head f-${p.form}">
      <div class="ph-art">${art(p.art)}</div>
      <div class="ph-copy">
        <a class="back" href="#/student/projects">← My projects</a>
        <span class="form-tag">${esc(FORMS[p.form].name)}</span>
        <h2>${esc(p.title)}</h2>
        <p>${esc(p.summary)}</p>
        <div class="chips"><span class="chip">${icon('book')} Kaushal Bodh pp. ${p.pages[0]}–${p.pages[1]}</span><span class="chip">${icon('calendar')} ${p.periods} periods</span></div>
      </div>
      <div class="ph-ring">${ring(sc.activityPct, { size: 120, stroke: 12, color: FORM_COLOR[p.form], sub: `${sc.done}/${sc.total} done` })}</div>
    </section>
    <nav class="tabs" aria-label="Project sections">${TABS.map(([k, l, i]) => `<a href="#/student/p/${pid}/${k}" class="${k === tab ? 'on' : ''}" ${k === tab ? 'aria-current="page"' : ''}>${icon(i)}${l}</a>`).join('')}</nav>`;
  const body = { activities: activitiesTab, quiz: quizTab, portfolio: portfolioTab, scores: scoresTab }[tab] || activitiesTab;
  const b = body(ctx, p, pr, sc);
  return { title: p.title, nav: 'projects', html: head + b.html, mount: b.mount };
}

function activitiesTab(ctx, p, pr) {
  const next = nextActivity(pr, p.id);
  const loaded = !!lessonsFor(p.id);
  pr.labs ||= {};
  const labStars = Object.values(pr.labs).reduce((n, l) => n + (l.stars || 0), 0);
  return {
    html: `<div class="proj-grid">
      <div>
        <p class="lead-in">Open an activity to read the lesson, tick off the steps as you go and play its virtual lab.</p>
        <ol class="act-list">${p.activities.map(a => {
          const st = pr.acts[a.n], lab = pr.labs[a.n], L = loaded ? lessonOf(p.id, a.n) : null, kind = L?.lab ? LAB_KIND[L.lab.type] : null;
          const isNext = next && next.n === a.n;
          return `<li class="act-row ${st?.done ? 'done' : ''} ${isNext ? 'next' : ''} f-${p.form}">
            <a href="#/student/p/${p.id}/a/${a.n}">
              <span class="act-n">${st?.done ? icon('check') : a.n}</span>
              <span class="act-t"><b>${esc(a.title)}</b><small>${esc(a.task)}</small></span>
              <span class="act-meta">
                ${isNext ? '<span class="tag todo">Up next</span>' : st?.done ? `<span class="muted small">Done ${fmtDate(st.at)}</span>` : ''}
                ${kind ? `<span class="lab-pill" title="Virtual lab: ${esc(L.lab.title)}"><span aria-hidden="true">${kind[1]}</span>${lab ? starsHtml(lab.stars) : '<span class="muted">Lab</span>'}</span>` : ''}
              </span>
              <span class="act-go" aria-hidden="true">${icon('arrow')}</span>
            </a>
          </li>`;
        }).join('')}</ol>
      </div>
      <aside class="proj-side">
        <section class="card lab-sum"><h3 class="h-card">${icon('flask')} Virtual labs</h3><p><b class="big-num">${Object.keys(pr.labs).length}</b> of ${p.activities.length} played · <b>${labStars}</b> ★</p><p class="muted small">Every activity has a short game that lets you practise it on screen. Try for three stars!</p></section>
        <section class="card"><h3 class="h-card">${icon('shield')} Stay safe</h3><ul>${p.safety.map(x => `<li>${esc(x)}</li>`).join('')}</ul></section>
        <section class="card"><h3 class="h-card">${icon('star')} By the end you can</h3><ul>${p.goals.map(x => `<li>${esc(x)}</li>`).join('')}</ul></section>
      </aside>
    </div>`,
    mount() { if (!loaded) loadLessons(p.id).then(() => ctx.rerender()); },
  };
}

function quizTab(ctx, p, pr) {
  const best = pr.quiz.length ? Math.max(...pr.quiz.map(q => q.score)) : null;
  return {
    html: `<div class="quiz-wrap" id="quiz">
      <section class="card quiz-intro">
        <div>
          <h3>${esc(p.title)} quiz</h3>
          <p class="muted">${p.quiz.length} questions · instant feedback · your best attempt counts for the written test (10% of the project).</p>
          ${pr.quiz.length ? `<p>Best so far: <b>${best}/${p.quiz.length}</b> · ${pr.quiz.length} attempt${pr.quiz.length > 1 ? 's' : ''}</p>` : ''}
          <button class="btn btn-brand" id="q-start">${pr.quiz.length ? 'Try again' : 'Start the quiz'} ${icon('play')}</button>
        </div>
        <div class="quiz-art">${art(p.art)}</div>
      </section>
      ${pr.quiz.length ? `<section class="card"><h3 class="h-card">Your attempts</h3><ul class="attempts">${pr.quiz.map(q => `<li><span>${fmtDate(q.at, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>${bar(q.score / q.total * 100, FORM_COLOR[p.form])}<b>${q.score}/${q.total}</b></li>`).join('')}</ul></section>` : ''}
    </div>`,
    mount(el) {
      $('#q-start', el)?.addEventListener('click', () => runQuiz(ctx, p, pr, $('#quiz', el)));
    },
  };
}

function shuffle(a) { const b = a.map((v, i) => [Math.random(), v, i]); b.sort((x, y) => x[0] - y[0]); return b.map(x => [x[1], x[2]]); }

function runQuiz(ctx, p, pr, host) {
  const qs = p.quiz.map((q, i) => ({ ...q, i, opts: shuffle(q.o) }));
  delete host.dataset.locked;
  let k = 0, score = 0;
  const answers = [];
  const show = () => {
    const q = qs[k];
    host.innerHTML = `<section class="card qcard f-${p.form}">
      <div class="q-top"><span class="chip">Question ${k + 1} of ${qs.length}</span><span class="q-score">${score} correct</span></div>
      <div class="q-prog">${bar((k) / qs.length * 100, FORM_COLOR[p.form])}</div>
      <h3 class="q-q" id="qq">${esc(q.q)}</h3>
      <div class="q-opts" role="radiogroup" aria-labelledby="qq">${q.opts.map(([text, orig], j) => `<button class="q-opt" role="radio" aria-checked="false" data-orig="${orig}"><span class="q-key">${'ABCD'[j]}</span>${esc(text)}</button>`).join('')}</div>
      <p class="q-explain" aria-live="polite"></p>
      <div class="q-foot"><button class="btn btn-brand" id="q-next" hidden>${k === qs.length - 1 ? 'See my score' : 'Next question'} ${icon('arrow')}</button></div>
    </section>`;
    // The progress bar glides on from the previous question.
    const bi = $('.q-prog .bar i', host);
    if (bi && k) { bi.style.transition = 'none'; bi.style.width = `${(k - 1) / qs.length * 100}%`; void bi.offsetWidth; bi.style.transition = ''; bi.style.width = `${k / qs.length * 100}%`; }
    $$('.q-opt', host).forEach(b => b.addEventListener('click', () => {
      if (host.dataset.locked) return;
      host.dataset.locked = '1';
      const pickd = +b.dataset.orig, ok = pickd === q.a;
      if (ok) score++;
      answers.push({ q: q.i, pick: pickd, ok });
      b.setAttribute('aria-checked', 'true');
      $$('.q-opt', host).forEach(x => { x.disabled = true; if (+x.dataset.orig === q.a) x.classList.add('right'); });
      if (!ok) b.classList.add('wrong');
      $('.q-explain', host).innerHTML = `<b>${ok ? 'Correct!' : 'Not quite.'}</b> ${esc(q.e)}`;
      $('.q-score', host).textContent = `${score} correct`;
      const nx = $('#q-next', host); nx.hidden = false; nx.focus();
      nx.addEventListener('click', () => { delete host.dataset.locked; k++; if (k < qs.length) show(); else finish(); });
    }));
    $('.q-opt', host).focus();
  };
  const finish = () => {
    pr.quiz.push({ score, total: qs.length, at: Date.now(), answers });
    log(ctx.me.name, `scored ${score}/${qs.length} on the ${p.title} quiz`, ctx.me.schoolId);
    save();
    if (score >= 8) confetti();
    const missed = answers.filter(a => !a.ok).map(a => p.quiz[a.q]);
    host.innerHTML = `<section class="card qdone f-${p.form}">
      ${ring(score / qs.length * 100, { size: 140, stroke: 14, color: FORM_COLOR[p.form], label: `${score}/${qs.length}` })}
      <h3>${score >= 9 ? 'Outstanding!' : score >= 7 ? 'Well done!' : score >= 5 ? 'Good effort!' : 'Keep practising!'}</h3>
      <p class="muted">${score >= 9 ? 'You earned the Quiz whiz badge.' : 'Your best attempt is the one that counts. Read the pages again and retry whenever you like.'}</p>
      ${missed.length ? `<div class="review"><h4>Review</h4><ul>${missed.map(m => `<li><b>${esc(m.q)}</b><br>Answer: ${esc(m.o[m.a])}. <span class="muted">${esc(m.e)}</span></li>`).join('')}</ul></div>` : ''}
      <div class="q-foot"><a class="btn btn-brand" href="#/student/p/${p.id}/scores">See my project score</a><button class="btn btn-ghost" id="q-again">Try again</button></div>
    </section>`;
    $('#q-again', host).addEventListener('click', () => runQuiz(ctx, p, pr, host));
  };
  show();
}

function portfolioTab(ctx, p, pr) {
  return {
    html: `<section class="card add-pf">
        <h3 class="h-card">${icon('plus')} Add to your portfolio</h3>
        <p class="muted">Photos of your work, sketches and notes. Aim for at least ${PORTFOLIO_TARGET} items in this project.</p>
        <form id="pf-form" class="pf-form">
          <label for="pf-title">Title</label>
          <input id="pf-title" maxlength="80" required placeholder="e.g. Our balloon car on test day">
          <label for="pf-text">Note <span class="muted">(optional)</span></label>
          <textarea id="pf-text" rows="2" maxlength="400" placeholder="What does this show?"></textarea>
          <label class="file"><input type="file" id="pf-file" accept="image/*" capture="environment"><span>${icon('upload')} <span id="pf-fname">Add a photo (optional)</span></span></label>
          <button class="btn btn-brand" type="submit">Save to portfolio</button>
        </form>
      </section>
      ${gallery(pr.portfolio, p, true)}`,
    mount(el) {
      let img = null;
      $('#pf-file', el).addEventListener('change', async e => {
        const f = e.target.files[0]; if (!f) return;
        try { img = await resizeImage(f); $('#pf-fname', el).textContent = f.name; } catch (err) { toast(err.message, 'bad'); }
      });
      $('#pf-form', el).addEventListener('submit', e => {
        e.preventDefault();
        const title = $('#pf-title', el).value.trim();
        if (!title) { $('#pf-title', el).focus(); return; }
        pr.portfolio.push({ id: uid('pf'), kind: img ? 'photo' : 'note', img, art: img ? null : p.art, title, text: $('#pf-text', el).value.trim(), at: Date.now() });
        log(ctx.me.name, `added "${title}" to the ${p.title} portfolio`, ctx.me.schoolId);
        if (!save()) { pr.portfolio.pop(); toast('Storage is full. Try a smaller photo or remove an item.', 'bad'); return; }
        toast('Added to your portfolio.');
        ctx.rerender();
      });
      bindGallery(el, ctx, [pr]);
    },
  };
}

export function gallery(items, p, canDelete) {
  if (!items.length) return `<p class="empty-note">Nothing here yet.</p>`;
  return `<div class="gallery">${[...items].sort((a, b) => b.at - a.at).map(it => `
    <figure class="pf ${it.kind}" data-id="${it.id}">
      <div class="pf-media ${p ? `f-${p.form}` : ''}">${it.img ? `<img src="${it.img}" alt="${esc(it.title)}" loading="lazy">` : it.art ? art(it.art) : `<span class="pf-note">${icon('book')}</span>`}</div>
      <figcaption><b>${esc(it.title)}</b>${it.text ? `<small>${esc(it.text)}</small>` : ''}<small class="muted">${fmtDate(it.at)}${it.project ? ` · ${esc(it.project)}` : ''}</small></figcaption>
      ${canDelete ? `<button class="icon-btn del" data-del="${it.id}" aria-label="Remove ${esc(it.title)}">${icon('close')}</button>` : ''}
    </figure>`).join('')}</div>`;
}

function bindGallery(el, ctx, progList) {
  $$('[data-del]', el).forEach(b => b.addEventListener('click', () => {
    if (!confirm('Remove this item from your portfolio?')) return;
    for (const pr of progList) { const i = pr.portfolio.findIndex(x => x.id === b.dataset.del); if (i >= 0) pr.portfolio.splice(i, 1); }
    save(); toast('Removed.'); ctx.rerender();
  }));
}

function scoresTab(ctx, p, pr, sc) {
  return {
    html: `<div class="grid-2">
      <section class="card">
        <h3 class="h-card">${icon('chart')} How this project is marked</h3>
        <ul class="parts">${WEIGHTS.map(w => `<li><div class="part-top"><b>${esc(w.label)}</b><span class="muted">${w.weight}%</span><span class="part-val">${sc.parts[w.key] == null ? 'Not yet' : `${sc.parts[w.key]}%`}</span></div>${bar(sc.parts[w.key], PART_COLOR[w.key])}<small class="muted">${esc(w.how)}${w.key === 'portfolio' && sc.portfolioProvisional && sc.parts.portfolio != null ? ' (counted from your items until your teacher marks it)' : ''}</small></li>`).join('')}</ul>
        <div class="total-row"><span>Project score ${sc.complete ? '' : 'so far'}</span><b>${sc.score == null ? '—' : `${sc.score}%`}</b><span class="chip">${band(sc.score)}</span></div>
        ${sc.complete ? '' : '<p class="muted small">"So far" uses only the parts that have been marked. Your final score appears when all five are in.</p>'}
      </section>
      <section class="card">
        <h3 class="h-card">${icon('mic')} Practise for your viva</h3>
        <p class="muted">Your teacher will ask questions like these. Practise saying the answers out loud.</p>
        <ol class="viva-list">${p.viva.map(v => `<li>${esc(v)}</li>`).join('')}</ol>
        <h3 class="h-card">${icon('bell')} Teacher feedback</h3>
        ${pr.feedback.length ? `<ul class="feed">${pr.feedback.map(f => `<li><b>${esc(f.by)}</b> <small class="muted">${timeAgo(f.at)}</small><p>${esc(f.text)}</p></li>`).join('')}</ul>` : '<p class="muted">No feedback on this project yet.</p>'}
        <h3 class="h-card">${icon('users')} Jobs that use these skills</h3>
        <div class="chips">${p.careers.map(c => `<span class="chip">${esc(c)}</span>`).join('')}</div>
      </section>
    </div>`,
  };
}

/* ---------- Portfolio (all projects) ---------- */
function portfolioPage(ctx) {
  const { ids, prog } = mine(ctx.me);
  const items = ids.flatMap(id => (prog[id]?.portfolio || []).map(x => ({ ...x, project: projectById(id).title })));
  return {
    title: 'My portfolio', nav: 'portfolio',
    html: `<p class="lead-in">Everything you have added across your projects. Your portfolio is 10% of each project's score and the heart of your Kaushal Mela display.</p>
      <div class="chips pf-filter">${ids.map(id => { const p = projectById(id); return `<a class="chip f-${p.form}" href="#/student/p/${id}/portfolio">${icon('plus')} Add to ${esc(p.title)}</a>`; }).join('')}</div>
      ${gallery(items, null, false)}`,
  };
}

/* ---------- Scores & badges ---------- */
function scoresPage(ctx) {
  const { ids, prog, year } = mine(ctx.me);
  const bs = badges(ctx.me);
  return {
    title: 'Scores & badges', nav: 'scores',
    html: `<div class="grid-2">
      <section class="card year-card">
        <h3 class="h-card">${icon('chart')} This year</h3>
        <div class="year-row">${ring(year.score ?? 0, { size: 140, stroke: 14, label: year.score == null ? '—' : `${year.score}%`, sub: band(year.score) })}
          <p class="muted">Your year score is the average of your three project scores. It goes into your school's internal assessment.</p></div>
        <table class="tbl"><thead><tr><th>Project</th><th>Activities</th><th>Score</th></tr></thead><tbody>
        ${year.per.map(x => { const p = projectById(x.id); return `<tr><td><a href="#/student/p/${x.id}/scores">${esc(p.title)}</a></td><td>${x.done}/${x.total}</td><td>${x.score == null ? '—' : `${x.score}%${x.complete ? '' : ' <small class="muted">so far</small>'}`}</td></tr>`; }).join('')}
        </tbody></table>
      </section>
      <section class="card">
        <h3 class="h-card">${icon('trophy')} Badges · ${bs.filter(b => b.got).length} of ${bs.length}</h3>
        <ul class="badge-list">${bs.map(b => `<li class="${b.got ? 'got' : ''}"><i>${b.emoji}</i><div><b>${esc(b.name)}</b><small>${esc(b.how)}</small></div>${b.got ? `<span class="chip ok">Earned</span>` : ''}</li>`).join('')}</ul>
      </section>
    </div>`,
  };
}
