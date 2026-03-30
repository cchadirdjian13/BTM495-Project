import { useState, useEffect, useCallback } from 'react'
import { appointmentsAPI, availabilityAPI, barbersAPI } from '../api/api'
import { useAuth } from '../context/AuthContext'
import AppointmentCard from '../components/AppointmentCard'
import RatingStars from '../components/RatingStars'
import BarberAnalytics from '../components/BarberAnalytics'

export default function BarberDashboard() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading]           = useState(true)
  const [reviews, setReviews]           = useState([])
  const [tab, setTab]                   = useState('schedule')
  
  // Set availability modal state
  const [addingSlot, setAddingSlot]     = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    appointmentsAPI.list()
      .then(setAppointments)
      .finally(() => setLoading(false))

    if (user && user.user_id) {
      barbersAPI.reviews(user.user_id).then(r => setReviews(r || []))
    }
  }, [user])

  useEffect(() => { load() }, [load])

  const future = appointments.filter(a => ['Scheduled', 'Confirmed'].includes(a.status))
  const past   = appointments.filter(a => ['Completed', 'Cancelled'].includes(a.status))

  return (
    <div className="main-content">
      <div className="page-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          {user && user.user_id <= 3 ? (
            <img src={`/images/avatar_${user.user_id}.png`} alt={user.name} style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--gold)', boxShadow: 'var(--glow)' }} />
          ) : (
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold', color: 'var(--gold)', border: '2px solid var(--border)' }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 style={{ marginBottom: '0.2rem' }}>Welcome, {user?.name.split(' ')[0]}</h1>
            <p className="muted" style={{ margin: 0 }}>Manage your schedule, confirm appointments, and track earnings.</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setAddingSlot(true)} style={{ alignSelf: 'center' }}>
          + Set Availability
        </button>
      </div>

      <div className="tabs">
        <button className={tab === 'schedule' ? 'tab-btn active' : 'tab-btn'} onClick={() => setTab('schedule')}>Schedule & Reviews</button>
        <button className={tab === 'performance' ? 'tab-btn active' : 'tab-btn'} onClick={() => setTab('performance')}>Performance Analytics</button>
      </div>

      {tab === 'schedule' ? (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-label">Upcoming</div>
              <div className="stat-value gold-text">{future.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Clients Served</div>
              <div className="stat-value">{past.filter(a => a.status === 'Completed').length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Avg Rating</div>
              <div className="stat-value" style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}>
                {user?.rating ? user.rating.toFixed(1) : '---'}
                <RatingStars value={Math.round(user?.rating || 0)} readOnly size="1rem" />
              </div>
            </div>
          </div>

          <h2 style={{ fontSize:'1.2rem', marginBottom:'1.2rem' }}>Action Required ({future.length})</h2>
          {loading ? <p className="muted">Loading...</p> : future.length === 0 ? (
            <div className="card" style={{ padding:'3rem', textAlign:'center', marginBottom:'3rem' }}>
              <p className="muted">Your schedule is clear right now.</p>
            </div>
          ) : (
            <div className="grid-2" style={{ marginBottom:'3rem' }}>
              {future.map(a => (
                <AppointmentCard 
                  key={a.appointment_id} 
                  appt={a} 
                  isBarber
                  onRefresh={load} 
                />
              ))}
            </div>
          )}

          <h2 style={{ fontSize:'1.2rem', marginBottom:'1.2rem' }}>Recent History ({past.length})</h2>
          {past.length === 0 ? (
            <p className="muted">No past history.</p>
          ) : (
            <div className="grid-2" style={{ marginBottom:'3rem' }}>
              {past.map(a => (
                <AppointmentCard 
                  key={a.appointment_id} 
                  appt={a} 
                  isBarber
                  onRefresh={load} 
                />
              ))}
            </div>
          )}

          {/* Reviews section */}
          <h2 style={{ fontSize:'1.2rem', marginBottom:'1.2rem' }}>Recent Client Reviews ({reviews.length})</h2>
          {reviews.length === 0 ? (
            <p className="muted">No reviews yet.</p>
          ) : (
            <div className="grid-2">
              {reviews.slice(0, 10).map(r => (
                <div key={r.review_id} className="card">
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.5rem' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.2rem' }}>{r.client_name || 'Client'}</div>
                      <RatingStars value={r.rating} readOnly size="1rem" />
                    </div>
                    <span className="muted" style={{ fontSize:'0.75rem' }}>{new Date(r.timestamp).toLocaleDateString()}</span>
                  </div>
                  <p style={{ fontSize:'0.88rem', fontStyle: 'italic', color:'var(--text)', margin:'0.5rem 0' }}>
                    &quot;{r.comment}&quot;
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <BarberAnalytics appointments={appointments} />
      )}

      {addingSlot && <AvailabilityModal onClose={() => setAddingSlot(false)} onSuccess={() => { setAddingSlot(false); load() }} />}
    </div>
  )
}

function AvailabilityModal({ onClose, onSuccess }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [start, setStart] = useState('09:00')
  const [end, setEnd]     = useState('09:30')
  const [busy, setBusy]   = useState(false)

  const submit = async () => {
    setBusy(true)
    try {
      await availabilityAPI.add({ date, start_time: start, end_time: end })
      onSuccess()
    } catch(e) {
      alert(e.message)
      setBusy(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 420 }}>
        <h2>Add Availability Block</h2>
        <p className="muted" style={{ marginBottom:'2rem' }}>Set a window when clients can book you.</p>

        <div className="grid-2">
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
          </div>
          
          <div className="form-group">
            <label>Start Time</label>
            <select value={start} onChange={e => setStart(e.target.value)}>
              {[...Array(24)].map((_, i) => {
                const hour = i.toString().padStart(2, '0')
                return [
                  <option key={`${hour}:00`} value={`${hour}:00`}>{`${hour}:00`}</option>,
                  <option key={`${hour}:30`} value={`${hour}:30`}>{`${hour}:30`}</option>
                ]
              })}
            </select>
          </div>

          <div className="form-group">
            <label>End Time</label>
            <select value={end} onChange={e => setEnd(e.target.value)}>
              {[...Array(24)].map((_, i) => {
                const hour = i.toString().padStart(2, '0')
                return [
                  <option key={`${hour}:00`} value={`${hour}:00`}>{`${hour}:00`}</option>,
                  <option key={`${hour}:30`} value={`${hour}:30`}>{`${hour}:30`}</option>
                ]
              })}
            </select>
          </div>
        </div>

        <div style={{ display:'flex', gap:'1rem', marginTop:'2rem' }}>
          <button className="btn btn-ghost" style={{ flex:1 }} onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn btn-primary" style={{ flex:1 }} onClick={submit} disabled={busy}>
            {busy ? 'Saving...' : 'Add Slot'}
          </button>
        </div>
      </div>
    </div>
  )
}
