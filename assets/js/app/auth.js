// Log in and create-account screens. Everyone logs in with a User ID and password; anyone can
// sign up as a student, parent, teacher or school. The VINC Lab admin is not listed here.
import { db, school, user, session, logIn, register, makeLogin, checkLogin, normLogin, lookupFamily, studioName, initials, isRemote } from './store.js';
import { $, $$, esc, icon, art, confetti, bindCopy, modal, REDUCED } from './ui.js';
import { t, langButton } from '../i18n.js';

export const ROLES = {
  student: { label: t('Student'), icon: 'star', blurb: t('I am in Grade 6, 7 or 8') },
  parent: { label: t('Parent'), icon: 'home', blurb: t('I want to follow my child\'s projects') },
  teacher: { label: t('Teacher'), icon: 'book', blurb: t('I teach Kaushal Bodh at my school') },
  school: { label: t('School'), icon: 'school', blurb: t('Register my school as its coordinator') },
};
const TITLES = {
  student: [t('Join your skill studio'), t('Your Kaushal Bodh teacher gives you the school\'s joining code.')],
  parent: [t('Follow your child\'s projects'), t('You need your child\'s family code. It is on their Profile page in VINC Lab.')],
  teacher: [t('Set up your teacher account'), t('Your Kaushal Bodh coordinator gives you the school\'s joining code.')],
  school: [t('Register your school'), t('You need the School ID that VINC Lab gave you. You become the school\'s Kaushal Bodh coordinator, and we set up Grades 6, 7 and 8 for you.')],
};
const COLORS = ['#1F6F66', '#2D5BA8', '#7A3FA0', '#B23A48', '#C26A12', '#3E7B2A', '#0F4C5C', '#8C3557'];
const EASE = 'cubic-bezier(.22, 1, .36, 1)';
const wait = ms => new Promise(r => setTimeout(r, REDUCED ? 0 : ms));

/* ---------- Field builders ---------- */
function field({ name, label, type = 'text', ic, auto, ph = '', req = true, hint = '', value = '', attrs = '', extra = '' }) {
  return `<div class="field" data-field="${name}">
    <div class="label-row"><label for="f-${name}">${label}${req ? '' : ` <small class="opt">${t('optional')}</small>`}</label>${extra}</div>
    <div class="input-ic">${ic ? icon(ic) : ''}<input id="f-${name}" name="${name}" type="${type}" ${auto ? `autocomplete="${auto}"` : ''} placeholder="${esc(ph)}" value="${esc(value)}" ${req ? 'required' : ''} aria-describedby="${hint ? `h-${name} ` : ''}e-${name}" ${attrs}></div>
    ${hint ? `<small class="hint" id="h-${name}">${hint}</small>` : ''}
    <small class="err" id="e-${name}"></small>
  </div>`;
}
function selField({ name, label, ic, options, req = true, hint = '' }) {
  return `<div class="field" data-field="${name}">
    <div class="label-row"><label for="f-${name}">${label}</label></div>
    <div class="input-ic sel">${ic ? icon(ic) : ''}<select id="f-${name}" name="${name}" ${req ? 'required' : ''} aria-describedby="${hint ? `h-${name} ` : ''}e-${name}">${options}</select></div>
    ${hint ? `<small class="hint" id="h-${name}">${hint}</small>` : ''}
    <small class="err" id="e-${name}"></small>
  </div>`;
}
function pwField({ name, label, auto, extra = '', meter = false }) {
  return `<div class="field" data-field="${name}">
    <div class="label-row"><label for="f-${name}">${label}</label>${extra}</div>
    <div class="input-ic">${icon('lock')}<input id="f-${name}" name="${name}" type="password" autocomplete="${auto}" required aria-describedby="${meter ? `m-${name} ` : ''}e-${name}"><button type="button" class="eye" data-eye aria-label="${t('Show password')}" aria-pressed="false">${icon('eye')}</button></div>
    ${meter ? `<div class="meter" id="m-${name}" data-score="0"><span class="meter-bars" aria-hidden="true"><i></i><i></i><i></i><i></i></span><small class="meter-txt">${t('Use 8 or more characters')}</small></div>` : ''}
    <small class="err" id="e-${name}"></small>
  </div>`;
}
const options = (list, sel = '') => list.map(([v, t]) => `<option value="${esc(v)}" ${v === sel ? 'selected' : ''}>${esc(t)}</option>`).join('');

export function strength(pw) {
  if (!pw) return { score: 0, label: t('Use 8 or more characters') };
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++; else if (/\d|[^A-Za-z0-9]/.test(pw) && pw.length >= 10) s += 0.5;
  if (pw.length < 8) return { score: 1, label: t(pw.length === 7 ? '{n} more character' : '{n} more characters', { n: 8 - pw.length }) };
  s = Math.max(1, Math.min(4, Math.round(s)));
  return { score: s, label: ['', t('Weak: add numbers or symbols'), t('Okay'), t('Good'), t('Strong')][s] };
}

// Shared behaviour for any form built from the helpers above.
export function bindFields(form) {
  $$('[data-eye]', form).forEach(b => b.addEventListener('click', () => {
    const inp = b.parentElement.querySelector('input');
    const show = inp.type === 'password';
    inp.type = show ? 'text' : 'password';
    b.setAttribute('aria-pressed', String(show));
    b.setAttribute('aria-label', show ? t('Hide password') : t('Show password'));
    b.innerHTML = icon(show ? 'eye-off' : 'eye');
  }));
  $$('.meter', form).forEach(m => {
    const inp = $(`#f-${m.id.slice(2)}`, form);
    inp.addEventListener('input', () => { const s = strength(inp.value); m.dataset.score = s.score; $('.meter-txt', m).textContent = s.label; });
  });
  form.addEventListener('input', e => { if (e.target.name) clearErr(form, e.target.name); });
  form.addEventListener('change', e => { if (e.target.name) clearErr(form, e.target.name); });
}
export function setErr(form, name, msg) {
  const f = form.querySelector(`[data-field="${name}"]`);
  if (!f) return false;
  f.classList.remove('invalid'); void f.offsetWidth; f.classList.add('invalid');
  $('.err', f).textContent = msg;
  const inp = f.querySelector('input, select');
  inp?.setAttribute('aria-invalid', 'true');
  inp?.focus();
  return true;
}
export function clearErr(form, name) {
  const f = form.querySelector(`[data-field="${name}"]`);
  if (!f || !f.classList.contains('invalid')) return;
  f.classList.remove('invalid');
  $('.err', f).textContent = '';
  f.querySelector('input, select')?.removeAttribute('aria-invalid');
}
export function shake(el) {
  if (REDUCED || !el) return;
  el.animate([{ translate: '0' }, { translate: '-8px' }, { translate: '7px' }, { translate: '-4px' }, { translate: '2px' }, { translate: '0' }], { duration: 420, easing: 'ease-out' });
}
// Button states: spinner while working, a tick on success.
export async function busy(btn, ok = true) {
  btn.classList.add('loading'); btn.disabled = true;
  await wait(380);
  btn.classList.remove('loading');
  if (ok) { btn.classList.add('success'); await wait(420); }
  btn.disabled = false;
}

/* ---------- Page ---------- */
let st = null;

export function renderAuth(root, { tab = 'login', role = null, code = '', onEnter }) {
  st = { tab, role: ROLES[role] ? role : null, code: role === 'school' ? String(code || '').toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 9) : '', onEnter, step: tab === 'login' ? 'login' : (ROLES[role] ? 'form' : 'role') };
  root.className = 'auth-page';
  document.documentElement.style.removeProperty('--brand');
  const s = session.get();
  const me = s && user(s.userId);
  root.innerHTML = `
  <div class="auth">
    <section class="auth-side">
      <a class="auth-logo" href="index.html" aria-label="${t('VINC Lab home')}">
        <img class="logo-l" src="assets/logo/vinc-lab-logo.svg" alt="VINC Lab" width="180" height="40">
        <img class="logo-d" src="assets/logo/vinc-lab-logo-dark.svg" alt="VINC Lab" width="180" height="40">
      </a>
      <div class="auth-stage" aria-hidden="true">
        <span class="blob b1"></span><span class="blob b2"></span><span class="blob b3"></span>
        <figure class="float-card fc1 f-life"><div class="fc-art">${art('garden')}</div><figcaption>${t('Kitchen garden')} <small>${t('Grade 6')}</small></figcaption></figure>
        <figure class="float-card fc2 f-machines"><div class="fc-art">${art('automation')}</div><figcaption>${t('Smart night light')} <small>${t('Grade 8')}</small></figcaption></figure>
        <figure class="float-card fc3 f-services"><div class="fc-art">${art('ai')}</div><figcaption>${t('AI for everyone')} <small>${t('Grade 7')}</small></figcaption></figure>
        <span class="glint g1"></span><span class="glint g2"></span><span class="glint g3"></span>
      </div>
      <div class="auth-copy">
        <p class="eyebrow">${t('Kaushal Bodh · Grades 6 to 8')}</p>
        <h2>${t('Learn by making. See the progress in one place.')}</h2>
        <ul class="auth-points">
          <li>${icon('flask')} ${t('Projects, quizzes and portfolios for students')}</li>
          <li>${icon('home')} ${t('Scores and teacher feedback for parents')}</li>
          <li>${icon('check')} ${t('Lesson plans and one-tap marking for teachers')}</li>
        </ul>
      </div>
    </section>
    <main class="auth-main" id="auth-main">
      <div class="auth-lang">${langButton()}</div>
      ${me ? `<p class="signed-in">${icon('user')} ${t('Logged in as <b>{name}</b>. <a href="{href}">Go to your dashboard</a>', { name: esc(me.name), href: `#/${me.role}` })}</p>` : ''}
      <div class="auth-card" id="auth-card">
        <div class="auth-tabs" role="tablist" aria-label="${t('Log in or create an account')}" data-tab="${st.tab}">
          <button type="button" role="tab" id="tab-login" aria-controls="auth-body" aria-selected="${st.tab === 'login'}">${t('Log in')}</button>
          <button type="button" role="tab" id="tab-signup" aria-controls="auth-body" aria-selected="${st.tab === 'signup'}">${t('Create account')}</button>
          <span class="tab-ind" aria-hidden="true"></span>
        </div>
        <div class="auth-body" id="auth-body" role="tabpanel" aria-labelledby="tab-${st.tab}"></div>
      </div>
      <p class="auth-foot"><a href="index.html">${t('← Back to VINC Lab')}</a>${isRemote() ? '' : `<span>${t('Preview: accounts and data are saved in this browser only.')}</span>`}</p>
    </main>
  </div>`;

  $$('.auth-tabs [role=tab]', root).forEach(b => b.addEventListener('click', () => setTab(b.id === 'tab-login' ? 'login' : 'signup')));
  $('.auth-tabs', root).addEventListener('keydown', e => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const next = st.tab === 'login' ? 'signup' : 'login';
    setTab(next); $(`#tab-${next}`).focus();
  });
  // Floating project cards lean gently toward the pointer.
  const side = $('.auth-side', root);
  if (!REDUCED && matchMedia('(pointer: fine)').matches) {
    side.addEventListener('pointermove', e => {
      const r = side.getBoundingClientRect();
      side.style.setProperty('--px', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
      side.style.setProperty('--py', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
    });
    side.addEventListener('pointerleave', () => { side.style.setProperty('--px', 0); side.style.setProperty('--py', 0); });
  }
  paint(null, true);
  if (st.step === 'login') $('#f-uid')?.focus({ preventScroll: true });
}

function setTab(tab) {
  if (st.tab === tab) return;
  st.tab = tab;
  st.step = tab === 'login' ? 'login' : (st.role ? 'form' : 'role');
  const tabs = $('.auth-tabs');
  tabs.dataset.tab = tab;
  $$('[role=tab]', tabs).forEach(b => b.setAttribute('aria-selected', String(b.id === `tab-${tab}`)));
  $('#auth-body').setAttribute('aria-labelledby', `tab-${tab}`);
  try { history.replaceState(null, '', tab === 'login' ? '#/login' : `#/signup${st.role ? `/${st.role}` : ''}`); } catch { /* ignore */ }
  paint(tab === 'login' ? 'back' : 'fwd');
}

// Swap the card body: the card glides to its new height while the new pane slides in.
function paint(dir, first = false) {
  const body = $('#auth-body');
  const h0 = body.getBoundingClientRect().height;
  const html = st.step === 'login' ? loginHtml() : st.step === 'role' ? roleHtml() : st.step === 'form' ? formHtml(st.role) : doneHtml(st.user);
  body.innerHTML = `<div class="pane ${first ? 'pane-first' : dir ? `enter-${dir}` : ''}">${html}</div>`;
  const h1 = body.getBoundingClientRect().height;
  if (!first && !REDUCED && h0 && Math.abs(h1 - h0) > 2) {
    body.classList.add('morphing');
    body.animate([{ height: `${h0}px` }, { height: `${h1}px` }], { duration: 460, easing: EASE }).finished.then(() => body.classList.remove('morphing'), () => body.classList.remove('morphing'));
  }
  const pane = body.firstElementChild;
  if (st.step === 'login') bindLogin(pane);
  else if (st.step === 'role') bindRole(pane);
  else if (st.step === 'form') bindSignup(pane);
  else bindDone(pane);
}

/* ---------- Log in ---------- */
const loginHtml = () => `
  <form id="login-f" class="auth-form" novalidate>
    <div class="auth-head"><h1 class="auth-h">${t('Welcome back')}</h1><p class="muted">${t('Log in with your User ID and password.')}</p></div>
    ${field({ name: 'uid', label: t('User ID'), ic: 'user', auto: 'username', ph: t('e.g. aarav.sharma'), attrs: 'autocapitalize="none" autocorrect="off" spellcheck="false"' })}
    ${pwField({ name: 'pw', label: t('Password'), auto: 'current-password', extra: `<button type="button" class="linkish sm" id="forgot">${t('Forgot password?')}</button>` })}
    <p class="form-err" id="login-err" role="alert"></p>
    <button class="btn btn-primary btn-block btn-go" type="submit"><span class="btn-label">${t('Log in')} ${icon('arrow')}</span><span class="spinner" aria-hidden="true"></span><span class="tick" aria-hidden="true">${icon('check')}</span></button>
    <p class="switch-line">${t('New to VINC Lab?')} <button type="button" class="linkish strong" data-goto="signup">${t('Create an account')}</button></p>
  </form>`;

function bindLogin(pane) {
  const f = $('#login-f', pane);
  bindFields(f);
  $('[data-goto]', pane).addEventListener('click', () => setTab('signup'));
  $('#forgot', pane).addEventListener('click', forgot);
  f.addEventListener('submit', async e => {
    e.preventDefault();
    const err = $('#login-err', f);
    err.textContent = '';
    const btn = $('.btn-go', f);
    btn.disabled = true;
    const r = await logIn(f.uid.value, f.pw.value);
    btn.disabled = false;
    if (r.error) {
      if (!f.uid.value.trim() || !f.pw.value) setErr(f, r.field, r.error);
      else { err.textContent = r.error; $(r.field === 'uid' ? '#f-uid' : '#f-pw', f).select(); }
      shake($('#auth-card'));
      return;
    }
    await busy(btn);
    st.onEnter(r.user, { fresh: false });
  });
}

function forgot() {
  modal(`<h2>${t('Forgot your password?')}</h2>
    <p>${t('Passwords are reset by the people who run your account:')}</p>
    <ul class="plain-list">
      <li>${icon('star')} <span>${t('<b>Students and parents:</b> ask your Kaushal Bodh teacher or the school coordinator.')}</span></li>
      <li>${icon('book')} <span>${t('<b>Teachers:</b> ask your school coordinator.')}</span></li>
      <li>${icon('school')} <span>${t('<b>School coordinators:</b> ask VINC Lab.')}</span></li>
    </ul>
    <p class="muted small">${t('They will give you a temporary password. After you log in, you will be asked to choose a new one.')}</p>
    <div class="modal-actions"><button class="btn btn-primary" data-close>${t('Got it')}</button></div>`);
}

/* ---------- Sign up: choose a role ---------- */
const roleHtml = () => `
  <div class="auth-form">
    <div class="auth-head"><h1 class="auth-h">${t('Create your account')}</h1><p class="muted">${t('Who are you signing up as?')}</p></div>
    <div class="role-pick">${Object.entries(ROLES).map(([k, r], i) => `<button type="button" class="role-opt r-${k}" data-role="${k}" style="--i:${i}"><span class="ro-ic">${icon(r.icon)}</span><span class="ro-txt"><b>${r.label}</b><small>${r.blurb}</small></span><span class="ro-go">${icon('arrow')}</span></button>`).join('')}</div>
    <p class="switch-line">${t('Already have an account?')} <button type="button" class="linkish strong" data-goto="login">${t('Log in')}</button></p>
  </div>`;

function bindRole(pane) {
  $('[data-goto]', pane).addEventListener('click', () => setTab('login'));
  $$('[data-role]', pane).forEach(b => b.addEventListener('click', () => {
    st.role = b.dataset.role; st.step = 'form';
    try { history.replaceState(null, '', `#/signup/${st.role}`); } catch { /* ignore */ }
    paint('fwd');
    $('#f-name, #f-schoolCode')?.focus({ preventScroll: true });
  }));
}

/* ---------- Sign up: the form ---------- */
function formHtml(role) {
  const schools = db().schools.filter(s => s.active).sort((a, b) => a.name.localeCompare(b.name));
  const schoolOpts = options([['', t('Choose your school')], ...schools.map(s => [s.id, `${s.name}${s.city ? `, ${s.city}` : ''}`])]);
  // Students and teachers join a school that is already on VINC Lab, so the school registers first.
  const noSchools = (role === 'student' || role === 'teacher') && !schools.length
    ? `<div class="callout warn no-schools"><span class="callout-ic">${icon('school')}</span><div><b>${t('No schools have joined yet')}</b><p>${role === 'student' ? t('Your school\'s Kaushal Bodh coordinator registers the school first. Then students can join it here.') : t('Your school\'s Kaushal Bodh coordinator registers the school first. Then teachers can join it here.')}</p><button type="button" class="linkish strong" data-role-switch="school">${t('Register a school')}</button></div></div>` : '';
  const [title, sub] = TITLES[role];
  const head = `<div class="form-head"><button type="button" class="icon-btn back-btn" data-back aria-label="${t('Back: choose who you are')}">${icon('arrow')}</button><span class="role-chip r-${role}">${icon(ROLES[role].icon)} ${ROLES[role].label}</span></div>
    <div class="auth-head"><h1 class="auth-h">${title}</h1><p class="muted">${sub}</p></div>`;
  const name = (label = t('Full name'), ph = '') => field({ name: 'name', label, ic: 'user', auto: 'name', ph, attrs: 'maxlength="60"' });
  const email = (req) => field({ name: 'email', label: t('Email'), type: 'email', ic: 'mail', auto: 'email', req, attrs: 'maxlength="80"' });
  const phone = (req) => field({ name: 'phone', label: t('Mobile number'), type: 'tel', ic: 'phone', auto: 'tel', req, ph: t('10-digit mobile'), attrs: 'maxlength="15" inputmode="tel"' });
  let body = '';
  if (role === 'student') body = `${noSchools}
    ${name(t('Full name'), t('As in school records'))}
    ${selField({ name: 'schoolId', label: t('School'), ic: 'school', options: schoolOpts })}
    ${field({ name: 'code', label: t('School joining code'), ic: 'key', ph: t('e.g. GP-7KQ2'), attrs: 'maxlength="8" autocapitalize="characters" spellcheck="false" autocomplete="off"', hint: t('Your Kaushal Bodh teacher gives it to you.') })}
    ${selField({ name: 'sectionId', label: t('Class and section'), ic: 'users', options: options([['', t('Choose your school first')]]) })}
    <div class="row-2">${field({ name: 'dob', label: t('Date of birth'), type: 'date', ic: 'calendar', req: false, attrs: `max="${new Date().toISOString().slice(0, 10)}"` })}${email(false)}</div>`;
  if (role === 'parent') body = `
    ${name()}
    <div class="row-2">${selField({ name: 'relation', label: t('You are their'), ic: 'home', options: options([['Mother', t('Mother')], ['Father', t('Father')], ['Guardian', t('Guardian')]]) })}${phone(true)}</div>
    ${email(false)}
    ${field({ name: 'code', label: t('Child\'s family code'), ic: 'link', ph: t('6 letters or numbers'), attrs: 'maxlength="6" autocapitalize="characters" spellcheck="false" autocomplete="off"', hint: t('Your child finds it on their Profile page. The school can also give it to you.') })}
    <div class="found" id="kid-found" aria-live="polite"></div>`;
  if (role === 'teacher') body = `${noSchools}
    ${name()}
    ${selField({ name: 'schoolId', label: t('School'), ic: 'school', options: schoolOpts })}
    ${field({ name: 'code', label: t('School joining code'), ic: 'key', ph: t('e.g. GP-7KQ2'), attrs: 'maxlength="8" autocapitalize="characters" spellcheck="false" autocomplete="off"', hint: t('Your coordinator finds it on the Teachers page.') })}
    <fieldset class="field sec-pick" data-field="sectionIds" hidden><legend>${t('Sections you teach')} <small class="opt">${t('optional')}</small></legend><div class="pick-chips" id="sec-picks"></div><small class="hint">${t('Your coordinator can change these later.')}</small><small class="err" id="e-sectionIds"></small></fieldset>
    <div class="row-2">${email(true)}${phone(false)}</div>`;
  if (role === 'school') body = `
    ${field({ name: 'schoolCode', label: t('School ID'), ic: 'id-card', ph: t('e.g. VL-7KQ2X9'), value: st.code, attrs: 'maxlength="9" autocapitalize="characters" spellcheck="false" autocomplete="off"', hint: t('VINC Lab gives each school its own School ID. No ID yet? Write to info@vinc-lab.com.') })}
    ${field({ name: 'schoolName', label: t('School name'), ic: 'school', ph: t('e.g. Sunflower Public School'), attrs: 'maxlength="60"' })}
    <div class="row-2">${field({ name: 'city', label: t('City'), ic: 'home', auto: 'address-level2', attrs: 'maxlength="40"' })}${selField({ name: 'board', label: t('Board'), ic: 'book', options: options([['CBSE', 'CBSE'], ['State board', t('State board')], ['Other', t('Other')]]) })}</div>
    ${name(t('Your name (coordinator)'))}
    <div class="row-2">${email(true)}${phone(false)}</div>
    <fieldset class="field" data-field="color"><legend>${t('Brand colour')}</legend>
      <div class="swatches">${COLORS.map((c, i) => `<label class="sw"><input type="radio" name="color" value="${c}" ${i === 0 ? 'checked' : ''}><span style="--c:${c}" aria-label="${t('Colour {c}', { c })}"></span></label>`).join('')}</div>
      <div class="studio-preview" id="studio-pv" style="--brand:${COLORS[0]}"><span class="badge">SC</span><span><b>${t('Your Skills Studio')}</b><small>${t('What your students will see')}</small></span></div>
    </fieldset>`;
  const account = `<fieldset class="fs-login"><legend>${icon('lock')} ${t('Your login')}</legend>
    ${field({ name: 'login', label: t('User ID'), ic: 'id-card', auto: 'username', hint: t('You will log in with this. Lowercase letters, numbers and dots.'), attrs: 'autocapitalize="none" autocorrect="off" spellcheck="false" maxlength="30"' })}
    ${pwField({ name: 'password', label: t('Password'), auto: 'new-password', meter: true })}
  </fieldset>`;
  return `<form id="signup-f" class="auth-form" novalidate data-role="${role}">${head}${body}${account}
    <p class="form-err" id="signup-err" role="alert"></p>
    <button class="btn btn-primary btn-block btn-go" type="submit"><span class="btn-label">${t('Create account')} ${icon('arrow')}</span><span class="spinner" aria-hidden="true"></span><span class="tick" aria-hidden="true">${icon('check')}</span></button>
    ${isRemote() ? '' : `<p class="fine">${t('This preview keeps your details in this browser only.')}</p>`}</form>`;
}

function bindSignup(pane) {
  const f = $('#signup-f', pane);
  const role = f.dataset.role;
  bindFields(f);
  $('[data-back]', pane).addEventListener('click', () => {
    st.step = 'role';
    try { history.replaceState(null, '', '#/signup'); } catch { /* ignore */ }
    paint('back');
    $(`[data-role="${role}"]`)?.focus({ preventScroll: true });
  });

  // User ID: suggested from the name until the person edits it, with a live availability check.
  const login = f.login;
  const loginHint = $('#h-login', f);
  const baseHint = loginHint.textContent;
  let touched = false;
  // Availability is checked with the server (when there is one), after a short pause in typing.
  let seq = 0, wait = null;
  const checkLoginHint = () => {
    const v = normLogin(login.value), n = ++seq;
    loginHint.classList.remove('good', 'bad');
    clearTimeout(wait);
    if (!v) { loginHint.textContent = baseHint; return; }
    wait = setTimeout(async () => {
      const r = await checkLogin(v);
      if (n !== seq) return;
      if (!r.valid) { loginHint.textContent = t('Start with a letter; use 3 to 30 letters, numbers, dots, dashes or underscores.'); loginHint.classList.add('bad'); return; }
      if (!r.available) { loginHint.textContent = t('{v} is taken. Try adding a number.', { v }); loginHint.classList.add('bad'); return; }
      loginHint.innerHTML = `${icon('check')} ${t('{v} is available', { v: esc(v) })}`; loginHint.classList.add('good');
    }, 250);
  };
  login.addEventListener('input', () => { touched = !!login.value; login.value = login.value.toLowerCase().replace(/\s+/g, '.'); checkLoginHint(); });
  const nameInp = f.name;
  nameInp?.addEventListener('input', () => { if (!touched) { login.value = nameInp.value.trim().length > 1 ? makeLogin(nameInp.value) : ''; checkLoginHint(); } });

  // Codes are typed in capitals.
  for (const n of ['code', 'schoolCode']) if (f[n] && role !== 'parent') f[n].addEventListener('input', () => { f[n].value = f[n].value.toUpperCase().replace(/[^A-Z0-9-]/g, ''); });
  // Student: sections follow the chosen school.
  if (role === 'student') {
    const fill = () => {
      const sch = school(f.schoolId.value);
      const secs = sch ? [...sch.sections].sort((a, b) => a.grade - b.grade || a.name.localeCompare(b.name)) : [];
      f.sectionId.innerHTML = sch ? options([['', t('Choose your class')], ...secs.map(s => [s.id, t('Grade {g} · {name}', { g: s.grade, name: s.name })])]) : options([['', t('Choose your school first')]]);
      f.sectionId.disabled = !sch;
    };
    f.schoolId.addEventListener('change', fill); fill();
  }
  // Teacher: the school's sections appear as chips once a school is picked.
  if (role === 'teacher') {
    const fs = $('.sec-pick', f), box = $('#sec-picks', f);
    const fill = () => {
      const sch = school(f.schoolId.value);
      fs.hidden = !sch;
      if (!sch) { box.innerHTML = ''; return; }
      box.innerHTML = [...sch.sections].sort((a, b) => a.grade - b.grade || a.name.localeCompare(b.name)).map(s => `<label class="pick"><input type="checkbox" name="sectionIds" value="${s.id}"><span>${t('Grade {g} · {name}', { g: s.grade, name: esc(s.name) })}${s.teacherId && user(s.teacherId) ? `<small>${t('now {name}', { name: esc(user(s.teacherId).name) })}</small>` : `<small>${s.hasTeacher ? t('has a teacher') : t('no teacher yet')}</small>`}</span></label>`).join('');
    };
    f.schoolId.addEventListener('change', fill); fill();
  }
  // Parent: show whose code it is as soon as it matches.
  if (role === 'parent') {
    const found = $('#kid-found', f);
    let seq = 0;
    const look = async () => {
      f.code.value = f.code.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
      const n = ++seq;
      const kid = f.code.value.length === 6 ? await lookupFamily(f.code.value) : null;
      if (n !== seq) return;
      found.innerHTML = kid ? `<span class="found-card">${icon('check')} <span><b>${esc(kid.name)}</b><small>${t('Grade {g} · {section} · {school}', { g: kid.grade, section: esc(kid.section), school: esc(kid.school) })}</small></span></span>` : '';
    };
    f.code.addEventListener('input', look);
  }
  // School: live studio preview.
  if (role === 'school') {
    const pv = $('#studio-pv', f);
    const upd = () => {
      pv.style.setProperty('--brand', f.querySelector('input[name=color]:checked')?.value || COLORS[0]);
      const n = f.schoolName.value.trim();
      $('.badge', pv).textContent = n ? initials(n) : 'SC';
      $('b', pv).textContent = n ? studioName(n) : t('Your Skills Studio');
    };
    f.addEventListener('input', upd); f.addEventListener('change', upd);
    // Name and colour typed into the landing page's "Your school's name" preview.
    let draft = null;
    try { draft = JSON.parse(localStorage.getItem('vinclab-brand-draft') || 'null'); localStorage.removeItem('vinclab-brand-draft'); } catch { /* ignore */ }
    if (draft?.name) f.schoolName.value = draft.name;
    const sw = draft?.color && [...f.querySelectorAll('input[name=color]')].find(x => x.value.toLowerCase() === String(draft.color).toLowerCase());
    if (sw) sw.checked = true;
    upd();
  }
  $('[data-role-switch]', f)?.addEventListener('click', e => {
    st.role = e.currentTarget.dataset.roleSwitch;
    try { history.replaceState(null, '', `#/signup/${st.role}`); } catch { /* ignore */ }
    paint('fwd');
    $('#f-schoolCode')?.focus({ preventScroll: true });
  });

  f.addEventListener('submit', async e => {
    e.preventDefault();
    $('#signup-err', f).textContent = '';
    const missing = $$('[required]', f).find(x => !x.disabled && !String(x.value).trim());
    if (missing) { setErr(f, missing.name, missing.tagName === 'SELECT' ? t('Please choose one.') : t('Please fill this in.')); shake($('#auth-card')); return; }
    const badEmail = $$('input[type=email]', f).find(x => x.value && x.validity.typeMismatch);
    if (badEmail) { setErr(f, badEmail.name, t('That email does not look right.')); shake($('#auth-card')); return; }
    if (f.phone?.value && f.phone.value.replace(/\D/g, '').length < 10) { setErr(f, 'phone', t('Enter a 10-digit mobile number.')); shake($('#auth-card')); return; }
    const data = Object.fromEntries(new FormData(f));
    data.sectionIds = new FormData(f).getAll('sectionIds');
    let u;
    const go = $('.btn-go', f);
    go.disabled = true;
    try { u = await register(role, data); } catch (err) {
      go.disabled = false;
      if (!err.field || !setErr(f, err.field, err.message)) $('#signup-err', f).textContent = err.message;
      shake($('#auth-card'));
      return;
    }
    go.disabled = false;
    await busy(go);
    st.user = u; st.step = 'done';
    paint('fwd');
    confetti();
  });
}

/* ---------- Sign up: done ---------- */
const READY = {
  student: 'Your student account is ready. Keep your User ID handy:',
  parent: 'Your parent account is ready. Keep your User ID handy:',
  teacher: 'Your teacher account is ready. Keep your User ID handy:',
  school: 'Your school account is ready. Keep your User ID handy:',
};
function doneHtml(u) {
  const first = esc(u.name.split(' ')[0]);
  let extra = '';
  if (u.role === 'student') extra = `<div class="done-note">${icon('link')}<p>${t('Your family code is <code class="code">{code}</code>. Give it to your parent so they can follow your projects. You can find it later on your Profile page.', { code: esc(u.familyCode) })}</p></div>`;
  if (u.role === 'parent') { const kid = user(u.childIds[0]); const sch = school(kid?.schoolId); const sec = sch?.sections.find(s => s.id === kid?.sectionId); extra = `<div class="done-note">${icon('check')}<p>${t('Linked to <b>{name}</b>, Grade {g} · {section} at {school}.', { name: esc(kid?.name || ''), g: sec?.grade, section: esc(sec?.name || ''), school: esc(sch?.name || '') })}</p></div>`; }
  if (u.role === 'teacher') { const secs = (u.sectionIds || []).length; extra = `<div class="done-note">${icon('school')}<p>${secs ? t(secs > 1 ? 'You teach {n} sections. They are ready in your teacher portal.' : 'You teach {n} section. They are ready in your teacher portal.', { n: secs }) : t('Your coordinator will assign your sections. Until then your portal will be empty.')}</p></div>`; }
  if (u.role === 'school') { const sch = school(u.schoolId); extra = `<div class="done-note">${icon('key')}<p>${t('<b>{studio}</b> is ready with sections 6 A, 7 A and 8 A. Teachers join with the code <code class="code">{tcode}</code> and students with <code class="code">{scode}</code>. Both are on your Profile page.', { studio: esc(sch.studio), tcode: esc(sch.joinCode), scode: esc(sch.studentCode) })}</p></div>`; }
  return `<div class="signup-done">
    <svg class="done-check" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="28"/><path d="M20 33l8 8 16-17"/></svg>
    <h1 class="auth-h">${t('Welcome, {first}!', { first })}</h1>
    <p class="muted">${t(READY[u.role])}</p>
    <div class="uid-card">${icon('id-card')}<code>${esc(u.login)}</code><button type="button" class="copy-btn" data-copy="${esc(u.login)}" aria-label="${t('Copy User ID')}">${icon('copy')}</button></div>
    ${extra}
    <button class="btn btn-primary btn-block" id="enter-app" type="button">${t('Go to my dashboard')} ${icon('arrow')}</button>
  </div>`;
}
function bindDone(pane) {
  bindCopy(pane);
  const b = $('#enter-app', pane);
  b.focus({ preventScroll: true });
  b.addEventListener('click', () => st.onEnter(st.user, { fresh: true }));
}

