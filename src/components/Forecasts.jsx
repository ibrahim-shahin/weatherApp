import { formatHour, formatTemp, formatWeekday } from '../format'
import { describeWeather } from '../weather'
import WeatherIcon from './WeatherIcon'

const Chance = ({ value }) => (
  <span className="chance">
    {value > 0 ? (
      <>
        <span className="sr-only">Chance of rain </span>
        {value}%
      </>
    ) : null}
  </span>
)

export function Hourly({ hours, units }) {
  return (
    <section className="card hourly" aria-labelledby="hourly-title">
      <h2 id="hourly-title">Next 24 hours</h2>
      {/* Focusable so keyboard users can scroll it sideways. */}
      <ol className="hour-list" aria-labelledby="hourly-title" tabIndex={0}>
        {hours.map((hour, index) => {
          const weather = describeWeather(hour.code, hour.isDay)
          return (
            <li key={hour.time} className="hour">
              <span className="hour-time">{index === 0 ? 'Now' : formatHour(hour.time)}</span>
              <WeatherIcon icon={weather.icon} isDay={hour.isDay} label={weather.label} size={36} />
              <span className="hour-temp">{formatTemp(hour.temperature, units)}</span>
              <Chance value={hour.precipitationChance} />
            </li>
          )
        })}
      </ol>
    </section>
  )
}

export function Daily({ days, units }) {
  const low = Math.min(...days.map((day) => day.min))
  const high = Math.max(...days.map((day) => day.max))
  const span = high - low || 1

  return (
    <section className="card daily" aria-labelledby="daily-title">
      <h2 id="daily-title">7-day forecast</h2>
      <ol className="day-list">
        {days.map((day, index) => {
          const weather = describeWeather(day.code, true)
          const start = ((day.min - low) / span) * 100
          const width = Math.max(((day.max - day.min) / span) * 100, 4)
          return (
            <li key={day.date} className="day">
              <span className="day-name">{index === 0 ? 'Today' : formatWeekday(day.date)}</span>
              <WeatherIcon icon={weather.icon} label={weather.label} size={32} />
              <Chance value={day.precipitationChance} />
              <span className="day-min">
                <span className="sr-only">Low </span>
                {formatTemp(day.min, units)}
              </span>
              <span className="range" aria-hidden="true">
                <span className="range-fill" style={{ left: `${start}%`, width: `${width}%` }} />
              </span>
              <span className="day-max">
                <span className="sr-only">High </span>
                {formatTemp(day.max, units)}
              </span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
