const express = require('express')
const router = express.Router()
const userController = require('../controllers/user.controller')
const authenticateToken = require('../middlewares/auth')

// Verify email endpoint
router.get('/verify', userController.verifyEmail)

// Login endpoint
router.post('/login', userController.login)

// Forgot password endpoint
router.post('/forgotPassword', userController.forgotPassword)

// Reset password endpoint (token truyền dưới query param)
router.post('/resetPassword', userController.resetPassword)

// Đổi mật khẩu
router.post('/change-password', userController.changePassword)

// Thống kê phân bố user theo role
router.get(
  '/statistics/role-distribution',
  userController.getUserRoleDistribution
)

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

// Thay đổi mật khẩu bệnh nhân (chỉ admin)
router.post(
  '/patients/:patientId/change-password',
  authenticateToken,
  userController.adminChangePatientPassword
)

// Bỏ gán bác sĩ cho bệnh nhân (chỉ admin) - đặt trước các route /patients/:patientId
router.post(
  '/patients/:patientId/unassign-doctor',
  authenticateToken,
  userController.unassignDoctorForPatient
)
// Cập nhật thông tin bệnh nhân (chỉ admin)
router.put(
  '/patients/:patientId',
  authenticateToken,
  userController.updatePatient
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
