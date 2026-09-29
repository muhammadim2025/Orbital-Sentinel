/**
 * ORBITAL SENTINEL: AI MISSION-CONTROL & SPACE SITUATIONAL AWARENESS
 * Interpretation layer on top of calculated orbital physics and real space-weather data.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { TopBar } from './components/TopBar.tsx';
import { LeftSidebar } from './components/LeftSidebar.tsx';
import { RightPanel } from './components/RightPanel.tsx';
import { CesiumGlobe } from './components/CesiumGlobe.tsx';
import { BottomStrip } from './components/BottomStrip.tsx';
import { CommandPalette } from './components/CommandPalette.tsx';
import { ConjunctionCard } from './components/ConjunctionCard.tsx';

import {
  SpacecraftRecord,
  SatellitePosition,
  GroundPass,
  ConjunctionResult,
  parseCelesTrakRecord,
  propagateSatellite,
  calculateNextPass,
  searchClosestApproach
} from './services/orbitalEngine.ts';

import {
  computeDeterministicRisk,
  ComputedRisk
} from './services/riskCalculator.ts';

import { apiClient, SourceStatus, AnalyzeResult } from './services/apiClient.ts';
import { Globe2, Layers, Cpu, Activity } from 'lucide-react';

export default function App() {
  // Mobile View Drawer State ('globe' | 'targets' | 'inspector' | 'dock')
  const [mobileView, setMobileView] = useState<'globe' | 'targets' | 'inspector' | 'dock'>('globe');

  // Scenario State: 01 Normal, 02 Solar Storm, 03 Conjunction Anomaly
  const [scenario, setScenario] = useState<'normal' | 'solar_storm' | 'conjunction'>('normal');

  // Spacecraft Groups & Catalogs
  const [activeGroup, setActiveGroup] = useState<string>('stations');
  const [satellites, setSatellites] = useState<SpacecraftRecord[]>([]);
  const [debrisSatellites, setDebrisSatellites] = useState<SpacecraftRecord[]>([]);
  const [stationSatellites, setStationSatellites] = useState<SpacecraftRecord[]>([]);
  const [selectedSatellite, setSelectedSatellite] = useState<SpacecraftRecord | null>(null);

  // Live Simulation Clock & Ephemeris
  const [simTime, setSimTime] = useState<Date>(new Date());
  const [currentPosition, setCurrentPosition] = useState<SatellitePosition | null>(null);
  const [nextPass, setNextPass] = useState<GroundPass | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number }>({ lat: 28.5721, lon: -80.648 }); // Default Kennedy Space Center

  // Telemetry & Environment
  const [spaceWeather, setSpaceWeather] = useState({
    kp: 2.33,
    gScale: 'G0',
    solarWindSpeed: '418',
    xrayClass: 'C1.4',
    flareClass24h: 'C1.8',
    alertsCount: 0
  });

  const [donkiFlares, setDonkiFlares] = useState<any[]>([]);
  const [donkiCmes, setDonkiCmes] = useState<any[]>([]);
  const [donkiGst, setDonkiGst] = useState<any[]>([]);
  const [eonetEvents, setEonetEvents] = useState<any[]>([]);
  const [upcomingLaunches, setUpcomingLaunches] = useState<any[]>([]);
  const [spacexHistory, setSpacexHistory] = useState<any[]>([]);
  const [neoList, setNeoList] = useState<any[]>([]);

  // Source Statuses for Data Pipeline
  const [sourceStatuses, setSourceStatuses] = useState<Record<string, SourceStatus>>({
    celestrak: { source: 'LIVE' },
    noaa_swpc: { source: 'LIVE' },
    nasa_donki: { source: 'LIVE' },
    nasa_eonet: { source: 'LIVE' },
    neows: { source: 'LIVE' },
    spacedevs: { source: 'LIVE' }
  });

  // Conjunction Screening State
  const [conjunctionPair, setConjunctionPair] = useState<ConjunctionResult | null>(null);
  const [isSearchingConjunction, setIsSearchingConjunction] = useState(false);

  // Gemini AI Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AnalyzeResult | null>(null);

  // UI Controls
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Geolocation detection
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setUserCoords({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude
          });
        },
        () => {
          // Keep Kennedy Space Center default
        },
        { timeout: 5000 }
      );
    }
  }, []);

  // Request Animation Frame / 1-second clock loop
  useEffect(() => {
    const timer = setInterval(() => {
      setSimTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load Primary Satellite Group & Debris Catalog
  const loadSatellitesForGroup = useCallback(async (group: string) => {
    const res = await apiClient.fetchTle(group);
    setSourceStatuses(prev => ({ ...prev, celestrak: res.status }));

    const parsed = res.data
      .map(item => parseCelesTrakRecord(item, group))
      .filter((s): s is SpacecraftRecord => s !== null);

    setSatellites(parsed);

    // If current selected satellite isn't in group or not set, select first
    setSelectedSatellite(prev => {
      if (!prev || !parsed.some(s => s.noradId === prev.noradId)) {
        return parsed[0] || null;
      }
      return prev;
    });
  }, []);

  // Load active group
  useEffect(() => {
    loadSatellitesForGroup(activeGroup);
  }, [activeGroup, loadSatellitesForGroup]);

  // Load initial static background catalogs (Debris & Stations)
  useEffect(() => {
    // Pre-load debris catalog for conjunction screening and visualization
    apiClient.fetchTle('cosmos-2251-debris').then(res1 => {
      apiClient.fetchTle('iridium-33-debris').then(res2 => {
        const combined = [...res1.data, ...res2.data]
          .map(item => parseCelesTrakRecord(item, 'debris'))
          .filter((s): s is SpacecraftRecord => s !== null);
        setDebrisSatellites(combined);
      });
    });
    
    // Pre-load stations so they are always visible as Gold markers
    apiClient.fetchTle('stations').then(res => {
      const parsed = res.data
        .map(item => parseCelesTrakRecord(item, 'stations'))
        .filter((s): s is SpacecraftRecord => s !== null);
      setStationSatellites(parsed);
    });
  }, []);

  // Load Space Weather & Environmental Feeds
  const loadEnvironmentalFeeds = useCallback(async (isSolarStormScenario: boolean) => {
    // 1. SWPC Products
    if (isSolarStormScenario) {
      // Historical May 2024 Storm Environment
      setSpaceWeather({
        kp: 9.0,
        gScale: 'G5 EXTREME',
        solarWindSpeed: '1680',
        xrayClass: 'X8.7',
        flareClass24h: 'X5.8',
        alertsCount: 12
      });
    } else {
      // Live SWPC Products
      try {
        const [kpRes, scalesRes, windRes, xrayRes] = await Promise.all([
          apiClient.fetchSwpc('kp'),
          apiClient.fetchSwpc('scales'),
          apiClient.fetchSwpc('wind-speed'),
          apiClient.fetchSwpc('xray')
        ]);

        setSourceStatuses(prev => ({ ...prev, noaa_swpc: kpRes.status }));

        let latestKp = 2.33;
        if (Array.isArray(kpRes.data) && kpRes.data.length > 1) {
          const lastRow = kpRes.data[kpRes.data.length - 1];
          latestKp = parseFloat(lastRow[1]) || 2.33;
        }

        let gScale = 'G0';
        if (latestKp >= 9) gScale = 'G5 EXTREME';
        else if (latestKp >= 8) gScale = 'G4 SEVERE';
        else if (latestKp >= 7) gScale = 'G3 STRONG';
        else if (latestKp >= 6) gScale = 'G2 MODERATE';
        else if (latestKp >= 5) gScale = 'G1 MINOR';

        const speed = windRes.data?.Speed || '418';
        const xray = Array.isArray(xrayRes.data) && xrayRes.data.length > 0
          ? xrayRes.data[xrayRes.data.length - 1].flare_class || 'C1.4'
          : 'C1.4';

        setSpaceWeather({
          kp: latestKp,
          gScale,
          solarWindSpeed: String(Math.round(parseFloat(speed) || 418)),
          xrayClass: xray,
          flareClass24h: xray.startsWith('X') || xray.startsWith('M') ? xray : 'C-class nominal',
          alertsCount: 1
        });
      } catch (err) {
        console.warn('[App] SWPC load failed, using baseline:', err);
      }
    }

    // 2. NASA DONKI
    const startWindow = isSolarStormScenario ? '2024-05-08' : undefined;
    const endWindow = isSolarStormScenario ? '2024-05-14' : undefined;

    try {
      const [flrRes, cmeRes, gstRes] = await Promise.all([
        apiClient.fetchDonki('FLR', startWindow, endWindow),
        apiClient.fetchDonki('CME', startWindow, endWindow),
        apiClient.fetchDonki('GST', startWindow, endWindow)
      ]);

      setSourceStatuses(prev => ({ ...prev, nasa_donki: flrRes.status }));
      setDonkiFlares(flrRes.data);
      setDonkiCmes(cmeRes.data);
      setDonkiGst(gstRes.data);
    } catch (err) {
      console.warn('[App] DONKI load error:', err);
    }

    // 3. NASA EONET
    apiClient.fetchEonet().then(res => {
      setSourceStatuses(prev => ({ ...prev, nasa_eonet: res.status }));
      setEonetEvents(res.features);
    });

    // 4. SpaceDevs Launches
    apiClient.fetchLaunches().then(res => {
      setSourceStatuses(prev => ({ ...prev, spacedevs: res.status }));
      setUpcomingLaunches(res.launches);
    });

    // 5. SpaceX Context
    apiClient.fetchSpaceX('launches/past').then(res => {
      setSpacexHistory(res.items);
    });

    // 6. NeoWs Asteroids
    apiClient.fetchNeo().then(res => {
      setSourceStatuses(prev => ({ ...prev, neows: res.status }));
      setNeoList(res.neoList);
    });
  }, []);

  // Update environmental feeds when scenario changes
  useEffect(() => {
    loadEnvironmentalFeeds(scenario === 'solar_storm');
  }, [scenario, loadEnvironmentalFeeds]);

  // Propagate selected satellite position at current time
  useEffect(() => {
    if (!selectedSatellite) {
      setCurrentPosition(null);
      setNextPass(null);
      return;
    }

    const pos = propagateSatellite(selectedSatellite.satrec, simTime);
    setCurrentPosition(pos);

    // Compute ground pass
    const pass = calculateNextPass(selectedSatellite.satrec, userCoords.lat, userCoords.lon);
    setNextPass(pass);
  }, [selectedSatellite, simTime, userCoords]);

  // Compute Deterministic Risk Pre-Score (locally, never by LLM)
  const computedRisk: ComputedRisk | null = useMemo(() => {
    if (!selectedSatellite) return null;

    const alt = currentPosition ? currentPosition.altitude : 400;
    const hasCme = donkiCmes.length > 0;
    const flare = spaceWeather.flareClass24h;
    const conjunctionMiss = scenario === 'conjunction' && conjunctionPair ? conjunctionPair.missDistanceKm : null;

    return computeDeterministicRisk({
      altitudeKm: alt,
      kp: spaceWeather.kp,
      hasCmeWithin72h: hasCme,
      recentFlareClass: flare,
      tleAgeHours: selectedSatellite.epochAgeHours,
      conjunctionMissKm: conjunctionMiss
    });
  }, [selectedSatellite, currentPosition, spaceWeather, donkiCmes, scenario, conjunctionPair]);

  // Fleet-wide Risk Pre-Scores map
  const satelliteRisks = useMemo(() => {
    const map = new Map<number, ComputedRisk>();
    for (const sat of satellites) {
      const pos = propagateSatellite(sat.satrec, simTime);
      const alt = pos ? pos.altitude : 450;
      const risk = computeDeterministicRisk({
        altitudeKm: alt,
        kp: spaceWeather.kp,
        hasCmeWithin72h: donkiCmes.length > 0,
        recentFlareClass: spaceWeather.flareClass24h,
        tleAgeHours: sat.epochAgeHours
      });
      map.set(sat.noradId, risk);
    }
    return map;
  }, [satellites, simTime, spaceWeather, donkiCmes]);

  // Fleet-wide Risk Tallies
  const riskCounts = useMemo(() => {
    let low = 0;
    let moderate = 0;
    let elevated = 0;
    let high = 0;

    satelliteRisks.forEach(r => {
      if (r.level === 'HIGH') high++;
      else if (r.level === 'ELEVATED') elevated++;
      else if (r.level === 'MODERATE') moderate++;
      else low++;
    });

    return { low, moderate, elevated, high };
  }, [satelliteRisks]);

  const currentPositionRef = useRef<SatellitePosition | null>(null);
  currentPositionRef.current = currentPosition;

  const computedRiskRef = useRef<ComputedRisk | null>(null);
  computedRiskRef.current = computedRisk;

  const lastAnalyzedKeyRef = useRef<string>('');

  // Trigger Gemini Analysis Call (supports force refresh on button click)
  const handleTriggerAnalyze = useCallback(async (force = false) => {
    if (!selectedSatellite) return;
    const risk = computedRiskRef.current;
    if (!risk) return;

    setIsAnalyzing(true);
    const pos = currentPositionRef.current;
    const alt = pos ? Math.round(pos.altitude) : 400;
    const vel = pos ? pos.velocity : 7.66;

    const payload = {
      satellite: {
        name: selectedSatellite.name,
        norad_id: selectedSatellite.noradId,
        altitude_km: alt,
        velocity_kms: Math.round(vel * 100) / 100,
        inclination_deg: Math.round(selectedSatellite.inclination * 100) / 100,
        eccentricity: selectedSatellite.eccentricity,
        period_min: Math.round(selectedSatellite.periodMinutes * 10) / 10,
        tle_age_hours: Math.round(selectedSatellite.epochAgeHours * 10) / 10
      },
      space_weather: {
        kp: spaceWeather.kp,
        g_scale: spaceWeather.gScale,
        flare_class_24h: spaceWeather.flareClass24h,
        solar_wind_kms: spaceWeather.solarWindSpeed,
        cme_events: donkiCmes.slice(0, 3).map(c => c.activityID || 'CME'),
        geomagnetic_storms: donkiGst.slice(0, 2).map(g => g.gstID || 'GST')
      },
      orbit: {
        decay_indicators: alt < 450 ? 'Accelerated thermospheric drag decay' : 'Nominal orbit decay',
        predicted_trajectory_summary: `Stable inclination at ${selectedSatellite.inclination.toFixed(1)}°`
      },
      computed_risk: {
        score: risk.score,
        level: risk.level
      },
      scenario
    };

    const customApiKey = localStorage.getItem('gemini_api_key') || undefined;
    const res = await apiClient.analyzeSpacecraft(payload, force, customApiKey);
    setAiAnalysis(res);
    setIsAnalyzing(false);
  }, [selectedSatellite, spaceWeather, donkiCmes, donkiGst, scenario]);

  const handleDetectBackyard = useCallback(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setUserCoords({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude
          });
        },
        err => {
          console.warn('[App] Geolocation error:', err);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, []);

  // Auto-run Gemini analysis ONLY when selected satellite noradId or scenario changes
  useEffect(() => {
    if (!selectedSatellite) return;
    const key = `${selectedSatellite.noradId}_${scenario}`;
    if (lastAnalyzedKeyRef.current === key) return;
    lastAnalyzedKeyRef.current = key;

    // Small delay to allow initial computed risk to settle
    const timeout = setTimeout(() => {
      handleTriggerAnalyze();
    }, 150);

    return () => clearTimeout(timeout);
  }, [selectedSatellite?.noradId, scenario, handleTriggerAnalyze]);

  // Conjunction Screening Search (Scenario 03)
  useEffect(() => {
    if (scenario === 'conjunction' && selectedSatellite && debrisSatellites.length > 0) {
      setIsSearchingConjunction(true);
      const timer = setTimeout(() => {
        const result = searchClosestApproach(selectedSatellite, debrisSatellites, new Date(), 24, 45);
        setConjunctionPair(result);
        setIsSearchingConjunction(false);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setConjunctionPair(null);
      setIsSearchingConjunction(false);
    }
  }, [scenario, selectedSatellite?.noradId, debrisSatellites]);

  // Scenario Selector
  const handleSelectScenario = (newScenario: 'normal' | 'solar_storm' | 'conjunction') => {
    setScenario(newScenario);
    if (newScenario === 'conjunction') {
      // Ensure we have an active object to screen
      if (!selectedSatellite && satellites.length > 0) {
        setSelectedSatellite(satellites[0]);
      }
    }
  };

  const handleResetToLive = () => {
    setScenario('normal');
    loadEnvironmentalFeeds(false);
  };

  // Group definitions for sidebar
  const groupsList = useMemo(() => [
    { id: 'stations', label: 'Stations / ISS', count: activeGroup === 'stations' ? satellites.length : 2 },
    { id: 'starlink', label: 'Starlink Fleet', count: activeGroup === 'starlink' ? satellites.length : 300 },
    { id: 'gps-ops', label: 'GPS Constellation', count: activeGroup === 'gps-ops' ? satellites.length : 31 },
    { id: 'weather', label: 'Weather / NOAA', count: activeGroup === 'weather' ? satellites.length : 18 },
    { id: 'goes', label: 'GOES Geostationary', count: activeGroup === 'goes' ? satellites.length : 4 },
    { id: 'cosmos-2251-debris', label: 'Cosmos 2251 Debris', count: activeGroup === 'cosmos-2251-debris' ? satellites.length : 24 },
    { id: 'iridium-33-debris', label: 'Iridium 33 Debris', count: activeGroup === 'iridium-33-debris' ? satellites.length : 19 },
    { id: 'active', label: 'Active Science', count: activeGroup === 'active' ? satellites.length : 120 }
  ], [activeGroup, satellites.length]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#030305] text-zinc-100 font-sans">
      {/* Top Bar Header */}
      <TopBar
        scenario={scenario}
        onSelectScenario={handleSelectScenario}
        onResetToLive={handleResetToLive}
        utcTime={simTime}
        sourceStatuses={sourceStatuses}
        mobileView={mobileView}
        onSetMobileView={setMobileView}
      />

      {/* Main Viewport Grid */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Registry Sidebar (Desktop persistent / Mobile slide drawer) */}
        <LeftSidebar
          groups={groupsList}
          activeGroup={activeGroup}
          onSelectGroup={grp => setActiveGroup(grp)}
          satellites={satellites}
          selectedSatellite={selectedSatellite}
          onSelectSatellite={setSelectedSatellite}
          satelliteRisks={satelliteRisks}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isMobileOpen={mobileView === 'targets'}
          onCloseMobile={() => setMobileView('globe')}
        />

        {/* Center 3D Cesium Globe Viewport */}
        <main className="flex-1 relative h-full overflow-hidden">
          <CesiumGlobe
            satellites={Array.from(new Map([...satellites, ...debrisSatellites, ...stationSatellites].map(s => [s.noradId, s])).values())}
            selectedSatellite={selectedSatellite}
            onSelectSatellite={setSelectedSatellite}
            scenario={scenario}
            conjunctionPair={
              conjunctionPair
                ? {
                    primary: conjunctionPair.primary,
                    secondary: conjunctionPair.secondary,
                    missDistanceKm: conjunctionPair.missDistanceKm,
                    tca: conjunctionPair.timeOfClosestApproach,
                    primaryPosAtTca: conjunctionPair.primaryPositionAtTca
                  }
                : null
            }
            eonetEvents={eonetEvents}
            showEonet={true}
            showOrbits={true}
            simTime={simTime}
          />

          {/* Scenario 03 Proximity Event Card Overlay */}
          {scenario === 'conjunction' && (
            <ConjunctionCard
              conjunction={conjunctionPair}
              isSearching={isSearchingConjunction}
            />
          )}
        </main>

        {/* Right AI Assessment & Ephemeris Panel (Desktop persistent / Mobile slide drawer) */}
        <RightPanel
          selectedSatellite={selectedSatellite}
          currentPosition={currentPosition}
          computedRisk={computedRisk}
          aiAnalysis={aiAnalysis}
          isAnalyzing={isAnalyzing}
          nextPass={nextPass}
          spaceWeather={spaceWeather}
          onTriggerAnalyze={handleTriggerAnalyze}
          userCoords={userCoords}
          onDetectBackyard={handleDetectBackyard}
          isMobileOpen={mobileView === 'inspector'}
          onCloseMobile={() => setMobileView('globe')}
        />
      </div>

      {/* Floating Environmental Telemetry Dock / Expanded Sheet */}
      <BottomStrip
        scenario={scenario}
        donkiFlares={donkiFlares}
        donkiCmes={donkiCmes}
        donkiGst={donkiGst}
        eonetEvents={eonetEvents}
        upcomingLaunches={upcomingLaunches}
        spacexHistory={spacexHistory}
        neoList={neoList}
        riskCounts={riskCounts}
        totalSatellites={satellites.length}
        isMobileOpen={mobileView === 'dock'}
        onCloseMobile={() => setMobileView('globe')}
      />

      {/* Mobile Floating Apple Navigation Dock */}
      <div className="md:hidden fixed bottom-3 inset-x-0 pb-safe z-60 flex justify-center pointer-events-none">
        <nav className="pointer-events-auto flex items-center p-1 rounded-full bg-zinc-950/85 border border-white/10 backdrop-blur-2xl shadow-2xl">
          <button
            onClick={() => setMobileView('globe')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center space-x-1 transition-all ${
              mobileView === 'globe'
                ? 'bg-white text-zinc-950 shadow-sm font-semibold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span>Globe</span>
          </button>

        <button
          onClick={() => setMobileView(mobileView === 'targets' ? 'globe' : 'targets')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center space-x-1 transition-all ${
            mobileView === 'targets'
              ? 'bg-white text-zinc-950 shadow-sm font-semibold'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Targets</span>
        </button>

        <button
          onClick={() => setMobileView(mobileView === 'inspector' ? 'globe' : 'inspector')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center space-x-1 transition-all ${
            mobileView === 'inspector'
              ? 'bg-white text-zinc-950 shadow-sm font-semibold'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Cpu className="w-3.5 h-3.5 text-rose-500" />
          <span>AI Ops</span>
        </button>

        <button
          onClick={() => setMobileView(mobileView === 'dock' ? 'globe' : 'dock')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center space-x-1 transition-all ${
            mobileView === 'dock'
              ? 'bg-white text-zinc-950 shadow-sm font-semibold'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-amber-400" />
          <span>Telemetry</span>
        </button>
      </nav>
      </div>

      {/* Global Cmd+K Command Palette Modal */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        satellites={satellites}
        onSelectSatellite={setSelectedSatellite}
      />
    </div>
  );
}
