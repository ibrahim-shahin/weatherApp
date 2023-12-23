import axios from 'axios'
import { useState } from 'react'
import './assets/App.css'
import { useEffect } from 'react'
function App() {
  const [data, setData] = useState({})
  const [city, setCity] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function fetchData() {
      let res = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=Amman&units=metric&appid=5ba3f2d3fa2816db87e9fe949691fc6e`)
      setData(res.data)
    }
    fetchData();
  }, []);

  const getWether = async (event) => {
    try {
      if (event.key === 'Enter') {
        setLoading(true)
        setError(false)
        let res = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=5ba3f2d3fa2816db87e9fe949691fc6e`)
        setData(res.data)
        setCity("")
        setLoading(false)
      }
    }
    catch (err) {
      console.log(err)
      setError(true)
      setLoading(false)
    }
  }

  return (
    <>
      <div className="app">
        {loading && <div class="loader"></div>}

        <div className="search">
          <input type="text" name="" id="" placeholder='Enter Location' value={city} onChange={input => { setCity(input.target.value) }} onKeyDown={getWether} />
        </div>

        <div className="container">

          <div className="top">

            <div>

              <div className="location">
                {data.name && <p>{data.name}</p>}
              </div>

              <div className="temp">
                {data.main && <h1>{Math.round(data.main.temp)} °C</h1>}
              </div>

            </div>

            <div className='desc'>
              {data.weather && <p>{data.weather[0].description}</p>}
            </div>

          </div>

          <div className="bot">

            <div className="feels">
              <p>Feels like: </p>
              {data.main && <p>{Math.round(data.main.feels_like)}°C </p>}
            </div>

            <div className="humidity">
              <p>Humidity: </p>
              {data.main && <p>{data.main.humidity}%</p>}
            </div>

            <div className="wind">
              <p>Wind Speed: </p>
              {data.wind && <p className='bold'>{data.wind.speed} kph</p>}
            </div>
          </div>
        </div>

        {error && (
          <div className="dialog">
            <p>⚠️ Invalid Input, please enter a valid location</p>
          </div>
        )}
      </div>
    </>
  )
}

export default App