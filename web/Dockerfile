FROM node:24-alpine AS build

WORKDIR /app/web

COPY ["web/package.json", "web/package-lock.json*", "./"]

# Cache mount persists npm cache between builds for faster rebuilds (~50-70% faster)
# npm ci: clean install from package-lock.json
# --prefer-offline: uses cached packages before downloading
# --no-audit: skips security audit for speed
RUN --mount=type=cache,target=/app/.npm \
  npm ci --prefer-offline --no-audit --cache /app/.npmCOPY ./interfaces /app/interfaces
COPY ./web .

RUN npm run build


### Build final image
FROM nginx:alpine

# Install curl for healthcheck
RUN apk add --no-cache curl

COPY --from=build /app/web/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD curl -f http://localhost:80/health.json || exit 1

ENTRYPOINT ["/bin/sh", "-c", "/usr/share/nginx/html/vite-envs.sh && nginx -g 'daemon off;'"]