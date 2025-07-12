const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    role: {
      type: String,
      enum: ['admin', 'doctor', 'patient'],
      required: true,
    },
    // Thông tin bổ sung cho bác sĩ
    doctorInfo: {
      specialization: { type: String },
      licenseNumber: { type: String },
      department: { type: String },
    },
    // Thông tin bổ sung cho bệnh nhân
    patientInfo: {
      dateOfBirth: { type: Date },
      phoneNumber: { type: String },
      address: { type: String },
      emergencyContact: { type: String },
    },
    // Mối quan hệ bác sĩ-bệnh nhân
    assignedDoctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // Danh sách bệnh nhân của bác sĩ
    patients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    // Thông tin tạo tài khoản
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('User', UserSchema)
