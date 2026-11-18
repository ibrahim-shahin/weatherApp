import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import amman from '../e2e/fixtures/forecast-amman.json'
import londonForecast from '../e2e/fixtures/forecast-london.json'
import londonSearch from '../e2e/fixtures/search-london.json'
import App from './App'

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

let failForecast = false

beforeEach(() => {
  failForecast = false
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input) => {
      const url = new URL(input)
      if (url.hostname === 'geocoding-api.open-meteo.com') return json(londonSearch)
      if (failForecast) throw new TypeError('Failed to fetch')
      return json(Number(url.searchParams.get('latitude')) > 45 ? londonForecast : amman)
    }),
  )
})

afterEach(() => vi.unstubAllGlobals())

const heading = () => screen.findByRole('heading', { level: 1 })
const current = (temp) => `${Math.round(temp)}°`

test('opens on Amman with the current conditions, 24 hours and 7 days', async () => {
  render(<App />)
  expect(await heading()).toHaveTextContent('Amman')
  expect(screen.getByText(current(amman.current.temperature_2m), { selector: '.temp' })).toBeInTheDocument()
  expect(within(screen.getByRole('region', { name: 'Next 24 hours' })).getAllByRole('listitem')).toHaveLength(24)
  expect(within(screen.getByRole('region', { name: '7-day forecast' })).getAllByRole('listitem')).toHaveLength(7)
  expect(document.title).toContain('Amman')
})

test('switches to Fahrenheit and remembers it', async () => {
  const user = userEvent.setup()
  const { unmount } = render(<App />)
  await heading()
  await user.click(screen.getByRole('button', { name: '°F' }))

  const fahrenheit = `${Math.round((amman.current.temperature_2m * 9) / 5 + 32)}°`
  expect(screen.getByText(fahrenheit, { selector: '.temp' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: '°F' })).toHaveAttribute('aria-pressed', 'true')

  unmount()
  render(<App />)
  await heading()
  expect(screen.getByText(fahrenheit, { selector: '.temp' })).toBeInTheDocument()
})

test('searches, picks a city with the keyboard, and adds it to recent places', async () => {
  const user = userEvent.setup()
  render(<App />)
  await heading()

  const search = screen.getByRole('combobox', { name: 'Search for a city' })
  await user.type(search, 'Lon')
  const options = await screen.findAllByRole('option')
  expect(options[0]).toHaveTextContent('London')
  expect(options[0]).toHaveAttribute('aria-selected', 'true')

  await user.keyboard('{Enter}')
  await waitFor(async () => expect(await heading()).toHaveTextContent('London'))
  expect(search).toHaveValue('')
  expect(within(screen.getByRole('navigation', { name: 'Recent places' })).getByRole('button', { name: /London/ })).toBeInTheDocument()
  expect(JSON.parse(localStorage.getItem('weatherhub:place')).name).toBe('London')
})

test('says so when nothing matches', async () => {
  fetch.mockImplementation(async (input) => {
    const url = new URL(input)
    return url.hostname === 'geocoding-api.open-meteo.com' ? json({}) : json(amman)
  })
  const user = userEvent.setup()
  render(<App />)
  await heading()
  await user.type(screen.getByRole('combobox'), 'Qwzx')
  expect(await screen.findByText('No places match “Qwzx”')).toBeInTheDocument()
})

test('shows an error with a working retry button when the forecast fails', async () => {
  failForecast = true
  const user = userEvent.setup()
  render(<App />)

  expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't reach the weather service")
  failForecast = false
  await user.click(screen.getByRole('button', { name: 'Try again' }))
  expect(await heading()).toHaveTextContent('Amman')
})

test('uses the device location when allowed, and explains when it is blocked', async () => {
  const user = userEvent.setup()
  const getCurrentPosition = vi.fn((success) => success({ coords: { latitude: 51.5085, longitude: -0.1257 } }))
  vi.stubGlobal('navigator', { ...navigator, geolocation: { getCurrentPosition } })
  render(<App />)
  await heading()

  await user.click(screen.getByRole('button', { name: 'Use my location' }))
  await waitFor(async () => expect(await heading()).toHaveTextContent('Your location'))
  expect(screen.queryByRole('navigation', { name: 'Recent places' })).not.toBeInTheDocument()

  getCurrentPosition.mockImplementation((_, failure) => failure({ code: 1, PERMISSION_DENIED: 1 }))
  await user.click(screen.getByRole('button', { name: 'Use my location' }))
  expect(await screen.findByText(/Location access is blocked/)).toBeInTheDocument()
})

test('ignores a corrupted saved place', async () => {
  localStorage.setItem('weatherhub:place', '{"name": 5}')
  render(<App />)
  expect(await heading()).toHaveTextContent('Amman')
})
