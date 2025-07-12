FROM node:20-alpine

WORKDIR /app

COPY package.json /
RUN yarn install --production
RUN npm install @fastify/cors

COPY . .

EXPOSE 3000

CMD ["node", "src/server.js"]
