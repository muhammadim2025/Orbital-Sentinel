# ORBITAL SENTINEL: Space Situational Awareness & AI Mission-Control

An AI mission-control interpretation layer that answers one critical question:
**"What is happening around this spacecraft right now, and does the operator need to care?"**

ORBITAL SENTINEL is not a simple satellite tracker. It combines high-precision SGP4/SDP4 orbital propagation, real-time NOAA SWPC space weather data, NASA DONKI space weather events, NASA EONET earth hazards, NeoWs near-Earth asteroids, and Launch Library 2 manifests. It evaluates a deterministic physical risk score and passes structured ephemeris to Google Gemini (`gemini-3.8-flash`) to generate concise, operator-grade situational interpretation.

---

## Architecture & Data Pipeline

1. **Deterministic Physics Layer (Client-Side)**
   - **SGP4 / SDP4 Propagation Engine**: Implemented using `satellite.js` in the browser, propagating state vectors every second into 3D Cartesian coordinates, geodetic latitude/longitude, altitude (km), and orbital speed (km/s).
   - **Next Ground Pass Predictor**: Calculates AOS, TCA, LOS, and max elevation over user browser coordinates or default spaceports (e.g. Cape Canaveral / KSC).
   - **Deterministic Risk Pre-Score**: Local algorithm computing numeric composite drag risk score (0-100) from altitude (<600km drag scale), planetary Kp index, 72h Earth-directed CME arrival shock, solar flare class (M/X), TLE epoch age, and conjunction miss distance.
   - **Conjunction Screening Engine**: Scans active objects against debris clouds (Cosmos 2251 and Iridium 33 fragments) over a 24-hour lookahead window with fine-grained refinement down to 2-second steps.

2. **CesiumJS 3D Globe Engine**
   - Renders Earth using bundled NaturalEarthII imagery and EllipsoidTerrainProvider with **zero Cesium Ion token requirements**.
   - Swarm visualization powered by Cesium `PointPrimitiveCollection` for GPU-accelerated 60 FPS performance across hundreds of satellites.
   - High-fidelity Cesium Entity for the selected target, including glowing 90-minute orbital trajectory polyline, sub-satellite ground track, and pulsing closest approach (TCA) conjunction markers.

3. **Gemini AI Analyst Layer (Server-Side)**
   - Server-only execution via `@google/genai` TypeScript SDK using `gemini-3.8-flash`.
   - Strict `responseSchema` adhering to structured JSON outputs: `risk`, `confidence`, `primary_factor`, `affected_system`, `explanation` (max 60 words), `recommended_action`, and `evidence`.
   - Server-side validation with automated single-retry and deterministic fallback. The model risk level is strictly bounded within 1 step of the deterministic envelope (if it diverges, it is clamped and flagged as `model disagreed`).

---

## Upstream APIs, Endpoints & In-Memory Cache Specifications

| API Service | Proxy Route | Upstream Endpoint | Cache TTL | Required Secret |
| :--- | :--- | :--- | :--- | :--- |
| **CelesTrak (NORAD GP)** | `GET /api/tle?group=...` | `https://celestrak.org/NORAD/elements/gp.php?GROUP={group}&FORMAT=json` | **2 hours** (7200s) | None (descriptive `User-Agent` provided) |
| **NOAA Space Weather Prediction Center (SWPC)** | `GET /api/swpc/:product` | `https://services.swpc.noaa.gov/products/` (`scales`, `kp`, `kp-forecast`, `alerts`, `xray`, `wind-speed`) | **1 minute** (60s) | None (public NOAA data) |
| **NASA DONKI** | `GET /api/donki?type=...` | `https://api.nasa.gov/DONKI/{type}?startDate=&endDate=` (`FLR`, `CME`, `GST`, etc.) | **15 minutes** (900s) | `NASA_API_KEY` (falls back to `DEMO_KEY`) |
| **NASA EONET** | `GET /api/eonet?days=20` | `https://eonet.gsfc.nasa.gov/api/v3/events/geojson?days=20&status=open` | **15 minutes** (900s) | None |
| **NASA NeoWs** | `GET /api/neo` | `https://api.nasa.gov/neo/rest/v1/feed?start_date=&end_date=` | **1 hour** (3600s) | `NASA_API_KEY` (falls back to `DEMO_KEY`) |
| **The Space Devs (Launch Library 2)** | `GET /api/launches` | `https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=10&mode=list` | **30 minutes** (1800s) | None (handles HTTP 429 via cached stale fallback) |
| **SpaceX Data API** | `GET /api/spacex?resource=...` | `https://api.spacexdata.com/v5/{resource}` (v4 for starlink) | **1 hour** (3600s) | None (labeled as historical context) |
| **Google Gemini API** | `POST /api/analyze` | `@google/genai` (`gemini-3.8-flash`) | Per-request | `GEMINI_API_KEY` |

---

## Required Environment Secrets

- `GEMINI_API_KEY`: API key for Google Gemini model calls (injected via AI Studio Secrets).
- `NASA_API_KEY`: NASA API key for higher rate limits on DONKI and NeoWs endpoints (falls back to `DEMO_KEY` if omitted).

---

## Mission Scenarios

1. **01 Normal Operations**: Live telemetry, quiescent to moderate solar activity, real-time SGP4 propagation.
2. **02 Solar Storm**: Replay of the historic May 8–14, 2024 G5 extreme geomagnetic storm (AR3664 X-class flares, cannibal CME, Kp=9.0, rapid thermospheric drag surge).
3. **03 Orbital Anomaly**: Conjunction screening against Cosmos 2251 and Iridium 33 debris fragments, computing minimum miss distance, TCA timestamp, relative velocity, and trajectory covariance confidence.
