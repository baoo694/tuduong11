// Script tạo tài khoản admin, doctor, patient qua API Gateway
const fetch = require('node-fetch')

const API_BASE = 'http://localhost:3000/api/users'

async function createAdmin() {
  const res = await fetch(`${API_BASE}/create-initial-admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'admin1',
      email: 'admin1@example.com',
      password: 'admin123',
    }),
  })
  const data = await res.json()
  if (res.ok) {
    console.log('Admin created:', data.user)
    return data.token
  } else {
    console.error('Admin error:', data)
    return null
  }
}

async function createDoctor(token) {
  const res = await fetch(`${API_BASE}/create-doctor`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      username: 'doctor1',
      email: 'doctor1@example.com',
      password: 'doctor123',
      specialization: 'Cardiology',
      licenseNumber: 'DOC12345',
      department: 'Heart',
      phoneNumber: '0123456789',
    }),
  })
  const data = await res.json()
  if (res.ok) {
    console.log('Doctor created:', data.user)
  } else {
    console.error('Doctor error:', data)
  }
}

async function createPatient(token) {
  const res = await fetch(`${API_BASE}/create-patient`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      username: 'patient1',
      email: 'patient1@example.com',
      password: 'patient123',
      dateOfBirth: '1990-01-01',
      phoneNumber: '0987654321',
      address: '123 Main St',
      emergencyContact: '0123456789',
    }),
  })
  const data = await res.json()
  if (res.ok) {
    console.log('Patient created:', data.user)
  } else {
    console.error('Patient error:', data)
  }
}

async function main() {
  const token = await createAdmin()
  if (token) {
    await createDoctor(token)
    await createPatient(token)
  }
}

main()
