// Restore a backup made by backup.js. This REPLACES all VINC Lab data in the database.
// Stop the app first (docker compose stop vinclab), then: node server/restore.js backups/vinclab-....json.gz --yes
import pg from 'pg';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';

const [file, flag] = process.argv.slice(2);
if (!file) { console.error('Usage: node server/restore.js <backup.json.gz> --yes'); process.exit(1); }
const dump = JSON.parse(gunzipSync(readFileSync(file)).toString('utf8'));
if (dump.app !== 'vinclab') { console.error('That file is not a VINC Lab backup.'); process.exit(1); }
const counts = Object.entries(dump.tables).map(([t, r]) => `${t} ${r.length}`).join(', ');
if (flag !== '--yes') { console.error(`This replaces ALL current data with the backup from ${dump.at} (${counts}).\nRun again with --yes to go ahead.`); process.exit(1); }

const COLS = {
  users: ['id', 'role', 'school_id', 'login', 'data', 'pw_salt', 'pw_hash', 'updated_at'],
  schools: ['id', 'data', 'updated_at'],
  progress: ['student_id', 'school_id', 'data', 'updated_at'],
  log: ['at', 'school_id', 'who', 'what'],
  sessions: ['token_hash', 'user_id', 'by_user', 'created_at', 'last_seen'],
  meta: ['k', 'v'],
};
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  await client.query('BEGIN');
  for (const t of Object.keys(COLS)) await client.query(`DELETE FROM ${t}`);
  for (const [t, cols] of Object.entries(COLS)) {
    for (const row of dump.tables[t] || []) {
      const vals = cols.map(c => (c === 'data' ? JSON.stringify(row[c]) : row[c]));
      await client.query(`INSERT INTO ${t} (${cols.join(', ')}) VALUES (${cols.map((_, i) => `$${i + 1}`).join(', ')})`, vals);
    }
  }
  await client.query('COMMIT');
  console.log(`Restored the backup from ${dump.at} (${counts}). Start the app again: docker compose start vinclab`);
} catch (e) {
  await client.query('ROLLBACK');
  console.error('Restore failed, nothing was changed:', e.message);
  process.exitCode = 1;
} finally { await client.end(); }
