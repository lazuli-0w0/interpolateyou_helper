import React from 'react';

const WIDTH = 1600;
const HEIGHT = 1000;

function starfield(seed, count, radius, color) {
  let state = seed;
  const random = () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };

  const stars = Array.from({ length: count }, () => {
    const x = Math.round(random() * WIDTH * 10) / 10;
    const y = Math.round(random() * HEIGHT * 10) / 10;
    const size = (radius * (0.35 + random() * 0.65)).toFixed(2);
    const opacity = (0.18 + random() * 0.64).toFixed(2);
    return `<circle cx="${x}" cy="${y}" r="${size}" opacity="${opacity}"/>`;
  }).join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" preserveAspectRatio="xMidYMid slice"><g fill="${color}">${stars}</g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

const FAR_STARS = starfield(52714, 1700, 0.75, '#d9eee9');
const MID_STARS = starfield(83106, 900, 1.25, '#c8e2eb');
const NEAR_STARS = starfield(14037, 180, 2.1, '#eaf8f4');

export function NebulaBackground() {
  return <div className="landing-nebula" aria-hidden="true">
    <div className="landing-nebula-haze" />
    <div className="landing-nebula-stars landing-nebula-far" style={{ backgroundImage: FAR_STARS }} />
    <div className="landing-nebula-stars landing-nebula-mid" style={{ backgroundImage: MID_STARS }} />
    <div className="landing-nebula-stars landing-nebula-near" style={{ backgroundImage: NEAR_STARS }} />
  </div>;
}
