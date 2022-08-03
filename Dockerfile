FROM node:18 AS build

WORKDIR /app/web

COPY ["web/package.json", "web/package-lock.json*", "./"]

RUN npm install

COPY ./interfaces /app/interfaces
COPY ./web .

RUN npm run build


# Build final image
FROM node:18

WORKDIR /app/server
RUN npm install -g typescript ts-node --production

# Install Chromium.
RUN \
  wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - && \
  echo "deb http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google.list && \
  apt-get update && \
  apt-get install -y nginx google-chrome-stable && \
  rm -rf /var/lib/apt/lists/*s

COPY ["server/package.json", "server/package-lock.json*", "./"]

RUN npm install --production

COPY ./assets/entrypoint.sh .
COPY ./assets/nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/web/dist /var/www/html
COPY ./interfaces /app/interfaces
COPY ./server .

RUN chmod -R 777 /app

ENTRYPOINT ["./entrypoint.sh"]
