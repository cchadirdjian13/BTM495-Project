// ABOUTME: Star rating component — interactive (radiogroup) or read-only (img) with full keyboard nav.
// ABOUTME: Uses Lucide Star SVG; supports arrow-key navigation and Enter/Space selection.
import { Star } from 'lucide-react'

export default function RatingStars({ value = 0, onChange, size = '1.3rem', readOnly = false }) {
  const handleKeyDown = (s, e) => {
    if (readOnly) return
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onChange?.(s) }
    if (e.key === 'ArrowRight' && s < 5) { e.preventDefault(); onChange?.(s + 1) }
    if (e.key === 'ArrowLeft'  && s > 1) { e.preventDefault(); onChange?.(s - 1) }
  }

  return (
    <div
      className="stars"
      role={readOnly ? 'img' : 'radiogroup'}
      aria-label={readOnly ? `${value} out of 5 stars` : 'Rate your experience'}
    >
      {[1, 2, 3, 4, 5].map(s => (
        <span
          key={s}
          className={`star ${s <= value ? 'filled' : 'empty'}`}
          onClick={() => !readOnly && onChange?.(s)}
          onKeyDown={(e) => handleKeyDown(s, e)}
          role={readOnly ? undefined : 'radio'}
          aria-checked={readOnly ? undefined : s === value}
          aria-label={`${s} star${s > 1 ? 's' : ''}`}
          tabIndex={readOnly ? -1 : s === value || (value === 0 && s === 1) ? 0 : -1}
          style={{ cursor: readOnly ? 'default' : 'pointer', display: 'inline-flex', alignItems: 'center' }}
        >
          <Star
            style={{ width: size, height: size }}
            fill={s <= value ? 'currentColor' : 'none'}
            aria-hidden="true"
          />
        </span>
      ))}
    </div>
  )
}
