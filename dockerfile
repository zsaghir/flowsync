FROM node:lts-alpine3.23

WORKDIR /app

COPY ./package*.json .

RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["node", "node_modules/.bin/next", "start"]

