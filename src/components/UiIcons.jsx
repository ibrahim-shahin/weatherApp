const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }

export const SearchIcon = (props) => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false" {...props}>
    <circle cx="11" cy="11" r="7" {...stroke} />
    <line x1="21" y1="21" x2="16.65" y2="16.65" {...stroke} />
  </svg>
)

export const LocateIcon = ({ spinning }) => (
  <svg className={spinning ? 'locate-icon is-spinning' : 'locate-icon'} viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
    <circle cx="12" cy="12" r="7" {...stroke} />
    <circle cx="12" cy="12" r="2.5" fill="currentColor" />
    <line x1="12" y1="1" x2="12" y2="4" {...stroke} />
    <line x1="12" y1="20" x2="12" y2="23" {...stroke} />
    <line x1="1" y1="12" x2="4" y2="12" {...stroke} />
    <line x1="20" y1="12" x2="23" y2="12" {...stroke} />
  </svg>
)

// Points where the wind is blowing to (meteorological direction is where it comes from).
export const WindArrow = ({ degrees }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false" style={{ transform: `rotate(${degrees + 180}deg)` }}>
    <line x1="12" y1="20" x2="12" y2="4" {...stroke} />
    <polyline points="6 10 12 4 18 10" {...stroke} />
  </svg>
)
