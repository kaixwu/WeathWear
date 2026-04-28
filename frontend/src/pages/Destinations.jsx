import { useState } from "react";
import axios from "axios";
import { useData } from "../DataContext";
import { useAuth } from "../AuthContext";
import { MapPin, Clock, Star, Car, Compass, MessageSquare, Zap, CalendarCheck, X } from "lucide-react";

const getLocalDateString = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export default function Destinations() {
  const { token } = useAuth();
  const {
    places, placesLoading, locationError,
    envType, setEnvType, prefType, setPrefType, radius, setRadius,
    weather, refreshItineraries
  } = useData();

  const [openFilter, setOpenFilter] = useState("Any");
  const [showMore, setShowMore] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);

  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);
  const [directoryStores, setDirectoryStores] = useState([]);
  const [fetchingDirectory, setFetchingDirectory] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalPlace, setModalPlace] = useState(null);
  const [modalMode, setModalMode] = useState('today');
  const [modalDate, setModalDate] = useState("");
  const [modalTime, setModalTime] = useState("");

  const closeExpanded = () => {
    setSelectedPlace(null);
    setAiSummary(null);
    setDirectoryStores([]);
  };

  const openModal = (place, mode) => {
    setModalPlace(place);
    setModalMode(mode);
    setModalDate(mode === 'today' ? getLocalDateString() : "");
    setModalTime("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalPlace(null);
  };

  // Direct save – no validation
  const handleConfirmSchedule = async () => {
    if (!modalPlace) return;
    const finalDate = modalMode === 'today' ? getLocalDateString() : modalDate;
    if (!finalDate) {
      alert("Please select a date.");
      return;
    }

    try {
      await axios.post("/api/itineraries", {
        date_str: finalDate,
        time_str: modalTime,
        places: [modalPlace]
      });
      refreshItineraries();
      alert(`Plan confirmed for ${finalDate}!`);
      closeModal();
    } catch (err) {
      console.error(err);
      alert("Failed to save.");
    }
  };

  const generateReviewSummary = async (place) => {
    setAiSummaryLoading(true);
    setAiSummary(null);
    try {
      const reviewTexts = place.reviews ? place.reviews.map(r => typeof r === 'object' ? r.text : r) : [];
      const res = await axios.post("/api/place-summary", {
        name: place.name,
        reviews: reviewTexts
      });
      setAiSummary(res.data.summary);
    } catch (err) {
      console.error(err);
      setAiSummary("Failed to generate summary.");
    } finally {
      setAiSummaryLoading(false);
    }
  };

  const fetchDirectory = async (place) => {
    setFetchingDirectory(true);
    setDirectoryStores([]);
    try {
      const res = await axios.post("/api/directory", {
        lat: place.lat, lon: place.lon
      });
      setDirectoryStores(res.data.stores);
    } catch (err) {
      console.error(err);
    } finally {
      setFetchingDirectory(false);
    }
  };

  const filteredPlaces = places.filter(p => {
    if (openFilter === "Open" && p.isOpen !== true) return false;
    if (openFilter === "Closed" && p.isOpen !== false) return false;
    return true;
  });

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px 40px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
        <Compass size={32} color="var(--accent-blue)" />
        <h2 className="font-heading" style={{ margin: 0 }}>Top Destinations</h2>
      </div>

      {/* Filters */}
      <div className="glass-card" style={{ padding: "24px", marginBottom: "32px", display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "16px" }}>
          <span style={{ fontWeight: "600", width: "120px" }}>Environment:</span>
          {["Any", "Indoor", "Outdoor"].map(e => (
            <button key={e} className={`btn-chip ${envType === e ? "active" : ""}`} onClick={() => setEnvType(e)}>{e}</button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "16px" }}>
          <span style={{ fontWeight: "600", width: "120px" }}>Category:</span>
          {["Any", "Cafe", "Restaurant", "Museum", "Park", "Shopping", "Nature", "Entertainment", "Heritage"].map(p => (
            <button key={p} className={`btn-chip ${prefType === p ? "active" : ""}`} onClick={() => setPrefType(p)}>{p}</button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "16px" }}>
          <span style={{ fontWeight: "600", width: "120px" }}>Status:</span>
          {["Any", "Open", "Closed"].map(o => (
            <button key={o} className={`btn-chip ${openFilter === o ? "active" : ""}`} onClick={() => setOpenFilter(o)}>
              {o === "Open" ? "Open Now" : o === "Closed" ? "Closed" : o}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <span style={{ fontWeight: "600", width: "120px" }}>Search Radius:</span>
          <input type="range" min="5000" max="50000" step="5000" value={radius} onChange={e => setRadius(parseInt(e.target.value))} style={{ flex: 1, maxWidth: "300px" }} />
          <span style={{ fontWeight: "700", color: "var(--accent-blue)" }}>{radius / 1000} km</span>
        </div>
      </div>

      {placesLoading ? (
        <div className="skeleton" style={{ height: "400px" }}></div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {filteredPlaces.length === 0 ? (
            <div className="glass-card" style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)" }}>No places match your filters.</div>
          ) : (
            (showMore ? filteredPlaces : filteredPlaces.slice(0, 6)).map((p, i) => {
              const isSelected = selectedPlace?.name === p.name;
              return (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {/* Horizontal card */}
                  <div
                    className="glass-card"
                    style={{
                      display: "flex",
                      gap: "16px",
                      padding: "16px",
                      cursor: "pointer",
                      border: isSelected ? "2px solid var(--accent-blue)" : "1px solid var(--glass-border)",
                      transition: "all 0.2s"
                    }}
                    onClick={() => isSelected ? closeExpanded() : setSelectedPlace(p)}
                  >
                    {p.photoUrl ? (
                      <div style={{ width: "150px", height: "150px", borderRadius: "8px", overflow: "hidden", flexShrink: 0 }}>
                        <img src={p.photoUrl} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                    ) : (
                      <div style={{ width: "150px", height: "150px", borderRadius: "8px", background: "var(--glass-border)", flexShrink: 0 }}></div>
                    )}
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <span style={{ fontWeight: "700", fontSize: "1.15rem" }}>{p.name}</span>
                          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            {p.score && (
                              <span style={{ background: "rgba(45,212,191,0.1)", color: "var(--accent-teal)", padding: "4px 8px", borderRadius: "12px", fontWeight: "700", fontSize: "0.8rem", border: "1px solid rgba(45,212,191,0.3)" }}>
                                {p.score}% Match
                              </span>
                            )}
                            <span style={{ background: "rgba(0,0,0,0.3)", padding: "4px 8px", borderRadius: "12px", fontWeight: "700", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "4px" }}>
                              <Star size={14} color="#fbbf24" fill="#fbbf24" /> {p.rating ? p.rating.toFixed(1) : 'N/A'}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "12px", fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "8px", flexWrap: "wrap" }}>
                          <span>{p.category}</span>
                          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><MapPin size={14} /> {p.distance} km</span>
                          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Car size={14} /> ~{p.travelMins} min</span>
                          {p.isOpen ? <span style={{ color: "#4ade80" }}>Open</span> : <span style={{ color: "var(--danger)" }}>Closed</span>}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); openModal(p, 'today'); }}
                          style={{
                            flex: 1, padding: "8px 12px", background: "var(--accent-blue)", border: "none", borderRadius: "8px",
                            color: "#fff", fontWeight: "600", cursor: "pointer", fontSize: "0.85rem",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: "4px"
                          }}
                        >
                          <Zap size={16} fill="#fff" /> Go Today
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); openModal(p, 'schedule'); }}
                          style={{
                            flex: 1, padding: "8px 12px", background: "transparent", border: "1px solid var(--accent-blue)",
                            color: "var(--accent-blue)", borderRadius: "8px", fontWeight: "600", cursor: "pointer",
                            fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px"
                          }}
                        >
                          <CalendarCheck size={16} /> Schedule
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isSelected && (
                    <div className="glass-card" style={{ padding: "16px", marginTop: "0", display: "flex", flexDirection: "column", gap: "16px" }}>
                      {p.matchReasons && p.matchReasons.length > 0 && (
                        <div style={{ background: "rgba(45, 212, 191, 0.05)", border: "1px solid rgba(45, 212, 191, 0.2)", borderRadius: "12px", padding: "12px" }}>
                          <div style={{ fontWeight: "600", fontSize: "0.85rem", color: "var(--accent-teal)", marginBottom: "8px" }}>Why this place was recommended:</div>
                          <ul style={{ margin: 0, paddingLeft: "20px", color: "#e2e8f0", fontSize: "0.85rem" }}>
                            {p.matchReasons.map((reason, idx) => <li key={idx} style={{ marginBottom: "4px" }}>{reason}</li>)}
                          </ul>
                        </div>
                      )}
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {p.hoursDisplay && <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "flex", alignItems: "flex-start", gap: "8px" }}><Clock size={16} /> <span>{p.hoursDisplay}</span></div>}
                        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "flex", alignItems: "flex-start", gap: "8px" }}><MapPin size={16} /> <span>{p.address}</span></div>
                      </div>
                      {p.category === 'Shopping' && (
                        <div style={{ background: "rgba(56, 189, 248, 0.05)", border: "1px solid rgba(56, 189, 248, 0.2)", borderRadius: "12px", padding: "16px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: directoryStores.length > 0 ? "12px" : 0 }}>
                            <span style={{ fontWeight: "600", color: "var(--accent-blue)" }}>Mall Directory</span>
                            {directoryStores.length === 0 && (
                              <button onClick={(e) => { e.stopPropagation(); fetchDirectory(p); }} disabled={fetchingDirectory} style={{ padding: "6px 12px", background: "var(--accent-blue)", border: "none", borderRadius: "16px", color: "#fff", fontSize: "0.8rem", cursor: "pointer" }}>
                                {fetchingDirectory ? "Loading..." : "View Directory"}
                              </button>
                            )}
                          </div>
                          {directoryStores.length > 0 && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                              {directoryStores.map((store, idx) => (
                                <span key={idx} style={{ background: "rgba(255,255,255,0.05)", padding: "4px 8px", borderRadius: "4px", fontSize: "0.8rem", color: "#e2e8f0" }}>
                                  {store.name} <span style={{ color: "var(--text-muted)", fontSize: "0.7rem", marginLeft: "4px" }}>({store.type})</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      <div style={{ background: "rgba(15, 23, 42, 0.4)", padding: "16px", borderRadius: "12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                          <span style={{ fontWeight: "600", color: "#e2e8f0", display: "flex", alignItems: "center", gap: "6px" }}><MessageSquare size={16} /> AI Review Summary</span>
                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontStyle: "italic" }}>Google Reviews</span>
                        </div>
                        {aiSummary ? (
                          <p style={{ fontSize: "0.9rem", color: "var(--accent-teal)", fontStyle: "italic", margin: 0, lineHeight: 1.5 }}>"{aiSummary}"</p>
                        ) : (
                          <button onClick={(e) => { e.stopPropagation(); generateReviewSummary(p); }} disabled={aiSummaryLoading || !p.reviews || p.reviews.length === 0} style={{ padding: "8px 16px", background: "var(--accent-blue)", border: "none", borderRadius: "20px", color: "#fff", fontWeight: "600", cursor: "pointer", fontSize: "0.85rem", width: "100%" }}>
                            {aiSummaryLoading ? "Generating..." : p.reviews && p.reviews.length > 0 ? "Generate Summary" : "No reviews available"}
                          </button>
                        )}
                        {p.reviews && p.reviews.length > 0 && (
                          <div style={{ marginTop: "16px", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "12px" }}>
                            <div style={{ fontWeight: "600", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "8px" }}>Recent Reviews</div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "200px", overflowY: "auto", paddingRight: "8px" }}>
                              {p.reviews.map((rev, idx) => (
                                <div key={idx} style={{ background: "rgba(255,255,255,0.02)", padding: "12px", borderRadius: "8px" }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                                    <span style={{ fontWeight: "600", fontSize: "0.85rem", color: "#e2e8f0" }}>{typeof rev === 'object' ? rev.author : 'Anonymous'}</span>
                                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{typeof rev === 'object' ? rev.time : ''}</span>
                                  </div>
                                  <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
                                    {typeof rev === 'object' ? rev.text : rev}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {!placesLoading && filteredPlaces.length > 6 && (
        <div style={{ textAlign: "center", marginTop: "32px" }}>
          <button onClick={() => setShowMore(!showMore)} className="btn-chip">
            {showMore ? "Show Less" : `Show All Destinations`}
          </button>
        </div>
      )}

      {/* Scheduling Modal (No validation) */}
      {modalOpen && modalPlace && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", backdropFilter: "blur(5px)",
          display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000
        }}>
          <div className="glass-card" style={{ padding: "24px", maxWidth: "420px", width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0 }}>
                {modalMode === 'today' ? '⚡ Go Today' : '📅 Schedule'} – {modalPlace.name}
              </h3>
              <X size={20} style={{ cursor: "pointer" }} onClick={closeModal} />
            </div>

            {modalMode === 'schedule' && (
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "0.85rem", color: "var(--text-muted)" }}>Date</label>
                <input
                  type="date"
                  min={getLocalDateString()}
                  value={modalDate}
                  onChange={e => setModalDate(e.target.value)}
                  className="input-field"
                  style={{ width: "100%", marginBottom: 0 }}
                />
              </div>
            )}

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "4px", fontSize: "0.85rem", color: "var(--text-muted)" }}>Time (optional)</label>
              <input
                type="time"
                value={modalTime}
                onChange={e => setModalTime(e.target.value)}
                className="input-field"
                style={{ width: "100%", marginBottom: 0 }}
              />
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={closeModal}
                style={{ flex: 1, padding: "10px", background: "transparent", border: "1px solid var(--glass-border)", color: "#fff", borderRadius: "8px", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSchedule}
                disabled={modalMode === 'schedule' && !modalDate}
                style={{ flex: 1, padding: "10px", background: "var(--accent-blue)", border: "none", color: "#fff", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};