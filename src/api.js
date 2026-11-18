// Open-Meteo: free for non-commercial use, no API key. https://open-meteo.com/en/terms
const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'

const CURRENT = [
  'temperature_2m',
  'apparent_temperature',
  'relative_humidity_2m',
  'is_day',
  'precipitation',
  'weather_code',
  'cloud_cover',
  'wind_speed_10m',
  'wind_direction_10m',
  'pressure_msl',
]
const HOURLY = ['temperature_2m', 'weather_code', 'precipitation_probability', 'is_day']
const DAILY = [
  'weather_code',
  'temperature_2m_max',
  'temperature_2m_min',
  'precipitation_probability_max',
  'sunrise',
  'sunset',
  'uv_index_max',
]

export class WeatherApiError extends Error {}

async function getJson(url, signal) {
  let response
  try {
    response = await fetch(url, { signal })
  } catch (err) {
    if (err.name === 'AbortError') throw err
    throw new WeatherApiError("Couldn't reach the weather service. Check your connection and try again.")
  }
  if (!response.ok) {
    throw new WeatherApiError(`The weather service answered with an error (${response.status}). Try again in a moment.`)
  }
  return response.json()
}

export async function searchPlaces(query, signal) {
  const params = new URLSearchParams({ name: query.trim(), count: '6', language: 'en', format: 'json' })
  const data = await getJson(`${GEOCODING_URL}?${params}`, signal)
  return (data.results ?? []).map((result) => ({
    id: result.id,
    name: result.name,
    admin1: result.admin1,
    country: result.country,
    countryCode: result.country_code,
    latitude: result.latitude,
    longitude: result.longitude,
  }))
}

export async function fetchForecast({ latitude, longitude }, signal) {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: CURRENT.join(','),
    hourly: HOURLY.join(','),
    daily: DAILY.join(','),
    timezone: 'auto',
    forecast_days: '7',
  })
  return toForecast(await getJson(`${FORECAST_URL}?${params}`, signal))
}

// Open-Meteo answers in parallel arrays; the UI wants one object per hour and per day.
export function toForecast({ timezone, current, hourly, daily }) {
  const thisHour = `${current.time.slice(0, 13)}:00`
  const start = Math.max(0, hourly.time.indexOf(thisHour))
  const hours = hourly.time.slice(start, start + 24).map((time, offset) => {
    const i = start + offset
    return {
      time,
      temperature: hourly.temperature_2m[i],
      code: hourly.weather_code[i],
      precipitationChance: hourly.precipitation_probability[i],
      isDay: hourly.is_day[i] === 1,
    }
  })
  const days = daily.time.map((date, i) => ({
    date,
    code: daily.weather_code[i],
    max: daily.temperature_2m_max[i],
    min: daily.temperature_2m_min[i],
    precipitationChance: daily.precipitation_probability_max[i],
    sunrise: daily.sunrise[i],
    sunset: daily.sunset[i],
    uvIndex: daily.uv_index_max[i],
  }))

  return {
    timezone,
    current: {
      time: current.time,
      temperature: current.temperature_2m,
      feelsLike: current.apparent_temperature,
      humidity: current.relative_humidity_2m,
      isDay: current.is_day === 1,
      precipitation: current.precipitation,
      code: current.weather_code,
      cloudCover: current.cloud_cover,
      windSpeed: current.wind_speed_10m,
      windDirection: current.wind_direction_10m,
      pressure: current.pressure_msl,
    },
    hours,
    days,
  }
}
