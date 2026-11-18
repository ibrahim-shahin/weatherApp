import fs from 'node:fs'
import { expect, test } from '@playwright/test'

const fixture = (name) => fs.readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8')
const json = (body) => ({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body })

// Serve saved Open-Meteo answers: London for anything north of 45°, Amman otherwise.
async function mockOpenMeteo(target, { failForecast = false } = {}) {
  await target.route('https://api.open-meteo.com/v1/forecast?**', (route) => {
    if (failForecast) return route.abort('internetdisconnected')
    const latitude = Number(new URL(route.request().url()).searchParams.get('latitude'))
    return route.fulfill(json(fixture(latitude > 45 ? 'forecast-london.json' : 'forecast-amman.json')))
  })
  await target.route('https://geocoding-api.open-meteo.com/v1/search?**', (route) =>
    route.fulfill(json(fixture('search-london.json'))),
  )
}

const placeHeading = (page) => page.getByRole('heading', { level: 1 })

const SCREENS = [
  { name: 'small phone', width: 320, height: 640 },
  { name: 'phone', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'laptop', width: 1280, height: 800 },
  { name: 'wide screen', width: 1920, height: 1080 },
]

for (const screen of SCREENS) {
  test(`fits a ${screen.name} (${screen.width}px) with nothing cut off or scrolling sideways`, async ({ page }, testInfo) => {
    await mockOpenMeteo(page)
    await page.setViewportSize({ width: screen.width, height: screen.height })
    await page.goto('/')
    await expect(placeHeading(page)).toHaveText(/Amman/)

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow, 'page scrolls sideways').toBeLessThanOrEqual(0)

    // Every card fits inside the viewport horizontally.
    for (const box of await page.locator('.card').evaluateAll((cards) => cards.map((card) => card.getBoundingClientRect().toJSON()))) {
      expect(box.left).toBeGreaterThanOrEqual(0)
      expect(box.right).toBeLessThanOrEqual(screen.width)
    }

    // Controls are big enough to tap on touch screens, and to click comfortably elsewhere.
    const minHeight = screen.width <= 768 ? 38 : 30
    for (const control of ['Use my location', '°C', '°F']) {
      const box = await page.getByRole('button', { name: control }).boundingBox()
      expect(box.height, `${control} button height`).toBeGreaterThanOrEqual(minHeight)
    }

    await page.screenshot({ path: testInfo.outputPath(`${screen.width}px.png`), fullPage: true })
  })
}

test('search with the mouse, and the choice survives a reload', async ({ page }) => {
  await mockOpenMeteo(page)
  await page.goto('/')
  await expect(placeHeading(page)).toHaveText(/Amman/)

  await page.getByRole('combobox', { name: 'Search for a city' }).fill('Lon')
  await page.getByRole('option', { name: /London.*United Kingdom/ }).first().click()
  await expect(placeHeading(page)).toHaveText(/London/)
  await expect(page.getByRole('navigation', { name: 'Recent places' }).getByRole('button', { name: /London/ })).toBeVisible()

  await page.reload()
  await expect(placeHeading(page)).toHaveText(/London/)
})

test('search with the keyboard only', async ({ page }) => {
  await mockOpenMeteo(page)
  await page.goto('/')
  await expect(placeHeading(page)).toHaveText(/Amman/)

  const search = page.getByRole('combobox', { name: 'Search for a city' })
  await search.focus()
  await page.keyboard.type('Lon')
  await expect(page.getByRole('option').first()).toHaveAttribute('aria-selected', 'true')
  await page.keyboard.press('ArrowDown')
  await expect(page.getByRole('option').nth(1)).toHaveAttribute('aria-selected', 'true')
  await page.keyboard.press('ArrowUp')
  await page.keyboard.press('Enter')
  await expect(placeHeading(page)).toHaveText(/London/)
})

test('switches between °C and °F', async ({ page }) => {
  await mockOpenMeteo(page)
  await page.goto('/')
  const temp = page.locator('.temp')
  await expect(temp).toHaveText(/^-?\d+°$/)
  const celsius = Number((await temp.textContent()).replace('°', ''))

  await page.getByRole('button', { name: '°F' }).click()
  const fahrenheit = Number((await temp.textContent()).replace('°', ''))
  expect(Math.abs(fahrenheit - (celsius * 9) / 5 - 32)).toBeLessThanOrEqual(1)
  await expect(page.getByText(/mph/).first()).toBeVisible()
})

test('uses the device location', async ({ browser }) => {
  const context = await browser.newContext({
    geolocation: { latitude: 51.5085, longitude: -0.1257 },
    permissions: ['geolocation'],
    locale: 'en-US',
  })
  await mockOpenMeteo(context)
  const page = await context.newPage()
  await page.goto('/')
  await expect(placeHeading(page)).toHaveText(/Amman/)

  await page.getByRole('button', { name: 'Use my location' }).click()
  await expect(placeHeading(page)).toHaveText('Your location')
  await context.close()
})

test('explains a failed load and recovers on retry', async ({ page }) => {
  await mockOpenMeteo(page, { failForecast: true })
  await page.goto('/')
  await expect(page.getByRole('alert')).toContainText("Couldn't reach the weather service")

  await page.unrouteAll()
  await mockOpenMeteo(page)
  await page.getByRole('button', { name: 'Try again' }).click()
  await expect(placeHeading(page)).toHaveText(/Amman/)
})

test('loads fast: no images, and only Open-Meteo is called', async ({ page }) => {
  await mockOpenMeteo(page)
  const external = new Set()
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.hostname !== 'localhost') external.add(url.hostname)
    if (!url.pathname.endsWith('/favicon.svg')) expect(request.resourceType(), request.url()).not.toBe('image')
  })
  await page.goto('/')
  await expect(placeHeading(page)).toHaveText(/Amman/)
  expect([...external].sort()).toEqual(['api.open-meteo.com'])
})

// Browser window sizes on Macs (screen minus menu bar, browser toolbar and, where noted, the Dock).
const MAC_WINDOWS = [
  { name: 'shortest window that keeps the one-screen layout', width: 1280, height: 640 },
  { name: 'small window on a 13-inch MacBook', width: 1280, height: 680 },
  { name: '13-inch MacBook Air with the Dock', width: 1440, height: 700 },
  { name: '13-inch MacBook Air', width: 1440, height: 760 },
  { name: '15-inch MacBook Air', width: 1470, height: 830 },
  { name: '14-inch MacBook Pro', width: 1512, height: 860 },
  { name: '16-inch MacBook Pro', width: 1728, height: 990 },
  { name: 'external 27-inch display', width: 2560, height: 1340 },
]

const RECENT = [
  { name: 'London', admin1: 'England', country: 'United Kingdom', countryCode: 'GB', latitude: 51.50853, longitude: -0.12574 },
  { name: 'Dubai', admin1: 'Dubai', country: 'United Arab Emirates', countryCode: 'AE', latitude: 25.07725, longitude: 55.30927 },
  { name: 'Lisbon', admin1: 'Lisbon', country: 'Portugal', countryCode: 'PT', latitude: 38.71667, longitude: -9.13333 },
  { name: 'Irbid', admin1: 'Irbid', country: 'Jordan', countryCode: 'JO', latitude: 32.55556, longitude: 35.85 },
  { name: 'Barcelos', admin1: 'Braga', country: 'Portugal', countryCode: 'PT', latitude: 41.5388, longitude: -8.61512 },
]

for (const window of MAC_WINDOWS) {
  for (const withRecent of [false, true]) {
    const label = `${window.name} (${window.width}x${window.height})${withRecent ? ' with recent places' : ''}`
    test(`fits one screen without scrolling: ${label}`, async ({ page }, testInfo) => {
      await mockOpenMeteo(page)
      if (withRecent) {
        await page.addInitScript((recent) => localStorage.setItem('weatherhub:recent', JSON.stringify(recent)), RECENT)
      }
      await page.setViewportSize({ width: window.width, height: window.height })
      await page.goto('/')
      await expect(placeHeading(page)).toHaveText(/Amman/)
      if (withRecent) await expect(page.getByRole('navigation', { name: 'Recent places' })).toBeVisible()

      const layout = await page.evaluate(() => {
        const root = document.documentElement
        const hours = document.querySelector('.hour-list')
        return {
          vertical: root.scrollHeight - root.clientHeight,
          horizontal: root.scrollWidth - root.clientWidth,
          hourStrip: hours.scrollWidth - hours.clientWidth,
          cards: [...document.querySelectorAll('.card')].map((card) => ({
            card: card.className,
            overflow: card.scrollHeight - card.clientHeight,
          })),
        }
      })
      expect(layout.vertical, 'page scrolls vertically').toBeLessThanOrEqual(0)
      expect(layout.horizontal, 'page scrolls sideways').toBeLessThanOrEqual(0)
      expect(layout.hourStrip, 'the 24-hour strip scrolls sideways').toBeLessThanOrEqual(0)
      for (const { card, overflow } of layout.cards) expect(overflow, `${card} content spills over`).toBeLessThanOrEqual(0)

      await page.screenshot({ path: testInfo.outputPath(`${window.width}x${window.height}${withRecent ? '-recent' : ''}.png`) })
    })
  }
}
