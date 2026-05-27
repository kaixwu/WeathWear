import { useState, useRef } from "react";
import axios from "axios";
import { useAuth } from "../AuthContext";
import { useData } from "../DataContext";
import { CalendarCheck, Zap, Trash2, ListTodo, Sparkles, Send, MapPin, Clock, Car, Download, Star, MessageSquare, CheckCircle, X } from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

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
  const exportRef = useRef(null);

  // Place Detail Modal (same as Destinations page)
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailPlace, setDetailPlace] = useState(null);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);

  const openDetail = (place) => {
    setDetailPlace(place);
    setAiSummary(null);
    setDetailOpen(true);
  };
  const closeDetail = () => {
    setDetailOpen(false);
    setDetailPlace(null);
    setAiSummary(null);
  };
  const generateReviewSummary = async (place) => {
    setAiSummaryLoading(true);
    setAiSummary(null);
    try {
      const reviewTexts = place.reviews
        ? place.reviews.map(r => typeof r === 'object' ? r.text : r)
        : [];
      const res = await axios.post("/api/place-summary", { name: place.name, reviews: reviewTexts });
      setAiSummary(res.data.summary);
    } catch (err) {
      setAiSummary("Failed to generate summary.");
    } finally {
      setAiSummaryLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!exportRef.current) return;
    try {
      const canvas = await html2canvas(exportRef.current, { scale: 2, backgroundColor: '#071428' });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`SunWise_Itinerary_${getLocalDateString()}.pdf`);
    } catch (err) {
      console.error(err);
      alert("Failed to export PDF.");
    }
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

      {/* ------ Segmented Tabs ------ */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "40px" }}>
        <div className="segmented-control glass-card" style={{ width: "100%", maxWidth: "480px", padding: "8px", display: "flex", gap: "8px", border: "1px solid var(--glass-border)" }}>
          <button
            onClick={() => setActiveTab("today")}
            className={`segmented-btn ${activeTab === "today" ? "active" : ""}`}
          >
            Today
            {todayItins.length > 0 && (
              <span style={{ background: activeTab === "today" ? "var(--accent-teal)" : "rgba(255,255,255,0.1)", color: activeTab === "today" ? "#000" : "#fff", padding: "2px 8px", borderRadius: "20px", fontSize: "0.75rem", marginLeft: "6px" }}>
                {todayItins.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`segmented-btn ${activeTab === "upcoming" ? "active" : ""}`}
          >
            Upcoming
            {upcomingItins.length > 0 && (
              <span style={{ background: activeTab === "upcoming" ? "var(--accent-teal)" : "rgba(255,255,255,0.1)", color: activeTab === "upcoming" ? "#000" : "#fff", padding: "2px 8px", borderRadius: "20px", fontSize: "0.75rem", marginLeft: "6px" }}>
                {upcomingItins.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ------ Today’s Plan Section ------ */}
      {activeTab === "today" && (
        <div>
          {/* AI Generate Button */}
          {todayItins.length > 0 && (
            <>
              <div style={{ marginBottom: "20px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
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

                <button
                  onClick={handleExportPDF}
                  style={{
                    padding: "12px 24px", background: "rgba(56,189,248,0.1)", border: "1px solid var(--accent-blue)",
                    borderRadius: "12px", color: "var(--accent-blue)", fontWeight: "700",
                    fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px",
                  }}
                >
                  <Download size={20} /> Export to PDF
                </button>
              </div>

              {genLoading && <div className="skeleton" style={{ height: "80px", marginTop: "24px" }} />}

              {generatedPlan && (
                <div className="glass-card" style={{ marginTop: "24px", padding: "28px" }}>
                  <h4 style={{ margin: "0 0 16px", color: "var(--accent-teal)" }}>✨ AI‑optimized Route</h4>
                  <p style={{ color: "#e2e8f0", fontSize: "0.9rem", marginBottom: "12px" }}>
                    {generatedPlan.explanation}
                    {generatedPlan.best_start_time && <> Suggested start: <strong>{generatedPlan.best_start_time}</strong></>}
                  </p>

                  {/* Schedule display */}
                  {generatedPlan.schedule && generatedPlan.schedule.length > 0 ? (
                    <div className="timeline-container" style={{ marginBottom: "16px" }}>
                      {generatedPlan.schedule.map((item, idx) => (
                        <div key={idx} className="timeline-item">
                          <div className="timeline-dot" />
                          <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                            <div style={{ fontWeight: "700", width: "100px", flexShrink: 0, color: "var(--accent-teal)" }}>
                              {item.arrival_time}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: "700", fontSize: "1.05rem" }}>{item.place}</div>
                              {item.activity_suggestion && <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>{item.activity_suggestion}</div>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="timeline-container" style={{ marginBottom: "16px" }}>
                      {generatedPlan.stops?.map((stop, idx) => (
                        <div key={idx} className="timeline-item">
                          <div className="timeline-dot" />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: "700", fontSize: "1.05rem" }}>{stop.name}</div>
                            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>{stop.category} · {stop.distance} km · {stop.travelMins} min</div>
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
            </>
          )}

          {todayItins.length === 0 && !generatedPlan ? (
            <div className="glass-card" style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
              No plan scheduled for today. Use Destinations or ask AI below!
            </div>
          ) : (
            <div ref={exportRef} className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "32px", marginTop: "32px" }}>
              <h2 style={{ color: "var(--accent-blue)", margin: "0 0 8px", fontFamily: "var(--font-heading)" }}>
                SunWise Itinerary - {getLocalDateString()}
              </h2>
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
            </div>
          )}

          {/* Static AI Input removed in favor of global Chatbot */}
        </div>
      )}

      {/* ── Place Detail Modal (same as Destinations page) ─────────────── */}
      {detailOpen && detailPlace && (
        <div className="modal-backdrop" onClick={closeDetail}>
          <div className="modal-panel" onClick={e => e.stopPropagation()}>
            {/* Hero */}
            <div className="modal-hero">
              {detailPlace.photoUrl ? (
                <img className="modal-hero-img" src={detailPlace.photoUrl} alt={detailPlace.name} />
              ) : (
                <div style={{ width:'100%',height:'100%',background:'linear-gradient(135deg,#0d2240,#071428)',display:'flex',alignItems:'center',justifyContent:'center' }}>
                  <MapPin size={48} color="var(--text-muted)" />
                </div>
              )}
              <div className="modal-hero-gradient" />
              <div className="modal-hero-info">
                <div style={{ display:'flex', gap:'8px', marginBottom:'10px', flexWrap:'wrap' }}>
                  {detailPlace.isOpen === true  && <span className="dest-card-badge dest-card-badge-open">Open Now</span>}
                  {detailPlace.isOpen === false && <span className="dest-card-badge dest-card-badge-closed">Closed</span>}
                  <span style={{ padding:'5px 10px',borderRadius:'20px',fontSize:'0.72rem',fontWeight:700,background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.15)',color:'#fff' }}>
                    {detailPlace.category}
                  </span>
                </div>
                <h2 className="font-heading" style={{ fontSize:'clamp(1.6rem,4vw,2.2rem)',margin:'0 0 8px',lineHeight:1.1 }}>
                  {detailPlace.name}
                </h2>
                <div style={{ display:'flex',gap:'16px',fontSize:'0.82rem',color:'rgba(255,255,255,0.6)',flexWrap:'wrap' }}>
                  {detailPlace.rating && (
                    <span style={{ display:'flex',alignItems:'center',gap:'4px',color:'var(--accent-gold)' }}>
                      <Star size={13} fill="currentColor" /> {detailPlace.rating.toFixed(1)}
                    </span>
                  )}
                  {detailPlace.distance > 0 && (
                    <span style={{ display:'flex',alignItems:'center',gap:'4px' }}>
                      <MapPin size={13} /> {detailPlace.distance} km
                    </span>
                  )}
                  {detailPlace.travelMins > 0 && (
                    <span style={{ display:'flex',alignItems:'center',gap:'4px' }}>
                      <Car size={13} /> ~{detailPlace.travelMins} min
                    </span>
                  )}
                </div>
              </div>
              <button className="modal-close-btn" onClick={closeDetail}>×</button>
            </div>

            {/* Body */}
            <div className="modal-body">
              {/* Details */}
              <div className="modal-section">
                <div className="modal-section-title">Details</div>
                <div style={{ display:'flex',flexDirection:'column',gap:'10px' }}>
                  {detailPlace.address && (
                    <div style={{ display:'flex',gap:'10px',fontSize:'0.88rem',color:'var(--text-muted)',alignItems:'flex-start' }}>
                      <MapPin size={15} style={{ flexShrink:0,marginTop:'2px' }} />
                      <span>{detailPlace.address}</span>
                    </div>
                  )}
                  {detailPlace.hoursDisplay && (
                    <div style={{ display:'flex',gap:'10px',fontSize:'0.88rem',color:'var(--text-muted)',alignItems:'flex-start' }}>
                      <Clock size={15} style={{ flexShrink:0,marginTop:'2px' }} />
                      <span>{detailPlace.hoursDisplay}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* AI Review Summary */}
              <div className="modal-section">
                <div className="modal-section-title">
                  <MessageSquare size={12} /> AI Review Summary
                </div>
                {aiSummary ? (
                  <p style={{ fontSize:'0.9rem',color:'var(--accent-teal)',fontStyle:'italic',lineHeight:1.65,margin:0 }}>
                    "{aiSummary}"
                  </p>
                ) : (
                  <button
                    onClick={() => generateReviewSummary(detailPlace)}
                    disabled={aiSummaryLoading || !detailPlace.reviews || detailPlace.reviews.length === 0}
                    style={{
                      padding:'9px 20px',background:'linear-gradient(135deg,rgba(56,189,248,0.15),rgba(45,212,191,0.15))',
                      border:'1px solid rgba(56,189,248,0.25)',borderRadius:'20px',
                      color:'var(--accent-blue)',cursor:'pointer',fontSize:'0.82rem',fontWeight:700,width:'100%'
                    }}
                  >
                    {aiSummaryLoading ? 'Generating…'
                      : detailPlace.reviews && detailPlace.reviews.length > 0
                        ? '✨ Generate AI Summary'
                        : 'No reviews available'}
                  </button>
                )}
              </div>

              {/* Reviews */}
              {detailPlace.reviews && detailPlace.reviews.length > 0 && (
                <div className="modal-section">
                  <div className="modal-section-title">Recent Reviews</div>
                  <div style={{ display:'flex',flexDirection:'column',gap:'10px',maxHeight:'240px',overflowY:'auto',paddingRight:'4px' }}>
                    {detailPlace.reviews.map((rev, idx) => (
                      <div key={idx} className="review-card">
                        <div style={{ display:'flex',justifyContent:'space-between',marginBottom:'6px' }}>
                          <span style={{ fontWeight:700,fontSize:'0.82rem',color:'#e2e8f0' }}>
                            {typeof rev === 'object' ? rev.author : 'Anonymous'}
                          </span>
                          <span style={{ fontSize:'0.72rem',color:'var(--text-muted)' }}>
                            {typeof rev === 'object' ? rev.time : ''}
                          </span>
                        </div>
                        <p style={{ margin:0,fontSize:'0.84rem',color:'var(--text-muted)',lineHeight:1.55 }}>
                          {typeof rev === 'object' ? rev.text : rev}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
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
                  <div style={{ fontWeight: "700", fontSize: "1.2rem", marginBottom: "16px", color: "var(--accent-blue)" }}>
                    {it.date_str} {it.time_str && `| ${it.time_str}`}
                  </div>
                  {it.schedule ? (
                    <div className="timeline-container">
                      {it.schedule.map((item, idx) => (
                        <div key={idx} className="timeline-item">
                          <div className="timeline-dot" />
                          <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                            <div style={{ fontWeight: "700", width: "80px", flexShrink: 0, color: "var(--accent-teal)", fontSize: "0.9rem" }}>
                              {item.arrival_time}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: "700", fontSize: "1rem" }}>{item.place}</div>
                              {item.activity_suggestion && <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>{item.activity_suggestion}</div>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="timeline-container">
                      {it.places.map((p, idx) => (
                        <div key={idx} className="timeline-item">
                          <div className="timeline-dot" />
                          <div style={{ fontWeight: "700", fontSize: "1rem" }}>{p.name}</div>
                          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{p.category}</div>
                        </div>
                      ))}
                    </div>
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