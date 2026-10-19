# VINC Lab web app: website + /api, one Node.js process.
# Built and run by docker-compose.yml (see DEPLOY.md).
FROM node:22-alpine

LABEL org.vinclab.app="vinclab"

ENV NODE_ENV=production \
    PORT=3100 \
    HOST=0.0.0.0 \
    SITE_DIR=/app \
    BACKUP_DIR=/app/backups

WORKDIR /app

# Dependencies first, so code changes don't re-download them.
COPY server/package*.json server/
RUN cd server \
 && if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi \
 && npm cache clean --force

COPY index.html app.html lab-dev.html ./
COPY assets/ assets/
COPY server/ server/

# A dedicated user ID (10001), so no login account on the host shares it and can read backups.
RUN addgroup -S -g 10001 vinclab && adduser -S -D -H -u 10001 -G vinclab vinclab \
 && mkdir -p /app/backups && chown vinclab:vinclab /app/backups && chmod 700 /app/backups

USER vinclab
EXPOSE 3100

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/api/health" >/dev/null || exit 1

CMD ["node", "server/server.js"]
