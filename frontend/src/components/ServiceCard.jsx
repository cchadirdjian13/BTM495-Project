import RatingStars from './RatingStars'
import { useLanguage } from '../context/LanguageContext'
import { Clock, Scissors } from 'lucide-react'


export default function ServiceCard({ service, selected, onClick }) {
  const { t } = useLanguage()
  return (
    <div
      className={`service-card${selected ? ' selected' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick?.()}
    >
      <h3>{t(service.name)}</h3>
      <div className="service-meta">
        <span className="price">${service.price.toFixed(2)}</span>
        <span className="duration" style={{ display:'inline-flex', alignItems:'center', gap:'0.3rem' }}>
          <Clock size={12} aria-hidden="true" /> {service.duration} min
        </span>
      </div>
    </div>
  )
}

export function BarberCard({ barber, selected, onClick }) {
  const { t } = useLanguage()
  return (
    <div
      className={`card${selected ? ' selected' : ''}`}
      style={{ cursor:'pointer', borderColor: selected ? 'var(--gold)' : undefined, background: selected ? 'var(--gold-dim)' : undefined }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick?.()}
    >
      <div style={{ display:'flex', alignItems:'center', gap:'0.8rem' }}>
        <div style={{
          width:52, height:52, borderRadius:'50%', overflow: 'hidden',
          background:'linear-gradient(135deg,var(--gold),var(--gold-dark))',
          display:'flex', alignItems:'center', justifyContent:'center',
          flexShrink:0, border: '2px solid var(--gold)', color: '#000'
        }}>
          {barber.user_id <= 3 ?
            <img src={`/images/avatar_${barber.user_id}.png`} alt={barber.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <Scissors size={22} aria-hidden="true" />}
        </div>
        <div>
          <div style={{ fontWeight:600 }}>{barber.name}</div>
          <div style={{ fontSize:'0.78rem', color:'var(--muted)' }}>
            {barber.specialties?.join(', ') || t('role_barber')}
          </div>
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:'0.4rem', marginTop:'0.8rem' }}>
        <RatingStars value={Math.round(barber.rating || 0)} readOnly size="0.95rem" />
        <span style={{ fontSize:'0.8rem', color:'var(--muted)' }}>
          {barber.rating ? barber.rating.toFixed(1) : t('no_reviews')}
        </span>
      </div>
    </div>
  )
}
