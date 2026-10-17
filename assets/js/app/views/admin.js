// VINC Lab admin: network overview, schools, course content and settings.
import { COURSES, GRADES, FORMS, WEIGHTS, projectById } from '../../data/courses.js';
import { db, save, reset, session, studentsOf, projectsFor, lastActive, addSchool, log, gradeOf, teachersOf, user } from '../store.js';
import { showCreds, resetFor } from './shared.js';
import { yearSummary, band } from '../scoring.js';
import { $, $$, esc, icon, art, ring, bar, timeAgo, fmtDate, toast, modal, download } from '../ui.js';

export const nav = () => [
  { path: '', label: 'Overview', icon: 'home' },
  { path: 'schools', label: 'Schools', icon: 'school' },
  { path: 'content', label: 'Course content', short: 'Content', icon: 'book' },
  { path: 'settings', label: 'Settings', icon: 'settings' },
];

export function render(ctx) {
  const [page, a] = ctx.params;
  if (page === 'schools') return schools(ctx);
  if (page === 'content') return a ? projectContent(ctx, a) : content(ctx);
  if (page === 'settings') return settings(ctx);
  return overview(ctx);
}

function schoolStats(sch) {
  const st = studentsOf(sch.id);
  const ys = st.map(s => yearSummary(db().progress[s.id], projectsFor(s)));
  const active = st.filter(s => { const t = lastActive(s.id); return t && Date.now() - t < 14 * 86400000; }).length;
  const scored = ys.filter(y => y.score != null);
  return {
    students: st.length, active,
    completion: ys.length ? Math.round(ys.reduce((n, y) => n + y.activityPct, 0) / ys.length) : 0,
    score: scored.length ? Math.round(scored.reduce((n, y) => n + y.score, 0) / scored.length) : null,
  };
}

function weeklyActivity() {
  const weeks = Array(12).fill(0); const now = Date.now();
  for (const pr of Object.values(db().progress)) for (const p of Object.values(pr)) for (const a of Object.values(p.acts)) {
    const w = Math.floor((now - a.at) / (7 * 86400000)); if (w >= 0 && w < 12) weeks[11 - w]++;
  }
  return weeks;
}

function spark(vals) {
  const max = Math.max(1, ...vals), W = 600, H = 140;
  const pts = vals.map((v, i) => [i * W / (vals.length - 1), H - 10 - v / max * (H - 30)]);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Activities completed per week, last 12 weeks">
    <path d="${d} L${W} ${H} L0 ${H} Z" class="area"/><path d="${d}" class="line"/>
    ${pts.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="4"><title>${vals[i]} activities</title></circle>`).join('')}</svg>`;
}

/* ---------- Overview ---------- */
function overview(ctx) {
  const D = db();
  const rows = D.schools.map(s => ({ s, ...schoolStats(s) }));
  const students = rows.reduce((n, r) => n + r.students, 0);
  const active = rows.reduce((n, r) => n + r.active, 0);
  const quizzes = Object.values(D.progress).reduce((n, pr) => n + Object.values(pr).reduce((m, p) => m + p.quiz.length, 0), 0);
  const wk = weeklyActivity();
  return {
    title: 'Network overview', nav: '',
    html: `<div class="kpis">
      <div class="kpi"><span>${icon('school')}</span><b>${D.schools.filter(s => s.active).length}</b><p>Active schools</p></div>
      <div class="kpi"><span>${icon('users')}</span><b>${students}</b><p>Students, Grades 6–8</p></div>
      <div class="kpi"><span>${icon('eye')}</span><b>${students ? Math.round(active / students * 100) : 0}%</b><p>Active in the last 14 days</p></div>
      <div class="kpi"><span>${icon('quiz')}</span><b>${quizzes}</b><p>Quiz attempts</p></div>
    </div>
    <section class="card"><div class="card-head"><h2 class="h-card">${icon('chart')} Activities completed per week</h2><span class="muted small">Last 12 weeks, all schools</span></div>${spark(wk)}</section>
    <div class="grade-cards">${GRADES.map(g => {
      const kids = D.users.filter(u => u.role === 'student' && gradeOf(u) === g);
      const ys = kids.map(k => yearSummary(D.progress[k.id], projectsFor(k)));
      const comp = ys.length ? Math.round(ys.reduce((n, y) => n + y.activityPct, 0) / ys.length) : 0;
      const sc = ys.filter(y => y.score != null); const avg = sc.length ? Math.round(sc.reduce((n, y) => n + y.score, 0) / sc.length) : null;
      return `<section class="card grade-card g${g}"><div class="gc-top"><span class="gnum">${g}</span><div><b>Grade ${g}</b><small class="muted">${kids.length} students · ${D.schools.reduce((n, s) => n + s.sections.filter(x => x.grade === g).length, 0)} sections</small></div></div>
        <div class="gc-row"><span>Activities</span>${bar(comp)}<b>${comp}%</b></div><div class="gc-row"><span>Avg score</span>${bar(avg)}<b>${avg == null ? '—' : `${avg}%`}</b></div></section>`;
    }).join('')}</div>
    <div class="grid-2">
      <section class="card"><h2 class="h-card">${icon('school')} Schools</h2>
        <ul class="sec-list">${rows.map(r => `<li><span class="badge sm" style="--brand:${r.s.color}">${esc(r.s.initials)}</span><div><b>${esc(r.s.name)}</b><small class="muted">${r.students} students · avg score ${r.score == null ? '—' : `${r.score}%`}</small></div>${bar(r.completion, r.s.color)}<span class="num">${r.completion}%</span></li>`).join('')}</ul>
      </section>
      <section class="card"><h2 class="h-card">${icon('bell')} Live feed</h2>
        <ul class="feed compact">${D.log.slice(0, 9).map(l => `<li><b>${esc(l.who)}</b> ${esc(l.what)} <small class="muted">· ${esc(D.schools.find(s => s.id === l.schoolId)?.name || '')} · ${timeAgo(l.at)}</small></li>`).join('')}</ul>
      </section>
    </div>`,
  };
}

/* ---------- Schools ---------- */
function schools(ctx) {
  const D = db();
  return {
    title: 'Schools', nav: 'schools',
    html: `<div class="toolbar"><p class="muted">Each school gets its own branded studio, sections and coordinator login.</p><button class="btn btn-brand btn-sm" id="add">${icon('plus')} Add school</button></div>
    <section class="card tbl-card"><table class="tbl">
      <thead><tr><th>School</th><th>City</th><th>Plan</th><th>Students</th><th>Teachers</th><th>Activities</th><th>Avg score</th><th>Status</th><th></th></tr></thead>
      <tbody>${D.schools.map(s => { const st = schoolStats(s); return `<tr>
        <td><div class="sch-cell"><span class="badge sm" style="--brand:${s.color}">${esc(s.initials)}</span><div><b>${esc(s.name)}</b><small class="muted">${esc(s.studio)}</small></div></div></td>
        <td>${esc(s.city)}</td><td>${esc(s.plan)}</td><td>${st.students}/${s.seats}</td><td>${teachersOf(s.id).length}</td>
        <td><div class="cell-bar">${bar(st.completion, s.color)}<span>${st.completion}%</span></div></td>
        <td>${st.score == null ? '—' : `${st.score}% <small class="muted">${band(st.score)}</small>`}</td>
        <td><button class="tag ${s.active ? 'ok' : 'todo'} tag-btn" data-toggle="${s.id}" aria-label="${s.active ? 'Pause' : 'Activate'} ${esc(s.name)}">${s.active ? 'Active' : 'Paused'}</button></td>
        <td><div class="btn-row nowrap"><button class="btn btn-sm btn-ghost" data-open="${s.id}">Open dashboard</button><button class="btn btn-sm linkish" data-logins="${s.id}">${icon('key')} Logins</button></div></td></tr>`; }).join('')}</tbody>
    </table></section>`,
    mount(el) {
      $$('[data-open]', el).forEach(b => b.addEventListener('click', () => {
        const coord = D.users.find(u => u.role === 'school' && u.schoolId === b.dataset.open);
        if (!coord) { toast('This school has no coordinator yet.', 'warn'); return; }
        session.set({ userId: coord.id, at: Date.now(), by: ctx.me.id });
        ctx.go('/school');
      }));
      $$('[data-logins]', el).forEach(b => b.addEventListener('click', () => {
        const s = D.schools.find(x => x.id === b.dataset.logins);
        const staff = D.users.filter(u => u.schoolId === s.id && (u.role === 'school' || u.role === 'teacher')).sort((a, c) => (a.role === 'school' ? 0 : 1) - (c.role === 'school' ? 0 : 1));
        const m = modal(`<h2>Logins at ${esc(s.name)}</h2><p class="muted">Coordinators reset passwords for their teachers, students and parents. You can reset staff passwords here.</p>
          <ul class="login-list">${staff.map(u => `<li><span class="avatar">${icon(u.role === 'school' ? 'school' : 'book')}</span><span><b>${esc(u.name)}</b><small class="muted">${u.role === 'school' ? 'Coordinator' : 'Teacher'} · <span class="mono">@${esc(u.login)}</span>${u.email ? ` · ${esc(u.email)}` : ''}</small></span><button class="btn btn-sm btn-ghost" data-reset="${u.id}">Reset password</button></li>`).join('')}</ul>
          <p class="muted small">Teacher joining code: <span class="mono">${esc(s.joinCode)}</span></p>
          <div class="modal-actions"><button class="btn btn-ghost" data-close>Close</button></div>`, { wide: true });
        $$('[data-reset]', m).forEach(r => r.addEventListener('click', () => { const u = user(r.dataset.reset); m.close(); resetFor(ctx, u, u.role === 'school' ? 'School coordinator' : 'Teacher'); }));
      }));
      $$('[data-toggle]', el).forEach(b => b.addEventListener('click', () => {
        const s = D.schools.find(x => x.id === b.dataset.toggle); s.active = !s.active;
        log(ctx.me.name, `${s.active ? 'activated' : 'paused'} ${s.name}`, s.id); save(); ctx.rerender();
      }));
      $('#add', el).addEventListener('click', () => {
        const d = modal(`<h2>Add a school</h2>
          <form id="sf" class="form-grid">
            <label>School name<input name="name" required maxlength="60"></label>
            <label>Skill studio name<input name="studio" maxlength="40" placeholder="e.g. Greenwood Skills Studio"></label>
            <label>City<input name="city" maxlength="40"></label>
            <label>Plan<select name="plan"><option>Pilot</option><option>Standard</option><option>Premium</option></select></label>
            <label>Seats<input name="seats" type="number" min="10" max="5000" value="60"></label>
            <label>Brand colour<input name="color" type="color" value="#1F6F66"></label>
            <label>Coordinator's name<input name="coord" maxlength="60" placeholder="Who runs Kaushal Bodh at the school"></label>
            <label>Coordinator's email<input name="coordEmail" type="email" maxlength="80"></label>
            <div class="modal-actions"><button type="button" class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-brand">Create school</button></div>
          </form>`);
        $('#sf', d).addEventListener('submit', e => {
          e.preventDefault(); const f = e.target;
          if (!f.name.value.trim()) return;
          const { sch: s, coord, coordPw, teacher, teacherPw } = addSchool({ name: f.name.value.trim(), studio: f.studio.value.trim(), city: f.city.value.trim(), plan: f.plan.value, seats: f.seats.value, color: f.color.value,
            coord: { name: f.coord.value.trim() || undefined, email: f.coordEmail.value.trim() || undefined } });
          log(ctx.me.name, `added ${s.name}`, s.id); save();
          d.close(); ctx.rerender();
          showCreds(`${s.name} is ready`, [
            { name: coord.name, role: 'School coordinator', icon: 'school', login: coord.login, pw: coordPw },
            { name: teacher.name, role: 'Teacher for 6 A, 7 A and 8 A', icon: 'book', login: teacher.login, pw: teacherPw },
          ], `Sections 6 A, 7 A and 8 A are set up. Teachers can also join with the code ${s.joinCode}.`);
        });
      });
    },
  };
}

/* ---------- Content ---------- */
function content(ctx) {
  return {
    title: 'Course content', nav: 'content',
    html: GRADES.map(g => { const C = COURSES[g]; const ps = C.projects; return `<section class="card g${g}"><div class="card-head"><h2 class="h-card"><span class="gnum sm">${g}</span> ${esc(C.book)}</h2><span class="tag ok">Live</span></div>
      <p class="muted">${ps.length} projects · ${ps.reduce((n, p) => n + p.activities.length, 0)} activities · ${ps.reduce((n, p) => n + p.quiz.length, 0)} quiz questions · ${ps.reduce((n, p) => n + p.viva.length, 0)} viva prompts</p>
      <div class="mini-list">${ps.map(p => `<a class="mini f-${p.form}" href="#/admin/content/${p.id}"><div class="mini-art">${art(p.art)}</div><div><b>${esc(p.title)}</b><small>${esc(FORMS[p.form].short)} · ${p.activities.length} activities · ${p.quiz.length} questions · pp. ${p.pages[0]}–${p.pages[1]}</small></div></a>`).join('')}</div>
    </section>`; }).join('') + `<p class="muted small">Assessment for every project: ${WEIGHTS.map(w => `${esc(w.label)} ${w.weight}%`).join(' · ')}.</p>`,
  };
}

function projectContent(ctx, pid) {
  const p = projectById(pid);
  if (!p) return content(ctx);
  return {
    title: p.title, nav: 'content',
    html: `<a class="back" href="#/admin/content">← Course content</a>
    <section class="proj-head f-${p.form}"><div class="ph-art">${art(p.art)}</div><div class="ph-copy"><span class="form-tag">Grade ${p.grade} · ${esc(FORMS[p.form].name)}</span><h2>${esc(p.title)}</h2><p>${esc(p.summary)}</p></div></section>
    <div class="grid-2">
      <section class="card"><h3 class="h-card">Activities</h3><ol class="plain-ol">${p.activities.map(a => `<li><b>${esc(a.title)}</b> <small class="muted">p. ${a.page}</small><br><small>${esc(a.task)}</small></li>`).join('')}</ol></section>
      <section class="card"><h3 class="h-card">Viva prompts</h3><ol class="plain-ol">${p.viva.map(v => `<li>${esc(v)}</li>`).join('')}</ol></section>
    </div>
    <section class="card"><h3 class="h-card">Question bank</h3><ol class="qbank">${p.quiz.map(q => `<li><b>${esc(q.q)}</b><ul>${q.o.map((o, i) => `<li class="${i === q.a ? 'right' : ''}">${esc(o)}${i === q.a ? ' ✓' : ''}</li>`).join('')}</ul><small class="muted">${esc(q.e)}</small></li>`).join('')}</ol></section>`,
  };
}

/* ---------- Settings ---------- */
function settings(ctx) {
  const D = db();
  const size = new Blob([JSON.stringify(D)]).size;
  return {
    title: 'Settings', nav: 'settings',
    html: `<div class="grid-2">
      <section class="card"><h2 class="h-card">${icon('settings')} Demo data</h2>
        <p>This preview keeps all data in this browser (${(size / 1024).toFixed(0)} KB used). Created ${fmtDate(D.createdAt, { day: 'numeric', month: 'short', year: 'numeric' })}.</p>
        <div class="btn-row"><button class="btn btn-ghost" id="export">${icon('download')} Export data (JSON)</button><button class="btn btn-ghost danger" id="reset">Reset demo data</button></div>
      </section>
      <section class="card"><h2 class="h-card">${icon('shield')} Going live</h2>
        <ul><li>Server-side logins (this preview checks passwords in the browser)</li><li>Parent sign-in by phone OTP</li><li>Photo storage for portfolios</li><li>CBSE-ready mark sheets per section</li></ul>
        <p class="muted small">The data shapes used here (schools, users, progress, log) map one-to-one onto the hosted version.</p>
      </section>
    </div>`,
    mount(el) {
      $('#export', el).addEventListener('click', () => download('vinclab-demo-data.json', JSON.stringify(D, null, 1), 'application/json'));
      $('#reset', el).addEventListener('click', () => {
        if (!confirm('Reset all demo data? Schools, students and marks go back to the starting sample.')) return;
        reset(); session.set({ userId: 'u_admin', at: Date.now() }); toast('Demo data reset. Demo accounts use the password vinclab123.'); ctx.go('/admin');
      });
    },
  };
}
