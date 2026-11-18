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

    // Controls are big enough to tap.
    for (const control of ['Use my location', '°C', '°F']) {
      const box = await page.getByRole('button', { name: control }).boundingBox()
      expect(box.height, `${control} button height`).toBeGreaterThanOrEqual(38)
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
