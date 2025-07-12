let io

const initSocket = (server) => {
  io = require('socket.io')(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  })

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id)

    socket.on('joinRoom', (roomId) => {
      socket.join(roomId)
      console.log(`User ${socket.id} joined room ${roomId}`)

      // Test emit từ backend
      socket.emit('testFromBackend', { message: 'Hello from backend!' })
    })

    // Tham gia room theo username để nhận realtime newRoom
    socket.on('join', (username) => {
      socket.join(username)
      console.log(`User ${socket.id} joined user room ${username}`)
    })

    // Debug: test event
    socket.on('test', (data) => {
      console.log('Received test event from frontend:', data)
    })

    // Xử lý gửi tin nhắn realtime
    socket.on('sendMessage', async (messageData) => {
      try {
        const { roomId, text, sender, username } = messageData

        // Lưu tin nhắn vào database
        const ChatRoom = require('./models/ChatRoom')
        const room = await ChatRoom.findById(roomId)

        if (!room) {
          console.log('Room not found:', roomId)
          return
        }

        // Kiểm tra người gửi có phải là thành viên không
        if (!room.members.includes(username)) {
          console.log('User not a member of room:', username, roomId)
          return
        }

        const message = {
          sender,
          username,
          text,
          createdAt: new Date(),
        }

        room.messages.push(message)
        await room.save()

        // Emit tin nhắn cho tất cả thành viên trong phòng
        io.to(roomId).emit('chatMessage', {
          ...message,
          roomId,
        })

        console.log(`Message sent in room ${roomId} by ${username}: ${text}`)
      } catch (error) {
        console.error('Error handling sendMessage:', error)
      }
    })

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id)
    })
  })

  return io
}

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!')
  }
  return io
}

// Hàm thông báo có phòng mới
const notifyNewRoom = (room) => {
  io.emit('newRoom', room)
}

module.exports = {
  initSocket,
  getIO,
  notifyNewRoom,
}
