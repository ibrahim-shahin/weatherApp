export const toFahrenheit = (celsius) => (celsius * 9) / 5 + 32
export const toMph = (kmh) => kmh / 1.609344

const missing = (value) => value == null || Number.isNaN(value)

export function formatTemp(celsius, units = 'metric') {
  if (missing(celsius)) return '–'
  const value = Math.round(units === 'imperial' ? toFahrenheit(celsius) : celsius)
  return `${Object.is(value, -0) ? 0 : value}°`
}

export function formatWind(kmh, units = 'metric') {
  if (missing(kmh)) return '–'
  return units === 'imperial' ? `${Math.round(toMph(kmh))} mph` : `${Math.round(kmh)} km/h`
}

export function formatPrecipitation(mm, units = 'metric') {
  if (missing(mm)) return '–'
  return units === 'imperial' ? `${(mm / 25.4).toFixed(2)} in` : `${Number(mm.toFixed(1))} mm`
}

export function formatPressure(hpa, units = 'metric') {
  if (missing(hpa)) return '–'
  return units === 'imperial' ? `${(hpa * 0.02953).toFixed(2)} inHg` : `${Math.round(hpa)} hPa`
}

// Open-Meteo sends the place's local time without an offset ("2026-11-18T15:45"). Reading it as
// UTC and formatting in UTC shows exactly that wall-clock time, whatever the viewer's time zone.
function asUtc(localIso) {
  const [date, time = '00:00'] = localIso.split('T')
  const [year, month, day] = date.split('-').map(Number)
  const [hours, minutes] = time.split(':').map(Number)
  return new Date(Date.UTC(year, month - 1, day, hours, minutes))
}

const format = (localIso, locale, options) =>
  new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' }).format(asUtc(localIso))

export const formatTime = (localIso, locale) => format(localIso, locale, { hour: 'numeric', minute: '2-digit' })
export const formatHour = (localIso, locale) => format(localIso, locale, { hour: 'numeric' })
export const formatWeekday = (localIso, locale) => format(localIso, locale, { weekday: 'short' })
export const formatLongDate = (localIso, locale) => format(localIso, locale, { weekday: 'long', month: 'long', day: 'numeric' })

export function flagEmoji(countryCode) {
  if (!/^[A-Za-z]{2}$/.test(countryCode || '')) return ''
  return String.fromCodePoint(...[...countryCode.toUpperCase()].map((letter) => 0x1f1e6 + letter.charCodeAt(0) - 65))
}

// "London, England, United Kingdom" (skips the region when it repeats the name).
export function placeDetails(place) {
  return [place.admin1 !== place.name ? place.admin1 : null, place.country].filter(Boolean).join(', ')
}
