import { appointmentsAPI } from '../api/api'
import { useLanguage } from '../context/LanguageContext'
import { CalendarDays, Clock, DollarSign, CreditCard, Star, Check, CheckCheck, X } from 'lucide-react'


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
        <Detail icon={<CalendarDays size={13} aria-hidden="true" />} text={fmt(appt.datetime)} />
        <Detail icon={<Clock       size={13} aria-hidden="true" />} text={`${appt.service?.duration || 0} min`} />
        <Detail icon={<DollarSign  size={13} aria-hidden="true" />} text={`$${appt.service?.price?.toFixed(2) || '0.00'}`} />
      </div>

      {/* Payment info */}
      {appt.payments.length > 0 && (
        <div style={{ background:'var(--surface2)', borderRadius:'var(--radius-sm)', padding:'0.6rem 0.9rem', fontSize:'0.82rem', display:'flex', alignItems:'center', gap:'0.4rem', flexWrap:'wrap' }}>
          <CreditCard size={13} aria-hidden="true" />
          {appt.payments[0].method} — ${appt.payments[0].amount.toFixed(2)}
          {appt.payments[0].tip > 0 && (
            <span style={{ color:'var(--gold)', fontSize:'0.78rem' }}>
              ({t('tip')}: ${appt.payments[0].tip.toFixed(2)})
            </span>
          )}
          <span style={{ color:'var(--success)' }}>{t('paid')}</span>
        </div>
      )}

      {/* Actions */}
      <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap', marginTop:'0.2rem' }}>
        {canConfirm  && <button className="btn btn-success btn-sm" onClick={() => action(() => appointmentsAPI.confirm (appt.appointment_id))}><Check      size={14} aria-hidden="true" /> {t('confirm')}</button>}
        {canComplete && <button className="btn btn-primary btn-sm" onClick={() => action(() => appointmentsAPI.complete(appt.appointment_id))}><CheckCheck size={14} aria-hidden="true" /> {t('complete')}</button>}
        {canPay      && <button className="btn btn-primary btn-sm" onClick={() => onPay(appt)}><CreditCard size={14} aria-hidden="true" /> {t('pay')}</button>}
        {canReview   && <button className="btn btn-ghost   btn-sm" onClick={() => onReview(appt)}><Star       size={14} aria-hidden="true" /> {t('leave_review')}</button>}
        {canCancel   && <button className="btn btn-danger  btn-sm" onClick={() => action(() => appointmentsAPI.cancel  (appt.appointment_id))}><X          size={14} aria-hidden="true" /> {t('cancel_appt')}</button>}
      </div>
    </div>
  )
}

function Detail({ icon, text }) {
  return (
    <span style={{ fontSize:'0.82rem', color:'var(--muted)', display:'inline-flex', alignItems:'center', gap:'0.3rem' }}>
      {icon}{text}
    </span>
  )
}
