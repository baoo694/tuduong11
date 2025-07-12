FROM node:20-alpine

WORKDIR /app

# Cài đặt các công cụ cần thiết để biên dịch module native
RUN apk add --no-cache python3 make g++ \
    && ln -sf python3 /usr/bin/python

# Copy các file cần thiết
COPY package.json /

# Cài đặt dependencies
RUN yarn install --production

# Copy toàn bộ mã nguồn của dự án vào container
COPY . .

# Expose cổng ứng dụng (3001 ở đây)
EXPOSE 3001

# Khởi chạy ứng dụng
CMD ["yarn", "start"]
