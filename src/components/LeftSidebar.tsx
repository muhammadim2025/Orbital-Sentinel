/**
 * LEFT SIDEBAR COMPONENT
 * Redesigned with Apple minimalism & Ferrari sleek precision.
 * Responsive slide-over drawer on mobile; sleek floating glass pane on desktop.
 * Includes InfoButtons on all category filters and action triggers.
 */

import React, { useState } from 'react';
import { SpacecraftRecord } from '../services/orbitalEngine.ts';
import { ComputedRisk } from '../services/riskCalculator.ts';
import { Search, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { InfoButton } from './InfoButton.tsx';

interface LeftSidebarProps {
  groups: { id: string; label: string; count: number }[];
  activeGroup: string;
  onSelectGroup: (groupId: string) => void;
  satellites: SpacecraftRecord[];
  selectedSatellite: SpacecraftRecord | null;
  onSelectSatellite: (sat: SpacecraftRecord) => void;
  satelliteRisks: Map<number, ComputedRisk>;
  onOpenCommandPalette: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  groups,
  activeGroup,
  onSelectGroup,
  satellites,
  selectedSatellite,
  onSelectSatellite,
  satelliteRisks,
  onOpenCommandPalette,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'HIGH' | 'ELEVATED' | 'MODERATE' | 'LOW'>('ALL');

  // Filter satellites
  const filteredSatellites = satellites.filter(sat => {
    const matchesSearch =
      sat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(sat.noradId).includes(searchQuery);

    if (!matchesSearch) return false;

    if (riskFilter !== 'ALL') {
      const risk = satelliteRisks.get(sat.noradId);
      if (risk?.level !== riskFilter) return false;
    }

    return true;
  });

  const getRiskColor = (level?: string) => {
    switch (level) {
      case 'HIGH':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'ELEVATED':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'MODERATE':
        return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
      default:
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    }
  };

  // Desktop collapsed strip
  if (isCollapsed && !isMobileOpen) {
    return (
      <aside className="hidden md:flex w-12 bg-black/60 backdrop-blur-2xl border-r border-white/[0.08] flex-col items-center py-4 z-20 select-none">
        <button
          onClick={onToggleCollapse}
          title="Expand Catalog"
          className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={onOpenCommandPalette}
          title="Search (⌘K)"
          className="p-2 mt-3 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          <Search className="w-4 h-4" />
        </button>
      </aside>
    );
  }

  const containerClasses = `
    flex flex-col select-none transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]
    ${isMobileOpen 
      ? 'fixed bottom-0 inset-x-0 h-[80vh] z-50 bg-zinc-950/95 backdrop-blur-3xl border-t border-white/10 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] translate-y-0 pb-safe' 
      : 'fixed bottom-0 inset-x-0 h-[80vh] z-50 bg-zinc-950/95 backdrop-blur-3xl border-t border-white/10 rounded-t-3xl translate-y-full pb-safe md:translate-y-0'}
    md:static md:h-[calc(100vh-3.5rem)] md:w-72 lg:w-80 md:bg-black/50 md:backdrop-blur-2xl md:border-r md:border-white/[0.08] md:border-t-0 md:rounded-none md:shadow-none
    ${!isMobileOpen ? 'max-md:pointer-events-none' : ''}
  `;

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="md:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity"
        />
      )}

      <aside className={containerClasses}>
        {/* Mobile Drag Handle */}
        <div className="md:hidden w-full flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-zinc-600/50" />
        </div>

        {/* Header & Search */}
        <div className="p-3.5 pt-1 md:pt-3.5 border-b border-white/[0.06] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-semibold text-zinc-300 tracking-wide">SPACECRAFT REGISTRY</span>
              <InfoButton
                title="Spacecraft Registry"
                description="Live orbital catalog fed by CelesTrak. Select any target to inspect calculated SGP4 dynamics, next backyard pass, and AI flight interpretation."
              />
            </div>

            <div className="flex items-center space-x-1">
              {isMobileOpen && onCloseMobile && (
                <button
                  onClick={onCloseMobile}
                  className="md:hidden p-1.5 rounded-full bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onToggleCollapse}
                title="Collapse Panel"
                className="hidden md:flex p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Minimal Search Field */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search targets or catalog #..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-rose-500/60 rounded-xl px-3 py-1.5 pl-8 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none transition-colors"
            />
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
            <div className="absolute right-2 top-1.5 flex items-center space-x-1">
              <button
                onClick={onOpenCommandPalette}
                className="text-[10px] text-zinc-500 font-mono bg-white/[0.06] px-1.5 py-0.5 rounded border border-white/[0.08] hover:text-zinc-300"
              >
                ⌘K
              </button>
              <InfoButton
                title="Search & Spotlight"
                description="Filter targets in real time or press ⌘K (Ctrl+K) for instant keyboard navigation across the entire constellation."
              />
            </div>
          </div>
        </div>

        {/* Group Selector Segmented Scroll */}
        <div className="px-3 py-2 border-b border-white/[0.06] flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
          {groups.map(grp => {
            const isActive = activeGroup === grp.id;
            return (
              <button
                key={grp.id}
                onClick={() => onSelectGroup(grp.id)}
                className={`px-2.5 py-1 rounded-lg text-xs whitespace-nowrap transition-all font-medium flex items-center space-x-1.5 ${
                  isActive
                    ? 'bg-white text-zinc-950 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                }`}
              >
                <span>{grp.label}</span>
                <span className={`text-[10px] ${isActive ? 'text-zinc-500' : 'text-zinc-500'}`}>
                  {grp.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filter Pills with Info */}
        <div className="px-3 py-1.5 border-b border-white/[0.04] flex items-center justify-between text-[11px]">
          <div className="flex items-center space-x-1">
            <span className="text-zinc-500 text-[10px] uppercase tracking-wider">Risk Level</span>
            <InfoButton
              title="Risk Level Filter"
              description="Filters satellites based on their calculated deterministic risk score (evaluating altitude, atmospheric drag, solar flare activity, and conjunction screening)."
            />
          </div>

          <div className="flex items-center space-x-1">
            {(['ALL', 'HIGH', 'ELEVATED', 'MODERATE', 'LOW'] as const).map(lvl => (
              <button
                key={lvl}
                onClick={() => setRiskFilter(lvl)}
                className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${
                  riskFilter === lvl
                    ? 'bg-zinc-800 text-zinc-100 font-semibold'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Spacecraft Target List */}
        <div className="flex-1 overflow-y-auto divide-y divide-white/[0.03] p-2 space-y-1">
          {filteredSatellites.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-xs">
              No matching targets in this envelope.
            </div>
          ) : (
            filteredSatellites.map(sat => {
              const isSelected = selectedSatellite?.noradId === sat.noradId;
              const risk = satelliteRisks.get(sat.noradId);
              const isDebris = sat.group.includes('debris');

              return (
                <div
                  key={sat.noradId}
                  onClick={() => {
                    onSelectSatellite(sat);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`p-2.5 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-rose-500/10 border border-rose-500/30 text-white shadow-sm'
                      : 'hover:bg-white/[0.04] text-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 truncate">
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          isSelected
                            ? 'bg-rose-500 shadow-[0_0_8px_#e11d48]'
                            : isDebris
                            ? 'bg-rose-400'
                            : 'bg-zinc-400'
                        }`}
                      />
                      <span className="font-semibold text-xs truncate">{sat.name}</span>
                    </div>

                    <span
                      className={`text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded border ${getRiskColor(
                        risk?.level || 'LOW'
                      )}`}
                    >
                      {risk?.level || 'LOW'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-zinc-500 mt-1 pl-3.5 font-mono">
                    <span>#{sat.noradId}</span>
                    <span>Inc {sat.inclination.toFixed(1)}°</span>
                    <span>T {sat.periodMinutes.toFixed(0)}m</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-white/[0.06] text-[10px] text-zinc-500 flex items-center justify-between font-mono">
          <span>{satellites.length} in orbit</span>
          <span>Showing {filteredSatellites.length}</span>
        </div>
      </aside>
    </>
  );
};
