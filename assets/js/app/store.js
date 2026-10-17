// Demo data store. Everything lives in this browser's localStorage, so the preview needs no server.
// The shape mirrors what a hosted backend would hold: schools, users, per-project progress and a log.
import { projectById } from '../data/courses.js';
import { emptyProgress } from './scoring.js';

const KEY = 'vinclab:db:v2';
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
  if (raw) { try { DB = JSON.parse(raw); if (DB?.version === 2) return DB; } catch { /* reseed */ } }
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
export const gradeOf = student => section(school(student.schoolId), student.sectionId)?.grade || 6;
export const teachersOf = schoolId => db().users.filter(u => u.role === 'teacher' && u.schoolId === schoolId);
// Sections a teacher looks after, ordered by grade then name.
export const sectionsOf = teacher => (school(teacher.schoolId)?.sections || []).filter(s => (teacher.sectionIds || []).includes(s.id)).sort((a, b) => a.grade - b.grade || a.name.localeCompare(b.name));

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

const FIRST = ['Diya', 'Vihaan', 'Arjun', 'Saanvi', 'Kabir', 'Myra', 'Reyansh', 'Aadhya', 'Ishaan', 'Kiara', 'Advait', 'Anika', 'Vivaan', 'Navya', 'Rohan', 'Atharv', 'Tara', 'Dhruv', 'Ira', 'Kian', 'Riya', 'Yash', 'Sara', 'Aryan', 'Nisha', 'Krish', 'Pari', 'Om', 'Zara', 'Neel', 'Avni', 'Shaurya', 'Kavya', 'Lakshya', 'Mahi', 'Rudra', 'Siya', 'Tanish', 'Aditi', 'Manav', 'Prisha', 'Samar', 'Jiya'];
const LAST = ['Rao', 'Reddy', 'Iyer', 'Nair', 'Gowda', 'Patel', 'Menon', 'Kulkarni', 'Hegde', 'Shetty', 'Joshi', 'Das', 'Khan', 'Singh', 'Pillai', 'Bhat', 'Kamath', 'Verma', 'Naidu'];
const PARENT_FIRST = ['Rahul', 'Sunita', 'Vikram', 'Lakshmi', 'Anil', 'Deepa', 'Suresh', 'Kavya', 'Manoj', 'Rekha', 'Ravi', 'Meena'];

// Default project choices: two different plans per grade so sections can differ.
const PICKS = {
  6: [{ life: 'g6p1', machines: 'g6p3', services: 'g6p6' }, { life: 'g6p2', machines: 'g6p4', services: 'g6p5' }],
  7: [{ life: 'g7p1', machines: 'g7p4', services: 'g7p6' }, { life: 'g7p2', machines: 'g7p3', services: 'g7p5' }],
  8: [{ life: 'g8p1', machines: 'g8p4', services: 'g8p5' }, { life: 'g8p2', machines: 'g8p3', services: 'g8p6' }],
};
export const defaultPicks = grade => ({ ...PICKS[grade][0] });

const NOTE_LINES = {
  g6p1: ['Our compost bin after two weeks: the worms are busy!', 'Measured our bed: 3 m by 1.5 m.', 'The spinach is ready for cut-and-come-again.', 'Neem spray recipe we used'],
  g6p2: ['Found a red-vented bulbul nesting near the gate', 'Sketch of a peepal leaf', 'Our register has 34 entries now'],
  g6p3: ['Catapult made from ice-cream sticks', 'Balloon car went 4.2 m!', 'Fixed a loose brake on my cycle'],
  g6p4: ['Storyboard for my game "Catch the Mango"', 'My birthday card sprite dances'],
  g7p1: ['Germination test: 42 of 50 seeds sprouted (84%)', 'Our shade-net frame with bamboo poles', 'Rose cuttings after three weeks', 'Cost sheet for one sapling'],
  g7p2: ['Bird bath made from an old tray', 'A sunbird visited the hibiscus!', 'Insect hotel from logs and cardboard'],
  g7p4: ['My mango classes in Teachable Machine', 'Testing the model with the webcam', 'Accuracy went up after adding 10 more photos'],
  g7p3: ['Turmeric and onion-skin dyes', 'My first Bandhani sample'],
  g8p1: ['Microgreens on day 9', 'Wick system from a 2 L bottle', 'pH was 7.6, fixed it with vinegar', 'DWC bucket with net pots'],
  g8p2: ['Goat weight: 31 kg by Schaeffle\'s formula', 'Silage bag sealed', 'Feeding chart for Lakshmi the cow'],
  g8p4: ['LED + buzzer circuit in Tinkercad', 'PIR sensor switching the LED', 'Arduino code for the night light'],
  g8p3: ['Cardboard prototype of my pen stand', 'Coaster sanded and varnished'],
};

// Showcase students with fuller histories, one per grade at Greenwood.
const STARS = {
  sch_greenwood_6a: { id: 'u_aarav', first: 'Aarav', last: 'Sharma', parent: 'u_priya', parentName: 'Priya Sharma' },
  sch_greenwood_7a: { id: 'u_meera', first: 'Meera', last: 'Iyer', parent: 'u_suresh', parentName: 'Suresh Iyer' },
  sch_greenwood_8a: { id: 'u_ananya', first: 'Ananya', last: 'Sharma', parent: 'u_priya', parentName: 'Priya Sharma' },
};
const FEEDBACK = {
  g6p1: 'Lovely vermicompost log. Next time add the date of each observation.',
  g6p3: 'Great catapult! Can you find where the fulcrum is and label it?',
  g7p1: 'Your germination maths is spot on. Try a second batch with soaked seeds.',
  g7p4: 'Good model! Add photos taken at different times of day so it works in the evening too.',
  g8p1: 'Very neat wick system. Record the pH every two days in a table.',
  g8p4: 'Nice work with the PIR sensor. Can you add a delay so the light stays on for 10 seconds?',
};

const melaDate = () => isoDate(new Date(new Date().getFullYear() + (new Date().getMonth() > 1 ? 1 : 0), 1, 20));

function seed() {
  const r = rng(20261017);
  const pick = a => a[Math.floor(r() * a.length)];
  const now = Date.now();
  const d = { version: 2, createdAt: now, schools: [], users: [], progress: {}, log: [] };

  const SCHOOLS = [
    { id: 'sch_greenwood', name: 'Greenwood Public School', studio: 'Greenwood Skills Studio', color: '#1F6F66', city: 'Bengaluru', plan: 'Pilot', seats: 160,
      coord: 'Kavita Rao', sections: [['6 A', 6, 0], ['6 B', 6, 1], ['7 A', 7, 0], ['8 A', 8, 0]],
      teachers: [{ id: 'u_anjali', name: 'Anjali Menon', secs: ['6 A', '7 A', '8 A'] }, { id: 'u_rahuld', name: 'Rahul Desai', secs: ['6 B'] }] },
    { id: 'sch_sunrise', name: 'Sunrise Vidyalaya', studio: 'Sunrise Kaushal Kendra', color: '#B23A48', city: 'Mysuru', plan: 'Standard', seats: 120,
      coord: 'Mohan Hegde', sections: [['6 A', 6, 1], ['7 A', 7, 1], ['8 A', 8, 1]],
      teachers: [{ id: 'u_lakshmi', name: 'Lakshmi Nair', secs: ['6 A', '7 A', '8 A'] }] },
    { id: 'sch_lakeview', name: 'Lakeview International School', studio: 'Lakeview Makers', color: '#2D5BA8', city: 'Bengaluru', plan: 'Standard', seats: 90,
      coord: 'Farah Khan', sections: [['6 Blue', 6, 0], ['7 Blue', 7, 1], ['8 Blue', 8, 0]],
      teachers: [{ id: 'u_sameer', name: 'Sameer Joshi', secs: ['6 Blue', '7 Blue', '8 Blue'] }] },
  ];

  d.users.push({ id: 'u_admin', role: 'admin', name: 'Neha Kapoor', title: 'VINC Lab admin', email: 'admin@vinclab.in' });
  const parents = {};

  for (const S of SCHOOLS) {
    const sch = { id: S.id, name: S.name, studio: S.studio, color: S.color, initials: initials(S.name), city: S.city, board: 'CBSE', plan: S.plan, seats: S.seats, active: true, createdAt: now - 120 * DAY, melaDate: melaDate(), sections: [] };
    d.users.push({ id: `u_${S.id}_coord`, role: 'school', name: S.coord, title: 'Kaushal Bodh coordinator', email: `coordinator@${S.id.slice(4)}.edu.in`, schoolId: S.id });
    const teacherFor = {};
    for (const T of S.teachers) {
      const t = { id: T.id, role: 'teacher', name: T.name, title: 'Kaushal Bodh teacher', email: `${T.name.split(' ')[0].toLowerCase()}@${S.id.slice(4)}.edu.in`, schoolId: S.id, sectionIds: [] };
      d.users.push(t);
      for (const sn of T.secs) teacherFor[sn] = t;
    }
    for (const [name, grade, variant] of S.sections) {
      const t = teacherFor[name];
      const sec = { id: `${S.id}_${name.replace(/\s+/g, '').toLowerCase()}`, name, grade, teacherId: t.id, projects: { ...PICKS[grade][variant] }, taught: {} };
      t.sectionIds.push(sec.id);
      sch.sections.push(sec);
      const n = S.id === 'sch_greenwood' ? 12 : 9 + Math.floor(r() * 3);
      for (let i = 0; i < n; i++) {
        const star = i === 0 ? STARS[sec.id] : null;
        const first = star ? star.first : pick(FIRST);
        const last = star ? star.last : pick(LAST);
        const st = { id: star ? star.id : uid('stu'), role: 'student', name: `${first} ${last}`, schoolId: S.id, sectionId: sec.id, roll: i + 1, email: `${first.toLowerCase()}.${last.toLowerCase()}${grade}${i}@student.demo` };
        let par = star && parents[star.parent];
        if (!par) {
          par = { id: star ? star.parent : uid('par'), role: 'parent', name: star ? star.parentName : `${pick(PARENT_FIRST)} ${last}`, schoolId: S.id, childIds: [], email: `parent.${st.email}` };
          if (star) parents[star.parent] = par;
          d.users.push(par);
        }
        par.childIds.push(st.id);
        st.parentId = par.id;
        d.users.push(st);
        d.progress[st.id] = seedProgress(sec, r, now, !!star, t.name);
      }
      // What the teacher has already taught: activities most of the class has finished.
      const kids = d.users.filter(u => u.sectionId === sec.id);
      for (const pid of Object.values(sec.projects)) {
        const P = projectById(pid);
        const done = P.activities.filter(a => kids.filter(k => d.progress[k.id]?.[pid]?.acts[a.n]?.done).length >= kids.length * 0.6).map(a => a.n);
        if (done.length) sec.taught[pid] = done;
      }
    }
    d.schools.push(sch);
  }
  d.log = buildLog(d).slice(0, 160);
  return d;
}

function seedQuiz(P, score, at, r) {
  const wrong = new Set();
  while (wrong.size < P.quiz.length - score) wrong.add(Math.floor(r() * P.quiz.length));
  const answers = P.quiz.map((q, i) => {
    const ok = !wrong.has(i);
    return { q: i, ok, pick: ok ? q.a : (q.a + 1 + Math.floor(r() * 3)) % q.o.length };
  });
  return { score, total: P.quiz.length, at, answers };
}

function seedProgress(sec, r, now, star, teacher) {
  const out = {};
  const [p1, p2] = [sec.projects.life, sec.projects.machines];
  const keen = star ? 1 : 0.35 + r() * 0.65; // how far along this student is
  const P1 = projectById(p1), P2 = projectById(p2);
  const start = now - 110 * DAY;

  const pr1 = emptyProgress();
  const n1 = star ? P1.activities.length : Math.min(P1.activities.length, Math.round(P1.activities.length * (0.55 + keen * 0.5)));
  P1.activities.slice(0, n1).forEach((a, i) => { pr1.acts[a.n] = { done: true, at: start + (i * 7 + r() * 3) * DAY, note: r() > 0.3 ? reflection(a.title, r) : '' }; });
  if (n1 >= P1.activities.length - 2) {
    const tries = star ? [7, 9] : [Math.round(5 + keen * 5 * r())];
    tries.forEach((sc, i) => pr1.quiz.push(seedQuiz(P1, Math.min(10, sc), start + (70 + i * 3) * DAY, r)));
  }
  const L = () => lvl(r, keen);
  if (star || r() < keen * 0.9) pr1.viva = star ? { process: 3, tools: 4, safety: 4, vocation: 3, reflect: 3 } : { process: L(), tools: L(), safety: L(), vocation: L(), reflect: L() };
  if (star || r() < keen * 0.8) pr1.obs = star ? { lo12: 4, lo13: 3, lo14: 4, lo15: 3, lo16: 4, lo17: 4 } : { lo12: L(), lo13: L(), lo14: L(), lo15: L(), lo16: L(), lo17: L() };
  const np = star ? 4 : Math.floor(keen * 5);
  const lines1 = NOTE_LINES[p1] || ['Photo of our work', 'What I learnt this week'];
  for (let i = 0; i < np; i++) pr1.portfolio.push({ id: uid('pf'), kind: i % 2 ? 'note' : 'photo', art: P1.art, title: lines1[i % lines1.length], text: i % 2 ? 'What I did and what I learnt from it.' : '', at: start + (10 + i * 12) * DAY });
  if (star) {
    pr1.portfolioScore = 3;
    pr1.feedback.push({ at: now - 20 * DAY, by: teacher, text: FEEDBACK[p1] || 'Well done on finishing every activity. Keep your portfolio this tidy!' });
  }
  out[p1] = pr1;

  const pr2 = emptyProgress();
  const n2 = star ? 2 : Math.max(0, Math.round(P2.activities.length * (keen - 0.45) * 0.9));
  P2.activities.slice(0, n2).forEach((a, i) => { pr2.acts[a.n] = { done: true, at: now - ((n2 - i) * 3.2 + r() * 2 - 1.5) * DAY, note: r() > 0.4 ? reflection(a.title, r) : '' }; });
  if (star) {
    pr2.portfolio.push({ id: uid('pf'), kind: 'photo', art: P2.art, title: (NOTE_LINES[p2] || ['First try'])[0], text: '', at: now - 3 * DAY });
    pr2.feedback.push({ at: now - 2 * DAY, by: teacher, text: FEEDBACK[p2] || 'A strong start on this project. Keep going!' });
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
      const P = projectById(pid);
      for (const [n, a] of Object.entries(pr.acts)) items.push({ at: a.at, who: u.name, what: `completed "${P.activities[n - 1].title}"`, schoolId: u.schoolId });
      for (const q of pr.quiz) items.push({ at: q.at, who: u.name, what: `scored ${q.score}/${q.total} on the ${P.title} quiz`, schoolId: u.schoolId });
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
  const sch = { id, name, studio: studio || studioName(name), color: color || '#1F6F66', initials: initials(name), city: city || '', board: 'CBSE', plan: plan || 'Pilot', seats: +seats || 60, active: true, createdAt: Date.now(), melaDate: d.schools[0]?.melaDate || melaDate(), sections: [] };
  const teacher = { id: `u_${id}_t1`, role: 'teacher', name: 'Kaushal Bodh teacher', title: 'Kaushal Bodh teacher', email: `teacher@${id}.edu.in`, schoolId: id, sectionIds: [] };
  for (const g of [6, 7, 8]) {
    const sec = { id: `${id}_${g}a`, name: `${g} A`, grade: g, teacherId: teacher.id, projects: defaultPicks(g), taught: {} };
    sch.sections.push(sec); teacher.sectionIds.push(sec.id);
  }
  d.schools.push(sch);
  d.users.push({ id: `u_${id}_coord`, role: 'school', name: 'School coordinator', title: 'Kaushal Bodh coordinator', email: `coordinator@${id}.edu.in`, schoolId: id }, teacher);
  save();
  return sch;
}

export function addSection(sch, grade, name, teacherId) {
  const sec = { id: uid(`${sch.id}_${grade}`), name, grade, teacherId: teacherId || null, projects: defaultPicks(grade), taught: {} };
  sch.sections.push(sec);
  const t = user(teacherId); if (t && !t.sectionIds.includes(sec.id)) t.sectionIds.push(sec.id);
  save();
  return sec;
}

export function addTeacher(schoolId, name, sectionIds = []) {
  const t = { id: uid('tch'), role: 'teacher', name, title: 'Kaushal Bodh teacher', schoolId, sectionIds: [] };
  db().users.push(t);
  assignSections(t, sectionIds);
  return t;
}

// Give a teacher exactly these sections; a section has one teacher, so others lose it.
export function assignSections(teacher, sectionIds) {
  const sch = school(teacher.schoolId);
  for (const t of teachersOf(teacher.schoolId)) if (t !== teacher) t.sectionIds = t.sectionIds.filter(id => !sectionIds.includes(id));
  teacher.sectionIds = [...sectionIds];
  for (const s of sch.sections) {
    if (sectionIds.includes(s.id)) s.teacherId = teacher.id;
    else if (s.teacherId === teacher.id) s.teacherId = null;
  }
  save();
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

// Branded demo from the landing page: a fresh school whose Grade 6–8 sections copy Greenwood's.
export function brandDemo({ name, studio, color }) {
  const d = db();
  let sch = d.schools.find(s => s.demo);
  if (!sch) {
    sch = addSchool({ name, studio, color, city: 'Your city', plan: 'Pilot', seats: 60 });
    sch.demo = true;
    for (const sec of sch.sections) {
      const srcSec = school('sch_greenwood').sections.find(s => s.grade === sec.grade);
      sec.projects = { ...srcSec.projects };
      sec.taught = JSON.parse(JSON.stringify(srcSec.taught || {}));
      for (const s of studentsOf('sch_greenwood', srcSec.id)) {
        const st = addStudent(sch.id, sec.id, s.name, user(s.parentId)?.name);
        d.progress[st.id] = JSON.parse(JSON.stringify(d.progress[s.id] || {}));
      }
    }
  }
  Object.assign(sch, { name, studio: studio || sch.studio, color, initials: initials(name) });
  save();
  return sch;
}

// Mark an activity as taught (or not) for a whole section.
export function setTaught(sec, pid, n, on) {
  sec.taught = sec.taught || {};
  const list = new Set(sec.taught[pid] || []);
  if (on) list.add(n); else list.delete(n);
  sec.taught[pid] = [...list].sort((a, b) => a - b);
  save();
}
