import React, { useMemo } from 'react';
import { useData } from '../DataContext';
import './WeatherEffects.css';

export default function WeatherEffects() {
  const { weather } = useData();

  // Extract the main weather condition. Default to "Clear" if not available.
  const condition = weather?.weather?.[0]?.main?.toLowerCase() || "";

  // Generate randomized particles so they look natural
  const particles = useMemo(() => {
    return Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}vw`,
      top: `${Math.random() * -20}vh`,
      animationDuration: `${Math.random() * 1.5 + 0.8}s`,
      animationDelay: `${Math.random() * 2}s`,
      opacity: Math.random() * 0.5 + 0.3,
      size: `${Math.random() * 4 + 2}px`,
    }));
  }, [condition]);

  if (condition.includes("rain") || condition.includes("drizzle") || condition.includes("thunderstorm")) {
    return (
      <div className="weather-effects-container">
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
    );
  }

  if (condition.includes("snow")) {
    return (
      <div className="weather-effects-container">
        {particles.map(p => (
          <div
            key={p.id}
            className="snow-flake"
            style={{
              left: p.left,
              width: p.size,
              height: p.size,
              animationDuration: `${parseFloat(p.animationDuration) + 2}s`,
              animationDelay: p.animationDelay
            }}
          />
        ))}
      </div>
    );
  }

  if (condition.includes("cloud") || condition.includes("mist") || condition.includes("fog")) {
    // Generate fewer, larger clouds
    const clouds = particles.slice(0, 5);
    return (
      <div className="weather-effects-container">
        {clouds.map((p, i) => (
          <div
            key={p.id}
            className="cloud-orb"
            style={{
              top: `${Math.random() * 60}vh`,
              width: `${Math.random() * 300 + 200}px`,
              height: `${Math.random() * 150 + 100}px`,
              animationDuration: `${Math.random() * 40 + 60}s`,
              animationDelay: `-${Math.random() * 50}s`
            }}
          />
        ))}
      </div>
    );
  }

  // Default to Clear/Sunny
  const rays = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <div className="weather-effects-container">
      <div className="sun-rays-container">
        {rays.map((deg, i) => (
          <div
            key={i}
            className="sun-ray"
            style={{
              transform: `rotate(${deg}deg)`,
              animationDuration: '60s'
            }}
          />
        ))}
      </div>
    </div>
  );
}
