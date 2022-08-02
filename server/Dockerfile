FROM node:18-alpine
ENV NODE_ENV=prod

WORKDIR /app/server
RUN npm install -g typescript ts-node --production

# Install Chromium.
RUN \
  wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - && \
  echo "deb http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google.list && \
  apt-get update && \
  apt-get install -y google-chrome-stable && \
  rm -rf /var/lib/apt/lists/*s

COPY ["server/package.json", "server/package-lock.json*", "./"]

RUN npm install --production

COPY ./interfaces /app/interfaces
COPY ./server .

CMD [ "npm", "run", "serve" ]
