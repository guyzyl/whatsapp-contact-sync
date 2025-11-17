FROM node:24 AS build

WORKDIR /app/web

COPY ["web/package.json", "web/package-lock.json*", "./"]

RUN npm install

COPY ./interfaces /app/interfaces
COPY ./web .

RUN npm run build


# Build final image
FROM nginx:alpine

# Install curl for healthcheck
RUN apk add --no-cache curl

EXPOSE 80

COPY --from=build /app/web/dist /usr/share/nginx/html

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD curl -f http://localhost:80/health.json || exit 1

ENTRYPOINT ["/bin/sh", "-c", "/usr/share/nginx/html/vite-envs.sh && nginx -g 'daemon off;'"]