// src/controllers/notification.controller.js
const redisClient = require('../redisClient');

exports.sendNotification = async (req, res) => {
  const { message, userId } = req.body;

  if (!message || !userId) {
    return res.status(400).json({ error: "Missing message or userId" });
  }

  try {
    const payload = { message, userId, timestamp: new Date() };
    
    console.log("Publishing notification:", payload);
    
    await redisClient.publish("notifications", JSON.stringify(payload));

    res.status(200).json({ message: "Notification sent successfully!", payload });
  } catch (error) {
    console.error("Error publishing notification:", error);
    res.status(500).json({ error: error.message });
  }
};

