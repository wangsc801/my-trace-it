# deps: use bun to install (respects bun.lock), then hand node_modules to Node.
FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# build: run `react-router build` with real Node. SPA mode prerenders index.html
# by executing Node/SSR streaming code (entry.server); bun's Node-compat layer
# returns a 500 there (Prerender: Received a 500 from entry.server.tsx), so we
# avoid bun for this step.
FROM node:24-alpine AS build
WORKDIR /app
ARG VITE_API_BASE_URL=http://localhost:8833
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npx react-router build

# Runtime: nginx 静态托管 build/client，SPA 路由回退 + 静态资源长缓存
FROM nginx:alpine
COPY --from=build /app/build/client /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80