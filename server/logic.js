// The rules of VINC Lab on the server: logins, sign-up, what each role may see, and which
// changes each role may make. Everything a browser sends is checked here before it is stored.
import { randomBytes, scrypt as scryptCb, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCb);

/* ---------- Small helpers (same rules as the browser app) ---------- */
export const LOGIN_RULE = /^[a-z][a-z0-9._-]{2,29}$/;
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const WORDS = ['mango', 'kite', 'lotus', 'tiger', 'river', 'cedar', 'pearl', 'comet', 'maple', 'ember', 'neem', 'tabla', 'peacock', 'monsoon'];
const ROLES = ['admin', 'school', 'teacher', 'student', 'parent'];
const PROJECT_ID = /^g[678]p\d{1,2}$/;
const STUDENT_FIELDS = ['acts', 'quiz', 'portfolio', 'labs', 'steps', 'records'];
const MARKER_FIELDS = ['viva', 'obs', 'portfolioScore', 'feedback'];
const SELF_FIELDS = ['name', 'login', 'email', 'phone', 'title', 'relation', 'dob'];
const MANAGER_FIELDS = [...SELF_FIELDS, 'familyCode', 'sectionId', 'sectionIds', 'roll', 'childIds', 'parentId'];
const SCHOOL_FIELDS_COORD = ['name', 'studio', 'color', 'initials', 'city', 'board', 'melaDate', 'joinCode'];
const SCHOOL_FIELDS_ADMIN = [...SCHOOL_FIELDS_COORD, 'plan', 'seats', 'active', 'createdAt'];
const PICKS = { 6: { life: 'g6p1', machines: 'g6p3', services: 'g6p6' }, 7: { life: 'g7p1', machines: 'g7p4', services: 'g7p6' }, 8: { life: 'g8p1', machines: 'g8p4', services: 'g8p5' } };

const rnd = n => randomBytes(4).readUInt32BE() % n;
export const uid = (p = 'id') => `${p}_${randomBytes(6).toString('base64url').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 7).padEnd(7, '0')}${Date.now().toString(36).slice(-3)}`;
export const normLogin = id => String(id ?? '').trim().toLowerCase();
const str = (v, max) => (v == null ? '' : String(v)).trim().replace(/\s+/g, ' ').slice(0, max);
const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
const clone = v => JSON.parse(JSON.stringify(v));
// JSON with sorted keys, so two copies of a value compare equal whatever order their keys are in.
const stable = v => JSON.stringify(v, (k, x) => (isObj(x) ? Object.keys(x).sort().reduce((o, key) => { o[key] = x[key]; return o; }, {}) : x));
// Each changed record arrives with `_base`: that record as the sender last saw it. Only fields the
// sender actually changed are applied, so an older open tab cannot undo someone else's newer change.
const changedFields = (rec, fields) => { const b = isObj(rec._base) ? rec._base : null; return b ? fields.filter(k => k in rec && stable(rec[k]) !== stable(b[k])) : fields; };
export const tempPassword = () => `${WORDS[rnd(WORDS.length)]}-${1000 + rnd(9000)}`;
export const hashToken = t => createHash('sha256').update(String(t)).digest('hex');
export const newToken = () => randomBytes(32).toString('base64url');

export function studioName(school) {
  const words = (school || '').split(/\s+/).filter(Boolean);
  if (!words.length) return 'Skills Studio';
  const short = /^(st\.?|sri|shri|the|dr\.?|sir|new|dav|dps)$/i.test(words[0]) || words[0].length <= 3;
  return `${words.slice(0, short && words[1] ? 2 : 1).join(' ')} Skills Studio`;
}
export const initials = name => (name || '').split(/\s+/).filter(w => w && !/^(of|the|and|&)$/i.test(w)).slice(0, 2).map(w => w[0].toUpperCase()).join('') || 'S';
const isoDate = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const melaDate = () => isoDate(new Date(new Date().getFullYear() + (new Date().getMonth() > 1 ? 1 : 0), 1, 20));
const emptyProgress = () => ({ acts: {}, quiz: [], viva: null, obs: null, portfolio: [], portfolioScore: null, feedback: [] });
const fail = (field, message, status = 400) => { const e = new Error(message); e.field = field; e.status = status; throw e; };

/* ---------- Passwords (scrypt) ---------- */
export async function hashPassword(pw) {
  const salt = randomBytes(16).toString('hex');
  const key = await scrypt(String(pw), salt, 64);
  return { _salt: salt, _hash: key.toString('hex') };
}
export async function checkPassword(u, pw) {
  if (!u?._salt || !u?._hash || typeof pw !== 'string' || !pw) return false;
  const key = await scrypt(pw, u._salt, 64);
  const want = Buffer.from(u._hash, 'hex');
  return want.length === key.length && timingSafeEqual(want, key);
}

/* ---------- The service ---------- */
export function createLogic(db, { adminPassword = 'Qwerty@21' } = {}) {
  const { mem } = db;
  const users = () => [...mem.users.values()];
  const school = id => mem.schools.get(id) || null;
  const user = id => mem.users.get(id) || null;
  const studentsOf = (schoolId, sectionId) => users().filter(u => u.role === 'student' && u.schoolId === schoolId && (!sectionId || u.sectionId === sectionId));
  const parentsOf = st => users().filter(u => u.role === 'parent' && (u.childIds || []).includes(st.id));
  const teacherSecs = t => new Set((school(t.schoolId)?.sections || []).filter(s => s.teacherId === t.id).map(s => s.id));

  const loginTaken = (login, exceptId) => {
    const k = normLogin(login);
    return !k || k === 'admin' && !(exceptId && user(exceptId)?.role === 'admin') || users().some(u => u.id !== exceptId && (u.login === k || (u.email && u.email.toLowerCase() === k)));
  };
  const makeLogin = name => {
    const parts = String(name || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean);
    let base = parts.length > 1 ? `${parts[0]}.${parts[parts.length - 1]}` : (parts[0] || 'user');
    if (base.length < 3) base = `${base}.user`;
    base = base.slice(0, 26);
    let id = base, n = 2;
    while (loginTaken(id)) id = `${base}${n++}`;
    return id;
  };
  // A User ID that is free: the one asked for if it is valid and free, otherwise one made from it.
  const freeLogin = (wanted, name) => {
    const k = normLogin(wanted);
    if (LOGIN_RULE.test(k) && !loginTaken(k)) return k;
    return makeLogin(LOGIN_RULE.test(k) ? k.replace(/\d+$/, '').replace(/[._-]/g, ' ') : name);
  };
  const makeCode = (len, taken) => { let c; do { c = Array.from({ length: len }, () => CODE_CHARS[rnd(CODE_CHARS.length)]).join(''); } while (taken(c)); return c; };
  const familyCodeTaken = (c, exceptId) => users().some(u => u.id !== exceptId && u.familyCode === c);
  const newFamilyCode = () => makeCode(6, c => familyCodeTaken(c));
  const joinCodeTaken = (c, exceptId) => [...mem.schools.values()].some(s => s.id !== exceptId && s.joinCode === c);
  const newJoinCode = sch => { const p = (sch.initials || 'SC').slice(0, 3); return `${p}-${makeCode(4, c => joinCodeTaken(`${p}-${c}`))}`; };

  const findByLogin = id => {
    const k = normLogin(id);
    if (!k) return null;
    return users().find(u => u.login === k) || users().find(u => u.email && u.email.toLowerCase() === k) || null;
  };

  /* ----- First run: the admin login ----- */
  async function ensureAdmin() {
    if (users().some(u => u.role === 'admin')) return;
    const a = { id: 'u_admin', role: 'admin', name: 'Admin', title: 'VINC Lab admin', email: 'info@vinc-lab.com', login: 'admin', createdAt: Date.now(), ...(await hashPassword(adminPassword)) };
    db.saveUser(a);
    if (!db.meta.get('createdAt')) db.meta.set('createdAt', Date.now());
    await db.commit();
  }

  /* ----- Sessions ----- */
  function startSession(u, by = null) {
    const token = newToken();
    db.session.put(hashToken(token), u.id, by);
    return token;
  }
  function actorFrom(token) {
    if (!token) return null;
    const s = db.session.get(hashToken(token));
    if (!s) return null;
    const u = user(s.user_id);
    if (!u) { db.session.del(hashToken(token)); return null; }
    if (u.role !== 'admin' && !s.by_user && school(u.schoolId)?.active === false) return null;
    if (Date.now() - s.last_seen > 60000) db.session.touch(hashToken(token));
    return { u, by: s.by_user || null, tokenHash: hashToken(token) };
  }

  /* ----- What each person may see ----- */
  const full = u => { const { _salt, _hash, ...rest } = u; return clone(rest); };
  const minimal = u => {
    const o = { id: u.id, role: u.role, name: u.name, schoolId: u.schoolId };
    for (const k of ['sectionId', 'sectionIds', 'title', 'relation', 'childIds']) if (u[k] != null) o[k] = clone(u[k]);
    return o;
  };
  const schoolFor = (s, withCode) => { const o = clone(s); if (!withCode) delete o.joinCode; return o; };

  function snapshot(actor) {
    const me = actor.u;
    const out = { version: 4, server: true, createdAt: +db.meta.get('createdAt') || 0, schools: [], users: [], progress: {}, log: [] };
    const addUser = (u, how) => { if (u && !out.users.some(x => x.id === u.id)) out.users.push(how === 'full' ? full(u) : minimal(u)); };
    const addProgress = id => { const p = mem.progress.get(id); if (p) out.progress[id] = clone(p); };
    if (me.role === 'admin') {
      out.schools = [...mem.schools.values()].map(s => schoolFor(s, true));
      for (const u of users()) addUser(u, 'full');
      for (const [id, p] of mem.progress) out.progress[id] = clone(p);
      out.log = mem.log.slice(0, 250);
      return out;
    }
    const sch = school(me.schoolId);
    addUser(me, 'full');
    if (me.role === 'school') {
      if (sch) out.schools.push(schoolFor(sch, true));
      for (const u of users()) if (u.schoolId === me.schoolId && u.role !== 'admin') addUser(u, 'full');
      for (const st of studentsOf(me.schoolId)) addProgress(st.id);
      out.log = mem.log.filter(l => l.schoolId === me.schoolId).slice(0, 250);
    } else if (me.role === 'teacher') {
      if (sch) out.schools.push(schoolFor(sch, false));
      const secs = teacherSecs(me);
      for (const st of studentsOf(me.schoolId)) if (secs.has(st.sectionId)) { addUser(st, 'full'); addProgress(st.id); for (const p of parentsOf(st)) addUser(p, 'full'); }
      for (const u of users()) if (u.schoolId === me.schoolId && (u.role === 'teacher' || u.role === 'school')) addUser(u, 'min');
      out.log = mem.log.filter(l => l.schoolId === me.schoolId).slice(0, 100);
    } else if (me.role === 'student') {
      if (sch) out.schools.push(schoolFor(sch, false));
      addProgress(me.id);
      const sec = sch?.sections.find(s => s.id === me.sectionId);
      if (sec?.teacherId) addUser(user(sec.teacherId), 'min');
      for (const p of parentsOf(me)) addUser(p, 'min');
    } else if (me.role === 'parent') {
      for (const id of me.childIds || []) {
        const k = user(id); if (!k) continue;
        addUser(k, 'full'); addProgress(k.id);
        const ks = school(k.schoolId);
        if (ks && !out.schools.some(s => s.id === ks.id)) out.schools.push(schoolFor(ks, false));
        const sec = ks?.sections.find(s => s.id === k.sectionId);
        if (sec?.teacherId) addUser(user(sec.teacherId), 'min');
        for (const p of parentsOf(k)) addUser(p, 'min');
      }
    }
    return out;
  }

  /* ----- Who may change whom ----- */
  const manages = (me, t) => {
    if (!t || t.role === 'admin' || t.id === me.id) return false;
    if (me.role === 'admin') return true;
    if (me.role === 'school') return t.schoolId === me.schoolId && ['teacher', 'student', 'parent'].includes(t.role);
    return false;
  };
  // Teachers may reset passwords for students in their classes and those students' parents.
  const teacherResets = (me, t) => {
    if (me.role !== 'teacher' || !t || t.schoolId !== me.schoolId) return false;
    const secs = teacherSecs(me);
    if (t.role === 'student') return secs.has(t.sectionId);
    if (t.role === 'parent') return (t.childIds || []).some(id => secs.has(user(id)?.sectionId));
    return false;
  };
  const marks = (me, st) => {
    if (!st || st.role !== 'student') return false;
    if (me.role === 'admin') return true;
    if (me.role === 'school') return st.schoolId === me.schoolId;
    if (me.role === 'teacher') return st.schoolId === me.schoolId && teacherSecs(me).has(st.sectionId);
    return false;
  };

  /* ----- Field checks ----- */
  function cleanUserFields(t, rec, fields, errors, isNew) {
    const sch = school(t.schoolId);
    const err = (field, message) => errors.push({ kind: 'users', id: t.id, field, message });
    for (const k of fields) {
      if (!(k in rec)) continue;
      const v = rec[k];
      if (k === 'name') { const n = str(v, 60); if (n.length >= 2) t.name = n; else err('name', 'Enter a full name.'); }
      else if (k === 'login') {
        const l = normLogin(v);
        if (l === t.login) continue;
        if (isNew) t.login = freeLogin(l, t.name);
        else if (!LOGIN_RULE.test(l)) err('login', 'User IDs are 3 to 30 characters: letters, numbers, dots, dashes or underscores, starting with a letter.');
        else if (loginTaken(l, t.id)) err('login', 'That User ID is taken. Try another.');
        else t.login = l;
      } else if (['email', 'phone', 'title', 'relation', 'dob'].includes(k)) { const s = str(v, k === 'email' ? 80 : 60); if (s) t[k] = s; else delete t[k]; }
      else if (k === 'familyCode') {
        if (t.role !== 'student') continue;
        const c = str(v, 6).toUpperCase();
        t.familyCode = /^[A-Z0-9]{6}$/.test(c) && !familyCodeTaken(c, t.id) ? c : newFamilyCode();
      } else if (k === 'sectionId') { if (t.role === 'student' && sch?.sections.some(s => s.id === v)) t.sectionId = v; }
      else if (k === 'sectionIds') { if (t.role === 'teacher' && Array.isArray(v)) t.sectionIds = v.filter(id => sch?.sections.some(s => s.id === id)); }
      else if (k === 'roll') { if (Number.isFinite(+v)) t.roll = Math.max(0, Math.round(+v)); }
      else if (k === 'childIds') { if (t.role === 'parent' && Array.isArray(v)) t.childIds = [...new Set(v)].filter(id => { const k2 = user(id); return k2?.role === 'student' && (k2.schoolId === t.schoolId || (t.childIds || []).includes(id)); }); }
      else if (k === 'parentId') { if (t.role === 'student') { const p = user(v); if (p?.role === 'parent') t.parentId = v; else delete t.parentId; } }
    }
  }

  // Merge class changes section by section and field by field against what the sender last saw.
  function mergeSections(cur, inc, base, keepTaught) {
    if (!Array.isArray(inc)) return cur;
    if (!Array.isArray(base)) return cleanSections(inc, cur, keepTaught);
    const out = clone(cur);
    for (const s of inc) {
      if (!isObj(s) || !s.id) continue;
      const b = base.find(x => x.id === s.id), c = out.find(x => x.id === s.id);
      if (!c) { if (!b) out.push(...cleanSections([s], [], keepTaught)); continue; }
      if (b && stable(s) === stable(b)) continue;
      const [fresh] = cleanSections([s], [c], keepTaught);
      for (const f of ['name', 'grade', 'teacherId', 'projects']) if (!b || stable(s[f]) !== stable(b[f])) c[f] = fresh[f];
      if (!keepTaught && (!b || stable(s.taught) !== stable(b.taught))) c.taught = fresh.taught;
    }
    return out;
  }
  function cleanSections(list, prev, keepTaught) {
    if (!Array.isArray(list)) return prev || [];
    return list.slice(0, 60).filter(s => isObj(s) && s.id && [6, 7, 8].includes(+s.grade)).map(s => {
      const old = (prev || []).find(p => p.id === s.id);
      const projects = {};
      for (const f of ['life', 'machines', 'services']) projects[f] = PROJECT_ID.test(s.projects?.[f]) ? s.projects[f] : (old?.projects?.[f] || PICKS[+s.grade][f]);
      return { id: str(s.id, 80), name: str(s.name, 20) || `${s.grade} A`, grade: +s.grade, teacherId: s.teacherId && user(s.teacherId)?.role === 'teacher' ? s.teacherId : null, projects, taught: keepTaught ? (old?.taught || {}) : cleanTaught(s.taught) };
    });
  }
  const cleanTaught = t => { const o = {}; if (isObj(t)) for (const [pid, list] of Object.entries(t)) if (PROJECT_ID.test(pid) && Array.isArray(list)) o[pid] = [...new Set(list.map(Number).filter(n => n >= 1 && n <= 30))].sort((a, b) => a - b); return o; };

  // After sections or a teacher's classes change, make both sides agree (a class has one teacher).
  function syncTeachers(schoolId, changedTeachers = []) {
    const sch = school(schoolId); if (!sch) return;
    for (const t of changedTeachers) {
      if (t.schoolId !== schoolId || t.role !== 'teacher') continue;
      const want = new Set(t.sectionIds || []);
      for (const s of sch.sections) { if (want.has(s.id)) s.teacherId = t.id; else if (s.teacherId === t.id) s.teacherId = null; }
    }
    for (const s of sch.sections) if (s.teacherId && (user(s.teacherId)?.role !== 'teacher' || user(s.teacherId).schoolId !== schoolId)) s.teacherId = null;
    db.saveSchool(sch);
    for (const t of users()) if (t.role === 'teacher' && t.schoolId === schoolId) {
      const ids = sch.sections.filter(s => s.teacherId === t.id).map(s => s.id);
      if (JSON.stringify(ids) !== JSON.stringify(t.sectionIds || [])) { t.sectionIds = ids; db.saveUser(t); }
    }
  }

  /* ----- Applying a batch of changes from a browser ----- */
  async function applyChanges(actor, ch) {
    const me = actor.u;
    const errors = [];
    const touchedSchools = new Set();
    const changedTeachers = [];
    const no = (kind, id, message) => errors.push({ kind, id, message });
    const pwJobs = [];
    const delUsers = new Set((ch.users?.delete || []).filter(Boolean));
    const delSchools = new Set((ch.schools?.delete || []).filter(Boolean));

    await db.tx(() => {
      // Schools first: a new school's people may arrive in the same batch.
      for (const rec of (ch.schools?.upsert || []).slice(0, 200)) {
        if (!isObj(rec) || !rec.id || delSchools.has(rec.id)) continue;
        const cur = school(rec.id);
        if (!cur) {
          if (me.role !== 'admin') { no('schools', rec.id, 'Only the VINC Lab admin can add schools.'); continue; }
          const s = { id: str(rec.id, 80), name: str(rec.name, 80) || 'New school', createdAt: Date.now(), active: true, sections: [] };
          for (const k of SCHOOL_FIELDS_ADMIN) if (k in rec && k !== 'createdAt') s[k] = k === 'seats' ? Math.max(1, +rec.seats || 60) : k === 'active' ? !!rec.active : str(rec[k], 80);
          s.studio ||= studioName(s.name); s.initials ||= initials(s.name); s.color ||= '#1F6F66'; s.melaDate ||= melaDate(); s.board ||= 'CBSE'; s.plan ||= 'Pilot'; s.seats ||= 60;
          if (!s.joinCode || joinCodeTaken(s.joinCode, s.id)) s.joinCode = newJoinCode(s);
          s.sections = cleanSections(rec.sections, [], false);
          db.saveSchool(s); touchedSchools.add(s.id);
          continue;
        }
        const own = me.role === 'school' && me.schoolId === cur.id;
        if (me.role === 'admin' || own) {
          for (const k of changedFields(rec, me.role === 'admin' ? SCHOOL_FIELDS_ADMIN : SCHOOL_FIELDS_COORD)) if (k in rec) {
            if (k === 'seats') cur.seats = Math.max(1, +rec.seats || cur.seats);
            else if (k === 'active') cur.active = !!rec.active;
            else if (k === 'createdAt') continue;
            else if (k === 'joinCode') { const c = str(rec.joinCode, 12).toUpperCase(); cur.joinCode = c && !joinCodeTaken(c, cur.id) ? c : (cur.joinCode || newJoinCode(cur)); }
            else { const v = str(rec[k], 80); if (v || k === 'city') cur[k] = v; }
          }
          if ('sections' in rec && changedFields(rec, ['sections']).length) cur.sections = mergeSections(cur.sections, rec.sections, rec._base?.sections, me.role !== 'admin');
          db.saveSchool(cur); touchedSchools.add(cur.id);
        } else if (me.role === 'teacher' && me.schoolId === cur.id) {
          // Teachers only tick off lessons taught in their own classes.
          for (const s of cur.sections) {
            if (s.teacherId !== me.id) continue;
            const inc = (rec.sections || []).find(x => x?.id === s.id);
            const b = (rec._base?.sections || []).find(x => x?.id === s.id);
            if (inc && 'taught' in inc && (!b || stable(inc.taught) !== stable(b.taught))) s.taught = cleanTaught(inc.taught);
          }
          db.saveSchool(cur);
        } else no('schools', rec.id, 'You cannot change this school.');
      }

      // People.
      for (const rec of (ch.users?.upsert || []).slice(0, 500)) {
        if (!isObj(rec) || !rec.id || delUsers.has(rec.id)) continue;
        const cur = user(rec.id);
        if (!cur) {
          const role = rec.role;
          const sch = school(rec.schoolId);
          const allowed = me.role === 'admin' ? ['school', 'teacher', 'student', 'parent'] : me.role === 'school' ? ['teacher', 'student', 'parent'] : [];
          if (!allowed.includes(role) || !sch || (me.role === 'school' && sch.id !== me.schoolId)) { no('users', rec.id, 'You cannot add this person.'); continue; }
          if (!isObj(rec._pw) || typeof rec._pw.set !== 'string' || rec._pw.set.length < 6) { no('users', rec.id, 'A new account needs a password.'); continue; }
          const t = { id: str(rec.id, 80), role, schoolId: sch.id, name: str(rec.name, 60) || 'New user', createdAt: Date.now(), login: '' };
          if (role === 'teacher' || role === 'school') t.title = str(rec.title, 60) || (role === 'teacher' ? 'Kaushal Bodh teacher' : 'Kaushal Bodh coordinator');
          if (role === 'teacher') t.sectionIds = [];
          if (role === 'parent') { t.childIds = []; t.relation = 'Parent'; }
          cleanUserFields(t, rec, MANAGER_FIELDS.filter(k => k !== 'login'), errors, true);
          t.login = freeLogin(rec.login, t.name);
          if (role === 'student') { if (!sch.sections.some(s => s.id === t.sectionId)) { no('users', rec.id, 'Choose a class for the student.'); continue; } if (!t.familyCode) t.familyCode = newFamilyCode(); }
          t.pwTemp = rec._pw.temp !== false;
          pwJobs.push({ t, pw: rec._pw.set });
          db.saveUser(t);
          if (role === 'teacher') changedTeachers.push(t);
          touchedSchools.add(sch.id);
          continue;
        }
        const self = cur.id === me.id;
        if (manages(me, cur)) {
          const before = JSON.stringify(cur.sectionIds || []);
          cleanUserFields(cur, rec, changedFields(rec, MANAGER_FIELDS), errors, false);
          if (isObj(rec._pw) && typeof rec._pw.set === 'string' && rec._pw.set.length >= 6) { cur.pwTemp = rec._pw.temp !== false; pwJobs.push({ t: cur, pw: rec._pw.set }); }
          db.saveUser(cur);
          if (cur.role === 'teacher' && JSON.stringify(cur.sectionIds || []) !== before) changedTeachers.push(cur);
          touchedSchools.add(cur.schoolId);
        } else if (self) {
          cleanUserFields(cur, rec, changedFields(rec, cur.role === 'student' ? [...SELF_FIELDS, 'familyCode'] : SELF_FIELDS), errors, false);
          db.saveUser(cur);
        } else if (teacherResets(me, cur)) {
          if (isObj(rec._pw) && typeof rec._pw.set === 'string' && rec._pw.set.length >= 6) { cur.pwTemp = rec._pw.temp !== false; pwJobs.push({ t: cur, pw: rec._pw.set }); db.saveUser(cur); }
        } else if (rec._pw || stable(stripLocal(rec)) !== stable(stripLocal(isObj(rec._base) ? rec._base : full(cur)))) {
          no('users', rec.id, 'You cannot change this account.');
        }
      }

      // Student work and marks, merged project by project and field by field.
      for (const rec of (ch.progress?.upsert || []).slice(0, 500)) {
        if (!isObj(rec) || !isObj(rec.data)) continue;
        const st = user(rec.id);
        if (!st || st.role !== 'student') continue;
        const fields = me.role === 'admin' ? [...STUDENT_FIELDS, ...MARKER_FIELDS] : me.id === st.id ? STUDENT_FIELDS : marks(me, st) ? MARKER_FIELDS : null;
        if (!fields) { no('progress', rec.id, 'You cannot change this student\'s work.'); continue; }
        const cur = clone(mem.progress.get(st.id) || {});
        for (const [pid, inc] of Object.entries(rec.data)) {
          if (!PROJECT_ID.test(pid) || !isObj(inc)) continue;
          const e = cur[pid] || emptyProgress();
          for (const f of fields) {
            if (!(f in inc)) continue;
            if (f === 'feedback' && Array.isArray(inc.feedback)) {
              const seen = new Set((e.feedback || []).map(x => `${x.at}|${x.text}`));
              e.feedback = [...(e.feedback || []), ...inc.feedback.filter(x => isObj(x) && !seen.has(`${x.at}|${x.text}`)).map(x => ({ at: +x.at || Date.now(), by: str(x.by, 60), text: str(x.text, 600) }))].slice(-50);
            } else e[f] = inc[f];
          }
          cur[pid] = e;
        }
        if (JSON.stringify(cur).length > 12_000_000) { no('progress', rec.id, 'This student\'s portfolio is too large. Remove some photos.'); continue; }
        db.saveProgress(st.id, st.schoolId, cur);
      }

      // Deleting people and schools.
      for (const id of delUsers) {
        const t = user(id);
        if (!t) continue;
        if (!manages(me, t)) { no('users', id, 'You cannot delete this account.'); continue; }
        removeUser(t);
        touchedSchools.add(t.schoolId);
      }
      for (const id of delSchools) {
        if (me.role !== 'admin') { no('schools', id, 'Only the VINC Lab admin can delete a school.'); continue; }
        if (school(id)) removeSchool(id);
        touchedSchools.delete(id);
      }

      for (const sid of touchedSchools) syncTeachers(sid, changedTeachers);

      // Activity feed entries, always tied to a school the person belongs to.
      for (const l of (ch.log || []).slice(0, 30)) {
        if (!isObj(l)) continue;
        let sid = l.schoolId || null;
        if (me.role !== 'admin') sid = me.role === 'parent' ? (user((me.childIds || [])[0])?.schoolId || null) : me.schoolId;
        db.addLog({ at: Math.min(+l.at || Date.now(), Date.now()), who: l.who, what: l.what, schoolId: sid });
      }
    });

    // Password hashing is slow on purpose, so it runs after the main write.
    for (const { t, pw } of pwJobs) {
      const cur = user(t.id); if (!cur) continue;
      Object.assign(cur, await hashPassword(pw));
      db.saveUser(cur);
    }
    return errors;
  }
  const stripLocal = r => { const o = { ...r }; for (const k of ['_pw', '_base', 'pw', 'pwTemp', 'lastLogin', 'createdAt']) delete o[k]; return o; };

  function removeUser(t) {
    if (t.role === 'student') {
      db.deleteProgress(t.id);
      for (const p of parentsOf(t)) { p.childIds = p.childIds.filter(c => c !== t.id); db.saveUser(p); }
    }
    if (t.role === 'parent') for (const k of users()) if (k.parentId === t.id) { const other = parentsOf(k).find(p => p.id !== t.id); if (other) k.parentId = other.id; else delete k.parentId; db.saveUser(k); }
    if (t.role === 'teacher') { const sch = school(t.schoolId); if (sch) { for (const s of sch.sections) if (s.teacherId === t.id) s.teacherId = null; db.saveSchool(sch); } }
    db.deleteUser(t.id);
  }
  function removeSchool(id) {
    for (const u of users()) if (u.schoolId === id && u.role !== 'admin') { db.deleteProgress(u.id); db.deleteUser(u.id); }
    db.deleteSchool(id);
  }

  /* ----- Sign-up (no login yet) ----- */
  function checkNewLogin(login, password) {
    const k = normLogin(login);
    if (!LOGIN_RULE.test(k)) fail('login', 'User IDs are 3 to 30 characters: letters, numbers, dots, dashes or underscores, starting with a letter.');
    if (loginTaken(k)) fail('login', 'That User ID is taken. Try another.');
    if (typeof password !== 'string' || password.length < 8) fail('password', 'Use at least 8 characters for your password.');
    return k;
  }
  const secLabel = s => `Grade ${s.grade} · ${s.name}`;

  async function signUp(role, f) {
    f = isObj(f) ? f : {};
    const name = str(f.name, 60);
    if (role !== 'school' && name.length < 2) fail('name', 'Enter your full name.');
    const contact = {};
    if (f.email) { const e = str(f.email, 80); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) fail('email', 'That email does not look right.'); contact.email = e; }
    if (f.phone) contact.phone = str(f.phone, 15);
    const pw = await hashPassword(String(f.password || 'x'));
    let u = null, after = null;
    await db.tx(() => {
      if (role === 'student') {
        const sch = school(f.schoolId);
        if (!sch || sch.active === false) fail('schoolId', 'Choose your school.');
        const sec = sch.sections.find(s => s.id === f.sectionId);
        if (!sec) fail('sectionId', 'Choose your class and section.');
        const login = checkNewLogin(f.login, f.password);
        u = { id: uid('stu'), role: 'student', name, login, schoolId: sch.id, sectionId: sec.id, roll: studentsOf(sch.id, sec.id).length + 1, familyCode: newFamilyCode(), ...contact };
        if (f.dob) u.dob = str(f.dob, 10);
        after = () => { db.saveProgress(u.id, sch.id, {}); db.addLog({ who: name, what: `joined ${secLabel(sec)}`, schoolId: sch.id }); };
      } else if (role === 'parent') {
        const kid = users().find(x => x.role === 'student' && x.familyCode === str(f.code, 6).toUpperCase());
        if (!kid) fail('code', 'We could not find that family code. It is 6 letters and numbers, shown on your child\'s profile page.');
        if (!contact.phone && !contact.email) fail('phone', 'Add a mobile number or email so the school can reach you.');
        const login = checkNewLogin(f.login, f.password);
        u = { id: uid('par'), role: 'parent', name, login, relation: ['Mother', 'Father', 'Guardian'].includes(f.relation) ? f.relation : 'Parent', schoolId: kid.schoolId, childIds: [kid.id], ...contact };
        after = () => { if (!kid.parentId || !user(kid.parentId)) { kid.parentId = u.id; db.saveUser(kid); } db.addLog({ who: name, what: `linked to ${kid.name} as a parent`, schoolId: kid.schoolId }); };
      } else if (role === 'teacher') {
        const sch = school(f.schoolId);
        if (!sch || sch.active === false) fail('schoolId', 'Choose your school.');
        if (!sch.joinCode || sch.joinCode !== str(f.code, 12).toUpperCase()) fail('code', 'That joining code does not match this school. Ask your Kaushal Bodh coordinator for it.');
        if (!contact.email) fail('email', 'Enter your email.');
        const login = checkNewLogin(f.login, f.password);
        const want = Array.isArray(f.sectionIds) ? f.sectionIds.filter(id => sch.sections.some(s => s.id === id)) : [];
        u = { id: uid('tch'), role: 'teacher', name, login, title: str(f.title, 60) || 'Kaushal Bodh teacher', schoolId: sch.id, sectionIds: want, ...contact };
        after = () => { syncTeachers(sch.id, [u]); db.addLog({ who: name, what: 'joined as a Kaushal Bodh teacher', schoolId: sch.id }); };
      } else if (role === 'school') {
        const schoolName = str(f.schoolName, 80);
        if (schoolName.length < 3) fail('schoolName', 'Enter your school\'s full name.');
        if ([...mem.schools.values()].some(s => s.name.toLowerCase() === schoolName.toLowerCase())) fail('schoolName', 'A school with this name is already on VINC Lab. Ask its coordinator to add you, or sign in.');
        if (!str(f.city, 40)) fail('city', 'Enter the city.');
        if (name.length < 2) fail('name', 'Enter the coordinator\'s full name.');
        if (!contact.email) fail('email', 'Enter an email for the coordinator.');
        const login = checkNewLogin(f.login, f.password);
        const id = uid('sch');
        const sch = { id, name: schoolName, studio: studioName(schoolName), color: /^#[0-9a-f]{6}$/i.test(f.color) ? f.color : '#1F6F66', initials: initials(schoolName), city: str(f.city, 40), board: str(f.board, 20) || 'CBSE', plan: 'Trial', seats: 60, active: true, createdAt: Date.now(), melaDate: melaDate(), sections: [] };
        sch.joinCode = newJoinCode(sch);
        for (const g of [6, 7, 8]) sch.sections.push({ id: `${id}_${g}a`, name: `${g} A`, grade: g, teacherId: null, projects: { ...PICKS[g] }, taught: {} });
        db.saveSchool(sch);
        u = { id: `u_${id}_coord`, role: 'school', name, login, title: 'Kaushal Bodh coordinator', schoolId: id, ...contact };
        after = () => db.addLog({ who: name, what: `registered ${sch.name}`, schoolId: id });
      } else fail('role', 'Choose who you are.');
      Object.assign(u, pw, { createdAt: Date.now(), lastLogin: Date.now() });
      db.saveUser(u);
      after();
    });
    return u;
  }

  /* ----- Public lookups for the sign-up forms ----- */
  const publicSchools = () => [...mem.schools.values()].filter(s => s.active !== false).map(s => ({ id: s.id, name: s.name, city: s.city || '', active: true,
    sections: s.sections.map(x => ({ id: x.id, name: x.name, grade: x.grade, hasTeacher: !!x.teacherId })) }));
  const familyLookup = code => {
    const k = users().find(x => x.role === 'student' && x.familyCode === str(code, 6).toUpperCase());
    if (!k) return null;
    const sch = school(k.schoolId), sec = sch?.sections.find(s => s.id === k.sectionId);
    return { name: k.name, grade: sec?.grade || null, section: sec?.name || '', school: sch?.name || '' };
  };

  /* ----- Account actions ----- */
  async function login(id, pw) {
    const u = findByLogin(id);
    if (!u || !(await checkPassword(u, pw))) fail('pw', 'That User ID and password do not match. Check both and try again.', 401);
    if (u.role !== 'admin' && school(u.schoolId)?.active === false) fail('uid', 'Your school\'s VINC Lab account is paused. Please contact your school.', 403);
    u.lastLogin = Date.now(); db.saveUser(u);
    return u;
  }
  async function changeOwnPassword(me, current, next) {
    if (!(await checkPassword(me, current))) fail('current', 'Your current password is not right.');
    if (typeof next !== 'string' || next.length < 8) fail('next', 'Use at least 8 characters.');
    Object.assign(me, await hashPassword(next)); delete me.pwTemp; db.saveUser(me);
    await db.commit();
  }
  async function linkChild(me, code) {
    if (me.role !== 'parent') fail('code', 'Only parents link children.', 403);
    const kid = users().find(x => x.role === 'student' && x.familyCode === str(code, 6).toUpperCase());
    if (!kid) fail('code', 'We could not find that family code.');
    if ((me.childIds || []).includes(kid.id)) fail('code', `${kid.name} is already linked to your account.`);
    await db.tx(() => {
      me.childIds = [...(me.childIds || []), kid.id];
      if (!me.schoolId) me.schoolId = kid.schoolId;
      db.saveUser(me);
      if (!kid.parentId || !user(kid.parentId)) { kid.parentId = me.id; db.saveUser(kid); }
      db.addLog({ who: me.name, what: `linked to ${kid.name} as a parent`, schoolId: kid.schoolId });
    });
    return kid;
  }
  async function resetAll() {
    db.wipe();
    db.meta.set('createdAt', Date.now());
    await ensureAdmin();
    return user('u_admin');
  }

  return { ensureAdmin, startSession, actorFrom, snapshot, applyChanges, signUp, publicSchools, familyLookup, loginTaken, login, changeOwnPassword, linkChild, resetAll, user, manages, ROLES };
}
