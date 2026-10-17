// Teacher portal: a Kaushal Bodh teacher's own sections, monitored grade by grade.
import { FORMS, projectById } from '../../data/courses.js';
import { db, school, section, studentsOf, sectionsOf, progress, lastActive, user, setTaught, log } from '../store.js';
import { projectScore, yearSummary, band } from '../scoring.js';
import { $, $$, esc, icon, art, ring, bar, timeAgo, toast, FORM_COLOR } from '../ui.js';
import { stats, secLabel, heatmap, markTable, bindMark, studentDetail, currentProject, quizAnalysis, rubricAnalysis, rubricBars, quizBars, INACTIVE_DAYS } from './shared.js';

const myGrades = me => [...new Set(sectionsOf(me).map(s => s.grade))];

export const nav = ctx => [
  { path: '', label: 'My classes', short: 'Classes', icon: 'home' },
  ...myGrades(ctx.me).map(g => ({ path: `g${g}`, label: `Grade ${g}`, short: `Gr ${g}`, icon: 'school' })),
  { path: 'lessons', label: 'Lesson plans', short: 'Lessons', icon: 'calendar' },
  { path: 'mark', label: 'Mark work', short: 'Mark', icon: 'check' },
  { path: 'students', label: 'Students', icon: 'users' },
];

export function render(ctx) {
  const [page, a] = ctx.params;
  if (state.who !== ctx.me.id) Object.assign(state, { who: ctx.me.id, sec: {}, proj: {}, lessonSec: null, lessonProj: null, markSec: null, markProj: null, q: '', g: 'all' });
  const secs = sectionsOf(ctx.me);
  if (!secs.length) return { title: 'My classes', html: `<div class="empty"><p><b>No sections are assigned to you yet.</b></p><p>Ask your Kaushal Bodh coordinator to add you to your sections. Your User ID is <span class="mono">${esc(ctx.me.login)}</span>.</p></div>` };
  if (/^g\d$/.test(page || '') && secs.some(s => s.grade === +page.slice(1))) return gradePage(ctx, +page.slice(1));
  if (page === 'lessons') return lessons(ctx);
  if (page === 'mark') return mark(ctx);
  if (page === 'students') return students(ctx);
  if (page === 'student') {
    const s = user(a);
    if (!s || !secs.some(x => x.id === s.sectionId)) return { title: 'Student', html: '<div class="empty"><p>This student is not in your sections.</p></div>' };
    return { ...studentDetail(ctx, s, { href: '#/teacher/students', label: 'My students' }), nav: 'students' };
  }
  return overview(ctx);
}

const state = { sec: {}, proj: {}, lessonSec: null, lessonProj: null, markSec: null, markProj: null, q: '', g: 'all' };
const nextToTeach = (sec, pid) => projectById(pid).activities.find(a => !(sec.taught?.[pid] || []).includes(a.n));
const doneShare = (kids, pid, n) => kids.length ? Math.round(kids.filter(k => progress(k.id, pid)?.acts[n]?.done).length / kids.length * 100) : 0;
const hello = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };

// Students who need a nudge: inactive for two weeks, or well behind their section.
function needsAttention(sec, kids) {
  const ys = kids.map(k => ({ k, y: yearSummary(db().progress[k.id], Object.values(sec.projects)), la: lastActive(k.id) }));
  const avg = ys.length ? ys.reduce((n, x) => n + x.y.activityPct, 0) / ys.length : 0;
  return ys.filter(x => !x.la || Date.now() - x.la > INACTIVE_DAYS * 86400000 || x.y.activityPct < avg - 20)
    .map(x => ({ ...x, sec, why: !x.la || Date.now() - x.la > INACTIVE_DAYS * 86400000 ? `inactive ${timeAgo(x.la)}` : `${x.y.activityPct}% done vs ${Math.round(avg)}% class average` }));
}

/* ---------- Overview ---------- */
function overview(ctx) {
  const me = ctx.me, sch = school(me.schoolId);
  const secs = sectionsOf(me);
  const allKids = secs.flatMap(s => studentsOf(sch.id, s.id));
  const S = stats(allKids);
  const attentionAll = secs.flatMap(s => needsAttention(s, studentsOf(sch.id, s.id)));
  const attention = attentionAll.slice(0, 6);
  const ids = new Set(allKids.map(k => k.name));
  const feed = db().log.filter(l => l.schoolId === sch.id && ids.has(l.who)).slice(0, 8);
  return {
    title: 'My classes', nav: '',
    html: `
    <section class="hero-card">
      <div class="hc-copy">
        <p class="eyebrow">${esc(sch.name)} · Kaushal Bodh teacher</p>
        <h2>${hello()}, ${esc(me.name.split(' ')[0])}</h2>
        <p>You teach <b>${secs.length} section${secs.length > 1 ? 's' : ''}</b> across Grade${myGrades(me).length > 1 ? 's' : ''} ${myGrades(me).join(', ')}: ${allKids.length} students. ${S.vivaDue ? `<b>${S.vivaDue} viva${S.vivaDue > 1 ? 's are' : ' is'}</b> ready to mark.` : 'No vivas waiting.'}</p>
        <a class="btn btn-brand" href="#/teacher/lessons">Open lesson plans ${icon('arrow')}</a>
      </div>
      <div class="hc-ring">${ring(S.completion, { size: 150, stroke: 14, sub: 'activities done' })}</div>
    </section>
    <h2 class="h-sec">Next up in each class</h2>
    <div class="today-grid">${secs.map(sec => {
      const kids = studentsOf(sch.id, sec.id); const pid = currentProject(sec, kids); const P = projectById(pid); const a = nextToTeach(sec, pid);
      return `<section class="card today f-${P.form}">
        <div class="td-top"><span class="gnum sm g${sec.grade}">${sec.grade}</span><div><b>${esc(secLabel(sec))}</b><small class="muted">${kids.length} students · ${esc(P.title)}</small></div></div>
        ${a ? `<div class="td-act"><span class="act-n">${a.n}</span><div><b>${esc(a.title)}</b><small>${esc(a.task)}</small><small class="muted">${icon('book')} Kaushal Bodh Grade ${sec.grade}, page ${a.page} · ${doneShare(kids, pid, a.n)}% of the class have done it</small></div></div>
          <div class="td-btns"><button class="btn btn-brand btn-sm" data-taught="${sec.id}|${pid}|${a.n}">${icon('check')} Mark as taught</button><a class="btn btn-ghost btn-sm" href="#/teacher/g${sec.grade}">Grade ${sec.grade} view</a></div>`
          : `<p>All activities in ${esc(P.title)} are taught. Time for the quiz and vivas.</p><a class="btn btn-brand btn-sm" href="#/teacher/mark">Mark vivas</a>`}
      </section>`;
    }).join('')}</div>
    <h2 class="h-sec">Your grades</h2>
    <div class="grade-cards">${myGrades(me).map(g => {
      const gs = secs.filter(s => s.grade === g); const gk = gs.flatMap(s => studentsOf(sch.id, s.id)); const st = stats(gk);
      return `<a class="card grade-card link g${g}" href="#/teacher/g${g}"><div class="gc-top"><span class="gnum">${g}</span><div><b>Grade ${g}</b><small class="muted">${gs.map(s => esc(s.name)).join(', ')} · ${gk.length} students</small></div>${icon('arrow')}</div>
        <div class="gc-row"><span>Activities</span>${bar(st.completion)}<b>${st.completion}%</b></div>
        <div class="gc-row"><span>Score so far</span>${bar(st.score)}<b>${st.score == null ? '—' : `${st.score}%`}</b></div>
        <p class="muted small">${st.quizzes} quiz attempts · ${st.vivaDue} viva${st.vivaDue === 1 ? '' : 's'} to mark · ${st.inactive} inactive</p></a>`;
    }).join('')}</div>
    <div class="grid-2">
      <section class="card"><h2 class="h-card">${icon('bell')} Needs your attention</h2>
        ${attention.length ? `<ul class="attn">${attention.map(x => `<li><a href="#/teacher/student/${x.k.id}"><b>${esc(x.k.name)}</b></a><small class="muted">${esc(secLabel(x.sec))} · ${esc(x.why)}</small></li>`).join('')}</ul>${attentionAll.length > attention.length ? `<p class="muted small">and ${attentionAll.length - attention.length} more · see each grade page</p>` : ''}` : '<p class="muted">Everyone is on track.</p>'}
      </section>
      <section class="card"><h2 class="h-card">${icon('eye')} Latest from your students</h2>
        <ul class="feed compact">${feed.map(f => `<li><b>${esc(f.who)}</b> ${esc(f.what)} <small class="muted">${timeAgo(f.at)}</small></li>`).join('') || '<li class="muted">Nothing yet.</li>'}</ul>
      </section>
    </div>`,
    mount(el) { bindTaught(el, ctx); },
  };
}

function bindTaught(el, ctx) {
  $$('[data-taught]', el).forEach(b => b.addEventListener('click', () => {
    const [secId, pid, n] = b.dataset.taught.split('|');
    const sec = section(school(ctx.me.schoolId), secId);
    setTaught(sec, pid, +n, true);
    log(ctx.me.name, `taught "${projectById(pid).activities[n - 1].title}" to ${sec.name}`, ctx.me.schoolId);
    toast(`Marked as taught for ${sec.name}.`); ctx.rerender();
  }));
}

/* ---------- One grade ---------- */
function gradePage(ctx, g) {
  const sch = school(ctx.me.schoolId);
  const secs = sectionsOf(ctx.me).filter(s => s.grade === g);
  const sec = secs.find(s => s.id === state.sec[g]) || secs[0];
  const kids = studentsOf(sch.id, sec.id);
  const pids = Object.values(sec.projects);
  const pid = pids.includes(state.proj[sec.id]) ? state.proj[sec.id] : currentProject(sec, kids);
  const P = projectById(pid);
  const S = stats(kids);
  const qa = quizAnalysis(kids, pid), ra = rubricAnalysis(kids, pid);
  const attention = needsAttention(sec, kids);
  return {
    title: `Grade ${g}`, nav: `g${g}`,
    html: `
    <div class="grade-head g${g}"><span class="gnum lg">${g}</span><div><p class="eyebrow">Kaushal Bodh · Grade ${g}</p><h2>${secs.length > 1 ? 'Your sections' : esc(secLabel(sec))}</h2></div>
      ${secs.length > 1 ? `<div class="seg-tabs" role="group" aria-label="Section">${secs.map(s => `<button data-sec="${s.id}" aria-pressed="${s.id === sec.id}">${esc(s.name)}</button>`).join('')}</div>` : ''}</div>
    <div class="kpis">
      <div class="kpi"><span>${icon('users')}</span><b>${kids.length}</b><p>Students in ${esc(sec.name)}</p></div>
      <div class="kpi"><span>${icon('check')}</span><b>${S.completion}%</b><p>Activities done this year</p></div>
      <div class="kpi"><span>${icon('chart')}</span><b>${S.score == null ? '—' : `${S.score}%`}</b><p>Average score so far</p></div>
      <div class="kpi ${S.vivaDue ? 'warn' : ''}"><span>${icon('mic')}</span><b>${S.vivaDue}</b><p>Vivas to mark</p></div>
    </div>
    <div class="proj-strip">${pids.map(id => {
      const p = projectById(id); const avg = kids.length ? Math.round(kids.reduce((n, k) => n + projectScore(progress(k.id, id), id).activityPct, 0) / kids.length) : 0;
      return `<button class="pstrip f-${p.form} ${id === pid ? 'on' : ''}" data-proj="${id}" aria-pressed="${id === pid}"><span class="mini-art">${art(p.art)}</span><span><small class="form-tag">${esc(FORMS[p.form].short)}</small><b>${esc(p.title)}</b>${bar(avg, FORM_COLOR[p.form])}<small class="muted">${avg}% of activities done</small></span></button>`;
    }).join('')}</div>
    <section class="card"><div class="card-head"><h2 class="h-card">${icon('chart')} Class progress · ${esc(P.title)}</h2><a class="btn btn-ghost btn-sm" href="#/teacher/lessons" data-lesson="${sec.id}|${pid}">Lesson plan</a></div>
      ${heatmap(kids, pid, k => `#/teacher/student/${k.id}`)}</section>
    <div class="grid-2">
      <section class="card"><h2 class="h-card">${icon('quiz')} Quiz: where the class struggles</h2>${quizBars(qa)}</section>
      <section class="card"><h2 class="h-card">${icon('star')} Work values (observation)</h2>
        <p class="muted small">Class average on the 1–4 rubric. Green is 3 or more.</p>${rubricBars(ra.obs)}
        <h2 class="h-card">${icon('mic')} Viva criteria</h2>${rubricBars(ra.viva)}</section>
    </div>
    <section class="card"><h2 class="h-card">${icon('bell')} Students to check on</h2>
      ${attention.length ? `<ul class="attn cols">${attention.map(x => `<li><a href="#/teacher/student/${x.k.id}"><b>${esc(x.k.name)}</b></a><small class="muted">${esc(x.why)}</small></li>`).join('')}</ul>` : '<p class="muted">Everyone in this section is on track.</p>'}</section>
    <h2 class="h-sec">Mark ${esc(P.title)}</h2>
    ${markTable(kids, pid)}`,
    mount(el) {
      $$('[data-sec]', el).forEach(b => b.addEventListener('click', () => { state.sec[g] = b.dataset.sec; ctx.rerender(); }));
      $$('[data-proj]', el).forEach(b => b.addEventListener('click', () => { state.proj[sec.id] = b.dataset.proj; ctx.rerender(); }));
      $$('[data-lesson]', el).forEach(a => a.addEventListener('click', () => { const [s, p] = a.dataset.lesson.split('|'); state.lessonSec = s; state.lessonProj = p; }));
      bindMark(el, ctx, pid);
    },
  };
}

/* ---------- Lesson plans ---------- */
function lessons(ctx) {
  const sch = school(ctx.me.schoolId);
  const secs = sectionsOf(ctx.me);
  const sec = secs.find(s => s.id === state.lessonSec) || secs[0];
  const kids = studentsOf(sch.id, sec.id);
  const pids = Object.values(sec.projects);
  const pid = pids.includes(state.lessonProj) ? state.lessonProj : currentProject(sec, kids);
  const P = projectById(pid);
  const taught = sec.taught?.[pid] || [];
  // Spread the project's periods across its activities in double periods (two a session, two sessions a week).
  const S = Math.ceil(P.periods / 2), n = P.activities.length;
  const rows = P.activities.map((a, i) => { const from = Math.floor(i * S / n) + 1; return { a, from, to: Math.max(from, Math.floor((i + 1) * S / n)) }; });
  return {
    title: 'Lesson plans', nav: 'lessons',
    html: `<div class="toolbar">
      <label class="sel"><span class="sr-only">Section</span><select id="l-sec">${secs.map(s => `<option value="${s.id}" ${s.id === sec.id ? 'selected' : ''}>${esc(secLabel(s))}</option>`).join('')}</select></label>
      <div class="seg-tabs" role="group" aria-label="Project">${pids.map(id => `<button data-lproj="${id}" aria-pressed="${id === pid}">${esc(projectById(id).title)}</button>`).join('')}</div>
      <button class="btn btn-ghost btn-sm" id="print">${icon('download')} Print</button>
    </div>
    <section class="proj-head f-${P.form}"><div class="ph-art">${art(P.art)}</div><div class="ph-copy"><span class="form-tag">${esc(FORMS[P.form].name)} · Grade ${P.grade}</span><h2>${esc(P.title)}</h2><p>${esc(P.summary)}</p>
      <div class="chips"><span class="chip">${icon('book')} pp. ${P.pages[0]}–${P.pages[1]}</span><span class="chip">${icon('calendar')} ${P.periods} periods ≈ ${Math.ceil(P.periods / 4)} weeks</span><span class="chip">${taught.length}/${P.activities.length} taught</span></div></div>
      <div class="ph-ring">${ring(taught.length / P.activities.length * 100, { size: 110, stroke: 11, color: FORM_COLOR[P.form], sub: 'taught' })}</div></section>
    <div class="proj-grid">
      <ol class="lesson-list">${rows.map(({ a, from, to }) => { const on = taught.includes(a.n); const share = doneShare(kids, pid, a.n); return `<li class="lesson ${on ? 'done' : ''} f-${P.form}">
        <label class="lcheck"><input type="checkbox" data-n="${a.n}" ${on ? 'checked' : ''}><span class="act-n">${on ? icon('check') : a.n}</span></label>
        <div class="l-body"><div class="l-top"><b>${esc(a.title)}</b><span class="chip">Session${to > from ? `s ${from}–${to}` : ` ${from}`} · wk ${Math.ceil(from / 2)}</span></div>
          <p>${esc(a.task)}</p>
          <div class="l-meta"><span>${icon('book')} Page ${a.page}</span><span class="l-share">${bar(share, FORM_COLOR[P.form])}<small>${share}% of students done</small></span></div></div></li>`; }).join('')}</ol>
      <aside class="proj-side">
        <section class="card"><h3 class="h-card">${icon('flask')} Gather beforehand</h3><ul>${P.materials.map(x => `<li>${esc(x)}</li>`).join('')}</ul></section>
        <section class="card"><h3 class="h-card">${icon('shield')} Safety briefing</h3><ul>${P.safety.map(x => `<li>${esc(x)}</li>`).join('')}</ul></section>
        <section class="card"><h3 class="h-card">${icon('mic')} Viva questions</h3><ol class="viva-list">${P.viva.map(x => `<li>${esc(x)}</li>`).join('')}</ol></section>
      </aside>
    </div>`,
    mount(el) {
      $('#l-sec', el).addEventListener('change', e => { state.lessonSec = e.target.value; state.lessonProj = null; ctx.rerender(); });
      $$('[data-lproj]', el).forEach(b => b.addEventListener('click', () => { state.lessonSec = sec.id; state.lessonProj = b.dataset.lproj; ctx.rerender(); }));
      $('#print', el).addEventListener('click', () => print());
      $$('.lcheck input', el).forEach(cb => cb.addEventListener('change', () => {
        setTaught(sec, pid, +cb.dataset.n, cb.checked);
        if (cb.checked) log(ctx.me.name, `taught "${P.activities[cb.dataset.n - 1].title}" to ${sec.name}`, ctx.me.schoolId);
        state.lessonSec = sec.id; state.lessonProj = pid;
        toast(cb.checked ? 'Marked as taught.' : 'Marked as not taught.'); ctx.rerender();
      }));
    },
  };
}

/* ---------- Marking ---------- */
function mark(ctx) {
  const sch = school(ctx.me.schoolId);
  const secs = sectionsOf(ctx.me);
  const sec = secs.find(s => s.id === state.markSec) || secs[0];
  const kids = studentsOf(sch.id, sec.id);
  const pid = Object.values(sec.projects).includes(state.markProj) ? state.markProj : currentProject(sec, kids);
  return {
    title: 'Mark work', nav: 'mark',
    html: `<p class="lead-in">Quizzes and activity books mark themselves. Tap a name to mark the viva, observation and portfolio rubrics; the viva questions are inside.</p>
    <div class="toolbar">
      <label class="sel"><span class="sr-only">Section</span><select id="m-sec">${secs.map(s => `<option value="${s.id}" ${s.id === sec.id ? 'selected' : ''}>${esc(secLabel(s))}</option>`).join('')}</select></label>
      <label class="sel"><span class="sr-only">Project</span><select id="m-proj">${Object.values(sec.projects).map(id => `<option value="${id}" ${id === pid ? 'selected' : ''}>${esc(projectById(id).title)}</option>`).join('')}</select></label>
    </div>
    ${markTable(kids, pid)}`,
    mount(el) {
      $('#m-sec', el).addEventListener('change', e => { state.markSec = e.target.value; state.markProj = null; ctx.rerender(); });
      $('#m-proj', el).addEventListener('change', e => { state.markSec = sec.id; state.markProj = e.target.value; ctx.rerender(); });
      bindMark(el, ctx, pid);
    },
  };
}

/* ---------- Students ---------- */
function students(ctx) {
  const sch = school(ctx.me.schoolId);
  const secs = sectionsOf(ctx.me);
  const rows = secs.flatMap(sec => studentsOf(sch.id, sec.id).map(s => ({ s, sec, y: yearSummary(db().progress[s.id], Object.values(sec.projects)), la: lastActive(s.id) })));
  return {
    title: 'My students', nav: 'students',
    html: `<div class="toolbar">
      <label class="search">${icon('eye')}<span class="sr-only">Search students</span><input id="q" placeholder="Search by name" value="${esc(state.q)}"></label>
      <div class="seg-tabs" role="group" aria-label="Grade"><button data-fg="all" aria-pressed="${state.g === 'all'}">All</button>${myGrades(ctx.me).map(g => `<button data-fg="${g}" aria-pressed="${String(state.g) === String(g)}">Grade ${g}</button>`).join('')}</div>
    </div>
    <section class="card tbl-card"><table class="tbl" id="stu-tbl">
      <thead><tr><th>Name</th><th>Class</th><th>Activities</th><th>Score so far</th><th>Last active</th></tr></thead>
      <tbody>${rows.map(r => `<tr data-name="${esc(r.s.name.toLowerCase())}" data-g="${r.sec.grade}">
        <td><a href="#/teacher/student/${r.s.id}">${esc(r.s.name)}</a></td><td>${esc(secLabel(r.sec))}</td>
        <td><div class="cell-bar">${bar(r.y.activityPct)}<span>${r.y.actsDone}/${r.y.actsTotal}</span></div></td>
        <td>${r.y.score == null ? '—' : `${r.y.score}% <small class="muted">${band(r.y.score)}</small>`}</td>
        <td class="${!r.la || Date.now() - r.la > INACTIVE_DAYS * 86400000 ? 'warn-txt' : ''}">${timeAgo(r.la)}</td></tr>`).join('')}</tbody>
    </table><p class="muted small" id="count"></p></section>`,
    mount(el) {
      const filter = () => {
        const q = $('#q', el).value.trim().toLowerCase(); state.q = q;
        let n = 0;
        $$('#stu-tbl tbody tr', el).forEach(tr => { const show = tr.dataset.name.includes(q) && (state.g === 'all' || tr.dataset.g === String(state.g)); tr.hidden = !show; if (show) n++; });
        $('#count', el).textContent = `${n} student${n === 1 ? '' : 's'}`;
      };
      $('#q', el).addEventListener('input', filter);
      $$('[data-fg]', el).forEach(b => b.addEventListener('click', () => { state.g = b.dataset.fg; $$('[data-fg]', el).forEach(x => x.setAttribute('aria-pressed', x === b)); filter(); }));
      filter();
    },
  };
}
