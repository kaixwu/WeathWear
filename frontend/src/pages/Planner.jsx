import { useState } from "react";
import axios from "axios";
import { useAuth } from "../AuthContext";
import { useData } from "../DataContext";
import { CalendarCheck, Zap, Trash2, ListTodo, Sparkles, Send, MapPin, Clock, Car } from "lucide-react";

export default function Planner() {
  const { token } = useAuth();
  const {
    allItineraries, refreshItineraries, weather, currentCoords, places, todayPlan
  } = useData();

  const [activeTab, setActiveTab] = useState("today");
  const [genLoading, setGenLoading] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [aiSuggestionLoading, setAiSuggestionLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);

  const deleteItinerary = async (id) => {
    try {
      await axios.delete(`/api/itineraries/${id}`);
      refreshItineraries();
    } catch (err) {
      console.error(err);
      alert("Failed to delete itinerary.");
    }
  };

  const saveSuggestionToToday = async (stops, schedule) => {
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      await axios.post("/api/itineraries", {
        date_str: todayStr,
        time_str: "",
        places: stops,
        schedule: schedule || null,
      });
      refreshItineraries();
      alert("Plan saved for today!");
      setAiSuggestion(null);
      setGeneratedPlan(null);
    } catch (err) {
      console.error(err);
      alert("Failed to save plan.");
    }
  };

  const handleGenerateItinerary = async () => {
    setGenLoading(true);
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const todaysPlans = allItineraries.filter((it) => it.date_str === todayStr);
      let allPlaces = todaysPlans.flatMap((it) => it.places);

      // Fallback to merged todayPlan from context
      if (allPlaces.length === 0 && todayPlan?.places) {
        allPlaces = todayPlan.places;
      }

      if (allPlaces.length === 0) {
        alert("No places in today's plan. Add some first from Destinations.");
        setGenLoading(false);
        return;
      }

      const weatherData = weather
        ? {
            temp: weather.main.temp,
            rain_prob: weather.rain ? 100 : 0,
            condition: weather.weather[0].description,
            wind_speed: weather.wind.speed * 3.6,
          }
        : { temp: 30, rain_prob: 0, condition: "Clear" };

      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const ampm = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 || 12;
      const startTime = `${displayHours}:${String(minutes).padStart(2, "0")} ${ampm}`;

      const res = await axios.post("/api/generate-itinerary", {
        places: allPlaces,
        weather: weatherData,
        start_time: startTime,
        preferences: { tripType: "Any", vibe: "Any" },
      });

      setGeneratedPlan(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to generate itinerary.");
    } finally {
      setGenLoading(false);
    }
  };

  const handleTextPrompt = async () => {
    if (!aiPrompt.trim()) return;
    setAiSuggestionLoading(true);
    try {
      const weatherData = weather
        ? {
            temp: weather.main.temp,
            rain_prob: weather.rain ? 100 : 0,
            condition: weather.weather[0].description,
            wind_speed: weather.wind.speed * 3.6,
          }
        : { temp: 30, rain_prob: 0, condition: "Clear" };

      let locationToSend = searchLocation.trim();
      if (locationToSend && !/(philippines|ph\b|manila|cebu|davao|quezon|makati|tagaytay|baguio)/i.test(locationToSend)) {
        locationToSend = `${locationToSend}, Philippines`;
      }

      const res = await axios.post("/api/generate-itinerary-text", {
        prompt: aiPrompt,
        lat: currentCoords?.lat,
        lon: currentCoords?.lon,
        search_location: locationToSend,
        weather: weatherData,
      });

      setAiSuggestion(res.data);
    } catch (err) {
      console.error(err);
      alert("AI request failed. Try again later.");
    } finally {
      setAiSuggestionLoading(false);
    }
  };

  const getLocalDateString = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const todayItins = allItineraries.filter((it) => it.date_str === getLocalDateString());
  const upcomingItins = allItineraries.filter((it) => it.date_str > getLocalDateString());

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px 40px" }}>
      {/* ------ Header ------ */}
      <div style={{ marginBottom: "32px", display: "flex", alignItems: "center", gap: "12px" }}>
        <CalendarCheck size={32} color="var(--accent-blue)" />
        <h1 className="font-heading" style={{ color: "var(--accent-blue)", fontSize: "2rem", margin: 0 }}>
          Your Planner
        </h1>
      </div>

      {/* ------ Toggle Tabs ------ */}
      <div style={{ display: "flex", borderBottom: "2px solid var(--glass-border)", marginBottom: "24px" }}>
        <button
          onClick={() => setActiveTab("today")}
          style={{
            flex: 1, padding: "12px 0", background: "transparent", border: "none",
            borderBottom: activeTab === "today" ? "3px solid var(--accent-blue)" : "3px solid transparent",
            color: activeTab === "today" ? "var(--accent-blue)" : "var(--text-muted)",
            fontWeight: "700", fontSize: "1.1rem", cursor: "pointer", transition: "0.2s",
          }}
        >
          Today’s Plan
          {todayItins.length > 0 && (
            <span style={{ marginLeft: "8px", background: "var(--accent-blue)", color: "#fff", padding: "2px 8px", borderRadius: "20px", fontSize: "0.75rem" }}>
              {todayItins.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("upcoming")}
          style={{
            flex: 1, padding: "12px 0", background: "transparent", border: "none",
            borderBottom: activeTab === "upcoming" ? "3px solid var(--accent-teal)" : "3px solid transparent",
            color: activeTab === "upcoming" ? "var(--accent-teal)" : "var(--text-muted)",
            fontWeight: "700", fontSize: "1.1rem", cursor: "pointer", transition: "0.2s",
          }}
        >
          Upcoming
          {upcomingItins.length > 0 && (
            <span style={{ marginLeft: "8px", background: "var(--accent-teal)", color: "#000", padding: "2px 8px", borderRadius: "20px", fontSize: "0.75rem" }}>
              {upcomingItins.length}
            </span>
          )}
        </button>
      </div>

      {/* ------ Today’s Plan Section ------ */}
      {activeTab === "today" && (
        <div>
          {/* AI Generate Button */}
          {todayItins.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <button
                onClick={handleGenerateItinerary}
                disabled={genLoading}
                style={{
                  padding: "12px 24px", background: "linear-gradient(135deg, var(--accent-blue), var(--accent-teal))",
                  border: "none", borderRadius: "12px", color: "#fff", fontWeight: "700",
                  fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px",
                }}
              >
                <Sparkles size={20} /> {genLoading ? "Generating..." : "Generate Smart Itinerary"}
              </button>

              {genLoading && <div className="skeleton" style={{ height: "80px", marginTop: "16px" }} />}

              {generatedPlan && (
                <div className="glass-card" style={{ marginTop: "16px", padding: "20px", background: "rgba(15,23,42,0.6)", border: "1px solid var(--accent-teal)" }}>
                  <h4 style={{ margin: "0 0 12px", color: "var(--accent-teal)" }}>✨ AI‑optimized Route</h4>
                  <p style={{ color: "#e2e8f0", fontSize: "0.9rem", marginBottom: "12px" }}>
                    {generatedPlan.explanation}
                    {generatedPlan.best_start_time && <> Suggested start: <strong>{generatedPlan.best_start_time}</strong></>}
                  </p>

                  {/* Schedule display */}
                  {generatedPlan.schedule && generatedPlan.schedule.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "12px" }}>
                      {generatedPlan.schedule.map((item, idx) => (
                        <div key={idx} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px", background: "rgba(255,255,255,0.05)", borderRadius: "8px" }}>
                          <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "var(--accent-blue)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700" }}>{idx + 1}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: "700" }}>{item.place}</div>
                            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                              {item.arrival_time} → {item.departure_time}
                              {item.activity_suggestion && <div style={{ fontStyle: "italic", marginTop: "2px" }}>{item.activity_suggestion}</div>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {generatedPlan.stops?.map((stop, idx) => (
                        <div key={idx} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px", background: "rgba(255,255,255,0.05)", borderRadius: "8px" }}>
                          <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "var(--accent-blue)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700" }}>{idx + 1}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: "700" }}>{stop.name}</div>
                            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{stop.category} · {stop.distance} km · {stop.travelMins} min</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {generatedPlan.total_travel_mins && (
                    <div style={{ marginTop: "12px", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                      Total travel time ~{generatedPlan.total_travel_mins} min
                    </div>
                  )}
                  <div style={{ marginTop: "16px", display: "flex", gap: "12px" }}>
                    <button
                      onClick={() => saveSuggestionToToday(generatedPlan.stops, generatedPlan.schedule)}
                      style={{ flex: 1, padding: "10px", background: "var(--accent-blue)", border: "none", borderRadius: "8px", color: "#fff", fontWeight: "600", cursor: "pointer" }}
                    >
                      Save to Today
                    </button>
                    <button
                      onClick={() => setGeneratedPlan(null)}
                      style={{ flex: 1, padding: "10px", background: "transparent", border: "1px solid var(--glass-border)", color: "#fff", borderRadius: "8px", cursor: "pointer" }}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {todayItins.length === 0 && !generatedPlan ? (
            <div className="glass-card" style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
              No plan scheduled for today. Use Destinations or ask AI below!
            </div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
              {todayItins.map((it) => (
                <div key={it.id} className="glass-card" style={{ flex: "1 1 300px", padding: "16px", minWidth: "280px" }}>
                  <div style={{ fontWeight: "700", fontSize: "1.1rem", marginBottom: "8px" }}>
                    {it.date_str} {it.time_str && `at ${it.time_str}`}
                  </div>
                  {it.schedule ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {it.schedule.map((item, idx) => (
                        <div key={idx} style={{ fontSize: "0.9rem", color: "#e2e8f0" }}>
                          <strong>{item.arrival_time}–{item.departure_time}:</strong> {item.place}
                          {item.activity_suggestion && <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontStyle: "italic" }}>{item.activity_suggestion}</div>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <ul style={{ margin: 0, paddingLeft: "20px", color: "#e2e8f0" }}>
                      {it.places.map((p, idx) => (
                        <li key={idx} style={{ marginBottom: "4px" }}>{p.name} ({p.category})</li>
                      ))}
                    </ul>
                  )}
                  <button
                    onClick={() => deleteItinerary(it.id)}
                    style={{ marginTop: "12px", padding: "4px 8px", background: "transparent", border: "1px solid var(--danger)", color: "var(--danger)", borderRadius: "4px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                  >
                    <Trash2 size={14} /> Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Text Prompt Section */}
          <div style={{ marginTop: "40px" }}>
            <h3 className="font-heading" style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Sparkles size={20} color="var(--accent-teal)" /> Ask AI to Plan
            </h3>
            <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
              <input
                type="text"
                placeholder="e.g., Rainy afternoon with kids, or Romantic evening"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="input-field"
                style={{ flex: 1, marginBottom: 0 }}
                onKeyDown={(e) => e.key === "Enter" && handleTextPrompt()}
              />
              <input
                type="text"
                placeholder="Area (e.g., Intramuros, BGC, Tagaytay)"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                className="input-field"
                style={{ flex: 1, marginBottom: 0 }}
              />
              <button
                onClick={handleTextPrompt}
                disabled={aiSuggestionLoading || !aiPrompt.trim()}
                style={{ padding: "0 24px", background: "var(--accent-teal)", border: "none", borderRadius: "8px", color: "#000", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Send size={18} /> {aiSuggestionLoading ? "..." : "Send"}
              </button>
            </div>

            {aiSuggestion && (
              <div className="glass-card" style={{ padding: "24px", background: "rgba(15,23,42,0.6)", border: "1px solid var(--accent-teal)", marginTop: "16px" }}>
                <h4 style={{ margin: "0 0 12px", color: "var(--accent-teal)" }}>💬 AI Suggestion</h4>
                <p style={{ color: "#e2e8f0", fontSize: "0.95rem", marginBottom: "16px" }}>{aiSuggestion.explanation}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
                  {aiSuggestion.stops?.map((stop, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px", background: "rgba(255,255,255,0.05)", borderRadius: "8px" }}>
                      <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "var(--accent-teal)", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700" }}>{idx + 1}</div>
                      <div>
                        <div style={{ fontWeight: "700" }}>{stop.name}</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{stop.category} · {stop.distance} km · {stop.travelMins} min</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    onClick={() => saveSuggestionToToday(aiSuggestion.stops)}
                    style={{ flex: 1, padding: "10px", background: "var(--accent-blue)", border: "none", borderRadius: "8px", color: "#fff", fontWeight: "600", cursor: "pointer" }}
                  >
                    Save to Today
                  </button>
                  <button
                    onClick={() => setAiSuggestion(null)}
                    style={{ flex: 1, padding: "10px", background: "transparent", border: "1px solid var(--glass-border)", color: "#fff", borderRadius: "8px", cursor: "pointer" }}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upcoming Tab */}
      {activeTab === "upcoming" && (
        <div>
          {upcomingItins.length === 0 ? (
            <div className="glass-card" style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>No upcoming plans yet.</div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
              {upcomingItins.map((it) => (
                <div key={it.id} className="glass-card" style={{ flex: "1 1 300px", padding: "16px", minWidth: "280px" }}>
                  <div style={{ fontWeight: "700", fontSize: "1.1rem", marginBottom: "8px" }}>
                    {it.date_str} {it.time_str && `at ${it.time_str}`}
                  </div>
                  {it.schedule ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {it.schedule.map((item, idx) => (
                        <div key={idx} style={{ fontSize: "0.9rem", color: "#e2e8f0" }}>
                          <strong>{item.arrival_time}–{item.departure_time}:</strong> {item.place}
                          {item.activity_suggestion && <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontStyle: "italic" }}>{item.activity_suggestion}</div>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <ul style={{ margin: 0, paddingLeft: "20px", color: "#e2e8f0" }}>
                      {it.places.map((p, idx) => <li key={idx}>{p.name} ({p.category})</li>)}
                    </ul>
                  )}
                  <button onClick={() => deleteItinerary(it.id)} style={{ marginTop: "12px", padding: "4px 8px", background: "transparent", border: "1px solid var(--danger)", color: "var(--danger)", borderRadius: "4px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Trash2 size={14} /> Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}