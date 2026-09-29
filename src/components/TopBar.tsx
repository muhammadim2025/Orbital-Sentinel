/**
 * TOP BAR COMPONENT
 * Redesigned with Apple minimalism & Ferrari sleek precision.
 * Shows Device Local Time, Mission UTC Time, Info Buttons on all scenario controls.
 */

import React, { useState } from 'react';
import { Radio, Clock, RotateCcw, ChevronDown, Orbit, Laptop } from 'lucide-react';
import { SourceStatus } from '../services/apiClient.ts';
import { InfoButton } from './InfoButton.tsx';

interface TopBarProps {
  scenario: 'normal' | 'solar_storm' | 'conjunction';
  onSelectScenario: (scenario: 'normal' | 'solar_storm' | 'conjunction') => void;
  onResetToLive: () => void;
  utcTime: Date;
  sourceStatuses: Record<string, SourceStatus>;
  mobileView: 'globe' | 'targets' | 'inspector' | 'dock';
  onSetMobileView: (view: 'globe' | 'targets' | 'inspector' | 'dock') => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  scenario,
  onSelectScenario,
  onResetToLive,
  utcTime,
  sourceStatuses
}) => {
  const [showStatusPopover, setShowStatusPopover] = useState(false);
  const [showScenarioMenu, setShowScenarioMenu] = useState(false);

  // Device local time formatting
  const deviceTimeStr = utcTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const utcTimeStr = utcTime.toISOString().slice(11, 19) + ' UTC';

  return (
    <header className="h-14 bg-black/70 backdrop-blur-2xl border-b border-white/[0.08] px-3 sm:px-5 flex items-center justify-between z-30 select-none transition-all">
      {/* Brand & Sentinel Identity */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2.5">
          <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-zinc-800 to-zinc-950 border border-white/10 shadow-sm">
            <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_#e11d48]" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold tracking-tight text-xs sm:text-sm text-white">ORBITAL</span>
              <span className="font-light tracking-wider text-xs sm:text-sm text-zinc-400">SENTINEL</span>
            </div>
            <div className="text-[9px] text-zinc-500 font-mono tracking-wider hidden sm:block">
              PRECISION SGP4 • GEMINI 3.8
            </div>
          </div>
        </div>
      </div>

      {/* Scenario Segmented Control with Info Buttons (Apple / Ferrari Sleek) */}
      <div className="hidden md:flex items-center p-1 rounded-full bg-zinc-900/80 border border-white/[0.07] backdrop-blur-xl space-x-1">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onSelectScenario('normal')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              scenario === 'normal'
                ? 'bg-zinc-100 text-zinc-950 shadow-sm font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Normal Ops
          </button>
          <InfoButton
            title="Normal Ops Mode"
            description="Live space operations under standard calm space weather. SGP4 physics continuously calculates real satellite paths."
            details="NOAA SWPC: Kp ~ 2.0 • Nominal atmospheric drag"
            className="mr-1"
          />
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => onSelectScenario('solar_storm')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
              scenario === 'solar_storm'
                ? 'bg-rose-600 text-white shadow-[0_0_14px_rgba(225,29,72,0.5)] font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>Solar Storm &apos;24</span>
            {scenario === 'solar_storm' && (
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            )}
          </button>
          <InfoButton
            title="Solar Storm Replay (May 2024)"
            description="Replays the historic G5 Extreme geomagnetic storm from May 10, 2024. Solar coronal mass ejections puff up Earth's thermosphere, surging satellite drag."
            details="NASA DONKI: X5.8 Flare • Kp = 9.0 G5 Extreme"
            className="mr-1"
          />
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => onSelectScenario('conjunction')}
            className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium transition-all ${
              scenario === 'conjunction'
                ? 'bg-amber-500 text-zinc-950 shadow-[0_0_12px_rgba(245,158,11,0.4)] font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>Anomaly</span>
            <Orbit className="w-3 h-3" />
          </button>
          <InfoButton
            title="Conjunction Screening Anomaly"
            description="Simulates automated close-approach screening against Cosmos 2251 and Iridium 33 debris clouds over the next 24 hours."
            details="Calculates Miss Distance, Relative Velocity & TCA"
            className="mr-1"
          />
        </div>

        {scenario !== 'normal' && (
          <div className="flex items-center space-x-1 pl-1 border-l border-white/10">
            <button
              onClick={onResetToLive}
              title="Reset to Live Mission Feeds"
              className="flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="text-[11px]">Live</span>
            </button>
            <InfoButton
              title="Reset to Live Data"
              description="Exits the simulation scenario and returns to live environmental and space-weather data feeds."
            />
          </div>
        )}
      </div>

      {/* Mobile Scenario Selector Trigger */}
      <div className="flex md:hidden relative">
        <button
          onClick={() => setShowScenarioMenu(!showScenarioMenu)}
          className={`flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
            scenario === 'solar_storm'
              ? 'bg-rose-950/70 border-rose-500/50 text-rose-300'
              : scenario === 'conjunction'
              ? 'bg-amber-950/70 border-amber-500/50 text-amber-300'
              : 'bg-zinc-900 border-white/10 text-zinc-300'
          }`}
        >
          <span className="capitalize">
            {scenario === 'solar_storm' ? 'Solar Storm' : scenario === 'conjunction' ? 'Anomaly' : 'Normal'}
          </span>
          <ChevronDown className="w-3 h-3" />
        </button>

        {showScenarioMenu && (
          <div className="absolute right-0 top-10 w-48 rounded-xl bg-zinc-900/95 border border-white/10 p-1.5 shadow-2xl backdrop-blur-2xl z-50 text-xs">
            <button
              onClick={() => {
                onSelectScenario('normal');
                setShowScenarioMenu(false);
              }}
              className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-white/10 text-zinc-200 flex items-center justify-between"
            >
              <span>Normal Ops</span>
              {scenario === 'normal' && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
            </button>
            <button
              onClick={() => {
                onSelectScenario('solar_storm');
                setShowScenarioMenu(false);
              }}
              className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-white/10 text-rose-300 flex items-center justify-between"
            >
              <span>Solar Storm &apos;24</span>
              {scenario === 'solar_storm' && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
            </button>
            <button
              onClick={() => {
                onSelectScenario('conjunction');
                setShowScenarioMenu(false);
              }}
              className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-white/10 text-amber-300 flex items-center justify-between"
            >
              <span>Conjunction Anomaly</span>
              {scenario === 'conjunction' && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
            </button>
            {scenario !== 'normal' && (
              <button
                onClick={() => {
                  onResetToLive();
                  setShowScenarioMenu(false);
                }}
                className="w-full text-left px-3 py-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 border-t border-white/5 mt-1 pt-1.5 flex items-center space-x-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset to Live Feeds</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Clock & Feed Status with Device Time */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Device Local Time */}
        <div
          title="Device Local Time"
          className="flex items-center space-x-1.5 text-xs text-zinc-200 font-mono tracking-tight bg-white/[0.06] px-2.5 py-1 rounded-full border border-white/[0.08]"
        >
          <Laptop className="w-3 h-3 text-rose-400 shrink-0" />
          <span className="font-semibold">{deviceTimeStr}</span>
          <span className="text-[10px] text-zinc-400 hidden xl:inline">Local</span>
        </div>

        {/* Mission UTC Clock */}
        <div
          title="Universal Coordinated Time (UTC)"
          className="hidden sm:flex items-center space-x-1.5 text-xs text-zinc-400 font-mono tracking-tight bg-white/[0.03] px-2 py-1 rounded-full border border-white/[0.06]"
        >
          <Clock className="w-3 h-3 text-zinc-400" />
          <span>{utcTimeStr}</span>
        </div>

        {/* Telemetry Popover & Info */}
        <div className="relative flex items-center space-x-1">
          <button
            onClick={() => setShowStatusPopover(!showStatusPopover)}
            className="flex items-center space-x-1.5 bg-white/[0.05] hover:bg-white/[0.09] px-2.5 py-1 rounded-full border border-white/[0.08] text-xs text-zinc-300 transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
            <span className="text-[11px] font-medium hidden sm:inline">System Health</span>
            <ChevronDown className="w-2.5 h-2.5 text-zinc-400" />
          </button>

          <InfoButton
            title="Telemetry Status"
            description="Monitors live connection status and local caching for CelesTrak, NOAA SWPC, NASA DONKI, NASA EONET, and NeoWs."
            details="All pipelines implement local snapshot fallbacks for 100% offline resilience."
          />

          {showStatusPopover && (
            <div className="absolute right-0 top-10 w-72 rounded-2xl bg-zinc-950/95 border border-white/10 shadow-2xl p-3.5 z-50 backdrop-blur-2xl text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.08] text-zinc-400 text-[11px]">
                <span className="font-semibold uppercase tracking-wider text-[10px] text-zinc-400">Data Pipelines</span>
                <span className="text-[10px] text-zinc-500">Auto-Cached</span>
              </div>
              <div className="divide-y divide-white/[0.05] mt-1 text-[11px]">
                {Object.entries(sourceStatuses).map(([name, status]) => (
                  <div key={name} className="py-1.5 flex items-center justify-between">
                    <span className="text-zinc-300 capitalize">{name.replace('_', ' ')}</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${
                        status?.source === 'LIVE'
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/20'
                          : status?.source === 'CACHED'
                          ? 'bg-sky-950/60 text-sky-400 border border-sky-500/20'
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700/50'
                      }`}
                    >
                      {status?.source || 'SNAPSHOT'}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-2.5 pt-2 border-t border-white/[0.06] text-[10px] text-zinc-500 leading-normal">
                Real-time SGP4 in browser. Outages gracefully served from cached ephemeris.
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
