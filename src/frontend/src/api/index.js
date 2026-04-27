import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
})

// Request interceptor: attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor: handle errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error.response?.data || error)
  }
)

export default api

// Auth
export const authApi = {
  sendSms: (phone, scene = 'login') =>
    api.post('/auth/sms/send', { phone, scene }),
  smsLogin: (phone, code) =>
    api.post('/auth/sms/login', { phone, code }),
  register: (data) =>
    api.post('/auth/register', data),
}

// User
export const userApi = {
  getMe: () => api.get('/users/me'),
  updateMe: (data) => api.put('/users/me', data),
  updateSkills: (skills) => api.put('/users/me/skills', { skills }),
  getById: (id) => api.get(`/users/${id}`),
  search: (keyword, page = 1, size = 20) =>
    api.get('/users/search', { params: { keyword, page, size } }),
}

// Cycle
export const cycleApi = {
  getDiagnosisQuestions: () => api.get('/cycle/diagnosis'),
  submitDiagnosis: (answers) => api.post('/cycle/diagnosis', { answers }),
  getDashboard: () => api.get('/cycle/dashboard'),
  getStatus: () => api.get('/cycle/status'),
  completeTask: (taskId) => api.post(`/cycle/tasks/${taskId}/complete`),
}