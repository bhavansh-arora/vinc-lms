// Teacher portal: a Kaushal Bodh teacher's own sections, monitored grade by grade.
import { FORMS, projectById } from '../../data/courses.js';
import { db, school, section, studentsOf, sectionsOf, progress, lastActive, user, setTaught, log } from '../store.js';
import { projectScore, yearSummary, band } from '../scoring.js';
import { $, $$, esc, icon, art, ring, bar, timeAgo, toast, modal, FORM_COLOR } from '../ui.js';
import { loadLessons, lessonsFor, lessonOf, launchLab, LAB_KIND } from './activity.js';
import { t, tx } from '../../i18n.js';
import { stats, secLabel, heatmap, markTable, bindMark, studentDetail, currentProject, quizAnalysis, rubricAnalysis, rubricBars, quizBars, INACTIVE_DAYS, codeCard, bindCodeCards } from './shared.js';

const myGrades = me => [...new Set(sectionsOf(me).map(s => s.grade))];

export const nav = ctx => [
  { path: '', label: t('My classes'), short: t('Classes'), icon: 'home' },
  ...myGrades(ctx.me).map(g => ({ path: `g${g}`, label: t('Grade {g}', { g }), short: t('Gr {g}', { g }), icon: 'school' })),
  { path: 'lessons', label: t('Lesson plans'), short: t('Lessons'), icon: 'calendar' },
  { path: 'mark', label: t('Mark work'), short: t('Mark'), icon: 'check' },
  { path: 'students', label: t('Students'), icon: 'users' },
];

export function render(ctx) {
  const [page, a] = ctx.params;
  if (state.who !== ctx.me.id) Object.assign(state, { who: ctx.me.id, sec: {}, proj: {}, lessonSec: null, lessonProj: null, markSec: null, markProj: null, q: '', g: 'all' });
  const secs = sectionsOf(ctx.me);
  if (!secs.length) return { title: t('My classes'), html: `<div class="empty"><p><b>${t('No sections are assigned to you yet.')}</b></p><p>${t('Ask your Kaushal Bodh coordinator to add you to your sections. Your User ID is <span class="mono">{login}</span>.', { login: esc(ctx.me.login) })}</p></div>` };
  if (/^g\d$/.test(page || '') && secs.some(s => s.grade === +page.slice(1))) return gradePage(ctx, +page.slice(1));
  if (page === 'lessons') return lessons(ctx);
  if (page === 'mark') return mark(ctx);
  if (page === 'students') return students(ctx);
  if (page === 'student') {
    const s = user(a);
    if (!s || !secs.some(x => x.id === s.sectionId)) return { title: t('Student'), html: `<div class="empty"><p>${t('This student is not in your sections.')}</p></div>` };
    return { ...studentDetail(ctx, s, { href: '#/teacher/students', label: t('My students') }), nav: 'students' };
  }
  return overview(ctx);
}

const state = { sec: {}, proj: {}, lessonSec: null, lessonProj: null, markSec: null, markProj: null, q: '', g: 'all' };
const nextToTeach = (sec, pid) => projectById(pid).activities.find(a => !(sec.taught?.[pid] || []).includes(a.n));
const doneShare = (kids, pid, n) => kids.length ? Math.round(kids.filter(k => progress(k.id, pid)?.acts[n]?.done).length / kids.length * 100) : 0;
const hello = name => { const h = new Date().getHours(); return t(h < 12 ? 'Good morning, {name}' : h < 17 ? 'Good afternoon, {name}' : 'Good evening, {name}', { name }); };

// Students who need a nudge: inactive for two weeks, or well behind their section.
function needsAttention(sec, kids) {
  const ys = kids.map(k => ({ k, y: yearSummary(db().progress[k.id], Object.values(sec.projects)), la: lastActive(k.id) }));
  const avg = ys.length ? ys.reduce((n, x) => n + x.y.activityPct, 0) / ys.length : 0;
  return ys.filter(x => !x.la || Date.now() - x.la > INACTIVE_DAYS * 86400000 || x.y.activityPct < avg - 20)
    .map(x => ({ ...x, sec, why: !x.la || Date.now() - x.la > INACTIVE_DAYS * 86400000 ? t('inactive {when}', { when: timeAgo(x.la) }) : t('{pct}% done vs {avg}% class average', { pct: x.y.activityPct, avg: Math.round(avg) }) }));
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
    title: t('My classes'), nav: '',
    html: `
    <section class="hero-card">
      <div class="hc-copy">
        <p class="eyebrow">${t('{school} · Kaushal Bodh teacher', { school: esc(sch.name) })}</p>
        <h2>${hello(esc(me.name.split(' ')[0]))}</h2>
        <p>${t(secs.length > 1 ? 'You teach <b>{n} sections</b>' : 'You teach <b>{n} section</b>', { n: secs.length })} ${t(myGrades(me).length > 1 ? 'across Grades {grades}: {kids} students.' : 'across Grade {grades}: {kids} students.', { grades: myGrades(me).join(', '), kids: allKids.length })} ${S.vivaDue ? t(S.vivaDue > 1 ? '<b>{n} vivas are</b> ready to mark.' : '<b>{n} viva is</b> ready to mark.', { n: S.vivaDue }) : t('No vivas waiting.')}</p>
        <a class="btn btn-brand" href="#/teacher/lessons">${t('Open lesson plans')} ${icon('arrow')}</a>
      </div>
      <div class="hc-ring">${ring(S.completion, { size: 150, stroke: 14, sub: t('activities done') })}</div>
    </section>
    <h2 class="h-sec">${t('Next up in each class')}</h2>
    <div class="today-grid">${secs.map(sec => {
      const kids = studentsOf(sch.id, sec.id); const pid = currentProject(sec, kids); const P = projectById(pid); const a = nextToTeach(sec, pid);
      return `<section class="card today f-${P.form}">
        <div class="td-top"><span class="gnum sm g${sec.grade}">${sec.grade}</span><div><b>${esc(secLabel(sec))}</b><small class="muted">${t('{n} students', { n: kids.length })} · ${esc(P.title)}</small></div></div>
        ${a ? `<div class="td-act"><span class="act-n">${a.n}</span><div><b>${esc(a.title)}</b><small>${esc(a.task)}</small><small class="muted">${icon('book')} ${t('Kaushal Bodh Grade {g}, page {page} · {pct}% of the class have done it', { g: sec.grade, page: a.page, pct: doneShare(kids, pid, a.n) })}</small></div></div>
          <div class="td-btns"><button class="btn btn-brand btn-sm" data-taught="${sec.id}|${pid}|${a.n}">${icon('check')} ${t('Mark as taught')}</button><a class="btn btn-ghost btn-sm" href="#/teacher/g${sec.grade}">${t('Grade {g} view', { g: sec.grade })}</a></div>`
          : `<p>${t('All activities in {title} are taught. Time for the quiz and vivas.', { title: esc(P.title) })}</p><a class="btn btn-brand btn-sm" href="#/teacher/mark">${t('Mark vivas')}</a>`}
      </section>`;
    }).join('')}</div>
    <h2 class="h-sec">${t('Your grades')}</h2>
    <div class="grade-cards">${myGrades(me).map(g => {
      const gs = secs.filter(s => s.grade === g); const gk = gs.flatMap(s => studentsOf(sch.id, s.id)); const st = stats(gk);
      return `<a class="card grade-card link g${g}" href="#/teacher/g${g}"><div class="gc-top"><span class="gnum">${g}</span><div><b>${t('Grade {g}', { g })}</b><small class="muted">${gs.map(s => esc(s.name)).join(', ')} · ${t('{n} students', { n: gk.length })}</small></div>${icon('arrow')}</div>
        <div class="gc-row"><span>${t('Activities')}</span>${bar(st.completion)}<b>${st.completion}%</b></div>
        <div class="gc-row"><span>${t('Score so far')}</span>${bar(st.score)}<b>${st.score == null ? '—' : `${st.score}%`}</b></div>
        <p class="muted small">${t('{n} quiz attempts', { n: st.quizzes })} · ${t(st.vivaDue === 1 ? '{n} viva to mark' : '{n} vivas to mark', { n: st.vivaDue })} · ${t('{n} inactive', { n: st.inactive })}</p></a>`;
    }).join('')}</div>
    <div class="grid-2">
      <section class="card"><h2 class="h-card">${icon('bell')} ${t('Needs your attention')}</h2>
        ${attention.length ? `<ul class="attn">${attention.map(x => `<li><a href="#/teacher/student/${x.k.id}"><b>${esc(x.k.name)}</b></a><small class="muted">${esc(secLabel(x.sec))} · ${esc(x.why)}</small></li>`).join('')}</ul>${attentionAll.length > attention.length ? `<p class="muted small">${t('and {n} more · see each grade page', { n: attentionAll.length - attention.length })}</p>` : ''}` : `<p class="muted">${t('Everyone is on track.')}</p>`}
      </section>
      <section class="card"><h2 class="h-card">${icon('eye')} ${t('Latest from your students')}</h2>
        <ul class="feed compact">${feed.map(f => `<li><b>${esc(f.who)}</b> ${esc(tx(f.what))} <small class="muted">${timeAgo(f.at)}</small></li>`).join('') || `<li class="muted">${t('Nothing yet.')}</li>`}</ul>
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
    toast(t('Marked as taught for {name}.', { name: sec.name })); ctx.rerender();
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
    title: t('Grade {g}', { g }), nav: `g${g}`,
    html: `
    <div class="grade-head g${g}"><span class="gnum lg">${g}</span><div><p class="eyebrow">${t('Kaushal Bodh · Grade {g}', { g })}</p><h2>${secs.length > 1 ? t('Your sections') : esc(secLabel(sec))}</h2></div>
      ${secs.length > 1 ? `<div class="seg-tabs" role="group" aria-label="${t('Section')}">${secs.map(s => `<button data-sec="${s.id}" aria-pressed="${s.id === sec.id}">${esc(s.name)}</button>`).join('')}</div>` : ''}</div>
    <div class="kpis">
      <div class="kpi"><span>${icon('users')}</span><b>${kids.length}</b><p>${t('Students in {name}', { name: esc(sec.name) })}</p></div>
      <div class="kpi"><span>${icon('check')}</span><b>${S.completion}%</b><p>${t('Activities done this year')}</p></div>
      <div class="kpi"><span>${icon('chart')}</span><b>${S.score == null ? '—' : `${S.score}%`}</b><p>${t('Average score so far')}</p></div>
      <div class="kpi ${S.vivaDue ? 'warn' : ''}"><span>${icon('mic')}</span><b>${S.vivaDue}</b><p>${t('Vivas to mark')}</p></div>
    </div>
    <div class="proj-strip">${pids.map(id => {
      const p = projectById(id); const avg = kids.length ? Math.round(kids.reduce((n, k) => n + projectScore(progress(k.id, id), id).activityPct, 0) / kids.length) : 0;
      return `<button class="pstrip f-${p.form} ${id === pid ? 'on' : ''}" data-proj="${id}" aria-pressed="${id === pid}"><span class="mini-art">${art(p.art)}</span><span><small class="form-tag">${esc(FORMS[p.form].short)}</small><b>${esc(p.title)}</b>${bar(avg, FORM_COLOR[p.form])}<small class="muted">${t('{pct}% of activities done', { pct: avg })}</small></span></button>`;
    }).join('')}</div>
    <section class="card"><div class="card-head"><h2 class="h-card">${icon('chart')} ${t('Class progress · {title}', { title: esc(P.title) })}</h2><a class="btn btn-ghost btn-sm" href="#/teacher/lessons" data-lesson="${sec.id}|${pid}">${t('Lesson plan')}</a></div>
      ${heatmap(kids, pid, k => `#/teacher/student/${k.id}`)}</section>
    <div class="grid-2">
      <section class="card"><h2 class="h-card">${icon('quiz')} ${t('Quiz: where the class struggles')}</h2>${quizBars(qa)}</section>
      <section class="card"><h2 class="h-card">${icon('star')} ${t('Work values (observation)')}</h2>
        <p class="muted small">${t('Class average on the 1–4 rubric. Green is 3 or more.')}</p>${rubricBars(ra.obs)}
        <h2 class="h-card">${icon('mic')} ${t('Viva criteria')}</h2>${rubricBars(ra.viva)}</section>
    </div>
    <section class="card"><h2 class="h-card">${icon('bell')} ${t('Students to check on')}</h2>
      ${attention.length ? `<ul class="attn cols">${attention.map(x => `<li><a href="#/teacher/student/${x.k.id}"><b>${esc(x.k.name)}</b></a><small class="muted">${esc(x.why)}</small></li>`).join('')}</ul>` : `<p class="muted">${t('Everyone in this section is on track.')}</p>`}</section>
    <h2 class="h-sec">${t('Mark {title}', { title: esc(P.title) })}</h2>
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
  const loaded = !!lessonsFor(pid);
  const labShare = an => kids.length ? Math.round(kids.filter(k => progress(k.id, pid)?.labs?.[an]).length / kids.length * 100) : 0;
  return {
    title: t('Lesson plans'), nav: 'lessons',
    html: `<div class="toolbar">
      <label class="sel"><span class="sr-only">${t('Section')}</span><select id="l-sec">${secs.map(s => `<option value="${s.id}" ${s.id === sec.id ? 'selected' : ''}>${esc(secLabel(s))}</option>`).join('')}</select></label>
      <div class="seg-tabs" role="group" aria-label="${t('Project')}">${pids.map(id => `<button data-lproj="${id}" aria-pressed="${id === pid}">${esc(projectById(id).title)}</button>`).join('')}</div>
      <button class="btn btn-ghost btn-sm" id="print">${icon('download')} ${t('Print')}</button>
    </div>
    <section class="proj-head f-${P.form}"><div class="ph-art">${art(P.art)}</div><div class="ph-copy"><span class="form-tag">${t('{form} · Grade {g}', { form: esc(FORMS[P.form].name), g: P.grade })}</span><h2>${esc(P.title)}</h2><p>${esc(P.summary)}</p>
      <div class="chips"><span class="chip">${icon('book')} ${t('pp. {from}–{to}', { from: P.pages[0], to: P.pages[1] })}</span><span class="chip">${icon('calendar')} ${t('{n} periods ≈ {w} weeks', { n: P.periods, w: Math.ceil(P.periods / 4) })}</span><span class="chip">${t('{n}/{total} taught', { n: taught.length, total: P.activities.length })}</span></div></div>
      <div class="ph-ring">${ring(taught.length / P.activities.length * 100, { size: 110, stroke: 11, color: FORM_COLOR[P.form], sub: t('taught') })}</div></section>
    <div class="proj-grid">
      <ol class="lesson-list">${rows.map(({ a, from, to }) => { const on = taught.includes(a.n); const share = doneShare(kids, pid, a.n); return `<li class="lesson ${on ? 'done' : ''} f-${P.form}">
        <label class="lcheck"><input type="checkbox" data-n="${a.n}" ${on ? 'checked' : ''}><span class="act-n">${on ? icon('check') : a.n}</span></label>
        <div class="l-body"><div class="l-top"><b>${esc(a.title)}</b><span class="chip">${to > from ? t('Sessions {from}–{to} · wk {w}', { from, to, w: Math.ceil(from / 2) }) : t('Session {from} · wk {w}', { from, w: Math.ceil(from / 2) })}</span></div>
          <p>${esc(a.task)}</p>
          <div class="l-meta"><span>${icon('book')} ${t('Page {n}', { n: a.page })}</span><span class="l-share">${bar(share, FORM_COLOR[P.form])}<small>${t('{pct}% of students done', { pct: share })}</small></span></div>
          ${loaded && lessonOf(pid, a.n) ? `<div class="l-tools"><button class="btn btn-ghost btn-sm" data-lesson="${a.n}">${icon('book')} ${t('Lesson')}</button>${lessonOf(pid, a.n).lab ? `<button class="btn btn-ghost btn-sm" data-lab="${a.n}">${LAB_KIND[lessonOf(pid, a.n).lab.type]?.[1] || '🧪'} ${t('Open the lab')}</button><small class="muted">${t('{pct}% played it', { pct: labShare(a.n) })}</small>` : ''}</div>` : ''}</div></li>`; }).join('')}</ol>
      <aside class="proj-side">
        <section class="card"><h3 class="h-card">${icon('flask')} ${t('Gather beforehand')}</h3><ul>${P.materials.map(x => `<li>${esc(x)}</li>`).join('')}</ul></section>
        <section class="card"><h3 class="h-card">${icon('shield')} ${t('Safety briefing')}</h3><ul>${P.safety.map(x => `<li>${esc(x)}</li>`).join('')}</ul></section>
        <section class="card"><h3 class="h-card">${icon('mic')} ${t('Viva questions')}</h3><ol class="viva-list">${P.viva.map(x => `<li>${esc(x)}</li>`).join('')}</ol></section>
      </aside>
    </div>`,
    mount(el) {
      $('#l-sec', el).addEventListener('change', e => { state.lessonSec = e.target.value; state.lessonProj = null; ctx.rerender(); });
      $$('[data-lproj]', el).forEach(b => b.addEventListener('click', () => { state.lessonSec = sec.id; state.lessonProj = b.dataset.lproj; ctx.rerender(); }));
      $('#print', el).addEventListener('click', () => print());
      if (!loaded) loadLessons(pid).then(() => { state.lessonSec = sec.id; state.lessonProj = pid; ctx.rerender(); });
      // Show the full in-app lesson, or open the lab on the class screen (teacher plays are not recorded).
      $$('[data-lesson]', el).forEach(b => b.addEventListener('click', () => {
        const an = +b.dataset.lesson, L = lessonOf(pid, an), A = P.activities[an - 1];
        modal(`<p class="eyebrow">${t('Activity {n}', { n: an })} · ${esc(L.time || '')} · ${esc(L.group || '')}</p><h2>${esc(A.title)}</h2><p>${esc(L.intro)}</p>
          ${L.need?.length ? `<h3>${t('You\'ll need')}</h3><ul>${L.need.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
          <h3>${t('Steps')}</h3><ol>${L.steps.map(x => `<li><b>${esc(x.t)}.</b> ${esc(x.d)}</li>`).join('')}</ol>
          ${L.safety?.length ? `<h3>${t('Safety')}</h3><ul>${L.safety.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
          ${L.think?.length ? `<h3>${t('Discuss')}</h3><ul>${L.think.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
          <div class="modal-actions"><button class="btn btn-ghost" data-close>${t('Close')}</button></div>`, { wide: true });
      }));
      $$('[data-lab]', el).forEach(b => b.addEventListener('click', () => launchLab(ctx, P, +b.dataset.lab, lessonOf(pid, +b.dataset.lab), { record: false })));
      $$('.lcheck input', el).forEach(cb => cb.addEventListener('change', () => {
        setTaught(sec, pid, +cb.dataset.n, cb.checked);
        if (cb.checked) log(ctx.me.name, `taught "${P.activities[cb.dataset.n - 1].title}" to ${sec.name}`, ctx.me.schoolId);
        state.lessonSec = sec.id; state.lessonProj = pid;
        toast(cb.checked ? t('Marked as taught.') : t('Marked as not taught.')); ctx.rerender();
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
    title: t('Mark work'), nav: 'mark',
    html: `<p class="lead-in">${t('Quizzes and activity books mark themselves. Tap a name to mark the viva, observation and portfolio rubrics; the viva questions are inside.')}</p>
    <div class="toolbar">
      <label class="sel"><span class="sr-only">${t('Section')}</span><select id="m-sec">${secs.map(s => `<option value="${s.id}" ${s.id === sec.id ? 'selected' : ''}>${esc(secLabel(s))}</option>`).join('')}</select></label>
      <label class="sel"><span class="sr-only">${t('Project')}</span><select id="m-proj">${Object.values(sec.projects).map(id => `<option value="${id}" ${id === pid ? 'selected' : ''}>${esc(projectById(id).title)}</option>`).join('')}</select></label>
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
    title: t('My students'), nav: 'students',
    html: `${codeCard(sch, 'studentCode', { note: t('Students create their own account: they choose {school}, enter this code and pick their class. Share it in class.', { school: sch?.name ? esc(sch.name) : t('your school') }) })}
    <div class="toolbar">
      <label class="search">${icon('eye')}<span class="sr-only">${t('Search students')}</span><input id="q" placeholder="${t('Search by name')}" value="${esc(state.q)}"></label>
      <div class="seg-tabs" role="group" aria-label="${t('Grade')}"><button data-fg="all" aria-pressed="${state.g === 'all'}">${t('All')}</button>${myGrades(ctx.me).map(g => `<button data-fg="${g}" aria-pressed="${String(state.g) === String(g)}">${t('Grade {g}', { g })}</button>`).join('')}</div>
    </div>
    <section class="card tbl-card"><table class="tbl" id="stu-tbl">
      <thead><tr><th>${t('Name')}</th><th>${t('Class')}</th><th>${t('Activities')}</th><th>${t('Score so far')}</th><th>${t('Last active')}</th></tr></thead>
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
        $('#count', el).textContent = t(n === 1 ? '{n} student' : '{n} students', { n });
      };
      $('#q', el).addEventListener('input', filter);
      bindCodeCards(el, ctx, sch);
      $$('[data-fg]', el).forEach(b => b.addEventListener('click', () => { state.g = b.dataset.fg; $$('[data-fg]', el).forEach(x => x.setAttribute('aria-pressed', x === b)); filter(); }));
      filter();
    },
  };
}
