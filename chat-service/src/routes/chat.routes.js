const express = require('express')
const router = express.Router()
const chatController = require('../controllers/chat.controller')

// Test endpoint để kiểm tra hoạt động của Chat Service
router.get('/test', (req, res) => {
  res.json({ message: 'Chat Service is running.' })
})

// ===== ROUTES CHO HỆ THỐNG BỆNH VIỆN =====

// Tạo phòng chat bác sĩ-bệnh nhân
router.post('/doctor-patient/create', chatController.createDoctorPatientRoom)

// Lấy phòng chat bác sĩ-bệnh nhân
router.get('/doctor-patient/room', chatController.getDoctorPatientRoom)

// Lấy phòng chat của bệnh nhân
router.get('/patient/room', chatController.getPatientChatRoom)

// ===== ROUTES CHUNG =====

// Đếm số phòng chat
router.get('/rooms/count', chatController.countActiveRooms)

// Gửi tin nhắn vào phòng chat
router.post('/messages', chatController.sendMessage)

// Lấy danh sách tin nhắn theo roomId
router.get('/room/:roomId', chatController.getRoomMessages)

// Thống kê hoạt động chat toàn hệ thống
router.get('/statistics/activity', chatController.getChatActivityStats)

module.exports = router
