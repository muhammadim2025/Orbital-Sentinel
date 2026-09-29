/**
 * PROXIMITY EVENT CARD (Scenario 03: Conjunction Screening)
 * Redesigned with Apple minimalism & Ferrari sleek precision.
 * Floating frosted glass alert card with Rosso Corsa accents.
 */

import React from 'react';
import { ConjunctionResult } from '../services/orbitalEngine.ts';
import { AlertOctagon, Orbit, Clock, ShieldAlert } from 'lucide-react';

interface ConjunctionCardProps {
  conjunction: ConjunctionResult | null;
  isSearching: boolean;
  onClose?: () => void;
}

export const ConjunctionCard: React.FC<ConjunctionCardProps> = ({
  conjunction,
  isSearching
}) => {
  if (isSearching) {
    return (
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-zinc-950/90 border border-amber-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-2xl text-xs w-[460px] max-w-[90vw] select-none text-zinc-200 animate-pulse">
        <div className="flex items-center space-x-2 text-amber-400 font-semibold mb-1">
          <Orbit className="w-4 h-4 animate-spin" />
          <span>Screening Conjunction Envelope (Next 24h)</span>
        </div>
        <p className="text-zinc-400 text-[11px] leading-relaxed">
          Propagating SGP4 state vectors against Cosmos 2251 and Iridium 33 debris clouds...
        </p>
      </div>
    );
  }

  if (!conjunction) return null;

  const {
    primary,
    secondary,
    missDistanceKm,
    timeOfClosestApproach,
    relativeVelocityKms,
    trajectoryConfidence
  } = conjunction;

  const isSevere = missDistanceKm < 5.0;
  const isModerate = missDistanceKm < 20.0;

  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-zinc-950/95 border border-rose-500/50 rounded-3xl shadow-2xl shadow-rose-950/50 p-4 sm:p-5 text-xs w-[520px] max-w-[92vw] select-none backdrop-blur-3xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
        <div className="flex items-center space-x-2 text-rose-400 font-semibold text-xs">
          <AlertOctagon className="w-4 h-4 animate-pulse text-rose-500" />
          <span>Close Approach Detected</span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20">
          screening estimate from public TLEs
        </span>
      </div>

      {/* Spacecraft Objects */}
      <div className="my-3 grid grid-cols-2 gap-2 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
        <div>
          <span className="text-[10px] text-zinc-500 font-mono block">Primary Object</span>
          <span className="font-semibold text-white text-xs truncate block mt-0.5">{primary.name}</span>
          <span className="text-[10px] text-zinc-500 font-mono">NORAD #{primary.noradId}</span>
        </div>

        <div>
          <span className="text-[10px] text-zinc-500 font-mono block">Encounter Debris</span>
          <span className="font-semibold text-rose-400 text-xs truncate block mt-0.5">{secondary.name}</span>
          <span className="text-[10px] text-zinc-500 font-mono">NORAD #{secondary.noradId}</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-2 text-center my-2.5">
        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
          <span className="text-[10px] text-zinc-500 font-mono block">Miss Distance</span>
          <span
            className={`text-sm sm:text-base font-bold font-mono block mt-0.5 ${
              isSevere ? 'text-rose-400' : isModerate ? 'text-amber-400' : 'text-zinc-200'
            }`}
          >
            {missDistanceKm} km
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
          <span className="text-[10px] text-zinc-500 font-mono block">Relative Velocity</span>
          <span className="text-sm sm:text-base font-bold font-mono text-white block mt-0.5">
            {relativeVelocityKms} km/s
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
          <span className="text-[10px] text-zinc-500 font-mono block">TCA (UTC)</span>
          <span className="text-xs sm:text-sm font-semibold font-mono text-amber-300 block mt-0.5">
            {timeOfClosestApproach.toLocaleTimeString()}
          </span>
          <span className="text-[9px] text-zinc-500 font-mono">
            {timeOfClosestApproach.toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Confidence Bar */}
      <div className="mt-3 pt-2.5 border-t border-white/[0.06]">
        <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1 font-mono">
          <span>Covariance Confidence</span>
          <span className="text-zinc-200 font-semibold">
            {Math.round(trajectoryConfidence * 100)}%
          </span>
        </div>
        <div className="w-full bg-white/[0.06] rounded-full h-1 overflow-hidden">
          <div
            className="bg-rose-500 h-1 rounded-full transition-all duration-700"
            style={{ width: `${Math.round(trajectoryConfidence * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};
