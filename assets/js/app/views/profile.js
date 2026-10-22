// Profile page for every role: details, User ID, password, and the codes that link accounts
// (a student's family code, a school's teacher joining code, a parent's linked children).
import { save, school, section, childrenOf, parentsOf, sectionsOf, updateProfile, changePassword, linkChildByCode, newFamilyCode, checkLogin, normLogin, log, syncNow, isRemote } from '../store.js';
import { $, $$, esc, icon, toast, fmtDate, timeAgo, bindCopy } from '../ui.js';
import { bindFields, setErr, shake, busy, strength } from '../auth.js';
import { codeCard, bindCodeCards } from './shared.js';
import { t, isHi } from '../../i18n.js';

const ROLE = { student: t('Student'), parent: t('Parent'), teacher: t('Teacher'), school: t('School coordinator'), admin: t('VINC Lab admin') };
const secName = s => s ? t('Grade {g} · {name}', { g: s.grade, name: s.name }) : '';
const RELATIONS = ['Mother', 'Father', 'Guardian', 'Parent'];
// A parent's relation as a word inside a sentence: 'mother' in English.
const relWord = r => (isHi() ? (RELATIONS.includes(r) ? t(r) : r) : r.toLowerCase());

const inp = ({ name, label, value = '', type = 'text', ic, req = false, hint = '', attrs = '' }) => `
  <div class="field" data-field="${name}">
    <div class="label-row"><label for="f-${name}">${label}${req ? '' : ` <small class="opt">${t('optional')}</small>`}</label></div>
    <div class="input-ic">${ic ? icon(ic) : ''}<input id="f-${name}" name="${name}" type="${type}" value="${esc(value)}" ${req ? 'required' : ''} aria-describedby="${hint ? `h-${name} ` : ''}e-${name}" ${attrs}></div>
    ${hint ? `<small class="hint" id="h-${name}">${hint}</small>` : ''}<small class="err" id="e-${name}"></small>
  </div>`;
const pw = (name, label, auto, meter = false) => `
  <div class="field" data-field="${name}">
    <div class="label-row"><label for="f-${name}">${label}</label></div>
    <div class="input-ic">${icon('lock')}<input id="f-${name}" name="${name}" type="password" autocomplete="${auto}" required aria-describedby="${meter ? `m-${name} ` : ''}e-${name}"><button type="button" class="eye" data-eye aria-label="${t('Show password')}" aria-pressed="false">${icon('eye')}</button></div>
    ${meter ? `<div class="meter" id="m-${name}" data-score="0"><span class="meter-bars" aria-hidden="true"><i></i><i></i><i></i><i></i></span><small class="meter-txt">${t('Use 8 or more characters')}</small></div>` : ''}
    <small class="err" id="e-${name}"></small>
  </div>`;

export function render(ctx) {
  const me = ctx.me;
  const sch = school(me.schoolId);
  const sec = me.role === 'student' ? section(sch, me.sectionId) : null;
  const where = me.role === 'student' ? `${secName(sec)} · ${sch?.name || ''}` : me.role === 'admin' ? 'VINC Lab' : sch?.name || '';
  const extra = {
    student: `${inp({ name: 'dob', label: t('Date of birth'), type: 'date', value: me.dob || '', ic: 'calendar', attrs: `max="${new Date().toISOString().slice(0, 10)}"` })}`,
    parent: `<div class="field" data-field="relation"><div class="label-row"><label for="f-relation">${t('You are their')}</label></div><div class="input-ic sel">${icon('home')}<select id="f-relation" name="relation">${RELATIONS.map(r => `<option value="${r}" ${me.relation === r ? 'selected' : ''}>${t(r)}</option>`).join('')}</select></div><small class="err" id="e-relation"></small></div>`,
    teacher: inp({ name: 'title', label: t('Job title'), value: me.title || '', ic: 'book', attrs: 'maxlength="60"' }),
    school: inp({ name: 'title', label: t('Job title'), value: me.title || '', ic: 'school', attrs: 'maxlength="60"' }),
    admin: inp({ name: 'title', label: t('Job title'), value: me.title || '', ic: 'settings', attrs: 'maxlength="60"' }),
  }[me.role];

  return {
    title: t('My profile'), nav: 'profile',
    html: `
    ${me.pwTemp ? `<p class="callout warn" id="temp-note">${icon('alert')} <span>${t('<b>You are using a temporary password.</b> Choose your own password below to keep your account safe.')}</span></p>` : ''}
    <section class="hero-card profile-hero">
      <span class="avatar xl">${esc(me.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase())}</span>
      <div class="hc-copy">
        <p class="eyebrow">${esc(ROLE[me.role])}${where ? ` · ${esc(where)}` : ''}</p>
        <h2>${esc(me.name)}</h2>
        <div class="chips">
          <span class="chip id-chip">${icon('id-card')} ${esc(me.login)} <button type="button" class="copy-btn sm" data-copy="${esc(me.login)}" aria-label="${t('Copy User ID')}">${icon('copy')}</button></span>
          ${me.createdAt ? `<span class="chip">${t('Joined {date}', { date: fmtDate(me.createdAt, { day: 'numeric', month: 'short', year: 'numeric' }) })}</span>` : ''}
          ${me.lastLogin ? `<span class="chip">${t('Last login {when}', { when: timeAgo(me.lastLogin) })}</span>` : ''}
        </div>
      </div>
    </section>
    <div class="grid-2 profile-grid">
      <section class="card">
        <h2 class="h-card">${icon('user')} ${t('Your details')}</h2>
        <form id="pf-details" class="form-grid" novalidate>
          ${inp({ name: 'name', label: t('Full name'), value: me.name, ic: 'user', req: true, attrs: 'maxlength="60" autocomplete="name"' })}
          ${inp({ name: 'login', label: t('User ID'), value: me.login, ic: 'id-card', req: true, hint: t('You log in with this.'), attrs: 'maxlength="30" autocapitalize="none" spellcheck="false" autocomplete="username"' })}
          <div class="row-2">
            ${inp({ name: 'email', label: t('Email'), type: 'email', value: me.email || '', ic: 'mail', attrs: 'maxlength="80" autocomplete="email"' })}
            ${inp({ name: 'phone', label: t('Mobile'), type: 'tel', value: me.phone || '', ic: 'phone', attrs: 'maxlength="15" autocomplete="tel" inputmode="tel"' })}
          </div>
          ${extra}
          <div class="form-actions"><button class="btn btn-brand btn-go" type="submit"><span class="btn-label">${t('Save details')}</span><span class="spinner" aria-hidden="true"></span><span class="tick" aria-hidden="true">${icon('check')}</span></button></div>
        </form>
      </section>
      <section class="card ${me.pwTemp ? 'attention' : ''}" id="pw-card">
        <h2 class="h-card">${icon('lock')} ${t('Password')}</h2>
        <form id="pf-pw" class="form-grid" novalidate>
          ${pw('current', me.pwTemp ? t('Temporary password') : t('Current password'), 'current-password')}
          ${pw('next', t('New password'), 'new-password', true)}
          <input type="text" name="username" value="${esc(me.login)}" autocomplete="username" hidden>
          <div class="form-actions"><button class="btn btn-brand btn-go" type="submit"><span class="btn-label">${t('Change password')}</span><span class="spinner" aria-hidden="true"></span><span class="tick" aria-hidden="true">${icon('check')}</span></button></div>
        </form>
      </section>
      ${roleCard(me, sch)}
    </div>`,
    mount(el) {
      bindCopy(el);
      const df = $('#pf-details', el);
      bindFields(df);
      const hint = $('#h-login', df);
      let seq = 0;
      df.login.addEventListener('input', async () => {
        df.login.value = df.login.value.toLowerCase().replace(/\s+/g, '.');
        const v = normLogin(df.login.value), n = ++seq;
        hint.classList.remove('good', 'bad');
        if (v === me.login) { hint.textContent = t('You log in with this.'); return; }
        const r = await checkLogin(v, me);
        if (n !== seq) return; // a newer keystroke is being checked
        if (!r.valid) { hint.textContent = t('Start with a letter; 3 to 30 letters, numbers, dots, dashes or underscores.'); hint.classList.add('bad'); }
        else if (!r.available) { hint.textContent = t('{v} is taken.', { v }); hint.classList.add('bad'); }
        else { hint.innerHTML = `${icon('check')} ${t('{v} is available', { v: esc(v) })}`; hint.classList.add('good'); }
      });
      df.addEventListener('submit', async e => {
        e.preventDefault();
        const bad = $$('input[type=email]', df).find(x => x.value && x.validity.typeMismatch);
        if (bad) { setErr(df, bad.name, t('That email does not look right.')); shake(df); return; }
        if (df.phone.value && df.phone.value.replace(/\D/g, '').length < 10) { setErr(df, 'phone', t('Enter a 10-digit mobile number.')); shake(df); return; }
        const data = Object.fromEntries(new FormData(df));
        try { updateProfile(me, data); } catch (err) { if (!setErr(df, err.field, err.message)) toast(err.message, 'bad'); shake(df); return; }
        const r = await syncNow();
        const bad2 = r.errors.find(x => !x.id || x.id === me.id);
        if (bad2) { if (!setErr(df, bad2.field, bad2.message)) toast(bad2.message, 'bad'); shake(df); return; }
        await busy($('.btn-go', df));
        toast(t('Your details are saved.'));
        ctx.rerender();
      });

      const pf = $('#pf-pw', el);
      bindFields(pf);
      pf.addEventListener('submit', async e => {
        e.preventDefault();
        if (!pf.current.value) { setErr(pf, 'current', t('Enter your current password.')); shake(pf); return; }
        if (pf.next.value.length < 8) { setErr(pf, 'next', t('Use at least 8 characters.')); shake(pf); return; }
        if (pf.next.value === pf.current.value) { setErr(pf, 'next', t('Choose a password different from the current one.')); shake(pf); return; }
        if (strength(pf.next.value).score < 2) { setErr(pf, 'next', t('Add numbers or symbols to make it stronger.')); shake(pf); return; }
        try { await changePassword(me, pf.current.value, pf.next.value); }
        catch (err) { setErr(pf, err.field === 'next' ? 'next' : 'current', err.field === 'current' ? t('That is not your current password.') : err.message); shake(pf); return; }
        await busy($('.btn-go', pf));
        toast(t('Password changed.'));
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
      <h2 class="h-card">${icon('link')} ${t('Family code')}</h2>
      <p>${t('Your parent enters this code when they create a VINC Lab account, so they can see your projects and scores.')}</p>
      <div class="big-code"><code>${esc(me.familyCode || '')}</code><button type="button" class="btn btn-ghost btn-sm" data-copy="${esc(me.familyCode || '')}">${icon('copy')} ${t('Copy')}</button></div>
      <p class="muted small">${parents.length ? t('Linked: {names}.', { names: parents.map(p => `${esc(p.name)}${p.relation ? ` (${esc(relWord(p.relation))})` : ''}`).join(', ') }) : t('No parent is linked yet.')}</p>
      <button type="button" class="linkish" id="new-code">${icon('refresh')} ${t('Make a new code')}</button>
    </section>`;
  }
  if (me.role === 'parent') {
    const kids = childrenOf(me);
    return `<section class="card">
      <h2 class="h-card">${icon('users')} ${t('Your children')}</h2>
      <ul class="kid-list">${kids.map(k => { const s = school(k.schoolId); const sec = section(s, k.sectionId); return `<li><span class="avatar">${esc(k.name.split(' ').map(w => w[0]).join('').slice(0, 2))}</span><span><b>${esc(k.name)}</b><small class="muted">${esc(secName(sec))} · ${esc(s?.name || '')}</small></span></li>`; }).join('') || `<li class="muted">${t('No child linked yet.')}</li>`}</ul>
      <form id="link-f" class="link-form" novalidate>
        <div class="field" data-field="code"><div class="label-row"><label for="f-code">${t('Link another child')}</label></div>
          <div class="input-ic">${icon('link')}<input id="f-code" name="code" maxlength="6" placeholder="${t('Family code')}" autocapitalize="characters" autocomplete="off" spellcheck="false" aria-describedby="e-code"></div><small class="err" id="e-code"></small></div>
        <button class="btn btn-brand btn-sm" type="submit">${t('Link')}</button>
      </form>
      <p class="muted small">${t('The family code is on your child\'s Profile page in VINC Lab.')}</p>
    </section>`;
  }
  if (me.role === 'teacher') {
    const secs = sectionsOf(me);
    return `<section class="card">
      <h2 class="h-card">${icon('school')} ${t('Your sections')}</h2>
      <div class="chips">${secs.map(s => `<span class="chip">${esc(secName(s))}</span>`).join('') || `<span class="muted">${t('None yet.')}</span>`}</div>
      <p class="muted small">${t('Your Kaushal Bodh coordinator assigns sections. Share your User ID <code>{login}</code> with them.', { login: esc(me.login) })}</p>
    </section>
    ${codeCard(sch, 'studentCode', { note: t('Students choose {school} and enter this code when they create their account.', { school: esc(sch?.name || t('your school')) }) })}`;
  }
  if (me.role === 'school') {
    return `${codeCard(sch, 'joinCode', { renew: true, note: t('Teachers choose {school} and enter this code when they create their account.', { school: esc(sch?.name || t('your school')) }) })}
      ${codeCard(sch, 'studentCode', { renew: true, note: t('Students choose {school} and enter this code when they create their account.', { school: esc(sch?.name || t('your school')) }) })}
      ${sch?.regCode ? `<p class="muted small">${t('School ID: <code>{code}</code>', { code: esc(sch.regCode) })}</p>` : ''}`;
  }
  return `<section class="card">
    <h2 class="h-card">${icon('shield')} ${t('Admin access')}</h2>
    <p>${t('The admin account is not shown on the public login or sign-up screens. Log in on the normal login screen with your User ID <code>{login}</code>.', { login: esc(me.login) })}</p>
    <p class="muted small">${t('Change the default password above after your first login.')}</p>
  </section>`;
}

function bindRoleCard(el, ctx, me, sch) {
  $('#new-code', el)?.addEventListener('click', () => {
    if (!confirm(t('Make a new family code? The old one will stop working for new parent accounts.'))) return;
    me.familyCode = newFamilyCode(); save(); toast(t('New family code made.')); ctx.rerender();
  });
  if (sch && (me.role === 'school' || me.role === 'teacher')) bindCodeCards(el, ctx, sch);
  const lf = $('#link-f', el);
  if (lf) {
    bindFields(lf);
    lf.code.addEventListener('input', () => { lf.code.value = lf.code.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); });
    lf.addEventListener('submit', async e => {
      e.preventDefault();
      try {
        const kid = await linkChildByCode(me, lf.code.value);
        if (!isRemote()) { log(me.name, `linked to ${kid.name} as a parent`, kid.schoolId); save(); } // the server logs it itself
        toast(t('{name} is now linked to your account.', { name: kid.name })); ctx.rerender();
      } catch (err) { setErr(lf, 'code', err.message); shake(lf); }
    });
  }
}

