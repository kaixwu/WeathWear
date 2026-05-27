import React, { useMemo } from 'react';
import { useData } from '../DataContext';
import './WeatherEffects.css';

export default function WeatherEffects({ activeWeather }) {
  const { weather: contextWeather } = useData();
  const weather = activeWeather || contextWeather;

  // Extract the main weather condition. Default to "Clear" if not available.
  const condition = weather?.weather?.[0]?.main?.toLowerCase() || "";

  // Generate randomized particles so they look natural
  const particles = useMemo(() => {
    return Array.from({ length: 45 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}vw`,
      top: `${Math.random() * -20}vh`,
      animationDuration: `${Math.random() * 1.2 + 0.6}s`,
      animationDelay: `${Math.random() * 2}s`,
      opacity: Math.random() * 0.4 + 0.4,
      size: `${Math.random() * 3 + 2}px`,
    }));
  }, [condition]);

  // Determine atmospheric video assets
  let videoSrc = "";
  let overlayClass = "";
  
  if (condition.includes("rain") || condition.includes("drizzle") || condition.includes("thunderstorm")) {
    videoSrc = "https://assets.mixkit.co/videos/preview/mixkit-rain-drops-falling-on-a-window-surface-42938-large.mp4";
    overlayClass = "overlay-rain";
  } else if (condition.includes("snow")) {
    videoSrc = "https://assets.mixkit.co/videos/preview/mixkit-snow-falling-slowly-in-front-of-a-forest-43555-large.mp4";
    overlayClass = "overlay-snow";
  } else if (condition.includes("cloud") || condition.includes("mist") || condition.includes("fog")) {
    videoSrc = "https://assets.mixkit.co/videos/preview/mixkit-slow-movement-of-thick-white-clouds-42406-large.mp4";
    overlayClass = "overlay-cloud";
  } else {
    // Clear/Sunny
    videoSrc = "https://assets.mixkit.co/videos/preview/mixkit-sunbeams-shining-through-white-clouds-42409-large.mp4";
    overlayClass = "overlay-clear";
  }

  return (
    <div className={`weather-effects-container ${overlayClass}`}>
      {/* 1. Cinematic Atmospheric Loop Video */}
      {videoSrc && (
        <video
          key={videoSrc}
          autoPlay
          loop
          muted
          playsInline
          className="weather-bg-video"
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      )}

      {/* 2. Glassmorphic Mesh Overlay */}
      <div className="weather-mesh-overlay" />

      {/* 3. Layered 3D CSS Particle Elements */}
      {/* Rain Drops */}
      {(condition.includes("rain") || condition.includes("drizzle") || condition.includes("thunderstorm")) && (
        <div className="particles-layer">
          {particles.map(p => (
            <div
              key={p.id}
              className="rain-drop"
              style={{
                left: p.left,
                animationDuration: p.animationDuration,
                animationDelay: p.animationDelay
              }}
            />
          ))}
        </div>
      )}

      {/* Snowflakes */}
      {condition.includes("snow") && (
        <div className="particles-layer">
          {particles.map(p => (
            <div
              key={p.id}
              className="snow-flake"
              style={{
                left: p.left,
                width: p.size,
                height: p.size,
                animationDuration: `${parseFloat(p.animationDuration) + 2.5}s`,
                animationDelay: p.animationDelay
              }}
            />
          ))}
        </div>
      )}

      {/* Sunny Shimmer Rays */}
      {!condition.includes("rain") && !condition.includes("drizzle") && !condition.includes("thunderstorm") && !condition.includes("snow") && !condition.includes("cloud") && !condition.includes("mist") && !condition.includes("fog") && (
        <div className="sun-rays-container">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
            <div
              key={i}
              className="sun-ray"
              style={{
                transform: `rotate(${deg}deg)`,
                animationDuration: '180s'
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
