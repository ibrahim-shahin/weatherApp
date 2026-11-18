import { useEffect, useState } from 'react'
import { fetchForecast } from './api'
import { flagEmoji, formatTemp } from './format'
import { isPlace, load, save } from './storage'
import { describeWeather } from './weather'
import CurrentWeather from './components/CurrentWeather'
import Details from './components/Details'
import { Daily, Hourly } from './components/Forecasts'
import { ErrorPanel, LoadingPanel } from './components/Panels'
import SearchBox from './components/SearchBox'
import { LocateIcon } from './components/UiIcons'
import WeatherIcon from './components/WeatherIcon'

const DEFAULT_PLACE = {
  name: 'Amman',
  admin1: 'Amman Governorate',
  country: 'Jordan',
  countryCode: 'JO',
  latitude: 31.95522,
  longitude: 35.94503,
}
const MAX_RECENT = 5
const KEYS = { place: 'weatherhub:place', recent: 'weatherhub:recent', units: 'weatherhub:units' }

// Browser chrome colour per sky, so the phone's status bar blends in.
const THEME_COLORS = {
  'clear-day': '#1b5fc1',
  'clear-night': '#0b1026',
  'cloudy-day': '#4d6580',
  'cloudy-night': '#1c2533',
  'fog-day': '#5f7080',
  'fog-night': '#232a33',
  'rain-day': '#2f3f52',
  'rain-night': '#111a26',
  'snow-day': '#5b7896',
  'snow-night': '#1a2436',
  'storm-day': '#1f2633',
  'storm-night': '#0d1017',
}

const samePlace = (a, b) =>
  Boolean(a && b) && Math.abs(a.latitude - b.latitude) < 0.01 && Math.abs(a.longitude - b.longitude) < 0.01

export default function App() {
  const [place, setPlace] = useState(() => {
    const saved = load(KEYS.place, null)
    return isPlace(saved) ? saved : DEFAULT_PLACE
  })
  const [recent, setRecent] = useState(() => {
    const saved = load(KEYS.recent, [])
    return Array.isArray(saved) ? saved.filter(isPlace).slice(0, MAX_RECENT) : []
  })
  const [units, setUnits] = useState(() => (load(KEYS.units, 'metric') === 'imperial' ? 'imperial' : 'metric'))
  const [shown, setShown] = useState(null) // { place, forecast } currently on screen
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [attempt, setAttempt] = useState(0)
  const [locating, setLocating] = useState(false)
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    fetchForecast(place, controller.signal)
      .then((forecast) => {
        setShown({ place, forecast })
        setError(null)
        setLoading(false)
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        setError(err.message)
        setLoading(false)
      })
    return () => controller.abort()
  }, [place, attempt])

  const weather = shown ? describeWeather(shown.forecast.current.code, shown.forecast.current.isDay) : null
  const theme = weather?.theme ?? 'clear-day'

  useEffect(() => {
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme])
  }, [theme])

  useEffect(() => {
    if (!shown) return
    document.title = `${formatTemp(shown.forecast.current.temperature, units)} ${shown.place.name} · WeatherHub`
  }, [shown, units])

  const choosePlace = (next) => {
    setNotice(null)
    if (samePlace(next, place) && !error) return
    setPlace(next)
    setLoading(true)
    setError(null)
    save(KEYS.place, next)
    if (!next.isCurrentLocation) {
      const updated = [next, ...recent.filter((item) => !samePlace(item, next))].slice(0, MAX_RECENT)
      setRecent(updated)
      save(KEYS.recent, updated)
    }
  }

  const retry = () => {
    setLoading(true)
    setError(null)
    setAttempt((count) => count + 1)
  }

  const changeUnits = (next) => {
    setUnits(next)
    save(KEYS.units, next)
  }

  const locate = () => {
    if (!navigator.geolocation) {
      setNotice("This browser can't share your location. Search for a city instead.")
      return
    }
    setLocating(true)
    setNotice(null)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false)
        choosePlace({
          name: 'Your location',
          latitude: Number(position.coords.latitude.toFixed(4)),
          longitude: Number(position.coords.longitude.toFixed(4)),
          isCurrentLocation: true,
        })
      },
      (err) => {
        setLocating(false)
        setNotice(
          err.code === err.PERMISSION_DENIED
            ? 'Location access is blocked. Allow it in your browser settings, or search for a city instead.'
            : "Couldn't find your location. Search for a city instead.",
        )
      },
      { timeout: 10000, maximumAge: 10 * 60 * 1000 },
    )
  }

  let announcement = ''
  if (error) announcement = error
  else if (loading) announcement = 'Loading the forecast…'
  else if (shown) {
    announcement = `${shown.place.name}: ${formatTemp(shown.forecast.current.temperature, units)}, ${weather.label.toLowerCase()}`
  }

  let content
  if (error) content = <ErrorPanel message={error} onRetry={retry} />
  else if (!shown) content = <LoadingPanel />
  else {
    content = (
      <>
        <CurrentWeather place={shown.place} forecast={shown.forecast} weather={weather} units={units} />
        <Hourly hours={shown.forecast.hours} units={units} />
        <Daily days={shown.forecast.days} units={units} />
        <Details forecast={shown.forecast} units={units} />
      </>
    )
  }

  return (
    <div className="app" data-theme={theme}>
      <div className="sky" aria-hidden="true" />
      <div className="page">
        <header className="topbar">
          <a className="brand" href="./">
            <WeatherIcon icon="mostly-clear" size={30} />
            WeatherHub
          </a>
          <SearchBox onSelect={choosePlace} />
          <div className="actions">
            <button
              type="button"
              className="icon-button"
              onClick={locate}
              disabled={locating}
              aria-label="Use my location"
              title="Use my location"
            >
              <LocateIcon spinning={locating} />
            </button>
            <div className="units" role="group" aria-label="Temperature units">
              <button type="button" aria-pressed={units === 'metric'} onClick={() => changeUnits('metric')}>
                °C
              </button>
              <button type="button" aria-pressed={units === 'imperial'} onClick={() => changeUnits('imperial')}>
                °F
              </button>
            </div>
          </div>
        </header>

        {recent.length > 0 && (
          <nav className="recent" aria-label="Recent places">
            {recent.map((item) => (
              <button
                type="button"
                key={`${item.latitude},${item.longitude}`}
                className={samePlace(item, shown?.place) ? 'chip is-current' : 'chip'}
                onClick={() => choosePlace(item)}
              >
                {flagEmoji(item.countryCode)} {item.name}
              </button>
            ))}
          </nav>
        )}

        {notice && (
          <p className="notice" role="status">
            {notice}
          </p>
        )}

        <main className={loading && shown && !error ? 'content is-refreshing' : 'content'} aria-busy={loading}>
          {content}
        </main>

        <footer className="footer">
          Weather data by{' '}
          <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">
            Open-Meteo.com
          </a>{' '}
          ·{' '}
          <a href="https://github.com/ibrahim-shahin/weatherApp" target="_blank" rel="noopener noreferrer">
            Source on GitHub
          </a>
        </footer>
      </div>
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </div>
  )
}
