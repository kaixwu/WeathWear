import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { Home, CloudRain, Map, Calendar, ShieldCheck, LogOut, User, BarChart3, Menu, X } from "lucide-react";

export default function Navbar() {
  const { username, role, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { name: "Home", path: "/home", icon: <Home size={18} /> },
    { name: "Weather", path: "/weather", icon: <CloudRain size={18} /> },
    { name: "Destinations", path: "/destinations", icon: <Map size={18} /> },
    { name: "Planner", path: "/planner", icon: <Calendar size={18} /> },
    { name: "My Trips", path: "/my-trips", icon: <BarChart3 size={18} /> },
  ];

  if (role === "admin") {
    navItems.push({ name: "Admin", path: "/admin", icon: <ShieldCheck size={18} /> });
  }

  const isHome = location.pathname === "/home";

  return (
    <nav style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "0 24px", height: "75px",
      background: "var(--glass-bg, rgba(7,14,28,0.85))",
      backdropFilter: "blur(12px)", borderBottom: "1px solid var(--glass-border)",
      marginBottom: isHome ? "0" : "24px",
      position: "sticky", top: 0, zIndex: 1000,
    }}>
      {/* Logo */}
      <Link to="/home" style={{ textDecoration: "none", flexShrink: 0 }}>
        <h1 className="font-heading" style={{ color: "var(--accent-blue)", fontSize: "1.5rem", margin: 0 }}>
          SunWise
        </h1>
      </Link>

      {/* Desktop Nav Links */}
      <div className="nav-desktop-links" style={{ display: "flex", gap: "4px" }}>
        {navItems.map(item => (
          <Link key={item.name} to={item.path} style={{
            textDecoration: "none",
            color: location.pathname === item.path ? "var(--accent-blue)" : "var(--text-muted)",
            fontWeight: location.pathname === item.path ? "700" : "500",
            padding: "8px 12px",
            borderRadius: "8px",
            background: location.pathname === item.path ? "rgba(56, 189, 248, 0.1)" : "transparent",
            transition: "all 0.2s",
            display: "flex", alignItems: "center", gap: "6px",
            fontSize: "0.88rem", whiteSpace: "nowrap",
          }}>
            {item.icon} {item.name}
          </Link>
        ))}
      </div>

      {/* Desktop Right: user + logout */}
      <div className="nav-desktop-right" style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
        <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
          <User size={15} /> {username}
        </span>
        <button onClick={logout} className="btn-chip" style={{ border: "1px solid var(--danger)", color: "var(--danger)", padding: "7px 14px", display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem" }}>
          <LogOut size={14} /> Log Out
        </button>
      </div>

      {/* Mobile Hamburger Button */}
      <button
        className="nav-hamburger"
        onClick={() => setMenuOpen(o => !o)}
        style={{
          display: "none",
          background: "transparent", border: "1px solid var(--glass-border)",
          color: "var(--text-main)", borderRadius: "8px",
          padding: "8px", cursor: "pointer", alignItems: "center", justifyContent: "center",
        }}
        aria-label="Toggle menu"
      >
        {menuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="nav-mobile-drawer" style={{
          position: "fixed", top: "75px", left: 0, right: 0, bottom: 0,
          background: "rgba(7, 14, 28, 0.97)", backdropFilter: "blur(20px)",
          zIndex: 999, display: "flex", flexDirection: "column",
          padding: "24px 20px", gap: "8px", overflowY: "auto",
          borderTop: "1px solid var(--glass-border)",
        }}>
          {navItems.map(item => (
            <Link
              key={item.name}
              to={item.path}
              onClick={() => setMenuOpen(false)}
              style={{
                textDecoration: "none",
                color: location.pathname === item.path ? "var(--accent-blue)" : "var(--text-main)",
                fontWeight: location.pathname === item.path ? "700" : "500",
                padding: "16px 18px",
                borderRadius: "12px",
                background: location.pathname === item.path ? "rgba(56, 189, 248, 0.1)" : "rgba(255,255,255,0.03)",
                border: "1px solid",
                borderColor: location.pathname === item.path ? "rgba(56,189,248,0.2)" : "rgba(255,255,255,0.06)",
                display: "flex", alignItems: "center", gap: "12px",
                fontSize: "1rem",
              }}
            >
              {item.icon} {item.name}
            </Link>
          ))}

          {/* Divider */}
          <div style={{ height: "1px", background: "var(--glass-border)", margin: "8px 0" }} />

          {/* User row + logout */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 4px" }}>
            <span style={{ color: "var(--text-muted)", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "8px" }}>
              <User size={16} /> {username}
            </span>
            <button
              onClick={() => { setMenuOpen(false); logout(); }}
              style={{
                background: "transparent", border: "1px solid var(--danger)", color: "var(--danger)",
                borderRadius: "8px", padding: "8px 16px", cursor: "pointer",
                display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", fontWeight: "600"
              }}
            >
              <LogOut size={14} /> Log Out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
