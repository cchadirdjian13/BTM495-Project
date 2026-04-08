// src/api/api.js — Typed fetch wrapper for the Flask backend

const BASE = '/api'

async function request(method, path, body) {
  const opts = {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  }
  if (body !== undefined) opts.body = JSON.stringify(body)

  const res = await fetch(BASE + path, opts)
  const json = await res.json()

  if (!json.ok) throw new Error(json.error || 'Unknown error')
  return json.data
}

const get  = (path)        => request('GET',   path)
const post = (path, body)  => request('POST',  path, body)
const patch= (path, body)  => request('PATCH', path, body)

// ── Auth ───────────────────────────────────────────────────────────
export const authAPI = {
  register: (data)  => post('/auth/register', data),
  login:    (data)  => post('/auth/login', data),
  logout:   ()      => post('/auth/logout'),
  me:       ()      => get('/auth/me'),
  updateLanguage: (lang) => patch('/auth/language', { language: lang }),
}

// ── Services ───────────────────────────────────────────────────────
export const servicesAPI = {
  list: () => get('/services'),
}

// ── Barbers ────────────────────────────────────────────────────────
export const barbersAPI = {
  list:         ()          => get('/barbers'),
  get:          (id)        => get(`/barbers/${id}`),
  availability: (id, date)  => get(`/barbers/${id}/availability${date ? `?date=${date}` : ''}`),
  reviews:      (id)        => get(`/barbers/${id}/reviews`),
}

// ── Availability ───────────────────────────────────────────────────
export const availabilityAPI = {
  add: (data) => post('/availability', data),
}

// ── Appointments ───────────────────────────────────────────────────
export const appointmentsAPI = {
  list:     ()    => get('/appointments'),
  book:     (data)=> post('/appointments', data),
  confirm:  (id)  => patch(`/appointments/${id}/confirm`),
  complete: (id)  => patch(`/appointments/${id}/complete`),
  cancel:   (id)  => patch(`/appointments/${id}/cancel`),
}

// ── Payments ───────────────────────────────────────────────────────
export const paymentsAPI = {
  pay:    (data) => post('/payments', data),
  refund: (id)   => patch(`/payments/${id}/refund`),
}

// ── Reviews ────────────────────────────────────────────────────────
export const reviewsAPI = {
  leave: (data) => post('/reviews', data),
}

// ── Notifications ──────────────────────────────────────────────────
export const notificationsAPI = {
  list:    ()    => get('/notifications'),
  read:    (id)  => patch(`/notifications/${id}/read`),
  readAll: ()    => patch('/notifications/read-all'),
}
