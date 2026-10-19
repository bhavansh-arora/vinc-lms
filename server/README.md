# VINC Lab server

A small Node.js server that serves the website and the `/api/*` endpoints and keeps all data in
PostgreSQL (its own database and role, for example `vinc_lms`). On a VPS it runs in Docker; see
[DEPLOY.md](../DEPLOY.md).

- Passwords are hashed with scrypt on the server and never sent to browsers.
- Each person receives only the data their role may see: the admin everything, a coordinator
  their school, a teacher their classes, a student their own work, a parent their children.
- Every change a browser sends is checked against the sender's role before it is stored
  (`logic.js`). Changed records arrive with the version the sender last saw, so only the fields
  they changed are applied and an older open tab cannot undo someone else's newer change.
- Wrong passwords are rate-limited (10 per User ID and 100 per network, every 15 minutes).
- Only the website pages and `assets/` are served; code, scripts and settings files never are.

## Run locally

```sh
cd server && npm install && cd ..
DATABASE_URL=postgresql://vinc_lms:PASSWORD@127.0.0.1:5432/vinc_lms node server/server.js
```

Needs Node.js 20 or newer. Tables are created on first start.

| Variable | Default | What it does |
|---|---|---|
| `DATABASE_URL` | (required) | `postgresql://vinc_lms:PASSWORD@HOST:5432/vinc_lms` |
| `PORT` | `3100` | Port to listen on |
| `HOST` | `127.0.0.1` | Address to listen on (`0.0.0.0` inside a Docker network) |
| `SITE_DIR` | the repo root | Folder with `index.html`, `app.html` and `assets/` |
| `ADMIN_PASSWORD` | `Qwerty@21` | Password for the `admin` login, used only when the database is first created |
| `TRUST_PROXY` | `1` | Read the client IP from `X-Forwarded-For` (for rate limits) |
| `BACKUP_DIR` | `./backups` | Where backups are written |

Health check: `GET /api/health` returns `{"ok":true}`.

## Backups

```sh
node server/backup.js                       # writes BACKUP_DIR/vinclab-YYYYMMDD-HHMMSS.json.gz, keeps 14
node server/restore.js FILE.json.gz --yes   # replaces ALL data with the backup (stop the app first)
```

## Files

| File | What it does |
|---|---|
| `server.js` | HTTP server: API routes, rate limits, static files |
| `logic.js` | Logins, sign-up, what each role sees, which changes each role may make |
| `db.js` | Postgres storage with an in-memory copy; each request's writes go in one transaction |
| `backup.js`, `restore.js` | Backups as gzipped JSON |

The browser side is `assets/js/app/store.js`: it detects the server at start-up (`/api/health`)
and then loads and saves through it. Without a server (plain static hosting) it keeps everything
in the browser instead.
