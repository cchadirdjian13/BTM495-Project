import { useState, useEffect } from 'react'
import { barbersAPI, servicesAPI, appointmentsAPI } from '../api/api'
import ServiceCard, { BarberCard } from './ServiceCard'
import SlotPicker from './SlotPicker'

export default function BookingModal({ onClose, onBooked }) {
  const [step, setStep]     = useState(1)   // 1: barber, 2: service, 3: slot, 4: confirm
  const [barbers, setBarbers] = useState([])
  const [services, setServices] = useState([])
  const [selectedBarber,  setBarber]  = useState(null)
  const [selectedService, setService] = useState(null)
  const [selectedSlot,    setSlot]    = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => {
    barbersAPI.list().then(setBarbers)
    servicesAPI.list().then(setServices)
  }, [])

  const confirm = async () => {
    setLoading(true); setError('')
    try {
      const dt = new Date(`${selectedSlot.date}T${selectedSlot.start_time}`)
      await appointmentsAPI.book({
        barber_id:  selectedBarber.user_id,
        service_id: selectedService.service_id,
        slot_id:    selectedSlot.slot_id,
        datetime:   dt.toISOString(),
      })
      onBooked()
    } catch(e) {
      setError(e.message)
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>Book Appointment</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {/* Step indicator */}
        <StepBar step={step} />

        {error && <div className="alert alert-error" style={{marginTop:'1rem'}}>{error}</div>}

        {/* Step 1: Choose barber */}
        {step === 1 && (
          <div style={{ marginTop:'1.2rem' }}>
            <p className="muted" style={{marginBottom:'1rem'}}>Choose your barber</p>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.7rem' }}>
              {barbers.map(b => (
                <BarberCard
                  key={b.user_id} barber={b}
                  selected={selectedBarber?.user_id === b.user_id}
                  onClick={() => setBarber(b)}
                />
              ))}
            </div>
            <div style={{display:'flex',justifyContent:'flex-end',marginTop:'1.4rem'}}>
              <button className="btn btn-primary" disabled={!selectedBarber} onClick={() => setStep(2)}>
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Choose service */}
        {step === 2 && (
          <div style={{ marginTop:'1.2rem' }}>
            <p className="muted" style={{marginBottom:'1rem'}}>Choose a service</p>
            <div className="grid-2" style={{gap:'0.7rem'}}>
              {services.map(s => (
                <ServiceCard
                  key={s.service_id} service={s}
                  selected={selectedService?.service_id === s.service_id}
                  onClick={() => setService(s)}
                />
              ))}
            </div>
            <div style={{display:'flex',justifyContent:'space-between',marginTop:'1.4rem'}}>
              <button className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
              <button className="btn btn-primary" disabled={!selectedService} onClick={() => setStep(3)}>Next →</button>
            </div>
          </div>
        )}

        {/* Step 3: Choose slot */}
        {step === 3 && (
          <div style={{ marginTop:'1.2rem' }}>
            <p className="muted" style={{marginBottom:'1rem'}}>
              Pick an available time with <strong style={{color:'var(--text)'}}>{selectedBarber.name}</strong>
            </p>
            <SlotPicker barberId={selectedBarber.user_id} onSelect={setSlot} />
            <div style={{display:'flex',justifyContent:'space-between',marginTop:'1.4rem'}}>
              <button className="btn btn-ghost" onClick={() => setStep(2)}>← Back</button>
              <button className="btn btn-primary" disabled={!selectedSlot} onClick={() => setStep(4)}>Review →</button>
            </div>
          </div>
        )}

        {/* Step 4: Confirm */}
        {step === 4 && (
          <div style={{ marginTop:'1.2rem' }}>
            <p className="muted" style={{marginBottom:'1.2rem'}}>Confirm your appointment</p>
            <div className="card" style={{display:'flex',flexDirection:'column',gap:'0.7rem'}}>
              <Row label="Barber"  value={selectedBarber.name} />
              <Row label="Service" value={`${selectedService.name} — $${selectedService.price}`} />
              <Row label="Date"    value={selectedSlot.date} />
              <Row label="Time"    value={`${selectedSlot.start_time} – ${selectedSlot.end_time}`} />
              <Row label="Duration" value={`${selectedService.duration} min`} />
            </div>
            {error && <div className="alert alert-error" style={{marginTop:'0.8rem'}}>{error}</div>}
            <div style={{display:'flex',justifyContent:'space-between',marginTop:'1.4rem'}}>
              <button className="btn btn-ghost" onClick={() => setStep(3)}>← Back</button>
              <button className="btn btn-primary" disabled={loading} onClick={confirm}>
                {loading ? 'Booking…' : '✓ Confirm Booking'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StepBar({ step }) {
  const labels = ['Barber', 'Service', 'Time', 'Confirm']
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'0', marginTop:'0.5rem' }}>
      {labels.map((l, i) => {
        const n = i + 1
        const done    = n < step
        const current = n === step
        return (
          <div key={l} style={{ display:'flex', alignItems:'center', flex: i < labels.length-1 ? '1' : 'auto' }}>
            <div style={{
              display:'flex', flexDirection:'column', alignItems:'center', gap:'0.2rem',
            }}>
              <div style={{
                width:28, height:28, borderRadius:'50%', display:'flex',
                alignItems:'center', justifyContent:'center', fontSize:'0.78rem', fontWeight:600,
                background: done || current ? 'var(--gold)' : 'var(--surface2)',
                color: done || current ? '#0d0d14' : 'var(--muted)',
                border: `2px solid ${current ? 'var(--gold)' : done ? 'var(--gold)' : 'var(--border)'}`,
              }}>
                {done ? '✓' : n}
              </div>
              <span style={{ fontSize:'0.68rem', color: current ? 'var(--gold)' : 'var(--muted)', whiteSpace:'nowrap' }}>{l}</span>
            </div>
            {i < labels.length - 1 && (
              <div style={{
                flex:1, height:2, margin:'0 0.4rem 1.3rem',
                background: done ? 'var(--gold)' : 'var(--border)',
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.88rem' }}>
      <span style={{ color:'var(--muted)' }}>{label}</span>
      <span style={{ fontWeight:500 }}>{value}</span>
    </div>
  )
}
