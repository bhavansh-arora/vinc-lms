// Demo data store. Everything lives in this browser's localStorage, so the preview needs no server.
// The shape mirrors what a hosted backend would hold: schools, users, per-project progress and a log.
import { GRADE6 } from '../data/grade6.js';
import { emptyProgress } from './scoring.js';

const KEY = 'vinclab:db:v1';
const SESSION = 'vinclab:session:v1';
const DAY = 86400000;

let DB = null;
let persistOk = true;

const ls = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); return true; } catch { return false; } },
  del(k) { try { localStorage.removeItem(k); } catch { /* ignore */ } },
};

export const uid = (p = 'id') => `${p}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-3)}`;

export function load() {
  const raw = ls.get(KEY);
  if (raw) { try { DB = JSON.parse(raw); if (DB?.version === 1) return DB; } catch { /* reseed */ } }
  DB = seed();
  save();
  return DB;
}
export const db = () => DB || load();

export function save() {
  persistOk = ls.set(KEY, JSON.stringify(DB));
  return persistOk;
}
export const canPersist = () => persistOk;

export function reset() { ls.del(KEY); ls.del(SESSION); DB = null; return load(); }

export const session = {
  get() { try { return JSON.parse(ls.get(SESSION) || 'null'); } catch { return null; } },
  set(s) { ls.set(SESSION, JSON.stringify(s)); },
  clear() { ls.del(SESSION); },
};

export const school = id => db().schools.find(s => s.id === id);
export const user = id => db().users.find(u => u.id === id);
export const section = (sch, secId) => sch?.sections.find(s => s.id === secId);
export const studentsOf = (schoolId, sectionId) => db().users.filter(u => u.role === 'student' && u.schoolId === schoolId && (!sectionId || u.sectionId === sectionId));
export const childrenOf = parent => (parent.childIds || []).map(user).filter(Boolean);

export function projectsFor(student) {
  const sec = section(school(student.schoolId), student.sectionId);
  const pl = sec?.projects || {};
  return ['life', 'machines', 'services'].map(f => pl[f]).filter(Boolean);
}

export function progress(studentId, projectId, create = false) {
  const all = db().progress;
  if (!all[studentId]) { if (!create) return null; all[studentId] = {}; }
  if (!all[studentId][projectId]) { if (!create) return null; all[studentId][projectId] = emptyProgress(); }
  return all[studentId][projectId];
}

export function log(who, what, schoolId) {
  const d = db();
  d.log.unshift({ at: Date.now(), who, what, schoolId });
  d.log.length = Math.min(d.log.length, 250);
}

export function lastActive(studentId) {
  const p = db().progress[studentId] || {};
  let t = 0;
  for (const pr of Object.values(p)) {
    for (const a of Object.values(pr.acts)) t = Math.max(t, a.at || 0);
    for (const q of pr.quiz) t = Math.max(t, q.at || 0);
    for (const f of pr.portfolio) t = Math.max(t, f.at || 0);
  }
  return t || null;
}

/* ---------------- Seed ---------------- */
function rng(seed) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

const FIRST = ['Aarav', 'Diya', 'Vihaan', 'Ananya', 'Arjun', 'Saanvi', 'Kabir', 'Myra', 'Reyansh', 'Aadhya', 'Ishaan', 'Kiara', 'Advait', 'Anika', 'Vivaan', 'Navya', 'Rohan', 'Meera', 'Atharv', 'Tara', 'Dhruv', 'Ira', 'Kian', 'Riya', 'Yash', 'Sara', 'Aryan', 'Nisha', 'Krish', 'Pari', 'Om', 'Zara', 'Neel', 'Avni', 'Shaurya', 'Kavya', 'Lakshya', 'Mahi', 'Rudra', 'Siya', 'Tanish', 'Aditi', 'Manav', 'Prisha', 'Samar', 'Jiya'];
const LAST = ['Sharma', 'Rao', 'Reddy', 'Iyer', 'Nair', 'Gowda', 'Patel', 'Menon', 'Kulkarni', 'Hegde', 'Shetty', 'Joshi', 'Das', 'Khan', 'Singh', 'Pillai', 'Bhat', 'Kamath', 'Verma', 'Naidu'];
const PARENT_FIRST = ['Priya', 'Rahul', 'Sunita', 'Vikram', 'Lakshmi', 'Anil', 'Deepa', 'Suresh', 'Kavya', 'Manoj', 'Rekha', 'Ravi'];

const NOTE_LINES = {
  g6p1: ['Our compost bin after two weeks: the worms are busy!', 'Measured our bed: 3 m by 1.5 m. Planned tomato, spinach and mint.', 'The spinach is ready for cut-and-come-again.', 'Neem spray recipe we used'],
  g6p2: ['Found a red-vented bulbul nesting near the gate', 'Sketch of a peepal leaf', 'Our register has 34 entries now'],
  g6p3: ['Catapult made from ice-cream sticks', 'Balloon car went 4.2 m!', 'Fixed a loose brake on my cycle'],
  g6p4: ['Storyboard for my game "Catch the Mango"', 'My birthday card sprite dances'],
  g6p5: ['My grandmother\'s brass lamp', 'Label for the old radio'],
  g6p6: ['Sprouts chaat for 6 people', 'Kokum sherbet: less sugar next time'],
};

function seed() {
  const r = rng(20261017);
  const pick = a => a[Math.floor(r() * a.length)];
  const now = Date.now();
  const d = { version: 1, createdAt: now, schools: [], users: [], progress: {}, log: [] };

  const SCHOOLS = [
    { id: 'sch_greenwood', name: 'Greenwood Public School', studio: 'Greenwood Skills Studio', color: '#1F6F66', city: 'Bengaluru', plan: 'Pilot', seats: 120, sections: ['6 A', '6 B'], picks: [{ life: 'g6p1', machines: 'g6p3', services: 'g6p6' }, { life: 'g6p2', machines: 'g6p4', services: 'g6p5' }] },
    { id: 'sch_sunrise', name: 'Sunrise Vidyalaya', studio: 'Sunrise Kaushal Kendra', color: '#B23A48', city: 'Mysuru', plan: 'Standard', seats: 90, sections: ['6 A', '6 B'], picks: [{ life: 'g6p1', machines: 'g6p4', services: 'g6p6' }, { life: 'g6p1', machines: 'g6p3', services: 'g6p5' }] },
    { id: 'sch_lakeview', name: 'Lakeview International School', studio: 'Lakeview Makers', color: '#2D5BA8', city: 'Bengaluru', plan: 'Standard', seats: 60, sections: ['6 Blue'], picks: [{ life: 'g6p2', machines: 'g6p3', services: 'g6p6' }] },
  ];

  d.users.push({ id: 'u_admin', role: 'admin', name: 'Neha Kapoor', title: 'VINC Lab admin', email: 'admin@vinclab.in' });

  for (const S of SCHOOLS) {
    const sch = { id: S.id, name: S.name, studio: S.studio, color: S.color, initials: initials(S.name), city: S.city, board: 'CBSE', plan: S.plan, seats: S.seats, active: true, createdAt: now - 120 * DAY, melaDate: isoDate(new Date(new Date().getFullYear() + (new Date().getMonth() > 1 ? 1 : 0), 1, 20)), sections: [] };
    const coord = { id: `u_${S.id}_coord`, role: 'school', name: S.id === 'sch_greenwood' ? 'Kavita Rao' : S.id === 'sch_sunrise' ? 'Mohan Hegde' : 'Farah Khan', title: 'Kaushal Bodh coordinator', email: `coordinator@${S.id.slice(4)}.edu.in`, schoolId: S.id };
    d.users.push(coord);
    S.sections.forEach((name, si) => {
      const sec = { id: `${S.id}_${name.replace(/\s+/g, '').toLowerCase()}`, name, grade: 6, teacherId: coord.id, projects: S.picks[si] };
      sch.sections.push(sec);
      const n = S.id === 'sch_lakeview' ? 10 : 12 + Math.floor(r() * 3);
      for (let i = 0; i < n; i++) {
        const isAarav = S.id === 'sch_greenwood' && si === 0 && i === 0;
        const first = isAarav ? 'Aarav' : pick(FIRST);
        const last = isAarav ? 'Sharma' : pick(LAST);
        const st = { id: isAarav ? 'u_aarav' : uid('stu'), role: 'student', name: `${first} ${last}`, schoolId: S.id, sectionId: sec.id, roll: i + 1, email: `${first.toLowerCase()}.${last.toLowerCase()}${i}@student.demo` };
        const par = { id: isAarav ? 'u_priya' : uid('par'), role: 'parent', name: isAarav ? 'Priya Sharma' : `${pick(PARENT_FIRST)} ${last}`, schoolId: S.id, childIds: [st.id], email: `parent.${st.email}` };
        st.parentId = par.id;
        d.users.push(st, par);
        d.progress[st.id] = seedProgress(st, sec, r, now, isAarav);
      }
    });
    d.schools.push(sch);
  }
  d.log = buildLog(d).slice(0, 120);
  return d;
}

function seedProgress(st, sec, r, now, isAarav) {
  const out = {};
  const [p1, p2] = [sec.projects.life, sec.projects.machines];
  const keen = isAarav ? 1 : 0.35 + r() * 0.65; // how far along this student is
  const P1 = GRADE6.projects.find(p => p.id === p1);
  const P2 = GRADE6.projects.find(p => p.id === p2);
  const start = now - 110 * DAY;

  const pr1 = emptyProgress();
  const n1 = isAarav ? P1.activities.length : Math.min(P1.activities.length, Math.round(P1.activities.length * (0.55 + keen * 0.5)));
  P1.activities.slice(0, n1).forEach((a, i) => { pr1.acts[a.n] = { done: true, at: start + (i * 7 + r() * 3) * DAY, note: r() > 0.3 ? reflection(a.title, r) : '' }; });
  if (n1 >= P1.activities.length - 2) {
    const tries = isAarav ? [7, 9] : [Math.round(5 + keen * 5 * r())];
    tries.forEach((sc, i) => pr1.quiz.push({ score: Math.min(10, sc), total: 10, at: start + (70 + i * 3) * DAY }));
  }
  if (isAarav || r() < keen * 0.9) pr1.viva = { process: isAarav ? 3 : lvl(r, keen), tools: isAarav ? 4 : lvl(r, keen), safety: isAarav ? 4 : lvl(r, keen), vocation: isAarav ? 3 : lvl(r, keen), reflect: isAarav ? 3 : lvl(r, keen) };
  if (isAarav || r() < keen * 0.8) pr1.obs = { lo12: isAarav ? 4 : lvl(r, keen), lo13: isAarav ? 3 : lvl(r, keen), lo14: isAarav ? 4 : lvl(r, keen), lo15: isAarav ? 3 : lvl(r, keen), lo16: isAarav ? 4 : lvl(r, keen), lo17: isAarav ? 4 : lvl(r, keen) };
  const np = isAarav ? 4 : Math.floor(keen * 5);
  for (let i = 0; i < np; i++) {
    const lines = NOTE_LINES[p1] || ['My work'];
    pr1.portfolio.push({ id: uid('pf'), kind: i % 2 ? 'note' : 'photo', art: P1.art, title: lines[i % lines.length], text: i % 2 ? 'What I did and what I learnt from it.' : '', at: start + (10 + i * 12) * DAY });
  }
  if (isAarav) {
    pr1.portfolioScore = 3;
    pr1.feedback.push({ at: now - 20 * DAY, by: 'Kavita Rao', text: 'Lovely vermicompost log, Aarav. Next time add the dates of each observation.' });
  }
  out[p1] = pr1;

  const pr2 = emptyProgress();
  const n2 = isAarav ? 2 : Math.max(0, Math.round(P2.activities.length * (keen - 0.45) * 0.9));
  P2.activities.slice(0, n2).forEach((a, i) => { pr2.acts[a.n] = { done: true, at: now - Math.max(1.2, 20 - i * 3 - r() * 1.5) * DAY, note: r() > 0.4 ? reflection(a.title, r) : '' }; });
  if (isAarav) {
    pr2.portfolio.push({ id: uid('pf'), kind: 'photo', art: P2.art, title: (NOTE_LINES[p2] || ['My toy'])[0], text: '', at: now - 3 * DAY });
    pr2.feedback.push({ at: now - 2 * DAY, by: 'Kavita Rao', text: 'Great catapult! Can you find where the fulcrum is and label it?' });
  }
  out[p2] = pr2;
  return out;
}

const lvl = (r, keen) => Math.max(1, Math.min(4, Math.round(1.5 + keen * 2 + (r() - 0.5))));
function reflection(title, r) {
  const opts = [`We did "${title}" in groups. I learnt to plan before starting.`, 'It was harder than I thought, but we finished it together.', 'I asked a lot of questions and noted the answers.', 'Next time I will measure more carefully.', 'My favourite part was using the tools myself.'];
  return opts[Math.floor(r() * opts.length)];
}

function buildLog(d) {
  const items = [];
  for (const u of d.users.filter(x => x.role === 'student')) {
    for (const [pid, pr] of Object.entries(d.progress[u.id] || {})) {
      const P = GRADE6.projects.find(p => p.id === pid);
      for (const [n, a] of Object.entries(pr.acts)) items.push({ at: a.at, who: u.name, what: `completed "${P.activities[n - 1].title}"`, schoolId: u.schoolId });
      for (const q of pr.quiz) items.push({ at: q.at, who: u.name, what: `scored ${q.score}/10 on the ${P.title} quiz`, schoolId: u.schoolId });
    }
  }
  return items.sort((a, b) => b.at - a.at);
}

export function studioName(school) {
  const words = (school || '').split(/\s+/).filter(Boolean);
  if (!words.length) return 'Skills Studio';
  const short = /^(st\.?|sri|shri|the|dr\.?|sir|new|dav|dps)$/i.test(words[0]) || words[0].length <= 3;
  return `${words.slice(0, short && words[1] ? 2 : 1).join(' ')} Skills Studio`;
}

export function initials(name) {
  return (name || '').split(/\s+/).filter(w => w && !/^(of|the|and|&)$/i.test(w)).slice(0, 2).map(w => w[0].toUpperCase()).join('') || 'S';
}
export function isoDate(d) { const z = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`; }

/* ---------------- Mutations used by the views ---------------- */
export function addSchool({ name, studio, color, city, plan, seats }) {
  const d = db();
  const id = uid('sch');
  const sch = { id, name, studio: studio || studioName(name), color: color || '#1F6F66', initials: initials(name), city: city || '', board: 'CBSE', plan: plan || 'Pilot', seats: +seats || 60, active: true, createdAt: Date.now(), melaDate: d.schools[0]?.melaDate, sections: [] };
  sch.sections.push({ id: `${id}_6a`, name: '6 A', grade: 6, teacherId: `u_${id}_coord`, projects: { life: 'g6p1', machines: 'g6p3', services: 'g6p6' } });
  d.schools.push(sch);
  d.users.push({ id: `u_${id}_coord`, role: 'school', name: 'School coordinator', title: 'Kaushal Bodh coordinator', email: `coordinator@${id}.edu.in`, schoolId: id });
  save();
  return sch;
}

export function addStudent(schoolId, sectionId, name, parentName) {
  const d = db();
  const st = { id: uid('stu'), role: 'student', name, schoolId, sectionId, roll: studentsOf(schoolId, sectionId).length + 1 };
  const par = { id: uid('par'), role: 'parent', name: parentName || `Parent of ${name.split(' ')[0]}`, schoolId, childIds: [st.id] };
  st.parentId = par.id;
  d.users.push(st, par);
  d.progress[st.id] = {};
  save();
  return st;
}

// Branded demo from the landing page: a fresh school with sample students, cloned from Greenwood's 6 A.
export function brandDemo({ name, studio, color }) {
  const d = db();
  let sch = d.schools.find(s => s.demo);
  if (!sch) {
    sch = addSchool({ name, studio, color, city: 'Your city', plan: 'Pilot', seats: 40 });
    sch.demo = true;
    const src = studentsOf('sch_greenwood', 'sch_greenwood_6a');
    src.forEach((s, i) => {
      const st = addStudent(sch.id, sch.sections[0].id, i === 0 ? 'Aarav Sharma' : s.name, i === 0 ? 'Priya Sharma' : undefined);
      d.progress[st.id] = JSON.parse(JSON.stringify(d.progress[s.id] || {}));
    });
  }
  Object.assign(sch, { name, studio: studio || sch.studio, color, initials: initials(name) });
  save();
  return sch;
}
