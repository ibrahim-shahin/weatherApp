// localStorage can be missing or full (private browsing); the app works without it.
export function load(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value === null ? fallback : JSON.parse(value)
  } catch {
    return fallback
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // not worth interrupting anyone over
  }
}

export const isPlace = (value) =>
  value !== null &&
  typeof value === 'object' &&
  typeof value.name === 'string' &&
  Number.isFinite(value.latitude) &&
  Number.isFinite(value.longitude)
