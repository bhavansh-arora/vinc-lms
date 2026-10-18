// School dashboard: overview across Grades 6–8, teachers, year plan, students, marking, reports and branding.
import { FORMS, GRADES, projectById, projectsOfGrade } from '../../data/courses.js';
import { db, save, school, section, studentsOf, projectsFor, lastActive, log, addStudent, addSection, addTeacher, assignSections, teachersOf, initials, user, parentsOf, newJoinCode } from '../store.js';
import { projectScore, yearSummary, band } from '../scoring.js';
import { $, $$, esc, icon, ring, bar, timeAgo, daysUntil, toast, modal, download, csvCell, bindCopy } from '../ui.js';
import { stats, secLabel, heatmap, markTable, bindMark, studentDetail, currentProject, showCreds, resetFor } from './shared.js';

export const nav = () => [
  { path: '', label: 'Overview', icon: 'home' },
  { path: 'grade', label: 'Mark work', short: 'Mark', icon: 'check' },
  { path: 'students', label: 'Students', icon: 'users' },
  { path: 'teachers', label: 'Teachers', icon: 'school' },
  { path: 'plan', label: 'Year plan', short: 'Plan', icon: 'calendar' },
  { path: 'reports', label: 'Reports', icon: 'chart' },
  { path: 'brand', label: 'Branding', icon: 'brush' },
];

export function render(ctx) {
  const sch = school(ctx.me.schoolId);
  if (state.schoolId !== sch.id) Object.assign(state, { schoolId: sch.id, grade: 'all', sec: null, proj: null, q: '' });
  const [page, a] = ctx.params;
  switch (page) {
    case 'plan': return plan(ctx, sch);
    case 'students': return students(ctx, sch);
    case 'student': { const s = user(a); return s && s.schoolId === sch.id ? { ...studentDetail(ctx, s, { href: '#/school/students', label: 'All students' }), nav: 'students' } : { title: 'Student', html: '<div class="empty"><p>Student not found.</p></div>' }; }
    case 'teachers': return teachers(ctx, sch);
    case 'grade': return grade(ctx, sch);
    case 'reports': return reports(ctx, sch);
    case 'brand': return brand(ctx, sch);
    default: return overview(ctx, sch);
  }
}

const state = { schoolId: null, grade: 'all', sec: null, proj: null, q: '' };
const inGrade = s => state.grade === 'all' || s.grade === +state.grade;
const secName = (sch, id) => section(sch, id)?.name || '';
const sortedSecs = sch => [...sch.sections].sort((a, b) => a.grade - b.grade || a.name.localeCompare(b.name));
const gradeOfStudent = (sch, s) => section(sch, s.sectionId)?.grade;

function gradeTabs(sch, id = 'grade-tabs') {
  const has = GRADES.filter(g => sch.sections.some(s => s.grade === g));
  return `<div class="seg-tabs" role="group" aria-label="Filter by grade" id="${id}">
    <button data-g="all" aria-pressed="${state.grade === 'all'}">All grades</button>
    ${has.map(g => `<button data-g="${g}" aria-pressed="${String(state.grade) === String(g)}">Grade ${g}</button>`).join('')}</div>`;
}
const bindGradeTabs = (el, ctx, id = 'grade-tabs') => $$(`#${id} [data-g]`, el).forEach(b => b.addEventListener('click', () => { state.grade = b.dataset.g; state.sec = null; state.proj = null; ctx.rerender(); }));

/* ---------- Overview ---------- */
function overview(ctx, sch) {
  const secs = sortedSecs(sch).filter(inGrade);
  const kidsAll = secs.flatMap(s => studentsOf(sch.id, s.id));
  const S = stats(kidsAll);
  state.sec = state.sec && secs.some(s => s.id === state.sec) ? state.sec : secs[0]?.id;
  const sec = section(sch, state.sec);
  const kids = sec ? studentsOf(sch.id, sec.id) : [];
  const pid = sec ? (state.proj && Object.values(sec.projects).includes(state.proj) ? state.proj : currentProject(sec, kids)) : null;
  const feed = db().log.filter(l => l.schoolId === sch.id).slice(0, 8);
  const grades = GRADES.filter(g => sch.sections.some(s => s.grade === g));
  return {
    title: 'Overview', nav: '',
    html: `
    <section class="hero-card">
      <div class="hc-copy">
        <p class="eyebrow">${esc(sch.name)} · Grades ${grades.join(', ')} · ${sch.sections.length} sections</p>
        <h2>${esc(sch.studio)}</h2>
        <p>${S.students} students on Kaushal Bodh${state.grade === 'all' ? '' : ` in Grade ${state.grade}`}. ${S.vivaDue ? `<b>${S.vivaDue} viva${S.vivaDue > 1 ? 's' : ''}</b> ready to be marked.` : 'No vivas waiting.'} Kaushal Mela in <b>${Math.max(0, daysUntil(sch.melaDate))} days</b>.</p>
        <a class="btn btn-brand" href="#/school/grade">Mark work ${icon('arrow')}</a>
      </div>
      <div class="hc-ring">${ring(S.completion, { size: 150, stroke: 14, sub: 'activities done' })}</div>
    </section>
    ${gradeTabs(sch)}
    <div class="kpis">
      <div class="kpi"><span>${icon('users')}</span><b>${S.students}${state.grade === 'all' ? `<small>/${sch.seats}</small>` : ''}</b><p>Students${state.grade === 'all' ? ' (seats)' : ''}</p></div>
      <div class="kpi"><span>${icon('quiz')}</span><b>${S.quizzes}</b><p>Quiz attempts</p></div>
      <div class="kpi"><span>${icon('mic')}</span><b>${S.vivaDue}</b><p>Vivas to mark</p></div>
      <div class="kpi ${S.inactive ? 'warn' : ''}"><span>${icon('bell')}</span><b>${S.inactive}</b><p>Inactive 14+ days</p></div>
    </div>
    <div class="grade-cards">${grades.filter(g => state.grade === 'all' || g === +state.grade).map(g => {
      const gs = sch.sections.filter(s => s.grade === g); const gk = gs.flatMap(s => studentsOf(sch.id, s.id)); const st = stats(gk);
      const tnames = [...new Set(gs.map(s => user(s.teacherId)?.name).filter(Boolean))];
      return `<section class="card grade-card g${g}"><div class="gc-top"><span class="gnum">${g}</span><div><b>Grade ${g}</b><small class="muted">${gs.length} section${gs.length > 1 ? 's' : ''} · ${gk.length} students</small></div></div>
        <div class="gc-row"><span>Activities</span>${bar(st.completion)}<b>${st.completion}%</b></div>
        <div class="gc-row"><span>Score so far</span>${bar(st.score)}<b>${st.score == null ? '—' : `${st.score}%`}</b></div>
        <p class="muted small">${st.vivaDue} viva${st.vivaDue === 1 ? '' : 's'} to mark · ${st.inactive} inactive · ${tnames.length ? esc(tnames.join(', ')) : '<span class="warn-txt">No teacher assigned</span>'}</p></section>`;
    }).join('')}</div>
    ${sec ? `<section class="card">
      <div class="card-head">
        <h2 class="h-card">${icon('chart')} Progress heatmap</h2>
        <div class="filters">
          <label class="sel"><span class="sr-only">Section</span><select id="hm-sec">${secs.map(s => `<option value="${s.id}" ${s.id === sec.id ? 'selected' : ''}>${esc(secLabel(s))}</option>`).join('')}</select></label>
          <label class="sel"><span class="sr-only">Project</span><select id="hm-proj">${Object.values(sec.projects).map(id => `<option value="${id}" ${id === pid ? 'selected' : ''}>${esc(projectById(id).title)}</option>`).join('')}</select></label>
        </div>
      </div>
      ${heatmap(kids, pid, k => `#/school/student/${k.id}`)}
    </section>` : ''}
    <div class="grid-2">
      <section class="card"><h2 class="h-card">${icon('school')} Sections</h2>
        <ul class="sec-list">${secs.map(s => { const ks = studentsOf(sch.id, s.id); const avg = ks.length ? Math.round(ks.reduce((n, k) => n + yearSummary(db().progress[k.id], projectsFor(k)).activityPct, 0) / ks.length) : 0; return `<li><div><b>${esc(secLabel(s))}</b><small class="muted">${ks.length} students · ${esc(user(s.teacherId)?.name || 'No teacher')} · ${Object.values(s.projects).map(id => esc(projectById(id).title)).join(', ')}</small></div>${bar(avg)}<span class="num">${avg}%</span></li>`; }).join('')}</ul>
      </section>
      <section class="card"><h2 class="h-card">${icon('bell')} Recent activity</h2>
        <ul class="feed compact">${feed.map(f => `<li><b>${esc(f.who)}</b> ${esc(f.what)} <small class="muted">${timeAgo(f.at)}</small></li>`).join('') || '<li class="muted">Nothing yet.</li>'}</ul>
      </section>
    </div>`,
    mount(el) {
      bindGradeTabs(el, ctx);
      $('#hm-sec', el)?.addEventListener('change', e => { state.sec = e.target.value; state.proj = null; ctx.rerender(); });
      $('#hm-proj', el)?.addEventListener('change', e => { state.proj = e.target.value; ctx.rerender(); });
    },
  };
}

/* ---------- Teachers ---------- */
function teachers(ctx, sch) {
  const ts = teachersOf(sch.id);
  const unassigned = sortedSecs(sch).filter(s => !s.teacherId);
  return {
    title: 'Teachers', nav: 'teachers',
    html: `<section class="card join-card"><div><h2 class="h-card">${icon('key')} Teacher joining code</h2><p class="muted">Teachers can create their own account: they choose ${esc(sch.name)} and enter this code. Or add them yourself below.</p></div>
      <div class="big-code"><code>${esc(sch.joinCode)}</code><button type="button" class="btn btn-ghost btn-sm" data-copy="${esc(sch.joinCode)}">${icon('copy')} Copy</button><button type="button" class="icon-btn" id="new-join" aria-label="Make a new joining code" title="Make a new code">${icon('refresh')}</button></div></section>
    <div class="toolbar"><p class="muted">Each section has one Kaushal Bodh teacher. Teachers see only their sections in the teacher portal.</p><button class="btn btn-brand btn-sm" id="add-t">${icon('plus')} Add teacher</button></div>
    ${unassigned.length ? `<p class="warn-bar round">${unassigned.length} section${unassigned.length > 1 ? 's have' : ' has'} no teacher: ${unassigned.map(s => esc(secLabel(s))).join(', ')}.</p>` : ''}
    <div class="teacher-cards">${ts.map(t => {
      const mine = sortedSecs(sch).filter(s => t.sectionIds.includes(s.id)); const kids = mine.flatMap(s => studentsOf(sch.id, s.id)); const st = stats(kids);
      return `<section class="card teacher-card"><div class="tc-head"><span class="avatar lg">${esc(t.name.split(' ').map(w => w[0]).join('').slice(0, 2))}</span><div><b>${esc(t.name)}</b><small class="muted">${esc(t.title || 'Kaushal Bodh teacher')} · <span class="mono">@${esc(t.login)}</span></small></div></div>
        <div class="chips">${mine.map(s => `<span class="chip">${esc(secLabel(s))}</span>`).join('') || '<span class="muted small">No sections yet</span>'}</div>
        <div class="gc-row"><span>${kids.length} students</span>${bar(st.completion)}<b>${st.completion}%</b></div>
        <p class="muted small">${st.vivaDue} viva${st.vivaDue === 1 ? '' : 's'} to mark · ${st.inactive} inactive</p>
        <div class="btn-row"><button class="btn btn-ghost btn-sm" data-assign="${t.id}">Change sections</button><button class="btn btn-sm linkish" data-reset="${t.id}">${icon('key')} Reset password</button></div></section>`;
    }).join('') || '<div class="empty"><p>No teachers yet.</p></div>'}</div>`,
    mount(el) {
      const form = (t) => `<form id="tf" class="form-grid">
          ${t ? '' : '<label>Teacher\'s full name<input name="name" required maxlength="60"></label><label>Email <small class="muted">optional</small><input name="email" type="email" maxlength="80"></label>'}
          <fieldset><legend>Sections</legend><div class="check-grid">${sortedSecs(sch).map(s => `<label class="check"><input type="checkbox" name="sec" value="${s.id}" ${t?.sectionIds.includes(s.id) ? 'checked' : ''}><span>${esc(secLabel(s))}<small class="muted">${s.teacherId && s.teacherId !== t?.id ? `now ${esc(user(s.teacherId)?.name || '')}` : 'unassigned'}</small></span></label>`).join('')}</div></fieldset>
          <div class="modal-actions"><button type="button" class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-brand">Save</button></div></form>`;
      const open = t => {
        const d = modal(`<h2>${t ? `Sections for ${esc(t.name)}` : 'Add a teacher'}</h2>${form(t)}`);
        $('#tf', d).addEventListener('submit', e => {
          e.preventDefault(); const f = e.target;
          const ids = $$('input[name=sec]:checked', f).map(x => x.value);
          if (t) { assignSections(t, ids); log(ctx.me.name, `updated sections for ${t.name}`, sch.id); }
          else {
            if (!f.name.value.trim()) return;
            const { teacher: nt, pw } = addTeacher(sch.id, f.name.value.trim(), ids, { email: f.email.value.trim() || undefined });
            log(ctx.me.name, `added teacher ${nt.name}`, sch.id); save(); d.close(); ctx.rerender();
            showCreds(`${nt.name} can log in now`, [{ name: nt.name, role: 'Teacher', icon: 'book', login: nt.login, pw }]);
            return;
          }
          save(); d.close(); toast('Teacher saved.'); ctx.rerender();
        });
      };
      bindCopy(el);
      $('#new-join', el).addEventListener('click', () => {
        if (!confirm('Make a new joining code? The old one will stop working.')) return;
        sch.joinCode = newJoinCode(sch); log(ctx.me.name, 'made a new teacher joining code', sch.id); save(); toast('New joining code made.'); ctx.rerender();
      });
      $$('[data-reset]', el).forEach(b => b.addEventListener('click', () => resetFor(ctx, user(b.dataset.reset), 'Teacher')));
      $('#add-t', el).addEventListener('click', () => open(null));
      $$('[data-assign]', el).forEach(b => b.addEventListener('click', () => open(user(b.dataset.assign))));
    },
  };
}

/* ---------- Year plan ---------- */
const seg = p => `<div class="seg ${p.form}" style="flex-grow:${p.periods}"><b>${esc(p.title)}</b><small>${Math.round(p.periods / 4)} weeks</small></div>`;
function plan(ctx, sch) {
  const secs = sortedSecs(sch).filter(inGrade);
  return {
    title: 'Year plan', nav: 'plan',
    html: `<p class="lead-in">Choose one project from each form of work for every section. CBSE asks for about 110 hours a year: two consecutive periods, twice a week.</p>
    <div class="toolbar">${gradeTabs(sch)}<button class="btn btn-ghost btn-sm" id="add-sec">${icon('plus')} Add section</button></div>
    ${secs.map(s => `<section class="card plan-card" data-sec="${s.id}">
      <div class="card-head"><h2 class="h-card">${icon('school')} ${esc(secLabel(s))}</h2><span class="muted small">${studentsOf(sch.id, s.id).length} students · ${esc(user(s.teacherId)?.name || 'No teacher')}</span></div>
      <div class="plan-picks">${Object.values(FORMS).map(f => `<label class="f-${f.key}"><span class="form-tag">${esc(f.name)}</span>
        <select data-form="${f.key}">${projectsOfGrade(s.grade).filter(p => p.form === f.key).map(p => `<option value="${p.id}" ${s.projects[f.key] === p.id ? 'selected' : ''}>${esc(p.title)} (${p.periods} periods)</option>`).join('')}</select></label>`).join('')}</div>
      <div class="plan-tl">${Object.values(s.projects).map(id => seg(projectById(id))).join('')}<div class="seg mela" style="flex-grow:6"><b>Mela</b></div></div>
    </section>`).join('')}
    <section class="card"><div class="card-head"><h2 class="h-card">${icon('star')} Kaushal Mela</h2></div>
      <label class="inline-field" for="mela">Date of your school's skill fair <input type="date" id="mela" value="${sch.melaDate}"></label>
      <button class="btn btn-brand" id="save-plan">Save plan</button>
    </section>`,
    mount(el) {
      bindGradeTabs(el, ctx);
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
      // Changing a project slides the timeline segments to their new lengths.
      $$('.plan-card select', el).forEach(sel => sel.addEventListener('change', () => {
        const c = sel.closest('.plan-card');
        const segs = $$('.plan-tl .seg:not(.mela)', c);
        $$('select', c).forEach((x, i) => {
          const p = projectById(x.value), sg = segs[i];
          if (!sg || sg.querySelector('b').textContent === p.title) return;
          sg.className = `seg ${p.form}`; sg.style.flexGrow = p.periods;
          sg.querySelector('b').textContent = p.title; sg.querySelector('small').textContent = `${Math.round(p.periods / 4)} weeks`;
          sg.animate([{ opacity: .35 }, { opacity: 1 }], { duration: 420, easing: 'ease-out' });
        });
      }));
      $('#add-sec', el).addEventListener('click', () => {
        const d = modal(`<h2>Add a section</h2><form id="sf" class="form-grid">
          <label>Grade<select name="grade">${GRADES.map(g => `<option ${String(state.grade) === String(g) ? 'selected' : ''}>${g}</option>`).join('')}</select></label>
          <label>Section name<input name="name" required maxlength="12" placeholder="e.g. 7 B"></label>
          <label>Teacher<select name="t"><option value="">Assign later</option>${teachersOf(sch.id).map(t => `<option value="${t.id}">${esc(t.name)}</option>`).join('')}</select></label>
          <div class="modal-actions"><button type="button" class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-brand">Add section</button></div></form>`);
        $('#sf', d).addEventListener('submit', e => {
          e.preventDefault(); const f = e.target; if (!f.name.value.trim()) return;
          addSection(sch, +f.grade.value, f.name.value.trim(), f.t.value || null);
          log(ctx.me.name, `added section ${f.name.value.trim()}`, sch.id); save();
          d.close(); toast('Section added with the default projects for its grade.'); ctx.rerender();
        });
      });
    },
  };
}

/* ---------- Students ---------- */
function students(ctx, sch) {
  const rows = studentsOf(sch.id).map(s => ({ s, g: gradeOfStudent(sch, s), y: yearSummary(db().progress[s.id], projectsFor(s)), la: lastActive(s.id), parents: parentsOf(s) }))
    .sort((a, b) => a.g - b.g || secName(sch, a.s.sectionId).localeCompare(secName(sch, b.s.sectionId)) || a.s.roll - b.s.roll);
  return {
    title: 'Students', nav: 'students',
    html: `<div class="toolbar">
      <label class="search">${icon('eye')}<span class="sr-only">Search students</span><input id="q" placeholder="Search by name" value="${esc(state.q)}"></label>
      <label class="sel"><span class="sr-only">Section</span><select id="sec-f"><option value="">All sections</option>${sortedSecs(sch).map(s => `<option value="${s.id}" ${state.sec === s.id ? 'selected' : ''}>${esc(secLabel(s))}</option>`).join('')}</select></label>
      <button class="btn btn-brand btn-sm" id="add">${icon('plus')} Add student</button>
    </div>
    <section class="card tbl-card"><table class="tbl" id="stu-tbl">
      <thead><tr><th>Name</th><th>Grade</th><th>Section</th><th>Activities</th><th>Score so far</th><th>Last active</th><th>Parent</th></tr></thead>
      <tbody>${rows.map(r => `<tr data-name="${esc(r.s.name.toLowerCase())}" data-sec="${r.s.sectionId}">
        <td><a href="#/school/student/${r.s.id}">${esc(r.s.name)}</a><small class="muted mono block">@${esc(r.s.login)}</small></td><td>${r.g}</td><td>${esc(secName(sch, r.s.sectionId))}</td>
        <td><div class="cell-bar">${bar(r.y.activityPct)}<span>${r.y.actsDone}/${r.y.actsTotal}</span></div></td>
        <td>${r.y.score == null ? '—' : `${r.y.score}% <small class="muted">${band(r.y.score)}</small>`}</td>
        <td class="${!r.la || Date.now() - r.la > 14 * 86400000 ? 'warn-txt' : ''}">${timeAgo(r.la)}</td><td>${r.parents.length ? r.parents.map(p => esc(p.name)).join(', ') : '—'}</td></tr>`).join('')}</tbody>
    </table><p class="muted small" id="count"></p></section>`,
    mount(el) {
      const filter = () => {
        const q = $('#q', el).value.trim().toLowerCase(); const sec = $('#sec-f', el).value;
        state.q = q; state.sec = sec || null;
        let n = 0;
        $$('#stu-tbl tbody tr', el).forEach(tr => { const show = tr.dataset.name.includes(q) && (!sec || tr.dataset.sec === sec); tr.hidden = !show; if (show) n++; });
        $('#count', el).textContent = `${n} student${n === 1 ? '' : 's'}`;
      };
      $('#q', el).addEventListener('input', filter); $('#sec-f', el).addEventListener('change', filter); filter();
      $('#add', el).addEventListener('click', () => {
        const d = modal(`<h2>Add a student</h2>
          <form id="add-f" class="form-grid">
            <label>Student's full name<input name="name" required maxlength="60"></label>
            <label>Section<select name="sec">${sortedSecs(sch).map(s => `<option value="${s.id}">${esc(secLabel(s))}</option>`).join('')}</select></label>
            <label>Parent's name<input name="parent" maxlength="60"></label>
            <div class="modal-actions"><button type="button" class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-brand">Add student</button></div>
          </form>`);
        $('#add-f', d).addEventListener('submit', e => {
          e.preventDefault(); const f = e.target;
          if (!f.name.value.trim()) return;
          const { student, parent, stPw, parPw } = addStudent(sch.id, f.sec.value, f.name.value.trim(), f.parent.value.trim());
          log(ctx.me.name, `added ${student.name}`, sch.id); save();
          d.close(); ctx.rerender();
          showCreds(`${student.name} is added`, [
            { name: student.name, role: `Student · ${secLabel(section(sch, student.sectionId))}`, icon: 'star', login: student.login, pw: stPw, code: student.familyCode },
            { name: parent.name, role: 'Parent', icon: 'home', login: parent.login, pw: parPw },
          ]);
        });
      });
    },
  };
}

/* ---------- Marking ---------- */
function grade(ctx, sch) {
  const secs = sortedSecs(sch);
  state.sec = state.sec && section(sch, state.sec) ? state.sec : secs[0].id;
  const sec = section(sch, state.sec);
  const kids = studentsOf(sch.id, sec.id);
  const pid = state.proj && Object.values(sec.projects).includes(state.proj) ? state.proj : currentProject(sec, kids);
  return {
    title: 'Mark work', nav: 'grade',
    html: `<p class="lead-in">Quizzes and the activity book are marked automatically. Teachers mark the viva, the observation rubric and the portfolio, about a minute per student.</p>
    <div class="toolbar">
      <label class="sel"><span class="sr-only">Section</span><select id="g-sec">${secs.map(s => `<option value="${s.id}" ${s.id === sec.id ? 'selected' : ''}>${esc(secLabel(s))}</option>`).join('')}</select></label>
      <label class="sel"><span class="sr-only">Project</span><select id="g-proj">${Object.values(sec.projects).map(id => `<option value="${id}" ${id === pid ? 'selected' : ''}>${esc(projectById(id).title)}</option>`).join('')}</select></label>
    </div>
    ${markTable(kids, pid)}`,
    mount(el) {
      $('#g-sec', el).addEventListener('change', e => { state.sec = e.target.value; state.proj = null; ctx.rerender(); });
      $('#g-proj', el).addEventListener('change', e => { state.proj = e.target.value; ctx.rerender(); });
      bindMark(el, ctx, pid);
    },
  };
}

/* ---------- Reports ---------- */
function reports(ctx, sch) {
  const rows = studentsOf(sch.id).map(s => { const ids = projectsFor(s); return { s, g: gradeOfStudent(sch, s), ids, y: yearSummary(db().progress[s.id], ids) }; })
    .filter(r => state.grade === 'all' || r.g === +state.grade).sort((a, b) => a.g - b.g || a.s.name.localeCompare(b.s.name));
  const marked = rows.filter(r => r.y.score != null);
  const dist = ['Exemplary', 'Proficient', 'Developing', 'Beginning'].map(b => ({ b, n: marked.filter(r => band(r.y.score) === b).length }));
  return {
    title: 'Reports', nav: 'reports',
    html: `${gradeTabs(sch)}
    <div class="grid-2">
      <section class="card"><h2 class="h-card">${icon('chart')} Bands so far</h2>
        <ul class="dist">${dist.map(x => `<li><span>${x.b}</span>${bar(marked.length ? x.n / marked.length * 100 : 0)}<b>${x.n}</b></li>`).join('')}</ul>
        <p class="muted small">${marked.length} of ${rows.length} students have at least one marked part.</p></section>
      <section class="card"><h2 class="h-card">${icon('download')} Export</h2>
        <p>Download every student's marks in the five CBSE parts, project totals and the year score, ready for internal assessment.</p>
        <button class="btn btn-brand" id="csv">${icon('download')} Download CSV</button></section>
    </div>
    <section class="card tbl-card"><table class="tbl">
      <thead><tr><th>Student</th><th>Grade</th><th>Section</th>${['Life forms', 'Machines', 'Services'].map(x => `<th>${x}</th>`).join('')}<th>Year</th><th>Band</th></tr></thead>
      <tbody>${rows.map(r => `<tr><td>${esc(r.s.name)}</td><td>${r.g}</td><td>${esc(secName(sch, r.s.sectionId))}</td>${r.y.per.map(x => `<td title="${esc(projectById(x.id).title)}">${x.score == null ? '—' : `${x.score}%${x.complete ? '' : '*'}`}</td>`).join('')}<td><b>${r.y.score == null ? '—' : `${r.y.score}%`}</b></td><td>${band(r.y.score)}</td></tr>`).join('') || '<tr><td colspan="8" class="muted">No students yet.</td></tr>'}</tbody>
    </table><p class="muted small">* still in progress, scored on the parts marked so far.</p></section>`,
    mount(el) {
      bindGradeTabs(el, ctx);
      $('#csv', el).addEventListener('click', () => {
        const head = ['Student', 'Grade', 'Section', 'Project', 'Form of work', 'Activities done', 'Written test %', 'Viva %', 'Activity book %', 'Portfolio %', 'Observation %', 'Project score %', 'Complete', 'Year score %'];
        const lines = [head.join(',')];
        for (const r of rows) for (const x of r.y.per) {
          const p = projectById(x.id);
          lines.push([r.s.name, r.g, secName(sch, r.s.sectionId), p.title, FORMS[p.form].name, `${x.done}/${x.total}`, x.parts.written, x.parts.viva, x.parts.book, x.parts.portfolio, x.parts.observation, x.score, x.complete ? 'yes' : 'no', r.y.score].map(csvCell).join(','));
        }
        download(`${sch.name.replace(/\W+/g, '-')}-kaushal-bodh-${state.grade === 'all' ? 'grades-6-8' : `grade${state.grade}`}.csv`, lines.join('\n'));
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
