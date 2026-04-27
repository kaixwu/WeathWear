import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../AuthContext";
import { useData } from "../DataContext";
import {
  Calendar, Clock, MapPin, Plus, Trash2, ArrowUp, ArrowDown,
  CalendarCheck, Zap, ListTodo, X, Check
} from "lucide-react";

const getLocalDateString = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export default function Planner() {
  const { token } = useAuth();
  const { weather, allItineraries, refreshItineraries } = useData();
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [loading, setLoading] = useState(true);

  const [schedule, setSchedule] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [showValidation, setShowValidation] = useState(false);
  const [pendingScheduleType, setPendingScheduleType] = useState(null);

  const [dateStr, setDateStr] = useState("");
  const [timeStr, setTimeStr] = useState("");

  // Tabs: 'today' or 'upcoming'
  const [activeTab, setActiveTab] = useState('today');

  const fetchSavedPlaces = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/saved-places");
      setSavedPlaces(res.data.places || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchSavedPlaces();
    }
  }, [token]);

  const removeSavedPlace = async (id) => {
    try {
      await axios.delete(`/api/saved-places/${id}`);
      setSavedPlaces(savedPlaces.filter(p => p.id !== id));
      setSchedule(schedule.filter(p => p.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to remove place.");
    }
  };

  const addToSchedule = (place) => {
    if (!schedule.find(p => p.id === place.id)) {
      setSchedule([...schedule, place]);
      setValidationResult(null);
    }
  };

  const removeFromSchedule = (id) => {
    setSchedule(schedule.filter(p => p.id !== id));
    setValidationResult(null);
  };

  const moveUp = (index) => {
    if (index === 0) return;
    const newSched = [...schedule];
    const temp = newSched[index - 1];
    newSched[index - 1] = newSched[index];
    newSched[index] = temp;
    setSchedule(newSched);
    setValidationResult(null);
  };

  const moveDown = (index) => {
    if (index === schedule.length - 1) return;
    const newSched = [...schedule];
    const temp = newSched[index + 1];
    newSched[index + 1] = newSched[index];
    newSched[index] = temp;
    setSchedule(newSched);
    setValidationResult(null);
  };

  const deleteItinerary = async (id) => {
    try {
      await axios.delete(`/api/itineraries/${id}`);
      refreshItineraries();
    } catch (err) {
      console.error(err);
      alert("Failed to delete itinerary.");
    }
  };

  const saveScheduleToDB = async (finalDate, timeStr, scheduleToSave) => {
    try {
      await axios.post("/api/itineraries", {
        date_str: finalDate,
        time_str: timeStr,
        places: scheduleToSave
      });
      refreshItineraries();
      alert("Schedule Confirmed & Saved!");
      setShowValidation(false);
      setPendingScheduleType(null);
      setSchedule([]);
      setDateStr("");
      setTimeStr("");
    } catch (err) {
      console.error(err);
      alert("Failed to confirm schedule.");
    }
  };

  const handleInitiateValidation = async (isToday) => {
    if (!schedule.length) return;
    const todayStr = getLocalDateString();
    const finalDate = isToday ? todayStr : dateStr;

    if (!finalDate) {
      alert("Please select a date or click Go Today!");
      return;
    }

    setPendingScheduleType(isToday ? 'today' : 'future');
    setAiLoading(true);

    try {
      const weatherData = weather
        ? { temp: weather.main.temp, rain_prob: weather.rain ? 100 : 0 }
        : { temp: 30, rain_prob: 0 };

      const res = await axios.post("/api/validate-schedule", {
        places: schedule,
        weather: weatherData,
        date_str: finalDate,
        time_str: timeStr,
      });

      const valText = res.data.validation || "";
      if (valText.startsWith("[APPROVED]")) {
        setValidationResult(valText.replace("[APPROVED]", "").trim());
        await saveScheduleToDB(finalDate, timeStr, schedule);
      } else {
        setValidationResult(valText.replace("[WARNING]", "").trim());
        setShowValidation(true);
      }
    } catch (err) {
      console.error(err);
      setValidationResult("Failed to reach Gemini for validation. You can still proceed.");
      setShowValidation(true);
    } finally {
      setAiLoading(false);
    }
  };

  const handleFinalSave = () => {
    const isToday = pendingScheduleType === 'today';
    const todayStr = getLocalDateString();
    const finalDate = isToday ? todayStr : dateStr;
    saveScheduleToDB(finalDate, timeStr, schedule);
  };

  const upcomingItineraries = allItineraries.filter(it => it.date_str >= getLocalDateString());
  const todayItineraries = allItineraries.filter(it => it.date_str === getLocalDateString());

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px 40px" }}>
      <div style={{ marginBottom: "32px", display: "flex", alignItems: "center", gap: "12px" }}>
        <CalendarCheck size={32} color="var(--accent-blue)" />
        <h1 className="font-heading" style={{ color: "var(--accent-blue)", fontSize: "2rem", margin: 0 }}>
          Your Planner
        </h1>
      </div>

      {/* Toggle Tabs */}
      <div style={{ display: "flex", borderBottom: "2px solid var(--glass-border)", marginBottom: "24px" }}>
        <button
          onClick={() => setActiveTab('today')}
          style={{
            flex: 1,
            padding: "12px 0",
            background: "transparent",
            border: "none",
            borderBottom: activeTab === 'today' ? "3px solid var(--accent-blue)" : "3px solid transparent",
            color: activeTab === 'today' ? "var(--accent-blue)" : "var(--text-muted)",
            fontWeight: "700",
            fontSize: "1.1rem",
            cursor: "pointer",
            transition: "0.2s"
          }}
        >
          Today’s Plan
          {todayItineraries.length > 0 && (
            <span style={{ marginLeft: "8px", background: "var(--accent-blue)", color: "#fff", padding: "2px 8px", borderRadius: "20px", fontSize: "0.75rem" }}>
              {todayItineraries.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('upcoming')}
          style={{
            flex: 1,
            padding: "12px 0",
            background: "transparent",
            border: "none",
            borderBottom: activeTab === 'upcoming' ? "3px solid var(--accent-teal)" : "3px solid transparent",
            color: activeTab === 'upcoming' ? "var(--accent-teal)" : "var(--text-muted)",
            fontWeight: "700",
            fontSize: "1.1rem",
            cursor: "pointer",
            transition: "0.2s"
          }}
        >
          Upcoming
          {upcomingItineraries.length > 0 && (
            <span style={{ marginLeft: "8px", background: "var(--accent-teal)", color: "#000", padding: "2px 8px", borderRadius: "20px", fontSize: "0.75rem" }}>
              {upcomingItineraries.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'today' ? (
        <div>
          {todayItineraries.length === 0 ? (
            <div className="glass-card" style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
              No plan scheduled for today. Build one below!
            </div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
              {todayItineraries.map(it => (
                <div key={it.id} className="glass-card" style={{ flex: "1 1 300px", padding: "16px", minWidth: "280px" }}>
                  <div style={{ fontWeight: "700", fontSize: "1.1rem", marginBottom: "8px" }}>
                    {it.date_str} {it.time_str && `at ${it.time_str}`}
                  </div>
                  <ul style={{ margin: 0, paddingLeft: "20px", color: "#e2e8f0" }}>
                    {it.places.map((p, idx) => (
                      <li key={idx} style={{ marginBottom: "4px" }}>{p.name} ({p.category})</li>
                    ))}
                  </ul>
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
        </div>
      ) : (
        <div>
          {upcomingItineraries.length === 0 ? (
            <div className="glass-card" style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
              No upcoming plans yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
              {upcomingItineraries.map(it => (
                <div key={it.id} className="glass-card" style={{ flex: "1 1 300px", padding: "16px", minWidth: "280px" }}>
                  <div style={{ fontWeight: "700", fontSize: "1.1rem", marginBottom: "8px" }}>
                    {it.date_str} {it.time_str && `at ${it.time_str}`}
                  </div>
                  <ul style={{ margin: 0, paddingLeft: "20px", color: "#e2e8f0" }}>
                    {it.places.map((p, idx) => (
                      <li key={idx} style={{ marginBottom: "4px" }}>{p.name} ({p.category})</li>
                    ))}
                  </ul>
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
        </div>
      )}

      {/* Schedule Builder Section (unchanged from before) */}
      <div style={{ marginTop: "40px", display: "flex", flexWrap: "wrap", gap: "32px", alignItems: "flex-start" }}>
        {/* Left: Saved Places */}
        <div style={{ flex: "1 1 400px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <MapPin size={24} />
            <h2 className="font-heading" style={{ fontSize: "1.3rem", margin: 0 }}>Saved Places</h2>
          </div>
          {/* saved places list... (same as your original) */}
          {loading ? (
            <div className="skeleton" style={{ height: "200px" }}></div>
          ) : savedPlaces.length === 0 ? (
            <div className="glass-card" style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
              You haven't saved any places yet. Go to Destinations to add some!
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxHeight: "600px", overflowY: "auto", paddingRight: "8px" }}>
              {savedPlaces.map(p => (
                <div key={p.id} style={{ display: "flex", gap: "12px", padding: "8px 12px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)", alignItems: "center" }}>
                  {p.photoUrl ? (
                    <div style={{ width: "40px", height: "40px", borderRadius: "6px", overflow: "hidden", flexShrink: 0 }}>
                      <img src={p.photoUrl} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  ) : (
                    <div style={{ width: "40px", height: "40px", borderRadius: "6px", background: "var(--glass-border)", flexShrink: 0 }}></div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: "600", fontSize: "0.9rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--accent-teal)" }}>{p.category}</div>
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button onClick={() => addToSchedule(p)} disabled={schedule.some(s => s.id === p.id)} style={{ padding: "4px 8px", background: "rgba(56, 189, 248, 0.1)", color: "var(--accent-blue)", border: "1px solid var(--accent-blue)", borderRadius: "4px", cursor: "pointer", fontSize: "0.75rem", fontWeight: "600", display: "flex", alignItems: "center" }}>
                      {schedule.some(s => s.id === p.id) ? "Added" : <><Plus size={14} style={{ marginRight: "2px" }} /> Add</>}
                    </button>
                    <button onClick={() => removeSavedPlace(p.id)} style={{ padding: "4px", background: "transparent", border: "1px solid var(--danger)", color: "var(--danger)", borderRadius: "4px", cursor: "pointer", display: "flex", alignItems: "center" }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Schedule Builder */}
        <div style={{ flex: "1 1 500px" }}>
          <div className="glass-card" style={{ padding: "32px", border: "1px solid var(--accent-blue)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Calendar size={24} />
                <h2 className="font-heading" style={{ fontSize: "1.5rem", margin: 0 }}>Your Schedule</h2>
              </div>
            </div>

            {/* Date/Time Picker */}
            <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "8px" }}>Schedule Date</label>
                <input type="date" min={getLocalDateString()} value={dateStr} onChange={e => setDateStr(e.target.value)} className="input-field" style={{ width: "100%", marginBottom: 0 }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "8px" }}>Time (Optional)</label>
                <input type="time" value={timeStr} onChange={e => setTimeStr(e.target.value)} className="input-field" style={{ width: "100%", marginBottom: 0 }} />
              </div>
            </div>

            {validationResult && (
              <div style={{ padding: "20px", marginBottom: "24px", background: "rgba(15, 23, 42, 0.7)", borderRadius: "12px", borderLeft: "4px solid var(--accent-teal)" }}>
                <h3 style={{ margin: "0 0 8px 0", color: "var(--accent-teal)", fontSize: "1rem" }}>AI Feedback:</h3>
                <p style={{ color: "#e2e8f0", margin: 0, lineHeight: 1.5 }}>{validationResult}</p>
              </div>
            )}

            {schedule.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", border: "2px dashed var(--glass-border)", borderRadius: "12px", color: "var(--text-muted)" }}>
                Click "+ Add" on your saved places to build a schedule sequence.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px" }}>
                {schedule.map((p, index) => (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: "16px", padding: "16px", background: "rgba(255,255,255,0.03)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "var(--accent-blue)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700" }}>{index + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: "700" }}>{p.name}</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{p.category}</div>
                    </div>
                    <div style={{ display: "flex", gap: "4px" }}>
                      <button onClick={() => moveUp(index)} disabled={index === 0} style={{ padding: "4px 8px", background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "4px", color: "#fff", cursor: index === 0 ? "default" : "pointer", opacity: index === 0 ? 0.3 : 1 }}><ArrowUp size={16} /></button>
                      <button onClick={() => moveDown(index)} disabled={index === schedule.length - 1} style={{ padding: "4px 8px", background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "4px", color: "#fff", cursor: index === schedule.length - 1 ? "default" : "pointer", opacity: index === schedule.length - 1 ? 0.3 : 1 }}><ArrowDown size={16} /></button>
                      <button onClick={() => removeFromSchedule(p.id)} style={{ padding: "4px 8px", background: "rgba(239, 68, 68, 0.2)", border: "none", borderRadius: "4px", color: "var(--danger)", cursor: "pointer", marginLeft: "8px" }}><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!showValidation ? (
              <>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "12px", textAlign: "center" }}>
                  AI validation will check weather, date/time, and opening hours.
                </p>
                <div style={{ display: "flex", gap: "16px" }}>
                  <button onClick={() => handleInitiateValidation(false)} disabled={schedule.length === 0 || !dateStr || aiLoading} style={{ flex: 1, padding: "12px", background: "transparent", border: "1px solid var(--accent-blue)", color: "var(--accent-blue)", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}>
                    {aiLoading && pendingScheduleType === 'future' ? "Validating..." : "Confirm Schedule"}
                  </button>
                  <button onClick={() => handleInitiateValidation(true)} disabled={schedule.length === 0 || aiLoading} style={{ flex: 1, padding: "12px", background: "var(--accent-blue)", border: "none", color: "#fff", borderRadius: "8px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                    <Zap size={18} fill="#fff" /> {aiLoading && pendingScheduleType === 'today' ? "Validating..." : "Go Today!"}
                  </button>
                </div>
              </>
            ) : (
              <div style={{ marginTop: "16px", padding: "16px", background: "rgba(0,0,0,0.3)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                <p style={{ margin: "0 0 16px 0", color: "#e2e8f0", fontSize: "0.95rem" }}>There are issues with this plan. Do you still want to save it?</p>
                <div style={{ display: "flex", gap: "16px" }}>
                  <button onClick={() => setShowValidation(false)} style={{ flex: 1, padding: "12px", background: "transparent", border: "1px solid var(--accent-blue)", color: "var(--accent-blue)", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}>Cancel & Edit Plan</button>
                  <button onClick={handleFinalSave} style={{ flex: 1, padding: "12px", background: "var(--danger)", border: "none", color: "#fff", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}>Save Anyway</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};