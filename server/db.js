// Storage: PostgreSQL (its own database and role, e.g. vinc_lms) with an in-memory copy of every
// record. Reads come from memory. Writes are queued while a request runs and then committed to
// Postgres in one transaction; if a commit fails, the memory copy is reloaded from Postgres.
import pg from 'pg';

pg.types.setTypeParser(20, v => (v == null ? null : Number(v))); // bigint -> number (timestamps in ms)

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, role TEXT NOT NULL, school_id TEXT, login TEXT NOT NULL UNIQUE,
    data JSONB NOT NULL, pw_salt TEXT, pw_hash TEXT, updated_at BIGINT NOT NULL);
  CREATE INDEX IF NOT EXISTS users_school ON users (school_id);
  CREATE TABLE IF NOT EXISTS schools (id TEXT PRIMARY KEY, data JSONB NOT NULL, updated_at BIGINT NOT NULL);
  CREATE TABLE IF NOT EXISTS progress (student_id TEXT PRIMARY KEY, school_id TEXT, data JSONB NOT NULL, updated_at BIGINT NOT NULL);
  CREATE TABLE IF NOT EXISTS log (id BIGSERIAL PRIMARY KEY, at BIGINT NOT NULL, school_id TEXT, who TEXT, what TEXT);
  CREATE INDEX IF NOT EXISTS log_school_at ON log (school_id, at DESC);
  CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL, by_user TEXT, created_at BIGINT NOT NULL, last_seen BIGINT NOT NULL);
  CREATE INDEX IF NOT EXISTS sessions_user ON sessions (user_id);
  CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT);
`;

export async function openDb(url, { log = console } = {}) {
  if (!url) throw new Error('DATABASE_URL is not set. Example: postgresql://vinc_lms:PASSWORD@127.0.0.1:5432/vinc_lms');
  const pool = new pg.Pool({ connectionString: url, max: 4, idleTimeoutMillis: 30000, connectionTimeoutMillis: 10000 });
  pool.on('error', e => log.error('Postgres connection error:', e.message));
  await pool.query(SCHEMA);

  const mem = { users: new Map(), schools: new Map(), progress: new Map(), log: [], sessions: new Map(), meta: new Map() };
  async function loadAll() {
    const [u, s, p, l, ss, m] = await Promise.all([
      pool.query('SELECT * FROM users'), pool.query('SELECT * FROM schools'), pool.query('SELECT * FROM progress'),
      pool.query('SELECT at, school_id, who, what FROM log ORDER BY at DESC, id DESC LIMIT 5000'),
      pool.query('SELECT * FROM sessions'), pool.query('SELECT * FROM meta'),
    ]);
    mem.users.clear(); mem.schools.clear(); mem.progress.clear(); mem.sessions.clear(); mem.meta.clear();
    for (const r of u.rows) mem.users.set(r.id, { ...r.data, _salt: r.pw_salt, _hash: r.pw_hash });
    for (const r of s.rows) mem.schools.set(r.id, r.data);
    for (const r of p.rows) mem.progress.set(r.student_id, r.data);
    mem.log = l.rows.map(r => ({ at: r.at, schoolId: r.school_id, who: r.who, what: r.what }));
    for (const r of ss.rows) mem.sessions.set(r.token_hash, { user_id: r.user_id, by_user: r.by_user, created_at: r.created_at, last_seen: r.last_seen });
    for (const r of m.rows) mem.meta.set(r.k, r.v);
  }
  await loadAll();

  // Queued writes. commit() sends everything queued so far as one transaction; commits run one
  // after another so they reach Postgres in the order the changes were made.
  let queue = [];
  let chain = Promise.resolve();
  let auto = null;
  const q = (text, values) => { queue.push({ text, values }); if (!auto) auto = setImmediate(() => { auto = null; commit().catch(() => {}); }); };
  function commit() {
    const batch = queue; queue = [];
    if (auto) { clearImmediate(auto); auto = null; }
    const run = chain.then(async () => {
      if (!batch.length) return;
      const c = await pool.connect();
      try {
        await c.query('BEGIN');
        for (const op of batch) await c.query(op.text, op.values);
        await c.query('COMMIT');
      } catch (e) {
        try { await c.query('ROLLBACK'); } catch { /* ignore */ }
        log.error('Saving to Postgres failed, reloading:', e.message);
        await loadAll();
        throw Object.assign(new Error('Could not save. Please try again.'), { status: 503 });
      } finally { c.release(); }
    });
    chain = run.catch(() => {});
    return run;
  }

  const now = () => Date.now();
  const publicData = u => { const { _salt, _hash, ...rest } = u; return rest; };

  return {
    mem,
    commit,
    // Run fn (which changes memory and queues writes), then commit. If fn throws, nothing is
    // written and memory is reloaded from Postgres.
    async tx(fn) {
      let out;
      const mark = queue.length;
      try { out = fn(); } catch (e) { queue.length = mark; await loadAll(); throw e; }
      await commit();
      return out;
    },
    saveUser(u) {
      mem.users.set(u.id, u);
      q(`INSERT INTO users (id, role, school_id, login, data, pw_salt, pw_hash, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, school_id = EXCLUDED.school_id, login = EXCLUDED.login, data = EXCLUDED.data,
         pw_salt = EXCLUDED.pw_salt, pw_hash = EXCLUDED.pw_hash, updated_at = EXCLUDED.updated_at`,
      [u.id, u.role, u.schoolId || null, u.login, JSON.stringify(publicData(u)), u._salt || null, u._hash || null, now()]);
    },
    deleteUser(id) {
      mem.users.delete(id);
      for (const [h, s] of mem.sessions) if (s.user_id === id) mem.sessions.delete(h);
      q('DELETE FROM users WHERE id = $1', [id]);
      q('DELETE FROM sessions WHERE user_id = $1', [id]);
    },
    saveSchool(s) { mem.schools.set(s.id, s); q(`INSERT INTO schools (id, data, updated_at) VALUES ($1,$2,$3) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at`, [s.id, JSON.stringify(s), now()]); },
    deleteSchool(id) { mem.schools.delete(id); mem.log = mem.log.filter(l => l.schoolId !== id); q('DELETE FROM schools WHERE id = $1', [id]); q('DELETE FROM log WHERE school_id = $1', [id]); },
    saveProgress(studentId, schoolId, p) { mem.progress.set(studentId, p); q(`INSERT INTO progress (student_id, school_id, data, updated_at) VALUES ($1,$2,$3,$4) ON CONFLICT (student_id) DO UPDATE SET school_id = EXCLUDED.school_id, data = EXCLUDED.data, updated_at = EXCLUDED.updated_at`, [studentId, schoolId || null, JSON.stringify(p), now()]); },
    deleteProgress(id) { mem.progress.delete(id); q('DELETE FROM progress WHERE student_id = $1', [id]); },
    addLog(entry) {
      const e = { at: +entry.at || now(), schoolId: entry.schoolId || null, who: String(entry.who || '').slice(0, 80), what: String(entry.what || '').slice(0, 300) };
      mem.log.unshift(e); if (mem.log.length > 5000) mem.log.length = 5000;
      q('INSERT INTO log (at, school_id, who, what) VALUES ($1,$2,$3,$4)', [e.at, e.schoolId, e.who, e.what]);
    },
    trimLog() { q('DELETE FROM log WHERE id IN (SELECT id FROM log ORDER BY at DESC OFFSET 20000)', []); },
    session: {
      put(hash, userId, by) { const s = { user_id: userId, by_user: by || null, created_at: now(), last_seen: now() }; mem.sessions.set(hash, s); q('INSERT INTO sessions (token_hash, user_id, by_user, created_at, last_seen) VALUES ($1,$2,$3,$4,$5)', [hash, userId, s.by_user, s.created_at, s.last_seen]); },
      get: hash => mem.sessions.get(hash) || null,
      touch(hash) { const s = mem.sessions.get(hash); if (!s) return; s.last_seen = now(); q('UPDATE sessions SET last_seen = $1 WHERE token_hash = $2', [s.last_seen, hash]); },
      del(hash) { mem.sessions.delete(hash); q('DELETE FROM sessions WHERE token_hash = $1', [hash]); },
      prune(maxAgeMs) { const cut = now() - maxAgeMs; for (const [h, s] of mem.sessions) if (s.last_seen < cut) mem.sessions.delete(h); q('DELETE FROM sessions WHERE last_seen < $1', [cut]); },
    },
    meta: {
      get: k => mem.meta.get(k) ?? null,
      set(k, v) { mem.meta.set(k, String(v)); q('INSERT INTO meta (k, v) VALUES ($1,$2) ON CONFLICT (k) DO UPDATE SET v = EXCLUDED.v', [k, String(v)]); },
    },
    // Remove everything (admin "Delete all data").
    wipe() {
      mem.users.clear(); mem.schools.clear(); mem.progress.clear(); mem.sessions.clear(); mem.log = [];
      for (const t of ['users', 'schools', 'progress', 'log', 'sessions']) q(`DELETE FROM ${t}`, []);
    },
    pool,
    async close() { await commit().catch(() => {}); await pool.end(); },
  };
}
