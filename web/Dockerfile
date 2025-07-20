FROM node:22 AS build

WORKDIR /app/web

COPY ["web/package.json", "web/package-lock.json*", "./"]

RUN npm install

COPY ./interfaces /app/interfaces
COPY ./web .

RUN npm run build


# Build final image
FROM nginx:alpine

EXPOSE 80

COPY --from=build /app/web/dist /usr/share/nginx/html

HEALTHCHECK NONE

ENTRYPOINT ["/bin/sh", "-c", "/usr/share/nginx/html/vite-envs.sh && nginx -g 'daemon off;'"]