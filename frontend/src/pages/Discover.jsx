import { useState, useEffect } from "react";
import axios from "axios";
import { MapPin, Compass } from "lucide-react";
import { useData } from "../DataContext";

export default function Discover() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const { city } = useData();

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const url = city ? `/api/discover?location=${encodeURIComponent(city)}` : "/api/discover";
        const res = await axios.get(url);
        if (res.data.photos) {
          setPhotos(res.data.photos);
        }
      } catch (err) {
        console.error("Failed to fetch discover photos", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPhotos();
  }, [city]);

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 24px 60px" }}>
      {/* Header */}
      <div style={{ padding: "20px 0 40px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(45, 212, 191, 0.1)", padding: "6px 16px", borderRadius: "20px", color: "var(--accent-teal)", fontSize: "0.85rem", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "16px" }}>
          <Compass size={16} /> Travel Inspiration
        </div>
        <h1 className="font-heading" style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)", margin: "0 0 16px", letterSpacing: "0.02em" }}>
          Discover The <span className="text-gradient-blue">Philippines</span>
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "1.1rem", maxWidth: "600px", margin: "0 auto" }}>
          Explore breathtaking landscapes and hidden gems. Let these destinations inspire your next adventure.
        </p>
      </div>

      {loading ? (
        <div className="masonry-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="masonry-item skeleton" style={{ height: `${Math.floor(Math.random() * 200) + 200}px` }} />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <div className="glass-card" style={{ textAlign: "center", padding: "60px" }}>
          <p style={{ color: "var(--text-muted)" }}>Failed to load inspiration. Please try again later.</p>
        </div>
      ) : (
        <div className="masonry-grid">
          {photos.map((photo) => (
            <div key={photo.id} className="masonry-item">
              <img src={photo.url} alt={photo.title} className="masonry-img" loading="lazy" />
              <div className="masonry-overlay">
                <div>
                  <div className="masonry-title" style={{ fontSize: "1.4rem" }}>
                    {photo.title.length > 40 ? photo.title.substring(0, 40) + "..." : photo.title}
                  </div>
                  <div className="masonry-subtitle" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <MapPin size={12} /> Philippines
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
