const express = require('express')
const router = express.Router()
const userController = require('../controllers/user.controller')
const authenticateToken = require('../middlewares/auth')

// Tạo admin đầu tiên (chỉ chạy một lần)
router.post('/create-initial-admin', userController.createInitialAdmin)

// Verify email endpoint
router.get('/verify', userController.verifyEmail)

// Login endpoint
router.post('/login', userController.login)

// Forgot password endpoint
router.post('/forgotPassword', userController.forgotPassword)

// Reset password endpoint (token truyền dưới query param)
router.post('/resetPassword', userController.resetPassword)

// Delete account endpoint (yêu cầu người dùng đã xác thực)
router.delete('/deleteAccount', authenticateToken, userController.deleteAccount)

// List users endpoint (yêu cầu người dùng đã xác thực)
router.get('/list', userController.listUsers)

// Đổi mật khẩu
router.post('/change-password', userController.changePassword)

// ===== ROUTES CHO ADMIN =====

// Tạo tài khoản bác sĩ (chỉ admin mới có quyền)
router.post('/create-doctor', authenticateToken, userController.createDoctor)

// Tạo tài khoản bệnh nhân (chỉ admin mới có quyền)
router.post('/create-patient', authenticateToken, userController.createPatient)

// Gán bác sĩ cho bệnh nhân (chỉ admin mới có quyền)
router.post(
  '/assign-doctor',
  authenticateToken,
  userController.assignDoctorToPatient
)

// Thay đổi mật khẩu bác sĩ (chỉ admin) - phải đặt trước route /doctors
router.post(
  '/doctors/:doctorId/change-password',
  authenticateToken,
  userController.adminChangeDoctorPassword
)
// Cập nhật thông tin bác sĩ (chỉ admin mới có quyền)
router.put('/doctors/:doctorId', authenticateToken, userController.updateDoctor)

// Lấy danh sách tất cả bác sĩ
router.get('/doctors', userController.getAllDoctors)

// Lấy danh sách tất cả bệnh nhân
router.get('/patients', userController.getAllPatients)

// Xóa tài khoản (chỉ admin mới có quyền)
router.delete(
  '/users/:userId',
  authenticateToken,
  userController.deleteUserAccount
)

// ===== ROUTES CHO BÁC SĨ =====

// Lấy danh sách bệnh nhân của bác sĩ
router.get(
  '/doctor/patients',
  authenticateToken,
  userController.getDoctorPatients
)

// ===== ROUTES CHO BỆNH NHÂN =====

// Lấy thông tin bác sĩ được gán cho bệnh nhân
router.get(
  '/patient/doctor',
  authenticateToken,
  userController.getPatientDoctor
)

// Cập nhật thông tin người dùng
router.put('/profile', authenticateToken, userController.updateUserProfile)
router.get('/profile', authenticateToken, userController.getProfile)

router.get('/', (req, res) => {
  res.json({ message: 'User Service is running.' })
})

module.exports = router
