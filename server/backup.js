// Backup: every VINC Lab table written to one gzipped JSON file. Keeps the newest 14.
// Run inside the app container: node server/backup.js   (needs DATABASE_URL; BACKUP_DIR defaults to ./backups)
// Restore with: node server/restore.js <file>
import pg from 'pg';
import { mkdirSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

pg.types.setTypeParser(20, v => (v == null ? null : Number(v)));
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = resolve(process.env.BACKUP_DIR || join(ROOT, 'backups'));
const KEEP = +(process.env.BACKUP_KEEP || 14);
export const TABLES = ['users', 'schools', 'progress', 'log', 'sessions', 'meta'];

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
const dump = { app: 'vinclab', format: 1, at: new Date().toISOString(), tables: {} };
await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
for (const t of TABLES) dump.tables[t] = (await client.query(`SELECT * FROM ${t}`)).rows;
await client.query('COMMIT');
await client.end();

mkdirSync(DIR, { recursive: true, mode: 0o700 });
const stamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);
const out = join(DIR, `vinclab-${stamp}.json.gz`);
writeFileSync(out, gzipSync(JSON.stringify(dump)), { mode: 0o600 });
const all = readdirSync(DIR).filter(f => /^vinclab-\d{8}-\d{6}\.json\.gz$/.test(f)).sort();
for (const f of all.slice(0, Math.max(0, all.length - KEEP))) unlinkSync(join(DIR, f));
console.log(`Backup written: ${out} (${Object.entries(dump.tables).map(([t, r]) => `${t} ${r.length}`).join(', ')})`);
