import { useState, useEffect } from 'react'
import { barbersAPI, servicesAPI, appointmentsAPI } from '../api/api'
import { useLanguage } from '../context/LanguageContext'

import ServiceCard, { BarberCard } from './ServiceCard'
import SlotPicker from './SlotPicker'

export default function BookingModal({ onClose, onBooked }) {
  const { language, t } = useLanguage()
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
      setStep(5)
    } catch(e) {
      setError(e.message)
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>{t('book_appointment')}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {/* Step indicator */}
        <StepBar step={step} />

        {error && <div className="alert alert-error" style={{marginTop:'1rem'}}>{error}</div>}

        {/* Step 1: Choose barber */}
        {step === 1 && (
          <div style={{ marginTop:'1.2rem' }}>
            <p className="muted" style={{marginBottom:'1rem'}}>{t('choose_barber')}</p>
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
                {t('next')} →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Choose service */}
        {step === 2 && (
          <div style={{ marginTop:'1.2rem' }}>
            <p className="muted" style={{marginBottom:'1rem'}}>{t('choose_service')}</p>
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
              <button className="btn btn-ghost" onClick={() => setStep(1)}>← {t('back')}</button>
              <button className="btn btn-primary" disabled={!selectedService} onClick={() => setStep(3)}>{t('next')} →</button>
            </div>
          </div>
        )}

        {/* Step 3: Choose slot */}
        {step === 3 && (
          <div style={{ marginTop:'1.2rem' }}>
            <p className="muted" style={{marginBottom:'1rem'}}>
              {t('pick_time')} <strong style={{color:'var(--text)'}}>{selectedBarber.name}</strong>
            </p>
            <SlotPicker barberId={selectedBarber.user_id} onSelect={setSlot} />
            <div style={{display:'flex',justifyContent:'space-between',marginTop:'1.4rem'}}>
              <button className="btn btn-ghost" onClick={() => setStep(2)}>← {t('back')}</button>
              <button className="btn btn-primary" disabled={!selectedSlot} onClick={() => setStep(4)}>{t('next')} →</button>
            </div>
          </div>
        )}

        {/* Step 4: Confirm */}
        {step === 4 && (
          <div style={{ marginTop:'1.2rem' }}>
            <p className="muted" style={{marginBottom:'1.2rem'}}>{t('confirm_booking')}</p>
            <div className="card" style={{display:'flex',flexDirection:'column',gap:'0.7rem'}}>
              <Row label={t('barber')}  value={selectedBarber.name} />
              <Row label={t('service')} value={`${t(selectedService.name)} — $${selectedService.price}`} />
              <Row label={t('date')}    value={selectedSlot.date} />
              <Row label={t('time')}    value={`${selectedSlot.start_time} – ${selectedSlot.end_time}`} />
              <Row label={t('duration')} value={`${selectedService.duration} min`} />
            </div>
            {error && <div className="alert alert-error" style={{marginTop:'0.8rem'}}>{error}</div>}
            <div style={{display:'flex',justifyContent:'space-between',marginTop:'1.4rem'}}>
              <button className="btn btn-ghost" onClick={() => setStep(3)}>← {t('back')}</button>
              <button className="btn btn-primary" disabled={loading} onClick={confirm}>
                {loading ? (language === 'fr' ? 'Réservation...' : 'Booking…') : `✓ ${t('confirm_booking')}`}
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Success Animation */}
        {step === 5 && (
          <div className="success-animation-container">
            <div className="scissor-anim-wrapper">
              <svg viewBox="0 0 120 120" className="scissor-svg">
                <defs>
                  <mask id="draw-mask">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="white" strokeWidth="12" className="mask-progress" />
                  </mask>
                </defs>
                <circle cx="60" cy="60" r="50" className="circle-bg" />
                <circle cx="60" cy="60" r="50" className="circle-dashed" mask="url(#draw-mask)" />
                <circle cx="60" cy="60" r="50" className="circle-solid" />
                
                <g className="scissors-group">
                  <svg x="98" y="48" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="scissor-icon">
                    <circle cx="6" cy="6" r="3" />
                    <circle cx="6" cy="18" r="3" />
                    <line x1="20" y1="4" x2="8.12" y2="15.88" />
                    <line x1="14.47" y1="14.48" x2="20" y2="20" />
                    <line x1="8.12" y1="8.12" x2="12" y2="12" />
                  </svg>
                </g>
                
                <polyline points="40,65 55,80 85,45" className="checkmark" />
              </svg>
            </div>
            <h3>{t('booking_success')}</h3>
            <p className="muted" style={{ marginBottom: '2rem' }}>
              {t('date')}: {selectedSlot.date} • {t('time')}: {selectedSlot.start_time}
            </p>
            <button className="btn btn-primary btn-block" onClick={onBooked}>
              {t('done')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function StepBar({ step }) {
  const { t } = useLanguage()
  const labels = [t('barber'), t('service'), t('time'), t('confirm')]
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
