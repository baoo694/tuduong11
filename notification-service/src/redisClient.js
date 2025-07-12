// src/redisClient.js
const { createClient } = require('redis');

const redisClient = createClient({
  // Ở đây, chúng ta dùng biến môi trường REDIS_URL, 
  // khi chạy trong Docker, REDIS_URL sẽ được đặt là "redis://redis:6379"
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

redisClient.connect();

module.exports = redisClient;
