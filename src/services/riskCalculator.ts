/**
 * DETERMINISTIC RISK PRE-SCORE ENGINE (Client-Side Computation)
 * Computes numeric drag_risk_score (0-100) and maps to LOW / MODERATE / ELEVATED / HIGH.
 * Never computed by LLM. The LLM interprets and explains this calculated foundation.
 */

export type RiskLevel = 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH';

export interface ComputedRisk {
  score: number; // 0 - 100
  level: RiskLevel;
  subscores: {
    altitudeFactor: number; // 0 - 35
    geomagneticKpFactor: number; // 0 - 35
    cmeImpactFactor: number; // 0 - 15
    solarFlareFactor: number; // 0 - 15
    tleAgeFactor: number; // 0 - 10
    conjunctionBonus: number; // 0 - 40
  };
  summary: string;
}

export interface RiskInputParams {
  altitudeKm: number;
  kp: number;
  hasCmeWithin72h: boolean;
  recentFlareClass: string; // e.g. "X8.7", "M5.2", "C1.4"
  tleAgeHours: number;
  conjunctionMissKm?: number | null;
}

export function computeDeterministicRisk(params: RiskInputParams): ComputedRisk {
  const {
    altitudeKm,
    kp,
    hasCmeWithin72h,
    recentFlareClass,
    tleAgeHours,
    conjunctionMissKm
  } = params;

  // 1. Altitude Factor (0 - 35 points) - Lower altitude experiences exponentially higher atmospheric drag
  let altitudeFactor = 0;
  if (altitudeKm < 350) {
    altitudeFactor = 35; // Severe thermospheric drag regime
  } else if (altitudeKm < 450) {
    altitudeFactor = 28; // Standard LEO station/ISS regime
  } else if (altitudeKm < 550) {
    altitudeFactor = 20; // Starlink operational belt
  } else if (altitudeKm < 650) {
    altitudeFactor = 12; // Moderate upper LEO
  } else if (altitudeKm < 1000) {
    altitudeFactor = 5;  // Low drag regime
  } else {
    altitudeFactor = 1;  // MEO/GEO: negligible atmospheric drag
  }

  // 2. Geomagnetic Kp Factor (0 - 35 points) - High Kp surges upper thermosphere heating and density
  let geomagneticKpFactor = 0;
  if (kp >= 9.0) {
    geomagneticKpFactor = 35; // Extreme G5 storm (May 2024 class)
  } else if (kp >= 7.0) {
    geomagneticKpFactor = 28; // Severe/Strong G3-G4 storm
  } else if (kp >= 5.0) {
    geomagneticKpFactor = 20; // Moderate G1-G2 storm
  } else if (kp >= 4.0) {
    geomagneticKpFactor = 10; // Unsettled space weather
  } else if (kp >= 3.0) {
    geomagneticKpFactor = 5;  // Minor fluctuations
  } else {
    geomagneticKpFactor = 1;  // Quiet solar conditions
  }

  // 3. Earth-directed CME arrival within 72h (0 - 15 points)
  const cmeImpactFactor = hasCmeWithin72h ? 15 : 0;

  // 4. Solar Flare Class (0 - 15 points) - Sudden Ionospheric Disturbances (SID) & EUV heating
  let solarFlareFactor = 0;
  const flareUpper = (recentFlareClass || '').toUpperCase();
  if (flareUpper.startsWith('X')) {
    solarFlareFactor = 15; // Extreme solar flare
  } else if (flareUpper.startsWith('M')) {
    solarFlareFactor = 8;  // Moderate solar flare
  } else if (flareUpper.startsWith('C')) {
    solarFlareFactor = 2;  // Common background flare
  }

  // 5. TLE Epoch Age (0 - 10 points) - Ephemeris decay and positional uncertainty
  let tleAgeFactor = 0;
  if (tleAgeHours > 96) {
    tleAgeFactor = 10; // Severe drift uncertainty
  } else if (tleAgeHours > 48) {
    tleAgeFactor = 6;  // Degraded orbital prediction
  } else if (tleAgeHours > 24) {
    tleAgeFactor = 3;  // Mild aging
  } else {
    tleAgeFactor = 0;  // Fresh orbital elements (< 24h)
  }

  // 6. Conjunction Proximity Bonus (if applicable)
  let conjunctionBonus = 0;
  if (conjunctionMissKm !== undefined && conjunctionMissKm !== null) {
    if (conjunctionMissKm < 5.0) {
      conjunctionBonus = 40; // Critical collision threshold
    } else if (conjunctionMissKm < 20.0) {
      conjunctionBonus = 25; // Close screening envelope
    } else if (conjunctionMissKm < 50.0) {
      conjunctionBonus = 12; // Monitored approach
    }
  }

  // Calculate composite raw score
  let rawScore = altitudeFactor + geomagneticKpFactor + cmeImpactFactor + solarFlareFactor + tleAgeFactor + conjunctionBonus;
  const score = Math.max(0, Math.min(100, Math.round(rawScore)));

  // Map to risk levels
  let level: RiskLevel;
  if (score >= 75) {
    level = 'HIGH';
  } else if (score >= 50) {
    level = 'ELEVATED';
  } else if (score >= 25) {
    level = 'MODERATE';
  } else {
    level = 'LOW';
  }

  // Deterministic summary text
  let summary = '';
  if (level === 'HIGH') {
    summary = 'Severe atmospheric drag expansion and high ephemeris degradation risk detected.';
  } else if (level === 'ELEVATED') {
    summary = 'Elevated thermospheric perturbations require active tracking and maneuver watch.';
  } else if (level === 'MODERATE') {
    summary = 'Mild orbital decay variations detected within manageable operational margins.';
  } else {
    summary = 'Nominal space environment with quiescent orbital propagation.';
  }

  return {
    score,
    level,
    subscores: {
      altitudeFactor,
      geomagneticKpFactor,
      cmeImpactFactor,
      solarFlareFactor,
      tleAgeFactor,
      conjunctionBonus
    },
    summary
  };
}
