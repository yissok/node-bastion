FROM node:14-alpine

WORKDIR /usr/src/app

COPY pakage*.json ./

RUN npm install

COPY . .

EXPOSE 443

CMD [ "node", "server.js"]