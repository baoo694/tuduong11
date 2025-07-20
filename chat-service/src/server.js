require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const http = require('http')
const { initSocket } = require('./socket')

const app = express()
const server = http.createServer(app)

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.use('/chat', require('./routes/chat.routes'))

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI || 'mongodb://mongo:27017/chat-app', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err))

// Initialize Socket.IO
initSocket(server)

// Start server
const PORT = process.env.PORT || 3002
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})

// Xuất ra app, server và io để có thể sử dụng trong các module khác hoặc test
module.exports = { app, server }
