import { useEffect, useId, useRef, useState } from 'react'
import { searchPlaces } from '../api'
import { flagEmoji, placeDetails } from '../format'
import { SearchIcon } from './UiIcons'

const MIN_LENGTH = 2
const DEBOUNCE_MS = 250

// A combobox: type a city, pick one of Open-Meteo's matches with the mouse or the arrow keys.
export default function SearchBox({ onSelect }) {
  const id = useId()
  const inputRef = useRef(null)
  const [query, setQuery] = useState('')
  const [places, setPlaces] = useState([])
  const [status, setStatus] = useState('idle') // idle | searching | done | error
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const term = query.trim()

  useEffect(() => {
    if (term.length < MIN_LENGTH) return undefined
    const controller = new AbortController()
    const timer = setTimeout(() => {
      searchPlaces(term, controller.signal)
        .then((found) => {
          setPlaces(found)
          setActive(found.length > 0 ? 0 : -1)
          setStatus('done')
        })
        .catch((err) => {
          if (err.name === 'AbortError') return
          setPlaces([])
          setStatus('error')
        })
    }, DEBOUNCE_MS)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [term])

  const change = (value) => {
    setQuery(value)
    setOpen(true)
    if (value.trim().length < MIN_LENGTH) {
      setPlaces([])
      setActive(-1)
      setStatus('idle')
    } else {
      setStatus('searching')
    }
  }

  const choose = (place) => {
    onSelect(place)
    setQuery('')
    setPlaces([])
    setActive(-1)
    setStatus('idle')
    setOpen(false)
    inputRef.current?.blur() // closes the on-screen keyboard on phones
  }

  // Enter picks the highlighted match. If the matches are still loading, search right away
  // instead of guessing from results for an older query.
  const submit = async () => {
    if (status === 'done' && places[active]) {
      choose(places[active])
      return
    }
    if (term.length < MIN_LENGTH) return
    setStatus('searching')
    try {
      const found = await searchPlaces(term)
      if (found.length > 0) {
        choose(found[0])
      } else {
        setPlaces([])
        setStatus('done')
        setOpen(true)
      }
    } catch {
      setStatus('error')
      setOpen(true)
    }
  }

  const onKeyDown = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (places.length === 0) return
      event.preventDefault()
      const step = event.key === 'ArrowDown' ? 1 : -1
      setOpen(true)
      setActive((index) => (index + step + places.length) % places.length)
    } else if (event.key === 'Escape' && open) {
      event.preventDefault()
      setOpen(false)
    }
  }

  const showList = open && term.length >= MIN_LENGTH
  let message = null
  if (status === 'searching' && places.length === 0) message = 'Searching…'
  else if (status === 'done' && places.length === 0) message = `No places match “${term}”`
  else if (status === 'error') message = "Couldn't search right now. Try again."

  return (
    <form
      className="search"
      role="search"
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
    >
      <label className="sr-only" htmlFor={`${id}input`}>
        Search for a city
      </label>
      <SearchIcon className="search-icon" />
      <input
        ref={inputRef}
        id={`${id}input`}
        type="search"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={`${id}list`}
        aria-activedescendant={showList && places[active] ? `${id}option${active}` : undefined}
        autoComplete="off"
        spellCheck="false"
        enterKeyHint="search"
        placeholder="Search for a city"
        value={query}
        onChange={(event) => change(event.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
      />
      {showList && (
        <div className="suggestions">
          <ul id={`${id}list`} role="listbox" aria-label="Matching places">
            {places.map((place, index) => (
              <li
                key={place.id ?? `${place.latitude},${place.longitude}`}
                id={`${id}option${index}`}
                role="option"
                aria-selected={index === active}
                className={index === active ? 'is-active' : undefined}
                onMouseDown={(event) => event.preventDefault()} // keep focus, so the list stays open for the click
                onMouseEnter={() => setActive(index)}
                onClick={() => choose(place)}
              >
                <span className="suggestion-flag" aria-hidden="true">
                  {flagEmoji(place.countryCode)}
                </span>
                <span>
                  <span className="suggestion-name">{place.name}</span>
                  <span className="suggestion-detail">{placeDetails(place)}</span>
                </span>
              </li>
            ))}
          </ul>
          {message && (
            <p className="suggestion-message" role="status">
              {message}
            </p>
          )}
        </div>
      )}
    </form>
  )
}
