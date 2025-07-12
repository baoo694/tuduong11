const mongoose = require('mongoose')

const friendSchema = new mongoose.Schema({
  sender: {
    type: String,
    required: true,
  },
  receiver: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// Tạo index để tối ưu việc tìm kiếm
friendSchema.index({ sender: 1, receiver: 1 }, { unique: true })

module.exports = mongoose.model('Friend', friendSchema)
