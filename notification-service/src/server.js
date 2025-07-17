require('dotenv').config()
const express = require('express')
const cors = require('cors')
const http = require('http')
const { Server } = require('socket.io')

// Đảm bảo Redis Subscriber luôn chạy sau khi io đã được khởi tạo
const startSubscriber = require('./subscriber')

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Sử dụng router của Notification Service
const notificationRouter = require('./routes/notification.routes')
app.use('/notification', notificationRouter)
app.use('/send', notificationRouter)

// Tạo HTTP Server và tích hợp Socket.IO
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3004', // Thêm dòng này cho frontend Docker
      'http://localhost:5500',
      'http://localhost:8080', // Cho phép front-end truy cập qua Docker
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  },
})

// Định nghĩa các sự kiện Socket.IO
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`)

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`)
  })
})

// Đảm bảo Redis Subscriber luôn chạy sau khi io đã được khởi tạo
startSubscriber(io)

// Lắng nghe trên cổng (theo biến môi trường PORT hoặc mặc định 3003)
const port = process.env.PORT || 3003
server.listen(port, () => {
  console.log(`Notification Service started on port ${port}`)
})

// Xuất ra app và io nếu cần sử dụng trong các module hoặc test
module.exports = { app, io }
