FROM node:20-alpine

WORKDIR /app

# Copy các file cần thiết
COPY package.json /
RUN yarn install --production

# Copy toàn bộ mã nguồn của dự án
COPY . .

EXPOSE 3002

CMD ["yarn", "start"]
