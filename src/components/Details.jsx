import { formatPrecipitation, formatPressure, formatTime, formatWind } from '../format'
import { compass, uvLevel } from '../weather'
import { WindArrow } from './UiIcons'

export default function Details({ forecast, units }) {
  const { current, days } = forecast
  const today = days[0]
  const chance = today.precipitationChance

  const items = [
    { label: 'Humidity', value: current.humidity == null ? '–' : `${current.humidity}%` },
    {
      label: 'Wind',
      value: (
        <>
          {formatWind(current.windSpeed, units)}
          {current.windDirection != null && (
            <span className="wind-direction">
              <WindArrow degrees={current.windDirection} />
              {compass(current.windDirection)}
            </span>
          )}
        </>
      ),
    },
    {
      label: 'Precipitation',
      value: formatPrecipitation(current.precipitation, units),
      note: chance == null ? null : `${chance}% chance today`,
    },
    {
      label: 'UV index',
      value: today.uvIndex == null ? '–' : Math.round(today.uvIndex),
      note: uvLevel(today.uvIndex),
    },
    { label: 'Sunrise', value: today.sunrise ? formatTime(today.sunrise) : '–' },
    { label: 'Sunset', value: today.sunset ? formatTime(today.sunset) : '–' },
    { label: 'Pressure', value: formatPressure(current.pressure, units) },
  ]

  return (
    <section className="card details" aria-labelledby="details-title">
      <h2 id="details-title">Today</h2>
      <dl className="detail-grid">
        {items.map((item) => (
          <div className="detail" key={item.label}>
            <dt>{item.label}</dt>
            <dd>{item.value}</dd>
            {item.note && <dd className="note">{item.note}</dd>}
          </div>
        ))}
      </dl>
    </section>
  )
}
