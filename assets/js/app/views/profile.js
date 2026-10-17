// Profile page for every role: details, User ID, password, and the codes that link accounts
// (a student's family code, a school's teacher joining code, a parent's linked children).
import { save, school, section, childrenOf, parentsOf, sectionsOf, updateProfile, checkPassword, setPassword, linkChild, newFamilyCode, newJoinCode, loginTaken, LOGIN_RULE, normLogin, log, ADMIN_CODE } from '../store.js';
import { $, $$, esc, icon, toast, fmtDate, timeAgo, bindCopy } from '../ui.js';
import { bindFields, setErr, shake, busy, strength } from '../auth.js';

const ROLE = { student: 'Student', parent: 'Parent', teacher: 'Teacher', school: 'School coordinator', admin: 'VINC Lab admin' };
const secName = s => s ? `Grade ${s.grade} · ${s.name}` : '';

const inp = ({ name, label, value = '', type = 'text', ic, req = false, hint = '', attrs = '' }) => `
  <div class="field" data-field="${name}">
    <div class="label-row"><label for="f-${name}">${label}${req ? '' : ' <small class="opt">optional</small>'}</label></div>
    <div class="input-ic">${ic ? icon(ic) : ''}<input id="f-${name}" name="${name}" type="${type}" value="${esc(value)}" ${req ? 'required' : ''} aria-describedby="${hint ? `h-${name} ` : ''}e-${name}" ${attrs}></div>
    ${hint ? `<small class="hint" id="h-${name}">${hint}</small>` : ''}<small class="err" id="e-${name}"></small>
  </div>`;
const pw = (name, label, auto, meter = false) => `
  <div class="field" data-field="${name}">
    <div class="label-row"><label for="f-${name}">${label}</label></div>
    <div class="input-ic">${icon('lock')}<input id="f-${name}" name="${name}" type="password" autocomplete="${auto}" required aria-describedby="${meter ? `m-${name} ` : ''}e-${name}"><button type="button" class="eye" data-eye aria-label="Show password" aria-pressed="false">${icon('eye')}</button></div>
    ${meter ? `<div class="meter" id="m-${name}" data-score="0"><span class="meter-bars" aria-hidden="true"><i></i><i></i><i></i><i></i></span><small class="meter-txt">Use 8 or more characters</small></div>` : ''}
    <small class="err" id="e-${name}"></small>
  </div>`;

export function render(ctx) {
  const me = ctx.me;
  const sch = school(me.schoolId);
  const sec = me.role === 'student' ? section(sch, me.sectionId) : null;
  const where = me.role === 'student' ? `${secName(sec)} · ${sch?.name || ''}` : me.role === 'admin' ? 'VINC Lab' : sch?.name || '';
  const extra = {
    student: `${inp({ name: 'dob', label: 'Date of birth', type: 'date', value: me.dob || '', ic: 'calendar', attrs: `max="${new Date().toISOString().slice(0, 10)}"` })}`,
    parent: `<div class="field" data-field="relation"><div class="label-row"><label for="f-relation">You are their</label></div><div class="input-ic sel">${icon('home')}<select id="f-relation" name="relation">${['Mother', 'Father', 'Guardian', 'Parent'].map(r => `<option ${me.relation === r ? 'selected' : ''}>${r}</option>`).join('')}</select></div><small class="err" id="e-relation"></small></div>`,
    teacher: inp({ name: 'title', label: 'Job title', value: me.title || '', ic: 'book', attrs: 'maxlength="60"' }),
    school: inp({ name: 'title', label: 'Job title', value: me.title || '', ic: 'school', attrs: 'maxlength="60"' }),
    admin: inp({ name: 'title', label: 'Job title', value: me.title || '', ic: 'settings', attrs: 'maxlength="60"' }),
  }[me.role];

  return {
    title: 'My profile', nav: 'profile',
    html: `
    ${me.pwTemp ? `<p class="callout warn" id="temp-note">${icon('alert')} <span><b>You are using a temporary password.</b> Choose your own password below to keep your account safe.</span></p>` : ''}
    <section class="hero-card profile-hero">
      <span class="avatar xl">${esc(me.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase())}</span>
      <div class="hc-copy">
        <p class="eyebrow">${esc(ROLE[me.role])}${where ? ` · ${esc(where)}` : ''}</p>
        <h2>${esc(me.name)}</h2>
        <div class="chips">
          <span class="chip id-chip">${icon('id-card')} ${esc(me.login)} <button type="button" class="copy-btn sm" data-copy="${esc(me.login)}" aria-label="Copy User ID">${icon('copy')}</button></span>
          ${me.createdAt ? `<span class="chip">Joined ${fmtDate(me.createdAt, { day: 'numeric', month: 'short', year: 'numeric' })}</span>` : ''}
          ${me.lastLogin ? `<span class="chip">Last login ${timeAgo(me.lastLogin)}</span>` : ''}
        </div>
      </div>
    </section>
    <div class="grid-2 profile-grid">
      <section class="card">
        <h2 class="h-card">${icon('user')} Your details</h2>
        <form id="pf-details" class="form-grid" novalidate>
          ${inp({ name: 'name', label: 'Full name', value: me.name, ic: 'user', req: true, attrs: 'maxlength="60" autocomplete="name"' })}
          ${inp({ name: 'login', label: 'User ID', value: me.login, ic: 'id-card', req: true, hint: 'You log in with this.', attrs: 'maxlength="30" autocapitalize="none" spellcheck="false" autocomplete="username"' })}
          <div class="row-2">
            ${inp({ name: 'email', label: 'Email', type: 'email', value: me.email || '', ic: 'mail', attrs: 'maxlength="80" autocomplete="email"' })}
            ${inp({ name: 'phone', label: 'Mobile', type: 'tel', value: me.phone || '', ic: 'phone', attrs: 'maxlength="15" autocomplete="tel" inputmode="tel"' })}
          </div>
          ${extra}
          <div class="form-actions"><button class="btn btn-brand btn-go" type="submit"><span class="btn-label">Save details</span><span class="spinner" aria-hidden="true"></span><span class="tick" aria-hidden="true">${icon('check')}</span></button></div>
        </form>
      </section>
      <section class="card ${me.pwTemp ? 'attention' : ''}" id="pw-card">
        <h2 class="h-card">${icon('lock')} Password</h2>
        <form id="pf-pw" class="form-grid" novalidate>
          ${pw('current', me.pwTemp ? 'Temporary password' : 'Current password', 'current-password')}
          ${pw('next', 'New password', 'new-password', true)}
          <input type="text" name="username" value="${esc(me.login)}" autocomplete="username" hidden>
          <div class="form-actions"><button class="btn btn-brand btn-go" type="submit"><span class="btn-label">Change password</span><span class="spinner" aria-hidden="true"></span><span class="tick" aria-hidden="true">${icon('check')}</span></button></div>
        </form>
        ${me.pw === 'demo' ? '<p class="muted small">This demo account uses the shared password <code>vinclab123</code>.</p>' : ''}
      </section>
      ${roleCard(me, sch)}
    </div>`,
    mount(el) {
      bindCopy(el);
      const df = $('#pf-details', el);
      bindFields(df);
      const hint = $('#h-login', df);
      df.login.addEventListener('input', () => {
        df.login.value = df.login.value.toLowerCase().replace(/\s+/g, '.');
        const v = normLogin(df.login.value);
        hint.classList.remove('good', 'bad');
        if (v === me.login) hint.textContent = 'You log in with this.';
        else if (!LOGIN_RULE.test(v)) { hint.textContent = 'Start with a letter; 3 to 30 letters, numbers, dots, dashes or underscores.'; hint.classList.add('bad'); }
        else if (loginTaken(v, me)) { hint.textContent = `${v} is taken.`; hint.classList.add('bad'); }
        else { hint.innerHTML = `${icon('check')} ${esc(v)} is available`; hint.classList.add('good'); }
      });
      df.addEventListener('submit', async e => {
        e.preventDefault();
        const bad = $$('input[type=email]', df).find(x => x.value && x.validity.typeMismatch);
        if (bad) { setErr(df, bad.name, 'That email does not look right.'); shake(df); return; }
        if (df.phone.value && df.phone.value.replace(/\D/g, '').length < 10) { setErr(df, 'phone', 'Enter a 10-digit mobile number.'); shake(df); return; }
        const data = Object.fromEntries(new FormData(df));
        try { updateProfile(me, data); } catch (err) { if (!setErr(df, err.field, err.message)) toast(err.message, 'bad'); shake(df); return; }
        await busy($('.btn-go', df));
        toast('Your details are saved.');
        ctx.rerender();
      });

      const pf = $('#pf-pw', el);
      bindFields(pf);
      pf.addEventListener('submit', async e => {
        e.preventDefault();
        if (!checkPassword(me, pf.current.value)) { setErr(pf, 'current', 'That is not your current password.'); shake(pf); return; }
        if (pf.next.value.length < 8) { setErr(pf, 'next', 'Use at least 8 characters.'); shake(pf); return; }
        if (pf.next.value === pf.current.value) { setErr(pf, 'next', 'Choose a password different from the current one.'); shake(pf); return; }
        if (strength(pf.next.value).score < 2) { setErr(pf, 'next', 'Add numbers or symbols to make it stronger.'); shake(pf); return; }
        setPassword(me, pf.next.value);
        save();
        await busy($('.btn-go', pf));
        toast('Password changed.');
        ctx.rerender();
      });
      if (me.pwTemp) setTimeout(() => { $('#pw-card', el)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); pf.current.focus({ preventScroll: true }); }, 500);

      bindRoleCard(el, ctx, me, sch);
    },
  };
}

function roleCard(me, sch) {
  if (me.role === 'student') {
    const parents = parentsOf(me);
    return `<section class="card code-card">
      <h2 class="h-card">${icon('link')} Family code</h2>
      <p>Your parent enters this code when they create a VINC Lab account, so they can see your projects and scores.</p>
      <div class="big-code"><code>${esc(me.familyCode || '')}</code><button type="button" class="btn btn-ghost btn-sm" data-copy="${esc(me.familyCode || '')}">${icon('copy')} Copy</button></div>
      <p class="muted small">${parents.length ? `Linked: ${parents.map(p => `${esc(p.name)}${p.relation ? ` (${esc(p.relation.toLowerCase())})` : ''}`).join(', ')}.` : 'No parent is linked yet.'}</p>
      <button type="button" class="linkish" id="new-code">${icon('refresh')} Make a new code</button>
    </section>`;
  }
  if (me.role === 'parent') {
    const kids = childrenOf(me);
    return `<section class="card">
      <h2 class="h-card">${icon('users')} Your children</h2>
      <ul class="kid-list">${kids.map(k => { const s = school(k.schoolId); const sec = section(s, k.sectionId); return `<li><span class="avatar">${esc(k.name.split(' ').map(w => w[0]).join('').slice(0, 2))}</span><span><b>${esc(k.name)}</b><small class="muted">${esc(secName(sec))} · ${esc(s?.name || '')}</small></span></li>`; }).join('') || '<li class="muted">No child linked yet.</li>'}</ul>
      <form id="link-f" class="link-form" novalidate>
        <div class="field" data-field="code"><div class="label-row"><label for="f-code">Link another child</label></div>
          <div class="input-ic">${icon('link')}<input id="f-code" name="code" maxlength="6" placeholder="Family code" autocapitalize="characters" autocomplete="off" spellcheck="false" aria-describedby="e-code"></div><small class="err" id="e-code"></small></div>
        <button class="btn btn-brand btn-sm" type="submit">Link</button>
      </form>
      <p class="muted small">The family code is on your child's Profile page in VINC Lab.</p>
    </section>`;
  }
  if (me.role === 'teacher') {
    const secs = sectionsOf(me);
    return `<section class="card">
      <h2 class="h-card">${icon('school')} Your sections</h2>
      <div class="chips">${secs.map(s => `<span class="chip">${esc(secName(s))}</span>`).join('') || '<span class="muted">None yet.</span>'}</div>
      <p class="muted small">Your Kaushal Bodh coordinator assigns sections. Share your User ID <code>${esc(me.login)}</code> with them.</p>
    </section>`;
  }
  if (me.role === 'school') {
    return `<section class="card code-card">
      <h2 class="h-card">${icon('key')} Teacher joining code</h2>
      <p>Teachers choose ${esc(sch?.name || 'your school')} and enter this code when they create their account.</p>
      <div class="big-code"><code>${esc(sch?.joinCode || '')}</code><button type="button" class="btn btn-ghost btn-sm" data-copy="${esc(sch?.joinCode || '')}">${icon('copy')} Copy</button></div>
      <button type="button" class="linkish" id="new-join">${icon('refresh')} Make a new code</button>
    </section>`;
  }
  return `<section class="card code-card">
    <h2 class="h-card">${icon('key')} Admin access code</h2>
    <p>New VINC Lab team members need this code to create an admin account.</p>
    <div class="big-code"><code>${ADMIN_CODE}</code><button type="button" class="btn btn-ghost btn-sm" data-copy="${ADMIN_CODE}">${icon('copy')} Copy</button></div>
  </section>`;
}

function bindRoleCard(el, ctx, me, sch) {
  $('#new-code', el)?.addEventListener('click', () => {
    if (!confirm('Make a new family code? The old one will stop working for new parent accounts.')) return;
    me.familyCode = newFamilyCode(); save(); toast('New family code made.'); ctx.rerender();
  });
  $('#new-join', el)?.addEventListener('click', () => {
    if (!confirm('Make a new joining code? The old one will stop working.')) return;
    sch.joinCode = newJoinCode(sch); log(ctx.me.name, 'made a new teacher joining code', sch.id); save(); toast('New joining code made.'); ctx.rerender();
  });
  const lf = $('#link-f', el);
  if (lf) {
    bindFields(lf);
    lf.code.addEventListener('input', () => { lf.code.value = lf.code.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); });
    lf.addEventListener('submit', e => {
      e.preventDefault();
      try { const kid = linkChild(me, lf.code.value); log(me.name, `linked to ${kid.name} as a parent`, kid.schoolId); save(); toast(`${kid.name} is now linked to your account.`); ctx.rerender(); }
      catch (err) { setErr(lf, 'code', err.message); shake(lf); }
    });
  }
}

