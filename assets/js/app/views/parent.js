// Parent dashboard: one child at a time; work, scores, feedback and ideas for home.
import { FORMS, WEIGHTS, projectById } from '../../data/grade6.js';
import { db, school, section, childrenOf, projectsFor, lastActive } from '../store.js';
import { projectScore, nextActivity, yearSummary, band } from '../scoring.js';
import { esc, icon, art, ring, bar, fmtDate, timeAgo, daysUntil, FORM_COLOR, PART_COLOR } from '../ui.js';
import { gallery, badges } from './student.js';

export const nav = () => [
  { path: '', label: 'Overview', icon: 'home' },
  { path: 'work', label: 'Work & portfolio', short: 'Work', icon: 'folder' },
  { path: 'scores', label: 'Scores', icon: 'chart' },
  { path: 'home-ideas', label: 'Learning at home', short: 'At home', icon: 'star' },
];

export function render(ctx) {
  const kids = childrenOf(ctx.me);
  if (!kids.length) return { title: 'Overview', html: '<div class="empty"><p>No child is linked to this account yet. Ask the school to link your child.</p></div>' };
  const kid = kids[0];
  const page = ctx.params[0] || '';
  const data = gather(kid);
  if (page === 'work') return work(kid, data);
  if (page === 'scores') return scores(kid, data);
  if (page === 'home-ideas') return homeIdeas(kid, data);
  return overview(ctx, kid, data);
}

function gather(kid) {
  const ids = projectsFor(kid);
  const prog = db().progress[kid.id] || {};
  return { ids, prog, year: yearSummary(prog, ids), sch: school(kid.schoolId) };
}

function weekActs(prog, ids) {
  const since = Date.now() - 14 * 86400000;
  return ids.flatMap(id => Object.entries(prog[id]?.acts || {}).filter(([, a]) => a.at >= since).map(([n, a]) => ({ ...a, title: projectById(id).activities[n - 1].title, project: projectById(id) }))).sort((a, b) => b.at - a.at);
}

function overview(ctx, kid, { ids, prog, year, sch }) {
  const first = kid.name.split(' ')[0];
  const recent = weekActs(prog, ids);
  const fb = ids.flatMap(id => (prog[id]?.feedback || []).map(f => ({ ...f, p: projectById(id).title }))).sort((a, b) => b.at - a.at).slice(0, 3);
  const sec = section(sch, kid.sectionId);
  const bs = badges(kid).filter(b => b.got);
  const last = lastActive(kid.id);
  return {
    title: `${first}'s overview`, nav: '',
    html: `
    <section class="hero-card">
      <div class="hc-copy">
        <p class="eyebrow">${esc(sec?.name || 'Grade 6')} · ${esc(sch.name)}</p>
        <h2>Hello, ${esc(ctx.me.name.split(' ')[0])}</h2>
        <p>${esc(first)} has finished <b>${year.actsDone} of ${year.actsTotal}</b> Kaushal Bodh activities this year${year.score != null ? ` and is scoring <b>${year.score}%</b> (${band(year.score)}) so far` : ''}. Last active ${timeAgo(last)}.</p>
        <a class="btn btn-brand" href="#/parent/work">See ${esc(first)}'s work ${icon('arrow')}</a>
      </div>
      <div class="hc-ring">${ring(year.activityPct, { size: 150, stroke: 14, sub: 'of the year' })}</div>
    </section>
    <h2 class="h-sec">Projects</h2>
    <div class="ptiles">${ids.map(id => {
      const p = projectById(id), sc = projectScore(prog[id], id), nx = nextActivity(prog[id], id);
      return `<div class="ptile f-${p.form} static">
        <div class="ptile-art">${art(p.art)}</div>
        <div class="ptile-body"><span class="form-tag">${esc(FORMS[p.form].short)}</span><h3>${esc(p.title)}</h3>
          <div class="ptile-prog">${bar(sc.activityPct, FORM_COLOR[p.form])}<small>${sc.done}/${sc.total}</small></div>
          <small class="muted">${nx ? `Next: ${esc(nx.title)}` : 'All activities done'}</small></div></div>`;
    }).join('')}</div>
    <div class="grid-2">
      <section class="card"><h2 class="h-card">${icon('calendar')} Last two weeks</h2>
        ${recent.length ? `<ul class="timeline-list">${recent.map(a => `<li class="f-${a.project.form}"><span class="dot"></span><div><b>${esc(a.title)}</b><small class="muted">${esc(a.project.title)} · ${fmtDate(a.at)}</small>${a.note ? `<p>“${esc(a.note)}”</p>` : ''}</div></li>`).join('')}</ul>` : `<p class="muted">No activities in the last two weeks.</p>`}
      </section>
      <section class="card"><h2 class="h-card">${icon('bell')} Teacher feedback</h2>
        ${fb.length ? `<ul class="feed">${fb.map(f => `<li><b>${esc(f.by)}</b> <small class="muted">· ${esc(f.p)} · ${timeAgo(f.at)}</small><p>${esc(f.text)}</p></li>`).join('')}</ul>` : '<p class="muted">No feedback yet.</p>'}
        <h2 class="h-card">${icon('trophy')} Badges earned</h2>
        <div class="badges">${bs.length ? bs.map(b => `<span class="bdg got" title="${esc(b.how)}"><i>${b.emoji}</i><small>${esc(b.name)}</small></span>`).join('') : '<p class="muted">None yet.</p>'}</div>
      </section>
    </div>
    <section class="card mela-card"><div><h2 class="h-card">${icon('star')} Kaushal Mela</h2><p>The school's skill fair, where ${esc(first)} will show their projects to families. Save the date: <b>${fmtDate(new Date(`${sch.melaDate}T09:00:00`).getTime(), { day: 'numeric', month: 'long', year: 'numeric' })}</b>.</p></div><b class="mela-days">${Math.max(0, daysUntil(sch.melaDate))}<small>days to go</small></b></section>`,
  };
}

function work(kid, { ids, prog }) {
  const items = ids.flatMap(id => (prog[id]?.portfolio || []).map(x => ({ ...x, project: projectById(id).title })));
  const acts = ids.flatMap(id => Object.entries(prog[id]?.acts || {}).map(([n, a]) => ({ ...a, title: projectById(id).activities[n - 1].title, project: projectById(id) }))).sort((a, b) => b.at - a.at);
  return {
    title: 'Work & portfolio', nav: 'work',
    html: `<h2 class="h-sec">Portfolio</h2>${gallery(items, null, false)}
      <h2 class="h-sec">Activity reflections</h2>
      <section class="card"><ul class="timeline-list">${acts.map(a => `<li class="f-${a.project.form}"><span class="dot"></span><div><b>${esc(a.title)}</b><small class="muted">${esc(a.project.title)} · ${fmtDate(a.at)}</small>${a.note ? `<p>“${esc(a.note)}”</p>` : ''}</div></li>`).join('') || '<li class="muted">Nothing yet.</li>'}</ul></section>`,
  };
}

function scores(kid, { ids, prog, year }) {
  return {
    title: 'Scores', nav: 'scores',
    html: `<p class="lead-in">Kaushal Bodh is assessed through projects, not exams. Each project is marked in five parts, as suggested by CBSE.</p>
    <div class="score-cards">${ids.map(id => {
      const p = projectById(id), sc = projectScore(prog[id], id);
      return `<section class="card f-${p.form}"><h3 class="h-card"><span class="form-dot"></span>${esc(p.title)}</h3>
        <ul class="parts">${WEIGHTS.map(w => `<li><div class="part-top"><b>${esc(w.label)}</b><span class="muted">${w.weight}%</span><span class="part-val">${sc.parts[w.key] == null ? 'Not yet' : `${sc.parts[w.key]}%`}</span></div>${bar(sc.parts[w.key], PART_COLOR[w.key])}</li>`).join('')}</ul>
        <div class="total-row"><span>Score ${sc.complete ? '' : 'so far'}</span><b>${sc.score == null ? '—' : `${sc.score}%`}</b><span class="chip">${band(sc.score)}</span></div></section>`;
    }).join('')}</div>
    <section class="card"><h3 class="h-card">What the bands mean</h3><ul class="bands"><li><b>Exemplary</b> 85% and above</li><li><b>Proficient</b> 70–84%</li><li><b>Developing</b> 50–69%</li><li><b>Beginning</b> below 50%</li></ul><p class="muted small">Year score so far: <b>${year.score == null ? '—' : `${year.score}%`}</b></p></section>`,
  };
}

function homeIdeas(kid, { ids }) {
  return {
    title: 'Learning at home', nav: 'home-ideas',
    html: `<p class="lead-in">Kaushal Bodh asks children to notice where their skills matter at home (learning outcome 18). Here are simple things to try together.</p>
    <div class="score-cards">${ids.map(id => { const p = projectById(id); return `<section class="card f-${p.form}"><div class="mini-art">${art(p.art)}</div><h3 class="h-card">${esc(p.title)}</h3><ul>${p.home.map(h => `<li>${esc(h)}</li>`).join('')}</ul><p class="muted small">Talk about these jobs: ${p.careers.map(esc).join(', ')}.</p></section>`; }).join('')}</div>`,
  };
}
