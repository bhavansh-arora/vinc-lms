// Data store. Everything lives in this browser's localStorage, so the preview needs no server.
// The shape mirrors what a hosted backend would hold: schools, users, per-project progress and a log.
import { emptyProgress } from './scoring.js';
import { sha256 } from './sha256.js';

// v4 starts empty. v3 held the sample schools and demo accounts: anything people created there
// themselves is carried over (see importLegacy), the demo data is dropped.
const KEY = 'vinclab:db:v4';
const VERSION = 4;
const LEGACY = 'vinclab:db:v3';
const OLD_KEYS = ['vinclab:db:v2'];
const SESSION = 'vinclab:session:v1';

let DB = null;
let persistOk = true;
let recovered = 0;    // accounts carried over from an older version, reported once

const ls = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); return true; } catch { return false; } },
  del(k) { try { localStorage.removeItem(k); } catch { /* ignore */ } },
};

export const uid = (p = 'id') => `${p}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-3)}`;

export function load() {
  OLD_KEYS.forEach(k => ls.del(k));
  const cur = readStored();
  DB = cur?.d || null;
  if (!DB) {
    const raw = ls.get(KEY);
    if (raw) ls.set(`${KEY}:backup`, raw); // never throw away data we could not read
    DB = seed();
  }
  baseRaw = cur?.raw || null;
  const changed = applyAdminDefaults(DB);
  if (importLegacy(DB) || changed || !cur) save();
  return DB;
}
export const db = () => DB || load();

/* ---------- Several tabs at once ----------
   Each open tab keeps the data in memory. Without care, a tab opened earlier would save its older
   copy over people another tab had just added. So:
   - save() first checks whether another tab saved since this tab last read. If so it merges record
     by record (each person, school and student's work), keeping whichever side changed it.
   - When another tab saves, pull() brings this tab up to date (main.js calls it when no form or
     dialog is open, then redraws the page). */
let baseRaw = null; // the data exactly as this tab last read or wrote it

function readStored() {
  const raw = ls.get(KEY);
  if (!raw) return null;
  try { const d = JSON.parse(raw); return d?.version === VERSION ? { raw, d } : null; } catch { return null; }
}

export function save() {
  const cur = readStored();
  if (cur && baseRaw && cur.raw !== baseRaw) {
    if (cur.d.createdAt !== DB.createdAt) DB = cur.d; // all data was deleted elsewhere: start from that
    else merge3(DB, cur.d, JSON.parse(baseRaw));
  }
  const raw = JSON.stringify(DB);
  persistOk = ls.set(KEY, raw);
  if (persistOk) baseRaw = raw;
  return persistOk;
}

// Bring this tab up to date with what another tab saved. Returns true if anything changed.
export function pull() {
  const cur = readStored();
  if (!cur) return false; // another tab is mid-way through deleting all data: wait for its next save
  if (cur.raw === baseRaw) return false;
  const local = baseRaw && JSON.stringify(DB) !== baseRaw; // edits here that were not saved yet
  if (!local || cur.d.createdAt !== DB.createdAt) { DB = cur.d; baseRaw = cur.raw; return true; }
  merge3(DB, cur.d, JSON.parse(baseRaw));
  baseRaw = cur.raw;
  save();
  return true;
}

// Three-way merge of whole records: mine, theirs and the common base this tab started from.
// A record only one side changed takes that side; if both changed it, this tab's version wins.
// A record one side deleted stays deleted unless the other side changed it meanwhile.
function merge3(mine, theirs, base) {
  const same = (x, y) => JSON.stringify(x) === JSON.stringify(y);
  const pick = (m, t, b) => {
    if (m && t) return same(m, b) ? t : m;
    if (m && !t) return b && same(m, b) ? null : m;  // they deleted it
    if (!m && t) return b && same(t, b) ? null : t;  // we deleted it
    return null;
  };
  const byId = list => new Map((list || []).map(x => [x.id, x]));
  for (const k of ['users', 'schools']) {
    const M = byId(mine[k]), T = byId(theirs[k]), B = byId(base?.[k]);
    const ids = [...new Set([...M.keys(), ...T.keys()])];
    mine[k] = ids.map(id => pick(M.get(id), T.get(id), B.get(id))).filter(Boolean);
  }
  const P = {}, mp = mine.progress || {}, tp = theirs.progress || {}, bp = base?.progress || {};
  for (const id of new Set([...Object.keys(mp), ...Object.keys(tp)])) { const v = pick(mp[id], tp[id], bp[id]); if (v) P[id] = v; }
  mine.progress = P;
  const seen = new Set((mine.log || []).map(l => `${l.at}|${l.who}|${l.what}`));
  for (const l of theirs.log || []) if (!seen.has(`${l.at}|${l.who}|${l.what}`)) mine.log.push(l);
  mine.log.sort((a, b) => b.at - a.at); mine.log.length = Math.min(mine.log.length, 250);
  mine.gone = [...new Set([...(mine.gone || []), ...(theirs.gone || [])])].slice(-3000);
}

// Tell the app when another tab changed the data.
const listeners = new Set();
export const onSync = fn => { listeners.add(fn); return () => listeners.delete(fn); };
const notify = what => listeners.forEach(fn => { try { fn(what); } catch { /* ignore */ } });
try {
  addEventListener('storage', e => {
    if (e.key === KEY || e.key === null) {
      try { const d = e.newValue && JSON.parse(e.newValue); if (d && d.version !== VERSION) { location.reload(); return; } } catch { /* half-written */ }
      notify('data');
    } else if (e.key === LEGACY && e.newValue) {
      // A tab still running the previous version saved: carry its new accounts over.
      if (importLegacy(db())) { save(); notify('data'); }
    }
  });
} catch { /* no window */ }

// Accounts people made under the previous version (v3), without its demo schools and demo logins.
const DEMO_SCHOOLS = new Set(['sch_greenwood', 'sch_sunrise', 'sch_lakeview']);
function importLegacy(d) {
  const raw = ls.get(LEGACY);
  if (!raw) return false;
  let old;
  try { old = JSON.parse(raw); } catch { return false; }
  ls.set(`${LEGACY}:backup`, raw);
  ls.del(LEGACY);
  if (!old || !Array.isArray(old.users)) return false;
  const gone = new Set(d.gone || []);
  const haveIds = new Set([...d.users.map(u => u.id), ...d.schools.map(x => x.id)]);
  const schools = (old.schools || []).filter(x => !DEMO_SCHOOLS.has(x.id) && !x.demo && !gone.has(x.id));
  const schoolIds = new Set(schools.map(x => x.id));
  const users = old.users.filter(u => u.role !== 'admin' && u.pw && u.pw !== 'demo' && schoolIds.has(u.schoolId) && !haveIds.has(u.id) && !gone.has(u.id));
  let n = 0;
  for (const x of schools) if (!haveIds.has(x.id)) { d.schools.push(x); n++; }
  for (const u of users) {
    if (loginTakenIn(d, u.login)) u.login = makeLogin(u.login.replace(/\d+$/, ''), id => loginTakenIn(d, id));
    d.users.push(u); n++;
    if (old.progress?.[u.id] && !d.progress[u.id]) d.progress[u.id] = old.progress[u.id];
  }
  const keep = new Set(d.users.map(u => u.id));
  for (const u of users) {
    if (u.childIds) u.childIds = u.childIds.filter(id => keep.has(id));
    if (u.parentId && !keep.has(u.parentId)) delete u.parentId;
  }
  for (const x of schools) for (const sec of x.sections || []) if (sec.teacherId && !keep.has(sec.teacherId)) sec.teacherId = null;
  for (const l of old.log || []) if (schoolIds.has(l.schoolId)) d.log.push(l);
  d.log.sort((a, b) => b.at - a.at); d.log.length = Math.min(d.log.length, 250);
  recovered += users.length;
  return n > 0;
}
const loginTakenIn = (d, id) => d.users.some(u => u.login === id) || id === ADMIN_LOGIN;
// How many accounts were carried over from an older version since the last call.
export function takeRecovered() { const n = recovered; recovered = 0; return n; }

export const canPersist = () => persistOk;

export function reset() { ls.del(KEY); session.clear(); ls.del(LEGACY); DB = null; baseRaw = null; return load(); }

// Each tab has its own login, so a school can test as admin in one tab and as a student in another.
// A new tab starts as whoever logged in last on this browser.
const ss = {
  get(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { sessionStorage.setItem(k, v); } catch { /* ignore */ } },
  del(k) { try { sessionStorage.removeItem(k); } catch { /* ignore */ } },
};
export const session = {
  get() {
    let raw = ss.get(SESSION);
    if (raw === null) { raw = ls.get(SESSION); if (raw) ss.set(SESSION, raw); }
    try { return JSON.parse(raw || 'null'); } catch { return null; }
  },
  set(s) { const v = JSON.stringify(s); ss.set(SESSION, v); ls.set(SESSION, v); },
  clear() { ss.set(SESSION, 'null'); ls.del(SESSION); },
};

/* ---------------- Logins ----------------
   Every account has a User ID (like "aarav.sharma") and a password. Passwords are stored as a
   salted SHA-256 hash. This is a browser-only preview: a live version must check passwords on a server. */
export const ADMIN_CODE = 'VINC-2026';
// The VINC Lab admin is not offered on the public login or sign-up screens; it logs in with these.
export const ADMIN_LOGIN = 'admin';
const ADMIN_PW = 'Qwerty@21';
function applyAdminDefaults(d) {
  if (d.adminSet) return false;
  const a = d.users.find(u => u.id === 'u_admin');
  if (a && !d.users.some(u => u !== a && u.login === ADMIN_LOGIN)) { a.login = ADMIN_LOGIN; setPassword(a, ADMIN_PW); }
  d.adminSet = true;
  return true;
}
export const LOGIN_RULE = /^[a-z][a-z0-9._-]{2,29}$/;
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const WORDS = ['mango', 'kite', 'lotus', 'tiger', 'river', 'cedar', 'pearl', 'comet', 'maple', 'ember', 'neem', 'tabla', 'peacock', 'monsoon'];
const randInt = (n, r = Math.random) => Math.floor(r() * n);
const randHex = n => Array.from({ length: n }, () => randInt(16).toString(16)).join('');

export const normLogin = id => String(id || '').trim().toLowerCase();
export function loginTaken(id, except) {
  const k = normLogin(id);
  return db().users.some(u => u !== except && (u.login === k || (u.email && u.email.toLowerCase() === k)));
}
// "Aarav Sharma" -> "aarav.sharma", then aarav.sharma2, 3... if taken.
export function makeLogin(name, taken = id => loginTaken(id)) {
  const parts = String(name || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean);
  let base = parts.length > 1 ? `${parts[0]}.${parts[parts.length - 1]}` : (parts[0] || 'user');
  if (base.length < 3) base = `${base}.user`;
  base = base.slice(0, 26);
  let id = base, n = 2;
  while (taken(id)) id = `${base}${n++}`;
  return id;
}
export function findByLogin(id) {
  const k = normLogin(id);
  if (!k) return null;
  return db().users.find(u => u.login === k) || db().users.find(u => u.email && u.email.toLowerCase() === k) || null;
}
export function setPassword(u, pw, { temp = false } = {}) {
  const salt = randHex(16);
  u.pw = { s: salt, h: sha256(`${salt}|${pw}`) };
  if (temp) u.pwTemp = true; else delete u.pwTemp;
}
export function checkPassword(u, pw) {
  if (!u?.pw || typeof pw !== 'string') return false;
  return sha256(`${u.pw.s}|${pw}`) === u.pw.h;
}
export const tempPassword = () => `${WORDS[randInt(WORDS.length)]}-${1000 + randInt(9000)}`;
// Give an account a User ID (if it has none) and a password. With no password, a temporary one
// is made and returned so the person who created the account can pass it on.
export function issueLogin(u, pw) {
  if (!u.login) u.login = makeLogin(u.name);
  const p = pw || tempPassword();
  setPassword(u, p, { temp: !pw });
  return p;
}
export function resetPassword(u) { const p = tempPassword(); setPassword(u, p, { temp: true }); save(); return p; }

function makeCode(len, taken, r = Math.random) {
  let c;
  do { c = Array.from({ length: len }, () => CODE_CHARS[randInt(CODE_CHARS.length, r)]).join(''); } while (taken(c));
  return c;
}
// Family code: a student shares it so a parent can link their account.
export const newFamilyCode = (d = db(), r) => makeCode(6, c => d.users.some(u => u.familyCode === c), r);
// Joining code: a coordinator shares it so teachers can create accounts for that school.
export const newJoinCode = (sch, d = db(), r) => `${(sch.initials || 'SC').slice(0, 3)}-${makeCode(4, c => d.schools.some(s => s.joinCode === `${(sch.initials || 'SC').slice(0, 3)}-${c}`), r)}`;
export const findByFamilyCode = code => db().users.find(u => u.role === 'student' && u.familyCode === String(code || '').trim().toUpperCase()) || null;
export const findByJoinCode = (schoolId, code) => { const s = school(schoolId); return s && s.joinCode === String(code || '').trim().toUpperCase() ? s : null; };

// Check a sign-in. Returns { user } or { error, field }.
export function authenticate(id, pw) {
  if (!normLogin(id)) return { error: 'Enter your User ID.', field: 'uid' };
  if (!pw) return { error: 'Enter your password.', field: 'pw' };
  const u = findByLogin(id);
  if (!u || !checkPassword(u, pw)) return { error: 'That User ID and password do not match. Check both and try again.', field: 'pw' };
  if (u.role !== 'admin' && u.schoolId && school(u.schoolId)?.active === false) return { error: 'Your school\'s VINC Lab account is paused. Please contact your school.', field: 'uid' };
  u.lastLogin = Date.now();
  save();
  return { user: u };
}

export const school = id => db().schools.find(s => s.id === id);
export const user = id => db().users.find(u => u.id === id);
export const section = (sch, secId) => sch?.sections.find(s => s.id === secId);
export const studentsOf = (schoolId, sectionId) => db().users.filter(u => u.role === 'student' && u.schoolId === schoolId && (!sectionId || u.sectionId === sectionId));
export const childrenOf = parent => (parent.childIds || []).map(user).filter(Boolean);
export const parentsOf = student => db().users.filter(u => u.role === 'parent' && (u.childIds || []).includes(student.id));
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

/* ---------------- New schools ---------------- */
// Default project choices for a new section.
const PICKS = {
  6: { life: 'g6p1', machines: 'g6p3', services: 'g6p6' },
  7: { life: 'g7p1', machines: 'g7p4', services: 'g7p6' },
  8: { life: 'g8p1', machines: 'g8p4', services: 'g8p5' },
};
export const defaultPicks = grade => ({ ...PICKS[grade] });

// The Kaushal Mela defaults to 20 February (next year once February has passed).
const melaDate = () => isoDate(new Date(new Date().getFullYear() + (new Date().getMonth() > 1 ? 1 : 0), 1, 20));

// A fresh start: no schools or people, only the VINC Lab admin (set up by applyAdminDefaults).
function seed() {
  return { version: VERSION, createdAt: Date.now() + Math.random(), gone: [], schools: [], users: [{ id: 'u_admin', role: 'admin', name: 'Admin', title: 'VINC Lab admin', email: 'info@vinc-lab.com', createdAt: Date.now() }], progress: {}, log: [] };
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
// New school with sections 6 A, 7 A and 8 A and a coordinator login. With withTeacher, a
// placeholder teacher takes all three sections. Returns the school, its users and their passwords.
export function addSchool({ name, studio, color, city, plan, seats, board, coord = {}, withTeacher = true, pw }) {
  const d = db();
  const id = uid('sch');
  const sch = { id, name, studio: studio || studioName(name), color: color || '#1F6F66', initials: initials(name), city: city || '', board: board || 'CBSE', plan: plan || 'Pilot', seats: +seats || 60, active: true, createdAt: Date.now(), melaDate: melaDate(), sections: [] };
  sch.joinCode = newJoinCode(sch, d);
  const coordinator = { id: `u_${id}_coord`, role: 'school', name: coord.name || `${name} coordinator`, title: 'Kaushal Bodh coordinator', schoolId: id, createdAt: Date.now() };
  if (coord.email) coordinator.email = coord.email;
  if (coord.phone) coordinator.phone = coord.phone;
  coordinator.login = coord.login ? normLogin(coord.login) : makeLogin(coord.name || `${name.split(/\s+/)[0]} coordinator`);
  const out = { sch, coord: coordinator, coordPw: issueLogin(coordinator, coord.password || pw) };
  d.users.push(coordinator);
  let teacher = null;
  if (withTeacher) {
    teacher = { id: `u_${id}_t1`, role: 'teacher', name: `${name.split(/\s+/)[0]} teacher`, title: 'Kaushal Bodh teacher', schoolId: id, sectionIds: [], createdAt: Date.now() };
    out.teacherPw = issueLogin(teacher, pw);
    out.teacher = teacher;
    d.users.push(teacher);
  }
  for (const g of [6, 7, 8]) {
    const sec = { id: `${id}_${g}a`, name: `${g} A`, grade: g, teacherId: teacher?.id || null, projects: defaultPicks(g), taught: {} };
    sch.sections.push(sec); teacher?.sectionIds.push(sec.id);
  }
  d.schools.push(sch);
  save();
  return out;
}

export function addSection(sch, grade, name, teacherId) {
  const sec = { id: uid(`${sch.id}_${grade}`), name, grade, teacherId: teacherId || null, projects: defaultPicks(grade), taught: {} };
  sch.sections.push(sec);
  const t = user(teacherId); if (t && !t.sectionIds.includes(sec.id)) t.sectionIds.push(sec.id);
  save();
  return sec;
}

export function addTeacher(schoolId, name, sectionIds = [], { email, phone, login, password, title } = {}) {
  const t = { id: uid('tch'), role: 'teacher', name, title: title || 'Kaushal Bodh teacher', schoolId, sectionIds: [], createdAt: Date.now() };
  if (email) t.email = email;
  if (phone) t.phone = phone;
  if (login) t.login = normLogin(login);
  const pw = issueLogin(t, password);
  db().users.push(t);
  assignSections(t, sectionIds);
  return { teacher: t, pw };
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

// Give one class a different teacher (or none). Only the link moves: students' work, marks,
// feedback and the year plan belong to the students and the class, so they stay as they are.
export function setSectionTeacher(sch, sectionId, teacherId) {
  const sec = section(sch, sectionId);
  if (!sec) return null;
  const before = user(sec.teacherId) || null;
  const after = teacherId ? user(teacherId) : null;
  if (before) before.sectionIds = (before.sectionIds || []).filter(id => id !== sec.id);
  sec.teacherId = after ? after.id : null;
  if (after && !after.sectionIds.includes(sec.id)) after.sectionIds.push(sec.id);
  save();
  return { before, after };
}

// A student added by the school or the admin, and a parent account when a parent's name is
// given. Each gets a User ID and a temporary password, returned so they can be handed over.
export function addStudent(schoolId, sectionId, name, parentName, { pw, parentPhone } = {}) {
  const d = db();
  const st = { id: uid('stu'), role: 'student', name, schoolId, sectionId, roll: studentsOf(schoolId, sectionId).length + 1, createdAt: Date.now() };
  st.familyCode = newFamilyCode(d);
  const stPw = issueLogin(st, pw);
  d.users.push(st);
  d.progress[st.id] = {};
  let parent = null, parPw = null;
  if (parentName) ({ parent, pw: parPw } = addParent(schoolId, parentName, [st.id], { phone: parentPhone, pw }));
  save();
  return { student: st, parent, stPw, parPw };
}

// A parent login linked to one or more students of a school.
export function addParent(schoolId, name, childIds, { phone, email, relation, pw: given } = {}) {
  const par = { id: uid('par'), role: 'parent', name, relation: relation || 'Parent', schoolId, childIds: [...childIds], createdAt: Date.now() };
  if (phone) par.phone = phone;
  if (email) par.email = email;
  const pw = issueLogin(par, given);
  db().users.push(par);
  for (const id of childIds) { const k = user(id); if (k && (!k.parentId || !user(k.parentId))) k.parentId = par.id; }
  save();
  return { parent: par, pw };
}

// Another coordinator login for a school (added by the VINC Lab admin).
export function addCoordinator(schoolId, name, { email, phone } = {}) {
  const c = { id: uid('crd'), role: 'school', name, title: 'Kaushal Bodh coordinator', schoolId, createdAt: Date.now() };
  if (email) c.email = email;
  if (phone) c.phone = phone;
  const pw = issueLogin(c);
  db().users.push(c);
  save();
  return { coord: c, pw };
}

/* ---------------- Deleting accounts ---------------- */
// Parents whose only linked child is this student; they are removed with the student by default.
export const soleParents = student => parentsOf(student).filter(p => (p.childIds || []).every(id => id === student.id));

// Delete one account and tidy up what pointed at it. Returns the accounts removed.
// A student's work goes with them; a teacher's sections are left without a teacher.
export function deleteUser(id, { withParents = true } = {}) {
  const d = db();
  const u = user(id);
  if (!u || u.role === 'admin') return [];
  const gone = [u];
  if (u.role === 'student') {
    if (withParents) gone.push(...soleParents(u));
    for (const p of parentsOf(u)) p.childIds = p.childIds.filter(c => c !== u.id);
    delete d.progress[u.id];
  }
  if (u.role === 'parent') {
    for (const k of childrenOf(u)) if (k.parentId === u.id) { const other = parentsOf(k).find(p => p !== u); if (other) k.parentId = other.id; else delete k.parentId; }
  }
  if (u.role === 'teacher') {
    for (const s of school(u.schoolId)?.sections || []) if (s.teacherId === u.id) s.teacherId = null;
  }
  const ids = new Set(gone.map(x => x.id));
  d.users = d.users.filter(x => !ids.has(x.id));
  d.gone = [...(d.gone || []), ...ids].slice(-3000);
  save();
  return gone;
}

// Delete a school with every account, piece of work and log entry that belongs to it.
export function deleteSchool(id) {
  const d = db();
  const users = d.users.filter(u => u.schoolId === id && u.role !== 'admin');
  for (const u of users) delete d.progress[u.id];
  d.users = d.users.filter(u => !users.includes(u));
  d.log = d.log.filter(l => l.schoolId !== id);
  d.schools = d.schools.filter(s => s.id !== id);
  d.gone = [...(d.gone || []), id, ...users.map(u => u.id)].slice(-3000);
  save();
  return users.length;
}

// Set a password chosen by an admin or coordinator. With temp, the person must change it at next login.
export function setPasswordFor(u, pw, { temp = true } = {}) { setPassword(u, pw, { temp }); save(); }

/* ---------------- Sign-up ----------------
   Each returns the new user, or throws an Error whose .field names the form field at fault. */
const fail = (field, msg) => { const e = new Error(msg); e.field = field; throw e; };
function checkNewLogin(login, password) {
  const k = normLogin(login);
  if (!LOGIN_RULE.test(k)) fail('login', 'User IDs are 3 to 30 characters: letters, numbers, dots, dashes or underscores, starting with a letter.');
  if (loginTaken(k)) fail('login', 'That User ID is taken. Try another.');
  if (!password || password.length < 8) fail('password', 'Use at least 8 characters for your password.');
  return k;
}
function finish(u, password) {
  setPassword(u, password);
  u.createdAt = Date.now();
  u.lastLogin = Date.now();
  db().users.push(u);
  save();
  return u;
}

export function signUp(role, f) {
  const d = db();
  const name = String(f.name || '').trim().replace(/\s+/g, ' ');
  if (role !== 'school' && name.length < 2) fail('name', 'Enter your full name.');
  const contact = { ...(f.email ? { email: f.email.trim() } : {}), ...(f.phone ? { phone: f.phone.trim() } : {}) };

  if (role === 'student') {
    const sch = school(f.schoolId);
    if (!sch || !sch.active) fail('schoolId', 'Choose your school.');
    const sec = section(sch, f.sectionId);
    if (!sec) fail('sectionId', 'Choose your class and section.');
    const login = checkNewLogin(f.login, f.password);
    const st = { id: uid('stu'), role: 'student', name, login, schoolId: sch.id, sectionId: sec.id, roll: studentsOf(sch.id, sec.id).length + 1, familyCode: newFamilyCode(d), ...contact };
    if (f.dob) st.dob = f.dob;
    d.progress[st.id] = {};
    log(name, `joined ${secLabelOf(sec)}`, sch.id);
    return finish(st, f.password);
  }
  if (role === 'parent') {
    const kid = findByFamilyCode(f.code);
    if (!kid) fail('code', 'We could not find that family code. It is 6 letters and numbers, shown on your child\'s profile page.');
    if (!f.phone && !f.email) fail('phone', 'Add a mobile number or email so the school can reach you.');
    const login = checkNewLogin(f.login, f.password);
    const par = { id: uid('par'), role: 'parent', name, login, relation: f.relation || 'Parent', schoolId: kid.schoolId, childIds: [kid.id], ...contact };
    if (!kid.parentId || !user(kid.parentId)) kid.parentId = par.id;
    log(name, `linked to ${kid.name} as a parent`, kid.schoolId);
    return finish(par, f.password);
  }
  if (role === 'teacher') {
    const sch = school(f.schoolId);
    if (!sch || !sch.active) fail('schoolId', 'Choose your school.');
    if (!findByJoinCode(sch.id, f.code)) fail('code', 'That joining code does not match this school. Ask your Kaushal Bodh coordinator for it.');
    if (!f.email) fail('email', 'Enter your email.');
    const login = checkNewLogin(f.login, f.password);
    const t = { id: uid('tch'), role: 'teacher', name, login, title: (f.title || '').trim() || 'Kaushal Bodh teacher', schoolId: sch.id, sectionIds: [], ...contact };
    finish(t, f.password);
    assignSections(t, (f.sectionIds || []).filter(id => section(sch, id)));
    log(name, 'joined as a Kaushal Bodh teacher', sch.id);
    save();
    return t;
  }
  if (role === 'school') {
    const schoolName = String(f.schoolName || '').trim().replace(/\s+/g, ' ');
    if (schoolName.length < 3) fail('schoolName', 'Enter your school\'s full name.');
    if (d.schools.some(s => s.name.toLowerCase() === schoolName.toLowerCase())) fail('schoolName', 'A school with this name is already on VINC Lab. Ask its coordinator to add you, or sign in.');
    if (!String(f.city || '').trim()) fail('city', 'Enter the city.');
    if (name.length < 2) fail('name', 'Enter the coordinator\'s full name.');
    if (!f.email) fail('email', 'Enter an email for the coordinator.');
    checkNewLogin(f.login, f.password);
    const { sch, coord } = addSchool({ name: schoolName, city: f.city.trim(), color: f.color, board: f.board, plan: 'Trial', seats: 60, withTeacher: false,
      coord: { name, email: f.email.trim(), phone: f.phone?.trim(), login: f.login, password: f.password } });
    coord.lastLogin = Date.now();
    log(name, `registered ${sch.name}`, sch.id);
    save();
    return coord;
  }
  fail('role', 'Choose who you are.');
}
const secLabelOf = sec => `Grade ${sec.grade} · ${sec.name}`;

// Link another child to a parent with the child's family code.
export function linkChild(parent, code) {
  const kid = findByFamilyCode(code);
  if (!kid) fail('code', 'We could not find that family code.');
  if ((parent.childIds || []).includes(kid.id)) fail('code', `${kid.name} is already linked to your account.`);
  parent.childIds = [...(parent.childIds || []), kid.id];
  if (!parent.schoolId) parent.schoolId = kid.schoolId;
  if (!kid.parentId || !user(kid.parentId)) kid.parentId = parent.id;
  save();
  return kid;
}

// Profile edits. Throws like signUp on a bad User ID.
export function updateProfile(u, f) {
  const name = String(f.name ?? u.name).trim().replace(/\s+/g, ' ');
  if (name.length < 2) fail('name', 'Enter your full name.');
  const login = normLogin(f.login ?? u.login);
  if (login !== u.login) {
    if (!LOGIN_RULE.test(login)) fail('login', 'User IDs are 3 to 30 characters: letters, numbers, dots, dashes or underscores, starting with a letter.');
    if (loginTaken(login, u)) fail('login', 'That User ID is taken. Try another.');
  }
  Object.assign(u, { name, login });
  for (const k of ['email', 'phone', 'title', 'relation', 'dob']) if (k in f) { const v = String(f[k] || '').trim(); if (v) u[k] = v; else delete u[k]; }
  save();
  return u;
}

// Mark an activity as taught (or not) for a whole section.
export function setTaught(sec, pid, n, on) {
  sec.taught = sec.taught || {};
  const list = new Set(sec.taught[pid] || []);
  if (on) list.add(n); else list.delete(n);
  sec.taught[pid] = [...list].sort((a, b) => a - b);
  save();
}
