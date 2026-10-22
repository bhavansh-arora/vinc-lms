// Pieces shared by the school and teacher dashboards: marking, heatmaps, scorecards and class analytics.
import { WEIGHTS, VIVA_RUBRIC, OBSERVATION_RUBRIC, RUBRIC_LEVELS, LEARNING_OUTCOMES, projectById } from '../../data/courses.js';
import { db, save, school, section, progress, projectsFor, lastActive, log, user, parentsOf, syncNow, newJoinCode } from '../store.js';
import { passwordModal, deleteModal, addPersonModal } from './accounts.js';
import { projectScore, yearSummary, band } from '../scoring.js';
import { $, $$, esc, icon, art, ring, bar, timeAgo, toast, modal, credsHtml, bindCopy, PART_COLOR, FORM_COLOR } from '../ui.js';
import { t } from '../../i18n.js';

export const secLabel = s => s ? t('Grade {g} · {name}', { g: s.grade, name: s.name }) : '';
// A score band (Exemplary, Proficient…) in the page's language; band() itself stays English.
export const bandT = score => t(band(score));

/* ---------- Joining codes ----------
   Each school has two: teachers sign up with the teacher code, students with the student code. */
const CODES = {
  joinCode: { title: 'Teacher joining code', note: 'Teachers create their own account: they choose {school} and enter this code.',
    make: 'Make a new teacher joining code', ask: 'Make a new teacher joining code? The old one will stop working for new sign-ups. Accounts already made are not affected.' },
  studentCode: { title: 'Student joining code', note: 'Students create their own account: they choose {school} and enter this code.',
    make: 'Make a new student joining code', ask: 'Make a new student joining code? The old one will stop working for new sign-ups. Accounts already made are not affected.' },
};
// A card showing one of the school's codes. With renew, the coordinator can make a new one.
export function codeCard(sch, field, { renew = false, note = '' } = {}) {
  const c = CODES[field], code = sch?.[field] || '';
  if (!code) return '';
  return `<section class="card join-card"><div><h2 class="h-card">${icon('key')} ${t(c.title)}</h2><p class="muted">${note || t(c.note, { school: esc(sch.name) })}</p></div>
    <div class="big-code"><code>${esc(code)}</code><button type="button" class="btn btn-ghost btn-sm" data-copy="${esc(code)}">${icon('copy')} ${t('Copy')}</button>${renew ? `<button type="button" class="icon-btn" data-renew="${field}" aria-label="${t(c.make)}" title="${t('Make a new code')}">${icon('refresh')}</button>` : ''}</div></section>`;
}
export function bindCodeCards(el, ctx, sch) {
  bindCopy(el);
  $$('[data-renew]', el).forEach(b => b.addEventListener('click', () => {
    const field = b.dataset.renew, c = CODES[field];
    if (!confirm(t(c.ask))) return;
    sch[field] = newJoinCode(sch);
    log(ctx.me.name, `made a new ${c.title.toLowerCase()}`, sch.id); save();
    toast(t('New joining code made.')); ctx.rerender();
  }));
}

/* ---------- Logins ---------- */
export function showCreds(title, rows, note) {
  modal(`<div class="creds-head"><span class="creds-ic">${icon('key')}</span><div><h2>${esc(title)}</h2><p class="muted">${t('Here are the login details. The password is shown only this once.')}</p></div></div>
    ${credsHtml(rows, note)}
    <div class="modal-actions"><button class="btn btn-brand" data-close>${t('Done')}</button></div>`);
}
// Show login details only once the server has the new accounts. It may have changed a User ID
// (if another school already uses it) or a family code, so rows are read from the saved records (`u`).
export async function showCredsSaved(title, rows, note) {
  const r = await syncNow();
  if (!r.ok) return false;
  showCreds(title, rows.map(x => (x.u ? { ...x, login: x.u.login, ...(x.code ? { code: x.u.familyCode } : {}) } : x)), note);
  return true;
}

export const INACTIVE_DAYS = 14;

export function stats(students) {
  const prog = db().progress;
  let acts = 0, total = 0, quizzes = 0, vivaDue = 0, inactive = 0;
  const scored = [];
  for (const s of students) {
    const ids = projectsFor(s); const y = yearSummary(prog[s.id], ids);
    acts += y.actsDone; total += y.actsTotal;
    if (y.score != null) scored.push(y.score);
    for (const id of ids) {
      const pr = prog[s.id]?.[id]; if (!pr) continue;
      quizzes += pr.quiz.length;
      const sc = projectScore(pr, id);
      if (sc.done === sc.total && !pr.viva) vivaDue++;
    }
    const la = lastActive(s.id);
    if (!la || Date.now() - la > INACTIVE_DAYS * 86400000) inactive++;
  }
  return {
    students: students.length, completion: total ? Math.round(acts / total * 100) : 0, quizzes, vivaDue, inactive,
    score: scored.length ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length) : null,
  };
}

// The project a section is working on now: the first one most students have not finished.
export function currentProject(sec, kids) {
  const ids = Object.values(sec.projects);
  return ids.find(pid => {
    const P = projectById(pid);
    const done = kids.filter(k => P.activities.every(a => progress(k.id, pid)?.acts[a.n]?.done)).length;
    return done < kids.length * 0.7;
  }) || ids[ids.length - 1];
}

export function heatmap(kids, pid, studentHref) {
  const P = projectById(pid);
  if (!kids.length) return `<p class="empty-note">${t('No students in this section yet. Students join on the sign-up page by choosing your school and class.')}</p>`;
  return `<div class="heat-wrap"><table class="heat f-${P.form}">
    <thead><tr><th scope="col">${t('Student')}</th>${P.activities.map(a => `<th scope="col" title="${esc(a.title)}">${a.n}</th>`).join('')}<th scope="col">${t('Quiz')}</th><th scope="col">${t('Viva')}</th></tr></thead>
    <tbody>${kids.map(k => { const pr = progress(k.id, pid); return `<tr><th scope="row"><a href="${studentHref(k)}">${esc(k.name)}</a></th>${P.activities.map(a => `<td class="${pr?.acts[a.n]?.done ? 'on' : ''}" title="${pr?.acts[a.n]?.done ? t('{title}: done', { title: esc(a.title) }) : esc(a.title)}"><span class="sr-only">${pr?.acts[a.n]?.done ? t('done') : t('not done')}</span></td>`).join('')}<td class="num">${pr?.quiz.length ? Math.max(...pr.quiz.map(q => q.score)) : '·'}</td><td class="num">${pr?.viva ? '✓' : '·'}</td></tr>`; }).join('')}</tbody>
  </table></div>
  <p class="muted small">${t('Hover a cell to see the activity. Columns are the {n} activities of {title}.', { n: P.activities.length, title: esc(P.title) })}</p>`;
}

export function markTable(kids, pid) {
  return `<section class="card tbl-card"><table class="tbl mark-tbl">
    <thead><tr><th>${t('Student')}</th><th>${t('Activity book')}</th><th>${t('Quiz')}</th><th>${t('Portfolio')}</th><th>${t('Viva')}</th><th>${t('Observation')}</th><th>${t('Score')}</th><th></th></tr></thead>
    <tbody>${kids.map(k => { const pr = progress(k.id, pid); const sc = projectScore(pr, pid); const tag = v => v == null ? `<span class="tag todo">${t('To mark')}</span>` : `<span class="tag ok">${v}%</span>`; return `<tr>
      <td><button class="name-btn" data-mark="${k.id}" aria-label="${t('Mark {name}', { name: esc(k.name) })}">${esc(k.name)}</button></td>
      <td>${sc.done}/${sc.total}</td><td>${sc.parts.written == null ? '—' : `${sc.parts.written}%`}</td>
      <td>${t('{n} items', { n: pr?.portfolio.length || 0 })} ${pr?.portfolioScore != null ? `<span class="tag ok">${RUBRIC_LEVELS[pr.portfolioScore - 1]}</span>` : ''}</td>
      <td>${tag(sc.parts.viva)}</td><td>${tag(sc.parts.observation)}</td>
      <td><b>${sc.score == null ? '—' : `${sc.score}%`}</b></td>
      <td><button class="btn btn-sm btn-ghost" data-mark="${k.id}">${t('Mark')}</button></td></tr>`; }).join('') || `<tr><td colspan="8" class="muted">${t('No students in this section yet.')}</td></tr>`}</tbody>
  </table></section>`;
}
export const bindMark = (el, ctx, pid) => $$('[data-mark]', el).forEach(b => b.addEventListener('click', () => markModal(ctx, user(b.dataset.mark), pid)));

function rubricRows(rubric, marks, name) {
  return rubric.map(r => `<fieldset class="rub"><legend>${esc(r.label)} <small class="muted">LO ${r.lo.join(', ')}</small></legend>
    <div class="levels">${RUBRIC_LEVELS.map((l, i) => `<label><input type="radio" name="${name}-${r.key}" value="${i + 1}" ${marks?.[r.key] === i + 1 ? 'checked' : ''}><span>${i + 1}<small>${l}</small></span></label>`).join('')}</div></fieldset>`).join('');
}

export function markModal(ctx, stu, pid) {
  const P = projectById(pid);
  const pr = progress(stu.id, pid, true);
  const d = modal(`<div class="mm-head f-${P.form}"><div class="mini-art">${art(P.art)}</div><div><p class="eyebrow">${t('Grade {g} · {name}', { g: P.grade, name: esc(P.title) })}</p><h2>${esc(stu.name)}</h2></div><button class="icon-btn" data-close aria-label="${t('Close')}">${icon('close')}</button></div>
    <details class="viva-help"><summary>${icon('mic')} ${t('Viva questions to ask')}</summary><ol>${P.viva.map(v => `<li>${esc(v)}</li>`).join('')}</ol></details>
    <form id="mk">
      <h3>${t('Viva')} <small class="muted">30%</small></h3>${rubricRows(VIVA_RUBRIC, pr.viva, 'v')}
      <h3>${t('Teacher observation')} <small class="muted">20%</small></h3>${rubricRows(OBSERVATION_RUBRIC, pr.obs, 'o')}
      <h3>${t('Portfolio')} <small class="muted">10% · ${t('{n} items', { n: pr.portfolio.length })}</small></h3>${rubricRows([{ key: 'pf', label: t('Quality and range of the portfolio'), lo: [10, 18] }], { pf: pr.portfolioScore }, 'p')}
      <h3>${t('Feedback for the student and parents')}</h3>
      <textarea name="fb" rows="3" maxlength="400" placeholder="${t('One thing they did well, one thing to try next.')}"></textarea>
      <div class="modal-actions"><button type="button" class="btn btn-ghost" data-close>${t('Cancel')}</button><button class="btn btn-brand">${t('Save marks')}</button></div>
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
    save(); d.close(); toast(t('Saved marks for {name}.', { name: stu.name.split(' ')[0] })); ctx.rerender();
  });
}

export function studentDetail(ctx, s, back) {
  const sch = school(s.schoolId), sec = section(sch, s.sectionId);
  const ids = projectsFor(s); const y = yearSummary(db().progress[s.id], ids);
  const parents = parentsOf(s);
  const manage = ctx.me.role === 'school'; // coordinators add and delete; teachers only reset passwords
  return {
    title: s.name,
    html: `<a class="back" href="${back.href}">← ${esc(back.label)}</a>
    <section class="hero-card slim"><div class="hc-copy"><p class="eyebrow">${esc(secLabel(sec))} · ${t('Roll {n}', { n: s.roll })}</p><h2>${esc(s.name)}</h2><p>${parents.length > 1 ? t('Parents') : t('Parent')}: ${parents.length ? parents.map(p => esc(p.name)).join(', ') : '—'} · ${t('Last active {when}', { when: timeAgo(lastActive(s.id)) })}${y.score != null ? ` · ${t('Score so far <b>{score}%</b> ({band})', { score: y.score, band: bandT(y.score) })}` : ''}</p></div>
      <div class="hc-ring">${ring(y.activityPct, { size: 120, stroke: 12, sub: t('activities') })}</div></section>
    <div class="score-cards">${ids.map(pid => { const p = projectById(pid), sc = projectScore(progress(s.id, pid), pid); return `<section class="card f-${p.form}">
      <h3 class="h-card"><span class="form-dot"></span>${esc(p.title)}</h3>
      <ul class="parts">${WEIGHTS.map(w => `<li><div class="part-top"><b>${esc(w.label)}</b><span class="muted">${w.weight}%</span><span class="part-val">${sc.parts[w.key] == null ? t('Not yet') : `${sc.parts[w.key]}%`}</span></div>${bar(sc.parts[w.key], PART_COLOR[w.key])}</li>`).join('')}</ul>
      <p class="muted small">${t('Virtual labs: {n} of {total} played · {stars} ★', { n: Object.keys(progress(s.id, pid)?.labs || {}).length, total: p.activities.length, stars: Object.values(progress(s.id, pid)?.labs || {}).reduce((n, l) => n + l.stars, 0) })}</p>
      <div class="total-row"><span>${sc.complete ? t('Score ') : t('Score so far')}</span><b>${sc.score == null ? '—' : `${sc.score}%`}</b><span class="chip">${bandT(sc.score)}</span></div>
      <button class="btn btn-brand btn-sm" data-markp="${pid}">${t('Mark this project')}</button></section>`; }).join('')}</div>
    <section class="card logins-card"><h2 class="h-card">${icon('key')} ${t('Logins')}</h2>
      <ul class="login-list">
        <li><span class="avatar">${icon('star')}</span><span><b>${esc(s.name)}</b><small class="muted">${t('Student')} · <span class="mono">@${esc(s.login)}</span> · ${t('family code')} <span class="mono">${esc(s.familyCode || '')}</span></small></span><button class="btn btn-sm btn-ghost" data-reset="${s.id}">${icon('key')} ${t('Password')}</button></li>
        ${parents.map(p => `<li><span class="avatar">${icon('home')}</span><span><b>${esc(p.name)}</b><small class="muted">${esc(t(p.relation || 'Parent'))} · <span class="mono">@${esc(p.login)}</span>${p.phone ? ` · ${esc(p.phone)}` : ''}</small></span><span class="btn-row nowrap"><button class="btn btn-sm btn-ghost" data-reset="${p.id}">${icon('key')} ${t('Password')}</button>${manage ? `<button class="btn btn-sm btn-ghost danger" data-del="${p.id}" aria-label="${t('Delete {name}', { name: esc(p.name) })}" title="${t('Delete parent login')}">${icon('trash')}</button>` : ''}</span></li>`).join('')}
      </ul>
      <p class="muted small">${parents.length ? '' : t('No parent account yet. Parents can sign up with the family code. ')}${t('A temporary password makes them choose a new one when they next log in.')}</p>
      ${manage ? `<div class="manage-row"><button class="btn btn-sm btn-ghost" id="add-par">${icon('plus')} ${t('Add a parent')}</button><button class="btn btn-sm btn-ghost danger" data-del="${s.id}">${icon('trash')} ${t('Delete student')}</button></div>` : ''}
    </section>`,
    mount(el) {
      $$('[data-markp]', el).forEach(b => b.addEventListener('click', () => markModal(ctx, s, b.dataset.markp)));
      $$('[data-reset]', el).forEach(b => b.addEventListener('click', () => passwordModal(ctx, user(b.dataset.reset))));
      $$('[data-del]', el).forEach(b => b.addEventListener('click', () => deleteModal(ctx, user(b.dataset.del), () => { if (!user(s.id)) ctx.go(back.href.slice(1)); else ctx.rerender(); })));
      $('#add-par', el)?.addEventListener('click', () => addPersonModal(ctx, { role: 'parent', childId: s.id, onDone: () => ctx.rerender() }));
    },
  };
}

// How the class did on each quiz question (latest attempt per student that recorded answers).
export function quizAnalysis(kids, pid) {
  const P = projectById(pid);
  const right = P.quiz.map(() => 0), seen = P.quiz.map(() => 0);
  let takers = 0;
  for (const k of kids) {
    const att = [...(progress(k.id, pid)?.quiz || [])].reverse().find(q => q.answers?.length);
    if (!att) continue;
    takers++;
    for (const a of att.answers) { seen[a.q]++; if (a.ok) right[a.q]++; }
  }
  return { takers, rows: P.quiz.map((q, i) => ({ i, q: q.q, answer: q.o[q.a], pct: seen[i] ? Math.round(right[i] / seen[i] * 100) : null })) };
}

// Class averages on the viva and observation rubric criteria (1–4 scale).
export function rubricAnalysis(kids, pid) {
  const avg = (rubric, field) => rubric.map(r => {
    const vals = kids.map(k => progress(k.id, pid)?.[field]?.[r.key]).filter(v => v != null);
    return { ...r, n: vals.length, avg: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null };
  });
  return { viva: avg(VIVA_RUBRIC, 'viva'), obs: avg(OBSERVATION_RUBRIC, 'obs') };
}

export function rubricBars(rows) {
  return `<ul class="lo-bars">${rows.map(r => `<li><span>${esc(r.label)} <small class="muted">LO ${r.lo.join(', ')}</small></span>${bar(r.avg == null ? null : (r.avg / 4) * 100, r.avg == null ? 'var(--line)' : r.avg >= 3 ? 'var(--ok)' : r.avg >= 2 ? 'var(--amber)' : 'var(--bad)')}<b>${r.avg == null ? '—' : r.avg.toFixed(1)}</b></li>`).join('')}</ul>`;
}

export function quizBars(an) {
  if (!an.takers) return `<p class="muted">${t('No quiz attempts with answers yet.')}</p>`;
  const sorted = [...an.rows].sort((a, b) => (a.pct ?? 101) - (b.pct ?? 101));
  return `<ol class="q-bars">${sorted.map(r => `<li class="${r.pct != null && r.pct < 60 ? 'weak' : ''}"><div><b>Q${r.i + 1}.</b> ${esc(r.q)}<small class="muted">${t('Answer: {answer}', { answer: esc(r.answer) })}</small></div>${bar(r.pct, r.pct < 60 ? 'var(--bad)' : r.pct < 80 ? 'var(--amber)' : 'var(--ok)')}<b class="num">${r.pct == null ? '—' : `${r.pct}%`}</b></li>`).join('')}</ol>
    <p class="muted small">${t(an.takers === 1 ? '{n} student\' latest attempts. Questions under 60% are worth revisiting in class.' : '{n} students\' latest attempts. Questions under 60% are worth revisiting in class.', { n: an.takers })}</p>`;
}

export { LEARNING_OUTCOMES, FORM_COLOR };
