FROM node:lts-alpine3.23 AS builder

WORKDIR /app

COPY ./package*.json .

RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["node", "node_modules/.bin/next", "start"]

FROM node:lts-alpine3.23 AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy the standalone server + pruned node_modules
COPY --from=builder /app/.next/standalone ./

# Copy static assets (standalone doesn't include these)
COPY --from=builder /app/.next/static ./.next/static

# Copy public folder (images, fonts, favicon, etc.)
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]