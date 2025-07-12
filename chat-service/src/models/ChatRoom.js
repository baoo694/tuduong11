const mongoose = require('mongoose')

const MessageSchema = new mongoose.Schema({
  sender: String,
  username: String,
  text: String,
  type: { type: String, default: 'user' }, // 'user' hoặc 'system'
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

const ChatRoomSchema = new mongoose.Schema(
  {
    roomName: {
      type: String,
      required: false,
      default: '',
    },
    roomType: {
      type: String,
      enum: ['general', 'doctor_patient', 'doctor_doctor'],
      default: 'general',
    },
    members: [
      {
        type: String, // username
        required: true,
      },
    ],
    memberIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    creator: {
      type: String,
      required: true,
    },
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // Thông tin cho phòng chat bác sĩ-bệnh nhân
    doctorPatientInfo: {
      doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      consultationDate: {
        type: Date,
        default: Date.now,
      },
      status: {
        type: String,
        enum: ['active', 'completed', 'cancelled'],
        default: 'active',
      },
    },
    messages: [MessageSchema],
  },
  { timestamps: true }
)

module.exports = mongoose.model('ChatRoom', ChatRoomSchema)
