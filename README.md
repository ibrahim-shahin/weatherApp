# WeatherHub

Current weather, the next 24 hours and a 7-day forecast for any city, or for wherever you are.

**Live:** https://weather-app-xlod.onrender.com

- Search with suggestions: type a city and pick it with the mouse, or the arrow keys and Enter.
- Your location, with the browser's permission.
- °C / °F. Your choice, your last place and your recent places are remembered on the device.
- The background follows the weather and the time of day: clear, cloudy, fog, rain, snow or storm.
- Works on any screen from a 320 px phone up, and nothing on the page is an image.

Weather data comes from [Open-Meteo](https://open-meteo.com/), which needs no API key.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
```

## Tests

```bash
npm test                          # unit and component tests (Vitest, Testing Library)
npx playwright install chromium   # once
npm run test:e2e                  # the built app in Chromium at 5 screen sizes, with saved API responses
npm run lint
```

Built with React and Vite.
