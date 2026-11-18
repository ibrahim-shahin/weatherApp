// WMO weather interpretation codes, as returned by Open-Meteo: [label, icon].
const CODES = {
  0: ['Clear sky', 'clear'],
  1: ['Mainly clear', 'mostly-clear'],
  2: ['Partly cloudy', 'partly-cloudy'],
  3: ['Overcast', 'overcast'],
  45: ['Fog', 'fog'],
  48: ['Freezing fog', 'fog'],
  51: ['Light drizzle', 'drizzle'],
  53: ['Drizzle', 'drizzle'],
  55: ['Heavy drizzle', 'drizzle'],
  56: ['Light freezing drizzle', 'sleet'],
  57: ['Freezing drizzle', 'sleet'],
  61: ['Light rain', 'rain'],
  63: ['Rain', 'rain'],
  65: ['Heavy rain', 'rain'],
  66: ['Light freezing rain', 'sleet'],
  67: ['Freezing rain', 'sleet'],
  71: ['Light snow', 'snow'],
  73: ['Snow', 'snow'],
  75: ['Heavy snow', 'snow'],
  77: ['Snow grains', 'snow'],
  80: ['Light showers', 'rain'],
  81: ['Showers', 'rain'],
  82: ['Violent showers', 'rain'],
  85: ['Light snow showers', 'snow'],
  86: ['Snow showers', 'snow'],
  95: ['Thunderstorm', 'thunder'],
  96: ['Thunderstorm with hail', 'thunder'],
  99: ['Thunderstorm with heavy hail', 'thunder'],
}

// Which background each icon gets.
const SKIES = {
  clear: 'clear',
  'mostly-clear': 'clear',
  'partly-cloudy': 'cloudy',
  overcast: 'cloudy',
  fog: 'fog',
  drizzle: 'rain',
  rain: 'rain',
  sleet: 'snow',
  snow: 'snow',
  thunder: 'storm',
}

export const WEATHER_CODES = Object.keys(CODES).map(Number)

export function describeWeather(code, isDay = true) {
  const [label, icon] = CODES[code] ?? ['Unknown', 'overcast']
  return { label, icon, isDay, theme: `${SKIES[icon]}-${isDay ? 'day' : 'night'}` }
}

export function uvLevel(index) {
  if (index == null) return null
  if (index < 3) return 'Low'
  if (index < 6) return 'Moderate'
  if (index < 8) return 'High'
  if (index < 11) return 'Very high'
  return 'Extreme'
}

const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']

export function compass(degrees) {
  const normalized = ((degrees % 360) + 360) % 360
  return COMPASS[Math.round(normalized / 45) % 8]
}
