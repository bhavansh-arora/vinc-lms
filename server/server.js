// VINC Lab server: the website plus a small JSON API. No dependencies beyond Node.js itself.
// Start: node --disable-warning=ExperimentalWarning server/server.js   (settings: see server/README.md)
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { join, normalize, extname, resolve, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDb } from './db.js';
import { createLogic, LOGIN_RULE, normLogin } from './logic.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const PORT = +(process.env.PORT || 3100);
const HOST = process.env.HOST || '127.0.0.1';
const SITE_DIR = resolve(process.env.SITE_DIR || ROOT);
const TRUST_PROXY = process.env.TRUST_PROXY !== '0';
const VERSION = '1';

const db = await openDb(process.env.DATABASE_URL);
const logic = createLogic(db, { adminPassword: process.env.ADMIN_PASSWORD || 'Qwerty@21' });
await logic.ensureAdmin();
db.session.prune(60 * 86400000);
setInterval(() => { db.session.prune(60 * 86400000); db.trimLog(); }, 6 * 3600000).unref();

/* ---------- Rate limits (logins, sign-ups and code lookups) ---------- */
const hits = new Map();
function limited(key, max, windowMs) {
  const now = Date.now();
  const h = hits.get(key);
  if (!h || now - h.start > windowMs) { hits.set(key, { start: now, n: 1 }); return false; }
  h.n++;
  return h.n > max;
}
// Failed attempts only (used for logins).
const WINDOW = 15 * 60000;
const tooMany = (key, max) => { const h = hits.get(key); return !!h && Date.now() - h.start < WINDOW && h.n >= max; };
const miss = key => { const h = hits.get(key); if (!h || Date.now() - h.start > WINDOW) hits.set(key, { start: Date.now(), n: 1 }); else h.n++; };
setInterval(() => { const now = Date.now(); for (const [k, h] of hits) if (now - h.start > 3600000) hits.delete(k); }, 600000).unref();

/* ---------- Helpers ---------- */
const ipOf = req => (TRUST_PROXY && String(req.headers['x-forwarded-for'] || '').split(',')[0].trim()) || req.socket.remoteAddress || '?';
const SEC_HEADERS = { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin', 'X-Frame-Options': 'SAMEORIGIN', 'Permissions-Policy': 'camera=(self), microphone=(), geolocation=()' };
// Every reply waits until the changes made while handling the request are safely in Postgres.
async function send(res, status, body, headers = {}) {
  if (status < 400) await db.commit();
  const data = typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...SEC_HEADERS, ...headers });
  res.end(data);
}
const err = (res, status, message, field) => send(res, status, { error: message, field });
function readJson(req, limit) {
  return new Promise((ok, bad) => {
    let size = 0; const parts = [];
    req.on('data', c => { size += c.length; if (size > limit) { bad(Object.assign(new Error('That upload is too large.'), { status: 413 })); req.destroy(); } else parts.push(c); });
    req.on('end', () => { try { ok(parts.length ? JSON.parse(Buffer.concat(parts).toString('utf8')) : {}); } catch { bad(Object.assign(new Error('Bad request.'), { status: 400 })); } });
    req.on('error', bad);
  });
}
const tokenOf = req => { const m = /^Bearer\s+(.+)$/i.exec(req.headers.authorization || ''); return m ? m[1].trim() : null; };

/* ---------- API ---------- */
async function api(req, res, path, url) {
  const ip = ipOf(req);
  const method = req.method;
  const actor = logic.actorFrom(tokenOf(req));
  const needAuth = () => { if (!actor) { err(res, 401, 'Please log in again.'); return false; } return true; };
  const body = async (limit = 64 * 1024) => (method === 'POST' ? readJson(req, limit) : {});

  if (path === '/api/health') return send(res, 200, { ok: true, version: VERSION });

  if (path === '/api/login' && method === 'POST') {
    const b = await body();
    const id = normLogin(b.login);
    if (!id) return err(res, 400, 'Enter your User ID.', 'uid');
    if (!b.password) return err(res, 400, 'Enter your password.', 'pw');
    // Only wrong passwords count: 10 per User ID and 100 per network (a whole school can share one) in 15 minutes.
    if (tooMany(`login:${ip}`, 100) || tooMany(`login:${ip}:${id}`, 10)) return err(res, 429, 'Too many wrong tries. Wait 15 minutes and try again.', 'pw');
    let u;
    try { u = await logic.login(id, String(b.password)); } catch (e) { if (e.status === 401) { miss(`login:${ip}`); miss(`login:${ip}:${id}`); } throw e; }
    hits.delete(`login:${ip}:${id}`);
    const token = logic.startSession(u);
    return send(res, 200, { token, me: u.id, data: logic.snapshot({ u }) });
  }
  if (path === '/api/signup' && method === 'POST') {
    if (limited(`signup:${ip}`, 20, 60 * 60000)) return err(res, 429, 'Too many sign-ups from this network. Try again later.');
    const b = await body();
    const u = await logic.signUp(String(b.role || ''), b.fields);
    const token = logic.startSession(u);
    return send(res, 200, { token, me: u.id, data: logic.snapshot({ u }) });
  }
  if (path === '/api/public/schools') return send(res, 200, { schools: logic.publicSchools() });
  if (path === '/api/public/family') {
    if (limited(`family:${ip}`, 60, 15 * 60000)) return err(res, 429, 'Too many tries. Wait a few minutes.');
    return send(res, 200, { child: logic.familyLookup(url.searchParams.get('code')) });
  }
  if (path === '/api/public/login-available') {
    if (limited(`avail:${ip}`, 300, 15 * 60000)) return err(res, 429, 'Too many checks. Wait a few minutes.');
    const id = normLogin(url.searchParams.get('login'));
    const except = actor ? actor.u.id : null;
    return send(res, 200, { valid: LOGIN_RULE.test(id), available: LOGIN_RULE.test(id) && !logic.loginTaken(id, except) });
  }

  if (path === '/api/me') {
    if (!needAuth()) return;
    return send(res, 200, { me: actor.u.id, by: actor.by, data: logic.snapshot(actor) });
  }
  if (path === '/api/logout' && method === 'POST') {
    if (actor) db.session.del(actor.tokenHash);
    return send(res, 200, { ok: true });
  }
  if (path === '/api/sync' && method === 'POST') {
    if (!needAuth()) return;
    const b = await body(25 * 1024 * 1024);
    const errors = await logic.applyChanges(actor, b.changes || {});
    const fresh = logic.actorFrom(tokenOf(req));
    if (!fresh) return err(res, 401, 'Your account is no longer available.');
    return send(res, 200, { errors, me: fresh.u.id, data: logic.snapshot(fresh) });
  }
  if (path === '/api/password' && method === 'POST') {
    if (!needAuth()) return;
    if (limited(`pw:${actor.u.id}`, 10, 15 * 60000)) return err(res, 429, 'Too many tries. Wait 15 minutes.', 'current');
    const b = await body();
    await logic.changeOwnPassword(actor.u, String(b.current || ''), b.next);
    return send(res, 200, { ok: true, data: logic.snapshot(actor) });
  }
  if (path === '/api/link-child' && method === 'POST') {
    if (!needAuth()) return;
    if (limited(`link:${actor.u.id}`, 20, 15 * 60000)) return err(res, 429, 'Too many tries. Wait a few minutes.', 'code');
    const b = await body();
    const kid = await logic.linkChild(actor.u, b.code);
    return send(res, 200, { child: { id: kid.id, name: kid.name }, data: logic.snapshot(actor) });
  }
  if (path === '/api/impersonate' && method === 'POST') {
    if (!needAuth()) return;
    if (actor.u.role !== 'admin') return err(res, 403, 'Only the admin can do this.');
    const b = await body();
    const t = logic.user(b.userId);
    if (!t || t.role === 'admin') return err(res, 404, 'That account was not found.');
    return send(res, 200, { token: logic.startSession(t, actor.u.id), me: t.id });
  }
  if (path === '/api/admin/reset' && method === 'POST') {
    if (!needAuth()) return;
    if (actor.u.role !== 'admin' || actor.by) return err(res, 403, 'Only the admin can do this.');
    const a = await logic.resetAll();
    const token = logic.startSession(a);
    return send(res, 200, { token, me: a.id, data: logic.snapshot({ u: a }) });
  }
  return err(res, 404, 'Not found.');
}

/* ---------- Website files ---------- */
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.txt': 'text/plain; charset=utf-8', '.pdf': 'application/pdf', '.webmanifest': 'application/manifest+json' };
const TEXT = new Set(['.html', '.js', '.mjs', '.css', '.json', '.svg', '.txt', '.webmanifest']);
// Only the website itself is served: top-level pages and the assets folder. Everything else in the
// app folder (server code, deploy scripts, Docker files, backups, notes) is never sent.
const ALLOWED = /^\/(?:[\w-]+\.html|assets\/[\w./ -]+|favicon\.(?:ico|svg|png)|robots\.txt)$/;
const allowed = p => ALLOWED.test(p) && !p.split('/').some(seg => seg.startsWith('.'));
const gzCache = new Map();

async function serveFile(req, res, path) {
  let p;
  try { p = decodeURIComponent(path); } catch { return err(res, 400, 'Bad path.'); }
  if (p === '/' || p === '') p = '/index.html';
  if (!allowed(p) || p.includes('\0')) return send(res, 404, 'Not found', { 'Content-Type': 'text/plain' });
  const file = normalize(join(SITE_DIR, p));
  if (file !== SITE_DIR && !file.startsWith(SITE_DIR + sep)) return send(res, 404, 'Not found', { 'Content-Type': 'text/plain' });
  let info;
  try { info = await stat(file); if (!info.isFile()) throw new Error('not a file'); } catch { return send(res, 404, 'Not found', { 'Content-Type': 'text/plain' }); }
  const ext = extname(file).toLowerCase();
  const etag = `W/"${info.size.toString(36)}-${Math.round(info.mtimeMs).toString(36)}"`;
  const headers = { 'Content-Type': TYPES[ext] || 'application/octet-stream', ETag: etag, 'Cache-Control': TEXT.has(ext) ? 'no-cache' : 'public, max-age=86400', ...SEC_HEADERS };
  if (req.headers['if-none-match'] === etag) { res.writeHead(304, headers); return res.end(); }
  let data = await readFile(file);
  if (TEXT.has(ext) && data.length > 1024 && /\bgzip\b/.test(req.headers['accept-encoding'] || '')) {
    const key = `${file}|${etag}`;
    let gz = gzCache.get(key);
    if (!gz) { gz = gzipSync(data); gzCache.set(key, gz); if (gzCache.size > 400) gzCache.delete(gzCache.keys().next().value); }
    data = gz; headers['Content-Encoding'] = 'gzip'; headers.Vary = 'Accept-Encoding';
  }
  headers['Content-Length'] = data.length;
  res.writeHead(200, headers);
  res.end(req.method === 'HEAD' ? undefined : data);
}

/* ---------- Server ---------- */
const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const path = url.pathname;
  try {
    if (path.startsWith('/api/')) return await api(req, res, path, url);
    if (req.method !== 'GET' && req.method !== 'HEAD') return err(res, 405, 'Method not allowed.');
    return await serveFile(req, res, path);
  } catch (e) {
    if (!e.status) console.error(new Date().toISOString(), req.method, path, e);
    if (!res.headersSent) err(res, e.status || 500, e.status ? e.message : 'Something went wrong on the server. Please try again.', e.field);
  }
});
server.requestTimeout = 120000;
server.listen(PORT, HOST, () => console.log(`VINC Lab is running on http://${HOST}:${PORT} (Postgres connected)`));
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { server.close(); db.close().finally(() => process.exit(0)); });
