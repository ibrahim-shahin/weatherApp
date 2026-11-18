import { afterEach, expect, test, vi } from 'vitest'
import amman from '../e2e/fixtures/forecast-amman.json'
import london from '../e2e/fixtures/search-london.json'
import { WeatherApiError, fetchForecast, searchPlaces, toForecast } from './api'

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

afterEach(() => vi.unstubAllGlobals())

test('reshapes the forecast and starts the hourly list at the current hour', () => {
  const forecast = toForecast(amman)
  expect(forecast.timezone).toBe('Asia/Amman')
  expect(forecast.current.temperature).toBe(amman.current.temperature_2m)
  expect(forecast.hours).toHaveLength(24)
  expect(forecast.hours[0].time).toBe(`${amman.current.time.slice(0, 13)}:00`)
  expect(forecast.days).toHaveLength(7)
  expect(forecast.days[0]).toMatchObject({
    date: amman.daily.time[0],
    max: amman.daily.temperature_2m_max[0],
    min: amman.daily.temperature_2m_min[0],
    sunrise: amman.daily.sunrise[0],
  })
})

test('asks Open-Meteo for the right place and fields', async () => {
  const fetchMock = vi.fn(async () => json(amman))
  vi.stubGlobal('fetch', fetchMock)
  await fetchForecast({ latitude: 31.95522, longitude: 35.94503 })

  const url = new URL(fetchMock.mock.calls[0][0])
  expect(url.origin + url.pathname).toBe('https://api.open-meteo.com/v1/forecast')
  expect(url.searchParams.get('latitude')).toBe('31.95522')
  expect(url.searchParams.get('timezone')).toBe('auto')
  expect(url.searchParams.get('current')).toContain('weather_code')
  expect(url.searchParams.get('daily')).toContain('sunrise')
})

test('search trims and encodes the query, and maps the results', async () => {
  const fetchMock = vi.fn(async () => json(london))
  vi.stubGlobal('fetch', fetchMock)
  const places = await searchPlaces('  São Paulo & co ')

  expect(new URL(fetchMock.mock.calls[0][0]).searchParams.get('name')).toBe('São Paulo & co')
  expect(places[0]).toMatchObject({ name: 'London', country: 'United Kingdom', countryCode: 'GB' })
})

test('no matches is an empty list, not an error', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => json({ generationtime_ms: 0.1 })))
  await expect(searchPlaces('zzzzqx')).resolves.toEqual([])
})

test('network and server failures become readable errors', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch') }))
  await expect(fetchForecast({ latitude: 1, longitude: 1 })).rejects.toThrow(/Couldn't reach the weather service/)

  vi.stubGlobal('fetch', vi.fn(async () => json({ reason: 'oops' }, 502)))
  const error = await fetchForecast({ latitude: 1, longitude: 1 }).catch((err) => err)
  expect(error).toBeInstanceOf(WeatherApiError)
  expect(error.message).toMatch(/\(502\)/)
})
