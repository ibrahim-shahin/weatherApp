import { expect, test } from 'vitest'
import {
  flagEmoji,
  formatHour,
  formatLongDate,
  formatPrecipitation,
  formatPressure,
  formatTemp,
  formatTime,
  formatWeekday,
  formatWind,
  placeDetails,
} from './format'

test('temperatures round and convert', () => {
  expect(formatTemp(19.1)).toBe('19°')
  expect(formatTemp(19.1, 'imperial')).toBe('66°')
  expect(formatTemp(-0.4)).toBe('0°')
  expect(formatTemp(-17.8, 'imperial')).toBe('0°')
  expect(formatTemp(null)).toBe('–')
})

test('wind, rain and pressure in both unit systems', () => {
  expect(formatWind(9.4)).toBe('9 km/h')
  expect(formatWind(16.09, 'imperial')).toBe('10 mph')
  expect(formatPrecipitation(0)).toBe('0 mm')
  expect(formatPrecipitation(2.54, 'imperial')).toBe('0.10 in')
  expect(formatPressure(1013.25)).toBe('1013 hPa')
  expect(formatPressure(1013.25, 'imperial')).toBe('29.92 inHg')
})

test("shows the place's own wall-clock time, whatever the viewer's time zone", () => {
  // Open-Meteo local times carry no offset; they must not be shifted into the browser's zone.
  expect(formatTime('2026-11-18T15:45', 'en-US')).toBe('3:45 PM')
  expect(formatTime('2026-11-18T00:05', 'en-GB')).toBe('0:05')
  expect(formatHour('2026-11-18T07:00', 'en-US')).toBe('7 AM')
  expect(formatWeekday('2026-11-19', 'en-US')).toBe('Thu')
  expect(formatLongDate('2026-11-18T15:45', 'en-US')).toBe('Wednesday, November 18')
})

test('flags from country codes', () => {
  expect(flagEmoji('JO')).toBe('🇯🇴')
  expect(flagEmoji('gb')).toBe('🇬🇧')
  expect(flagEmoji(undefined)).toBe('')
  expect(flagEmoji('XYZ')).toBe('')
})

test('place details skip a region that repeats the name', () => {
  expect(placeDetails({ name: 'London', admin1: 'England', country: 'United Kingdom' })).toBe('England, United Kingdom')
  expect(placeDetails({ name: 'Singapore', admin1: 'Singapore', country: 'Singapore' })).toBe('Singapore')
  expect(placeDetails({ name: 'Your location' })).toBe('')
})
