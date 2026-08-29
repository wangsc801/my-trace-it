# Build the React Router SPA (纯静态客户端) using bun, then serve statically via nginx.
FROM oven/bun:1 AS build
WORKDIR /app
ARG VITE_API_BASE_URL=http://localhost:8833

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN bun run build

# Runtime: nginx 静态托管 build/client，SPA 路由回退 + 静态资源长缓存
FROM nginx:alpine
COPY --from=build /app/build/client /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

FROM nginx:alpine
COPY --from=build /app/build/client /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80