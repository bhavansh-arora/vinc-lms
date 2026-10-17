// Pieces shared by the school and teacher dashboards: marking, heatmaps, scorecards and class analytics.
import { WEIGHTS, VIVA_RUBRIC, OBSERVATION_RUBRIC, RUBRIC_LEVELS, LEARNING_OUTCOMES, projectById } from '../../data/courses.js';
import { db, save, school, section, progress, projectsFor, lastActive, log, user, parentsOf, resetPassword } from '../store.js';
import { projectScore, yearSummary, band } from '../scoring.js';
import { $, $$, esc, icon, art, ring, bar, timeAgo, toast, modal, credsHtml, bindCopy, PART_COLOR, FORM_COLOR } from '../ui.js';

export const secLabel = s => s ? `Grade ${s.grade} · ${s.name}` : '';

/* ---------- Logins ---------- */
export function showCreds(title, rows, note) {
  modal(`<div class="creds-head"><span class="creds-ic">${icon('key')}</span><div><h2>${esc(title)}</h2><p class="muted">Here are the login details. The temporary password is shown only once.</p></div></div>
    ${credsHtml(rows, note)}
    <div class="modal-actions"><button class="btn btn-brand" data-close>Done</button></div>`);
}
export function resetFor(ctx, u, roleLabel) {
  if (!u || !confirm(`Reset the password for ${u.name}? Their old password will stop working.`)) return;
  const pw = resetPassword(u);
  log(ctx.me.name, `reset the password for ${u.name}`, u.schoolId);
  save();
  showCreds(`New password for ${u.name}`, [{ name: u.name, role: roleLabel, icon: 'user', login: u.login, pw }]);
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
  return `<div class="heat-wrap"><table class="heat f-${P.form}">
    <thead><tr><th scope="col">Student</th>${P.activities.map(a => `<th scope="col" title="${esc(a.title)}">${a.n}</th>`).join('')}<th scope="col">Quiz</th><th scope="col">Viva</th></tr></thead>
    <tbody>${kids.map(k => { const pr = progress(k.id, pid); return `<tr><th scope="row"><a href="${studentHref(k)}">${esc(k.name)}</a></th>${P.activities.map(a => `<td class="${pr?.acts[a.n]?.done ? 'on' : ''}" title="${esc(a.title)}${pr?.acts[a.n]?.done ? ': done' : ''}"><span class="sr-only">${pr?.acts[a.n]?.done ? 'done' : 'not done'}</span></td>`).join('')}<td class="num">${pr?.quiz.length ? Math.max(...pr.quiz.map(q => q.score)) : '·'}</td><td class="num">${pr?.viva ? '✓' : '·'}</td></tr>`; }).join('')}</tbody>
  </table></div>
  <p class="muted small">Hover a cell to see the activity. Columns are the ${P.activities.length} activities of ${esc(P.title)}.</p>`;
}

export function markTable(kids, pid) {
  return `<section class="card tbl-card"><table class="tbl mark-tbl">
    <thead><tr><th>Student</th><th>Activity book</th><th>Quiz</th><th>Portfolio</th><th>Viva</th><th>Observation</th><th>Score</th><th></th></tr></thead>
    <tbody>${kids.map(k => { const pr = progress(k.id, pid); const sc = projectScore(pr, pid); const tag = v => v == null ? '<span class="tag todo">To mark</span>' : `<span class="tag ok">${v}%</span>`; return `<tr>
      <td><button class="name-btn" data-mark="${k.id}" aria-label="Mark ${esc(k.name)}">${esc(k.name)}</button></td>
      <td>${sc.done}/${sc.total}</td><td>${sc.parts.written == null ? '—' : `${sc.parts.written}%`}</td>
      <td>${pr?.portfolio.length || 0} items ${pr?.portfolioScore != null ? `<span class="tag ok">${RUBRIC_LEVELS[pr.portfolioScore - 1]}</span>` : ''}</td>
      <td>${tag(sc.parts.viva)}</td><td>${tag(sc.parts.observation)}</td>
      <td><b>${sc.score == null ? '—' : `${sc.score}%`}</b></td>
      <td><button class="btn btn-sm btn-ghost" data-mark="${k.id}">Mark</button></td></tr>`; }).join('')}</tbody>
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
  const d = modal(`<div class="mm-head f-${P.form}"><div class="mini-art">${art(P.art)}</div><div><p class="eyebrow">Grade ${P.grade} · ${esc(P.title)}</p><h2>${esc(stu.name)}</h2></div><button class="icon-btn" data-close aria-label="Close">${icon('close')}</button></div>
    <details class="viva-help"><summary>${icon('mic')} Viva questions to ask</summary><ol>${P.viva.map(v => `<li>${esc(v)}</li>`).join('')}</ol></details>
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

export function studentDetail(ctx, s, back) {
  const sch = school(s.schoolId), sec = section(sch, s.sectionId);
  const ids = projectsFor(s); const y = yearSummary(db().progress[s.id], ids);
  const parents = parentsOf(s);
  return {
    title: s.name,
    html: `<a class="back" href="${back.href}">← ${esc(back.label)}</a>
    <section class="hero-card slim"><div class="hc-copy"><p class="eyebrow">${esc(secLabel(sec))} · Roll ${s.roll}</p><h2>${esc(s.name)}</h2><p>${parents.length > 1 ? 'Parents' : 'Parent'}: ${parents.length ? parents.map(p => esc(p.name)).join(', ') : '—'} · Last active ${timeAgo(lastActive(s.id))}${y.score != null ? ` · Score so far <b>${y.score}%</b> (${band(y.score)})` : ''}</p></div>
      <div class="hc-ring">${ring(y.activityPct, { size: 120, stroke: 12, sub: 'activities' })}</div></section>
    <div class="score-cards">${ids.map(pid => { const p = projectById(pid), sc = projectScore(progress(s.id, pid), pid); return `<section class="card f-${p.form}">
      <h3 class="h-card"><span class="form-dot"></span>${esc(p.title)}</h3>
      <ul class="parts">${WEIGHTS.map(w => `<li><div class="part-top"><b>${esc(w.label)}</b><span class="muted">${w.weight}%</span><span class="part-val">${sc.parts[w.key] == null ? 'Not yet' : `${sc.parts[w.key]}%`}</span></div>${bar(sc.parts[w.key], PART_COLOR[w.key])}</li>`).join('')}</ul>
      <p class="muted small">Virtual labs: ${Object.keys(progress(s.id, pid)?.labs || {}).length} of ${p.activities.length} played · ${Object.values(progress(s.id, pid)?.labs || {}).reduce((n, l) => n + l.stars, 0)} ★</p>
      <div class="total-row"><span>Score ${sc.complete ? '' : 'so far'}</span><b>${sc.score == null ? '—' : `${sc.score}%`}</b><span class="chip">${band(sc.score)}</span></div>
      <button class="btn btn-brand btn-sm" data-markp="${pid}">Mark this project</button></section>`; }).join('')}</div>
    <section class="card logins-card"><h2 class="h-card">${icon('key')} Logins</h2>
      <ul class="login-list">
        <li><span class="avatar">${icon('star')}</span><span><b>${esc(s.name)}</b><small class="muted">Student · <span class="mono">@${esc(s.login)}</span> · family code <span class="mono">${esc(s.familyCode || '')}</span></small></span><button class="btn btn-sm btn-ghost" data-reset="${s.id}">Reset password</button></li>
        ${parents.map(p => `<li><span class="avatar">${icon('home')}</span><span><b>${esc(p.name)}</b><small class="muted">${esc(p.relation || 'Parent')} · <span class="mono">@${esc(p.login)}</span>${p.phone ? ` · ${esc(p.phone)}` : ''}</small></span><button class="btn btn-sm btn-ghost" data-reset="${p.id}">Reset password</button></li>`).join('')}
      </ul>
      <p class="muted small">${parents.length ? '' : 'No parent account yet. Parents can sign up with the family code. '}Resetting gives a temporary password; they choose a new one when they next log in.</p>
    </section>`,
    mount(el) {
      $$('[data-markp]', el).forEach(b => b.addEventListener('click', () => markModal(ctx, s, b.dataset.markp)));
      $$('[data-reset]', el).forEach(b => b.addEventListener('click', () => { const u = user(b.dataset.reset); resetFor(ctx, u, u.role === 'student' ? 'Student' : 'Parent'); }));
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
  if (!an.takers) return '<p class="muted">No quiz attempts with answers yet.</p>';
  const sorted = [...an.rows].sort((a, b) => (a.pct ?? 101) - (b.pct ?? 101));
  return `<ol class="q-bars">${sorted.map(r => `<li class="${r.pct != null && r.pct < 60 ? 'weak' : ''}"><div><b>Q${r.i + 1}.</b> ${esc(r.q)}<small class="muted">Answer: ${esc(r.answer)}</small></div>${bar(r.pct, r.pct < 60 ? 'var(--bad)' : r.pct < 80 ? 'var(--amber)' : 'var(--ok)')}<b class="num">${r.pct == null ? '—' : `${r.pct}%`}</b></li>`).join('')}</ol>
    <p class="muted small">${an.takers} student${an.takers === 1 ? '' : 's'}' latest attempts. Questions under 60% are worth revisiting in class.</p>`;
}

export { LEARNING_OUTCOMES, FORM_COLOR };
