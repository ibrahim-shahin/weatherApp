import { describe, expect, test } from 'vitest'
import { WEATHER_CODES, compass, describeWeather, uvLevel } from './weather'

describe('describeWeather', () => {
  test('knows every WMO code Open-Meteo documents', () => {
    const documented = [0, 1, 2, 3, 45, 48, 51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86, 95, 96, 99]
    expect(WEATHER_CODES).toEqual(documented)
    for (const code of documented) expect(describeWeather(code).label).not.toBe('Unknown')
  })

  test('picks a sky for day and night', () => {
    expect(describeWeather(0, true)).toMatchObject({ label: 'Clear sky', icon: 'clear', theme: 'clear-day' })
    expect(describeWeather(0, false).theme).toBe('clear-night')
    expect(describeWeather(63, true).theme).toBe('rain-day')
    expect(describeWeather(95, false).theme).toBe('storm-night')
    expect(describeWeather(66).theme).toBe('snow-day') // freezing rain reads as wintry
  })

  test('falls back for a code it has never seen', () => {
    expect(describeWeather(42)).toMatchObject({ label: 'Unknown', icon: 'overcast', theme: 'cloudy-day' })
  })
})

test('uvLevel follows the WHO bands', () => {
  expect([0, 2.9, 3, 5.9, 6, 7.9, 8, 10.9, 11].map(uvLevel)).toEqual([
    'Low', 'Low', 'Moderate', 'Moderate', 'High', 'High', 'Very high', 'Very high', 'Extreme',
  ])
  expect(uvLevel(null)).toBeNull()
})

test('compass names the nearest of eight directions', () => {
  expect([0, 22, 23, 90, 180, 270, 313, 338, 360, -45].map(compass)).toEqual([
    'N', 'N', 'NE', 'E', 'S', 'W', 'NW', 'N', 'N', 'NW',
  ])
})
