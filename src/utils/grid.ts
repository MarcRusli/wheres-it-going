/* import type { BalloonTrackPoint } from "../types/balloon";

export type BBox = { minLat: number, maxLat: number, minLon: number, maxLon: number, lonWidthDeg: number }

// Utilities
function normalizeLon(lon: number) {
  // Normalize to [-180, 180)
  return ((lon + 180) % 360 + 360) % 360 - 180;
}

function lonTo360(lon: number) {
  // Convert [-180,180) -> [0,360)
  return ((lon % 360) + 360) % 360;
}

// Compute minimal longitudinal span and bounding box that respects wrapping
function computeWrappedBBox(path: BalloonTrackPoint[]) {
  if (!path || path.length === 0) return null;
  let minLat =  Infinity, maxLat = -Infinity;
  const lons360 = [];

  for (const p of path) {
    const lat = p.lat;
    const lon = p.lng;
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    lons360.push(lonTo360(lon));
  }

  // Compute minimal arc on circle [0,360)
  lons360.sort((a,b)=>a-b);
  // find largest gap between consecutive sorted points (including wrap)
  let maxGap = -1, maxGapIdx = -1;
  for (let i=0;i<lons360.length;i++){
    const a = lons360[i];
    const b = lons360[(i+1) % lons360.length];
    // gap (account for wrap)
    const gap = ((b - a + 360) % 360);
    if (gap > maxGap) { maxGap = gap; maxGapIdx = i; }
  }
  // minimal covering arc is complement of largest gap
  const arcStart = lons360[(maxGapIdx+1) % lons360.length];
  const arcEnd = lons360[maxGapIdx]; // note arc goes from arcStart -> arcEnd across 0
  // compute width
  const width = (arcEnd - arcStart + 360) % 360;
  // convert arcStart..arcEnd to [-180,180) representation for bbox
  const minLon360 = arcStart; // in [0,360)
  const maxLon360 = (arcStart + width) % 360;

  // convert back to [-180,180)
  const minLon = normalizeLon(minLon360 <= 180 ? minLon360 : minLon360 - 360);
  const maxLon = normalizeLon(maxLon360 <= 180 ? maxLon360 : maxLon360 - 360);

  return { minLat, maxLat, minLon, maxLon, lonWidthDeg: width };
}

// Simple equirectangular grid generator that handles wrap-around for lon
function generateEquirectGrid(box: BBox, n=5, padFraction=0.1) {
  let { minLat, maxLat, minLon, maxLon, lonWidthDeg } = box;
  // pad
  const dLat = maxLat - minLat || 0.01;
  // const dLon = (lonWidthDeg || ((maxLon - minLon + 360) % 360)) || 0.01;
  minLat -= dLat * padFraction;
  maxLat += dLat * padFraction;

  // For longitudes we will generate using the minLon360 and step across the width
  const minLon360 = lonTo360(minLon);
  const width360 = lonWidthDeg || ((lonTo360(maxLon) - minLon360 + 360) % 360);

  const grid = [];
  for (let i=0;i<n;i++){
    const tLat = i / (n - 1);
    const lat = minLat + tLat * (maxLat - minLat);
    for (let j=0;j<n;j++){
      const tLon = j / (n - 1);
      const lon360 = (minLon360 + tLon * width360) % 360;
      const lng = normalizeLon(lon360 <= 180 ? lon360 : lon360 - 360);
      grid.push({ lat, lng });
    }
  }
  return grid;
}

// Azimuthal equidistant projection around a center (useful near poles)
function latLonToAzimuthal(lat: number, lon: number, centerLat: number, centerLon: number) {
  // returns x (meters), y (meters)
  // use spherical Earth approximation
  const R = 6371000;
  const φ = lat * Math.PI/180;
  const λ = lon * Math.PI/180;
  const φ0 = centerLat * Math.PI/180;
  const λ0 = centerLon * Math.PI/180;

  const cosc = Math.sin(φ0)*Math.sin(φ) + Math.cos(φ0)*Math.cos(φ)*Math.cos(λ - λ0);
  const c = Math.acos(Math.max(-1, Math.min(1, cosc)));
  if (Math.abs(c) < 1e-10) return { x: 0, y: 0 };
  const k = c / Math.sin(c);
  const x = R * k * Math.cos(φ) * Math.sin(λ - λ0);
  const y = R * k * (Math.cos(φ0)*Math.sin(φ) - Math.sin(φ0)*Math.cos(φ)*Math.cos(λ - λ0));
  return { x, y };
}
function azimuthalToLatLon(x: number, y: number, centerLat: number, centerLon: number) {
  const R = 6371000;
  const φ0 = centerLat * Math.PI/180;
  const λ0 = centerLon * Math.PI/180;
  const ρ = Math.sqrt(x*x + y*y);
  const c = ρ / R;
  if (ρ < 1e-10) return { lat: centerLat, lng: centerLon };
  const sinφ0 = Math.sin(φ0), cosφ0 = Math.cos(φ0);
  const φ = Math.asin(cosφ0 * Math.sin(c) * (y/ρ) + sinφ0 * Math.cos(c));
  const λ = λ0 + Math.atan2(x * Math.sin(c), ρ * cosφ0 * Math.cos(c) - y * Math.sin(c) * sinφ0);
  return { lat: φ * 180/Math.PI, lng: normalizeLon(λ * 180/Math.PI) };
}

// Polar-aware grid generator: project to azimuthal eq centered at pole (or path mean) then grid equally in x/y then inverse project
function generatePolarAwareGrid(path: BalloonTrackPoint[], n=5, padFactor=1.2) {
  // choose center: if path in north polar region use north pole, else south pole or path centroid
  const avgLat = path.reduce((s,p)=>s+p.lat,0)/path.length;
  const useNorth = avgLat > 60; // threshold heuristic
  const centerLat = useNorth ? 90 : -90;
  const centerLon = 0; // arbitrary for pole center

  // project path to x/y
  const ptsXY = path.map(p => latLonToAzimuthal(p.lat, p.lng, centerLat, centerLon));
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const pt of ptsXY) {
    minX = Math.min(minX, pt.x);
    maxX = Math.max(maxX, pt.x);
    minY = Math.min(minY, pt.y);
    maxY = Math.max(maxY, pt.y);
  }
  const dx = maxX - minX || 1;
  const dy = maxY - minY || 1;
  // pad
  minX -= dx * 0.5 * (padFactor - 1);
  maxX += dx * 0.5 * (padFactor - 1);
  minY -= dy * 0.5 * (padFactor - 1);
  maxY += dy * 0.5 * (padFactor - 1);

  const grid = [];
  for (let i=0;i<n;i++){
    const ty = i/(n-1);
    const y = minY + ty*(maxY-minY);
    for (let j=0;j<n;j++){
      const tx = j/(n-1);
      const x = minX + tx*(maxX-minX);
      const ll = azimuthalToLatLon(x,y,centerLat,centerLon);
      grid.push(ll);
    }
  }
  return grid;
}

// main: choose strategy based on bbox and lat extremes
export function generateGridFromPath(path: BalloonTrackPoint[], n=5) {
  const bbox = computeWrappedBBox(path);
  if (!bbox) {
    return [];
  }
  // if path reaches near the pole, use polar-aware grid
  const nearNorthPole = bbox.maxLat >= 85;
  const nearSouthPole = bbox.minLat <= -85;
  if (nearNorthPole || nearSouthPole) {
    // use polar-aware projection
    return generatePolarAwareGrid(path, n);
  } else {
    // use equirectangular grid with correct wrap handling
    return generateEquirectGrid(bbox, n);
  }
} */

/* import type { BalloonTrackPoint } from "../types/balloon";

export type BBox = {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
  lonWidthDeg: number;
};

// Utilities
function normalizeLon(lon: number) {
  // Normalize to [-180, 180)
  return ((((lon + 180) % 360) + 360) % 360) - 180;
}

function lonTo360(lon: number) {
  // Convert [-180,180) -> [0,360)
  return ((lon % 360) + 360) % 360;
}

// Compute minimal longitudinal span and bounding box that respects wrapping
function computeWrappedBBox(path: BalloonTrackPoint[]) {
  if (!path || path.length === 0) return null;
  let minLat = Infinity,
    maxLat = -Infinity;
  const lons360 = [];

  for (const p of path) {
    const lat = p.lat;
    const lon = p.lng;
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    lons360.push(lonTo360(lon));
  }

  // Compute minimal arc on circle [0,360)
  lons360.sort((a, b) => a - b);
  // find largest gap between consecutive sorted points (including wrap)
  let maxGap = -1,
    maxGapIdx = -1;
  for (let i = 0; i < lons360.length; i++) {
    const a = lons360[i];
    const b = lons360[(i + 1) % lons360.length];
    // gap (account for wrap)
    const gap = (b - a + 360) % 360;
    if (gap > maxGap) {
      maxGap = gap;
      maxGapIdx = i;
    }
  }
  // minimal covering arc is complement of largest gap
  const arcStart = lons360[(maxGapIdx + 1) % lons360.length];
  const arcEnd = lons360[maxGapIdx]; // note arc goes from arcStart -> arcEnd across 0
  // compute width
  const width = (arcEnd - arcStart + 360) % 360;
  // convert arcStart..arcEnd to [-180,180) representation for bbox
  const minLon360 = arcStart; // in [0,360)
  const maxLon360 = (arcStart + width) % 360;

  // convert back to [-180,180)
  const minLon = normalizeLon(minLon360 <= 180 ? minLon360 : minLon360 - 360);
  const maxLon = normalizeLon(maxLon360 <= 180 ? maxLon360 : maxLon360 - 360);

  return { minLat, maxLat, minLon, maxLon, lonWidthDeg: width };
}

// Simple equirectangular grid generator that handles wrap-around for lon
function generateEquirectGrid(box: BBox, n = 5, padFraction = 0.1) {
  let { minLat, maxLat } = box;
  const { minLon, maxLon, lonWidthDeg } = box;

  // Calculate latitude range
  const latRange = maxLat - minLat;
  // If min range 

  // pad
  const dLat = latRange || 0.01;
  // const dLon = (lonWidthDeg || ((maxLon - minLon + 360) % 360)) || 0.01;
  minLat -= dLat * padFraction;
  maxLat += dLat * padFraction;

  // For longitudes we will generate using the minLon360 and step across the width
  const minLon360 = lonTo360(minLon);
  const width360 = lonWidthDeg || (lonTo360(maxLon) - minLon360 + 360) % 360;

  const grid = [];
  for (let i = 0; i < n; i++) {
    const tLat = i / (n - 1);
    const lat = minLat + tLat * (latRange);
    for (let j = 0; j < n; j++) {
      const tLon = j / (n - 1);
      const lon360 = (minLon360 + tLon * width360) % 360;
      const lng = normalizeLon(lon360 <= 180 ? lon360 : lon360 - 360);
      grid.push({ lat, lng });
    }
  }
  return grid;
}

// Azimuthal equidistant projection around a center (useful near poles)
function latLonToAzimuthal(
  lat: number,
  lon: number,
  centerLat: number,
  centerLon: number
) {
  // returns x (meters), y (meters)
  // use spherical Earth approximation
  const R = 6371000;
  const φ = (lat * Math.PI) / 180;
  const λ = (lon * Math.PI) / 180;
  const φ0 = (centerLat * Math.PI) / 180;
  const λ0 = (centerLon * Math.PI) / 180;

  const cosc =
    Math.sin(φ0) * Math.sin(φ) + Math.cos(φ0) * Math.cos(φ) * Math.cos(λ - λ0);
  const c = Math.acos(Math.max(-1, Math.min(1, cosc)));
  if (Math.abs(c) < 1e-10) return { x: 0, y: 0 };
  const k = c / Math.sin(c);
  const x = R * k * Math.cos(φ) * Math.sin(λ - λ0);
  const y =
    R *
    k *
    (Math.cos(φ0) * Math.sin(φ) -
      Math.sin(φ0) * Math.cos(φ) * Math.cos(λ - λ0));
  return { x, y };
}
function azimuthalToLatLon(
  x: number,
  y: number,
  centerLat: number,
  centerLon: number
) {
  const R = 6371000;
  const φ0 = (centerLat * Math.PI) / 180;
  const λ0 = (centerLon * Math.PI) / 180;
  const ρ = Math.sqrt(x * x + y * y);
  const c = ρ / R;
  if (ρ < 1e-10) return { lat: centerLat, lng: centerLon };
  const sinφ0 = Math.sin(φ0),
    cosφ0 = Math.cos(φ0);
  const φ = Math.asin(cosφ0 * Math.sin(c) * (y / ρ) + sinφ0 * Math.cos(c));
  const λ =
    λ0 +
    Math.atan2(
      x * Math.sin(c),
      ρ * cosφ0 * Math.cos(c) - y * Math.sin(c) * sinφ0
    );
  return { lat: (φ * 180) / Math.PI, lng: normalizeLon((λ * 180) / Math.PI) };
}

// Polar-aware grid generator: project to azimuthal eq centered at pole (or path mean) then grid equally in x/y then inverse project
function generatePolarAwareGrid(
  path: BalloonTrackPoint[],
  n = 5,
  padFactor = 1.2
) {
  // choose center: if path in north polar region use north pole, else south pole or path centroid
  const avgLat = path.reduce((s, p) => s + p.lat, 0) / path.length;
  const useNorth = avgLat > 60; // threshold heuristic
  const centerLat = useNorth ? 90 : -90;
  const centerLon = 0; // arbitrary for pole center

  // project path to x/y
  const ptsXY = path.map((p) =>
    latLonToAzimuthal(p.lat, p.lng, centerLat, centerLon)
  );
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (const pt of ptsXY) {
    minX = Math.min(minX, pt.x);
    maxX = Math.max(maxX, pt.x);
    minY = Math.min(minY, pt.y);
    maxY = Math.max(maxY, pt.y);
  }
  const dx = maxX - minX || 1;
  const dy = maxY - minY || 1;
  // pad
  minX -= dx * 0.5 * (padFactor - 1);
  maxX += dx * 0.5 * (padFactor - 1);
  minY -= dy * 0.5 * (padFactor - 1);
  maxY += dy * 0.5 * (padFactor - 1);

  const grid = [];
  for (let i = 0; i < n; i++) {
    const ty = i / (n - 1);
    const y = minY + ty * (maxY - minY);
    for (let j = 0; j < n; j++) {
      const tx = j / (n - 1);
      const x = minX + tx * (maxX - minX);
      const ll = azimuthalToLatLon(x, y, centerLat, centerLon);
      grid.push(ll);
    }
  }
  return grid;
}

// main: choose strategy based on bbox and lat extremes
export function generateGridFromPath(path: BalloonTrackPoint[], n = 5) {
  const bbox = computeWrappedBBox(path);
  if (!bbox) {
    return [];
  }
  // if path reaches near the pole, use polar-aware grid
  const nearNorthPole = bbox.maxLat >= 85;
  const nearSouthPole = bbox.minLat <= -85;
  if (nearNorthPole || nearSouthPole) {
    // use polar-aware projection
    return generatePolarAwareGrid(path, n);
  } else {
    // use equirectangular grid with correct wrap handling
    return generateEquirectGrid(bbox, n);
  }
} */

import type { BalloonTrackPoint } from "../types/balloon";

export type BBox = {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
  lonWidthDeg: number;
};

// Utilities
function normalizeLon(lon: number) {
  // Normalize to [-180, 180)
  return ((((lon + 180) % 360) + 360) % 360) - 180;
}

function lonTo360(lon: number) {
  // Convert [-180,180) -> [0,360)
  return ((lon % 360) + 360) % 360;
}

// Compute minimal longitudinal span and bounding box that respects wrapping
function computeWrappedBBox(path: BalloonTrackPoint[]) {
  if (!path || path.length === 0) return null;
  let minLat = Infinity,
    maxLat = -Infinity;
  const lons360 = [];

  for (const p of path) {
    const lat = p.lat;
    const lon = p.lng;
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    lons360.push(lonTo360(lon));
  }

  // Compute minimal arc on circle [0,360)
  lons360.sort((a, b) => a - b);
  // find largest gap between consecutive sorted points (including wrap)
  let maxGap = -1,
    maxGapIdx = -1;
  for (let i = 0; i < lons360.length; i++) {
    const a = lons360[i];
    const b = lons360[(i + 1) % lons360.length];
    // gap (account for wrap)
    const gap = (b - a + 360) % 360;
    if (gap > maxGap) {
      maxGap = gap;
      maxGapIdx = i;
    }
  }
  // minimal covering arc is complement of largest gap
  const arcStart = lons360[(maxGapIdx + 1) % lons360.length];
  const arcEnd = lons360[maxGapIdx]; // note arc goes from arcStart -> arcEnd across 0
  // compute width
  const width = (arcEnd - arcStart + 360) % 360;
  // convert arcStart..arcEnd to [-180,180) representation for bbox
  const minLon360 = arcStart; // in [0,360)
  const maxLon360 = (arcStart + width) % 360;

  // convert back to [-180,180)
  const minLon = normalizeLon(minLon360 <= 180 ? minLon360 : minLon360 - 360);
  const maxLon = normalizeLon(maxLon360 <= 180 ? maxLon360 : maxLon360 - 360);

  return { minLat, maxLat, minLon, maxLon, lonWidthDeg: width };
}

// Simple equirectangular grid generator that handles wrap-around for lon
function generateEquirectGrid(
  box: BBox,
  n = 5,
  padFraction = 0.1,
  minSpanDeg = 0.01
) {
  let { minLat, maxLat } = box;
  const { minLon, maxLon, lonWidthDeg } = box;
  // pad latitude
  const dLat = Math.max(maxLat - minLat, minSpanDeg);
  minLat -= dLat * padFraction;
  maxLat += dLat * padFraction;

  // pad longitude
  const dLon = Math.max(
    lonWidthDeg || (lonTo360(maxLon) - lonTo360(minLon) + 360) % 360,
    minSpanDeg
  );

  // For longitudes we will generate using the minLon360 and step across the width
  const minLon360 = lonTo360(minLon) - dLon * padFraction;
  const width360 = dLon * (1 + 2 * padFraction);

  const grid = [];
  for (let i = 0; i < n; i++) {
    const tLat = i / (n - 1);
    const lat = minLat + tLat * Math.max(maxLat - minLat, minSpanDeg);
    for (let j = 0; j < n; j++) {
      const tLon = j / (n - 1);
      const lon360 = (minLon360 + tLon * width360) % 360;
      const lng = normalizeLon(lon360 <= 180 ? lon360 : lon360 - 360);
      grid.push({ lat, lng });
    }
  }
  return grid;
}

// Azimuthal equidistant projection around a center (useful near poles)
function latLonToAzimuthal(
  lat: number,
  lon: number,
  centerLat: number,
  centerLon: number
) {
  // returns x (meters), y (meters)
  // use spherical Earth approximation
  const R = 6371000;
  const φ = (lat * Math.PI) / 180;
  const λ = (lon * Math.PI) / 180;
  const φ0 = (centerLat * Math.PI) / 180;
  const λ0 = (centerLon * Math.PI) / 180;

  const cosc =
    Math.sin(φ0) * Math.sin(φ) + Math.cos(φ0) * Math.cos(φ) * Math.cos(λ - λ0);
  const c = Math.acos(Math.max(-1, Math.min(1, cosc)));
  if (Math.abs(c) < 1e-10) return { x: 0, y: 0 };
  const k = c / Math.sin(c);
  const x = R * k * Math.cos(φ) * Math.sin(λ - λ0);
  const y =
    R *
    k *
    (Math.cos(φ0) * Math.sin(φ) -
      Math.sin(φ0) * Math.cos(φ) * Math.cos(λ - λ0));
  return { x, y };
}
function azimuthalToLatLon(
  x: number,
  y: number,
  centerLat: number,
  centerLon: number
) {
  const R = 6371000;
  const φ0 = (centerLat * Math.PI) / 180;
  const λ0 = (centerLon * Math.PI) / 180;
  const ρ = Math.sqrt(x * x + y * y);
  const c = ρ / R;
  if (ρ < 1e-10) return { lat: centerLat, lng: centerLon };
  const sinφ0 = Math.sin(φ0),
    cosφ0 = Math.cos(φ0);
  const φ = Math.asin(cosφ0 * Math.sin(c) * (y / ρ) + sinφ0 * Math.cos(c));
  const λ =
    λ0 +
    Math.atan2(
      x * Math.sin(c),
      ρ * cosφ0 * Math.cos(c) - y * Math.sin(c) * sinφ0
    );
  return { lat: (φ * 180) / Math.PI, lng: normalizeLon((λ * 180) / Math.PI) };
}

// Polar-aware grid generator: project to azimuthal eq centered at pole (or path mean) then grid equally in x/y then inverse project
function generatePolarAwareGrid(
  path: BalloonTrackPoint[],
  n = 5,
  padFactor = 1.2,
  minSpanMeters = 1000
) {
  // choose center: if path in north polar region use north pole, else south pole or path centroid
  const avgLat = path.reduce((s, p) => s + p.lat, 0) / path.length;
  const useNorth = avgLat > 60; // threshold heuristic
  const centerLat = useNorth ? 90 : -90;
  const centerLon = 0; // arbitrary for pole center

  // project path to x/y
  const ptsXY = path.map((p) =>
    latLonToAzimuthal(p.lat, p.lng, centerLat, centerLon)
  );
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (const pt of ptsXY) {
    minX = Math.min(minX, pt.x);
    maxX = Math.max(maxX, pt.x);
    minY = Math.min(minY, pt.y);
    maxY = Math.max(maxY, pt.y);
  }
  const dx = Math.max(maxX - minX, minSpanMeters);
  const dy = Math.max(maxY - minY, minSpanMeters);
  // pad
  minX -= dx * 0.5 * (padFactor - 1);
  maxX += dx * 0.5 * (padFactor - 1);
  minY -= dy * 0.5 * (padFactor - 1);
  maxY += dy * 0.5 * (padFactor - 1);

  const grid = [];
  for (let i = 0; i < n; i++) {
    const ty = i / (n - 1);
    const y = minY + ty * Math.max(maxY - minY, minSpanMeters);
    for (let j = 0; j < n; j++) {
      const tx = j / (n - 1);
      const x = minX + tx * Math.max(maxX - minX, minSpanMeters);
      const ll = azimuthalToLatLon(x, y, centerLat, centerLon);
      grid.push(ll);
    }
  }
  return grid;
}

// main: choose strategy based on bbox and lat extremes
export function generateGridFromPath(
  path: BalloonTrackPoint[],
  n = 5,
  minSpanDeg = 0.01
) {
  const bbox = computeWrappedBBox(path);
  if (!bbox) {
    return [];
  }
  // if path reaches near the pole, use polar-aware grid
  const nearNorthPole = bbox.maxLat >= 85;
  const nearSouthPole = bbox.minLat <= -85;
  if (nearNorthPole || nearSouthPole) {
    // Convert minSpanDeg to meters (approximate: 111km per degree)
    const minSpanMeters = minSpanDeg * 111000;
    // use polar-aware projection
    return generatePolarAwareGrid(path, n, 1.2, minSpanMeters);
  } else {
    // use equirectangular grid with correct wrap handling
    return generateEquirectGrid(bbox, n, 0.1, minSpanDeg);
  }
}
