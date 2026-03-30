export default function RatingStars({ value = 0, onChange, size = '1.3rem', readOnly = false }) {
  return (
    <div className="stars" style={{ fontSize: size }}>
      {[1,2,3,4,5].map(s => (
        <span
          key={s}
          className={`star ${s <= value ? 'filled' : 'empty'}`}
          onClick={() => !readOnly && onChange && onChange(s)}
          style={{ cursor: readOnly ? 'default' : 'pointer' }}
          title={readOnly ? undefined : `${s} star${s>1?'s':''}`}
        >
          ★
        </span>
      ))}
    </div>
  )
}
