// Global variables
let socket
let currentUser = null
let currentRoom = null
let assignedDoctor = null

// DOM elements
const patientNameEl = document.getElementById('patientName')
const assignedDoctorEl = document.getElementById('assignedDoctor')
const patientInfoEl = document.getElementById('patientInfo')
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
    console.log('Token from localStorage:', token ? 'exists' : 'missing')

    if (!token) {
      console.log('No token found, redirecting to login')
      window.location.href = '../login/login.html'
      return
    }

    const response = await fetch(`${USER_API}/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    console.log('Profile response status:', response.status)

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        console.log('Token invalid, redirecting to login')
        localStorage.removeItem('token')
        window.location.href = '../login/login.html'
        return
      }
      throw new Error('Failed to load user data')
    }

    const data = await response.json()
    currentUser = data.user

    // Update UI
    patientNameEl.textContent = currentUser.username

    // Load assigned doctor
    await loadAssignedDoctor()

    // Load patient info
    loadPatientInfo()

    // Load chat room
    await loadChatRoom()
  } catch (error) {
    console.error('Error loading user data:', error)
    showNotification('Lỗi khi tải thông tin người dùng', 'error')
  }
}

async function loadAssignedDoctor() {
  try {
    const token = localStorage.getItem('token')
    const response = await fetch(`${USER_API}/patient/doctor`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (response.ok) {
      const data = await response.json()
      assignedDoctor = data.doctor
      displayAssignedDoctor(assignedDoctor)
    } else if (response.status === 404) {
      displayNoDoctorAssigned()
    } else {
      throw new Error('Failed to load assigned doctor')
    }
  } catch (error) {
    console.error('Error loading assigned doctor:', error)
    displayNoDoctorAssigned()
  }
}

function displayAssignedDoctor(doctor) {
  assignedDoctorEl.innerHTML = `
        <div class="doctor-card">
            <div class="doctor-avatar">
                ${doctor.username.charAt(0).toUpperCase()}
            </div>
            <div class="doctor-name">${doctor.username}</div>
            <div class="doctor-specialization">${
              doctor.doctorInfo?.specialization || 'Chưa cập nhật'
            }</div>
            <div class="doctor-department">${
              doctor.doctorInfo?.department || 'Chưa cập nhật'
            }</div>
        </div>
    `
}

function displayNoDoctorAssigned() {
  assignedDoctorEl.innerHTML = `
        <div class="no-doctor">
            <i class="fas fa-user-md" style="font-size: 2rem; color: #cbd5e0; margin-bottom: 1rem;"></i>
            <p style="color: #718096; text-align: center;">Chưa có bác sĩ được gán</p>
        </div>
    `
}

function loadPatientInfo() {
  if (!currentUser) return

  const patientInfo = currentUser.patientInfo || {}
  patientInfoEl.innerHTML = `
        <div class="info-item">
            <span class="info-label">Tên đăng nhập:</span>
            <span class="info-value">${currentUser.username}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Email:</span>
            <span class="info-value">${currentUser.email}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Số điện thoại:</span>
            <span class="info-value">${
              patientInfo.phoneNumber || 'Chưa cập nhật'
            }</span>
        </div>
        <div class="info-item">
            <span class="info-label">Địa chỉ:</span>
            <span class="info-value">${
              patientInfo.address || 'Chưa cập nhật'
            }</span>
        </div>
        <div class="info-item">
            <span class="info-label">Liên hệ khẩn cấp:</span>
            <span class="info-value">${
              patientInfo.emergencyContact || 'Chưa cập nhật'
            }</span>
        </div>
    `
}

async function loadChatRoom() {
  if (!currentUser || !assignedDoctor) {
    showWelcomeMessage()
    return
  }

  try {
    const response = await fetch(
      `${CHAT_API}/patient/room?patientId=${currentUser._id}&patientUsername=${currentUser.username}`
    )

    if (response.ok) {
      const data = await response.json()
      currentRoom = data.room
      joinChatRoom()
      loadChatMessages()
    } else if (response.status === 404) {
      // Create new chat room
      await createChatRoom()
    } else {
      throw new Error('Failed to load chat room')
    }
  } catch (error) {
    console.error('Error loading chat room:', error)
    showNotification('Lỗi khi tải phòng chat', 'error')
  }
}

async function createChatRoom() {
  try {
    const response = await fetch(`${CHAT_API}/doctor-patient/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        doctorId: assignedDoctor._id,
        patientId: currentUser._id,
        doctorUsername: assignedDoctor.username,
        patientUsername: currentUser.username,
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
    console.log('Connected to chat server')
    updateConnectionStatus(true)
  })

  socket.on('disconnect', () => {
    console.log('Disconnected from chat server')
    updateConnectionStatus(false)
  })

  socket.on('chatMessage', (data) => {
    console.log('Received chatMessage event:', data)
    console.log('Current room ID:', currentRoom?._id)
    if (data.roomId === currentRoom?._id) {
      console.log('Adding message to chat')
      addMessageToChat(data)
    } else {
      console.log('Room ID mismatch, not adding message')
    }
  })

  socket.on('newDoctorPatientRoom', (room) => {
    if (room.doctorPatientInfo.patientId === currentUser._id) {
      currentRoom = room
      joinChatRoom()
      loadChatMessages()
    }
  })

  socket.on('consultationCompleted', (data) => {
    if (data.roomId === currentRoom?._id) {
      showNotification('Phiên tư vấn đã hoàn thành', 'info')
      disableChat()
    }
  })
}

function joinChatRoom() {
  if (!socket || !currentRoom) return

  console.log('Patient joining room:', currentRoom._id)
  socket.emit('joinRoom', currentRoom._id) // Chỉ gửi roomId giống như doctor

  updateChatTitle()
  enableChat()
}

function updateChatTitle() {
  if (currentRoom && assignedDoctor) {
    chatTitleTextEl.textContent = `Tư vấn với ${assignedDoctor.username}`
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
      `${CHAT_API}/room/${currentRoom._id}?username=${currentUser.username}`
    )

    if (response.ok) {
      const data = await response.json()
      displayMessages(data.messages)
    } else {
      throw new Error('Failed to load messages')
    }
  } catch (error) {
    console.error('Error loading messages:', error)
    showNotification('Lỗi khi tải tin nhắn', 'error')
  }
}

function displayMessages(messages) {
  chatMessagesEl.innerHTML = ''

  if (messages.length === 0) {
    showWelcomeMessage()
    return
  }

  messages.forEach((message) => {
    addMessageToChat(message)
  })

  scrollToBottom()
}

function addMessageToChat(message) {
  const isOwnMessage = message.username === currentUser.username
  const messageEl = document.createElement('div')
  messageEl.className = `message ${isOwnMessage ? 'sent' : 'received'}`

  const time = new Date(message.createdAt).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  })

  messageEl.innerHTML = `
        <div class="message-avatar">
            ${message.username.charAt(0).toUpperCase()}
        </div>
        <div class="message-content">
            <div class="message-bubble">${message.text}</div>
            <div class="message-info">
                <span class="message-sender">${message.username}</span>
                <span class="message-time">${time}</span>
            </div>
        </div>
    `

  chatMessagesEl.appendChild(messageEl)
  scrollToBottom()
}

function showWelcomeMessage() {
  chatMessagesEl.innerHTML = `
        <div class="welcome-message">
            <i class="fas fa-heartbeat"></i>
            <h3>Chào mừng đến với hệ thống tư vấn y tế</h3>
            <p>Bạn có thể chat với bác sĩ được gán để được tư vấn và hỗ trợ y tế.</p>
        </div>
    `
}

function enableChat() {
  messageInputEl.disabled = false
  sendBtnEl.disabled = false
  messageInputEl.placeholder = 'Nhập tin nhắn...'
}

function disableChat() {
  messageInputEl.disabled = true
  sendBtnEl.disabled = true
  messageInputEl.placeholder = 'Phiên tư vấn đã kết thúc'
}

function sendMessage() {
  console.log('Patient sendMessage called')
  const text = messageInputEl.value.trim()
  console.log('Message text:', text)
  console.log('Current room:', currentRoom)
  console.log('Socket connected:', socket?.connected)

  if (!text || !currentRoom || !socket) {
    console.log('Cannot send message: missing text, room, or socket')
    return
  }

  const messageData = {
    roomId: currentRoom._id,
    sender: currentUser._id,
    username: currentUser.username,
    text: text,
  }

  console.log('Sending message data:', messageData)

  // Send via API
  fetch(`${CHAT_API}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messageData),
  })
    .then((response) => {
      console.log('Message sent successfully, response:', response.status)
      if (!response.ok) {
        throw new Error('Failed to send message')
      }
    })
    .catch((error) => {
      console.error('Error sending message:', error)
      showNotification('Lỗi khi gửi tin nhắn', 'error')
    })

  // Clear input
  messageInputEl.value = ''
}

function scrollToBottom() {
  chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight
}

function showUpdateProfileModal() {
  if (!currentUser) return

  // Populate form
  document.getElementById('updateUsername').value = currentUser.username
  document.getElementById('updatePhoneNumber').value =
    currentUser.patientInfo?.phoneNumber || ''
  document.getElementById('updateAddress').value =
    currentUser.patientInfo?.address || ''
  document.getElementById('updateEmergencyContact').value =
    currentUser.patientInfo?.emergencyContact || ''

  updateProfileModalEl.style.display = 'block'
}

function hideUpdateProfileModal() {
  updateProfileModalEl.style.display = 'none'
}

async function updateProfile(e) {
  e.preventDefault()

  const formData = new FormData(updateProfileFormEl)
  const updateData = {
    username: formData.get('username'),
    patientInfo: {
      phoneNumber: formData.get('patientInfo.phoneNumber'),
      address: formData.get('patientInfo.address'),
      emergencyContact: formData.get('patientInfo.emergencyContact'),
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
      const data = await response.json()
      currentUser = data.user
      loadPatientInfo()
      hideUpdateProfileModal()
      showNotification('Cập nhật thông tin thành công', 'success')
    } else {
      throw new Error('Failed to update profile')
    }
  } catch (error) {
    console.error('Error updating profile:', error)
    showNotification('Lỗi khi cập nhật thông tin', 'error')
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
  }, 3000)
}
