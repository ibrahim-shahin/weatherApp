// Hand-drawn weather icons on a 64x64 grid. The cloud and moon outlines are Feather icons
// (MIT, feathericons.com) drawn filled and scaled up.
const CLOUD = 'M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z'
const MOON = 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z'

const SUN_COLOR = '#ffc83d'
const RAIN_COLOR = '#8ccfff'
const round = (n) => Math.round(n * 100) / 100

const Cloud = ({ x, y, s, fill = '#ffffff' }) => (
  <path d={CLOUD} transform={`translate(${x} ${y}) scale(${s})`} fill={fill} />
)

const Moon = ({ x, y, s }) => <path d={MOON} transform={`translate(${x} ${y}) scale(${s})`} fill="#f6e7a8" />

function Sun({ cx, cy, r }) {
  const rays = Array.from({ length: 8 }, (_, i) => {
    const angle = (i * Math.PI) / 4
    const point = (distance) => [round(cx + Math.cos(angle) * distance), round(cy + Math.sin(angle) * distance)]
    const [x1, y1] = point(r + 4)
    const [x2, y2] = point(r + 9)
    return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />
  })
  return (
    <g className="wi-sun">
      <g stroke={SUN_COLOR} strokeWidth="3" strokeLinecap="round">
        {rays}
      </g>
      <circle cx={cx} cy={cy} r={r} fill={SUN_COLOR} />
    </g>
  )
}

const Drops = ({ xs, from = 49, length = 8 }) => (
  <g stroke={RAIN_COLOR} strokeWidth="3" strokeLinecap="round">
    {xs.map((x, i) => (
      <line key={x} className="wi-drop" style={{ animationDelay: `${i * 0.3}s` }} x1={x} y1={from} x2={x - 1} y2={from + length} />
    ))}
  </g>
)

const Flakes = ({ points }) => (
  <g fill="#ffffff">
    {points.map(([x, y], i) => (
      <circle key={`${x},${y}`} className="wi-flake" style={{ animationDelay: `${i * 0.4}s` }} cx={x} cy={y} r="2.6" />
    ))}
  </g>
)

// The cloud sits higher when there's something falling out of it.
const RainCloud = ({ fill }) => <Cloud x={5} y={-1} s={2.2} fill={fill} />

function Shapes({ icon, isDay }) {
  switch (icon) {
    case 'clear':
      return isDay ? <Sun cx={32} cy={32} r={12} /> : <Moon x={6} y={6} s={2.2} />
    case 'mostly-clear':
      return (
        <>
          {isDay ? <Sun cx={25} cy={25} r={10} /> : <Moon x={5} y={5} s={1.8} />}
          <Cloud x={24} y={28} s={1.4} />
        </>
      )
    case 'partly-cloudy':
      return (
        <>
          {isDay ? <Sun cx={22} cy={22} r={8} /> : <Moon x={4} y={4} s={1.4} />}
          <Cloud x={14} y={16} s={1.9} />
        </>
      )
    case 'fog':
      return (
        <g stroke="#e8eef4" strokeWidth="4" strokeLinecap="round">
          <line x1="14" y1="22" x2="50" y2="22" />
          <line x1="9" y1="32" x2="55" y2="32" />
          <line x1="14" y1="42" x2="50" y2="42" />
          <line x1="21" y1="52" x2="43" y2="52" />
        </g>
      )
    case 'drizzle':
      return (
        <>
          <RainCloud />
          <Drops xs={[24, 33, 42]} from={50} length={4} />
        </>
      )
    case 'rain':
      return (
        <>
          <RainCloud />
          <Drops xs={[22, 32, 42]} />
        </>
      )
    case 'sleet':
      return (
        <>
          <RainCloud />
          <Drops xs={[23, 43]} />
          <Flakes points={[[33, 55]]} />
        </>
      )
    case 'snow':
      return (
        <>
          <RainCloud />
          <Flakes points={[[22, 52], [32, 58], [42, 52]]} />
        </>
      )
    case 'thunder':
      return (
        <>
          <RainCloud fill="#b8c4d2" />
          <polygon className="wi-bolt" points="34,40 25,53 31,53 28,62 40,47 34,47 37,40" fill="#ffd23f" />
        </>
      )
    default: // overcast
      return (
        <>
          <Cloud x={16} y={2} s={1.7} fill="#cbd5e1" />
          <Cloud x={3} y={12} s={2.1} />
        </>
      )
  }
}

export default function WeatherIcon({ icon, isDay = true, label, size = 48, animated = false }) {
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true }
  return (
    <svg
      className={animated ? 'weather-icon is-animated' : 'weather-icon'}
      viewBox="0 0 64 64"
      width={size}
      height={size}
      focusable="false"
      {...a11y}
    >
      <Shapes icon={icon} isDay={isDay} />
    </svg>
  )
}
