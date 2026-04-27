FROM node:24-alpine AS build

ARG WEB_GOOGLE_CLIENT_ID=""
ARG WEB_GOOGLE_API_KEY=""

ENV WEB_GOOGLE_CLIENT_ID=${WEB_GOOGLE_CLIENT_ID}
ENV WEB_GOOGLE_API_KEY=${WEB_GOOGLE_API_KEY}

WORKDIR /app/web

COPY web/package.json web/package-lock.json* ./

RUN npm ci

COPY interfaces ../interfaces
COPY web .

RUN npm run build


### Build final image
FROM nginx:alpine

ARG WEB_GOOGLE_CLIENT_ID=""
ARG WEB_GOOGLE_API_KEY=""

ENV WEB_GOOGLE_CLIENT_ID=${WEB_GOOGLE_CLIENT_ID}
ENV WEB_GOOGLE_API_KEY=${WEB_GOOGLE_API_KEY}

# Install curl for healthcheck
RUN apk add --no-cache curl

COPY --from=build /app/web/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD curl -f http://localhost:80/health.json || exit 1

ENTRYPOINT ["/bin/sh", "-c", "/usr/share/nginx/html/vite-envs.sh && nginx -g 'daemon off;'"]