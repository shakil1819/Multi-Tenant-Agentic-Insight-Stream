# syntax=docker/dockerfile:1

FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
EXPOSE 3000
# On container start: wait for weaviate, setup schema+seed, then run server
CMD ["sh", "-c", "node dist/scripts/wait-for-weaviate.js && node dist/scripts/create-schema.js && node dist/scripts/seed.js && node dist/src/server.js"]
