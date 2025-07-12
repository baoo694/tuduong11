// server.js của API Gateway sử dụng Fastify và @fastify/http-proxy
const Fastify = require('fastify')
const proxy = require('@fastify/http-proxy')
const cors = require('@fastify/cors')
require('dotenv').config()

const app = Fastify({
  logger: true,
})

app.register(cors, {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
})

// Route test để xác nhận API Gateway đang chạy
app.get('/api/test', async (req, reply) => {
  return { message: 'API Gateway is working.' }
})

// Proxy tới User Service:
// Public URL: http://localhost:3000/api/users/ sẽ được rewrite thành /users
app.register(proxy, {
  upstream: process.env.USER_SERVICE_URL || 'http://localhost:3001',
  prefix: '/api/users',
  rewritePrefix: '/users',
  http2: false,
  // Các tùy chọn khác nếu cần
})

// Proxy tới Chat Service
app.register(proxy, {
  upstream: process.env.CHAT_SERVICE_URL || 'http://localhost:3002',
  prefix: '/api/chat',
  rewritePrefix: '/chat',
  http2: false,
})

// Proxy tới Notification Service
app.register(proxy, {
  upstream: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3003',
  prefix: '/api/notification',
  rewritePrefix: '/notification',
  http2: false,
})

// Proxy tới File Service
app.register(proxy, {
  upstream: process.env.FILE_SERVICE_URL || 'http://localhost:3004',
  prefix: '/api/files',
  rewritePrefix: '/files',
  http2: false,
})

const port = Number(process.env.PORT) || 3000
app.listen({ port, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    app.log.error(err)
    process.exit(1)
  }
  app.log.info(`API Gateway listening on ${address}`)
})
