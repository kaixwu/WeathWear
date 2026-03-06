import { useState, useEffect } from "react"
import axios from "axios"

function App() {
  const [city, setCity] = useState("")
  const [coords, setCoords] = useState(null)
  const [weather, setWeather] = useState(null)
  const [locationError, setLocationError] = useState(false)
  const [manualCity, setManualCity] = useState("")
  const [weatherError, setWeatherError] = useState(false)

  const apiKey = import.meta.env.VITE_WEATHER_API_KEY

  // Fetch weather using coordinates
  const fetchWeatherByCoords = async (lat, lon) => {
    try {
      const res = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
      )
      setWeather(res.data)
      setCity(res.data.name)
    } catch (err) {
      setWeatherError(true)
    }
  }

  // Fetch weather using city name (manual input)
  const fetchWeatherByCity = async (cityName) => {
    try {
      const res = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${apiKey}&units=metric`
      )
      setWeather(res.data)
      setCity(res.data.name)
    } catch (err) {
      setWeatherError(true)
    }
  }

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setCoords({ latitude, longitude })
        fetchWeatherByCoords(latitude, longitude)
      },
      () => setLocationError(true)
    )
  }, [])

  // Weather condition icon
  const getWeatherIcon = (condition) => {
    if (!condition) return "🌤️"
    const c = condition.toLowerCase()
    if (c.includes("rain") || c.includes("drizzle")) return "🌧️"
    if (c.includes("thunder")) return "⛈️"
    if (c.includes("cloud")) return "☁️"
    if (c.includes("clear")) return "☀️"
    if (c.includes("snow")) return "❄️"
    if (c.includes("mist") || c.includes("fog")) return "🌫️"
    return "🌤️"
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0f172a",
      color: "white",
      fontFamily: "Arial, sans-serif",
      padding: "30px"
    }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "24px" }}>
        🌤️ WeathWear
      </h1>

      {/* Location denied — show manual input */}
      {locationError && (
        <div style={{ marginBottom: "20px" }}>
          <p>📍 Location access denied. Enter your city:</p>
          <input
            value={manualCity}
            onChange={(e) => setManualCity(e.target.value)}
            placeholder="e.g. Caloocan City"
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              border: "none",
              marginRight: "8px",
              color: "black"
            }}
          />
          <button
            onClick={() => fetchWeatherByCity(manualCity)}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              background: "#3b82f6",
              color: "white",
              border: "none",
              cursor: "pointer"
            }}
          >
            Get Weather
          </button>
        </div>
      )}

      {/* Weather Card */}
      {weather ? (
        <div style={{
          background: "#1e293b",
          borderRadius: "16px",
          padding: "24px",
          maxWidth: "360px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.3)"
        }}>
          <div style={{ fontSize: "0.9rem", color: "#94a3b8", marginBottom: "4px" }}>
            📍 {city}
          </div>
          <div style={{ fontSize: "4rem", margin: "8px 0" }}>
            {getWeatherIcon(weather.weather[0].description)}
          </div>
          <div style={{ fontSize: "3rem", fontWeight: "bold", marginBottom: "4px" }}>
            {Math.round(weather.main.temp)}°C
          </div>
          <div style={{ color: "#94a3b8", textTransform: "capitalize", marginBottom: "16px" }}>
            {weather.weather[0].description}
          </div>
          <div style={{ display: "flex", gap: "16px" }}>
            <div style={{
              background: "#0f172a",
              borderRadius: "10px",
              padding: "12px 16px",
              flex: 1,
              textAlign: "center"
            }}>
              <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Humidity</div>
              <div style={{ fontSize: "1.3rem", fontWeight: "bold" }}>
                {weather.main.humidity}%
              </div>
            </div>
            <div style={{
              background: "#0f172a",
              borderRadius: "10px",
              padding: "12px 16px",
              flex: 1,
              textAlign: "center"
            }}>
              <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Rain</div>
              <div style={{ fontSize: "1.3rem", fontWeight: "bold" }}>
                {weather.rain ? `${weather.rain["1h"] || 0}mm` : "None"}
              </div>
            </div>
            <div style={{
              background: "#0f172a",
              borderRadius: "10px",
              padding: "12px 16px",
              flex: 1,
              textAlign: "center"
            }}>
              <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Feels Like</div>
              <div style={{ fontSize: "1.3rem", fontWeight: "bold" }}>
                {Math.round(weather.main.feels_like)}°C
              </div>
            </div>
          </div>
        </div>
      ) : !locationError && !weatherError ? (
        <p style={{ color: "#64748b" }}>⏳ Loading weather for {city || "your location"}...</p>
      ) : weatherError ? (
        <p style={{ color: "#f87171" }}>❌ Could not fetch weather. Check your city name.</p>
      ) : null}
    </div>
  )
}

export default App