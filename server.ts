import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import {
  FALLBACK_TLE_GROUPS,
  FALLBACK_SWPC,
  FALLBACK_EONET,
  FALLBACK_NEO,
  FALLBACK_LAUNCHES,
  FALLBACK_SPACEX,
  MAY_2024_STORM_DONKI,
  NOMINAL_DONKI
} from './server/snapshots.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// GEMINI CONFIGURATION
const GEMINI_MODEL = 'gemini-3.8-flash';
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// IN-MEMORY CACHE
interface CacheEntry {
  data: any;
  cachedAt: number;
  ttlMs: number;
}

const cache = new Map<string, CacheEntry>();

function getFromCache(key: string, ignoreExpiry = false) {
  const entry = cache.get(key);
  if (!entry) return null;
  const isExpired = Date.now() - entry.cachedAt > entry.ttlMs;
  if (isExpired && !ignoreExpiry) return null;
  return entry;
}

function setInCache(key: string, data: any, ttlSeconds: number) {
  cache.set(key, {
    data,
    cachedAt: Date.now(),
    ttlMs: ttlSeconds * 1000
  });
}

// HELPER FETCH WITH TIMEOUT
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 8000): Promise<any> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return res;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

// 1. TLE ROUTE
app.get('/api/tle', async (req: Request, res: Response) => {
  const group = (req.query.group as string) || 'stations';
  const cacheKey = `tle_${group}`;

  const cached = getFromCache(cacheKey);
  if (cached) {
    return res.json({
      data: cached.data,
      _source: 'CACHED',
      _cachedAt: cached.cachedAt,
      _group: group
    });
  }

  try {
    const url = `https://celestrak.org/NORAD/elements/gp.php?GROUP=${encodeURIComponent(group)}&FORMAT=json`;
    const response = await fetchWithTimeout(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    }, 7000);

    if (!response.ok) {
      throw new Error(`CelesTrak responded with status ${response.status}`);
    }

    let data = await response.json();
    if (Array.isArray(data)) {
      if (group === 'starlink') {
        data = data.slice(0, 300);
      } else if (group === 'active') {
        data = data.slice(0, 500);
      }
    }

    setInCache(cacheKey, data, 7200); // 2 hours
    return res.json({
      data,
      _source: 'LIVE',
      _cachedAt: Date.now(),
      _group: group
    });
  } catch {
    // Check stale cache
    const stale = getFromCache(cacheKey, true);
    if (stale) {
      return res.json({
        data: stale.data,
        _source: 'CACHED',
        _cachedAt: stale.cachedAt,
        _stale: true,
        _group: group
      });
    }

    // Upstream unavailable/restricted (e.g. 403 on cloud IP) - serve & cache bundled orbital snapshot
    const fallback = FALLBACK_TLE_GROUPS[group] || FALLBACK_TLE_GROUPS.stations;
    setInCache(cacheKey, fallback, 3600); // Cache for 1 hour

    return res.json({
      data: fallback,
      _source: 'SNAPSHOT',
      _group: group,
      _note: 'Using bundled orbital snapshot'
    });
  }
});

// 2. NASA DONKI ROUTE
app.get('/api/donki', async (req: Request, res: Response) => {
  const type = (req.query.type as string) || 'FLR';
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  const start = (req.query.start as string) || formatDate(thirtyDaysAgo);
  const end = (req.query.end as string) || formatDate(now);
  const apiKey = process.env.NASA_API_KEY || 'DEMO_KEY';

  const cacheKey = `donki_${type}_${start}_${end}`;
  const cached = getFromCache(cacheKey);
  if (cached) {
    return res.json({
      data: cached.data,
      _source: 'CACHED',
      _cachedAt: cached.cachedAt,
      _type: type
    });
  }

  // Check if historical solar storm is requested (May 2024 event)
  if (start.startsWith('2024-05') || end.startsWith('2024-05')) {
    const historicalData = (MAY_2024_STORM_DONKI as any)[type];
    if (historicalData) {
      setInCache(cacheKey, historicalData, 3600);
      return res.json({
        data: historicalData,
        _source: 'HISTORICAL_EVENT',
        _cachedAt: Date.now(),
        _type: type
      });
    }
  }

  try {
    const url = `https://api.nasa.gov/DONKI/${encodeURIComponent(type)}?startDate=${encodeURIComponent(start)}&endDate=${encodeURIComponent(end)}&api_key=${apiKey}`;
    const response = await fetchWithTimeout(url, {
      headers: { 'Accept': 'application/json' }
    }, 14000);

    if (!response.ok) {
      throw new Error(`NASA DONKI responded with ${response.status}`);
    }

    const data = await response.json();
    
    // If the API returns an empty array (e.g., asking for future dates in simulated time)
    // we should use the bundled fallback data to ensure the UI has something to show.
    if (Array.isArray(data) && data.length === 0) {
      throw new Error('NASA API returned empty data for the requested timeframe');
    }

    setInCache(cacheKey, data, 900); // 15 minutes
    return res.json({
      data,
      _source: 'LIVE',
      _cachedAt: Date.now(),
      _type: type
    });
  } catch (err: any) {
    const stale = getFromCache(cacheKey, true);
    if (stale) {
      return res.json({
        data: stale.data,
        _source: 'CACHED',
        _cachedAt: stale.cachedAt,
        _stale: true,
        _type: type
      });
    }

    const fallback = start.startsWith('2024-05')
      ? (MAY_2024_STORM_DONKI as any)[type] || []
      : (NOMINAL_DONKI as any)[type] || (MAY_2024_STORM_DONKI as any)[type] || [];

    return res.json({
      data: fallback,
      _source: 'SNAPSHOT',
      _type: type,
      _note: 'Using bundled solar weather snapshot'
    });
  }
});

// 3. NASA EONET ROUTE
app.get('/api/eonet', async (req: Request, res: Response) => {
  const days = req.query.days || '20';
  const status = req.query.status || 'open';
  const cacheKey = `eonet_${days}_${status}`;

  const cached = getFromCache(cacheKey);
  if (cached) {
    return res.json({
      data: cached.data,
      _source: 'CACHED',
      _cachedAt: cached.cachedAt
    });
  }

  try {
    const url = `https://eonet.gsfc.nasa.gov/api/v3/events/geojson?days=${days}&status=${status}`;
    const response = await fetchWithTimeout(url, {}, 8000);
    if (!response.ok) throw new Error(`EONET responded with ${response.status}`);

    const data = await response.json();
    setInCache(cacheKey, data, 900); // 15 mins
    return res.json({
      data,
      _source: 'LIVE',
      _cachedAt: Date.now()
    });
  } catch (err: any) {
    console.warn(`[EONET Proxy] Error: ${err?.message}`);
    const stale = getFromCache(cacheKey, true);
    if (stale) {
      return res.json({
        data: stale.data,
        _source: 'CACHED',
        _cachedAt: stale.cachedAt,
        _stale: true
      });
    }
    return res.json({
      data: FALLBACK_EONET,
      _source: 'SNAPSHOT',
      _note: 'Using bundled Earth observatory events'
    });
  }
});

// 4. NASA NEO ROUTE (NeoWs)
app.get('/api/neo', async (req: Request, res: Response) => {
  const today = new Date().toISOString().split('T')[0];
  const start = (req.query.start as string) || today;
  const end = (req.query.end as string) || today;
  const apiKey = process.env.NASA_API_KEY || 'DEMO_KEY';
  const cacheKey = `neo_${start}_${end}`;

  const cached = getFromCache(cacheKey);
  if (cached) {
    return res.json({
      data: cached.data,
      _source: 'CACHED',
      _cachedAt: cached.cachedAt
    });
  }

  try {
    const url = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${encodeURIComponent(start)}&end_date=${encodeURIComponent(end)}&api_key=${apiKey}`;
    const response = await fetchWithTimeout(url, {}, 14000);
    if (!response.ok) throw new Error(`NeoWs error: ${response.status}`);

    const data = await response.json();
    
    if (!data.near_earth_objects || Object.keys(data.near_earth_objects).length === 0) {
      throw new Error('NeoWs returned empty data for the requested timeframe');
    }

    setInCache(cacheKey, data, 3600); // 1 hour
    return res.json({
      data,
      _source: 'LIVE',
      _cachedAt: Date.now()
    });
  } catch (err: any) {
    const stale = getFromCache(cacheKey, true);
    if (stale) {
      return res.json({
        data: stale.data,
        _source: 'CACHED',
        _cachedAt: stale.cachedAt,
        _stale: true
      });
    }
    return res.json({
      data: FALLBACK_NEO,
      _source: 'SNAPSHOT',
      _note: 'Using NeoWs snapshot'
    });
  }
});

// 5. NOAA SWPC ROUTE
const SWPC_URLS: Record<string, string> = {
  'scales': 'https://services.swpc.noaa.gov/products/noaa-scales.json',
  'kp': 'https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json',
  'kp-forecast': 'https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json',
  'alerts': 'https://services.swpc.noaa.gov/products/alerts.json',
  'xray': 'https://services.swpc.noaa.gov/json/goes/primary/xrays-6-hour.json',
  'wind-speed': 'https://services.swpc.noaa.gov/products/summary/solar-wind-speed.json'
};

app.get('/api/swpc/:product', async (req: Request, res: Response) => {
  const product = req.params.product;
  const upstreamUrl = SWPC_URLS[product];

  if (!upstreamUrl) {
    return res.status(400).json({ error: `Invalid SWPC product. Allowed: ${Object.keys(SWPC_URLS).join(', ')}` });
  }

  const cacheKey = `swpc_${product}`;
  const cached = getFromCache(cacheKey);
  if (cached) {
    return res.json({
      data: cached.data,
      _source: 'CACHED',
      _cachedAt: cached.cachedAt,
      _product: product
    });
  }

  try {
    const response = await fetchWithTimeout(upstreamUrl, {
      headers: { 'Accept': 'application/json' }
    }, 6000);

    if (!response.ok) throw new Error(`SWPC ${product} responded with ${response.status}`);
    const data = await response.json();

    setInCache(cacheKey, data, 60); // 1 minute
    return res.json({
      data,
      _source: 'LIVE',
      _cachedAt: Date.now(),
      _product: product
    });
  } catch (err: any) {
    console.warn(`[SWPC Proxy] ${product} upstream error: ${err?.message}`);
    const stale = getFromCache(cacheKey, true);
    if (stale) {
      return res.json({
        data: stale.data,
        _source: 'CACHED',
        _cachedAt: stale.cachedAt,
        _stale: true,
        _product: product
      });
    }

    const fallback = FALLBACK_SWPC[product] || {};
    return res.json({
      data: fallback,
      _source: 'SNAPSHOT',
      _product: product,
      _note: 'Using bundled SWPC snapshot'
    });
  }
});

// 6. SPACEX ROUTE (Historical context only)
const ALLOWED_SPACEX = ['launches/past', 'launches/latest', 'starlink', 'rockets', 'launchpads'];

app.get('/api/spacex', async (req: Request, res: Response) => {
  const resource = (req.query.resource as string) || 'launches/past';
  if (!ALLOWED_SPACEX.includes(resource)) {
    return res.status(400).json({ error: `Invalid resource. Allowed: ${ALLOWED_SPACEX.join(', ')}` });
  }

  const cacheKey = `spacex_${resource}`;
  const cached = getFromCache(cacheKey);
  if (cached) {
    return res.json({
      data: cached.data,
      _source: 'CACHED',
      _cachedAt: cached.cachedAt,
      _notice: 'Historical data, not a live feed'
    });
  }

  try {
    const version = resource === 'starlink' ? 'v4' : 'v5';
    const url = `https://api.spacexdata.com/${version}/${resource}`;
    const response = await fetchWithTimeout(url, {}, 4000);
    if (!response.ok) throw new Error(`SpaceX API error: ${response.status}`);

    let data = await response.json();
    if (Array.isArray(data)) {
      data = data.slice(-15).reverse(); // Last 15 missions
    }

    setInCache(cacheKey, data, 3600); // 1 hour
    return res.json({
      data,
      _source: 'LIVE',
      _cachedAt: Date.now(),
      _notice: 'Historical data, not a live feed'
    });
  } catch {
    // Upstream unavailable - return empty list and cache for 1 hour to hide panel gracefully
    setInCache(cacheKey, [], 3600);
    return res.json({
      data: [],
      _source: 'UNAVAILABLE',
      _notice: 'Historical data, not a live feed'
    });
  }
});

// 7. LAUNCHES ROUTE (SpaceDevs LL2)
app.get('/api/launches', async (req: Request, res: Response) => {
  const cacheKey = 'spacedevs_upcoming_launches';
  const cached = getFromCache(cacheKey);
  if (cached) {
    return res.json({
      data: cached.data,
      _source: 'CACHED',
      _cachedAt: cached.cachedAt
    });
  }

  try {
    const url = 'https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=10&mode=list';
    const response = await fetchWithTimeout(url, {
      headers: {
        'User-Agent': 'OrbitalSentinel/1.0 (Space Situational Awareness Operations)'
      }
    }, 7000);

    if (response.status === 429) {
      const stale = getFromCache(cacheKey, true);
      if (stale) {
        return res.json({
          data: stale.data,
          _source: 'CACHED',
          _cachedAt: stale.cachedAt,
          _rateLimited: true
        });
      }
      return res.json({
        data: FALLBACK_LAUNCHES,
        _source: 'SNAPSHOT',
        _rateLimited: true
      });
    }

    if (!response.ok) throw new Error(`SpaceDevs error: ${response.status}`);
    const data = await response.json();

    setInCache(cacheKey, data, 1800); // 30 minutes
    return res.json({
      data,
      _source: 'LIVE',
      _cachedAt: Date.now()
    });
  } catch (err: any) {
    console.warn(`[Launches Proxy] Error: ${err?.message}`);
    const stale = getFromCache(cacheKey, true);
    if (stale) {
      return res.json({
        data: stale.data,
        _source: 'CACHED',
        _cachedAt: stale.cachedAt,
        _stale: true
      });
    }
    return res.json({
      data: FALLBACK_LAUNCHES,
      _source: 'SNAPSHOT'
    });
  }
});

// 8. GEMINI AI ANALYST (POST /api/analyze)
const RISK_ORDER: Record<string, number> = {
  low: 0,
  moderate: 1,
  elevated: 2,
  high: 3
};
const RISK_KEYS = ['low', 'moderate', 'elevated', 'high'];

function ruleBasedFallback(payload: any) {
  const { satellite, computed_risk, scenario, space_weather } = payload;
  const level = (computed_risk?.level || 'LOW').toLowerCase();
  const score = computed_risk?.score || 10;
  const alt = satellite?.altitude_km || 400;
  const kp = space_weather?.kp || 2.0;

  let primary_factor = 'Standard orbital decay within normal tolerances.';
  let affected_system = 'Attitude & Orbit Control System (AOCS)';
  let explanation = `Operating at ${Math.round(alt)} km with Kp=${kp}. Drag environment is within nominal bounds. No immediate orbital intervention required.`;
  let recommended_action = 'Maintain standard stationkeeping and track orbital decay telemetry.';
  let easy_explanation = `Everything is cruising smoothly! The spacecraft is safely coasting around Earth at 17,500 mph with no space junk or giant solar flares in its path.`;
  let easy_recommendation = `Sit back, keep tracking the satellite, and enjoy the smooth ride through space!`;

  let evidence = [
    `altitude_km: ${alt}`,
    `computed_risk.score: ${score}`,
    `space_weather.kp: ${kp}`
  ];

  if (scenario === 'solar_storm' || score >= 60 || kp >= 6) {
    primary_factor = 'Severe thermospheric expansion from geomagnetic storm.';
    affected_system = 'Spacecraft Propulsive Life & Orbit Determination';
    explanation = `Elevated solar activity (Kp=${kp}) has increased upper atmosphere density, raising ballistic drag by over 300%. Expect rapid ephemeris degradation.`;
    recommended_action = 'Increase tracking cadence, disable unverified automated burns, and monitor gyro torques.';
    easy_explanation = `Whoa! The Sun shot out a giant solar storm that puffed up Earth's atmosphere like a hot air balloon. The air up here is thicker, so the satellite feels like it's running through water and slowing down.`;
    easy_recommendation = `Keep eyes glued to the radar and get ready to fire the booster rockets to push it back up to safety!`;
    evidence = [
      `space_weather.kp: ${kp}`,
      `space_weather.g_scale: ${space_weather?.g_scale || 'G4'}`,
      `satellite.altitude_km: ${alt}`
    ];
  } else if (scenario === 'conjunction') {
    primary_factor = 'Conjunction risk with cataloged debris object.';
    affected_system = 'Structural Integrity & Bus Safety';
    explanation = `Identified close proximity encounter within screening envelope. Combined covariance warrants operational monitoring.`;
    recommended_action = 'Compute radial-cross track delta-V options and prepare collision avoidance maneuver window.';
    easy_explanation = `Incoming! A piece of old, broken space junk is flying super close to our satellite. It's like two speeding race cars passing inches apart on the track.`;
    easy_recommendation = `Warm up the steering thrusters and prepare to steer slightly to the side to avoid a crash!`;
    evidence = [
      `satellite.name: ${satellite?.name}`,
      `computed_risk.level: ${computed_risk?.level}`
    ];
  }

  return {
    risk: level,
    confidence: 0.85,
    primary_factor,
    affected_system,
    explanation,
    recommended_action,
    easy_explanation,
    easy_recommendation,
    evidence
  };
}

app.post('/api/analyze', async (req: Request, res: Response) => {
  const payload = req.body;
  const isForce = req.query.force === 'true';

  if (!payload || !payload.satellite) {
    return res.status(400).json({ error: 'Missing required satellite payload' });
  }

  // Check in-memory cache for recent analysis (10 minutes) unless force requested
  const noradId = payload.satellite.norad_id || 0;
  const scenarioKey = payload.scenario || 'normal';
  const analyzeCacheKey = `analysis_${noradId}_${scenarioKey}`;
  if (!isForce) {
    const cached = getFromCache(analyzeCacheKey);
    if (cached) {
      return res.json({
        ...cached.data,
        _source: 'CACHED_ANALYSIS'
      });
    }
  }

  const computedLevel = (payload.computed_risk?.level || 'LOW').toLowerCase();
  const computedStep = RISK_ORDER[computedLevel] ?? 0;

  const prompt = `Analyze current operational risk for spacecraft:\n` +
    `Spacecraft: ${JSON.stringify(payload.satellite, null, 2)}\n` +
    `Space Weather: ${JSON.stringify(payload.space_weather, null, 2)}\n` +
    `Orbit: ${JSON.stringify(payload.orbit, null, 2)}\n` +
    `Computed Deterministic Risk: ${JSON.stringify(payload.computed_risk, null, 2)}\n` +
    `Scenario Context: ${payload.scenario || 'normal'}\n\n` +
    `Provide BOTH:\n` +
    `1. A professional flight dynamics interpretation for mission operators (max 60 words).\n` +
    `2. An easy, intuitive explanation suitable for a 12-year-old using friendly analogies (easy_explanation and easy_recommendation).\n` +
    `Cite input fields in evidence. Do not invent numbers.`;

  const systemInstruction = `You are a spacecraft operations analyst. Use ONLY the provided data. Do not invent numbers. Provide both professional aerospace analysis and a friendly, fun, intuitive 12-year-old explanation for flip-card display.`;

  async function callGeminiOnce() {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            risk: {
              type: Type.STRING,
              description: 'Operational risk level: low, moderate, elevated, or high'
            },
            confidence: {
              type: Type.NUMBER,
              description: 'Confidence between 0 and 1'
            },
            primary_factor: {
              type: Type.STRING,
              description: 'Primary driver of the assessed risk in professional terminology'
            },
            affected_system: {
              type: Type.STRING,
              description: 'Spacecraft subsystem most exposed'
            },
            explanation: {
              type: Type.STRING,
              description: 'Professional interpretation for flight controllers, max 60 words'
            },
            recommended_action: {
              type: Type.STRING,
              description: 'Professional operational course of action'
            },
            easy_explanation: {
              type: Type.STRING,
              description: 'Fun, crystal-clear 12-year-old friendly explanation using simple analogies'
            },
            easy_recommendation: {
              type: Type.STRING,
              description: 'Fun, clear 12-year-old action advice'
            },
            evidence: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of cited facts directly from input fields'
            }
          },
          required: [
            'risk',
            'confidence',
            'primary_factor',
            'affected_system',
            'explanation',
            'recommended_action',
            'easy_explanation',
            'easy_recommendation',
            'evidence'
          ]
        }
      }
    });

    const text = response.text?.trim() || '{}';
    return JSON.parse(text);
  }

  const isQuotaExhausted = (err: any) => {
    const str = (err?.message || '') + ' ' + (err?.status || '') + ' ' + JSON.stringify(err || '');
    return str.includes('429') || str.includes('RESOURCE_EXHAUSTED') || str.includes('Quota exceeded');
  };

  try {
    let result: any;
    try {
      result = await callGeminiOnce();
    } catch (firstErr: any) {
      if (isQuotaExhausted(firstErr)) {
        throw firstErr; // Skip retry on quota exhaustion
      }
      result = await callGeminiOnce();
    }

    // Server-side validation and step distance check
    let modelRisk = (result.risk || 'low').toLowerCase();
    if (!RISK_KEYS.includes(modelRisk)) {
      modelRisk = computedLevel;
    }

    const modelStep = RISK_ORDER[modelRisk] ?? computedStep;
    let modelDisagreed = false;
    let finalRisk = modelRisk;

    // Never let model risk level be more than 1 step away from computed level
    if (Math.abs(modelStep - computedStep) > 1) {
      modelDisagreed = true;
      finalRisk = computedLevel; // Clamped to computed level
    }

    result.risk = finalRisk;

    const responsePayload = {
      assessment: result,
      computed_risk: payload.computed_risk,
      model_disagreed: modelDisagreed,
      _source: 'GEMINI_AI',
      _timestamp: new Date().toISOString()
    };

    setInCache(analyzeCacheKey, responsePayload, 600); // 10 minutes cache
    return res.json(responsePayload);
  } catch (err: any) {
    const fallbackAssessment = ruleBasedFallback(payload);
    const fallbackPayload = {
      assessment: fallbackAssessment,
      computed_risk: payload.computed_risk,
      model_disagreed: false,
      _source: isQuotaExhausted(err) ? 'DETERMINISTIC_RULES (QUOTA_PROTECTED)' : 'RULE_BASED_FALLBACK',
      _timestamp: new Date().toISOString()
    };

    setInCache(analyzeCacheKey, fallbackPayload, 120); // 2 minutes cache
    return res.json(fallbackPayload);
  }
});

// VITE MIDDLEWARES / STATIC SERVING
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[Orbital Sentinel Server] Listening on port ${PORT} (http://0.0.0.0:${PORT})`);
  });
}

startServer();
