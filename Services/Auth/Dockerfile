FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY Services/Auth/package*.json ./
RUN npm ci
COPY Services/Auth/tsconfig.json ./
COPY Services/Auth/src ./src
RUN npm run build && npm prune --omit=dev
FROM node:24-bookworm-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
USER node
EXPOSE 8080
CMD ["node","dist/main.js"]
