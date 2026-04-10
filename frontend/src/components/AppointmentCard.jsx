import { appointmentsAPI } from '../api/api'
import { useLanguage } from '../context/LanguageContext'


const STATUS_CLASS = {
  Confirmed:  'badge-confirmed',
  Scheduled:  'badge-scheduled',
  Completed:  'badge-completed',
  Cancelled:  'badge-cancelled',
}

export default function AppointmentCard({ appt, isBarber, onRefresh, onReview, onPay }) {
  const { language, t } = useLanguage()
  const fmt = (iso) => new Date(iso).toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US', {
    weekday:'short', month:'short', day:'numeric',
    hour:'2-digit', minute:'2-digit',
  })

  const action = async (fn) => { try { await fn(); onRefresh() } catch(e){ alert(e.message) } }

  const canCancel  = ['Scheduled','Confirmed'].includes(appt.status)
  const canConfirm = isBarber && appt.status === 'Scheduled'
  const canComplete= isBarber && appt.status === 'Confirmed'
  const canPay     = !isBarber && appt.status === 'Confirmed' && appt.payments.length === 0
  const canReview  = !isBarber && appt.status === 'Completed'

  return (
    <div className="card" style={{ display:'flex', flexDirection:'column', gap:'0.8rem' }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <h3 style={{ fontSize:'1.05rem' }}>{t(appt.service?.name) || '---'}</h3>
          <div className="muted" style={{ marginTop:'0.2rem' }}>
            {isBarber ? `${t('role_client')}: ${appt.client?.name || '---'}` : `${t('barber')}: ${appt.barber?.name || '---'}`}
          </div>
        </div>
        <span className={`badge ${STATUS_CLASS[appt.status] || ''}`}>{t(`status_${appt.status?.toLowerCase() || 'unknown'}`)}</span>
      </div>

      {/* Details */}
      <div style={{ display:'flex', gap:'1.2rem', flexWrap:'wrap' }}>
        <Detail icon="📅" text={fmt(appt.datetime)} />
        <Detail icon="💈" text={`${appt.service?.duration || 0} min`} />
        <Detail icon="💰" text={`$${appt.service?.price?.toFixed(2) || '0.00'}`} />
      </div>

      {/* Payment info */}
      {appt.payments.length > 0 && (
        <div style={{ background:'var(--surface2)', borderRadius:'var(--radius-sm)', padding:'0.6rem 0.9rem', fontSize:'0.82rem' }}>
          💳 {appt.payments[0].method} — ${appt.payments[0].amount.toFixed(2)}
          {appt.payments[0].tip > 0 && (
            <span style={{ marginLeft:'0.4rem', color:'var(--gold)', fontSize:'0.78rem' }}>
              ({t('tip')}: ${appt.payments[0].tip.toFixed(2)})
            </span>
          )}
          <span style={{ marginLeft:'0.6rem', color:'var(--success)' }}>{t('paid')}</span>
        </div>
      )}

      {/* Actions */}
      <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap', marginTop:'0.2rem' }}>
        {canConfirm  && <button className="btn btn-success btn-sm" onClick={() => action(() => appointmentsAPI.confirm (appt.appointment_id))}>✓ {t('confirm')}</button>}
        {canComplete && <button className="btn btn-primary btn-sm" onClick={() => action(() => appointmentsAPI.complete(appt.appointment_id))}>✔ {t('complete')}</button>}
        {canPay      && <button className="btn btn-primary btn-sm" onClick={() => onPay(appt)}>💳 {t('pay')}</button>}
        {canReview   && <button className="btn btn-ghost  btn-sm" onClick={() => onReview(appt)}>⭐ {t('leave_review')}</button>}
        {canCancel   && <button className="btn btn-danger  btn-sm" onClick={() => action(() => appointmentsAPI.cancel (appt.appointment_id))}>✕ {t('cancel_appt')}</button>}
      </div>
    </div>
  )
}

function Detail({ icon, text }) {
  return (
    <span style={{ fontSize:'0.82rem', color:'var(--muted)', display:'flex', alignItems:'center', gap:'0.3rem' }}>
      {icon} {text}
    </span>
  )
}
