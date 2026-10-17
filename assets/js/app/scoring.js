// Turns a student's progress on one project into the five CBSE assessment parts and a total.
import { WEIGHTS, VIVA_RUBRIC, OBSERVATION_RUBRIC, projectById } from '../data/grade6.js';

export const PORTFOLIO_TARGET = 4;

export function band(score) {
  if (score == null) return '—';
  if (score >= 85) return 'Exemplary';
  if (score >= 70) return 'Proficient';
  if (score >= 50) return 'Developing';
  return 'Beginning';
}

const rubricPct = (marks, rubric) => {
  if (!marks) return null;
  const vals = rubric.map(r => marks[r.key]).filter(v => v != null);
  if (vals.length < rubric.length) return null;
  return Math.round(vals.reduce((s, v) => s + v, 0) / (rubric.length * 4) * 100);
};

export function emptyProgress() {
  return { acts: {}, quiz: [], viva: null, obs: null, portfolio: [], portfolioScore: null, feedback: [] };
}

export function projectScore(prog, projectId) {
  const p = projectById(projectId);
  const pr = prog || emptyProgress();
  const done = p.activities.filter(a => pr.acts[a.n]?.done).length;
  const parts = {
    written: pr.quiz.length ? Math.max(...pr.quiz.map(q => Math.round(q.score / q.total * 100))) : null,
    viva: rubricPct(pr.viva, VIVA_RUBRIC),
    book: done ? Math.round(done / p.activities.length * 100) : null,
    portfolio: pr.portfolioScore != null ? pr.portfolioScore * 25
      : (pr.portfolio.length ? Math.round(Math.min(1, pr.portfolio.length / PORTFOLIO_TARGET) * 100) : null),
    observation: rubricPct(pr.obs, OBSERVATION_RUBRIC),
  };
  let w = 0, s = 0;
  for (const k of WEIGHTS) if (parts[k.key] != null) { w += k.weight; s += k.weight * parts[k.key] / 100; }
  const complete = WEIGHTS.every(k => parts[k.key] != null) && done === p.activities.length;
  // While activities are still under way and nothing has been marked, a score would only reflect pace.
  const marked = parts.written != null || parts.viva != null || parts.observation != null || done === p.activities.length;
  return {
    parts, done, total: p.activities.length,
    activityPct: Math.round(done / p.activities.length * 100),
    score: w && marked ? Math.round(s / w * 100) : null, // normalised over the parts marked so far
    final: complete ? Math.round(s) : null,
    complete,
    portfolioProvisional: pr.portfolioScore == null,
  };
}

export function nextActivity(prog, projectId) {
  const p = projectById(projectId);
  return p.activities.find(a => !prog?.acts?.[a.n]?.done) || null;
}

export function yearSummary(progressByProject, projectIds) {
  const per = projectIds.map(id => ({ id, ...projectScore(progressByProject?.[id], id) }));
  const acts = per.reduce((s, x) => s + x.done, 0), total = per.reduce((s, x) => s + x.total, 0);
  const scored = per.filter(x => x.score != null);
  return {
    per,
    activityPct: total ? Math.round(acts / total * 100) : 0,
    actsDone: acts, actsTotal: total,
    score: scored.length ? Math.round(scored.reduce((s, x) => s + x.score, 0) / scored.length) : null,
  };
}
