import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
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
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold', color: 'var(--gold)', border: '2px solid var(--border)' }}>
            {useAuth().user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 style={{ marginBottom: '0.2rem' }}>Hi, {useAuth().user?.name.split(' ')[0]}</h1>
            <p className="muted" style={{ margin: 0 }}>Track and manage your upcoming barber shop visits.</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setBooking(true)} style={{ alignSelf: 'center' }}>
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
  const [step, setStep]     = useState('form') // 'form' | 'processing' | 'success'

  const pay = async () => {
    setStep('processing')
    try {
      // Small artificial delay to show off the cool processing state
      await new Promise(r => setTimeout(r, 1200))
      await paymentsAPI.pay({ appointment_id: appt.appointment_id, amount: appt.service.price, method })
      setStep('success')
    } catch(e) {
      alert(e.message)
      setStep('form')
    }
  }

  return (
    <div className="modal-overlay" onClick={e => step !== 'processing' && e.target===e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 400, textAlign: step === 'form' ? 'left' : 'center' }}>
        
        {step === 'form' && (
          <>
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
              <button className="btn btn-ghost" style={{ flex:1 }} onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" style={{ flex:1 }} onClick={pay}>
                Pay ${appt.service.price.toFixed(2)}
              </button>
            </div>
          </>
        )}

        {step === 'processing' && (
          <div style={{ padding: '3rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: 50, height: 50, border: '4px solid var(--surface2)',
              borderTopColor: 'var(--gold)', borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            <h3 style={{ marginTop: '1rem' }}>Processing Payment...</h3>
            <p className="muted">Securely contacting {method.toLowerCase()} provider</p>
          </div>
        )}

        {step === 'success' && (
          <div style={{ padding: '2rem 0', animation: 'fadeIn 0.4s ease' }}>
            <div style={{ fontSize: '4rem', color: 'var(--gold)', marginBottom: '1rem' }}>✓</div>
            <h2 style={{ marginBottom: '0.5rem' }}>Payment Successful!</h2>
            <p className="muted" style={{ marginBottom: '2rem' }}>Thank you. Your receipt has been logged.</p>
            <button className="btn btn-primary btn-block" onClick={onSuccess}>Done</button>
          </div>
        )}

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
