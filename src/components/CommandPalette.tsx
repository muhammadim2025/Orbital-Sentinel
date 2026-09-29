/**
 * COMMAND PALETTE (Spotlight Search)
 * Redesigned with Apple minimalism & Ferrari sleek precision.
 */

import React, { useState, useEffect, useRef } from 'react';
import { SpacecraftRecord } from '../services/orbitalEngine.ts';
import { Search, X, Orbit, Satellite, AlertCircle } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  satellites: SpacecraftRecord[];
  onSelectSatellite: (sat: SpacecraftRecord) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  satellites,
  onSelectSatellite
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setSelectedIndex(0);
      }
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filtered = satellites
    .filter(s =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      String(s.noradId).includes(query) ||
      s.group.toLowerCase().includes(query.toLowerCase())
    )
    .slice(0, 30);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        onSelectSatellite(filtered[selectedIndex]);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/70 backdrop-blur-md select-none">
      <div className="relative w-full max-w-xl bg-zinc-950/95 border border-white/10 rounded-3xl shadow-2xl overflow-hidden text-xs backdrop-blur-3xl">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-white/[0.08]">
          <Search className="w-4 h-4 text-zinc-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search spacecraft by name or NORAD catalog #..."
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-white placeholder-zinc-500 focus:outline-none text-xs"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-zinc-500 hover:text-white mr-2">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="text-[10px] bg-white/[0.06] px-2 py-0.5 rounded-lg text-zinc-400 font-mono border border-white/[0.08]">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto divide-y divide-white/[0.03] p-1.5">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-xs">
              No matching spacecraft found for &quot;{query}&quot;
            </div>
          ) : (
            filtered.map((sat, idx) => {
              const isSelected = idx === selectedIndex;
              const isDebris = sat.group.includes('debris');

              return (
                <div
                  key={`${sat.noradId}-${idx}`}
                  onClick={() => {
                    onSelectSatellite(sat);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`px-3 py-2.5 rounded-2xl cursor-pointer flex items-center justify-between transition-colors ${
                    isSelected ? 'bg-white/[0.08] text-white' : 'text-zinc-300 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        isDebris ? 'bg-rose-500' : 'bg-zinc-300'
                      }`}
                    />
                    <div>
                      <div className="font-semibold text-xs text-white">{sat.name}</div>
                      <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                        #{sat.noradId} • Inc {sat.inclination.toFixed(1)}° • {sat.periodMinutes.toFixed(0)}m
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-zinc-500 uppercase">
                    {sat.group.replace('-debris', '')}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-white/[0.02] border-t border-white/[0.06] text-[10px] text-zinc-500 flex items-center justify-between font-mono">
          <span>↑ ↓ Navigate • Enter to select</span>
          <span>{filtered.length} results</span>
        </div>
      </div>
    </div>
  );
};
