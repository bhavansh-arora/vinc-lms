# Putting VINC Lab online

This guide puts VINC Lab at **https://lms.vinc-lab.com** on the shared VPS. The app runs in its
own Docker container (it does not touch the other projects), keeps its data in a database called
`vinc_lms` inside the existing PostgreSQL container, and goes through the web server that already
handles the other sites.

You need: SSH access to the VPS as a user who can run `sudo`, and access to the DNS settings
for `vinc-lab.com`. It takes about 15 minutes.

## 1. The database

By default the installer gives VINC Lab **its own PostgreSQL 18 container** (`vinclab-db`), so
nothing is shared with the other projects:

- it sits on a private Docker network that only the VINC Lab app can reach (no other container,
  no port on the server, no internet access);
- its password is generated automatically and kept in `/opt/vinclab/.env`;
- its data lives in the Docker volume `vinclab-pgdata`, which survives updates, restarts and even
  an uninstall.

**There is nothing to do for this step.** The installer creates and starts it.

<details><summary>Using a database in an existing PostgreSQL container instead (optional)</summary>

Add `--db shared` to the install command. First create the database inside that container
(replace the container name and admin user, shown by
`sudo docker inspect -f '{{range .Config.Env}}{{println .}}{{end}}' CONTAINER | grep POSTGRES_USER`):

```sh
sudo docker exec -it CONTAINER psql -U ADMIN-USER -d postgres
```
```sql
CREATE ROLE vinc_lms LOGIN PASSWORD 'your-strong-password';
CREATE DATABASE vinc_lms OWNER vinc_lms;
REVOKE ALL ON DATABASE vinc_lms FROM PUBLIC;
\q
```

If that PostgreSQL is not published on the server (`docker ps` shows only `5432/tcp`), the app
joins its Docker network and reaches it by container name. That gives the app network access to
the other containers on that network (not to their data), which is why the own container is the
default.
</details>

## 2. Point the domain at the server

In your DNS provider for `vinc-lab.com`, add a record:

| Type | Name  | Value                 |
|------|-------|-----------------------|
| A    | `lms` | the VPS's IP address  |

You can see the VPS's IP with `curl -4 https://api.ipify.org`. If you use Cloudflare, set the
record to **DNS only** (grey cloud) until HTTPS is working. DNS changes take a few minutes to an
hour to spread. You can install before the change has spread and run the installer again afterwards.

## 3. Install

SSH into the VPS and paste this command:

```sh
curl -fsSL https://raw.githubusercontent.com/bhavansh-arora/vinc-lms/main/deploy/install.sh | sudo bash -s -- --domain lms.vinc-lab.com
```

If the GitHub repository is **private**, the command above cannot download the installer. Clone
the repository first (git asks for your GitHub username, then a
[token](https://github.com/settings/personal-access-tokens/new) with *Contents: Read-only* as the
password), then run the installer from the clone:

```sh
git clone https://github.com/bhavansh-arora/vinc-lms.git ~/vinc-lms
sudo bash ~/vinc-lms/deploy/install.sh --domain lms.vinc-lab.com
```

The installer asks for:

- a **GitHub token**, only if the repository is private. The token is stored privately on the
  server so that updates work later.

Every step prints ✓ (done), ! (needs your attention) or ✗ (failed, with the reason). You can run
the installer again at any time. It repairs and updates the install and never deletes data. Add
`--dry-run` to see what it would do without changing anything.

### What the installer does

1. Checks that Docker and Docker Compose are installed.
2. Downloads the code to `/opt/vinclab`.
3. Finds out what serves ports 80/443 (the web server for the other sites) and where PostgreSQL is.
4. Writes the settings file `/opt/vinclab/.env` (readable only by root), then tests the database
   login before starting anything.
5. Builds and starts the `vinclab` container, then checks that it answers.
6. Sets up a nightly backup at 02:30.
7. Connects `lms.vinc-lab.com` to the app and sets up HTTPS (see below).

### How it connects to the web server

The installer chooses one of two **modes**:

- **Host mode** is for a web server installed directly on the VPS (nginx, Apache or Caddy). The
  app listens on `127.0.0.1:3100`, so only the server itself can reach it. The installer adds a
  separate site file for `lms.vinc-lab.com` and checks the configuration before reloading (if the
  check fails, it removes its file again). For nginx and Apache it also gets a free Let's Encrypt
  certificate; Caddy gets its own.
  If PostgreSQL is not published on the server (`docker ps` shows only `5432/tcp`, with no
  `127.0.0.1:5432->`), the app joins PostgreSQL's own Docker network and reaches it by container
  name; it still listens only on `127.0.0.1:3100`.
- **Docker mode** is for a web server that runs in a container. The app joins that container's
  Docker network and the PostgreSQL container's network. It does not open any port on the server.
  - **Traefik**, **nginx-proxy** and **caddy-docker-proxy** are set up automatically, with labels
    or settings in `/opt/vinclab/docker-compose.override.yml`. They get the certificate themselves.
  - **Nginx Proxy Manager** cannot be set up automatically. The installer prints the exact values
    to enter in its admin page: Domain `lms.vinc-lab.com`, Scheme `http`, Forward Hostname
    `vinclab`, Port `3100`, SSL tab: *Request a new SSL Certificate* and *Force SSL*.

For any other web server, the installer prints what to set up in it: send `lms.vinc-lab.com` to
`http://127.0.0.1:3100` (host mode) or `http://vinclab:3100` (docker mode).

To choose the mode yourself, run the installer with `--mode host` or `--mode docker`. If it
guesses a network wrong, run it with `--proxy-network NAME`, `--db-network NAME` or
`--db-host HOST`.

## 4. First login

1. Open **https://lms.vinc-lab.com**.
2. Log in with username **admin** and password **Qwerty@21**.
3. **Change the admin password straight away.**

The default password only applies the first time the app starts with an empty database. To use a
different one, add `--admin-password '...'` to the first install.

## Updating

To get the latest version:

```sh
sudo bash /opt/vinclab/deploy/update.sh
```

The update script backs up the database, downloads the new code, rebuilds and restarts the
container, checks the app, and prints the version it deployed. If the app does not come back up,
the script prints the command that returns to the previous version.

## Backups

- A backup is made every night at 02:30 into `/opt/vinclab/backups/`. The newest 14 are kept.
- Make one now: `sudo systemctl start vinclab-backup`
- See them: `sudo ls -lh /opt/vinclab/backups/`
- Copy them off the server from time to time, for example with
  `scp` or `rsync`. A backup that only exists on the VPS is lost if the VPS is lost.

### Restoring a backup

A restore **replaces all current data** with the data in the backup.

```sh
cd /opt/vinclab
sudo ls backups/                                   # pick a file
sudo docker compose stop vinclab                   # stop the app so nothing writes during the restore
sudo docker compose run --rm vinclab node server/restore.js /app/backups/FILE-NAME --yes
sudo docker compose start vinclab
```

Inside the container, the backups folder is `/app/backups`.

## Useful commands

All of these run from `/opt/vinclab`:

| What | Command |
|---|---|
| Is it running? | `sudo docker compose ps` |
| Live logs | `sudo docker compose logs -f` |
| Restart | `sudo docker compose restart` |
| Health check | `sudo docker compose exec vinclab wget -qO- http://127.0.0.1:3100/api/health` |
| Settings and secrets | `sudo nano .env`, then `sudo docker compose up -d` |
| Repair or redo the setup | `sudo bash deploy/install.sh` |
| Remove the app | `sudo bash deploy/uninstall.sh` (keeps backups and the database) |

## Troubleshooting

**"DNS: lms.vinc-lab.com does not point to this server."** The A record from step 2 is missing,
wrong, or has not spread yet. Check it with `dig +short lms.vinc-lab.com`. It must show the VPS's
IP. The installer skips the certificate until the record is right. Run it again once DNS is fixed.

**"The database rejected the password."** (`--db shared` only) Use the password you gave the database in step 1. To change the saved one,
edit the `DATABASE_URL` line in `/opt/vinclab/.env`, or delete the file and run the installer
again. If the password contains special characters, it is easiest to delete the file and let the
installer write it.

**"The database or its user does not exist yet."** (`--db shared` only) Create it as shown in step 1.

**"Could not reach Postgres."** PostgreSQL is published only on the server's own address
(`127.0.0.1:5432`), so containers cannot reach it through `host.docker.internal`, which points to
a different address. That is why the installer connects the app either through the server's
network (host mode) or through PostgreSQL's own Docker network (docker mode). Check that the
PostgreSQL container is running (`sudo docker ps`). If the installer picked the wrong network,
give the right one with `--db-network`. The command
`sudo docker inspect -f '{{json .NetworkSettings.Networks}}' CONTAINER-NAME` shows its networks.

**"The installer cannot set up ... automatically" / the site does not open.** Something
unfamiliar serves ports 80/443. Follow the printed instructions in that program, and send
`lms.vinc-lab.com` to the address the installer shows. The app itself keeps running either way.

**"Port 3100 is already used."** Another program uses that port. Run the installer again with
`--port 3110` (or another free port).

**Uploads fail with "413 Request Entity Too Large".** The web server limits upload size.
- Host nginx: the installer already sets `client_max_body_size 25m`.
- nginx-proxy: put `client_max_body_size 25m;` in its `vhost.d/lms.vinc-lab.com` file.
- Nginx Proxy Manager: add `client_max_body_size 25m;` under the proxy host's *Advanced* tab.

**The app does not start.** Look at `cd /opt/vinclab && sudo docker compose logs --tail 100`.
The most common cause is a database setting in `.env`.

**Firewall.** If HTTPS will not issue, check that ports 80 and 443 are open in any firewall of the
hosting provider (this applies to all sites on the server).

## Where things are

| Path | What it is |
|---|---|
| `/opt/vinclab` | App code (a git checkout of the `main` branch) |
| `/opt/vinclab/.env` | Settings and secrets (database URL, first admin password) |
| `/opt/vinclab/docker-compose.override.yml` | Networking and proxy settings, written by the installer |
| `/opt/vinclab/backups/` | Nightly backups |
| Container `vinclab-db`, volume `vinclab-pgdata` | All app data (own database; with `--db shared`, the `vinc_lms` database in that container) |
| `/var/log/vinclab-install.log` | Detailed installer log |
