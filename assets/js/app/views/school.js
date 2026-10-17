// School dashboard: overview, year plan, students, marking, reports and white-label branding.
import { GRADE6, FORMS, WEIGHTS, VIVA_RUBRIC, OBSERVATION_RUBRIC, RUBRIC_LEVELS, projectById } from '../../data/grade6.js';
import { db, save, school, section, studentsOf, projectsFor, progress, lastActive, log, addStudent, initials, user } from '../store.js';
import { projectScore, yearSummary, band } from '../scoring.js';
import { $, $$, esc, icon, art, ring, bar, fmtDate, timeAgo, daysUntil, toast, modal, download, csvCell, FORM_COLOR, PART_COLOR } from '../ui.js';

export const nav = () => [
  { path: '', label: 'Overview', icon: 'home' },
  { path: 'grade', label: 'Mark work', short: 'Mark', icon: 'check' },
  { path: 'students', label: 'Students', icon: 'users' },
  { path: 'plan', label: 'Year plan', short: 'Plan', icon: 'calendar' },
  { path: 'reports', label: 'Reports', icon: 'chart' },
  { path: 'brand', label: 'Branding', icon: 'brush' },
];

export function render(ctx) {
  const sch = school(ctx.me.schoolId);
  const [page, a] = ctx.params;
  switch (page) {
    case 'plan': return plan(ctx, sch);
    case 'students': return students(ctx, sch);
    case 'student': return studentDetail(ctx, sch, a);
    case 'grade': return grade(ctx, sch);
    case 'reports': return reports(ctx, sch);
    case 'brand': return brand(ctx, sch);
    default: return overview(ctx, sch);
  }
}

const allStudents = sch => studentsOf(sch.id);
const secName = (sch, id) => section(sch, id)?.name || '';
const state = { sec: null, proj: null, q: '' };

function stats(sch) {
  const st = allStudents(sch);
  const prog = db().progress;
  let acts = 0, total = 0, quizzes = 0, vivaDue = 0, inactive = 0;
  const per = st.map(s => {
    const ids = projectsFor(s); const y = yearSummary(prog[s.id], ids);
    acts += y.actsDone; total += y.actsTotal;
    for (const id of ids) {
      const pr = prog[s.id]?.[id]; if (!pr) continue;
      quizzes += pr.quiz.length;
      const sc = projectScore(pr, id);
      if (sc.done === sc.total && !pr.viva) vivaDue++;
    }
    const la = lastActive(s.id);
    if (!la || Date.now() - la > 14 * 86400000) inactive++;
    return { s, y };
  });
  return { st, per, completion: total ? Math.round(acts / total * 100) : 0, quizzes, vivaDue, inactive };
}

/* ---------- Overview ---------- */
function overview(ctx, sch) {
  const S = stats(sch);
  state.sec = state.sec && section(sch, state.sec) ? state.sec : sch.sections[0]?.id;
  const sec = section(sch, state.sec);
  const pid = state.proj && Object.values(sec.projects).includes(state.proj) ? state.proj : sec.projects.life;
  const P = projectById(pid);
  const kids = studentsOf(sch.id, sec.id);
  const feed = db().log.filter(l => l.schoolId === sch.id).slice(0, 8);
  return {
    title: 'Overview', nav: '',
    html: `
    <section class="hero-card">
      <div class="hc-copy">
        <p class="eyebrow">${esc(sch.name)} · Grade 6 · ${sch.sections.length} section${sch.sections.length > 1 ? 's' : ''}</p>
        <h2>${esc(sch.studio)}</h2>
        <p>${S.st.length} students on Kaushal Bodh. ${S.vivaDue ? `<b>${S.vivaDue} viva${S.vivaDue > 1 ? 's' : ''}</b> ready to be marked.` : 'No vivas waiting.'} Kaushal Mela in <b>${Math.max(0, daysUntil(sch.melaDate))} days</b>.</p>
        <a class="btn btn-brand" href="#/school/grade">Mark work ${icon('arrow')}</a>
      </div>
      <div class="hc-ring">${ring(S.completion, { size: 150, stroke: 14, sub: 'activities done' })}</div>
    </section>
    <div class="kpis">
      <div class="kpi"><span>${icon('users')}</span><b>${S.st.length}<small>/${sch.seats}</small></b><p>Students (seats)</p></div>
      <div class="kpi"><span>${icon('quiz')}</span><b>${S.quizzes}</b><p>Quiz attempts</p></div>
      <div class="kpi"><span>${icon('mic')}</span><b>${S.vivaDue}</b><p>Vivas to mark</p></div>
      <div class="kpi ${S.inactive ? 'warn' : ''}"><span>${icon('bell')}</span><b>${S.inactive}</b><p>Inactive 14+ days</p></div>
    </div>
    <section class="card">
      <div class="card-head">
        <h2 class="h-card">${icon('chart')} Progress heatmap</h2>
        <div class="filters">
          <label class="sel"><span class="sr-only">Section</span><select id="hm-sec">${sch.sections.map(s => `<option value="${s.id}" ${s.id === sec.id ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select></label>
          <label class="sel"><span class="sr-only">Project</span><select id="hm-proj">${Object.values(sec.projects).map(id => `<option value="${id}" ${id === pid ? 'selected' : ''}>${esc(projectById(id).title)}</option>`).join('')}</select></label>
        </div>
      </div>
      <div class="heat-wrap"><table class="heat f-${P.form}">
        <thead><tr><th scope="col">Student</th>${P.activities.map(a => `<th scope="col" title="${esc(a.title)}">${a.n}</th>`).join('')}<th scope="col">Quiz</th><th scope="col">Viva</th></tr></thead>
        <tbody>${kids.map(k => { const pr = progress(k.id, pid); return `<tr><th scope="row"><a href="#/school/student/${k.id}">${esc(k.name)}</a></th>${P.activities.map(a => `<td class="${pr?.acts[a.n]?.done ? 'on' : ''}" title="${esc(a.title)}${pr?.acts[a.n]?.done ? ': done' : ''}"><span class="sr-only">${pr?.acts[a.n]?.done ? 'done' : 'not done'}</span></td>`).join('')}<td class="num">${pr?.quiz.length ? Math.max(...pr.quiz.map(q => q.score)) : '·'}</td><td class="num">${pr?.viva ? '✓' : '·'}</td></tr>`; }).join('')}</tbody>
      </table></div>
      <p class="muted small">Hover a cell to see the activity. Columns are the ${P.activities.length} activities of ${esc(P.title)}.</p>
    </section>
    <div class="grid-2">
      <section class="card"><h2 class="h-card">${icon('school')} Sections</h2>
        <ul class="sec-list">${sch.sections.map(s => { const ks = studentsOf(sch.id, s.id); const avg = ks.length ? Math.round(ks.reduce((n, k) => n + yearSummary(db().progress[k.id], projectsFor(k)).activityPct, 0) / ks.length) : 0; return `<li><div><b>${esc(s.name)}</b><small class="muted">${ks.length} students · ${Object.values(s.projects).map(id => esc(projectById(id).title)).join(', ')}</small></div>${bar(avg)}<span class="num">${avg}%</span></li>`; }).join('')}</ul>
      </section>
      <section class="card"><h2 class="h-card">${icon('bell')} Recent activity</h2>
        <ul class="feed compact">${feed.map(f => `<li><b>${esc(f.who)}</b> ${esc(f.what)} <small class="muted">${timeAgo(f.at)}</small></li>`).join('') || '<li class="muted">Nothing yet.</li>'}</ul>
      </section>
    </div>`,
    mount(el) {
      $('#hm-sec', el).addEventListener('change', e => { state.sec = e.target.value; state.proj = null; ctx.rerender(); });
      $('#hm-proj', el).addEventListener('change', e => { state.proj = e.target.value; ctx.rerender(); });
    },
  };
}

/* ---------- Year plan ---------- */
function plan(ctx, sch) {
  return {
    title: 'Year plan', nav: 'plan',
    html: `<p class="lead-in">Choose one project from each form of work for every section. CBSE asks for about 110 hours a year: two consecutive periods, twice a week.</p>
    ${sch.sections.map(s => `<section class="card plan-card" data-sec="${s.id}">
      <div class="card-head"><h2 class="h-card">${icon('school')} ${esc(s.name)}</h2><span class="muted small">${studentsOf(sch.id, s.id).length} students</span></div>
      <div class="plan-picks">${Object.values(FORMS).map(f => `<label class="f-${f.key}"><span class="form-tag">${esc(f.name)}</span>
        <select data-form="${f.key}">${GRADE6.projects.filter(p => p.form === f.key).map(p => `<option value="${p.id}" ${s.projects[f.key] === p.id ? 'selected' : ''}>${esc(p.title)} (${p.periods} periods)</option>`).join('')}</select></label>`).join('')}</div>
      <div class="plan-tl">${Object.values(s.projects).map(id => { const p = projectById(id); return `<div class="seg ${p.form}" style="flex-grow:${p.periods}"><b>${esc(p.title)}</b><small>${Math.round(p.periods / 4)} weeks</small></div>`; }).join('')}<div class="seg mela" style="flex-grow:6"><b>Mela</b></div></div>
    </section>`).join('')}
    <section class="card"><div class="card-head"><h2 class="h-card">${icon('star')} Kaushal Mela</h2></div>
      <label class="inline-field" for="mela">Date of your school's skill fair <input type="date" id="mela" value="${sch.melaDate}"></label>
      <button class="btn btn-brand" id="save-plan">Save plan</button>
    </section>`,
    mount(el) {
      $('#save-plan', el).addEventListener('click', () => {
        let changed = 0;
        $$('.plan-card', el).forEach(c => {
          const s = section(sch, c.dataset.sec);
          $$('select', c).forEach(sel => { if (s.projects[sel.dataset.form] !== sel.value) { s.projects[sel.dataset.form] = sel.value; changed++; } });
        });
        if ($('#mela', el).value) sch.melaDate = $('#mela', el).value;
        log(ctx.me.name, 'updated the year plan', sch.id);
        save(); toast(changed ? 'Plan saved. Students will see their new projects.' : 'Plan saved.'); ctx.rerender();
      });
      $$('.plan-card select', el).forEach(sel => sel.addEventListener('change', () => {
        const c = sel.closest('.plan-card');
        const ids = $$('select', c).map(x => x.value);
        $('.plan-tl', c).innerHTML = ids.map(id => { const p = projectById(id); return `<div class="seg ${p.form}" style="flex-grow:${p.periods}"><b>${esc(p.title)}</b><small>${Math.round(p.periods / 4)} weeks</small></div>`; }).join('') + '<div class="seg mela" style="flex-grow:6"><b>Mela</b></div>';
      }));
    },
  };
}

/* ---------- Students ---------- */
function students(ctx, sch) {
  const rows = allStudents(sch).map(s => ({ s, y: yearSummary(db().progress[s.id], projectsFor(s)), la: lastActive(s.id), parent: user(s.parentId) }));
  return {
    title: 'Students', nav: 'students',
    html: `<div class="toolbar">
      <label class="search">${icon('eye')}<span class="sr-only">Search students</span><input id="q" placeholder="Search by name" value="${esc(state.q)}"></label>
      <label class="sel"><span class="sr-only">Section</span><select id="sec-f"><option value="">All sections</option>${sch.sections.map(s => `<option value="${s.id}" ${state.sec === s.id ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select></label>
      <button class="btn btn-brand btn-sm" id="add">${icon('plus')} Add student</button>
    </div>
    <section class="card tbl-card"><table class="tbl" id="stu-tbl">
      <thead><tr><th>Name</th><th>Section</th><th>Activities</th><th>Score so far</th><th>Last active</th><th>Parent</th></tr></thead>
      <tbody>${rows.map(r => `<tr data-name="${esc(r.s.name.toLowerCase())}" data-sec="${r.s.sectionId}">
        <td><a href="#/school/student/${r.s.id}">${esc(r.s.name)}</a></td><td>${esc(secName(sch, r.s.sectionId))}</td>
        <td><div class="cell-bar">${bar(r.y.activityPct)}<span>${r.y.actsDone}/${r.y.actsTotal}</span></div></td>
        <td>${r.y.score == null ? '—' : `${r.y.score}% <small class="muted">${band(r.y.score)}</small>`}</td>
        <td class="${!r.la || Date.now() - r.la > 14 * 86400000 ? 'warn-txt' : ''}">${timeAgo(r.la)}</td><td>${esc(r.parent?.name || '—')}</td></tr>`).join('')}</tbody>
    </table><p class="muted small" id="count"></p></section>`,
    mount(el) {
      const filter = () => {
        const q = $('#q', el).value.trim().toLowerCase(); const sec = $('#sec-f', el).value;
        state.q = q; state.sec = sec || state.sec;
        let n = 0;
        $$('#stu-tbl tbody tr', el).forEach(tr => { const show = tr.dataset.name.includes(q) && (!sec || tr.dataset.sec === sec); tr.hidden = !show; if (show) n++; });
        $('#count', el).textContent = `${n} student${n === 1 ? '' : 's'}`;
      };
      $('#q', el).addEventListener('input', filter); $('#sec-f', el).addEventListener('change', filter); filter();
      $('#add', el).addEventListener('click', () => {
        const d = modal(`<h2>Add a student</h2>
          <form id="add-f" class="form-grid">
            <label>Student's full name<input name="name" required maxlength="60"></label>
            <label>Section<select name="sec">${sch.sections.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select></label>
            <label>Parent's name<input name="parent" maxlength="60"></label>
            <div class="modal-actions"><button type="button" class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-brand">Add student</button></div>
          </form>`);
        $('#add-f', d).addEventListener('submit', e => {
          e.preventDefault(); const f = e.target;
          if (!f.name.value.trim()) return;
          addStudent(sch.id, f.sec.value, f.name.value.trim(), f.parent.value.trim());
          log(ctx.me.name, `added ${f.name.value.trim()}`, sch.id); save();
          d.close(); toast('Student added, with a parent account.'); ctx.rerender();
        });
      });
    },
  };
}

function studentDetail(ctx, sch, id) {
  const s = user(id);
  if (!s || s.schoolId !== sch.id) return { title: 'Student', html: '<div class="empty"><p>Student not found.</p></div>' };
  const ids = projectsFor(s); const y = yearSummary(db().progress[s.id], ids);
  return {
    title: s.name, nav: 'students',
    html: `<a class="back" href="#/school/students">← All students</a>
    <section class="hero-card slim"><div class="hc-copy"><p class="eyebrow">${esc(secName(sch, s.sectionId))} · Roll ${s.roll}</p><h2>${esc(s.name)}</h2><p>Parent: ${esc(user(s.parentId)?.name || '—')} · Last active ${timeAgo(lastActive(s.id))}</p></div>
      <div class="hc-ring">${ring(y.activityPct, { size: 120, stroke: 12, sub: 'activities' })}</div></section>
    <div class="score-cards">${ids.map(pid => { const p = projectById(pid), sc = projectScore(progress(s.id, pid), pid); return `<section class="card f-${p.form}">
      <h3 class="h-card"><span class="form-dot"></span>${esc(p.title)}</h3>
      <ul class="parts">${WEIGHTS.map(w => `<li><div class="part-top"><b>${esc(w.label)}</b><span class="muted">${w.weight}%</span><span class="part-val">${sc.parts[w.key] == null ? 'Not yet' : `${sc.parts[w.key]}%`}</span></div>${bar(sc.parts[w.key], PART_COLOR[w.key])}</li>`).join('')}</ul>
      <div class="total-row"><span>Score ${sc.complete ? '' : 'so far'}</span><b>${sc.score == null ? '—' : `${sc.score}%`}</b><span class="chip">${band(sc.score)}</span></div>
      <button class="btn btn-brand btn-sm" data-mark="${pid}">Mark this project</button></section>`; }).join('')}</div>`,
    mount(el) { $$('[data-mark]', el).forEach(b => b.addEventListener('click', () => markModal(ctx, s, b.dataset.mark))); },
  };
}

/* ---------- Marking ---------- */
function grade(ctx, sch) {
  state.sec = state.sec && section(sch, state.sec) ? state.sec : sch.sections[0].id;
  const sec = section(sch, state.sec);
  const pid = state.proj && Object.values(sec.projects).includes(state.proj) ? state.proj : sec.projects.life;
  const P = projectById(pid);
  const kids = studentsOf(sch.id, sec.id);
  return {
    title: 'Mark work', nav: 'grade',
    html: `<p class="lead-in">Quizzes and the activity book are marked automatically. You mark the viva, the observation rubric and the portfolio. It takes about a minute per student.</p>
    <div class="toolbar">
      <label class="sel"><span class="sr-only">Section</span><select id="g-sec">${sch.sections.map(s => `<option value="${s.id}" ${s.id === sec.id ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select></label>
      <label class="sel"><span class="sr-only">Project</span><select id="g-proj">${Object.values(sec.projects).map(id => `<option value="${id}" ${id === pid ? 'selected' : ''}>${esc(projectById(id).title)}</option>`).join('')}</select></label>
    </div>
    <section class="card tbl-card"><table class="tbl mark-tbl">
      <thead><tr><th>Student</th><th>Activity book</th><th>Quiz</th><th>Portfolio</th><th>Viva</th><th>Observation</th><th>Score</th><th></th></tr></thead>
      <tbody>${kids.map(k => { const pr = progress(k.id, pid); const sc = projectScore(pr, pid); const tag = (v) => v == null ? '<span class="tag todo">To mark</span>' : `<span class="tag ok">${v}%</span>`; return `<tr>
        <td><button class="name-btn" data-mark="${k.id}" aria-label="Mark ${esc(k.name)}">${esc(k.name)}</button></td>
        <td>${sc.done}/${sc.total}</td><td>${sc.parts.written == null ? '—' : `${sc.parts.written}%`}</td>
        <td>${pr?.portfolio.length || 0} items ${pr?.portfolioScore != null ? `<span class="tag ok">${RUBRIC_LEVELS[pr.portfolioScore - 1]}</span>` : ''}</td>
        <td>${tag(sc.parts.viva)}</td><td>${tag(sc.parts.observation)}</td>
        <td><b>${sc.score == null ? '—' : `${sc.score}%`}</b></td>
        <td><button class="btn btn-sm btn-ghost" data-mark="${k.id}">Mark</button></td></tr>`; }).join('')}</tbody>
    </table></section>
    <section class="card"><h3 class="h-card">${icon('mic')} Viva questions for ${esc(P.title)}</h3><ol class="viva-list">${P.viva.map(v => `<li>${esc(v)}</li>`).join('')}</ol></section>`,
    mount(el) {
      $('#g-sec', el).addEventListener('change', e => { state.sec = e.target.value; state.proj = null; ctx.rerender(); });
      $('#g-proj', el).addEventListener('change', e => { state.proj = e.target.value; ctx.rerender(); });
      $$('[data-mark]', el).forEach(b => b.addEventListener('click', () => markModal(ctx, user(b.dataset.mark), pid)));
    },
  };
}

function rubricRows(rubric, marks, name) {
  return rubric.map(r => `<fieldset class="rub"><legend>${esc(r.label)} <small class="muted">LO ${r.lo.join(', ')}</small></legend>
    <div class="levels">${RUBRIC_LEVELS.map((l, i) => `<label><input type="radio" name="${name}-${r.key}" value="${i + 1}" ${marks?.[r.key] === i + 1 ? 'checked' : ''}><span>${i + 1}<small>${l}</small></span></label>`).join('')}</div></fieldset>`).join('');
}

function markModal(ctx, stu, pid) {
  const P = projectById(pid);
  const pr = progress(stu.id, pid, true);
  const d = modal(`<div class="mm-head f-${P.form}"><div class="mini-art">${art(P.art)}</div><div><p class="eyebrow">${esc(P.title)}</p><h2>${esc(stu.name)}</h2></div><button class="icon-btn" data-close aria-label="Close">${icon('close')}</button></div>
    <form id="mk">
      <h3>Viva <small class="muted">30%</small></h3>${rubricRows(VIVA_RUBRIC, pr.viva, 'v')}
      <h3>Teacher observation <small class="muted">20%</small></h3>${rubricRows(OBSERVATION_RUBRIC, pr.obs, 'o')}
      <h3>Portfolio <small class="muted">10% · ${pr.portfolio.length} items</small></h3>${rubricRows([{ key: 'pf', label: 'Quality and range of the portfolio', lo: [10, 18] }], { pf: pr.portfolioScore }, 'p')}
      <h3>Feedback for the student and parents</h3>
      <textarea name="fb" rows="3" maxlength="400" placeholder="One thing they did well, one thing to try next."></textarea>
      <div class="modal-actions"><button type="button" class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-brand">Save marks</button></div>
    </form>`, { wide: true });
  $('#mk', d).addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const read = (rubric, pfx) => { const o = {}; let any = false; for (const r of rubric) { const v = f.get(`${pfx}-${r.key}`); if (v) { o[r.key] = +v; any = true; } } return any ? o : null; };
    const v = read(VIVA_RUBRIC, 'v'), o = read(OBSERVATION_RUBRIC, 'o'), p = f.get('p-pf');
    if (v) pr.viva = { ...(pr.viva || {}), ...v };
    if (o) pr.obs = { ...(pr.obs || {}), ...o };
    if (p) pr.portfolioScore = +p;
    const fb = String(f.get('fb') || '').trim();
    if (fb) pr.feedback.push({ at: Date.now(), by: ctx.me.name, text: fb });
    log(ctx.me.name, `marked ${stu.name} on ${P.title}`, stu.schoolId);
    save(); d.close(); toast(`Saved marks for ${stu.name.split(' ')[0]}.`); ctx.rerender();
  });
}

/* ---------- Reports ---------- */
function reports(ctx, sch) {
  const rows = allStudents(sch).map(s => { const ids = projectsFor(s); return { s, ids, y: yearSummary(db().progress[s.id], ids) }; });
  const marked = rows.filter(r => r.y.score != null);
  const dist = ['Exemplary', 'Proficient', 'Developing', 'Beginning'].map(b => ({ b, n: marked.filter(r => band(r.y.score) === b).length }));
  return {
    title: 'Reports', nav: 'reports',
    html: `<div class="grid-2">
      <section class="card"><h2 class="h-card">${icon('chart')} Bands so far</h2>
        <ul class="dist">${dist.map(x => `<li><span>${x.b}</span>${bar(marked.length ? x.n / marked.length * 100 : 0)}<b>${x.n}</b></li>`).join('')}</ul>
        <p class="muted small">${marked.length} of ${rows.length} students have at least one marked part.</p></section>
      <section class="card"><h2 class="h-card">${icon('download')} Export</h2>
        <p>Download every student's marks in the five CBSE parts, project totals and the year score, ready for internal assessment.</p>
        <button class="btn btn-brand" id="csv">${icon('download')} Download CSV</button></section>
    </div>
    <section class="card tbl-card"><table class="tbl">
      <thead><tr><th>Student</th><th>Section</th>${['Life forms', 'Machines', 'Services'].map(x => `<th>${x}</th>`).join('')}<th>Year</th><th>Band</th></tr></thead>
      <tbody>${rows.map(r => `<tr><td>${esc(r.s.name)}</td><td>${esc(secName(sch, r.s.sectionId))}</td>${r.y.per.map(x => `<td title="${esc(projectById(x.id).title)}">${x.score == null ? '—' : `${x.score}%${x.complete ? '' : '*'}`}</td>`).join('')}<td><b>${r.y.score == null ? '—' : `${r.y.score}%`}</b></td><td>${band(r.y.score)}</td></tr>`).join('')}</tbody>
    </table><p class="muted small">* still in progress, scored on the parts marked so far.</p></section>`,
    mount(el) {
      $('#csv', el).addEventListener('click', () => {
        const head = ['Student', 'Section', 'Project', 'Form of work', 'Activities done', 'Written test %', 'Viva %', 'Activity book %', 'Portfolio %', 'Observation %', 'Project score %', 'Complete', 'Year score %'];
        const lines = [head.join(',')];
        for (const r of rows) for (const x of r.y.per) {
          const p = projectById(x.id);
          lines.push([r.s.name, secName(sch, r.s.sectionId), p.title, FORMS[p.form].name, `${x.done}/${x.total}`, x.parts.written, x.parts.viva, x.parts.book, x.parts.portfolio, x.parts.observation, x.score, x.complete ? 'yes' : 'no', r.y.score].map(csvCell).join(','));
        }
        download(`${sch.name.replace(/\W+/g, '-')}-kaushal-bodh-grade6.csv`, lines.join('\n'));
        toast('CSV downloaded.');
      });
    },
  };
}

/* ---------- Branding ---------- */
const COLORS = ['#1F6F66', '#2D5BA8', '#7A3FA0', '#B23A48', '#C26A12', '#3E7B2A', '#0F4C5C', '#8C3557'];
function brand(ctx, sch) {
  return {
    title: 'Branding', nav: 'brand',
    html: `<div class="grid-2 brand-grid">
      <section class="card">
        <h2 class="h-card">${icon('brush')} Your studio</h2>
        <p class="muted">Students and parents see these on every screen. "Powered by VINC Lab" stays small in the sidebar.</p>
        <form id="bf" class="form-grid">
          <label>School name<input name="name" value="${esc(sch.name)}" maxlength="60" required></label>
          <label>Skill studio name<input name="studio" value="${esc(sch.studio)}" maxlength="40" required></label>
          <label>Badge letters<input name="initials" value="${esc(sch.initials)}" maxlength="3" required></label>
          <fieldset><legend>Brand colour</legend><div class="swatches">${COLORS.map(c => `<label class="sw"><input type="radio" name="color" value="${c}" ${c.toLowerCase() === sch.color.toLowerCase() ? 'checked' : ''}><span style="--c:${c}" aria-label="${c}"></span></label>`).join('')}
            <label class="sw custom"><input type="color" name="custom" value="${sch.color}" aria-label="Custom colour"></label></div></fieldset>
          <div class="modal-actions"><button class="btn btn-brand">Save branding</button></div>
        </form>
      </section>
      <section class="card preview-card"><h2 class="h-card">${icon('eye')} Preview</h2>
        <div class="mini-app" id="pv">
          <div class="ma-side"><span class="badge" id="pv-badge">${esc(sch.initials)}</span><b id="pv-studio">${esc(sch.studio)}</b><small id="pv-name">${esc(sch.name)}</small><i></i><i></i><i></i></div>
          <div class="ma-main"><b>Good morning, Aarav 👋</b><div class="ma-ring"></div><div class="ma-btn">Continue project</div></div>
        </div>
      </section>
    </div>`,
    mount(el) {
      const f = $('#bf', el); const pv = $('#pv', el);
      const upd = () => {
        const c = f.querySelector('input[name=color]:checked')?.value || f.custom.value;
        pv.style.setProperty('--brand', c);
        $('#pv-badge', el).textContent = f.initials.value.toUpperCase() || initials(f.name.value);
        $('#pv-studio', el).textContent = f.studio.value; $('#pv-name', el).textContent = f.name.value;
      };
      f.addEventListener('input', e => {
        if (e.target.name === 'custom') $$('input[name=color]', f).forEach(x => { x.checked = false; });
        if (e.target.name === 'name' && !f.initials.dataset.touched) f.initials.value = initials(f.name.value);
        if (e.target.name === 'initials') f.initials.dataset.touched = '1';
        upd();
      });
      upd();
      f.addEventListener('submit', e => {
        e.preventDefault();
        sch.name = f.name.value.trim(); sch.studio = f.studio.value.trim(); sch.initials = f.initials.value.trim().toUpperCase().slice(0, 3);
        sch.color = f.querySelector('input[name=color]:checked')?.value || f.custom.value;
        log(ctx.me.name, 'updated the school branding', sch.id);
        save(); toast('Branding saved for every student and parent.'); ctx.rerender();
      });
    },
  };
}
