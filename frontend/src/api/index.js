import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('ctms_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

api.interceptors.response.use(
  r => r,
  err => {
    const isLoginEndpoint = err.config?.url === '/auth/login'
    // Only redirect on 401 for protected routes
    // Skip for /auth/login — a 401 there just means wrong password, not expired session
    if (err.response?.status === 401 && !isLoginEndpoint) {
      localStorage.removeItem('ctms_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const authAPI = {
  login: (data)    => api.post('/auth/login', data),
  me:    ()        => api.get('/auth/me'),
}

export const studiesAPI = {
  getAll:       (params) => api.get('/studies', { params }),
  getAllNoPag:   ()       => api.get('/studies/all'),
  getById:      (id)     => api.get(`/studies/${id}`),
  create:       (data)   => api.post('/studies', data),
  update:       (id, d)  => api.put(`/studies/${id}`, d),
  delete:       (id)     => api.delete(`/studies/${id}`),
}

export const subjectsAPI = {
  getAll:  (params) => api.get('/subjects', { params }),
  getById: (id)     => api.get(`/subjects/${id}`),
  create:  (data)   => api.post('/subjects', data),
  update:  (id, d)  => api.put(`/subjects/${id}`, d),
  delete:  (id)     => api.delete(`/subjects/${id}`),
}

export const sitesAPI = {
  getAll:     (params) => api.get('/sites', { params }),
  getAllNoPag: ()       => api.get('/sites/all'),
  getById:    (id)     => api.get(`/sites/${id}`),
  create:     (data)   => api.post('/sites', data),
  update:     (id, d)  => api.put(`/sites/${id}`, d),
  delete:     (id)     => api.delete(`/sites/${id}`),
}

export const patientsAPI = {
  getAll:  (params) => api.get('/patients', { params }),
  getStats:()       => api.get('/patients/stats'),
  getById: (id)     => api.get(`/patients/${id}`),
  create:  (data)   => api.post('/patients', data),
  update:  (id, d)  => api.put(`/patients/${id}`, d),
  delete:  (id)     => api.delete(`/patients/${id}`),
}

export const reportsAPI = {
  getSummary: (params) => api.get('/reports/summary', { params }),
}

export default api

export const appointmentsAPI = {
  getAll:   (params) => api.get('/appointments', { params }),
  getToday: ()       => api.get('/appointments/today'),
  getStats: ()       => api.get('/appointments/stats'),
  getById:  (id)     => api.get(`/appointments/${id}`),
  create:   (data)   => api.post('/appointments', data),
  update:   (id, d)  => api.put(`/appointments/${id}`, d),
  delete:   (id)     => api.delete(`/appointments/${id}`),
}

export const usersAPI = {
  getAll:          ()       => api.get('/auth/users'),
  getDoctors:      ()       => api.get('/auth/doctors'),
  create:          (data)   => api.post('/auth/users', data),
  update:          (id, d)  => api.put(`/auth/users/${id}`, d),
  delete:          (id)     => api.delete(`/auth/users/${id}`),
  updateProfile:   (data)   => api.put('/auth/profile', data),
  changePassword:  (data)   => api.put('/auth/change-password', data),
}
