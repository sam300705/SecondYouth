FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S secondyouth && adduser -S secondyouth -G secondyouth
COPY --from=build --chown=secondyouth:secondyouth /app/package*.json ./
COPY --from=build --chown=secondyouth:secondyouth /app/node_modules ./node_modules
COPY --from=build --chown=secondyouth:secondyouth /app/server ./server
COPY --from=build --chown=secondyouth:secondyouth /app/dist ./dist
USER secondyouth
EXPOSE 8787
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD node -e "fetch('http://127.0.0.1:8787/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server/index.mjs"]
