/**
 * BOTTOM STRIP / FLOATING TELEMETRY DOCK
 * Redesigned with Apple minimalism & Ferrari sleek precision.
 * Unobtrusive floating glass dock that expands into a rich situational sheet.
 * Includes InfoButtons on all environmental panels and telemetry triggers.
 */

import React, { useState } from 'react';
import {
  Sun,
  ShieldAlert,
  ChevronUp,
  X
} from 'lucide-react';
import { InfoButton } from './InfoButton.tsx';

interface BottomStripProps {
  scenario: 'normal' | 'solar_storm' | 'conjunction';
  donkiFlares: any[];
  donkiCmes: any[];
  donkiGst: any[];
  eonetEvents: any[];
  upcomingLaunches: any[];
  spacexHistory: any[];
  neoList: any[];
  riskCounts: { low: number; moderate: number; elevated: number; high: number };
  totalSatellites: number;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const BottomStrip: React.FC<BottomStripProps> = ({
  scenario,
  donkiFlares,
  donkiCmes,
  donkiGst,
  eonetEvents,
  upcomingLaunches,
  spacexHistory,
  neoList,
  riskCounts,
  totalSatellites,
  isMobileOpen = false,
  onCloseMobile
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [eventsTab, setEventsTab] = useState<'hazards' | 'launches' | 'spacex' | 'neo'>('hazards');

  // Next Earth-directed CME
  const latestCme = donkiCmes?.[0];
  const cmeAnalysis = latestCme?.cmeAnalyses?.[0];
  const enlil = cmeAnalysis?.enlilList?.[0];
  const arrivalTime = enlil?.estimatedShockArrivalTime || 'No shock predicted';

  // If mobile drawer requested
  const isSheetOpen = isExpanded || isMobileOpen;

  return (
    <>
      {/* Expanded Modal / Sheet */}
      {isSheetOpen && (
        <>
          <div
            onClick={() => {
              setIsExpanded(false);
              if (onCloseMobile) onCloseMobile();
            }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
          />

          <div className="fixed bottom-0 inset-x-0 sm:bottom-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[94vw] sm:max-w-5xl z-50 bg-zinc-950/95 rounded-t-3xl sm:rounded-3xl border-t sm:border border-white/10 shadow-2xl p-4 sm:p-5 pb-safe backdrop-blur-3xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-full duration-300">
            {/* Mobile Drag Handle */}
            <div className="sm:hidden w-full flex justify-center pb-3">
              <div className="w-10 h-1 rounded-full bg-zinc-600/50" />
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-3">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_#e11d48]" />
                <span className="font-bold text-sm text-white tracking-tight">Space Environment & Operations Telemetry</span>
                <InfoButton
                  title="Environmental Telemetry Hub"
                  description="Cross-references real-time space weather (NOAA & NASA DONKI), terrestrial hazards (NASA EONET), rocket launches, and near-Earth asteroids."
                />
              </div>
              <button
                onClick={() => {
                  setIsExpanded(false);
                  if (onCloseMobile) onCloseMobile();
                }}
                className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 3 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Card 1: Solar Weather */}
              <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1.5 text-xs font-semibold text-amber-400">
                    <Sun className="w-3.5 h-3.5" />
                    <span>Solar Activity (DONKI)</span>
                    <InfoButton
                      title="NASA DONKI Activity"
                      description="Database of Notifications, Knowledge, Information. Tracks solar flares, coronal mass ejections, and geomagnetic storms impacting Earth."
                    />
                  </div>
                  {scenario === 'solar_storm' ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/30">
                      May &apos;24 Event
                    </span>
                  ) : (
                    <span className="text-[10px] text-zinc-500 font-mono">30D Window</span>
                  )}
                </div>

                {scenario === 'solar_storm' ? (
                  <div className="space-y-2 py-2">
                    <div className="text-[11px] text-zinc-400">May 8–14 Severe Storm Sequence:</div>
                    <div className="flex items-center space-x-1 text-[10px]">
                      <div className="bg-rose-950/60 border border-rose-500/40 p-1.5 rounded-xl flex-1 text-center">
                        <div className="text-rose-400 font-bold">X5.8 Flare</div>
                        <div className="text-zinc-500 text-[9px]">May 8-10</div>
                      </div>
                      <span className="text-zinc-600">→</span>
                      <div className="bg-amber-950/60 border border-amber-500/40 p-1.5 rounded-xl flex-1 text-center">
                        <div className="text-amber-400 font-bold">CME Front</div>
                        <div className="text-zinc-500 text-[9px]">1680 km/s</div>
                      </div>
                      <span className="text-zinc-600">→</span>
                      <div className="bg-rose-950/80 border border-rose-500 p-1.5 rounded-xl flex-1 text-center">
                        <div className="text-white font-bold">Kp=9.0</div>
                        <div className="text-rose-300 text-[9px]">G5 Extreme</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 py-2 text-center">
                    <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                      <span className="text-[10px] text-zinc-500 font-mono block">Flares</span>
                      <span className="text-sm font-semibold font-mono text-amber-300">
                        {donkiFlares.length || 0}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                      <span className="text-[10px] text-zinc-500 font-mono block">CMEs</span>
                      <span className="text-sm font-semibold font-mono text-sky-400">
                        {donkiCmes.length || 0}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                      <span className="text-[10px] text-zinc-500 font-mono block">Storms</span>
                      <span className="text-sm font-semibold font-mono text-emerald-400">
                        {donkiGst.length || 0}
                      </span>
                    </div>
                  </div>
                )}

                <div className="text-[10px] text-zinc-500 font-mono pt-2 border-t border-white/[0.04] flex items-center justify-between">
                  <span>CME Arrival:</span>
                  <span className="text-zinc-300 truncate max-w-[170px]">{arrivalTime}</span>
                </div>
              </div>

              {/* Card 2: Orbital Risk */}
              <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1.5 text-xs font-semibold text-zinc-300">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                    <span>Orbital Risk Spectrum</span>
                    <InfoButton
                      title="Orbital Risk Spectrum"
                      description="Calculates distribution of physical danger levels across all monitored satellites based on altitude, thermospheric drag, and conjunction geometry."
                    />
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">{totalSatellites} Monitored</span>
                </div>

                <div className="space-y-2 py-2">
                  <div className="flex h-2 rounded-full overflow-hidden bg-white/[0.05] gap-0.5">
                    <div
                      style={{ width: `${(riskCounts.low / Math.max(1, totalSatellites)) * 100}%` }}
                      className="bg-emerald-500 h-full"
                    />
                    <div
                      style={{ width: `${(riskCounts.moderate / Math.max(1, totalSatellites)) * 100}%` }}
                      className="bg-sky-500 h-full"
                    />
                    <div
                      style={{ width: `${(riskCounts.elevated / Math.max(1, totalSatellites)) * 100}%` }}
                      className="bg-amber-500 h-full"
                    />
                    <div
                      style={{ width: `${(riskCounts.high / Math.max(1, totalSatellites)) * 100}%` }}
                      className="bg-rose-500 h-full"
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-1 text-center font-mono text-[10px]">
                    <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400">
                      <span className="block text-[9px] text-zinc-500">Low</span>
                      <span className="font-bold">{riskCounts.low}</span>
                    </div>
                    <div className="p-1 rounded-lg bg-sky-500/10 text-sky-400">
                      <span className="block text-[9px] text-zinc-500">Mod</span>
                      <span className="font-bold">{riskCounts.moderate}</span>
                    </div>
                    <div className="p-1 rounded-lg bg-amber-500/10 text-amber-400">
                      <span className="block text-[9px] text-zinc-500">Elev</span>
                      <span className="font-bold">{riskCounts.elevated}</span>
                    </div>
                    <div className="p-1 rounded-lg bg-rose-500/10 text-rose-400">
                      <span className="block text-[9px] text-zinc-500">High</span>
                      <span className="font-bold">{riskCounts.high}</span>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-zinc-500 font-mono pt-2 border-t border-white/[0.04] flex items-center justify-between">
                  <span>Atmospheric Drag:</span>
                  <span className={scenario === 'solar_storm' ? 'text-rose-400 font-semibold' : 'text-emerald-400'}>
                    {scenario === 'solar_storm' ? 'Severe Surge' : 'Nominal'}
                  </span>
                </div>
              </div>

              {/* Card 3: Events & Launches */}
              <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col justify-between">
                <div className="flex items-center space-x-1 border-b border-white/[0.04] pb-2">
                  <button
                    onClick={() => setEventsTab('hazards')}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition-all ${
                      eventsTab === 'hazards' ? 'bg-white text-zinc-950 font-semibold' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Hazards ({eonetEvents.length})
                  </button>
                  <button
                    onClick={() => setEventsTab('launches')}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition-all ${
                      eventsTab === 'launches' ? 'bg-white text-zinc-950 font-semibold' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Launches ({upcomingLaunches.length})
                  </button>
                  {spacexHistory && spacexHistory.length > 0 && (
                    <button
                      onClick={() => setEventsTab('spacex')}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition-all ${
                        eventsTab === 'spacex' ? 'bg-white text-zinc-950 font-semibold' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      SpaceX
                    </button>
                  )}
                  <button
                    onClick={() => setEventsTab('neo')}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition-all ${
                      eventsTab === 'neo' ? 'bg-white text-zinc-950 font-semibold' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    NEOs ({neoList.length})
                  </button>

                  <InfoButton
                    title="External Context Feeds"
                    description="Switch between active global Earth hazards (NASA EONET), upcoming space launches (SpaceDevs), SpaceX history, and near-Earth asteroids (NASA NeoWs)."
                  />
                </div>

                <div className="py-2 space-y-1.5 overflow-y-auto max-h-24 pr-1 text-xs">
                  {eventsTab === 'hazards' && (
                    eonetEvents.length === 0 ? (
                      <div className="text-zinc-500 text-[11px] py-1">No active hazards.</div>
                    ) : (
                      eonetEvents.slice(0, 3).map((evt: any, i) => (
                        <div key={i} className="flex items-center justify-between text-[11px]">
                          <span className="text-zinc-300 truncate max-w-[170px]">{evt.properties?.title}</span>
                          <span className="text-rose-400 text-[10px]">{evt.properties?.categories?.[0]?.title}</span>
                        </div>
                      ))
                    )
                  )}

                  {eventsTab === 'launches' && (
                    upcomingLaunches.length === 0 ? (
                      <div className="text-zinc-500 text-[11px] py-1">No upcoming launches cached.</div>
                    ) : (
                      upcomingLaunches.slice(0, 3).map((l: any, i) => (
                        <div key={i} className="flex items-center justify-between text-[11px]">
                          <span className="text-zinc-300 truncate max-w-[170px]">{l.name}</span>
                          <span className="text-zinc-400 font-mono text-[10px]">{new Date(l.net).toLocaleDateString()}</span>
                        </div>
                      ))
                    )
                  )}

                  {eventsTab === 'spacex' && spacexHistory.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[10px] text-amber-400/90 italic">Historical data, not a live feed</div>
                      {spacexHistory.slice(0, 2).map((s: any, i) => (
                        <div key={i} className="text-[11px] text-zinc-300 truncate">
                          Flight #{s.flight_number}: {s.name}
                        </div>
                      ))}
                    </div>
                  )}

                  {eventsTab === 'neo' && (
                    neoList.length === 0 ? (
                      <div className="text-zinc-500 text-[11px] py-1">No NEO close approaches today.</div>
                    ) : (
                      neoList.slice(0, 3).map((n: any, i) => (
                        <div key={i} className="flex items-center justify-between text-[11px]">
                          <span className="text-zinc-300 truncate max-w-[160px]">{n.name}</span>
                          <span className="text-amber-400 font-mono text-[10px]">
                            {n.close_approach_data?.[0]?.miss_distance?.lunar || '---'} LD
                          </span>
                        </div>
                      ))
                    )
                  )}
                </div>

                <div className="text-[10px] text-zinc-500 font-mono pt-2 border-t border-white/[0.04]">
                  <span>Visualized as live markers on the 3D globe</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Floating Apple-Style Dock Pill (Unobtrusive) */}
      <div className="hidden sm:flex fixed bottom-3 left-1/2 -translate-x-1/2 z-20 items-center space-x-2 px-4 py-1.5 rounded-full bg-zinc-900/80 border border-white/10 backdrop-blur-2xl shadow-xl text-xs text-zinc-300 select-none hover:border-white/20 transition-all">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-3 focus:outline-none"
        >
          <div className="flex items-center space-x-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>Telemetry Dock</span>
          </div>

          <span className="text-zinc-600">|</span>

          <div className="flex items-center space-x-2 font-mono text-[11px] text-zinc-400">
            <span>Flares: <strong className="text-amber-300">{donkiFlares.length}</strong></span>
            <span>•</span>
            <span>Risk High: <strong className="text-rose-400">{riskCounts.high}</strong></span>
            <span>•</span>
            <span>Hazards: <strong className="text-zinc-200">{eonetEvents.length}</strong></span>
          </div>

          <ChevronUp className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>

        <InfoButton
          title="Telemetry Dock"
          description="Click to expand the full space-weather and environmental telemetry console."
        />
      </div>
    </>
  );
};
