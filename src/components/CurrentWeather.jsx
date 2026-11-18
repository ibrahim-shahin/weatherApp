import { flagEmoji, formatLongDate, formatTemp, formatTime, placeDetails } from '../format'
import WeatherIcon from './WeatherIcon'

export default function CurrentWeather({ place, forecast, weather, units }) {
  const { current, days } = forecast
  const today = days[0]
  const flag = flagEmoji(place.countryCode)
  const details = placeDetails(place)

  return (
    <section className="card current" aria-labelledby="place-name">
      <h1 id="place-name">
        {place.name}
        {flag && (
          <span className="flag" aria-hidden="true">
            {' '}
            {flag}
          </span>
        )}
      </h1>
      {details && <p className="muted">{details}</p>}
      <p className="muted small">
        {formatLongDate(current.time)} · updated {formatTime(current.time)} local time
      </p>

      <div className="current-main">
        <WeatherIcon icon={weather.icon} isDay={weather.isDay} label={weather.label} size={112} animated />
        <div>
          <p className="temp">{formatTemp(current.temperature, units)}</p>
          <p className="condition">{weather.label}</p>
          <p className="muted">
            Feels like {formatTemp(current.feelsLike, units)} · H {formatTemp(today.max, units)} · L{' '}
            {formatTemp(today.min, units)}
          </p>
        </div>
      </div>
    </section>
  )
}
