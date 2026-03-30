import RatingStars from './RatingStars'

export default function ServiceCard({ service, selected, onClick }) {
  return (
    <div
      className={`service-card${selected ? ' selected' : ''}`}
      onClick={onClick}
    >
      <h3>{service.name}</h3>
      <div className="service-meta">
        <span className="price">${service.price.toFixed(2)}</span>
        <span className="duration">⏱ {service.duration} min</span>
      </div>
    </div>
  )
}

export function BarberCard({ barber, selected, onClick }) {
  return (
    <div
      className={`card${selected ? ' selected' : ''}`}
      style={{ cursor:'pointer', borderColor: selected ? 'var(--gold)' : undefined, background: selected ? 'var(--gold-dim)' : undefined }}
      onClick={onClick}
    >
      <div style={{ display:'flex', alignItems:'center', gap:'0.8rem' }}>
        <div style={{
          width:44, height:44, borderRadius:'50%',
          background:'linear-gradient(135deg,var(--gold),#6b4a10)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:'1.2rem', flexShrink:0,
        }}>
          ✂
        </div>
        <div>
          <div style={{ fontWeight:600 }}>{barber.name}</div>
          <div style={{ fontSize:'0.78rem', color:'var(--muted)' }}>
            {barber.specialties?.join(', ') || 'General Barber'}
          </div>
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:'0.4rem', marginTop:'0.8rem' }}>
        <RatingStars value={Math.round(barber.rating || 0)} readOnly size="0.95rem" />
        <span style={{ fontSize:'0.8rem', color:'var(--muted)' }}>
          {barber.rating ? barber.rating.toFixed(1) : 'No reviews'}
        </span>
      </div>
    </div>
  )
}
