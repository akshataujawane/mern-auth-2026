# ---------- build frontend ----------
FROM node:20-alpine3.18 AS frontend

WORKDIR /client
COPY client/package*.json ./
RUN npm install

COPY client .
RUN npm run build


# ---------- production ----------
FROM node:20-alpine3.18

RUN apk update && apk upgrade

# create non-root user
RUN addgroup -S nodejs && adduser -S appuser -G nodejs

WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev

COPY api ./api

# copy frontend build to backend
COPY --from=frontend /client/dist ./api/client/dist

# give permission to non-root user
RUN chown -R appuser:nodejs /app

# switch to non-root user
USER appuser

WORKDIR /app/api

ENV NODE_ENV=production
ENV PORT=9191

EXPOSE 9191

CMD ["node", "index.js"]
