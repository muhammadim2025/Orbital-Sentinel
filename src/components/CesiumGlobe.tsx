/**
 * 3D CESIUM GLOBE COMPONENT
 * Real-time SGP4 orbital propagation, persistent camera target tracking,
 * 3D orbit ribbons for satellites and debris rings, and HUD with InfoButtons.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SpacecraftRecord, propagateSatellite, calculateOrbitPath } from '../services/orbitalEngine.ts';
import {
  Globe as GlobeIcon,
  RotateCw,
  Eye,
  AlertTriangle,
  Crosshair,
  CircleDot
} from 'lucide-react';
import { InfoButton } from './InfoButton.tsx';

interface CesiumGlobeProps {
  satellites: SpacecraftRecord[];
  selectedSatellite: SpacecraftRecord | null;
  onSelectSatellite: (sat: SpacecraftRecord) => void;
  scenario: 'normal' | 'solar_storm' | 'conjunction';
  conjunctionPair: {
    primary: SpacecraftRecord;
    secondary: SpacecraftRecord;
    missDistanceKm: number;
    tca: Date;
    primaryPosAtTca: any;
  } | null;
  eonetEvents: any[];
  showEonet?: boolean;
  showOrbits?: boolean;
  simTime: Date;
}

export const CesiumGlobe: React.FC<CesiumGlobeProps> = ({
  satellites,
  selectedSatellite,
  onSelectSatellite,
  scenario,
  conjunctionPair,
  eonetEvents,
  showEonet = true,
  simTime
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const pointCollectionRef = useRef<any>(null);

  const selectedEntityRef = useRef<any>(null);
  const currentSelectedNoradRef = useRef<number | null>(null);
  const orbitPathEntityRef = useRef<any>(null);
  const groundTrackEntityRef = useRef<any>(null);
  const fleetOrbitsEntitiesRef = useRef<any[]>([]);
  const conjunctionEntitiesRef = useRef<any[]>([]);

  const [cesiumReady, setCesiumReady] = useState(false);
  const [trackingMode, setTrackingMode] = useState(false);
  const [showFleetOrbits, setShowFleetOrbits] = useState(true);
  const [activeTooltip, setActiveTooltip] = useState<{ title: string; desc: string; x: number; y: number } | null>(null);

  // Initialize Cesium Viewer
  useEffect(() => {
    let checkInterval: any = null;

    function initCesium() {
      if (typeof window === 'undefined') return false;
      const Cesium = (window as any).Cesium;
      if (!Cesium || !containerRef.current) return false;

      try {
        if (viewerRef.current && !viewerRef.current.isDestroyed()) {
          viewerRef.current.destroy();
        }

        // Disable Cesium Ion tokens and remote Ion network calls
        if (Cesium.Ion) {
          Cesium.Ion.defaultAccessToken = '';
        }

        // Configure offline NaturalEarthII imagery layer bundled in Cesium
        let naturalEarthBaseLayer: any = false;
        try {
          if (Cesium.TileMapServiceImageryProvider && typeof Cesium.TileMapServiceImageryProvider.fromUrl === 'function') {
            naturalEarthBaseLayer = Cesium.ImageryLayer.fromProviderAsync(
              Cesium.TileMapServiceImageryProvider.fromUrl(
                Cesium.buildModuleUrl('Assets/Textures/NaturalEarthII')
              )
            );
          }
        } catch {
          naturalEarthBaseLayer = false;
        }

        const viewer = new Cesium.Viewer(containerRef.current, {
          animation: false,
          baseLayer: naturalEarthBaseLayer || false,
          terrainProvider: new Cesium.EllipsoidTerrainProvider(),
          baseLayerPicker: false,
          fullscreenButton: false,
          geocoder: false,
          homeButton: false,
          infoBox: false,
          sceneModePicker: false,
          selectionIndicator: false,
          timeline: false,
          navigationHelpButton: false,
          vrButton: false,
          creditContainer: document.createElement('div'),
          scene3DOnly: true
        });

        if (viewer.scene && viewer.scene.renderError) {
          viewer.scene.renderError.addEventListener((error: any) => {
            console.warn('[Cesium] Handled render notice:', error?.message);
          });
        }

        viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#030305');
        if (viewer.scene.globe) {
          viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#0a0d18');
          viewer.scene.globe.enableLighting = true;
          viewer.scene.globe.atmosphereLightIntensity = 8.0;
        }

        const pointCollection = viewer.scene.primitives.add(new Cesium.PointPrimitiveCollection());
        pointCollectionRef.current = pointCollection;

        const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

        handler.setInputAction((click: any) => {
          const pickedObject = viewer.scene.pick(click.position);
          if (Cesium.defined(pickedObject)) {
            if (pickedObject.primitive && pickedObject.primitive._satelliteRecord) {
              onSelectSatellite(pickedObject.primitive._satelliteRecord);
              setActiveTooltip(null);
              return;
            }
            if (pickedObject.id && pickedObject.id._eonetData) {
              const evt = pickedObject.id._eonetData;
              setActiveTooltip({
                title: evt.properties?.title || 'Natural Event',
                desc: `${evt.properties?.categories?.[0]?.title || 'Earth Hazard'} • ${new Date(
                  evt.properties?.date || Date.now()
                ).toLocaleDateString()}`,
                x: click.position.x,
                y: click.position.y
              });
              return;
            }
          }
          setActiveTooltip(null);
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        // Initial camera view
        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(-30.0, 20.0, 22000000.0),
          orientation: {
            heading: Cesium.Math.toRadians(0.0),
            pitch: Cesium.Math.toRadians(-90.0),
            roll: 0.0
          }
        });

        viewerRef.current = viewer;
        setCesiumReady(true);
        return true;
      } catch (err) {
        console.error('[CesiumGlobe] Error initializing Cesium:', err);
        return false;
      }
    }

    if (!initCesium()) {
      checkInterval = setInterval(() => {
        if (initCesium()) {
          clearInterval(checkInterval);
        }
      }, 300);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, [onSelectSatellite]);

  // Update Background Point Swarm (Throttled & Real-time)
  useEffect(() => {
    if (!cesiumReady || !viewerRef.current || !pointCollectionRef.current) return;
    const Cesium = (window as any).Cesium;
    const pointCollection = pointCollectionRef.current;
    pointCollection.removeAll();

    const normalStationColor = Cesium.Color.fromCssColorString('#eab308'); // 🟡 Gold: Space stations (ISS / Tiangong)
    const normalActiveColor = Cesium.Color.fromCssColorString('#06b6d4'); // 🔵 Cyan: Active working satellites (Starlink / GPS / Science)
    const debrisColor = Cesium.Color.fromCssColorString('#ef4444'); // 🔴 Red: Dangerous space junk & debris
    const stormAlertColor = Cesium.Color.fromCssColorString('#f97316'); // Orange: Severe storm drag alert

    for (const sat of satellites) {
      if (selectedSatellite && sat.noradId === selectedSatellite.noradId) {
        continue;
      }

      const pos = propagateSatellite(sat.satrec, simTime);
      if (
        !pos ||
        !Number.isFinite(pos.longitude) ||
        !Number.isFinite(pos.latitude) ||
        !Number.isFinite(pos.altitude) ||
        pos.latitude < -90 ||
        pos.latitude > 90 ||
        pos.longitude < -180 ||
        pos.longitude > 180 ||
        pos.altitude < -50 ||
        pos.altitude > 80000
      ) {
        continue;
      }

      let color = normalActiveColor; // Default: 🔵 Cyan Active working satellites
      let size = 4;

      if (sat.group === 'stations') {
        color = normalStationColor; // 🟡 Gold Space Stations (ISS)
        size = 7;
      } else if (sat.group.includes('debris')) {
        color = debrisColor; // 🔴 Red Dangerous Space Junk
        size = 4.5;
      } else {
        color = normalActiveColor; // 🔵 Cyan Active satellites (Starlink, GPS, Weather, Science)
        size = sat.group === 'gps-ops' ? 5 : 4;
      }

      if (scenario === 'solar_storm' && pos.altitude < 500 && sat.group !== 'stations' && !sat.group.includes('debris')) {
        color = stormAlertColor;
      }

      const cartesian = Cesium.Cartesian3.fromDegrees(pos.longitude, pos.latitude, pos.altitude * 1000);
      const point = pointCollection.add({
        position: cartesian,
        color: color,
        pixelSize: size,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 1
      });
      point._satelliteRecord = sat;
    }
  }, [cesiumReady, satellites, selectedSatellite, simTime, scenario]);

  // Real-Time Orbit Paths for Fleet / Debris Rings
  useEffect(() => {
    if (!cesiumReady || !viewerRef.current) return;
    const Cesium = (window as any).Cesium;
    const viewer = viewerRef.current;

    // Clear previous fleet orbits
    fleetOrbitsEntitiesRef.current.forEach(ent => viewer.entities.remove(ent));
    fleetOrbitsEntitiesRef.current = [];

    if (!showFleetOrbits || satellites.length === 0) return;

    // Pick key satellites across categories: Stations, representative debris, GPS, Starlink
    const representativeSats = satellites.filter(
      (s, idx) => s.group === 'stations' || s.group.includes('debris') || idx % 12 === 0
    ).slice(0, 16);

    const newEntities: any[] = [];

    representativeSats.forEach(sat => {
      const isDebris = sat.group.includes('debris');
      const isStation = sat.group === 'stations';
      const orbitColor = isDebris
        ? Cesium.Color.fromCssColorString('rgba(244, 63, 94, 0.4)')
        : isStation
        ? Cesium.Color.fromCssColorString('rgba(250, 204, 21, 0.5)')
        : Cesium.Color.fromCssColorString('rgba(56, 189, 248, 0.25)');

      const { positions } = calculateOrbitPath(sat.satrec, simTime, 95, 120);
      const valid = positions.filter(p => Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z));
      if (valid.length > 2) {
        const cartesians = valid.map(p => new Cesium.Cartesian3(p.x, p.y, p.z));
        const ent = viewer.entities.add({
          name: `${sat.name} Orbit Trajectory`,
          polyline: {
            positions: cartesians,
            width: isStation || isDebris ? 1.5 : 1,
            material: new Cesium.PolylineGlowMaterialProperty({
              glowPower: 0.15,
              color: orbitColor
            })
          }
        });
        newEntities.push(ent);
      }
    });

    fleetOrbitsEntitiesRef.current = newEntities;
  }, [cesiumReady, satellites, showFleetOrbits]);

  // Persistent Selected Satellite Entity & Orbit Path (Fixes Target Tracking)
  useEffect(() => {
    if (!cesiumReady || !viewerRef.current) return;
    const Cesium = (window as any).Cesium;
    const viewer = viewerRef.current;

    if (!selectedSatellite) {
      if (selectedEntityRef.current) {
        viewer.entities.remove(selectedEntityRef.current);
        selectedEntityRef.current = null;
        currentSelectedNoradRef.current = null;
      }
      if (orbitPathEntityRef.current) {
        viewer.entities.remove(orbitPathEntityRef.current);
        orbitPathEntityRef.current = null;
      }
      if (groundTrackEntityRef.current) {
        viewer.entities.remove(groundTrackEntityRef.current);
        groundTrackEntityRef.current = null;
      }
      if (trackingMode) {
        setTrackingMode(false);
        viewer.trackedEntity = undefined;
      }
      return;
    }

    const currentPos = propagateSatellite(selectedSatellite.satrec, simTime);
    if (!currentPos || !Number.isFinite(currentPos.longitude) || !Number.isFinite(currentPos.latitude)) {
      return;
    }

    const satCartesian = Cesium.Cartesian3.fromDegrees(
      currentPos.longitude,
      currentPos.latitude,
      currentPos.altitude * 1000
    );

    const isStation = selectedSatellite.group === 'stations';
    const isDebris = selectedSatellite.group.includes('debris');
    const entityColor = isStation
      ? Cesium.Color.fromCssColorString('#eab308') // 🟡 Gold
      : isDebris
      ? Cesium.Color.fromCssColorString('#ef4444') // 🔴 Red
      : Cesium.Color.fromCssColorString('#06b6d4'); // 🔵 Cyan

    const orbitGlowColor = isStation
      ? Cesium.Color.fromCssColorString('#facc15')
      : isDebris
      ? Cesium.Color.fromCssColorString('#ef4444')
      : Cesium.Color.fromCssColorString('#06b6d4');

    const labelText = `${selectedSatellite.name}\nALT: ${Math.round(currentPos.altitude)} KM | VEL: ${currentPos.velocity.toFixed(2)} KM/S`;

    // If entity already exists for this satellite, update position smoothly without destroying
    if (selectedEntityRef.current && currentSelectedNoradRef.current === selectedSatellite.noradId) {
      selectedEntityRef.current.position = satCartesian;
      if (selectedEntityRef.current.label) {
        selectedEntityRef.current.label.text = labelText;
      }
      if (trackingMode && viewer.trackedEntity !== selectedEntityRef.current) {
        viewer.trackedEntity = selectedEntityRef.current;
      }
    } else {
      // Different satellite selected: clean and recreate entity
      if (selectedEntityRef.current) {
        viewer.entities.remove(selectedEntityRef.current);
      }
      if (orbitPathEntityRef.current) {
        viewer.entities.remove(orbitPathEntityRef.current);
      }
      if (groundTrackEntityRef.current) {
        viewer.entities.remove(groundTrackEntityRef.current);
      }

      const satEntity = viewer.entities.add({
        name: selectedSatellite.name,
        position: satCartesian,
        point: {
          pixelSize: 10,
          color: entityColor,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2
        },
        label: {
          text: labelText,
          font: '11px "JetBrains Mono", monospace',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -14),
          showBackground: true,
          backgroundColor: new Cesium.Color(0.04, 0.08, 0.16, 0.85)
        }
      });

      selectedEntityRef.current = satEntity;
      currentSelectedNoradRef.current = selectedSatellite.noradId;

      if (trackingMode) {
        viewer.trackedEntity = satEntity;
      }

      // Compute Selected Orbit Path (90 min)
      const { positions, geodetics } = calculateOrbitPath(selectedSatellite.satrec, simTime, 95, 60);
      const validPositions = positions.filter(p => Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z));
      if (validPositions.length > 1) {
        const cartesianList = validPositions.map(p => new Cesium.Cartesian3(p.x, p.y, p.z));
        const orbitEntity = viewer.entities.add({
          name: `${selectedSatellite.name} Orbit Path`,
          polyline: {
            positions: cartesianList,
            width: 2.5,
            material: new Cesium.PolylineGlowMaterialProperty({
              glowPower: 0.35,
              color: orbitGlowColor
            })
          }
        });
        orbitPathEntityRef.current = orbitEntity;

        const validGeodetics = geodetics.filter(g => Number.isFinite(g.lon) && Number.isFinite(g.lat));
        const groundCartesians = validGeodetics.map(g => Cesium.Cartesian3.fromDegrees(g.lon, g.lat, 500));
        if (groundCartesians.length > 1) {
          const groundEntity = viewer.entities.add({
            name: `${selectedSatellite.name} Ground Track`,
            polyline: {
              positions: groundCartesians,
              width: 1.5,
              material: new Cesium.PolylineDashMaterialProperty({
                color: Cesium.Color.fromCssColorString('rgba(56, 189, 248, 0.5)'),
                dashLength: 16.0
              })
            }
          });
          groundTrackEntityRef.current = groundEntity;
        }
      }
    }
  }, [cesiumReady, selectedSatellite, simTime, trackingMode]);

  // Conjunction Impact Zone Arc & Debris Visualization
  useEffect(() => {
    if (!cesiumReady || !viewerRef.current) return;
    const Cesium = (window as any).Cesium;
    const viewer = viewerRef.current;

    // Clear previous conjunction entities
    conjunctionEntitiesRef.current.forEach(ent => viewer.entities.remove(ent));
    conjunctionEntitiesRef.current = [];

    if (scenario !== 'conjunction' || !conjunctionPair) return;

    const primary = conjunctionPair.primary;
    const secondary = conjunctionPair.secondary;
    const missDistance = conjunctionPair.missDistanceKm;

    // Propagate both spacecraft
    const pPos = propagateSatellite(primary.satrec, simTime);
    const sPos = propagateSatellite(secondary.satrec, simTime);

    if (
      !pPos || !sPos ||
      !Number.isFinite(pPos.longitude) || !Number.isFinite(pPos.latitude) || !Number.isFinite(pPos.altitude) ||
      !Number.isFinite(sPos.longitude) || !Number.isFinite(sPos.latitude) || !Number.isFinite(sPos.altitude)
    ) {
      return;
    }

    const pCartesian = Cesium.Cartesian3.fromDegrees(pPos.longitude, pPos.latitude, pPos.altitude * 1000);
    const sCartesian = Cesium.Cartesian3.fromDegrees(sPos.longitude, sPos.latitude, sPos.altitude * 1000);

    const newEntities: any[] = [];

    // 1. Draw glowing Red Impact Zone Arc between primary and debris
    // Compute intermediate arc positions with a slight outward ballistic curve
    const arcPositions: any[] = [];
    const steps = 30;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      // Linear interpolation between the two positions
      const lerped = Cesium.Cartesian3.lerp(pCartesian, sCartesian, t, new Cesium.Cartesian3());
      // Add subtle radial curvature outward from Earth center for a 3D parabolic trajectory feel
      const norm = Cesium.Cartesian3.normalize(lerped, new Cesium.Cartesian3());
      const arcAltitudeBoost = Math.sin(t * Math.PI) * Math.min(missDistance * 1000 * 0.25, 40000);
      const elevated = Cesium.Cartesian3.multiplyByScalar(norm, arcAltitudeBoost, new Cesium.Cartesian3());
      const finalPoint = Cesium.Cartesian3.add(lerped, elevated, new Cesium.Cartesian3());
      arcPositions.push(finalPoint);
    }

    const arcEntity = viewer.entities.add({
      name: `Conjunction Impact Zone Arc: ${primary.name} ↔ ${secondary.name}`,
      polyline: {
        positions: arcPositions,
        width: 3.5,
        material: new Cesium.PolylineGlowMaterialProperty({
          glowPower: 0.45,
          taperPower: 0.15,
          color: Cesium.Color.fromCssColorString('#ef4444') // Subtle bright red glow
        })
      }
    });
    newEntities.push(arcEntity);

    // 2. Midpoint Impact Zone Hazard Label with Miss Distance
    const midPoint = arcPositions[Math.floor(arcPositions.length / 2)];
    const labelEntity = viewer.entities.add({
      name: 'Impact Zone Miss Distance',
      position: midPoint,
      label: {
        text: `⚠️ IMPACT ZONE: ${missDistance.toFixed(1)} KM MISS DISTANCE`,
        font: 'bold 11px "JetBrains Mono", monospace',
        fillColor: Cesium.Color.fromCssColorString('#fecaca'),
        outlineColor: Cesium.Color.fromCssColorString('#450a0a'),
        outlineWidth: 3,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        showBackground: true,
        backgroundColor: new Cesium.Color(0.2, 0.02, 0.04, 0.85),
        pixelOffset: new Cesium.Cartesian2(0, -18)
      }
    });
    newEntities.push(labelEntity);

    // 3. Highlight Secondary Debris Object in Glowing Red
    const debrisEntity = viewer.entities.add({
      name: `${secondary.name} (Conjunction Debris)`,
      position: sCartesian,
      point: {
        pixelSize: 12,
        color: Cesium.Color.fromCssColorString('#ef4444'),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2
      },
      label: {
        text: `[DEBRIS] ${secondary.name}`,
        font: '10px "JetBrains Mono", monospace',
        fillColor: Cesium.Color.fromCssColorString('#fca5a5'),
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(0, 14),
        showBackground: true,
        backgroundColor: new Cesium.Color(0.25, 0.02, 0.04, 0.8)
      }
    });
    newEntities.push(debrisEntity);

    conjunctionEntitiesRef.current = newEntities;
  }, [cesiumReady, scenario, conjunctionPair, simTime]);

  // EONET Natural Hazards
  useEffect(() => {
    if (!cesiumReady || !viewerRef.current) return;
    const Cesium = (window as any).Cesium;
    const viewer = viewerRef.current;

    const eonetDataSource = viewer.entities.values.filter((e: any) => e._isEonet);
    eonetDataSource.forEach((e: any) => viewer.entities.remove(e));

    if (!showEonet || !eonetEvents || eonetEvents.length === 0) return;

    eonetEvents.slice(0, 40).forEach(evt => {
      const coords = evt.geometry?.coordinates;
      if (Array.isArray(coords) && coords.length >= 2) {
        const lon = coords[0];
        const lat = coords[1];
        if (Number.isFinite(lon) && Number.isFinite(lat)) {
          const entity = viewer.entities.add({
            name: evt.properties?.title || 'Earth Hazard',
            position: Cesium.Cartesian3.fromDegrees(lon, lat, 1000),
            billboard: {
              image:
                'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="%23f97316" stroke="%23ffffff" stroke-width="2"><circle cx="12" cy="12" r="8"/><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>',
              width: 16,
              height: 16
            }
          });
          entity._isEonet = true;
          entity._eonetData = evt;
        }
      }
    });
  }, [cesiumReady, eonetEvents, showEonet]);

  // Camera Actions
  const resetCamera = useCallback(() => {
    if (!viewerRef.current) return;
    const Cesium = (window as any).Cesium;
    setTrackingMode(false);
    viewerRef.current.trackedEntity = undefined;
    viewerRef.current.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(-30.0, 20.0, 22000000.0),
      duration: 1.5
    });
  }, []);

  const focusSatellite = useCallback(() => {
    if (!viewerRef.current || !selectedSatellite) return;
    const Cesium = (window as any).Cesium;
    const pos = propagateSatellite(selectedSatellite.satrec, simTime);
    if (!pos) return;

    if (trackingMode) {
      // Toggle tracking off
      setTrackingMode(false);
      viewerRef.current.trackedEntity = undefined;
    } else {
      // Toggle tracking on and lock camera
      setTrackingMode(true);
      if (selectedEntityRef.current) {
        viewerRef.current.trackedEntity = selectedEntityRef.current;
      }
      viewerRef.current.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          pos.longitude,
          pos.latitude,
          (pos.altitude + 2500) * 1000
        ),
        duration: 1.2
      });
    }
  }, [selectedSatellite, simTime, trackingMode]);

  const topDownView = useCallback(() => {
    if (!viewerRef.current) return;
    const Cesium = (window as any).Cesium;
    setTrackingMode(false);
    viewerRef.current.trackedEntity = undefined;
    viewerRef.current.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(0.0, 90.0, 24000000.0),
      duration: 1.2
    });
  }, []);

  return (
    <div className="relative w-full h-full bg-[#030305] overflow-hidden select-none">
      {/* 3D Canvas Container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Sleek Minimalist Loading Screen */}
      {!cesiumReady && (
        <div className="absolute inset-0 bg-[#030305] flex flex-col items-center justify-center space-y-3 z-20">
          <div className="relative w-12 h-12">
            <div className="w-12 h-12 rounded-full border border-rose-500/20 border-t-rose-500 animate-spin" />
            <Crosshair className="absolute inset-0 m-auto w-4 h-4 text-rose-500/80 animate-pulse" />
          </div>
          <div className="text-center font-mono">
            <div className="text-zinc-200 text-xs tracking-wider uppercase font-medium">INITIALIZING ORBITAL GRID</div>
            <div className="text-zinc-500 text-[10px] mt-0.5">Mounting SGP4 & Natural Earth II</div>
          </div>
        </div>
      )}

      {/* Solar Storm Alert Glow (Scenario 02) */}
      {scenario === 'solar_storm' && (
        <div className="absolute inset-0 pointer-events-none ring-inset ring-1 ring-rose-500/30 bg-gradient-to-t from-rose-950/20 via-transparent to-rose-950/20 z-10 flex items-start justify-center pt-3">
          <div className="bg-rose-950/85 border border-rose-500/60 px-3.5 py-1 rounded-full text-xs font-mono text-rose-200 flex items-center space-x-2 backdrop-blur-2xl shadow-xl shadow-rose-950/40 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span className="font-semibold text-[11px] tracking-wide">HISTORIC G5 STORM (MAY 2024 REPLAY) • Kp 9.0 THERMOSPHERIC EXPANSION</span>
          </div>
        </div>
      )}

      {/* Floating Camera Toolbar with InfoButtons (Apple Pill) */}
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 flex items-center space-x-1.5 bg-black/70 border border-white/10 backdrop-blur-2xl rounded-full p-1.5 shadow-2xl">
        <div className="flex items-center space-x-0.5">
          <button
            onClick={resetCamera}
            title="Reset Global Earth View"
            className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            <GlobeIcon className="w-4 h-4" />
          </button>
          <InfoButton
            title="Reset Global View"
            description="Restores the camera view back to the global overview of planet Earth."
          />
        </div>

        {selectedSatellite && (
          <div className="flex items-center space-x-0.5 pl-1 border-l border-white/10">
            <button
              onClick={focusSatellite}
              title={trackingMode ? "Tracking Active (Click to release)" : "Track Selected Target"}
              className={`p-1.5 rounded-full transition-all ${
                trackingMode ? 'bg-rose-600 text-white shadow-[0_0_12px_#e11d48]' : 'hover:bg-white/10 text-zinc-400 hover:text-white'
              }`}
            >
              <Eye className="w-4 h-4" />
            </button>
            <InfoButton
              title="Track Target"
              description="Locks the camera onto the selected spacecraft in real time, following it as it orbits Earth at 17,500 mph."
              details={trackingMode ? "Status: TRACKING LOCKED" : "Status: IDLE (Click to lock)"}
            />
          </div>
        )}

        <div className="flex items-center space-x-0.5 pl-1 border-l border-white/10">
          <button
            onClick={topDownView}
            title="Polar Top-Down Orientation"
            className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <InfoButton
            title="Polar View"
            description="Orbits camera directly over Earth's North Pole to observe inclination angles and orbital plane crossings."
          />
        </div>

        {/* Real-time Orbit Lines Toggle */}
        <div className="flex items-center space-x-0.5 pl-1 border-l border-white/10">
          <button
            onClick={() => setShowFleetOrbits(!showFleetOrbits)}
            title={showFleetOrbits ? "Hide 3D Orbit Lines" : "Show 3D Orbit Lines"}
            className={`p-1.5 rounded-full transition-all ${
              showFleetOrbits ? 'bg-white/15 text-white' : 'text-zinc-500 hover:text-white hover:bg-white/10'
            }`}
          >
            <CircleDot className="w-4 h-4" />
          </button>
          <InfoButton
            title="Real-Time 3D Orbits"
            description="Toggles 3D orbital trajectory ribbons around Earth for the space station, active constellations, and debris clouds."
            details={showFleetOrbits ? "Orbits: VISIBLE" : "Orbits: HIDDEN"}
          />
        </div>
      </div>

      {/* Color Code Legend Pill */}
      <div className="absolute top-2 left-2 right-2 sm:left-auto sm:right-4 sm:top-4 z-20 bg-black/75 border border-white/10 backdrop-blur-2xl rounded-2xl sm:rounded-full px-3 py-1.5 text-[10px] sm:text-[11px] text-zinc-300 flex flex-wrap sm:flex-nowrap items-center justify-center sm:justify-start gap-3 sm:gap-3 shadow-xl font-mono">
        <div className="flex items-center space-x-1.5" title="🟡 Gold: Giant space stations (ISS / Tiangong)">
          <span className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_8px_#facc15]" />
          <span className="text-zinc-300 font-semibold tracking-tight">Stations</span>
        </div>
        <div className="flex items-center space-x-1.5" title="🔵 Cyan: Active working satellites (Starlink, GPS)">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
          <span className="text-zinc-300 font-semibold tracking-tight">Active</span>
        </div>
        <div className="flex items-center space-x-1.5" title="🔴 Red: Dangerous space junk & debris">
          <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
          <span className="text-zinc-300 font-semibold tracking-tight">Debris</span>
        </div>
        <span className="hidden sm:inline text-zinc-600">|</span>
        <div className="flex items-center space-x-2">
          <span className="text-zinc-400">{satellites.length} FOV</span>
          <InfoButton
            title="Orbital Color Legend"
            description="🟡 Gold: Giant space stations (ISS, Tiangong). 🔵 Cyan: Active working satellites (Starlink, GPS, weather, science). 🔴 Red: Dangerous space junk & orbital debris clouds."
            placement="bottom"
          />
        </div>
      </div>

      {/* Interactive Tooltip */}
      {activeTooltip && (
        <div
          className="absolute z-30 bg-zinc-950/95 border border-white/15 rounded-2xl px-3.5 py-2 text-xs font-mono text-zinc-200 pointer-events-auto backdrop-blur-2xl shadow-2xl max-w-xs"
          style={{ left: Math.min(window.innerWidth - 260, activeTooltip.x + 10), top: activeTooltip.y - 45 }}
        >
          <div className="font-semibold text-rose-300 truncate">{activeTooltip.title}</div>
          <div className="text-[10px] text-zinc-400 mt-0.5">{activeTooltip.desc}</div>
        </div>
      )}
    </div>
  );
};
