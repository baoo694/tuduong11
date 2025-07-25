const axios = require('axios')
const ChatRoom = require('../models/ChatRoom')
const { getIO, notifyNewRoom } = require('../socket')

// Gửi tin nhắn vào phòng chat
exports.sendMessage = async (req, res) => {
  try {
    console.log('sendMessage controller called with body:', req.body)
    const { roomId, sender, username, text } = req.body
    const room = await ChatRoom.findById(roomId)
    if (!room) {
      console.log('Room not found:', roomId)
      return res.status(404).json({ error: 'Room not found' })
    }

    console.log('Room found:', room.roomName)
    console.log('Room members:', room.members)
    console.log('Sender username:', username)

    // Kiểm tra người gửi có phải là thành viên không
    if (!room.members.includes(username)) {
      console.log('User not a member of room:', username)
      return res.status(403).json({ error: 'You must join the room first' })
    }

    const message = {
      sender,
      username,
      text,
      createdAt: new Date(),
    }

    console.log('Saving message:', message)
    room.messages.push(message)
    await room.save()
    console.log('Message saved successfully')

    // Emit socket event
    console.log('Emitting chatMessage event to room:', roomId)
    getIO()
      .to(roomId)
      .emit('chatMessage', {
        ...message,
        roomId,
      })
    console.log('chatMessage event emitted')

    // Emit doctorMessage cho tất cả bác sĩ nếu tin nhắn từ bệnh nhân
    try {
      // Emit doctorMessage nếu username chứa "patient"
      if (username && username.includes('patient')) {
        console.log(`Emitting doctorMessage for patient ${username}`)
        getIO().emit('doctorMessage', {
          ...message,
          roomId,
        })
        console.log('doctorMessage event emitted to all doctors')
      }
    } catch (error) {
      console.error('Error emitting doctorMessage:', error?.message || error)
    }

    // Gửi notification tới các thành viên khác (trừ người gửi)
    const notificationServiceUrl =
      'http://notification-service:3003/notification/send'
    const roomName = room.roomName || 'Phòng chat'
    for (const member of room.members) {
      if (member !== username) {
        axios
          .post(notificationServiceUrl, {
            userId: member,
            message: {
              roomId,
              roomName,
              sender: username,
              text,
            },
          })
          .catch((err) => {
            console.error('Error sending notification:', err?.message)
          })
      }
    }

    console.log('sendMessage completed successfully')
    res.status(201).json(message)
  } catch (err) {
    console.error('Error sending message:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Lấy danh sách tin nhắn theo roomId
exports.getRoomMessages = async (req, res) => {
  try {
    const { username } = req.query // Thêm username vào query params
    const room = await ChatRoom.findById(req.params.roomId)
    if (!room) {
      return res.status(404).json({ error: 'Room not found' })
    }

    // Kiểm tra người dùng có phải là thành viên không
    if (!room.members.includes(username)) {
      return res.status(403).json({ error: 'You must join the room first' })
    }

    let messages = room.messages
    // Nếu là room 1-1 thì filter bỏ system message
    if (room.members.length === 2) {
      messages = messages.filter((m) => m.type !== 'system')
    }
    res.json({ messages })
  } catch (err) {
    console.error('Error getting messages:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// ===== CHỨC NĂNG CHO HỆ THỐNG BỆNH VIỆN =====

// Tạo phòng chat bác sĩ-bệnh nhân
exports.createDoctorPatientRoom = async (req, res) => {
  try {
    const { doctorId, patientId, doctorUsername, patientUsername } = req.body

    if (!doctorId || !patientId || !doctorUsername || !patientUsername) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Kiểm tra xem đã có phòng chat giữa bác sĩ và bệnh nhân này chưa
    const existingRoom = await ChatRoom.findOne({
      roomType: 'doctor_patient',
      'doctorPatientInfo.doctorId': doctorId,
      'doctorPatientInfo.patientId': patientId,
      'doctorPatientInfo.status': 'active',
    })

    if (existingRoom) {
      return res.status(400).json({
        error: 'Chat room already exists for this doctor-patient pair',
        roomId: existingRoom._id,
      })
    }

    const room = new ChatRoom({
      roomName: `Tư vấn: ${doctorUsername} - ${patientUsername}`,
      roomType: 'doctor_patient',
      members: [doctorUsername, patientUsername],
      memberIds: [doctorId, patientId],
      creator: doctorUsername,
      creatorId: doctorId,
      doctorPatientInfo: {
        doctorId,
        patientId,
        consultationDate: new Date(),
        status: 'active',
      },
    })

    await room.save()

    // Thông báo cho cả bác sĩ và bệnh nhân
    getIO().to(doctorUsername).emit('newDoctorPatientRoom', room)
    getIO().to(patientUsername).emit('newDoctorPatientRoom', room)

    res.status(201).json(room)
  } catch (err) {
    console.error('Error creating doctor-patient room:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Lấy phòng chat của bệnh nhân với bác sĩ được gán
exports.getPatientChatRoom = async (req, res) => {
  try {
    const { patientId, patientUsername } = req.query

    if (!patientId || !patientUsername) {
      return res
        .status(400)
        .json({ error: 'Patient ID and username are required' })
    }

    const room = await ChatRoom.findOne({
      roomType: 'doctor_patient',
      'doctorPatientInfo.patientId': patientId,
      'doctorPatientInfo.status': 'active',
      members: patientUsername,
    })

    if (!room) {
      return res
        .status(404)
        .json({ error: 'No active chat room found for this patient' })
    }

    res.json({ room })
  } catch (err) {
    console.error('Error getting patient chat room:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Lấy phòng chat bác sĩ-bệnh nhân
exports.getDoctorPatientRoom = async (req, res) => {
  try {
    const { doctorId, patientId, doctorUsername, patientUsername } = req.query

    if (!doctorId || !patientId || !doctorUsername || !patientUsername) {
      return res
        .status(400)
        .json({ error: 'Doctor ID, Patient ID, and usernames are required' })
    }

    const room = await ChatRoom.findOne({
      roomType: 'doctor_patient',
      'doctorPatientInfo.doctorId': doctorId,
      'doctorPatientInfo.patientId': patientId,
      'doctorPatientInfo.status': 'active',
      members: { $all: [doctorUsername, patientUsername] },
    })

    if (!room) {
      return res.status(404).json({
        error: 'No active chat room found for this doctor-patient pair',
      })
    }

    res.json({ room })
  } catch (err) {
    console.error('Error getting doctor-patient room:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Đếm số phòng chat đang hoạt động
exports.countActiveRooms = async (req, res) => {
  try {
    const count = await ChatRoom.countDocuments()
    res.json({ count })
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Thống kê hoạt động chat toàn hệ thống
exports.getChatActivityStats = async (req, res) => {
  try {
    const totalRooms = await ChatRoom.countDocuments()
    const totalMessagesAgg = await ChatRoom.aggregate([
      { $group: { _id: null, total: { $sum: { $size: '$messages' } } } },
    ])
    const totalMessages = totalMessagesAgg[0]?.total || 0
    res.json({ totalRooms, totalMessages })
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' })
  }
}
