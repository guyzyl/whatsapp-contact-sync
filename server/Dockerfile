FROM node:18-alpine
ENV NODE_ENV=production

WORKDIR /app/server
RUN npm install -g typescript ts-node --production

COPY ["server/package.json", "server/package-lock.json*", "./"]

RUN npm install --production

COPY ./interfaces /app/interfaces
COPY ./server .

CMD [ "npm", "run", "serve" ]
