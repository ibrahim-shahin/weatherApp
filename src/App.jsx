import axios from 'axios'
import { useState } from 'react'
import './assets/App.css'
import { useEffect } from 'react'
function App() {
  const [data, setData] = useState({})
  const [city, setCity] = useState("")
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    async function fetchData() {
      let res = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=Amman&units=metric&appid=5ba3f2d3fa2816db87e9fe949691fc6e`)
      setData(res.data)
    }
    fetchData();
  },[]);
  
  const getWether = async (event) => {
    try {
      if (event.key === 'Enter') {
        setLoading(true)
        let res = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=5ba3f2d3fa2816db87e9fe949691fc6e`)
        setData(res.data)
        setCity("")
        setLoading(false)
      }
    }
    catch (err) {
      console.log(err)
    }
  }

  return (
    <>
      {loading && <p>Loading...</p>}
      <div className="app">
        <div className="search">
          <input type="text" name="" id="" placeholder='Enter Location' value={city} onChange={input => { setCity(input.target.value) }} onKeyDown={getWether} />
        </div>
        <div className="container">
          <div className="top">
            <div className="location">
              {data.name && <p>{data.name}</p>}
            </div>
            <div className="temp">
              { data.main && <h1>{Math.round(data.main.temp)} °C</h1>}
            </div>
            <div className="desc">
              { data.weather && <p>{data.weather[0].description}</p>}
            </div>
          </div>
          <div className="bot">
            <div className="feels">
              { data.main && <p>{Math.round(data.main.feels_like)} °C</p>}
              <p>Feels like</p>
            </div>
            <div className="humidity">
              { data.main && <p>{data.main.humidity}%</p>}
              <p>Humidity</p>
            </div>
            <div className="wind">
              { data.wind && <p className='bold'>{data.wind.speed} kph</p>}
              <p>Wind Speed</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default App