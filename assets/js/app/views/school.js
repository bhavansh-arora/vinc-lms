// School dashboard: overview across Grades 6–8, teachers, year plan, students, marking, reports and branding.
import { FORMS, GRADES, projectById, projectsOfGrade } from '../../data/courses.js';
import { db, save, school, section, studentsOf, projectsFor, lastActive, log, addSection, addTeacher, assignSections, setSectionTeacher, teachersOf, initials, user, parentsOf } from '../store.js';
import { projectScore, yearSummary, band } from '../scoring.js';
import { $, $$, esc, icon, ring, bar, timeAgo, daysUntil, toast, modal, download, csvCell } from '../ui.js';
import { t, tx } from '../../i18n.js';
import { stats, secLabel, bandT, heatmap, markTable, bindMark, studentDetail, currentProject, showCredsSaved, codeCard, bindCodeCards } from './shared.js';
import { accountsPage, addPersonModal, passwordModal, deleteModal } from './accounts.js';

export const nav = () => [
  { path: '', label: t('Overview'), icon: 'home' },
  { path: 'grade', label: t('Mark work'), short: t('Mark'), icon: 'check' },
  { path: 'students', label: t('Students'), icon: 'users' },
  { path: 'teachers', label: t('Teachers'), icon: 'school' },
  { path: 'plan', label: t('Year plan'), short: t('Plan'), icon: 'calendar' },
  { path: 'reports', label: t('Reports'), icon: 'chart' },
  { path: 'brand', label: t('Branding'), icon: 'brush' },
  { path: 'accounts', label: t('Accounts'), icon: 'key' },
];

export function render(ctx) {
  const sch = school(ctx.me.schoolId);
  if (state.schoolId !== sch.id) Object.assign(state, { schoolId: sch.id, grade: 'all', sec: null, proj: null, q: '' });
  const [page, a] = ctx.params;
  switch (page) {
    case 'plan': return plan(ctx, sch);
    case 'students': return students(ctx, sch);
    case 'student': { const s = user(a); return s && s.schoolId === sch.id ? { ...studentDetail(ctx, s, { href: '#/school/students', label: t('All students') }), nav: 'students' } : { title: t('Student'), html: `<div class="empty"><p>${t('Student not found.')}</p></div>` }; }
    case 'teachers': return teachers(ctx, sch);
    case 'grade': return grade(ctx, sch);
    case 'reports': return reports(ctx, sch);
    case 'brand': return brand(ctx, sch);
    case 'accounts': return accountsPage(ctx);
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
  return `<div class="seg-tabs" role="group" aria-label="${t('Filter by grade')}" id="${id}">
    <button data-g="all" aria-pressed="${state.grade === 'all'}">${t('All grades')}</button>
    ${has.map(g => `<button data-g="${g}" aria-pressed="${String(state.grade) === String(g)}">${t('Grade {g}', { g })}</button>`).join('')}</div>`;
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
    title: t('Overview'), nav: '',
    html: `
    <section class="hero-card">
      <div class="hc-copy">
        <p class="eyebrow">${esc(sch.name)} · ${t('Grades {list}', { list: grades.join(', ') })} · ${t('{n} sections', { n: sch.sections.length })}</p>
        <h2>${esc(sch.studio)}</h2>
        <p>${state.grade === 'all' ? t('{n} students on Kaushal Bodh.', { n: S.students }) : t('{n} students on Kaushal Bodh in Grade {g}.', { n: S.students, g: state.grade })} ${S.vivaDue ? t(S.vivaDue > 1 ? '<b>{n} vivas</b> ready to be marked.' : '<b>{n} viva</b> ready to be marked.', { n: S.vivaDue }) : t('No vivas waiting.')} ${t('Kaushal Mela in <b>{n} days</b>.', { n: Math.max(0, daysUntil(sch.melaDate)) })}</p>
        <a class="btn btn-brand" href="#/school/grade">${t('Mark work')} ${icon('arrow')}</a>
      </div>
      <div class="hc-ring">${ring(S.completion, { size: 150, stroke: 14, sub: t('activities done') })}</div>
    </section>
    ${gradeTabs(sch)}
    <div class="kpis">
      <div class="kpi"><span>${icon('users')}</span><b>${S.students}${state.grade === 'all' ? `<small>/${sch.seats}</small>` : ''}</b><p>${state.grade === 'all' ? t('Students (seats)') : t('Students')}</p></div>
      <div class="kpi"><span>${icon('quiz')}</span><b>${S.quizzes}</b><p>${t('Quiz attempts')}</p></div>
      <div class="kpi"><span>${icon('mic')}</span><b>${S.vivaDue}</b><p>${t('Vivas to mark')}</p></div>
      <div class="kpi ${S.inactive ? 'warn' : ''}"><span>${icon('bell')}</span><b>${S.inactive}</b><p>${t('Inactive 14+ days')}</p></div>
    </div>
    <div class="grade-cards">${grades.filter(g => state.grade === 'all' || g === +state.grade).map(g => {
      const gs = sch.sections.filter(s => s.grade === g); const gk = gs.flatMap(s => studentsOf(sch.id, s.id)); const st = stats(gk);
      const tnames = [...new Set(gs.map(s => user(s.teacherId)?.name).filter(Boolean))];
      return `<section class="card grade-card g${g}"><div class="gc-top"><span class="gnum">${g}</span><div><b>${t('Grade {g}', { g })}</b><small class="muted">${t(gs.length > 1 ? '{n} sections' : '{n} section', { n: gs.length })} · ${t('{n} students', { n: gk.length })}</small></div></div>
        <div class="gc-row"><span>${t('Activities')}</span>${bar(st.completion)}<b>${st.completion}%</b></div>
        <div class="gc-row"><span>${t('Score so far')}</span>${bar(st.score)}<b>${st.score == null ? '—' : `${st.score}%`}</b></div>
        <p class="muted small">${t(st.vivaDue === 1 ? '{n} viva to mark' : '{n} vivas to mark', { n: st.vivaDue })} · ${t('{n} inactive', { n: st.inactive })} · ${tnames.length ? esc(tnames.join(', ')) : `<span class="warn-txt">${t('No teacher assigned')}</span>`}</p></section>`;
    }).join('')}</div>
    ${sec ? `<section class="card">
      <div class="card-head">
        <h2 class="h-card">${icon('chart')} ${t('Progress heatmap')}</h2>
        <div class="filters">
          <label class="sel"><span class="sr-only">${t('Section')}</span><select id="hm-sec">${secs.map(s => `<option value="${s.id}" ${s.id === sec.id ? 'selected' : ''}>${esc(secLabel(s))}</option>`).join('')}</select></label>
          <label class="sel"><span class="sr-only">${t('Project')}</span><select id="hm-proj">${Object.values(sec.projects).map(id => `<option value="${id}" ${id === pid ? 'selected' : ''}>${esc(projectById(id).title)}</option>`).join('')}</select></label>
        </div>
      </div>
      ${heatmap(kids, pid, k => `#/school/student/${k.id}`)}
    </section>` : ''}
    <div class="grid-2">
      <section class="card"><h2 class="h-card">${icon('school')} ${t('Sections')}</h2>
        <ul class="sec-list">${secs.map(s => { const ks = studentsOf(sch.id, s.id); const avg = ks.length ? Math.round(ks.reduce((n, k) => n + yearSummary(db().progress[k.id], projectsFor(k)).activityPct, 0) / ks.length) : 0; return `<li><div><b>${esc(secLabel(s))}</b><small class="muted">${t('{n} students', { n: ks.length })} · ${user(s.teacherId) ? esc(user(s.teacherId).name) : t('No teacher')} · ${Object.values(s.projects).map(id => esc(projectById(id).title)).join(', ')}</small></div>${bar(avg)}<span class="num">${avg}%</span></li>`; }).join('')}</ul>
      </section>
      <section class="card"><h2 class="h-card">${icon('bell')} ${t('Recent activity')}</h2>
        <ul class="feed compact">${feed.map(f => `<li><b>${esc(f.who)}</b> ${esc(tx(f.what))} <small class="muted">${timeAgo(f.at)}</small></li>`).join('') || `<li class="muted">${t('Nothing yet.')}</li>`}</ul>
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
    title: t('Teachers'), nav: 'teachers',
    html: `${codeCard(sch, 'joinCode', { renew: true, note: t('Teachers can create their own account: they choose {school} and enter this code. Or add them yourself below.', { school: esc(sch.name) }) })}
    <div class="toolbar"><p class="muted">${t('Each section has one Kaushal Bodh teacher. Teachers see only their sections in the teacher portal.')}</p><button class="btn btn-brand btn-sm" id="add-t">${icon('plus')} ${t('Add teacher')}</button></div>
    ${unassigned.length ? `<p class="warn-bar round">${t(unassigned.length > 1 ? '{n} sections have no teacher: {list}.' : '{n} section has no teacher: {list}.', { n: unassigned.length, list: unassigned.map(s => esc(secLabel(s))).join(', ') })}</p>` : ''}
    <section class="card tbl-card"><div class="card-head pad"><h2 class="h-card">${icon('users')} ${t('Classes and their teachers')}</h2><span class="muted small">${t('Changing a teacher keeps every student\'s work and marks.')}</span></div>
      <table class="tbl class-tbl"><thead><tr><th>${t('Class')}</th><th>${t('Students')}</th><th>${t('Teacher')}</th><th aria-label="${t('Actions')}"></th></tr></thead>
      <tbody>${sortedSecs(sch).map(s => { const tc = user(s.teacherId); return `<tr><td><b>${esc(secLabel(s))}</b></td><td>${studentsOf(sch.id, s.id).length}</td>
        <td>${tc ? esc(tc.name) : `<span class="warn-txt">${t('No teacher')}</span>`}</td>
        <td><button class="btn btn-sm btn-ghost" data-swap="${s.id}">${icon('refresh')} ${tc ? t('Change teacher') : t('Assign a teacher')}</button></td></tr>`; }).join('') || `<tr><td colspan="4" class="muted">${t('No classes yet. Add one on the Year plan page.')}</td></tr>`}</tbody></table></section>
    <div class="teacher-cards">${ts.map(tc => {
      const mine = sortedSecs(sch).filter(s => tc.sectionIds.includes(s.id)); const kids = mine.flatMap(s => studentsOf(sch.id, s.id)); const st = stats(kids);
      return `<section class="card teacher-card"><div class="tc-head"><span class="avatar lg">${esc(tc.name.split(' ').map(w => w[0]).join('').slice(0, 2))}</span><div><b>${esc(tc.name)}</b><small class="muted">${esc(t(tc.title || 'Kaushal Bodh teacher'))} · <span class="mono">@${esc(tc.login)}</span></small></div></div>
        <div class="chips">${mine.map(s => `<span class="chip">${esc(secLabel(s))}</span>`).join('') || `<span class="muted small">${t('No sections yet')}</span>`}</div>
        <div class="gc-row"><span>${t('{n} students', { n: kids.length })}</span>${bar(st.completion)}<b>${st.completion}%</b></div>
        <p class="muted small">${t(st.vivaDue === 1 ? '{n} viva to mark' : '{n} vivas to mark', { n: st.vivaDue })} · ${t('{n} inactive', { n: st.inactive })}</p>
        <div class="btn-row"><button class="btn btn-ghost btn-sm" data-assign="${tc.id}">${t('Change sections')}</button><button class="btn btn-sm linkish" data-reset="${tc.id}">${icon('key')} ${t('Password')}</button><button class="btn btn-sm btn-ghost danger" data-del="${tc.id}" aria-label="${t('Delete {name}', { name: esc(tc.name) })}">${icon('trash')}</button></div></section>`;
    }).join('') || `<div class="empty"><p>${t('No teachers yet.')}</p></div>`}</div>`,
    mount(el) {
      const form = (tc) => `<form id="tf" class="form-grid">
          ${tc ? '' : `<label>${t('Teacher\'s full name')}<input name="name" required maxlength="60"></label><label>${t('Email')} <small class="muted">${t('optional')}</small><input name="email" type="email" maxlength="80"></label>`}
          <fieldset><legend>${t('Sections')}</legend><div class="check-grid">${sortedSecs(sch).map(s => `<label class="check"><input type="checkbox" name="sec" value="${s.id}" ${tc?.sectionIds.includes(s.id) ? 'checked' : ''}><span>${esc(secLabel(s))}<small class="muted">${s.teacherId && s.teacherId !== tc?.id ? t('now {name}', { name: esc(user(s.teacherId)?.name || '') }) : t('unassigned')}</small></span></label>`).join('')}</div></fieldset>
          <div class="modal-actions"><button type="button" class="btn btn-ghost" data-close>${t('Cancel')}</button><button class="btn btn-brand">${t('Save')}</button></div></form>`;
      const open = tc => {
        const d = modal(`<h2>${tc ? t('Sections for {name}', { name: esc(tc.name) }) : t('Add a teacher')}</h2>${form(tc)}`);
        $('#tf', d).addEventListener('submit', async e => {
          e.preventDefault(); const f = e.target;
          const ids = $$('input[name=sec]:checked', f).map(x => x.value);
          if (tc) { assignSections(tc, ids); log(ctx.me.name, `updated sections for ${tc.name}`, sch.id); }
          else {
            if (!f.name.value.trim()) return;
            const { teacher: nt, pw } = addTeacher(sch.id, f.name.value.trim(), ids, { email: f.email.value.trim() || undefined });
            log(ctx.me.name, `added teacher ${nt.name}`, sch.id); save(); d.close();
            await showCredsSaved(t('{name} can log in now', { name: nt.name }), [{ u: nt, name: nt.name, role: t('Teacher'), icon: 'book', login: nt.login, pw }]);
            ctx.rerender();
            return;
          }
          save(); d.close(); toast(t('Teacher saved.')); ctx.rerender();
        });
      };
      bindCodeCards(el, ctx, sch);
      $$('[data-reset]', el).forEach(b => b.addEventListener('click', () => passwordModal(ctx, user(b.dataset.reset))));
      $$('[data-del]', el).forEach(b => b.addEventListener('click', () => deleteModal(ctx, user(b.dataset.del), () => ctx.rerender())));
      $('#add-t', el).addEventListener('click', () => open(null));
      $$('[data-swap]', el).forEach(b => b.addEventListener('click', () => changeTeacherModal(ctx, sch, section(sch, b.dataset.swap))));
      $$('[data-assign]', el).forEach(b => b.addEventListener('click', () => open(user(b.dataset.assign))));
    },
  };
}

// Give a class a different teacher: someone already at the school, a new teacher, or nobody for now.
function changeTeacherModal(ctx, sch, sec) {
  if (!sec) return;
  const cur = user(sec.teacherId);
  const kids = studentsOf(sch.id, sec.id).length;
  const others = teachersOf(sch.id).filter(x => x !== cur).sort((a, b) => a.name.localeCompare(b.name));
  const classesOf = tc => sortedSecs(sch).filter(x => (tc.sectionIds || []).includes(x.id)).map(x => x.name).join(', ');
  const d = modal(`<h2>${t(cur ? 'Change the teacher for {sec}' : 'Assign a teacher for {sec}', { sec: esc(secLabel(sec)) })}</h2>
    <p class="muted">${cur ? t('Now taught by <b>{name}</b>.', { name: esc(cur.name) }) : t('This class has no teacher.')} ${t(kids === 1 ? '{n} student.' : '{n} students.', { n: kids })}</p>
    <p class="callout ok-note">${icon('check')} <span>${cur ? t('Students\' activities, quiz scores, lab stars, portfolios, marks and teacher feedback stay exactly as they are, and so do the year plan and the lessons already taught. The new teacher sees all of it straight away; {name} no longer sees this class.', { name: esc(cur.name.split(' ')[0]) }) : t('Students\' activities, quiz scores, lab stars, portfolios, marks and teacher feedback stay exactly as they are, and so do the year plan and the lessons already taught. The new teacher sees all of it straight away.')}</span></p>
    <form id="ct" class="form-grid">
      <fieldset><legend>${t('New teacher')}</legend><div class="pick-list">
        ${others.map((tc, i) => `<label class="check"><input type="radio" name="t" value="${tc.id}" ${i === 0 ? 'checked' : ''}><span>${esc(tc.name)}<small class="muted">${classesOf(tc) ? t('Teaches {list}', { list: esc(classesOf(tc)) }) : t('No classes yet')}</small></span></label>`).join('')}
        <label class="check"><input type="radio" name="t" value="__new" ${others.length ? '' : 'checked'}><span>${t('A new teacher')}<small class="muted">${t('Makes a login for them')}</small></span></label>
        ${cur ? `<label class="check"><input type="radio" name="t" value=""><span>${t('No teacher for now')}<small class="muted">${t('The class keeps its work until someone is assigned')}</small></span></label>` : ''}
      </div></fieldset>
      <div id="ct-new" class="row-2" hidden><label>${t('Teacher\'s full name')}<input name="name" maxlength="60" autocomplete="off"></label><label>${t('Email')} <small class="muted">${t('optional')}</small><input name="email" type="email" maxlength="80"></label></div>
      <p class="form-err" id="ct-err" role="alert"></p>
      <div class="modal-actions"><button type="button" class="btn btn-ghost" data-close>${t('Cancel')}</button><button class="btn btn-brand">${t('Save')}</button></div>
    </form>`, { wide: true });
  const f = $('#ct', d), box = $('#ct-new', d);
  const sync = () => { box.hidden = f.t.value !== '__new'; if (!box.hidden) f.name.focus(); };
  $$('input[name=t]', f).forEach(r => r.addEventListener('change', sync)); sync();
  f.addEventListener('submit', async e => {
    e.preventDefault();
    const pick = f.t.value;
    let to = null, creds = null;
    if (pick === '__new') {
      const nm = f.name.value.trim().replace(/\s+/g, ' ');
      if (nm.length < 2) { $('#ct-err', d).textContent = t('Enter the new teacher\'s full name.'); f.name.focus(); return; }
      if (f.email.value && f.email.validity.typeMismatch) { $('#ct-err', d).textContent = t('That email does not look right.'); return; }
      const { teacher, pw } = addTeacher(sch.id, nm, [], { email: f.email.value.trim() || undefined });
      log(ctx.me.name, `added teacher ${teacher.name}`, sch.id);
      to = teacher; creds = [{ u: teacher, name: teacher.name, role: t('Teacher · {sec}', { sec: secLabel(sec) }), icon: 'book', login: teacher.login, pw }];
    } else to = pick ? user(pick) : null;
    setSectionTeacher(sch, sec.id, to?.id || null);
    const secEn = `Grade ${sec.grade} · ${sec.name}`; // activity-feed lines are stored in English
    log(ctx.me.name, to ? `made ${to.name} the teacher of ${secEn}${cur ? ` (was ${cur.name})` : ''}` : `removed ${cur?.name || 'the teacher'} from ${secEn}`, sch.id);
    save(); d.close();
    toast(to ? t('{name} now teaches {sec}. All student work is kept.', { name: to.name, sec: sec.name }) : t('{sec} has no teacher for now. All student work is kept.', { sec: sec.name }));
    if (creds) await showCredsSaved(t('{name} can log in now', { name: to.name }), creds);
    ctx.rerender();
  });
}

/* ---------- Year plan ---------- */
const weeks = p => t('{n} weeks', { n: Math.round(p.periods / 4) });
const seg = p => `<div class="seg ${p.form}" style="flex-grow:${p.periods}"><b>${esc(p.title)}</b><small>${weeks(p)}</small></div>`;
function plan(ctx, sch) {
  const secs = sortedSecs(sch).filter(inGrade);
  return {
    title: t('Year plan'), nav: 'plan',
    html: `<p class="lead-in">${t('Choose one project from each form of work for every section. CBSE asks for about 110 hours a year: two consecutive periods, twice a week.')}</p>
    <div class="toolbar">${gradeTabs(sch)}<button class="btn btn-ghost btn-sm" id="add-sec">${icon('plus')} ${t('Add section')}</button></div>
    ${secs.map(s => `<section class="card plan-card" data-sec="${s.id}">
      <div class="card-head"><h2 class="h-card">${icon('school')} ${esc(secLabel(s))}</h2><span class="muted small">${t('{n} students', { n: studentsOf(sch.id, s.id).length })} · ${user(s.teacherId) ? esc(user(s.teacherId).name) : t('No teacher')} · <button type="button" class="linkish" data-swap="${s.id}">${s.teacherId ? t('Change teacher') : t('Assign teacher')}</button></span></div>
      <div class="plan-picks">${Object.values(FORMS).map(f => `<label class="f-${f.key}"><span class="form-tag">${esc(f.name)}</span>
        <select data-form="${f.key}">${projectsOfGrade(s.grade).filter(p => p.form === f.key).map(p => `<option value="${p.id}" ${s.projects[f.key] === p.id ? 'selected' : ''}>${t('{title} ({n} periods)', { title: esc(p.title), n: p.periods })}</option>`).join('')}</select></label>`).join('')}</div>
      <div class="plan-tl">${Object.values(s.projects).map(id => seg(projectById(id))).join('')}<div class="seg mela" style="flex-grow:6"><b>${t('Mela')}</b></div></div>
    </section>`).join('')}
    <section class="card"><div class="card-head"><h2 class="h-card">${icon('star')} ${t('Kaushal Mela')}</h2></div>
      <label class="inline-field" for="mela">${t('Date of your school\'s skill fair')} <input type="date" id="mela" value="${sch.melaDate}"></label>
      <button class="btn btn-brand" id="save-plan">${t('Save plan')}</button>
    </section>`,
    mount(el) {
      bindGradeTabs(el, ctx);
      $$('[data-swap]', el).forEach(b => b.addEventListener('click', () => changeTeacherModal(ctx, sch, section(sch, b.dataset.swap))));
      $('#save-plan', el).addEventListener('click', () => {
        let changed = 0;
        $$('.plan-card', el).forEach(c => {
          const s = section(sch, c.dataset.sec);
          $$('select', c).forEach(sel => { if (s.projects[sel.dataset.form] !== sel.value) { s.projects[sel.dataset.form] = sel.value; changed++; } });
        });
        if ($('#mela', el).value) sch.melaDate = $('#mela', el).value;
        log(ctx.me.name, 'updated the year plan', sch.id);
        save(); toast(changed ? t('Plan saved. Students will see their new projects.') : t('Plan saved.')); ctx.rerender();
      });
      // Changing a project slides the timeline segments to their new lengths.
      $$('.plan-card select', el).forEach(sel => sel.addEventListener('change', () => {
        const c = sel.closest('.plan-card');
        const segs = $$('.plan-tl .seg:not(.mela)', c);
        $$('select', c).forEach((x, i) => {
          const p = projectById(x.value), sg = segs[i];
          if (!sg || sg.querySelector('b').textContent === p.title) return;
          sg.className = `seg ${p.form}`; sg.style.flexGrow = p.periods;
          sg.querySelector('b').textContent = p.title; sg.querySelector('small').textContent = weeks(p);
          sg.animate([{ opacity: .35 }, { opacity: 1 }], { duration: 420, easing: 'ease-out' });
        });
      }));
      $('#add-sec', el).addEventListener('click', () => {
        const d = modal(`<h2>${t('Add a section')}</h2><form id="sf" class="form-grid">
          <label>${t('Grade')}<select name="grade">${GRADES.map(g => `<option ${String(state.grade) === String(g) ? 'selected' : ''}>${g}</option>`).join('')}</select></label>
          <label>${t('Section name')}<input name="name" required maxlength="12" placeholder="${t('e.g. 7 B')}"></label>
          <label>${t('Teacher')}<select name="t"><option value="">${t('Assign later')}</option>${teachersOf(sch.id).map(tc => `<option value="${tc.id}">${esc(tc.name)}</option>`).join('')}</select></label>
          <div class="modal-actions"><button type="button" class="btn btn-ghost" data-close>${t('Cancel')}</button><button class="btn btn-brand">${t('Add section')}</button></div></form>`);
        $('#sf', d).addEventListener('submit', e => {
          e.preventDefault(); const f = e.target; if (!f.name.value.trim()) return;
          addSection(sch, +f.grade.value, f.name.value.trim(), f.t.value || null);
          log(ctx.me.name, `added section ${f.name.value.trim()}`, sch.id); save();
          d.close(); toast(t('Section added with the default projects for its grade.')); ctx.rerender();
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
    title: t('Students'), nav: 'students',
    html: `${codeCard(sch, 'studentCode', { renew: true, note: t('Students can create their own account: they choose {school}, enter this code and pick their class. Give it to your Kaushal Bodh teachers to share in class, or add students yourself below.', { school: esc(sch.name) }) })}
    <div class="toolbar">
      <label class="search">${icon('eye')}<span class="sr-only">${t('Search students')}</span><input id="q" placeholder="${t('Search by name')}" value="${esc(state.q)}"></label>
      <label class="sel"><span class="sr-only">${t('Section')}</span><select id="sec-f"><option value="">${t('All sections')}</option>${sortedSecs(sch).map(s => `<option value="${s.id}" ${state.sec === s.id ? 'selected' : ''}>${esc(secLabel(s))}</option>`).join('')}</select></label>
      <button class="btn btn-brand btn-sm" id="add">${icon('plus')} ${t('Add student')}</button>
    </div>
    <section class="card tbl-card"><table class="tbl" id="stu-tbl">
      <thead><tr><th>${t('Name')}</th><th>${t('Grade')}</th><th>${t('Section')}</th><th>${t('Activities')}</th><th>${t('Score so far')}</th><th>${t('Last active')}</th><th>${t('Parent')}</th><th aria-label="${t('Actions')}"></th></tr></thead>
      <tbody>${rows.map(r => `<tr data-name="${esc(r.s.name.toLowerCase())}" data-sec="${r.s.sectionId}">
        <td><a href="#/school/student/${r.s.id}">${esc(r.s.name)}</a><small class="muted mono block">@${esc(r.s.login)}</small></td><td>${r.g}</td><td>${esc(secName(sch, r.s.sectionId))}</td>
        <td><div class="cell-bar">${bar(r.y.activityPct)}<span>${r.y.actsDone}/${r.y.actsTotal}</span></div></td>
        <td>${r.y.score == null ? '—' : `${r.y.score}% <small class="muted">${bandT(r.y.score)}</small>`}</td>
        <td class="${!r.la || Date.now() - r.la > 14 * 86400000 ? 'warn-txt' : ''}">${timeAgo(r.la)}</td><td>${r.parents.length ? r.parents.map(p => esc(p.name)).join(', ') : '—'}</td>
        <td><div class="btn-row nowrap acc-acts"><button class="btn btn-sm btn-ghost" data-pw="${r.s.id}" aria-label="${t('Password for {name}', { name: esc(r.s.name) })}" title="${t('Password')}">${icon('key')}</button><button class="btn btn-sm btn-ghost danger" data-del="${r.s.id}" aria-label="${t('Delete {name}', { name: esc(r.s.name) })}" title="${t('Delete')}">${icon('trash')}</button></div></td></tr>`).join('')}</tbody>
    </table><p class="muted small" id="count"></p></section>`,
    mount(el) {
      const filter = () => {
        const q = $('#q', el).value.trim().toLowerCase(); const sec = $('#sec-f', el).value;
        state.q = q; state.sec = sec || null;
        let n = 0;
        $$('#stu-tbl tbody tr', el).forEach(tr => { const show = tr.dataset.name.includes(q) && (!sec || tr.dataset.sec === sec); tr.hidden = !show; if (show) n++; });
        $('#count', el).textContent = t(n === 1 ? '{n} student' : '{n} students', { n });
      };
      $('#q', el).addEventListener('input', filter); $('#sec-f', el).addEventListener('change', filter); filter();
      bindCodeCards(el, ctx, sch);
      $('#add', el).addEventListener('click', () => addPersonModal(ctx, { role: 'student', onDone: () => ctx.rerender() }));
      $$('[data-pw]', el).forEach(b => b.addEventListener('click', () => passwordModal(ctx, user(b.dataset.pw))));
      $$('[data-del]', el).forEach(b => b.addEventListener('click', () => deleteModal(ctx, user(b.dataset.del), () => ctx.rerender())));
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
    title: t('Mark work'), nav: 'grade',
    html: `<p class="lead-in">${t('Quizzes and the activity book are marked automatically. Teachers mark the viva, the observation rubric and the portfolio, about a minute per student.')}</p>
    <div class="toolbar">
      <label class="sel"><span class="sr-only">${t('Section')}</span><select id="g-sec">${secs.map(s => `<option value="${s.id}" ${s.id === sec.id ? 'selected' : ''}>${esc(secLabel(s))}</option>`).join('')}</select></label>
      <label class="sel"><span class="sr-only">${t('Project')}</span><select id="g-proj">${Object.values(sec.projects).map(id => `<option value="${id}" ${id === pid ? 'selected' : ''}>${esc(projectById(id).title)}</option>`).join('')}</select></label>
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
    title: t('Reports'), nav: 'reports',
    html: `${gradeTabs(sch)}
    <div class="grid-2">
      <section class="card"><h2 class="h-card">${icon('chart')} ${t('Bands so far')}</h2>
        <ul class="dist">${dist.map(x => `<li><span>${t(x.b)}</span>${bar(marked.length ? x.n / marked.length * 100 : 0)}<b>${x.n}</b></li>`).join('')}</ul>
        <p class="muted small">${t('{n} of {total} students have at least one marked part.', { n: marked.length, total: rows.length })}</p></section>
      <section class="card"><h2 class="h-card">${icon('download')} ${t('Export')}</h2>
        <p>${t('Download every student\'s marks in the five CBSE parts, project totals and the year score, ready for internal assessment.')}</p>
        <button class="btn btn-brand" id="csv">${icon('download')} ${t('Download CSV')}</button></section>
    </div>
    <section class="card tbl-card"><table class="tbl">
      <thead><tr><th>${t('Student')}</th><th>${t('Grade')}</th><th>${t('Section')}</th>${['Life forms', 'Machines', 'Services'].map(x => `<th>${t(x)}</th>`).join('')}<th>${t('Year')}</th><th>${t('Band')}</th></tr></thead>
      <tbody>${rows.map(r => `<tr><td>${esc(r.s.name)}</td><td>${r.g}</td><td>${esc(secName(sch, r.s.sectionId))}</td>${r.y.per.map(x => `<td title="${esc(projectById(x.id).title)}">${x.score == null ? '—' : `${x.score}%${x.complete ? '' : '*'}`}</td>`).join('')}<td><b>${r.y.score == null ? '—' : `${r.y.score}%`}</b></td><td>${bandT(r.y.score)}</td></tr>`).join('') || `<tr><td colspan="8" class="muted">${t('No students yet.')}</td></tr>`}</tbody>
    </table><p class="muted small">${t('* still in progress, scored on the parts marked so far.')}</p></section>`,
    mount(el) {
      bindGradeTabs(el, ctx);
      $('#csv', el).addEventListener('click', () => {
        const head = ['Student', 'Grade', 'Section', 'Project', 'Form of work', 'Activities done', 'Written test %', 'Viva %', 'Activity book %', 'Portfolio %', 'Observation %', 'Project score %', 'Complete', 'Year score %'].map(h => t(h));
        const lines = [head.map(csvCell).join(',')];
        for (const r of rows) for (const x of r.y.per) {
          const p = projectById(x.id);
          lines.push([r.s.name, r.g, secName(sch, r.s.sectionId), p.title, FORMS[p.form].name, `${x.done}/${x.total}`, x.parts.written, x.parts.viva, x.parts.book, x.parts.portfolio, x.parts.observation, x.score, x.complete ? t('yes') : t('no'), r.y.score].map(csvCell).join(','));
        }
        download(`${sch.name.replace(/\W+/g, '-')}-kaushal-bodh-${state.grade === 'all' ? 'grades-6-8' : `grade${state.grade}`}.csv`, lines.join('\n'));
        toast(t('CSV downloaded.'));
      });
    },
  };
}

/* ---------- Branding ---------- */
const COLORS = ['#1F6F66', '#2D5BA8', '#7A3FA0', '#B23A48', '#C26A12', '#3E7B2A', '#0F4C5C', '#8C3557'];
function brand(ctx, sch) {
  return {
    title: t('Branding'), nav: 'brand',
    html: `<div class="grid-2 brand-grid">
      <section class="card">
        <h2 class="h-card">${icon('brush')} ${t('Your studio')}</h2>
        <p class="muted">${t('Students and parents see these on every screen. "Powered by VINC Lab" stays small in the sidebar.')}</p>
        <form id="bf" class="form-grid">
          <label>${t('School name')}<input name="name" value="${esc(sch.name)}" maxlength="60" required></label>
          <label>${t('Skill studio name')}<input name="studio" value="${esc(sch.studio)}" maxlength="40" required></label>
          <label>${t('Badge letters')}<input name="initials" value="${esc(sch.initials)}" maxlength="3" required></label>
          <fieldset><legend>${t('Brand colour')}</legend><div class="swatches">${COLORS.map(c => `<label class="sw"><input type="radio" name="color" value="${c}" ${c.toLowerCase() === sch.color.toLowerCase() ? 'checked' : ''}><span style="--c:${c}" aria-label="${c}"></span></label>`).join('')}
            <label class="sw custom"><input type="color" name="custom" value="${sch.color}" aria-label="${t('Custom colour')}"></label></div></fieldset>
          <div class="modal-actions"><button class="btn btn-brand">${t('Save branding')}</button></div>
        </form>
      </section>
      <section class="card preview-card"><h2 class="h-card">${icon('eye')} ${t('Preview')}</h2>
        <div class="mini-app" id="pv">
          <div class="ma-side"><span class="badge" id="pv-badge">${esc(sch.initials)}</span><b id="pv-studio">${esc(sch.studio)}</b><small id="pv-name">${esc(sch.name)}</small><i></i><i></i><i></i></div>
          <div class="ma-main"><b>${t('Good morning, Aarav 👋')}</b><div class="ma-ring"></div><div class="ma-btn">${t('Continue project')}</div></div>
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
        save(); toast(t('Branding saved for every student and parent.')); ctx.rerender();
      });
    },
  };
}
