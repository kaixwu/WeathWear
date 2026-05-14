import { useData } from "../DataContext";
import { BarChart3, MapPin, Route, Star, TrendingUp, Trophy, Map } from "lucide-react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const CATEGORY_COLORS = {
  Attraction:   "#38bdf8",
  Cafe:         "#2dd4bf",
  Restaurant:   "#f0b429",
  Museum:       "#a78bfa",
  Park:         "#4ade80",
  Shopping:     "#fb923c",
  Entertainment:"#f472b6",
  Heritage:     "#facc15",
};

export default function MyTrips() {
  const { allItineraries } = useData();

  // ── Aggregate all places from all itineraries ────────────────────────────
  const allPlaces = allItineraries.flatMap(it => it.places || []);
  const totalTrips = allItineraries.length;
  const totalPlaces = allPlaces.length;

  // Distance: sum of each place's distance field (km from origin)
  const totalDistance = allPlaces
    .reduce((sum, p) => sum + (p.distance || 0), 0)
    .toFixed(1);

  // Category frequency
  const categoryCount = {};
  allPlaces.forEach(p => {
    const cat = p.category || "Attraction";
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
  });

  const favoriteCategory = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

  // Top 5 most visited places
  const placeCount = {};
  allPlaces.forEach(p => {
    if (p.name) placeCount[p.name] = (placeCount[p.name] || 0) + 1;
  });
  const topPlaces = Object.entries(placeCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Donut chart data
  const catLabels = Object.keys(categoryCount);
  const catValues = Object.values(categoryCount);
  const donutData = {
    labels: catLabels,
    datasets: [{
      data: catValues,
      backgroundColor: catLabels.map(c => CATEGORY_COLORS[c] || "#38bdf8"),
      borderColor: "rgba(7,14,28,0.8)",
      borderWidth: 3,
      hoverOffset: 8,
    }],
  };
  const donutOptions = {
    cutout: "68%",
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(7,14,28,0.95)",
        titleColor: "#f0f4ff",
        bodyColor: "#7a90b8",
        borderColor: "rgba(56,189,248,0.2)",
        borderWidth: 1,
      },
    },
    animation: { animateRotate: true, duration: 800 },
  };

  // ── Empty State ──────────────────────────────────────────────────────────
  if (totalTrips === 0) {
    return (
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "60px 24px", textAlign: "center" }}>
        <div style={{
          width: 80, height: 80, borderRadius: "50%",
          background: "rgba(56,189,248,0.08)", border: "2px solid rgba(56,189,248,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 24px",
        }}>
          <Map size={36} color="var(--accent-blue)" />
        </div>
        <h2 className="font-heading" style={{ fontSize: "2rem", marginBottom: "12px" }}>No Trips Yet</h2>
        <p style={{ color: "var(--text-muted)", lineHeight: 1.7, maxWidth: 420, margin: "0 auto" }}>
          Head to <strong style={{ color: "var(--accent-teal)" }}>Destinations</strong> to discover places near you,
          then schedule them from the <strong style={{ color: "var(--accent-blue)" }}>Planner</strong> to start building your trip history!
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px 60px" }}>
      <div style={{ marginBottom: "32px" }}>
        <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "8px" }}>
          Your Travel Stats
        </div>
        <h2 className="font-heading" style={{ fontSize: "2.2rem", margin: 0 }}>My Trips</h2>
      </div>

      {/* ── Summary Cards ──────────────────────────────────────────────── */}
      <div className="my-trips-stats-grid" style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "16px",
        marginBottom: "32px",
      }}>
        {[
          { icon: <BarChart3 size={22} color="var(--accent-blue)" />, label: "Trips Planned", value: totalTrips, suffix: "" },
          { icon: <MapPin size={22} color="var(--accent-teal)" />, label: "Places Visited", value: totalPlaces, suffix: "" },
          { icon: <Route size={22} color="var(--accent-gold)" />, label: "Distance Explored", value: totalDistance, suffix: " km" },
          { icon: <Star size={22} color="#a78bfa" />, label: "Favorite Category", value: favoriteCategory, suffix: "", isText: true },
        ].map((stat, i) => (
          <div key={i} className="glass-card" style={{
            padding: "20px 22px",
            borderTop: "3px solid",
            borderTopColor: ["var(--accent-blue)", "var(--accent-teal)", "var(--accent-gold)", "#a78bfa"][i],
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              {stat.icon}
              <div style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                {stat.label}
              </div>
            </div>
            <div style={{
              fontFamily: stat.isText ? "var(--font-body)" : "var(--font-display)",
              fontSize: stat.isText ? "1.1rem" : "2.2rem",
              fontWeight: stat.isText ? 700 : 400,
              color: "var(--text-main)",
              letterSpacing: stat.isText ? "0" : "0.03em",
              lineHeight: 1,
            }}>
              {stat.value}{stat.suffix}
            </div>
          </div>
        ))}
      </div>

      {/* ── Donut + Leaderboard ─────────────────────────────────────────── */}
      <div className="my-trips-bottom-grid" style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "24px",
      }}>
        {/* Category Donut */}
        <div className="glass-card" style={{ padding: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
            <TrendingUp size={18} color="var(--accent-blue)" />
            <h3 className="font-heading" style={{ margin: 0, fontSize: "1.3rem" }}>Category Breakdown</h3>
          </div>
          <div style={{ display: "flex", gap: "28px", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ width: 180, height: 180, flexShrink: 0, margin: "0 auto" }}>
              <Doughnut data={donutData} options={donutOptions} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1, minWidth: 120 }}>
              {catLabels.map((cat, i) => (
                <div key={cat} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: CATEGORY_COLORS[cat] || "#38bdf8", flexShrink: 0 }} />
                  <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", flex: 1 }}>{cat}</span>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-main)" }}>{catValues[i]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Places Leaderboard */}
        <div className="glass-card" style={{ padding: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
            <Trophy size={18} color="var(--accent-gold)" />
            <h3 className="font-heading" style={{ margin: 0, fontSize: "1.3rem" }}>Most Visited Places</h3>
          </div>
          {topPlaces.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No data yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {topPlaces.map(([name, count], i) => (
                <div key={name} style={{
                  display: "flex", alignItems: "center", gap: "14px",
                  padding: "12px 14px", borderRadius: "12px",
                  background: i === 0 ? "rgba(240,180,41,0.07)" : "rgba(255,255,255,0.025)",
                  border: `1px solid ${i === 0 ? "rgba(240,180,41,0.2)" : "rgba(255,255,255,0.05)"}`,
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: i === 0
                      ? "linear-gradient(135deg, #f0b429, #fbbf24)"
                      : i === 1 ? "rgba(148,163,184,0.2)"
                      : i === 2 ? "rgba(180,120,60,0.2)"
                      : "rgba(255,255,255,0.06)",
                    fontFamily: "var(--font-display)",
                    fontSize: "0.85rem",
                    color: i === 0 ? "#07111f" : "var(--text-muted)",
                    fontWeight: 700,
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: 700, fontSize: "0.9rem",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      color: i === 0 ? "var(--accent-gold)" : "var(--text-main)",
                    }}>{name}</div>
                  </div>
                  <div style={{
                    fontSize: "0.78rem", fontWeight: 700,
                    color: "var(--text-muted)", flexShrink: 0,
                  }}>
                    {count}×
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
