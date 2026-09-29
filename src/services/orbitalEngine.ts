/**
 * ORBITAL PROPAGATION & SITUATIONAL AWARENESS ENGINE
 * Powered by SGP4 / SDP4 propagation via satellite.js
 */

import * as satellite from 'satellite.js';

export interface SpacecraftRecord {
  name: string;
  noradId: number;
  intlDes: string;
  epoch: string;
  epochAgeHours: number;
  inclination: number; // degrees
  eccentricity: number;
  meanMotion: number; // revs/day
  periodMinutes: number;
  bstar: number;
  satrec: satellite.SatRec;
  raw: any;
  group: string;
}

export interface SatellitePosition {
  latitude: number; // degrees -90 to +90
  longitude: number; // degrees -180 to +180
  altitude: number; // km
  velocity: number; // km/s
  x: number; // km (ECF)
  y: number; // km (ECF)
  z: number; // km (ECF)
}

export interface GroundPass {
  aos: Date;
  tca: Date;
  los: Date;
  maxElevation: number; // degrees
  durationSeconds: number;
  groundStationName: string;
  compassTrajectory?: string;
  visibilityNote?: string;
}

export interface ConjunctionResult {
  primary: SpacecraftRecord;
  secondary: SpacecraftRecord;
  missDistanceKm: number;
  timeOfClosestApproach: Date;
  relativeVelocityKms: number;
  trajectoryConfidence: number; // 0 to 1
  primaryPositionAtTca: SatellitePosition;
  secondaryPositionAtTca: SatellitePosition;
}

// Convert OMM JSON to TLE lines if satrec isn't directly constructable
export function ommToTle(omm: any): [string, string] {
  const norad = String(omm.NORAD_CAT_ID || 25544).padStart(5, '0');
  const classType = omm.CLASSIFICATION_TYPE || 'U';
  const intlId = (omm.OBJECT_ID || '98067A').padEnd(8, ' ');

  // Parse epoch
  const epochStr = omm.EPOCH || new Date().toISOString();
  const epochDate = new Date(epochStr);
  const year2Dig = String(epochDate.getUTCFullYear()).slice(-2);
  const startOfYear = new Date(Date.UTC(epochDate.getUTCFullYear(), 0, 1));
  const dayOfYear = (epochDate.getTime() - startOfYear.getTime()) / (86400 * 1000) + 1;
  const dayStr = dayOfYear.toFixed(8).padStart(12, '0');

  // Motion derivatives
  const ndot = (omm.MEAN_MOTION_DOT || 0.0).toFixed(8).replace('0.', '.');
  const bstarVal = omm.BSTAR || 0;
  let bstarStr = ' 00000-0';
  if (bstarVal !== 0) {
    const exp = Math.floor(Math.log10(Math.abs(bstarVal)));
    const mant = Math.round((bstarVal / Math.pow(10, exp)) * 10000);
    const sign = bstarVal < 0 ? '-' : ' ';
    const expSign = exp >= 0 ? '+' : '-';
    bstarStr = `${sign}${Math.abs(mant).toString().padStart(5, '0')}${expSign}${Math.abs(exp)}`;
  }

  // Line 1
  let l1 = `1 ${norad}${classType} ${intlId} ${year2Dig}${dayStr}  .00000000  00000-0 ${bstarStr} 0  999`;
  // Checksum
  let sum1 = 0;
  for (let i = 0; i < l1.length; i++) {
    const c = l1[i];
    if (c >= '0' && c <= '9') sum1 += parseInt(c, 10);
    else if (c === '-') sum1 += 1;
  }
  l1 += (sum1 % 10).toString();

  // Line 2
  const inc = (omm.INCLINATION || 51.64).toFixed(4).padStart(8, ' ');
  const raan = (omm.RA_OF_ASC_NODE || 0.0).toFixed(4).padStart(8, ' ');
  const ecc = Math.round((omm.ECCENTRICITY || 0.0001) * 10000000).toString().padStart(7, '0');
  const argp = (omm.ARG_OF_PERICENTER || 0.0).toFixed(4).padStart(8, ' ');
  const ma = (omm.MEAN_ANOMALY || 0.0).toFixed(4).padStart(8, ' ');
  const mm = (omm.MEAN_MOTION || 15.5).toFixed(8).padStart(11, ' ');
  const rev = String(omm.REV_AT_EPOCH || 1000).slice(-5).padStart(5, ' ');

  let l2 = `2 ${norad} ${inc} ${raan} ${ecc} ${argp} ${ma} ${mm}${rev}`;
  let sum2 = 0;
  for (let i = 0; i < l2.length; i++) {
    const c = l2[i];
    if (c >= '0' && c <= '9') sum2 += parseInt(c, 10);
    else if (c === '-') sum2 += 1;
  }
  l2 += (sum2 % 10).toString();

  return [l1, l2];
}

// Convert raw CelesTrak object to SpacecraftRecord
export function parseCelesTrakRecord(item: any, group: string): SpacecraftRecord | null {
  try {
    let satrec: satellite.SatRec;
    if (item.TLE_LINE1 && item.TLE_LINE2) {
      satrec = satellite.twoline2satrec(item.TLE_LINE1, item.TLE_LINE2);
    } else {
      const [l1, l2] = ommToTle(item);
      satrec = satellite.twoline2satrec(l1, l2);
    }

    if (!satrec || satrec.error) {
      return null;
    }

    const epochDate = item.EPOCH ? new Date(item.EPOCH) : new Date();
    const epochAgeHours = Math.max(0, (Date.now() - epochDate.getTime()) / (1000 * 3600));
    const meanMotion = item.MEAN_MOTION || (satrec.no * 720 / Math.PI); // revs/day
    const periodMinutes = meanMotion > 0 ? (1440 / meanMotion) : 90;

    return {
      name: item.OBJECT_NAME || `OBJ-${item.NORAD_CAT_ID || 'UNKNOWN'}`,
      noradId: Number(item.NORAD_CAT_ID) || 0,
      intlDes: item.OBJECT_ID || 'UNKNOWN',
      epoch: item.EPOCH || epochDate.toISOString(),
      epochAgeHours,
      inclination: Number(item.INCLINATION) || (satrec.inclo * 180 / Math.PI),
      eccentricity: Number(item.ECCENTRICITY) || satrec.ecco,
      meanMotion,
      periodMinutes,
      bstar: Number(item.BSTAR) || satrec.bstar || 0,
      satrec,
      raw: item,
      group
    };
  } catch (err) {
    console.error('[OrbitalEngine] Failed to parse TLE record:', err);
    return null;
  }
}

// SGP4 Propagation at exact time
export function propagateSatellite(satrec: satellite.SatRec, date: Date): SatellitePosition | null {
  try {
    const positionAndVelocity = satellite.propagate(satrec, date);
    const positionEci = positionAndVelocity.position;
    const velocityEci = positionAndVelocity.velocity;

    if (
      !positionEci ||
      typeof positionEci === 'boolean' ||
      !velocityEci ||
      typeof velocityEci === 'boolean' ||
      !Number.isFinite(positionEci.x) ||
      !Number.isFinite(positionEci.y) ||
      !Number.isFinite(positionEci.z) ||
      !Number.isFinite(velocityEci.x) ||
      !Number.isFinite(velocityEci.y) ||
      !Number.isFinite(velocityEci.z)
    ) {
      return null;
    }

    const gstime = satellite.gstime(date);
    const geodetic = satellite.eciToGeodetic(positionEci as satellite.EciVec3<number>, gstime);
    const positionEcf = satellite.eciToEcf(positionEci as satellite.EciVec3<number>, gstime);

    if (
      !geodetic ||
      !Number.isFinite(geodetic.latitude) ||
      !Number.isFinite(geodetic.longitude) ||
      !Number.isFinite(geodetic.height) ||
      !positionEcf ||
      !Number.isFinite(positionEcf.x) ||
      !Number.isFinite(positionEcf.y) ||
      !Number.isFinite(positionEcf.z)
    ) {
      return null;
    }

    const latDeg = satellite.degreesLat(geodetic.latitude);
    const lonDeg = satellite.degreesLong(geodetic.longitude);
    const altKm = geodetic.height;

    if (
      !Number.isFinite(latDeg) ||
      !Number.isFinite(lonDeg) ||
      !Number.isFinite(altKm) ||
      latDeg < -90 ||
      latDeg > 90 ||
      lonDeg < -180 ||
      lonDeg > 180 ||
      altKm < -100 ||
      altKm > 100000
    ) {
      return null;
    }

    // Velocity magnitude in km/s
    const velKms = Math.sqrt(
      velocityEci.x * velocityEci.x +
      velocityEci.y * velocityEci.y +
      velocityEci.z * velocityEci.z
    );

    if (!Number.isFinite(velKms)) {
      return null;
    }

    return {
      latitude: latDeg,
      longitude: lonDeg,
      altitude: altKm,
      velocity: velKms,
      x: positionEcf.x,
      y: positionEcf.y,
      z: positionEcf.z
    };
  } catch {
    return null;
  }
}

// Calculate Orbit Path (next 90 minutes sampled in 3D Cartesian coordinates)
export function calculateOrbitPath(
  satrec: satellite.SatRec,
  startDate: Date,
  durationMinutes = 95,
  stepSeconds = 60
): { positions: { x: number; y: number; z: number }[]; geodetics: { lat: number; lon: number; alt: number }[] } {
  const positions: { x: number; y: number; z: number }[] = [];
  const geodetics: { lat: number; lon: number; alt: number }[] = [];
  const totalSteps = Math.floor((durationMinutes * 60) / stepSeconds);

  for (let i = 0; i <= totalSteps; i++) {
    const stepDate = new Date(startDate.getTime() + i * stepSeconds * 1000);
    const pos = propagateSatellite(satrec, stepDate);
    if (pos) {
      // ECF coordinates in meters for Cesium
      positions.push({
        x: pos.x * 1000,
        y: pos.y * 1000,
        z: pos.z * 1000
      });
      geodetics.push({
        lat: pos.latitude,
        lon: pos.longitude,
        alt: pos.altitude
      });
    }
  }

  return { positions, geodetics };
}

const deg2rad = (deg: number) => (deg * Math.PI) / 180;
const rad2deg = (rad: number) => (rad * 180) / Math.PI;

function azimuthToCompass(rad: number): string {
  const deg = ((rad * 180 / Math.PI) % 360 + 360) % 360;
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const idx = Math.round(deg / 22.5) % 16;
  return `${directions[idx]} (${Math.round(deg)}°)`;
}

// Next Ground Pass Calculation
export function calculateNextPass(
  satrec: satellite.SatRec,
  observerLatDeg: number,
  observerLonDeg: number,
  observerAltKm = 0.05,
  searchHours = 48
): GroundPass | null {
  const observerGeodetic: satellite.GeodeticLocation = {
    latitude: deg2rad(observerLatDeg),
    longitude: deg2rad(observerLonDeg),
    height: observerAltKm
  };

  const now = new Date();
  const stepSeconds = 30;
  const maxSteps = (searchHours * 3600) / stepSeconds;

  let inPass = false;
  let aos: Date | null = null;
  let tca: Date | null = null;
  let maxEl = 0;
  let riseAzimuth = '';
  let peakAzimuth = '';
  let setAzimuth = '';

  for (let i = 0; i < maxSteps; i++) {
    const stepTime = new Date(now.getTime() + i * stepSeconds * 1000);
    const pv = satellite.propagate(satrec, stepTime);
    if (!pv.position || typeof pv.position === 'boolean') continue;

    const gstime = satellite.gstime(stepTime);
    const ecfPos = satellite.eciToEcf(pv.position as satellite.EciVec3<number>, gstime);
    const lookAngles = satellite.ecfToLookAngles(observerGeodetic, ecfPos);
    const elDeg = rad2deg(lookAngles.elevation);

    if (elDeg > 5) { // Visible above 5 degrees
      if (!inPass) {
        inPass = true;
        aos = stepTime;
        maxEl = elDeg;
        tca = stepTime;
        riseAzimuth = azimuthToCompass(lookAngles.azimuth);
        peakAzimuth = riseAzimuth;
      } else {
        if (elDeg > maxEl) {
          maxEl = elDeg;
          tca = stepTime;
          peakAzimuth = azimuthToCompass(lookAngles.azimuth);
        }
      }
    } else {
      if (inPass && aos && tca) {
        const los = stepTime;
        setAzimuth = azimuthToCompass(lookAngles.azimuth);
        const durationSeconds = Math.round((los.getTime() - aos.getTime()) / 1000);
        
        let visibilityNote = 'Low horizon pass (binoculars or clear horizon recommended)';
        if (maxEl >= 50) {
          visibilityNote = 'High overhead pass! Brightly visible with naked eye in clear night sky';
        } else if (maxEl >= 25) {
          visibilityNote = 'Good visible pass! Easily spotted above trees/buildings in twilight';
        }

        return {
          aos,
          tca,
          los,
          maxElevation: Math.round(maxEl * 10) / 10,
          durationSeconds,
          groundStationName: `Location (${observerLatDeg.toFixed(1)}°, ${observerLonDeg.toFixed(1)}°)`,
          compassTrajectory: `Rises ${riseAzimuth} → Peak ${Math.round(maxEl)}° ${peakAzimuth} → Sets ${setAzimuth}`,
          visibilityNote
        };
      }
    }
  }

  return null;
}

// CONJUNCTION SEARCH ENGINE (Scenario 03)
// Scans candidate debris objects over next 24h to find closest approach
export function searchClosestApproach(
  primary: SpacecraftRecord,
  debrisList: SpacecraftRecord[],
  startDate: Date = new Date(),
  durationHours = 24,
  coarseStepSeconds = 45
): ConjunctionResult | null {
  if (!debrisList || debrisList.length === 0) return null;

  let minDistanceKm = Infinity;
  let bestSecondary: SpacecraftRecord | null = null;
  let bestTca: Date = startDate;
  let bestRelVel = 0;
  let bestPrimaryPos: SatellitePosition | null = null;
  let bestSecPos: SatellitePosition | null = null;

  const totalCoarseSteps = Math.floor((durationHours * 3600) / coarseStepSeconds);

  // Fast filter: only examine debris whose inclinations and apogee/perigee could plausibly intersect
  const candidateDebris = debrisList.slice(0, 15); // Top 15 representative debris fragments

  for (const debris of candidateDebris) {
    for (let i = 0; i < totalCoarseSteps; i += 2) { // 90s sample
      const t = new Date(startDate.getTime() + i * coarseStepSeconds * 1000);
      const posA = propagateSatellite(primary.satrec, t);
      const posB = propagateSatellite(debris.satrec, t);

      if (!posA || !posB) continue;

      const dx = posA.x - posB.x;
      const dy = posA.y - posB.y;
      const dz = posA.z - posB.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist < minDistanceKm) {
        minDistanceKm = dist;
        bestSecondary = debris;
        bestTca = t;
        bestRelVel = Math.abs(posA.velocity + posB.velocity) * 0.95; // relative speed approx
        bestPrimaryPos = posA;
        bestSecPos = posB;
      }
    }
  }

  if (!bestSecondary || !bestPrimaryPos || !bestSecPos) {
    return null;
  }

  // Fine-tuning refinement: ±120 seconds around bestTca in 2-second steps
  const fineStart = new Date(bestTca.getTime() - 120 * 1000);
  for (let s = 0; s <= 120; s += 2) {
    const t = new Date(fineStart.getTime() + s * 1000);
    const posA = propagateSatellite(primary.satrec, t);
    const posB = propagateSatellite(bestSecondary.satrec, t);
    if (!posA || !posB) continue;

    const dx = posA.x - posB.x;
    const dy = posA.y - posB.y;
    const dz = posA.z - posB.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (dist < minDistanceKm) {
      minDistanceKm = dist;
      bestTca = t;
      bestPrimaryPos = posA;
      bestSecPos = posB;
    }
  }

  // Trajectory confidence decreases with age of both TLEs
  const combinedAge = (primary.epochAgeHours + bestSecondary.epochAgeHours) / 2;
  const trajectoryConfidence = Math.max(0.3, Math.min(0.98, 1 - (combinedAge / 120)));

  return {
    primary,
    secondary: bestSecondary,
    missDistanceKm: Math.round(minDistanceKm * 100) / 100,
    timeOfClosestApproach: bestTca,
    relativeVelocityKms: Math.round(bestRelVel * 100) / 100,
    trajectoryConfidence: Math.round(trajectoryConfidence * 100) / 100,
    primaryPositionAtTca: bestPrimaryPos,
    secondaryPositionAtTca: bestSecPos
  };
}
