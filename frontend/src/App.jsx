import { useState, useEffect } from "react"
import axios from "axios"

function App() {
  const [city, setCity] = useState("")
  const [locationError, setLocationError] = useState(false)
  const [manualCity, setManualCity] = useState("")

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        const apiKey = import.meta.env.VITE_WEATHER_API_KEY
        const res = await axios.get(
          `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${apiKey}`
        )
        setCity(res.data[0].name)
      },
      () => setLocationError(true)
    )
  }, [])

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>🌤️ WeathWear</h1>
      {locationError ? (
        <div>
          <p>Location access denied. Enter your city:</p>
          <input
            value={manualCity}
            onChange={(e) => setManualCity(e.target.value)}
            placeholder="e.g. Caloocan City"
          />
          <button onClick={() => setCity(manualCity)}>Set Location</button>
        </div>
      ) : (
        <p>📍 {city ? `Detected: ${city}` : "Detecting location..."}</p>
      )}
    </div>
  )
}

export default App