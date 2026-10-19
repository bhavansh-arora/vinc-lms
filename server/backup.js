// Backup: every VINC Lab table written to one gzipped JSON file, then old backups are deleted.
// Run inside the app container: node server/backup.js   (needs DATABASE_URL; BACKUP_DIR defaults to ./backups)
// On the VPS, deploy/backup.sh runs this every few hours, together with a native pg_dump.
// Restore with: node server/restore.js <file>
//
// Which backups are kept (both the .json.gz files and the .dump files made by deploy/backup.sh):
//   - every backup from the last BACKUP_KEEP_HOURS hours (default 48), and
//   - the newest backup of each day for BACKUP_KEEP_DAYS days (default 30).
// Everything older is deleted.
import pg from 'pg';
import { mkdirSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

pg.types.setTypeParser(20, v => (v == null ? null : Number(v)));
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = resolve(process.env.BACKUP_DIR || join(ROOT, 'backups'));
const KEEP_HOURS = +(process.env.BACKUP_KEEP_HOURS || 48);
const KEEP_DAYS = +(process.env.BACKUP_KEEP_DAYS || 30);
export const TABLES = ['users', 'schools', 'progress', 'log', 'sessions', 'meta'];

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
const dump = { app: 'vinclab', format: 1, at: new Date().toISOString(), tables: {} };
await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
for (const t of TABLES) dump.tables[t] = (await client.query(`SELECT * FROM ${t}`)).rows;
await client.query('COMMIT');
await client.end();

mkdirSync(DIR, { recursive: true, mode: 0o700 });
// deploy/backup.sh passes BACKUP_STAMP so its .dump and this .json.gz carry the same time.
const stamp = /^\d{8}-\d{6}$/.test(process.env.BACKUP_STAMP || '') ? process.env.BACKUP_STAMP
  : new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);
const out = join(DIR, `vinclab-${stamp}.json.gz`);
writeFileSync(out, gzipSync(JSON.stringify(dump)), { mode: 0o600 });
console.log(`Backup written: ${out} (${Object.entries(dump.tables).map(([t, r]) => `${t} ${r.length}`).join(', ')})`);
prune();

// Delete old backups, separately for each kind (.json.gz and .dump).
function prune() {
  const now = Date.now();
  const removed = [];
  for (const ext of ['json.gz', 'dump']) {
    const re = new RegExp(`^vinclab-(\\d{4})(\\d{2})(\\d{2})-(\\d{2})(\\d{2})(\\d{2})\\.${ext.replace('.', '\\.')}$`);
    const files = readdirSync(DIR).map(f => { const m = re.exec(f); return m && { f, day: `${m[1]}${m[2]}${m[3]}`, at: Date.UTC(+m[1], m[2] - 1, +m[3], +m[4], +m[5], +m[6]) }; })
      .filter(Boolean).sort((a, b) => b.at - a.at); // newest first
    const keptDays = new Set();
    for (const b of files) {
      const age = now - b.at;
      if (age <= KEEP_HOURS * 3600000) { keptDays.add(b.day); continue; }            // recent: keep all
      if (age <= KEEP_DAYS * 86400000 && !keptDays.has(b.day)) { keptDays.add(b.day); continue; } // newest of its day
      unlinkSync(join(DIR, b.f)); removed.push(b.f);
    }
  }
  if (removed.length) console.log(`Deleted ${removed.length} old backup${removed.length === 1 ? '' : 's'} (keeping ${KEEP_HOURS} h of backups, then one a day for ${KEEP_DAYS} days).`);
}
