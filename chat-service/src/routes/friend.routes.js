const express = require('express')
const router = express.Router()
const friendController = require('../controllers/friend.controller')

// Gửi yêu cầu kết bạn
router.post('/request', friendController.sendFriendRequest)

// Chấp nhận yêu cầu kết bạn
router.post('/accept', friendController.acceptFriendRequest)

// Từ chối yêu cầu kết bạn
router.post('/reject', friendController.rejectFriendRequest)

// Lấy danh sách bạn bè
router.get('/list', friendController.getFriends)

// Lấy danh sách yêu cầu kết bạn đang chờ
router.get('/pending', friendController.getPendingRequests)

module.exports = router
