// Account management shared by the VINC Lab admin (every school) and school coordinators (their own
// school): list people, add them, reset or set passwords, and delete accounts or whole schools.
import { db, save, school, section, user, studentsOf, parentsOf, childrenOf, log, resetPassword, setPasswordFor,
  addTeacher, addStudent, addParent, addCoordinator, deleteUser, deleteSchool, soleParents } from '../store.js';
import { $, $$, esc, icon, timeAgo, toast, modal } from '../ui.js';
import { showCreds, secLabel } from './shared.js';

export const ROLE_LABEL = { school: 'Coordinator', teacher: 'Teacher', student: 'Student', parent: 'Parent' };
const ROLE_ICON = { school: 'school', teacher: 'book', student: 'star', parent: 'home' };
const ORDER = { school: 0, teacher: 1, student: 2, parent: 3 };
const sortedSecs = sch => [...(sch?.sections || [])].sort((a, b) => a.grade - b.grade || a.name.localeCompare(b.name));

// What each manager may touch: the admin manages everyone but admins; a coordinator manages the
// teachers, students and parents of their own school.
const rolesFor = me => me.role === 'admin' ? ['school', 'teacher', 'student', 'parent'] : ['teacher', 'student', 'parent'];
export const canManage = (me, u) => !!u && u.id !== me.id && u.role !== 'admin' && rolesFor(me).includes(u.role) && (me.role === 'admin' || u.schoolId === me.schoolId);

/* ---------- Passwords ---------- */
// Reset with a temporary password, or set one the person asked for.
export function passwordModal(ctx, u, onDone) {
  if (!u) return;
  const role = ROLE_LABEL[u.role] || 'Account';
  const d = modal(`<div class="creds-head"><span class="creds-ic">${icon('key')}</span><div><h2>Password for ${esc(u.name)}</h2><p class="muted">${esc(role)} · <span class="mono">@${esc(u.login)}</span>. Their old password stops working.</p></div></div>
    <div class="pw-opts">
      <section class="pw-opt"><h3>${icon('refresh')} Make a temporary password</h3><p class="muted small">VINC Lab makes one up. They choose their own the next time they log in.</p>
        <button type="button" class="btn btn-brand" id="pw-temp">Make a temporary password</button></section>
      <form class="pw-opt" id="pw-set" novalidate><h3>${icon('lock')} Or set a password</h3>
        <label class="sr-only" for="pw-new">New password</label>
        <input id="pw-new" name="pw" type="text" minlength="8" maxlength="64" autocomplete="off" spellcheck="false" placeholder="At least 8 characters">
        <label class="check-line"><input type="checkbox" name="temp" checked><span>Ask them to change it when they next log in</span></label>
        <p class="form-err" id="pw-err" role="alert"></p>
        <button class="btn btn-ghost">Set this password</button></form>
    </div>
    <div class="modal-actions"><button type="button" class="btn btn-ghost" data-close>Cancel</button></div>`, { wide: true });
  const done = (pw, temp) => {
    log(ctx.me.name, `reset the password for ${u.name}`, u.schoolId);
    save(); d.close();
    showCreds(`New password for ${u.name}`, [{ name: u.name, role, icon: ROLE_ICON[u.role], login: u.login, pw, temp }],
      temp ? 'Share these privately. They will be asked to choose their own password after logging in.' : 'Share these privately.');
    onDone?.();
  };
  $('#pw-temp', d).addEventListener('click', () => done(resetPassword(u), true));
  $('#pw-set', d).addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target, pw = f.pw.value;
    if (pw.length < 8) { $('#pw-err', d).textContent = 'Use at least 8 characters.'; f.pw.focus(); return; }
    setPasswordFor(u, pw, { temp: f.temp.checked });
    done(pw, f.temp.checked);
  });
}

/* ---------- Deleting ---------- */
export function deleteModal(ctx, u, onDone) {
  if (!u) return;
  const sch = school(u.schoolId);
  let what = '';
  const sole = u.role === 'student' ? soleParents(u) : [];
  if (u.role === 'student') what = `<p>${esc(u.name)}'s activities, quiz scores, lab stars, portfolio and marks will be deleted.</p>
    ${sole.length ? `<label class="check-line"><input type="checkbox" id="del-par" checked><span>Also delete the parent login${sole.length > 1 ? 's' : ''} for ${sole.map(p => `<b>${esc(p.name)}</b>`).join(' and ')} (not linked to another child)</span></label>` : ''}`;
  if (u.role === 'teacher') { const secs = sortedSecs(sch).filter(s => s.teacherId === u.id); what = `<p>${secs.length ? `${secs.map(s => esc(secLabel(s))).join(', ')} will have no teacher until someone else is given ${secs.length > 1 ? 'them' : 'it'}.` : 'They have no sections.'} Students' work is kept.</p>`; }
  if (u.role === 'parent') { const kids = childrenOf(u); what = `<p>${kids.length ? `${kids.map(k => esc(k.name)).join(' and ')} ${kids.length > 1 ? 'keep their' : 'keeps their'} own account${kids.length > 1 ? 's' : ''} and work.` : 'No child is linked to this account.'}</p>`; }
  if (u.role === 'school') { const others = db().users.filter(x => x.role === 'school' && x.schoolId === u.schoolId && x !== u); what = `<p>${others.length ? `${others.map(o => esc(o.name)).join(', ')} will still run ${esc(sch?.name || 'the school')}.` : `${esc(sch?.name || 'The school')} will have no coordinator until you add one. The school and its people are kept.`}</p>`; }
  const d = modal(`<div class="creds-head"><span class="creds-ic danger-ic">${icon('trash')}</span><div><h2>Delete ${esc(u.name)}?</h2><p class="muted">${esc(ROLE_LABEL[u.role])}${sch ? ` at ${esc(sch.name)}` : ''} · <span class="mono">@${esc(u.login)}</span></p></div></div>
    ${what}<p class="muted small">This cannot be undone. They will no longer be able to log in.</p>
    <div class="modal-actions"><button type="button" class="btn btn-ghost" data-close>Cancel</button><button type="button" class="btn btn-danger" id="del-go">${icon('trash')} Delete account</button></div>`);
  $('#del-go', d).addEventListener('click', () => {
    const gone = deleteUser(u.id, { withParents: !!$('#del-par', d)?.checked });
    for (const g of gone) log(ctx.me.name, `deleted the ${ROLE_LABEL[g.role].toLowerCase()} account of ${g.name}`, u.schoolId);
    save(); d.close();
    toast(gone.length > 1 ? `Deleted ${gone.map(g => g.name).join(' and ')}.` : `Deleted ${u.name}.`);
    onDone?.();
  });
}

// Deleting a school removes everything in it, so the admin types its name to confirm.
export function deleteSchoolModal(ctx, sch, onDone) {
  const people = db().users.filter(u => u.schoolId === sch.id);
  const n = r => people.filter(u => u.role === r).length;
  const d = modal(`<div class="creds-head"><span class="creds-ic danger-ic">${icon('trash')}</span><div><h2>Delete ${esc(sch.name)}?</h2><p class="muted">Everything in this school is deleted for good.</p></div></div>
    <ul class="del-list"><li><b>${n('school')}</b> coordinator${n('school') === 1 ? '' : 's'}</li><li><b>${n('teacher')}</b> teacher${n('teacher') === 1 ? '' : 's'}</li><li><b>${n('student')}</b> student${n('student') === 1 ? '' : 's'}, with all their work and marks</li><li><b>${n('parent')}</b> parent${n('parent') === 1 ? '' : 's'}</li><li>Its ${sch.sections.length} section${sch.sections.length === 1 ? '' : 's'}, year plan and branding</li></ul>
    <form id="ds" class="form-grid"><label>Type the school's name to confirm<input name="confirm" autocomplete="off" spellcheck="false" placeholder="${esc(sch.name)}"></label>
    <div class="modal-actions"><button type="button" class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-danger" id="ds-go" disabled>${icon('trash')} Delete school</button></div></form>`);
  const f = $('#ds', d), go = $('#ds-go', d);
  f.confirm.addEventListener('input', () => { go.disabled = f.confirm.value.trim().toLowerCase() !== sch.name.toLowerCase(); });
  f.addEventListener('submit', e => {
    e.preventDefault(); if (go.disabled) return;
    const count = deleteSchool(sch.id);
    log(ctx.me.name, `deleted ${sch.name} and its ${count} account${count === 1 ? '' : 's'}`, null);
    save(); d.close(); toast(`${sch.name} deleted.`); onDone?.();
  });
}

/* ---------- Adding ---------- */
// One form for every kind of person. A coordinator's school is fixed; the admin picks one.
export function addPersonModal(ctx, { schoolId = null, role = null, childId = null, onDone } = {}) {
  const roles = rolesFor(ctx.me);
  const fixed = ctx.me.role === 'admin' ? null : ctx.me.schoolId;
  const schools = db().schools.slice().sort((a, b) => a.name.localeCompare(b.name));
  if (!fixed && !schools.length) { toast('Add a school first. People always belong to a school.', 'warn', 4500); return; }
  const st = { role: roles.includes(role) ? role : roles.includes('student') ? 'student' : roles[0], schoolId: fixed || schoolId || schools[0].id };
  const d = modal(`<h2>Add a person</h2>
    <form id="ap" class="form-grid" novalidate>
      <fieldset><legend>Who are you adding?</legend><div class="seg-tabs role-tabs">${roles.map(r => `<button type="button" data-r="${r}" aria-pressed="${r === st.role}">${icon(ROLE_ICON[r])} ${ROLE_LABEL[r]}</button>`).join('')}</div></fieldset>
      ${fixed ? '' : `<label>School<select name="school">${schools.map(s => `<option value="${s.id}" ${s.id === st.schoolId ? 'selected' : ''}>${esc(s.name)}${s.city ? `, ${esc(s.city)}` : ''}</option>`).join('')}</select></label>`}
      <div id="ap-fields"></div>
      <p class="form-err" id="ap-err" role="alert"></p>
      <div class="modal-actions"><button type="button" class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-brand" id="ap-go">${icon('plus')} Add</button></div>
    </form>`, { wide: true });
  const f = $('#ap', d), box = $('#ap-fields', d);
  const paint = () => {
    const sch = school(st.schoolId), secs = sortedSecs(sch);
    const name = l => `<label>${l}<input name="name" required maxlength="60" autocomplete="off"></label>`;
    const contact = (phoneReq) => `<div class="row-2"><label>Email <small class="muted">optional</small><input name="email" type="email" maxlength="80"></label><label>Mobile ${phoneReq ? '' : '<small class="muted">optional</small>'}<input name="phone" type="tel" inputmode="tel" maxlength="15"></label></div>`;
    let html = '';
    if (st.role === 'school') html = `${name('Coordinator\'s full name')}${contact()}`;
    if (st.role === 'teacher') html = `${name('Teacher\'s full name')}${contact()}
      <fieldset><legend>Sections</legend>${secs.length ? `<div class="check-grid">${secs.map(s => `<label class="check"><input type="checkbox" name="sec" value="${s.id}"><span>${esc(secLabel(s))}<small class="muted">${s.teacherId && user(s.teacherId) ? `now ${esc(user(s.teacherId).name)}` : 'no teacher yet'}</small></span></label>`).join('')}</div>` : '<p class="muted small">This school has no sections yet.</p>'}</fieldset>`;
    if (st.role === 'student') html = secs.length ? `${name('Student\'s full name')}
      <label>Class and section<select name="sec">${secs.map(s => `<option value="${s.id}">${esc(secLabel(s))}</option>`).join('')}</select></label>
      <div class="row-2"><label>Parent's name <small class="muted">optional, makes a parent login too</small><input name="parent" maxlength="60"></label><label>Parent's mobile <small class="muted">optional</small><input name="parentPhone" type="tel" inputmode="tel" maxlength="15"></label></div>`
      : '<p class="empty-note">This school has no sections yet, so there is no class to put a student in.</p>';
    if (st.role === 'parent') {
      const kids = studentsOf(sch.id).sort((a, b) => a.name.localeCompare(b.name));
      html = kids.length ? `${name('Parent\'s full name')}
        <label>They are the child's<select name="relation"><option>Mother</option><option>Father</option><option>Guardian</option></select></label>${contact()}
        <fieldset><legend>Linked child${kids.length > 1 ? 'ren' : ''}</legend><div class="check-grid kid-picks">${kids.map(k => `<label class="check"><input type="checkbox" name="kid" value="${k.id}" ${k.id === childId ? 'checked' : ''}><span>${esc(k.name)}<small class="muted">${esc(secLabel(section(sch, k.sectionId)))}${parentsOf(k).length ? ` · ${parentsOf(k).length} parent login${parentsOf(k).length > 1 ? 's' : ''}` : ''}</small></span></label>`).join('')}</div></fieldset>`
        : '<p class="empty-note">This school has no students yet. Add the student first, then their parent.</p>';
    }
    box.innerHTML = html;
    $('#ap-go', d).disabled = !box.querySelector('[name=name]');
    $('#ap-err', d).textContent = '';
    box.querySelector('[name=name]')?.focus();
  };
  $$('[data-r]', d).forEach(b => b.addEventListener('click', () => { st.role = b.dataset.r; $$('[data-r]', d).forEach(x => x.setAttribute('aria-pressed', String(x === b))); paint(); }));
  f.school?.addEventListener('change', () => { st.schoolId = f.school.value; paint(); });
  paint();
  f.addEventListener('submit', e => {
    e.preventDefault();
    const err = msg => { $('#ap-err', d).textContent = msg; };
    const v = k => (f.elements[k]?.value || '').trim();
    const nm = v('name').replace(/\s+/g, ' ');
    if (nm.length < 2) { err('Enter their full name.'); f.elements.name?.focus(); return; }
    if (v('email') && f.elements.email.validity.typeMismatch) { err('That email does not look right.'); return; }
    const sch = school(st.schoolId);
    let rows = [], label = nm;
    if (st.role === 'school') {
      const { coord, pw } = addCoordinator(sch.id, nm, { email: v('email') || undefined, phone: v('phone') || undefined });
      rows = [{ name: coord.name, role: `Coordinator · ${sch.name}`, icon: 'school', login: coord.login, pw }];
    }
    if (st.role === 'teacher') {
      const ids = $$('input[name=sec]:checked', f).map(x => x.value);
      const { teacher, pw } = addTeacher(sch.id, nm, ids, { email: v('email') || undefined, phone: v('phone') || undefined });
      rows = [{ name: teacher.name, role: ids.length ? `Teacher · ${sortedSecs(sch).filter(s => ids.includes(s.id)).map(s => s.name).join(', ')}` : 'Teacher (no sections yet)', icon: 'book', login: teacher.login, pw }];
    }
    if (st.role === 'student') {
      const { student, parent, stPw, parPw } = addStudent(sch.id, v('sec'), nm, v('parent').replace(/\s+/g, ' '), { parentPhone: v('parentPhone') || undefined });
      rows = [{ name: student.name, role: `Student · ${secLabel(section(sch, student.sectionId))}`, icon: 'star', login: student.login, pw: stPw, code: student.familyCode }];
      if (parent) rows.push({ name: parent.name, role: `Parent of ${student.name.split(' ')[0]}`, icon: 'home', login: parent.login, pw: parPw });
    }
    if (st.role === 'parent') {
      const kids = $$('input[name=kid]:checked', f).map(x => x.value);
      if (!kids.length) { err('Tick the child this parent belongs to.'); return; }
      const { parent, pw } = addParent(sch.id, nm, kids, { relation: v('relation'), email: v('email') || undefined, phone: v('phone') || undefined });
      rows = [{ name: parent.name, role: `Parent of ${kids.map(id => user(id).name.split(' ')[0]).join(' and ')}`, icon: 'home', login: parent.login, pw }];
    }
    log(ctx.me.name, `added the ${ROLE_LABEL[st.role].toLowerCase()} account of ${label}`, sch.id);
    save(); d.close();
    showCreds(`${label} can log in now`, rows);
    onDone?.();
  });
}

/* ---------- The Accounts page ---------- */
const state = { q: '', role: 'all', school: '' };
export const filterAccounts = patch => Object.assign(state, patch);

export function accountsPage(ctx) {
  const admin = ctx.me.role === 'admin';
  const roles = rolesFor(ctx.me);
  const D = db();
  const people = D.users.filter(u => canManage(ctx.me, u))
    .sort((a, b) => (school(a.schoolId)?.name || '').localeCompare(school(b.schoolId)?.name || '') || ORDER[a.role] - ORDER[b.role] || a.name.localeCompare(b.name));
  if (admin && state.school && !school(state.school)) state.school = '';
  const detail = u => {
    const sch = school(u.schoolId);
    if (u.role === 'teacher') { const s = sortedSecs(sch).filter(x => (u.sectionIds || []).includes(x.id)); return s.length ? s.map(x => esc(x.name)).join(', ') : '<span class="muted">No sections</span>'; }
    if (u.role === 'student') return `${esc(secLabel(section(sch, u.sectionId)))}<small class="muted block">family code <span class="mono">${esc(u.familyCode || '')}</span></small>`;
    if (u.role === 'parent') { const k = childrenOf(u); return k.length ? `${esc(u.relation || 'Parent')} of ${k.map(x => esc(x.name)).join(', ')}` : '<span class="warn-txt">No child linked</span>'; }
    return esc(u.email || u.phone || '');
  };
  const count = r => people.filter(u => u.role === r).length;
  const schoolHref = u => u.role === 'student' && !admin ? `#/school/student/${u.id}` : null;
  return {
    title: 'Accounts', nav: 'accounts',
    html: `<div class="toolbar"><p class="muted">${admin ? 'Every coordinator, teacher, student and parent on VINC Lab.' : `The teachers, students and parents of ${esc(school(ctx.me.schoolId)?.name || 'your school')}.`} Add people, reset a password when someone is locked out, or delete an account.</p>
      <button class="btn btn-brand btn-sm" id="acc-add">${icon('plus')} Add person</button></div>
    <div class="toolbar acc-filters">
      <label class="search">${icon('eye')}<span class="sr-only">Search by name or User ID</span><input id="acc-q" placeholder="Search by name or User ID" value="${esc(state.q)}"></label>
      ${admin ? `<label class="sel"><span class="sr-only">School</span><select id="acc-school"><option value="">All schools</option>${D.schools.slice().sort((a, b) => a.name.localeCompare(b.name)).map(s => `<option value="${s.id}" ${state.school === s.id ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select></label>` : ''}
      <div class="seg-tabs" role="group" aria-label="Filter by role" id="acc-roles"><button data-r="all" aria-pressed="${state.role === 'all'}">All</button>${roles.map(r => `<button data-r="${r}" aria-pressed="${state.role === r}">${ROLE_LABEL[r]}s <small>${count(r)}</small></button>`).join('')}</div>
    </div>
    <section class="card tbl-card"><table class="tbl acc-tbl" id="acc-tbl">
      <thead><tr><th>Name</th><th>Role</th>${admin ? '<th>School</th>' : ''}<th>Details</th><th>Last login</th><th aria-label="Actions"></th></tr></thead>
      <tbody>${people.map(u => `<tr data-q="${esc(`${u.name} ${u.login} ${u.email || ''}`.toLowerCase())}" data-role="${u.role}" data-school="${u.schoolId}">
        <td>${schoolHref(u) ? `<a href="${schoolHref(u)}">${esc(u.name)}</a>` : `<b>${esc(u.name)}</b>`}<small class="muted mono block">@${esc(u.login)}${u.pwTemp ? ' · temporary password' : ''}</small></td>
        <td><span class="role-tag r-${u.role}">${icon(ROLE_ICON[u.role])} ${ROLE_LABEL[u.role]}</span></td>
        ${admin ? `<td>${esc(school(u.schoolId)?.name || '—')}</td>` : ''}
        <td>${detail(u)}</td>
        <td>${timeAgo(u.lastLogin)}</td>
        <td><div class="btn-row nowrap acc-acts"><button class="btn btn-sm btn-ghost" data-pw="${u.id}">${icon('key')} Password</button><button class="btn btn-sm btn-ghost danger" data-del="${u.id}" aria-label="Delete ${esc(u.name)}">${icon('trash')}<span class="acc-del-l"> Delete</span></button></div></td></tr>`).join('')}
        <tr class="acc-none" hidden><td colspan="${admin ? 6 : 5}" class="muted">${people.length ? 'Nobody matches these filters.' : `No accounts yet. ${admin ? 'People appear here when schools register and their teachers, students and parents join.' : 'Teachers, students and parents appear here when they join or when you add them.'}`}</td></tr>
      </tbody>
    </table><p class="muted small" id="acc-count"></p></section>`,
    mount(el) {
      const filter = () => {
        state.q = $('#acc-q', el).value.trim().toLowerCase();
        if (admin) state.school = $('#acc-school', el).value;
        let n = 0;
        $$('#acc-tbl tbody tr[data-q]', el).forEach(tr => {
          const show = tr.dataset.q.includes(state.q) && (state.role === 'all' || tr.dataset.role === state.role) && (!state.school || tr.dataset.school === state.school);
          tr.hidden = !show; if (show) n++;
        });
        $('.acc-none', el).hidden = n > 0;
        $('#acc-count', el).textContent = `${n} account${n === 1 ? '' : 's'}`;
      };
      $('#acc-q', el).addEventListener('input', filter);
      $('#acc-school', el)?.addEventListener('change', filter);
      $$('#acc-roles [data-r]', el).forEach(b => b.addEventListener('click', () => { state.role = b.dataset.r; $$('#acc-roles [data-r]', el).forEach(x => x.setAttribute('aria-pressed', String(x === b))); filter(); }));
      filter();
      $('#acc-add', el).addEventListener('click', () => addPersonModal(ctx, { schoolId: state.school || null, role: state.role === 'all' ? null : state.role, onDone: () => ctx.rerender() }));
      $$('[data-pw]', el).forEach(b => b.addEventListener('click', () => passwordModal(ctx, user(b.dataset.pw), () => ctx.rerender())));
      $$('[data-del]', el).forEach(b => b.addEventListener('click', () => deleteModal(ctx, user(b.dataset.del), () => ctx.rerender())));
    },
  };
}
