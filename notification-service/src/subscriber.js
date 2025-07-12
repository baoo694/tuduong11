const { createClient } = require('redis')

module.exports = function (io) {
  ;(async () => {
    const subscriber = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    })

    subscriber.on('error', (err) =>
      console.error('Redis Subscriber Error:', err)
    )

    await subscriber.connect()

    await subscriber.subscribe('notifications', (message) => {
      if (!message) {
        console.error('Received an undefined message from Redis!')
        return
      }

      try {
        const notification = JSON.parse(message)
        console.log('Received notification:', notification)

        if (!notification.message || !notification.userId) {
          console.error('Invalid notification format:', notification)
          return
        }

        if (io) {
          io.emit('new_notification', notification)
        } else {
          console.error('WebSocket server (io) chưa được khởi động!')
        }
      } catch (err) {
        console.error('Error parsing Redis message:', err)
      }
    })

    console.log('Redis subscriber đã đăng ký kênh "notifications".')
  })()
}
