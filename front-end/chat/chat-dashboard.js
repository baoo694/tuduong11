// Global variables
let socket
let currentUser = null
let currentRoom = null
let selectedPatient = null
let patientList = []

// DOM elements
const doctorNameEl = document.getElementById('doctorName')
const patientListEl = document.getElementById('patientList')
const doctorInfoEl = document.getElementById('doctorInfo')
const chatTitleTextEl = document.getElementById('chatTitleText')
const chatStatusEl = document.getElementById('chatStatus')
const chatMessagesEl = document.getElementById('chatMessages')
const messageInputEl = document.getElementById('messageInput')
const sendBtnEl = document.getElementById('sendBtn')
const logoutBtnEl = document.getElementById('logoutBtn')
const updateProfileBtnEl = document.getElementById('updateProfileBtn')
const updateProfileModalEl = document.getElementById('updateProfileModal')
const updateProfileFormEl = document.getElementById('updateProfileForm')
const notificationEl = document.getElementById('notification')

// API endpoints
const API_BASE = 'http://localhost:3000/api'
const USER_API = `${API_BASE}/users`
const CHAT_API = `${API_BASE}/chat`

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
  initializeApp()
  setupEventListeners()
})

function initializeApp() {
  // Check if user is logged in
  const token = localStorage.getItem('token')
  if (!token) {
    window.location.href = '../login/login.html'
    return
  }

  // Load user data
  loadUserData()

  // Initialize socket connection
  initializeSocket()
}

function setupEventListeners() {
  console.log('Setting up event listeners')
  console.log('sendBtnEl:', sendBtnEl)
  console.log('messageInputEl:', messageInputEl)

  // Logout
  logoutBtnEl.addEventListener('click', logout)

  // Send message
  sendBtnEl.addEventListener('click', sendMessage)
  messageInputEl.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  })

  // Update profile
  updateProfileBtnEl.addEventListener('click', showUpdateProfileModal)

  // Modal events
  const closeBtn = updateProfileModalEl.querySelector('.close')
  const cancelBtn = document.getElementById('cancelUpdate')

  closeBtn.addEventListener('click', hideUpdateProfileModal)
  cancelBtn.addEventListener('click', hideUpdateProfileModal)

  updateProfileModalEl.addEventListener('click', (e) => {
    if (e.target === updateProfileModalEl) {
      hideUpdateProfileModal()
    }
  })

  updateProfileFormEl.addEventListener('submit', updateProfile)
}

async function loadUserData() {
  try {
    const token = localStorage.getItem('token')
    const response = await fetch(`${USER_API}/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to load user data')
    }

    const data = await response.json()
    currentUser = data.user

    // Update UI
    doctorNameEl.textContent = currentUser.username

    // Load assigned patients
    await loadAssignedPatients()

    // Load doctor info
    loadDoctorInfo()
  } catch (error) {
    console.error('Error loading user data:', error)

    // Fallback: try to get user info from localStorage
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        currentUser = JSON.parse(userStr)
        doctorNameEl.textContent = currentUser.username

        // Load assigned patients
        await loadAssignedPatients()

        // Load doctor info
        loadDoctorInfo()
        return
      } catch (parseError) {
        console.error('Error parsing user from localStorage:', parseError)
      }
    }

    showNotification('Lỗi khi tải thông tin người dùng', 'error')
  }
}

async function loadAssignedPatients() {
  try {
    const token = localStorage.getItem('token')
    const response = await fetch(`${USER_API}/doctor/patients`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (response.ok) {
      const data = await response.json()
      patientList = data.patients || []
      displayPatientList(patientList)
    } else if (response.status === 403) {
      // Fallback: load all patients if doctor/patients endpoint is not accessible
      console.log(
        'Doctor patients endpoint not accessible, loading all patients...'
      )
      const allPatientsResponse = await fetch(`${USER_API}/patients`)
      if (allPatientsResponse.ok) {
        const allPatientsData = await allPatientsResponse.json()
        patientList = allPatientsData.patients || []
        displayPatientList(patientList)
      } else {
        throw new Error('Failed to load patients')
      }
    } else {
      throw new Error('Failed to load assigned patients')
    }
  } catch (error) {
    console.error('Error loading assigned patients:', error)
    displayNoPatients()
  }
}

function displayPatientList(patients) {
  if (patients.length === 0) {
    displayNoPatients()
    return
  }

  patientListEl.innerHTML = patients
    .map((patient) => {
      const avatar = patient.username.charAt(0).toUpperCase()
      return `
        <div class="patient-item" data-patient-id="${patient._id}">
          <div class="patient-avatar">${avatar}</div>
          <div class="patient-details">
            <div class="patient-name">${patient.username}</div>
            <div class="patient-email">${patient.email}</div>
          </div>
        </div>
      `
    })
    .join('')

  // Add click event listeners
  const patientItems = patientListEl.querySelectorAll('.patient-item')
  patientItems.forEach((item) => {
    item.addEventListener('click', () => {
      const patientId = item.dataset.patientId
      const patient = patients.find((p) => p._id === patientId)
      selectPatient(patient)
    })
  })
}

function displayNoPatients() {
  patientListEl.innerHTML = `
    <div class="no-patients">
      <i class="fas fa-users" style="font-size: 2rem; color: #cbd5e0; margin-bottom: 1rem;"></i>
      <p style="color: #718096; text-align: center;">Chưa có bệnh nhân được gán</p>
    </div>
  `
}

function loadDoctorInfo() {
  if (!currentUser) return

  const doctorInfo = currentUser.doctorInfo || {}
  doctorInfoEl.innerHTML = `
    <div class="info-item">
      <span class="info-label">Tên đăng nhập:</span>
      <span class="info-value">${currentUser.username}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Email:</span>
      <span class="info-value">${currentUser.email}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Chuyên khoa:</span>
      <span class="info-value">${
        doctorInfo.specialization || 'Chưa cập nhật'
      }</span>
    </div>
    <div class="info-item">
      <span class="info-label">Số giấy phép:</span>
      <span class="info-value">${
        doctorInfo.licenseNumber || 'Chưa cập nhật'
      }</span>
    </div>
    <div class="info-item">
      <span class="info-label">Phòng ban:</span>
      <span class="info-value">${
        doctorInfo.department || 'Chưa cập nhật'
      }</span>
    </div>
    <div class="info-item">
      <span class="info-label">Số điện thoại:</span>
      <span class="info-value">${
        doctorInfo.phoneNumber || 'Chưa cập nhật'
      }</span>
    </div>
  `
}

function selectPatient(patient) {
  console.log('Selecting patient:', patient)
  selectedPatient = patient

  // Update UI
  updatePatientSelection(patient._id)
  updateChatTitle(patient.username)
  enableChat()

  // Load or create chat room
  loadChatRoom(patient)

  // Xóa badge khi vào phòng chat
  if (patient && unreadPatientMessages[patient.username]) {
    delete unreadPatientMessages[patient.username]
    updatePatientListBadge()
  }
}

function updatePatientSelection(patientId) {
  // Remove active class from all patients
  const patientItems = patientListEl.querySelectorAll('.patient-item')
  patientItems.forEach((item) => item.classList.remove('active'))

  // Add active class to selected patient
  const selectedItem = patientListEl.querySelector(
    `[data-patient-id="${patientId}"]`
  )
  if (selectedItem) {
    selectedItem.classList.add('active')
  }
}

function updateChatTitle(patientName) {
  chatTitleTextEl.textContent = `Chat với ${patientName}`
}

function enableChat() {
  messageInputEl.disabled = false
  sendBtnEl.disabled = false
  messageInputEl.focus()
}

function disableChat() {
  messageInputEl.disabled = true
  sendBtnEl.disabled = true
}

async function loadChatRoom(patient) {
  if (!currentUser || !patient) {
    showWelcomeMessage()
    return
  }

  try {
    const response = await fetch(
      `${CHAT_API}/doctor-patient/room?doctorId=${currentUser._id}&patientId=${patient._id}&doctorUsername=${currentUser.username}&patientUsername=${patient.username}`
    )

    if (response.ok) {
      const data = await response.json()
      currentRoom = data.room
      joinChatRoom()
      loadChatMessages()
    } else if (response.status === 404) {
      // Create new chat room
      await createChatRoom(patient)
    } else {
      throw new Error('Failed to load chat room')
    }
  } catch (error) {
    console.error('Error loading chat room:', error)
    showNotification('Lỗi khi tải phòng chat', 'error')
  }
}

async function createChatRoom(patient) {
  try {
    const response = await fetch(`${CHAT_API}/doctor-patient/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        doctorId: currentUser._id,
        patientId: patient._id,
        doctorUsername: currentUser.username,
        patientUsername: patient.username,
      }),
    })

    if (response.ok) {
      const data = await response.json()
      currentRoom = data
      joinChatRoom()
      loadChatMessages()
    } else {
      throw new Error('Failed to create chat room')
    }
  } catch (error) {
    console.error('Error creating chat room:', error)
    showNotification('Lỗi khi tạo phòng chat', 'error')
  }
}

function initializeSocket() {
  socket = io('http://localhost:3002')

  socket.on('connect', () => {
    console.log('Connected to socket server, socket id:', socket.id)
    updateConnectionStatus(true)
  })

  socket.on('disconnect', () => {
    console.log('Disconnected from socket server, socket id:', socket.id)
    updateConnectionStatus(false)
  })

  socket.on('chatMessage', (message) => {
    if (message.roomId === currentRoom?._id) {
      addMessageToChat(message)
    }
  })

  socket.on('userJoined', (data) => {
    if (data.roomId === currentRoom?._id) {
      addSystemMessage(`${data.username} đã tham gia cuộc trò chuyện`)
    }
  })

  socket.on('userLeft', (data) => {
    if (data.roomId === currentRoom?._id) {
      addSystemMessage(`${data.username} đã rời cuộc trò chuyện`)
    }
  })

  // Debug: test emit
  socket.emit('test', { message: 'test from frontend' })

  // Debug: listen for test from backend
  socket.on('testFromBackend', (data) => {
    console.log('Received test from backend:', data)
  })
}

function joinChatRoom() {
  if (socket && currentRoom) {
    console.log('Joining room:', currentRoom._id)
    socket.emit('joinRoom', currentRoom._id)
  }
}

function updateConnectionStatus(connected) {
  const statusIndicator = chatStatusEl.querySelector('.status-indicator')
  const statusText = chatStatusEl.querySelector('.status-text')

  if (connected) {
    statusIndicator.className = 'status-indicator online'
    statusText.textContent = 'Đã kết nối'
  } else {
    statusIndicator.className = 'status-indicator offline'
    statusText.textContent = 'Không kết nối'
  }
}

async function loadChatMessages() {
  if (!currentRoom) return

  try {
    const response = await fetch(
      `${CHAT_API}/${currentRoom._id}?username=${currentUser.username}`
    )
    if (response.ok) {
      const data = await response.json()
      displayMessages(data.messages)
    }
  } catch (error) {
    console.error('Error loading messages:', error)
  }
}

function displayMessages(messages) {
  chatMessagesEl.innerHTML = ''
  messages.forEach((message) => {
    addMessageToChat(message)
  })
  scrollToBottom()
}

function addMessageToChat(message) {
  // Nếu là system message
  if (message.type === 'system') {
    const messageHtml = `
      <div class="system-message">
        <span>${message.text || message.content}</span>
      </div>
    `
    chatMessagesEl.insertAdjacentHTML('beforeend', messageHtml)
    scrollToBottom()
    return
  }

  // Lấy tên hiển thị cho avatar
  const displayName =
    message.senderUsername || message.username || message.sender || 'U'
  const avatar = displayName.charAt(0).toUpperCase()
  const time = new Date(message.createdAt).toLocaleTimeString()
  const isMe =
    (message.senderId && message.senderId === currentUser._id) ||
    message.username === currentUser.username

  const messageHtml = `
    <div class="message ${isMe ? 'sent' : ''}">
      <div class="message-avatar">${avatar}</div>
      <div class="message-content">
        <div class="message-bubble">${message.text || message.content}</div>
        <div class="message-info">
          <span class="message-sender">${displayName}</span>
          <span class="message-time">${time}</span>
        </div>
      </div>
    </div>
  `
  chatMessagesEl.insertAdjacentHTML('beforeend', messageHtml)
  scrollToBottom()
}

function addSystemMessage(text) {
  const messageHtml = `
    <div class="system-message">
      <span>${text}</span>
    </div>
  `
  chatMessagesEl.insertAdjacentHTML('beforeend', messageHtml)
  scrollToBottom()
}

function showWelcomeMessage() {
  chatMessagesEl.innerHTML = `
    <div class="welcome-message">
      <i class="fas fa-heartbeat"></i>
      <h3>Chào mừng đến với hệ thống tư vấn y tế</h3>
      <p>
        Chọn một bệnh nhân ở danh sách bên trái để bắt đầu tư vấn và hỗ
        trợ y tế.
      </p>
    </div>
  `
  disableChat()
}

function scrollToBottom() {
  chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight
}

function sendMessage() {
  console.log('sendMessage function called')
  const content = messageInputEl.value.trim()
  console.log('Message content:', content)
  console.log('Current room:', currentRoom)

  if (!content || !currentRoom) {
    console.log('Message not sent: content or room missing')
    return
  }

  const messageData = {
    roomId: currentRoom._id,
    text: content,
    sender: currentUser._id,
    username: currentUser.username,
  }

  console.log('Sending message via API:', messageData)

  // Send via API (REST) - giống như patient
  fetch(`${CHAT_API}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messageData),
  })
    .then((response) => {
      if (response.ok) {
        console.log('Message sent successfully via API')
      } else {
        console.error('Failed to send message via API')
        showNotification('Lỗi khi gửi tin nhắn', 'error')
      }
    })
    .catch((error) => {
      console.error('Error sending message:', error)
      showNotification('Lỗi khi gửi tin nhắn', 'error')
    })

  // Clear input
  messageInputEl.value = ''
}

function showUpdateProfileModal() {
  // Populate form with current data
  const doctorInfo = currentUser.doctorInfo || {}
  document.getElementById('updateUsername').value = currentUser.username
  document.getElementById('updateSpecialization').value =
    doctorInfo.specialization || ''
  document.getElementById('updateLicenseNumber').value =
    doctorInfo.licenseNumber || ''
  document.getElementById('updateDepartment').value =
    doctorInfo.department || ''
  document.getElementById('updatePhoneNumber').value =
    doctorInfo.phoneNumber || ''

  updateProfileModalEl.style.display = 'block'
}

function hideUpdateProfileModal() {
  updateProfileModalEl.style.display = 'none'
}

async function updateProfile(e) {
  e.preventDefault()

  const formData = new FormData(e.target)
  const updateData = {
    username: formData.get('username'),
    doctorInfo: {
      specialization: formData.get('doctorInfo.specialization'),
      licenseNumber: formData.get('doctorInfo.licenseNumber'),
      department: formData.get('doctorInfo.department'),
      phoneNumber: formData.get('doctorInfo.phoneNumber'),
    },
  }

  try {
    const token = localStorage.getItem('token')
    const response = await fetch(`${USER_API}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updateData),
    })

    if (response.ok) {
      hideUpdateProfileModal()
      showNotification('Cập nhật thông tin thành công', 'success')
      await loadUserData() // Gọi lại để reload toàn bộ thông tin mới nhất
    } else {
      const errorData = await response.json()
      showNotification(
        errorData.message || 'Lỗi khi cập nhật thông tin',
        'error'
      )
    }
  } catch (error) {
    console.error('Error updating profile:', error)
    showNotification('Lỗi kết nối. Vui lòng thử lại.', 'error')
  }
}

function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  window.location.href = '../login/login.html'
}

function showNotification(message, type = 'info') {
  notificationEl.textContent = message
  notificationEl.className = `notification ${type} show`

  setTimeout(() => {
    notificationEl.classList.remove('show')
  }, 4000)
}

// Kết nối socket.io tới notification-service để nhận thông báo realtime
const notificationSocket = io('http://localhost:3003')

// Lưu trạng thái thông báo chưa đọc cho từng bệnh nhân
let unreadPatientMessages = {}

// Lắng nghe sự kiện thông báo mới
notificationSocket.on('new_notification', (notification) => {
  // notification: { message, userId, timestamp }
  // message: { roomId, roomName, sender, text }
  // userId: người nhận (bác sĩ)
  if (!notification || !notification.message || !notification.userId) return

  // Kiểm tra nếu user hiện tại là người nhận
  if (!currentUser || notification.userId !== currentUser.username) return

  // Nếu đang không ở phòng chat với bệnh nhân gửi tin nhắn
  const roomId = notification.message.roomId
  if (!currentRoom || currentRoom._id !== roomId) {
    // Hiện popup
    showNotificationPopup(notification.message)
    // Đánh dấu badge cho bệnh nhân
    const sender = notification.message.sender
    unreadPatientMessages[sender] = true
    updatePatientListBadge()
  }
})

// Hàm hiện popup thông báo
function showNotificationPopup(message) {
  // Có thể tái sử dụng notificationEl hoặc tạo toast riêng
  notificationEl.textContent = `Tin nhắn mới từ ${message.sender}: ${message.text}`
  notificationEl.className = 'notification info show'
  setTimeout(() => {
    notificationEl.classList.remove('show')
  }, 4000)
}

// Cập nhật badge trên avatar bệnh nhân
function updatePatientListBadge() {
  const patientItems = patientListEl.querySelectorAll('.patient-item')
  patientItems.forEach((item) => {
    const patientId = item.dataset.patientId
    const patient = patientList.find((p) => p._id === patientId)
    if (patient && unreadPatientMessages[patient.username]) {
      // Thêm badge
      let badge = item.querySelector('.unread-badge')
      if (!badge) {
        badge = document.createElement('span')
        badge.className = 'unread-badge'
        badge.textContent = '•'
        badge.style.color = 'red'
        badge.style.fontSize = '1.5rem'
        badge.style.marginLeft = '8px'
        item.querySelector('.patient-avatar').appendChild(badge)
      }
    } else {
      // Xóa badge nếu có
      const badge = item.querySelector('.unread-badge')
      if (badge) badge.remove()
    }
  })
}
