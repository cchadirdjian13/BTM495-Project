import { useState, useEffect } from 'react'
import { barbersAPI } from '../api/api'
import { useLanguage } from '../context/LanguageContext'


// Returns next N days as YYYY-MM-DD strings
function getNextDays(n = 14) {
  const days = []
  const today = new Date()
  for (let i = 1; i <= n; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    days.push(d.toISOString().split('T')[0])
  }
  return days
}

function fmtDate(iso, lang) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { weekday:'short', month:'short', day:'numeric' })
}

export default function SlotPicker({ barberId, onSelect }) {
  const { language, t } = useLanguage()
  const days = getNextDays(14)
  const [selectedDate, setDate] = useState(days[0])
  const [slots, setSlots]       = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading]   = useState(false)

  useEffect(() => {
    if (!selectedDate) return
    setLoading(true)
    barbersAPI.availability(barberId, selectedDate)
      .then(s => { setSlots(s); setSelected(null) })
      .finally(() => setLoading(false))
  }, [barberId, selectedDate])

  const handleSlot = (slot) => {
    if (slot.is_booked) return
    setSelected(slot)
    onSelect(slot)
  }

  return (
    <div className="slot-picker">
      {/* Date row */}
      <div className="slot-dates">
        {days.map(d => (
          <button
            key={d}
            className={`slot-date-btn${selectedDate === d ? ' selected' : ''}`}
            onClick={() => { setDate(d); setSelected(null) }}
          >
            {fmtDate(d, language)}
          </button>
        ))}
      </div>

      {/* Time slots */}
      {loading ? (
        <div className="muted" style={{textAlign:'center',padding:'1rem'}}>{t('loading')}</div>
      ) : slots.length === 0 ? (
        <div className="muted" style={{textAlign:'center',padding:'1rem'}}>{language === 'fr' ? 'Aucun créneau disponible ce jour.' : 'No slots available this day.'}</div>
      ) : (
        <div className="slot-times">
          {slots.map(slot => (
            <button
              key={slot.slot_id}
              className={`slot-time-btn${selected?.slot_id === slot.slot_id ? ' selected' : ''}${slot.is_booked ? ' booked' : ''}`}
              onClick={() => handleSlot(slot)}
            >
              {slot.start_time}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
