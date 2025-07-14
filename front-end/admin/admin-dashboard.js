// Global variables
let currentUser = null
let doctors = []
let patients = []
let assignments = []

// API Base URLs
const API_BASE = 'http://localhost:3000/api'
const USER_API = `${API_BASE}/users`

// Initialize the application
document.addEventListener('DOMContentLoaded', function () {
  checkAuth()
  setupEventListeners()
  loadDashboardData()
})

// Check authentication
function checkAuth() {
  const token = localStorage.getItem('token')
  if (!token) {
    window.location.href = '../login/login.html'
    return
  }

  // Decode token to get user info
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    currentUser = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
    }

    if (currentUser.role !== 'admin') {
      showNotification('Bạn không có quyền truy cập trang này', 'error')
      setTimeout(() => {
        window.location.href = '../login/login.html'
      }, 2000)
      return
    }

    document.getElementById('adminName').textContent = currentUser.email
  } catch (error) {
    console.error('Error decoding token:', error)
    localStorage.removeItem('token')
    window.location.href = '../login/login.html'
  }
}

// Setup event listeners
function setupEventListeners() {
  // Navigation
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', function () {
      const tabName = this.dataset.tab
      switchTab(tabName)
    })
  })

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', logout)

  // Modal close buttons
  document.querySelectorAll('.close').forEach((closeBtn) => {
    closeBtn.addEventListener('click', function () {
      this.closest('.modal').style.display = 'none'
    })
  })

  // Close modal when clicking outside
  window.addEventListener('click', function (event) {
    if (event.target.classList.contains('modal')) {
      event.target.style.display = 'none'
    }
  })

  // Form submissions
  document
    .getElementById('createDoctorForm')
    .addEventListener('submit', handleCreateDoctor)
  document
    .getElementById('createPatientForm')
    .addEventListener('submit', handleCreatePatient)
  document
    .getElementById('assignmentForm')
    .addEventListener('submit', handleAssignment)
}

// Switch between tabs
function switchTab(tabName) {
  // Remove active class from all tabs and buttons
  document.querySelectorAll('.tab-content').forEach((tab) => {
    tab.classList.remove('active')
  })
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.classList.remove('active')
  })

  // Add active class to selected tab and button
  document.getElementById(tabName).classList.add('active')
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active')

  // Load data for the selected tab
  switch (tabName) {
    case 'dashboard':
      loadDashboardData()
      break
    case 'doctors':
      loadDoctors()
      break
    case 'patients':
      loadPatients()
      break
    case 'assignments':
      loadAssignments()
      break
    case 'statistics':
      loadStatistics()
      break
  }
}

// Load dashboard data
async function loadDashboardData() {
  try {
    const [doctorsRes, patientsRes] = await Promise.all([
      makeAuthenticatedRequest(`${USER_API}/doctors`),
      makeAuthenticatedRequest(`${USER_API}/patients`),
    ])

    const doctorsData = await doctorsRes.json()
    const patientsData = await patientsRes.json()

    // Update stats
    document.getElementById('totalDoctors').textContent =
      doctorsData.doctors?.length || 0
    document.getElementById('totalPatients').textContent =
      patientsData.patients?.length || 0

    // Calculate assignments
    const assignedPatients =
      patientsData.patients?.filter((p) => p.assignedDoctor) || []
    document.getElementById('totalAssignments').textContent =
      assignedPatients.length

    // Lấy số phòng chat hoạt động từ chat-service
    try {
      const chatRes = await fetch('http://localhost:3002/chat/rooms/count')
      const chatData = await chatRes.json()
      document.getElementById('activeChats').textContent = chatData.count || 0
    } catch (e) {
      document.getElementById('activeChats').textContent = '0'
    }
  } catch (error) {
    console.error('Error loading dashboard data:', error)
    showNotification('Lỗi khi tải dữ liệu dashboard', 'error')
  }
}

// Load doctors
async function loadDoctors() {
  try {
    const response = await makeAuthenticatedRequest(`${USER_API}/doctors`)
    const data = await response.json()
    doctors = data.doctors || []

    const tbody = document.getElementById('doctorsTableBody')
    tbody.innerHTML = ''

    if (doctors.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="7" class="loading">Không có bác sĩ nào</td></tr>'
      return
    }

    doctors.forEach((doctor) => {
      const row = document.createElement('tr')
      row.innerHTML = `
                <td>${doctor.username}</td>
                <td>${doctor.email}</td>
                <td>${doctor.doctorInfo?.specialization || 'N/A'}</td>
                <td>${doctor.doctorInfo?.department || 'N/A'}</td>
                <td>${doctor.doctorInfo?.phoneNumber || 'N/A'}</td>
                <td>${doctor.patients?.length || 0}</td>
                <td>
                    <button class="action-btn edit" onclick="editDoctor('${
                      doctor._id
                    }')" title="Chỉnh sửa">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteDoctor('${
                      doctor._id
                    }')" title="Xóa">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `
      tbody.appendChild(row)
    })
  } catch (error) {
    console.error('Error loading doctors:', error)
    showNotification('Lỗi khi tải danh sách bác sĩ', 'error')
  }
}

// Sửa loadPatients để hiển thị tên bác sĩ được gán
async function loadPatients() {
  try {
    const [doctorsRes, patientsRes] = await Promise.all([
      makeAuthenticatedRequest(`${USER_API}/doctors`),
      makeAuthenticatedRequest(`${USER_API}/patients`),
    ])
    const doctorsData = await doctorsRes.json()
    const data = await patientsRes.json()
    doctors = doctorsData.doctors || []
    patients = data.patients || []

    const tbody = document.getElementById('patientsTableBody')
    tbody.innerHTML = ''

    if (patients.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="5" class="loading">Không có bệnh nhân nào</td></tr>'
      return
    }

    patients.forEach((patient) => {
      let doctorName = 'Chưa gán'
      if (patient.assignedDoctor) {
        const doctor = doctors.find((d) => d._id === patient.assignedDoctor)
        doctorName = doctor ? doctor.username : 'Đã gán'
      }
      const row = document.createElement('tr')
      row.innerHTML = `
                <td>${patient.username}</td>
                <td>${patient.email}</td>
                <td>${patient.patientInfo?.phoneNumber || 'N/A'}</td>
                <td>${doctorName}</td>
                <td>
                    <button class="action-btn edit" onclick="editPatient('${
                      patient._id
                    }')" title="Chỉnh sửa">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="deletePatient('${
                      patient._id
                    }')" title="Xóa">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `
      tbody.appendChild(row)
    })
  } catch (error) {
    console.error('Error loading patients:', error)
    showNotification('Lỗi khi tải danh sách bệnh nhân', 'error')
  }
}

// Sửa loadAssignments để hiển thị tên bác sĩ được gán
async function loadAssignments() {
  try {
    const [doctorsRes, patientsRes] = await Promise.all([
      makeAuthenticatedRequest(`${USER_API}/doctors`),
      makeAuthenticatedRequest(`${USER_API}/patients`),
    ])
    const doctorsData = await doctorsRes.json()
    const data = await patientsRes.json()
    const allPatients = data.patients || []
    const doctors = doctorsData.doctors || []

    const tbody = document.getElementById('assignmentsTableBody')
    tbody.innerHTML = ''

    if (allPatients.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="4" class="loading">Không có bệnh nhân nào</td></tr>'
      return
    }

    allPatients.forEach((patient) => {
      let doctorName = 'Chưa có bác sĩ'
      if (patient.assignedDoctor) {
        const doctor = doctors.find((d) => d._id === patient.assignedDoctor)
        doctorName = doctor ? doctor.username : 'Đã gán'
      }
      const row = document.createElement('tr')
      row.innerHTML = `
                <td>${patient.username}</td>
                <td>${doctorName}</td>
                <td>${patient.email}</td>
                <td>
                    <button class="btn-primary" onclick="showAssignmentModal('${
                      patient._id
                    }')">
                        ${patient.assignedDoctor ? 'Thay đổi' : 'Gán bác sĩ'}
                    </button>
                </td>
            `
      tbody.appendChild(row)
    })
  } catch (error) {
    console.error('Error loading assignments:', error)
    showNotification('Lỗi khi tải danh sách gán bác sĩ', 'error')
  }
}

// Load statistics
async function loadStatistics() {
  try {
    // Placeholder for statistics
    document.getElementById('userDistributionChart').innerHTML =
      '<p>Biểu đồ phân bố người dùng sẽ được hiển thị ở đây</p>'
    document.getElementById('chatActivityChart').innerHTML =
      '<p>Biểu đồ hoạt động chat sẽ được hiển thị ở đây</p>'
  } catch (error) {
    console.error('Error loading statistics:', error)
    showNotification('Lỗi khi tải thống kê', 'error')
  }
}

// Modal functions
function showCreateDoctorModal(isEdit = false) {
  document.getElementById('createDoctorModal').style.display = 'block'
  document.getElementById('createDoctorForm').reset()
  const passwordInput = document.getElementById('doctorPassword')
  if (isEdit) {
    document.getElementById('doctorModalTitle').innerHTML =
      '<i class="fas fa-user-md"></i> Chỉnh sửa Bác sĩ'
    document.getElementById('doctorModalSubmitBtn').textContent = 'Cập nhật'
    passwordInput.required = false
    passwordInput.placeholder = 'Để trống nếu không muốn đổi mật khẩu'
  } else {
    document.getElementById('doctorModalTitle').innerHTML =
      '<i class="fas fa-user-md"></i> Thêm Bác sĩ mới'
    document.getElementById('doctorModalSubmitBtn').textContent = 'Thêm Bác sĩ'
    passwordInput.required = true
    passwordInput.placeholder = ''
  }
}

function hideCreateDoctorModal() {
  document.getElementById('createDoctorModal').style.display = 'none'
}

function showCreatePatientModal(isEdit = false) {
  document.getElementById('createPatientModal').style.display = 'block'
  document.getElementById('createPatientForm').reset()
  const passwordInput = document.getElementById('patientPassword')
  const modalTitle = document.querySelector(
    '#createPatientModal .modal-header h3'
  )
  const submitBtn = document.querySelector('#createPatientModal .btn-primary')
  if (isEdit) {
    passwordInput.required = false
    passwordInput.placeholder = 'Để trống nếu không muốn đổi mật khẩu'
    modalTitle.innerHTML =
      '<i class="fas fa-user-injured"></i> Chỉnh sửa Bệnh nhân'
    submitBtn.textContent = 'Cập nhật'
  } else {
    passwordInput.required = true
    passwordInput.placeholder = ''
    modalTitle.innerHTML =
      '<i class="fas fa-user-injured"></i> Thêm Bệnh nhân mới'
    submitBtn.textContent = 'Thêm Bệnh nhân'
  }
}

function hideCreatePatientModal() {
  document.getElementById('createPatientModal').style.display = 'none'
}

function showAssignmentModal(patientId = null) {
  document.getElementById('assignmentModal').style.display = 'block'
  document.getElementById('assignmentForm').reset()
  const patientSelect = document.getElementById('assignmentPatient')
  if (patientId) {
    patientSelect.disabled = true
    loadAssignmentOptions(patientId).then(() => {
      patientSelect.value = patientId
      // Thêm input hidden nếu chưa có
      let hidden = document.getElementById('assignmentPatientHidden')
      if (!hidden) {
        hidden = document.createElement('input')
        hidden.type = 'hidden'
        hidden.id = 'assignmentPatientHidden'
        hidden.name = 'patientId'
        document.getElementById('assignmentForm').appendChild(hidden)
      }
      hidden.value = patientId
    })
  } else {
    patientSelect.disabled = false
    // Xóa input hidden nếu có
    const hidden = document.getElementById('assignmentPatientHidden')
    if (hidden) hidden.remove()
    loadAssignmentOptions()
  }
}

function hideAssignmentModal() {
  document.getElementById('assignmentModal').style.display = 'none'
  document.getElementById('assignmentPatient').disabled = false
  // Xóa input hidden nếu có
  const hidden = document.getElementById('assignmentPatientHidden')
  if (hidden) hidden.remove()
}

// Sửa loadAssignmentOptions để lọc bác sĩ chưa được gán cho bệnh nhân
async function loadAssignmentOptions(patientId = null) {
  try {
    const [doctorsRes, patientsRes] = await Promise.all([
      makeAuthenticatedRequest(`${USER_API}/doctors`),
      makeAuthenticatedRequest(`${USER_API}/patients`),
    ])

    const doctorsData = await doctorsRes.json()
    const patientsData = await patientsRes.json()

    // Lấy patient đang chọn (nếu có)
    let assignedDoctorId = null
    if (patientId) {
      const patient = patientsData.patients?.find((p) => p._id === patientId)
      assignedDoctorId = patient?.assignedDoctor || null
    }

    // Populate patient select
    const patientSelect = document.getElementById('assignmentPatient')
    patientSelect.innerHTML = '<option value="">-- Chọn Bệnh nhân --</option>'
    patientsData.patients?.forEach((patient) => {
      const option = document.createElement('option')
      option.value = patient._id
      option.textContent = `${patient.username} (${patient.email})`
      patientSelect.appendChild(option)
    })

    // Populate doctor select, chỉ hiển thị bác sĩ chưa được gán cho bệnh nhân này
    const doctorSelect = document.getElementById('assignmentDoctor')
    doctorSelect.innerHTML = '<option value="">-- Chọn Bác sĩ --</option>'
    doctorsData.doctors?.forEach((doctor) => {
      if (!assignedDoctorId || doctor._id !== assignedDoctorId) {
        const option = document.createElement('option')
        option.value = doctor._id
        option.textContent = `${doctor.username} - ${
          doctor.doctorInfo?.specialization || 'N/A'
        }`
        doctorSelect.appendChild(option)
      }
    })
  } catch (error) {
    console.error('Error loading assignment options:', error)
    showNotification('Lỗi khi tải danh sách lựa chọn', 'error')
  }
}

// Form handlers
async function handleCreateDoctor(event) {
  event.preventDefault()

  const formData = new FormData(event.target)
  const editId = event.target.dataset.editId

  let doctorData
  if (editId) {
    // Khi cập nhật, KHÔNG gửi username
    doctorData = {
      doctorInfo: {
        specialization: formData.get('doctorInfo.specialization'),
        licenseNumber: formData.get('doctorInfo.licenseNumber'),
        department: formData.get('doctorInfo.department'),
        phoneNumber: formData.get('doctorInfo.phoneNumber'),
      },
    }
  } else {
    // Khi tạo mới, gửi đầy đủ
    doctorData = {
      username: formData.get('username'),
      email: formData.get('email'),
      password: formData.get('password'),
      specialization: formData.get('doctorInfo.specialization'),
      licenseNumber: formData.get('doctorInfo.licenseNumber'),
      department: formData.get('doctorInfo.department'),
      phoneNumber: formData.get('doctorInfo.phoneNumber'),
    }
  }

  try {
    let response, data
    if (editId) {
      // Cập nhật bác sĩ
      response = await fetch(`${USER_API}/doctors/${editId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(doctorData),
      })
      data = await response.json()
      if (response.ok) {
        // Nếu có nhập mật khẩu mới thì gọi API đổi mật khẩu
        const newPassword = formData.get('password')
        if (newPassword) {
          const pwRes = await fetch(
            `${USER_API}/doctors/${editId}/change-password`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('token')}`,
              },
              body: JSON.stringify({ newPassword }),
            }
          )
          const pwData = await pwRes.json()
          if (pwRes.ok) {
            showNotification('Đổi mật khẩu thành công', 'success')
          } else {
            showNotification(pwData.message || 'Lỗi khi đổi mật khẩu', 'error')
          }
        } else {
          showNotification('Cập nhật thông tin bác sĩ thành công', 'success')
        }
      } else {
        showNotification(data.message || 'Lỗi khi cập nhật bác sĩ', 'error')
      }
      // Xóa editId sau khi cập nhật
      delete event.target.dataset.editId
    } else {
      // Tạo mới bác sĩ
      response = await fetch(`${USER_API}/create-doctor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(doctorData),
      })
      data = await response.json()
      if (response.ok) {
        showNotification('Tạo tài khoản bác sĩ thành công', 'success')
      } else {
        showNotification(
          data.message || 'Lỗi khi tạo tài khoản bác sĩ',
          'error'
        )
      }
    }

    hideCreateDoctorModal()
    loadDoctors()
    loadDashboardData()
  } catch (error) {
    console.error('Error creating/updating doctor:', error)
    showNotification('Lỗi khi tạo/cập nhật tài khoản bác sĩ', 'error')
  }
}

async function handleCreatePatient(event) {
  event.preventDefault()
  const formData = new FormData(event.target)
  const editId = event.target.dataset.editId
  let patientData
  if (editId) {
    // Khi cập nhật, KHÔNG gửi username/email/password
    patientData = {
      phoneNumber: formData.get('phoneNumber'),
      address: formData.get('address'),
      emergencyContact: formData.get('emergencyContact'),
    }
  } else {
    // Khi tạo mới, gửi đầy đủ
    patientData = {
      username: formData.get('username'),
      email: formData.get('email'),
      password: formData.get('password'),
      phoneNumber: formData.get('phoneNumber'),
      address: formData.get('address'),
      emergencyContact: formData.get('emergencyContact'),
    }
  }
  try {
    let response, data
    if (editId) {
      // Cập nhật bệnh nhân
      response = await fetch(`${USER_API}/patients/${editId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(patientData),
      })
      data = await response.json()
      if (response.ok) {
        // Nếu có nhập mật khẩu mới thì gọi API đổi mật khẩu
        const newPassword = formData.get('password')
        if (newPassword) {
          const pwRes = await fetch(
            `${USER_API}/patients/${editId}/change-password`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('token')}`,
              },
              body: JSON.stringify({ newPassword }),
            }
          )
          const pwData = await pwRes.json()
          if (pwRes.ok) {
            showNotification('Đổi mật khẩu thành công', 'success')
          } else {
            showNotification(pwData.message || 'Lỗi khi đổi mật khẩu', 'error')
          }
        } else {
          showNotification('Cập nhật thông tin bệnh nhân thành công', 'success')
        }
      } else {
        showNotification(data.message || 'Lỗi khi cập nhật bệnh nhân', 'error')
      }
      delete event.target.dataset.editId
    } else {
      // Tạo mới bệnh nhân
      response = await fetch(`${USER_API}/create-patient`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(patientData),
      })
      data = await response.json()
      if (response.ok) {
        showNotification('Tạo tài khoản bệnh nhân thành công', 'success')
      } else {
        showNotification(
          data.message || 'Lỗi khi tạo tài khoản bệnh nhân',
          'error'
        )
      }
    }
    hideCreatePatientModal()
    loadPatients()
    loadDashboardData()
  } catch (error) {
    console.error('Error creating/updating patient:', error)
    showNotification('Lỗi khi tạo/cập nhật tài khoản bệnh nhân', 'error')
  }
}

async function handleAssignment(event) {
  event.preventDefault()

  const formData = new FormData(event.target)
  const assignmentData = {
    patientId: formData.get('patientId'),
    doctorId: formData.get('doctorId'),
  }

  try {
    const response = await fetch(`${USER_API}/assign-doctor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(assignmentData),
    })

    const data = await response.json()

    if (response.ok) {
      showNotification('Gán bác sĩ thành công', 'success')
      hideAssignmentModal()
      loadAssignments()
      loadDashboardData()
    } else {
      showNotification(data.message || 'Lỗi khi gán bác sĩ', 'error')
    }
  } catch (error) {
    console.error('Error assigning doctor:', error)
    showNotification('Lỗi khi gán bác sĩ', 'error')
  }
}

async function unassignDoctor() {
  const patientId =
    document.getElementById('assignmentPatient').value ||
    document.getElementById('assignmentPatientHidden')?.value
  if (!patientId) return
  try {
    const response = await fetch(
      `${USER_API}/patients/${patientId}/unassign-doctor`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    )
    const data = await response.json()
    if (response.ok) {
      showNotification('Đã bỏ gán bác sĩ cho bệnh nhân', 'success')
      hideAssignmentModal()
      loadAssignments()
      loadPatients()
    } else {
      showNotification(data.message || 'Lỗi khi bỏ gán bác sĩ', 'error')
    }
  } catch (error) {
    showNotification('Lỗi khi bỏ gán bác sĩ', 'error')
  }
}

// Edit and delete functions
function editDoctor(doctorId) {
  const doctor = doctors.find((d) => d._id === doctorId)
  if (doctor) {
    showCreateDoctorModal(true)
    document.getElementById('doctorUsername').value = doctor.username
    document.getElementById('doctorEmail').value = doctor.email
    document.getElementById('specialization').value =
      doctor.doctorInfo?.specialization || ''
    document.getElementById('licenseNumber').value =
      doctor.doctorInfo?.licenseNumber || ''
    document.getElementById('department').value =
      doctor.doctorInfo?.department || ''
    document.getElementById('addDoctorPhoneNumber').value =
      doctor.doctorInfo?.phoneNumber || ''
    document.getElementById('createDoctorForm').dataset.editId = doctorId
  }
}

function editPatient(patientId) {
  const patient = patients.find((p) => p._id === patientId)
  if (patient) {
    showCreatePatientModal(true)
    document.getElementById('patientUsername').value = patient.username
    document.getElementById('patientEmail').value = patient.email
    document.getElementById('phoneNumber').value =
      patient.patientInfo?.phoneNumber || ''
    document.getElementById('address').value =
      patient.patientInfo?.address || ''
    document.getElementById('emergencyContact').value =
      patient.patientInfo?.emergencyContact || ''
    document.getElementById('createPatientForm').dataset.editId = patientId
  }
}

async function deleteDoctor(doctorId) {
  if (!confirm('Bạn có chắc chắn muốn xóa bác sĩ này?')) {
    return
  }

  try {
    const response = await fetch(`${USER_API}/users/${doctorId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    })

    if (response.ok) {
      showNotification('Xóa bác sĩ thành công', 'success')
      loadDoctors()
      loadDashboardData()
    } else {
      const data = await response.json()
      showNotification(data.message || 'Lỗi khi xóa bác sĩ', 'error')
    }
  } catch (error) {
    console.error('Error deleting doctor:', error)
    showNotification('Lỗi khi xóa bác sĩ', 'error')
  }
}

async function deletePatient(patientId) {
  if (!confirm('Bạn có chắc chắn muốn xóa bệnh nhân này?')) {
    return
  }

  try {
    const response = await fetch(`${USER_API}/users/${patientId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    })

    if (response.ok) {
      showNotification('Xóa bệnh nhân thành công', 'success')
      loadPatients()
      loadDashboardData()
    } else {
      const data = await response.json()
      showNotification(data.message || 'Lỗi khi xóa bệnh nhân', 'error')
    }
  } catch (error) {
    console.error('Error deleting patient:', error)
    showNotification('Lỗi khi xóa bệnh nhân', 'error')
  }
}

// Utility functions
function showNotification(message, type = 'info') {
  const notification = document.getElementById('notification')
  notification.textContent = message
  notification.className = `notification ${type} show`

  setTimeout(() => {
    notification.classList.remove('show')
  }, 3000)
}

function logout() {
  localStorage.removeItem('token')
  window.location.href = '../login/login.html'
}

// Helper function to make authenticated requests
async function makeAuthenticatedRequest(url, options = {}) {
  const token = localStorage.getItem('token')
  if (!token) {
    throw new Error('No authentication token')
  }

  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  }

  const finalOptions = { ...defaultOptions, ...options }
  if (options.body) {
    finalOptions.body = JSON.stringify(options.body)
  }

  return fetch(url, finalOptions)
}
