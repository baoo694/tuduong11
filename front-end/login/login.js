// API Base URL
const API_BASE = 'http://localhost:3000/api'
const USER_API = `${API_BASE}/users`

// DOM Elements
const loginForm = document.getElementById('loginForm')
const forgotPasswordForm = document.getElementById('forgotPasswordForm')

// Event Listeners
document.addEventListener('DOMContentLoaded', function () {
  // Check if user is already logged in
  const token = localStorage.getItem('token')
  if (token) {
    redirectBasedOnRole()
  }

  // Login form submission
  loginForm.addEventListener('submit', handleLogin)

  // Forgot password form submission
  forgotPasswordForm.addEventListener('submit', handleForgotPassword)
})

// Handle Login
async function handleLogin(event) {
  event.preventDefault()

  const formData = new FormData(event.target)
  const loginData = {
    email: formData.get('email'),
    password: formData.get('password'),
  }

  // Show loading state
  const submitBtn = event.target.querySelector('button[type="submit"]')
  const originalText = submitBtn.innerHTML
  submitBtn.innerHTML =
    '<i class="fas fa-spinner fa-spin"></i> Đang đăng nhập...'
  submitBtn.disabled = true

  try {
    const response = await fetch(`${USER_API}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData),
    })

    const data = await response.json()

    if (response.ok) {
      // Store token
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      showNotification('Đăng nhập thành công!', 'success')

      // Redirect based on role
      setTimeout(() => {
        redirectBasedOnRole()
      }, 1000)
    } else {
      showNotification(data.message || 'Đăng nhập thất bại', 'error')
    }
  } catch (error) {
    console.error('Login error:', error)
    showNotification('Lỗi kết nối. Vui lòng thử lại.', 'error')
  } finally {
    // Reset button state
    submitBtn.innerHTML = originalText
    submitBtn.disabled = false
  }
}

// Handle Forgot Password
async function handleForgotPassword(event) {
  event.preventDefault()

  const formData = new FormData(event.target)
  const email = formData.get('email')

  // Show loading state
  const submitBtn = event.target.querySelector('button[type="submit"]')
  const originalText = submitBtn.innerHTML
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang gửi...'
  submitBtn.disabled = true

  try {
    const response = await fetch(`${USER_API}/forgotPassword`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    })

    const data = await response.json()

    if (response.ok) {
      showNotification(
        'Email khôi phục mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư.',
        'success'
      )
      showLogin() // Switch back to login form
    } else {
      showNotification(data.message || 'Lỗi khi gửi email khôi phục', 'error')
    }
  } catch (error) {
    console.error('Forgot password error:', error)
    showNotification('Lỗi kết nối. Vui lòng thử lại.', 'error')
  } finally {
    // Reset button state
    submitBtn.innerHTML = originalText
    submitBtn.disabled = false
  }
}

// Redirect based on user role
function redirectBasedOnRole() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  switch (user.role) {
    case 'admin':
      window.location.href = '../admin/admin-dashboard.html'
      break
    case 'doctor':
      window.location.href = '../chat/chat-dashboard.html'
      break
    case 'patient':
      window.location.href = '../patient/patient-dashboard.html'
      break
    default:
      // If no role or invalid role, redirect to login
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = 'login.html'
  }
}

// Show forgot password form
function showForgotPassword() {
  document.getElementById('loginForm').style.display = 'none'
  document.getElementById('forgotPasswordForm').style.display = 'block'
}

// Show login form
function showLogin() {
  document.getElementById('forgotPasswordForm').style.display = 'none'
  document.getElementById('loginForm').style.display = 'block'
}

// Toggle password visibility
function togglePassword(inputId) {
  const input = document.getElementById(inputId)
  const toggleBtn = input.parentElement.querySelector('.toggle-password i')

  if (input.type === 'password') {
    input.type = 'text'
    toggleBtn.className = 'fas fa-eye-slash'
  } else {
    input.type = 'password'
    toggleBtn.className = 'fas fa-eye'
  }
}

// Show notification
function showNotification(message, type = 'info') {
  const notification = document.getElementById('notification')
  notification.textContent = message
  notification.className = `notification ${type} show`

  setTimeout(() => {
    notification.classList.remove('show')
  }, 4000)
}

// Utility function to validate email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Utility function to validate password strength
function validatePassword(password) {
  const minLength = 6
  if (password.length < minLength) {
    return `Mật khẩu phải có ít nhất ${minLength} ký tự`
  }
  return null
}

// Add input validation
document.addEventListener('DOMContentLoaded', function () {
  // Email validation
  const emailInputs = document.querySelectorAll('input[type="email"]')
  emailInputs.forEach((input) => {
    input.addEventListener('blur', function () {
      if (this.value && !isValidEmail(this.value)) {
        this.style.borderColor = '#e53e3e'
        showFieldError(this, 'Email không hợp lệ')
      } else {
        this.style.borderColor = '#e2e8f0'
        clearFieldError(this)
      }
    })
  })

  // Password validation
  const passwordInputs = document.querySelectorAll('input[type="password"]')
  passwordInputs.forEach((input) => {
    input.addEventListener('blur', function () {
      if (this.value) {
        const error = validatePassword(this.value)
        if (error) {
          this.style.borderColor = '#e53e3e'
          showFieldError(this, error)
        } else {
          this.style.borderColor = '#e2e8f0'
          clearFieldError(this)
        }
      }
    })
  })
})

// Show field-specific error
function showFieldError(input, message) {
  clearFieldError(input)

  const errorDiv = document.createElement('div')
  errorDiv.className = 'field-error'
  errorDiv.textContent = message
  errorDiv.style.color = '#e53e3e'
  errorDiv.style.fontSize = '0.8rem'
  errorDiv.style.marginTop = '0.25rem'

  input.parentElement.appendChild(errorDiv)
}

// Clear field-specific error
function clearFieldError(input) {
  const existingError = input.parentElement.querySelector('.field-error')
  if (existingError) {
    existingError.remove()
  }
}

// Add keyboard shortcuts
document.addEventListener('keydown', function (event) {
  // Ctrl/Cmd + Enter to submit forms
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    const activeForm = document.querySelector(
      'form:not([style*="display: none"])'
    )
    if (activeForm) {
      activeForm.dispatchEvent(new Event('submit'))
    }
  }

  // Escape to go back to login form
  if (event.key === 'Escape') {
    const forgotForm = document.getElementById('forgotPasswordForm')
    if (forgotForm.style.display !== 'none') {
      showLogin()
    }
  }
})

// Add form auto-save (for better UX)
let formData = {}

function saveFormData(formId) {
  const form = document.getElementById(formId)
  const inputs = form.querySelectorAll('input')

  inputs.forEach((input) => {
    if (input.value) {
      formData[`${formId}_${input.name}`] = input.value
    }
  })

  localStorage.setItem('formData', JSON.stringify(formData))
}

function loadFormData(formId) {
  const savedData = localStorage.getItem('formData')
  if (savedData) {
    formData = JSON.parse(savedData)

    const form = document.getElementById(formId)
    const inputs = form.querySelectorAll('input')

    inputs.forEach((input) => {
      const key = `${formId}_${input.name}`
      if (formData[key]) {
        input.value = formData[key]
      }
    })
  }
}

// Auto-save form data on input change
document.addEventListener('DOMContentLoaded', function () {
  const forms = document.querySelectorAll('form')
  forms.forEach((form) => {
    const inputs = form.querySelectorAll('input')
    inputs.forEach((input) => {
      input.addEventListener('input', function () {
        saveFormData(form.id)
      })
    })

    // Load saved data when form is shown
    if (form.id === 'loginForm') {
      loadFormData('loginForm')
    }
  })
})

// Clear saved form data on successful login
function clearSavedFormData() {
  localStorage.removeItem('formData')
  formData = {}
}
