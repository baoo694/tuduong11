const User = require('../models/User')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const transporter = require('../config/mailer')

// Hàm gửi email xác thực
const sendVerificationEmail = async (userEmail, token) => {
  const verificationUrl = `http://localhost:3000/api/users/verify?token=${token}`
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: userEmail,
    subject: 'Xác thực tài khoản của bạn',
    html: `<p>Nhấn vào <a href="${verificationUrl}">link này</a> để kích hoạt tài khoản của bạn.</p>`,
  }
  return transporter.sendMail(mailOptions)
}

// Tạo tài khoản admin đầu tiên (chỉ chạy một lần)
exports.createInitialAdmin = async (req, res) => {
  try {
    // Kiểm tra xem đã có admin nào chưa
    const existingAdmin = await User.findOne({ role: 'admin' })
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin đã tồn tại' })
    }

    const { username, email, password } = req.body

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const admin = await User.create({
      username,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'admin',
      isVerified: true,
    })

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    })

    return res.status(201).json({
      message: 'Admin account created successfully',
      token,
      user: {
        _id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
      },
    })
  } catch (err) {
    console.error('Error creating initial admin:', err)
    return res
      .status(500)
      .json({ message: 'Error creating admin', error: err.toString() })
  }
}

// Tạo tài khoản bác sĩ (chỉ admin mới có quyền)
exports.createDoctor = async (req, res) => {
  try {
    const adminId = req.user.id
    const admin = await User.findById(adminId)

    if (!admin || admin.role !== 'admin') {
      return res
        .status(403)
        .json({ message: 'Only admin can create doctor accounts' })
    }

    let {
      username,
      email,
      password,
      specialization,
      licenseNumber,
      department,
    } = req.body

    if (
      !username ||
      !email ||
      !password ||
      !specialization ||
      !licenseNumber ||
      !department
    ) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    email = email.toLowerCase().trim()

    const existingUser = await User.findOne({ $or: [{ username }, { email }] })
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' })
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const newDoctor = await User.create({
      username,
      email,
      password: hashedPassword,
      role: 'doctor',
      isVerified: true,
      createdBy: adminId,
      doctorInfo: {
        specialization,
        licenseNumber,
        department,
      },
    })

    return res.status(201).json({
      message: 'Doctor account created successfully',
      user: {
        _id: newDoctor._id,
        username: newDoctor.username,
        email: newDoctor.email,
        role: newDoctor.role,
        doctorInfo: newDoctor.doctorInfo,
      },
    })
  } catch (err) {
    console.error('Error creating doctor:', err)
    return res
      .status(500)
      .json({ message: 'Error creating doctor account', error: err.toString() })
  }
}

// Tạo tài khoản bệnh nhân (chỉ admin mới có quyền)
exports.createPatient = async (req, res) => {
  try {
    const adminId = req.user.id
    const admin = await User.findById(adminId)

    if (!admin || admin.role !== 'admin') {
      return res
        .status(403)
        .json({ message: 'Only admin can create patient accounts' })
    }

    let {
      username,
      email,
      password,
      dateOfBirth,
      phoneNumber,
      address,
      emergencyContact,
    } = req.body

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    email = email.toLowerCase().trim()

    const existingUser = await User.findOne({ $or: [{ username }, { email }] })
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' })
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const newPatient = await User.create({
      username,
      email,
      password: hashedPassword,
      role: 'patient',
      isVerified: true,
      createdBy: adminId,
      patientInfo: {
        dateOfBirth,
        phoneNumber,
        address,
        emergencyContact,
      },
    })

    return res.status(201).json({
      message: 'Patient account created successfully',
      user: {
        _id: newPatient._id,
        username: newPatient.username,
        email: newPatient.email,
        role: newPatient.role,
        patientInfo: newPatient.patientInfo,
      },
    })
  } catch (err) {
    console.error('Error creating patient:', err)
    return res.status(500).json({
      message: 'Error creating patient account',
      error: err.toString(),
    })
  }
}

exports.verifyEmail = async (req, res) => {
  try {
    const token = req.query.token
    if (!token) return res.status(400).send('Token is missing.')

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    if (!decoded || !decoded.id) return res.status(400).send('Invalid token.')

    await User.findByIdAndUpdate(decoded.id, { isVerified: true })

    return res
      .status(200)
      .send('Email verified successfully. You can now log in.')
  } catch (err) {
    console.error('Error in email verification:', err)
    return res.status(400).send('Invalid or expired token.')
  }
}

exports.login = async (req, res) => {
  try {
    let { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Missing email or password' })
    }

    email = email.toLowerCase().trim()

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' })
    }

    if (!user.isVerified) {
      return res
        .status(400)
        .json({ message: 'User not verified. Please contact administrator.' })
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    )

    return res.status(200).json({
      message: 'User logged in successfully',
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        doctorInfo: user.doctorInfo,
        patientInfo: user.patientInfo,
      },
    })
  } catch (err) {
    console.error('Error in login:', err)
    return res
      .status(500)
      .json({ message: 'Error during login', error: err.toString() })
  }
}

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ message: 'Email is required' })

    const normalizedEmail = email.toLowerCase().trim()
    const user = await User.findOne({ email: normalizedEmail })
    if (!user) {
      return res
        .status(200)
        .json({ message: 'If that email exists, a reset link has been sent.' })
    }

    const resetToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    )
    const resetUrl = `http://localhost:3000/api/users/verify?token=${resetToken}`
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: user.email,
      subject: 'Password Reset Request',
      html: `<p>Bạn đã yêu cầu đặt lại mật khẩu. Nhấn vào <a href="${resetUrl}">link này</a> để đặt lại mật khẩu của bạn.</p>
             <p>Lưu ý: Link này chỉ có hiệu lực trong 15 phút.</p>`,
    }
    await transporter.sendMail(mailOptions)
    return res
      .status(200)
      .json({ message: 'If that email exists, a reset link has been sent.' })
  } catch (err) {
    console.error('Error in forgotPassword:', err)
    return res
      .status(500)
      .json({ message: 'Error processing request', error: err.toString() })
  }
}

exports.resetPassword = async (req, res) => {
  try {
    const token = req.query.token
    const { newPassword } = req.body
    if (!token) return res.status(400).json({ message: 'Token is required' })
    if (!newPassword)
      return res.status(400).json({ message: 'New password is required' })

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id)
    if (!user) {
      return res.status(400).json({ message: 'User not found' })
    }

    const salt = await bcrypt.genSalt(10)
    user.password = await bcrypt.hash(newPassword, salt)
    await user.save()
    return res.status(200).json({ message: 'Password successfully updated' })
  } catch (err) {
    console.error('Error in resetPassword:', err)
    return res
      .status(500)
      .json({ message: 'Error processing request', error: err.toString() })
  }
}

exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id
    await User.findByIdAndDelete(userId)
    return res.status(200).json({ message: 'Your account has been deleted' })
  } catch (err) {
    console.error('Error in deleteAccount:', err)
    return res
      .status(500)
      .json({ message: 'Error processing your request', error: err.toString() })
  }
}

exports.listUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password')
    res.json({ users })
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy danh sách người dùng' })
  }
}

exports.changePassword = async (req, res) => {
  try {
    const { username, oldPassword, newPassword } = req.body
    if (!username || !oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Thiếu thông tin.' })
    }
    const user = await User.findOne({ username })
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng.' })
    }
    const isMatch = await bcrypt.compare(oldPassword, user.password)
    if (!isMatch) {
      return res.status(400).json({ error: 'Mật khẩu cũ không đúng.' })
    }
    const salt = await bcrypt.genSalt(10)
    user.password = await bcrypt.hash(newPassword, salt)
    await user.save()
    return res.json({ success: true, message: 'Đổi mật khẩu thành công!' })
  } catch (err) {
    console.error('Error in changePassword:', err)
    return res.status(500).json({ error: 'Lỗi đổi mật khẩu.' })
  }
}

// Gán bác sĩ cho bệnh nhân (chỉ admin mới có quyền)
exports.assignDoctorToPatient = async (req, res) => {
  try {
    const adminId = req.user.id
    const admin = await User.findById(adminId)

    if (!admin || admin.role !== 'admin') {
      return res
        .status(403)
        .json({ message: 'Only admin can assign doctors to patients' })
    }

    const { patientId, doctorId } = req.body

    if (!patientId || !doctorId) {
      return res
        .status(400)
        .json({ message: 'Patient ID and Doctor ID are required' })
    }

    const patient = await User.findById(patientId)
    const doctor = await User.findById(doctorId)

    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ message: 'Patient not found' })
    }

    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ message: 'Doctor not found' })
    }

    // Xóa bác sĩ cũ khỏi danh sách bệnh nhân (nếu có)
    if (patient.assignedDoctor) {
      const oldDoctor = await User.findById(patient.assignedDoctor)
      if (oldDoctor) {
        oldDoctor.patients = oldDoctor.patients.filter(
          (p) => p.toString() !== patientId
        )
        await oldDoctor.save()
      }
    }

    // Gán bác sĩ mới
    patient.assignedDoctor = doctorId
    await patient.save()

    // Thêm bệnh nhân vào danh sách bệnh nhân của bác sĩ
    if (!doctor.patients.includes(patientId)) {
      doctor.patients.push(patientId)
      await doctor.save()
    }

    return res.status(200).json({
      message: 'Doctor assigned to patient successfully',
      patient: {
        _id: patient._id,
        username: patient.username,
        assignedDoctor: doctorId,
      },
    })
  } catch (err) {
    console.error('Error in assignDoctorToPatient:', err)
    return res.status(500).json({
      message: 'Error assigning doctor to patient',
      error: err.toString(),
    })
  }
}

// Lấy danh sách bệnh nhân của bác sĩ
exports.getDoctorPatients = async (req, res) => {
  try {
    const doctorId = req.user.id
    const doctor = await User.findById(doctorId).populate('patients')

    if (!doctor || doctor.role !== 'doctor') {
      return res.status(403).json({ message: 'Access denied' })
    }

    return res.status(200).json({
      patients: doctor.patients,
    })
  } catch (err) {
    console.error('Error in getDoctorPatients:', err)
    return res
      .status(500)
      .json({ message: 'Error fetching patients', error: err.toString() })
  }
}

// Lấy thông tin bác sĩ được gán cho bệnh nhân
exports.getPatientDoctor = async (req, res) => {
  try {
    const patientId = req.user.id
    const patient = await User.findById(patientId).populate('assignedDoctor')

    if (!patient || patient.role !== 'patient') {
      return res.status(403).json({ message: 'Access denied' })
    }

    if (!patient.assignedDoctor) {
      return res.status(404).json({ message: 'No doctor assigned' })
    }

    return res.status(200).json({
      doctor: patient.assignedDoctor,
    })
  } catch (err) {
    console.error('Error in getPatientDoctor:', err)
    return res
      .status(500)
      .json({ message: 'Error fetching doctor', error: err.toString() })
  }
}

// Lấy danh sách tất cả bác sĩ
exports.getAllDoctors = async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor' }).select('-password')
    return res.status(200).json({ doctors })
  } catch (err) {
    console.error('Error in getAllDoctors:', err)
    return res
      .status(500)
      .json({ message: 'Error fetching doctors', error: err.toString() })
  }
}

// Lấy danh sách tất cả bệnh nhân
exports.getAllPatients = async (req, res) => {
  try {
    const patients = await User.find({ role: 'patient' }).select('-password')
    return res.status(200).json({ patients })
  } catch (err) {
    console.error('Error in getAllPatients:', err)
    return res
      .status(500)
      .json({ message: 'Error fetching patients', error: err.toString() })
  }
}

// Cập nhật thông tin người dùng
exports.updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id
    const updateData = req.body

    // Không cho phép cập nhật một số trường nhạy cảm
    delete updateData.password
    delete updateData.email
    delete updateData.role
    delete updateData.isVerified
    delete updateData.createdBy

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select('-password')

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' })
    }

    return res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedUser,
    })
  } catch (err) {
    console.error('Error in updateUserProfile:', err)
    return res
      .status(500)
      .json({ message: 'Error updating profile', error: err.toString() })
  }
}

// Xóa tài khoản (chỉ admin mới có quyền)
exports.deleteUserAccount = async (req, res) => {
  try {
    const adminId = req.user.id
    const admin = await User.findById(adminId)

    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can delete accounts' })
    }

    const { userId } = req.params

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Không cho phép xóa admin khác
    if (user.role === 'admin' && user._id.toString() !== adminId) {
      return res
        .status(403)
        .json({ message: 'Cannot delete other admin accounts' })
    }

    await User.findByIdAndDelete(userId)

    return res.status(200).json({
      message: 'User account deleted successfully',
    })
  } catch (err) {
    console.error('Error in deleteUserAccount:', err)
    return res
      .status(500)
      .json({ message: 'Error deleting user account', error: err.toString() })
  }
}

exports.getProfile = async (req, res) => {
  try {
    // Lấy user từ DB dựa vào id trong token
    const User = require('../models/User')
    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    res.json({ user })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
}
