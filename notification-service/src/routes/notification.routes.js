const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');


// Endpoint gửi thông báo
router.post('/send', notificationController.sendNotification);

// (Tùy chọn) Endpoint kiểm tra hoạt động của Notification Service
router.get('/test', (req, res) => {
  res.json({ message: "Notification Service is running." });
});

// (Tùy chọn) Endpoint kiểm tra nhanh trạng thái service
router.get('/', (req, res) => {
  res.json({ message: "Notification Service is running" });
});

module.exports = router;
