# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim

WORKDIR /app/server

COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY server/ ./

ENV NODE_ENV=production \
    PORT=3001 \
    DB_PATH=/data/events.sqlite \
    UPLOAD_DIR=/data/uploads

RUN mkdir -p /data/uploads

EXPOSE 3001

CMD ["node", "--use-system-ca", "index.js"]
