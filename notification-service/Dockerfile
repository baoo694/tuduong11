FROM node:20-alpine

WORKDIR /app

COPY package.json /
RUN yarn install --production

COPY . .

# Expose cổng cho notification-service (ở đây là 3003)
EXPOSE 3003

CMD ["yarn", "start"]
