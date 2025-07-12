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

// Lấy danh sách phòng chat của bác sĩ
router.get('/doctor/rooms', chatController.getDoctorChatRooms)

// Tạo phòng chat giữa các bác sĩ
router.post('/doctor-doctor/create', chatController.createDoctorDoctorRoom)

// Hoàn thành phiên tư vấn
router.post('/consultation/complete', chatController.completeConsultation)

// Lấy thống kê phòng chat cho bác sĩ
router.get('/doctor/stats', chatController.getDoctorChatStats)

// Lấy phòng chat giữa hai bác sĩ (đồng nghiệp)
router.get('/doctor-doctor/room', chatController.getDoctorDoctorRoom)

// ===== ROUTES CHUNG =====

// Lấy danh sách tất cả phòng chat
router.get('/rooms', chatController.getAllRooms)

// Tạo phòng chat mới
router.post('/createRoom', chatController.createRoom)

// Tham gia phòng chat
router.post('/joinRoom', chatController.joinRoom)

// Rời phòng chat
router.post('/leaveRoom', chatController.leaveRoom)

// Gửi tin nhắn vào phòng chat
router.post('/messages', chatController.sendMessage)

// Xóa phòng chat
router.post('/deleteRoom', chatController.deleteRoom)

// Mời bạn bè vào phòng chat
router.post('/invite', chatController.inviteToRoom)

// Xác nhận tham gia phòng khi được mời
router.post('/accept-invite', chatController.acceptInviteToRoom)

// Lấy danh sách thành viên trong phòng chat
router.get('/:roomId/members', chatController.getRoomMembers)

// Lấy danh sách tin nhắn theo roomId
router.get('/:roomId', chatController.getRoomMessages)

module.exports = router
