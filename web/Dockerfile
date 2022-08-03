FROM node:18 AS build

WORKDIR /app/web

# Install Chromium, needed for react-snap
RUN \
  wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - && \
  echo "deb http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google.list && \
  apt-get update && \
  apt-get install -y libxss1 google-chrome-stable && \
  rm -rf /var/lib/apt/lists/*s

COPY ["web/package.json", "web/package-lock.json*", "./"]

RUN npm install

COPY ./interfaces /app/interfaces
COPY ./web .

RUN npm run build


# Build final image
FROM nginx:alpine

COPY --from=build /app/web/dist /usr/share/nginx/html
