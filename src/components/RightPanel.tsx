/**
 * RIGHT PANEL COMPONENT (AI OPS & TELEMETRY INSPECTOR)
 * Features 3D Flip Card: Plain English (12-year-old style) <-> Professional Flight Dynamics
 * Enhanced Backyard Pass Predictor with local device time, countdown & trajectory
 * Working Evaluate button with fresh force analysis and InfoButtons.
 */

import React, { useState } from 'react';
import { SpacecraftRecord, SatellitePosition, GroundPass } from '../services/orbitalEngine.ts';
import { ComputedRisk } from '../services/riskCalculator.ts';
import { AnalyzeResult } from '../services/apiClient.ts';
import {
  Cpu,
  Compass,
  Sun,
  Radio,
  CheckCircle2,
  AlertTriangle,
  X,
  Sparkles,
  Repeat,
  MapPin,
  Eye,
  ShieldCheck,
  Flame,
  HelpCircle
} from 'lucide-react';
import { InfoButton } from './InfoButton.tsx';

interface RightPanelProps {
  selectedSatellite: SpacecraftRecord | null;
  currentPosition: SatellitePosition | null;
  computedRisk: ComputedRisk | null;
  aiAnalysis: AnalyzeResult | null;
  isAnalyzing: boolean;
  nextPass: GroundPass | null;
  spaceWeather: {
    kp: number;
    gScale: string;
    solarWindSpeed: string;
    xrayClass: string;
    flareClass24h: string;
    alertsCount: number;
  };
  onTriggerAnalyze: (force?: boolean) => void;
  onDetectBackyard?: () => void;
  userCoords?: { lat: number; lon: number };
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  selectedSatellite,
  currentPosition,
  computedRisk,
  aiAnalysis,
  isAnalyzing,
  nextPass,
  spaceWeather,
  onTriggerAnalyze,
  onDetectBackyard,
  userCoords = { lat: 28.5721, lon: -80.648 },
  isMobileOpen = false,
  onCloseMobile
}) => {
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  const containerClasses = `
    flex flex-col select-none transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]
    ${isMobileOpen 
      ? 'fixed bottom-0 inset-x-0 h-[80vh] z-50 bg-zinc-950/95 backdrop-blur-3xl border-t border-white/10 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] translate-y-0 pb-safe' 
      : 'fixed bottom-0 inset-x-0 h-[80vh] z-50 bg-zinc-950/95 backdrop-blur-3xl border-t border-white/10 rounded-t-3xl translate-y-full pb-safe lg:translate-y-0'}
    lg:static lg:h-[calc(100vh-3.5rem)] lg:w-88 xl:w-96 lg:bg-black/50 lg:backdrop-blur-2xl lg:border-l lg:border-white/[0.08] lg:border-t-0 lg:rounded-none lg:shadow-none
    ${!isMobileOpen ? 'max-lg:pointer-events-none' : ''}
  `;

  if (!selectedSatellite) {
    return (
      <aside className={containerClasses}>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-zinc-500">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-3">
            <Radio className="w-5 h-5 text-zinc-400 animate-pulse" />
          </div>
          <div className="text-sm font-semibold text-zinc-300">Select Spacecraft</div>
          <p className="text-xs text-zinc-500 mt-1 max-w-xs leading-relaxed">
            Click any point on the globe or search from the registry to view AI flight intelligence.
          </p>
        </div>
      </aside>
    );
  }

  const assessment = aiAnalysis?.assessment;

  const getRiskStyle = (level?: string) => {
    switch (level?.toUpperCase()) {
      case 'HIGH':
        return {
          pill: 'bg-rose-500 text-white shadow-[0_0_12px_rgba(225,29,72,0.4)]',
          border: 'border-rose-500/40 bg-rose-950/20',
          text: 'text-rose-400',
          easyLabel: 'High Alert! (Action Needed)'
        };
      case 'ELEVATED':
        return {
          pill: 'bg-amber-500 text-zinc-950 shadow-[0_0_10px_rgba(245,158,11,0.3)]',
          border: 'border-amber-500/40 bg-amber-950/20',
          text: 'text-amber-400',
          easyLabel: 'Caution: Space Weather Rising'
        };
      case 'MODERATE':
        return {
          pill: 'bg-sky-500 text-zinc-950 shadow-[0_0_10px_rgba(56,189,248,0.3)]',
          border: 'border-sky-500/40 bg-sky-950/20',
          text: 'text-sky-400',
          easyLabel: 'Watchful: Mild Solar Wind'
        };
      default:
        return {
          pill: 'bg-emerald-500 text-zinc-950 shadow-[0_0_10px_rgba(52,211,153,0.3)]',
          border: 'border-emerald-500/30 bg-emerald-950/15',
          text: 'text-emerald-400',
          easyLabel: 'Safe & Cruising Smoothly'
        };
    }
  };

  const riskStyle = getRiskStyle(computedRisk?.level);

  let orbitClass = 'LEO (Low Earth Orbit)';
  if (currentPosition) {
    if (currentPosition.altitude > 35000) orbitClass = 'GEO (Geostationary)';
    else if (currentPosition.altitude > 2000) orbitClass = 'MEO (Medium Orbit)';
  }

  // Calculate countdown to next pass
  let passCountdown = '';
  if (nextPass?.aos) {
    const diffMs = nextPass.aos.getTime() - Date.now();
    if (diffMs > 0) {
      const diffMins = Math.round(diffMs / 60000);
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      passCountdown = hours > 0 ? `In ${hours}h ${mins}m` : `In ${mins} mins`;
    } else {
      passCountdown = 'Pass in progress now!';
    }
  }

  return (
    <>
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="lg:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity"
        />
      )}

      <aside className={containerClasses}>
        {/* Mobile Drag Handle */}
        <div className="lg:hidden w-full flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-zinc-600/50" />
        </div>

        {/* Header & Target Title */}
        <div className="p-4 pt-1 lg:pt-4 border-b border-white/[0.06] flex items-center justify-between">
          <div>
            <div className="font-bold text-sm text-white truncate max-w-[210px] tracking-tight">
              {selectedSatellite.name}
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5 flex items-center space-x-2 font-mono">
              <span>#{selectedSatellite.noradId}</span>
              <span>•</span>
              <span>{orbitClass.split(' ')[0]}</span>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            {/* Mobile Close Button */}
            {isMobileOpen && onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="lg:hidden p-1.5 rounded-full bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            
            {/* Working Evaluate Button with InfoButton */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => onTriggerAnalyze(true)}
                disabled={isAnalyzing}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-semibold shadow-[0_0_12px_rgba(225,29,72,0.4)] transition-all disabled:opacity-50"
              >
                <Cpu className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                <span>{isAnalyzing ? 'Evaluating...' : 'Evaluate'}</span>
              </button>
              <InfoButton
                title="AI Flight Dynamics Evaluation"
                description="Sends current physical orbital state vectors and space weather to Gemini 3.8 to synthesize an updated operational assessment."
                details="Runs real-time physics check & deterministic risk validation."
              />
            </div>

            {isMobileOpen && onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto divide-y divide-white/[0.05] p-4 space-y-4">
          {/* SECTION 1: FLIP CARD (Plain English <-> Professional Language) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center space-x-1.5">
                <span className="font-semibold text-zinc-300 uppercase tracking-wider text-[10px]">
                  {isCardFlipped ? 'Professional Aerospace Telemetry' : 'Space Flight Summary (Plain English)'}
                </span>
                <InfoButton
                  title="Interactive Flip Card"
                  description="Tap the card or the flip button to toggle between an easy 12-year-old friendly explanation and rigorous aerospace flight dynamics language."
                />
              </div>

              {/* Flip Button */}
              <button
                onClick={() => setIsCardFlipped(!isCardFlipped)}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-zinc-200 text-[10px] font-medium transition-all"
              >
                <Repeat className="w-3 h-3 text-rose-400" />
                <span>{isCardFlipped ? 'Show Easy Mode' : 'Show Pro Mode'}</span>
              </button>
            </div>

            {/* THE FLIP CARD CONTAINER */}
            <div
              onClick={() => setIsCardFlipped(!isCardFlipped)}
              className="cursor-pointer transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
            >
              {!isCardFlipped ? (
                /* FRONT: EASY / 12-YEAR-OLD EXPLANATION */
                <div className={`p-4 rounded-3xl border ${riskStyle.border} backdrop-blur-2xl space-y-3 shadow-xl transition-all`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="p-1.5 rounded-xl bg-rose-500/10 text-rose-400">
                        <Sparkles className="w-4 h-4" />
                      </span>
                      <div>
                        <span className="text-[10px] uppercase font-mono text-zinc-400 block">Status Level</span>
                        <span className="font-bold text-xs text-white">{riskStyle.easyLabel}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-zinc-300">
                      Tap to flip ↺
                    </span>
                  </div>

                  {/* Fun Easy Analogy */}
                  <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-xs leading-relaxed space-y-2">
                    <div>
                      <span className="text-[10px] font-semibold text-rose-300 uppercase tracking-wide block">
                        What&apos;s happening up there?
                      </span>
                      <p className="text-zinc-200 text-xs mt-0.5">
                        {assessment?.easy_explanation ||
                          'The satellite is safely zooming around Earth at 17,500 miles per hour! Space is calm and clear right now, so it has a totally smooth ride.'}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-white/[0.04]">
                      <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wide block">
                        Mission Captain Advice
                      </span>
                      <p className="text-emerald-200 text-xs mt-0.5">
                        {assessment?.easy_recommendation ||
                          'Sit back, keep watching the radar, and enjoy tracking this spacecraft across the world!'}
                      </p>
                    </div>
                  </div>

                  <div className="text-center text-[10px] text-zinc-500 italic">
                    Tap card to switch to Professional Flight Dynamics language ↺
                  </div>
                </div>
              ) : (
                /* BACK: PROFESSIONAL AEROSPACE LANGUAGE */
                <div className="p-4 rounded-3xl border border-white/15 bg-zinc-950/90 backdrop-blur-2xl space-y-3 shadow-xl transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="p-1.5 rounded-xl bg-sky-500/10 text-sky-400">
                        <ShieldCheck className="w-4 h-4" />
                      </span>
                      <div>
                        <span className="text-[10px] uppercase font-mono text-zinc-400 block">Deterministic Risk Score</span>
                        <span className="font-bold text-xs text-white">
                          Index {computedRisk?.score ?? 0} / 100 • {computedRisk?.level || 'LOW'}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-zinc-300">
                      Tap to flip ↺
                    </span>
                  </div>

                  {/* Confidence */}
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1 font-mono">
                      <span>Covariance Confidence</span>
                      <span className="text-zinc-200">{Math.round((assessment?.confidence || 0.88) * 100)}%</span>
                    </div>
                    <div className="w-full bg-white/[0.08] rounded-full h-1 overflow-hidden">
                      <div
                        className="bg-rose-500 h-1 rounded-full"
                        style={{ width: `${Math.round((assessment?.confidence || 0.88) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Rigorous Flight Dynamics Analysis */}
                  <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-xs space-y-2 font-sans">
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider block">
                        Primary Perturbation Factor
                      </span>
                      <span className="font-semibold text-zinc-200 mt-0.5 block leading-snug">
                        {assessment?.primary_factor || computedRisk?.summary}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider block">
                        Subsystem Exposure
                      </span>
                      <span className="text-zinc-300 mt-0.5 block">
                        {assessment?.affected_system || 'Attitude & Orbit Control System (AOCS)'}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-white/[0.04]">
                      <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider block mb-1">
                        Operational Assessment
                      </span>
                      <p className="text-zinc-300 text-[11px] leading-relaxed">
                        {assessment?.explanation ||
                          'Ephemeris propagation is within standard thermal and drag tolerances. No orbital intervention required.'}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-white/[0.04]">
                      <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider block mb-1">
                        Flight Control Action
                      </span>
                      <p className="text-emerald-300 text-[11px]">
                        {assessment?.recommended_action ||
                          'Maintain nominal ephemeris tracking and verify scheduled ground station passes.'}
                      </p>
                    </div>

                    {assessment?.evidence && assessment.evidence.length > 0 && (
                      <div className="pt-2 border-t border-white/[0.04]">
                        <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider block mb-1">
                          Cited Telemetry Facts
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {assessment.evidence.map((ev, i) => (
                            <span
                              key={i}
                              className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-white/[0.04] text-zinc-400 border border-white/[0.06]"
                            >
                              {ev}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-center text-[10px] text-zinc-500 italic">
                    Tap card to switch back to Plain English mode ↺
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 2: "WHEN CAN I SEE IT FROM MY BACKYARD?" (Pass Predictions) */}
          <div className="space-y-3 pt-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-zinc-300 text-xs font-semibold uppercase tracking-wider">
                <Compass className="w-3.5 h-3.5 text-rose-400" />
                <span>When Can I See It From My Backyard?</span>
              </div>
              <InfoButton
                title="Backyard Pass Predictor"
                description="Calculates the exact time, elevation angle, and compass direction when this satellite will fly directly over your horizon."
                details="Uses SGP4 line-of-sight geometry relative to your device GPS coordinates."
              />
            </div>

            {/* Backyard Location Bar */}
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1.5 text-zinc-300">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  <span className="font-medium">
                    Backyard: {userCoords.lat.toFixed(2)}°N, {userCoords.lon.toFixed(2)}°W
                  </span>
                </div>

                {onDetectBackyard && (
                  <button
                    onClick={onDetectBackyard}
                    className="text-[10px] font-medium text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 px-2 py-0.5 rounded-full transition-colors flex items-center space-x-1"
                  >
                    <span>Use My GPS</span>
                  </button>
                )}
              </div>

              {nextPass ? (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-mono font-bold text-sm">
                        {nextPass.aos.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                      <div className="text-[11px] text-rose-400 font-semibold font-mono">
                        {passCountdown} ({nextPass.aos.toLocaleDateString()})
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-white/[0.08] text-white border border-white/10">
                        Peak: {nextPass.maxElevation}° El
                      </span>
                      <div className="text-[10px] text-zinc-400 font-mono mt-1">
                        Duration: {Math.round(nextPass.durationSeconds / 60)} min
                      </div>
                    </div>
                  </div>

                  {nextPass.compassTrajectory && (
                    <div className="text-[11px] text-zinc-300 font-mono bg-white/[0.02] p-2 rounded-xl border border-white/[0.04]">
                      {nextPass.compassTrajectory}
                    </div>
                  )}

                  {nextPass.visibilityNote && (
                    <div className="flex items-center space-x-1.5 text-[11px] text-emerald-300 bg-emerald-950/20 border border-emerald-500/20 p-2 rounded-xl">
                      <Eye className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{nextPass.visibilityNote}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-zinc-500 text-xs py-2 text-center">
                  Searching orbital passes over your horizon...
                </div>
              )}
            </div>
          </div>

          {/* SECTION 3: SGP4 DYNAMICS */}
          <div className="space-y-3 pt-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-zinc-300 text-[10px] font-semibold uppercase tracking-wider">
                <Compass className="w-3.5 h-3.5 text-rose-400" />
                <span>Calculated Ephemeris (SGP4)</span>
              </div>
              <InfoButton
                title="SGP4 Orbital Dynamics"
                description="Deterministic orbital elements calculated in-browser using Simplified General Perturbations 4 (SGP4) mathematics."
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <span className="text-[10px] text-zinc-500 font-mono block">Altitude</span>
                <span className="text-sm font-semibold font-mono text-white">
                  {currentPosition ? `${Math.round(currentPosition.altitude)} km` : '---'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <span className="text-[10px] text-zinc-500 font-mono block">Velocity</span>
                <span className="text-sm font-semibold font-mono text-white">
                  {currentPosition ? `${currentPosition.velocity.toFixed(2)} km/s` : '---'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <span className="text-[10px] text-zinc-500 font-mono block">Inclination</span>
                <span className="font-semibold font-mono text-zinc-200">
                  {selectedSatellite.inclination.toFixed(2)}°
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <span className="text-[10px] text-zinc-500 font-mono block">Period</span>
                <span className="font-semibold font-mono text-zinc-200">
                  {selectedSatellite.periodMinutes.toFixed(1)} m
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 4: SPACE WEATHER */}
          <div className="space-y-3 pt-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-zinc-300 text-[10px] font-semibold uppercase tracking-wider">
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Space Weather Telemetry</span>
              </div>
              <InfoButton
                title="Space Weather Telemetry"
                description="Live space weather from NOAA SWPC and NASA DONKI measuring solar wind velocity, geomagnetic storm severity (Kp index), and solar flare classification."
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <span className="text-[10px] text-zinc-500 font-mono block">Planetary Kp</span>
                <span className="text-sm font-semibold font-mono text-white">
                  Kp {spaceWeather.kp.toFixed(1)}
                </span>
                <span className="text-[10px] text-rose-400 font-mono block mt-0.5">
                  {spaceWeather.gScale}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <span className="text-[10px] text-zinc-500 font-mono block">Solar Wind</span>
                <span className="text-sm font-semibold font-mono text-white">
                  {spaceWeather.solarWindSpeed} km/s
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <span className="text-[10px] text-zinc-500 font-mono block">X-Ray Class</span>
                <span className="font-semibold font-mono text-amber-300">
                  {spaceWeather.xrayClass}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <span className="text-[10px] text-zinc-500 font-mono block">24h Flare Max</span>
                <span className="font-semibold font-mono text-zinc-200">
                  {spaceWeather.flareClass24h || 'None > C'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
