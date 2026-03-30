import { useState, useEffect, useCallback } from 'react'
import { appointmentsAPI, paymentsAPI, reviewsAPI } from '../api/api'
import AppointmentCard from '../components/AppointmentCard'
import BookingModal from '../components/BookingModal'
import RatingStars from '../components/RatingStars'

export default function ClientDashboard() {
  const [appointments, setAppointments] = useState([])
  const [booking, setBooking]           = useState(false)
  const [loading, setLoading]           = useState(true)

  // Payment modal state
  const [payingFor, setPayingFor] = useState(null)
  
  // Review modal state
  const [reviewingFor, setReviewingFor] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    appointmentsAPI.list()
      .then(setAppointments)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const future = appointments.filter(a => ['Scheduled', 'Confirmed'].includes(a.status))
  const past   = appointments.filter(a => ['Completed', 'Cancelled'].includes(a.status))

  return (
    <div className="main-content">
      <div className="page-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <h1>My Appointments</h1>
          <p>Track and manage your upcoming barber shop visits.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setBooking(true)}>
          + Book New Cut
        </button>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Upcoming</div>
          <div className="stat-value gold">{future.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Visits</div>
          <div className="stat-value">{past.filter(a => a.status === 'Completed').length}</div>
        </div>
      </div>

      <h2 style={{ fontSize:'1.2rem', marginBottom:'1.2rem' }}>Upcoming ({future.length})</h2>
      {loading ? <p className="muted">Loading...</p> : future.length === 0 ? (
        <div className="card" style={{ padding:'3rem', textAlign:'center', marginBottom:'3rem' }}>
          <p className="muted">You have no upcoming appointments.</p>
        </div>
      ) : (
        <div className="grid-2" style={{ marginBottom:'3rem' }}>
          {future.map(a => (
            <AppointmentCard 
              key={a.appointment_id} 
              appt={a} 
              onRefresh={load}
              onPay={setPayingFor}
              onReview={setReviewingFor}
            />
          ))}
        </div>
      )}

      <h2 style={{ fontSize:'1.2rem', marginBottom:'1.2rem' }}>Past ({past.length})</h2>
      {past.length === 0 ? (
        <p className="muted">No past history.</p>
      ) : (
        <div className="grid-2">
          {past.map(a => (
            <AppointmentCard 
              key={a.appointment_id} 
              appt={a} 
              onRefresh={load} 
              onPay={setPayingFor}
              onReview={setReviewingFor}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {booking && (
        <BookingModal 
          onClose={() => setBooking(false)} 
          onBooked={() => { setBooking(false); load() }} 
        />
      )}

      {payingFor && (
        <PaymentModal appt={payingFor} onClose={() => setPayingFor(null)} onSuccess={() => { setPayingFor(null); load() }} />
      )}

      {reviewingFor && (
        <ReviewModal appt={reviewingFor} onClose={() => setReviewingFor(null)} onSuccess={() => { setReviewingFor(null); load() }} />
      )}
    </div>
  )
}

function PaymentModal({ appt, onClose, onSuccess }) {
  const [method, setMethod] = useState('Credit Card')
  const [busy, setBusy]     = useState(false)

  const pay = async () => {
    setBusy(true)
    try {
      await paymentsAPI.pay({ appointment_id: appt.appointment_id, amount: appt.service.price, method })
      onSuccess()
    } catch(e) {
      alert(e.message)
      setBusy(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 400 }}>
        <h2>Complete Payment</h2>
        <div style={{ margin:'1.5rem 0', background:'var(--surface2)', padding:'1rem', borderRadius:'var(--radius-sm)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.5rem' }}>
            <span className="muted">{appt.service.name}</span>
            <span>${appt.service.price.toFixed(2)}</span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', fontWeight:600, borderTop:'1px solid var(--border)', paddingTop:'0.5rem' }}>
            <span>Total</span>
            <span className="gold-text">${appt.service.price.toFixed(2)}</span>
          </div>
        </div>

        <div className="form-group">
          <label>Payment Method</label>
          <select value={method} onChange={e => setMethod(e.target.value)}>
            <option>Credit Card</option>
            <option>Debit Card</option>
            <option>Cash (In-person)</option>
          </select>
        </div>

        <div style={{ display:'flex', gap:'1rem', marginTop:'2rem' }}>
          <button className="btn btn-ghost" style={{ flex:1 }} onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn btn-primary" style={{ flex:1 }} onClick={pay} disabled={busy}>
            {busy ? 'Processing...' : `Pay $${appt.service.price.toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  )
}

function ReviewModal({ appt, onClose, onSuccess }) {
  const [rating, setRating]   = useState(5)
  const [comment, setComment] = useState('')
  const [busy, setBusy]       = useState(false)

  const submit = async () => {
    setBusy(true)
    try {
      await reviewsAPI.leave({ barber_id: appt.barber.user_id, rating, comment })
      onSuccess()
    } catch(e) {
      alert(e.message)
      setBusy(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 460 }}>
        <h2 style={{ marginBottom:'0.5rem' }}>Rate Your Experience</h2>
        <p className="muted" style={{ marginBottom:'1.5rem' }}>
          How was your {appt.service.name} with {appt.barber.name}?
        </p>

        <div style={{ display:'flex', justifyContent:'center', margin:'2rem 0' }}>
          <RatingStars value={rating} onChange={setRating} size="2.5rem" />
        </div>

        <div className="form-group">
          <label>Feedback (Optional)</label>
          <textarea
            rows={4}
            placeholder="Tell us what you loved..."
            value={comment}
            onChange={e => setComment(e.target.value)}
          />
        </div>

        <div style={{ display:'flex', gap:'1rem', marginTop:'2rem' }}>
          <button className="btn btn-ghost" style={{ flex:1 }} onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn btn-primary" style={{ flex:1 }} onClick={submit} disabled={busy}>
            {busy ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  )
}
