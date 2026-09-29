import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Info, X } from 'lucide-react';

interface InfoButtonProps {
  title: string;
  description: string;
  details?: string;
  placement?: 'bottom' | 'top' | 'left' | 'right';
  className?: string;
}

export const InfoButton: React.FC<InfoButtonProps> = ({
  title,
  description,
  details,
  placement = 'bottom',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = useState({ top: -9999, left: -9999 });

  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      if (popoverRef.current && buttonRef.current) {
        const btnRect = buttonRef.current.getBoundingClientRect();
        const popRect = popoverRef.current.getBoundingClientRect();

        let top = btnRect.bottom + 8;
        let left = btnRect.left + (btnRect.width / 2) - (popRect.width / 2);

        // Horizontal overflow protection
        if (left < 10) {
          left = 10;
        } else if (left + popRect.width > window.innerWidth - 10) {
          left = window.innerWidth - popRect.width - 10;
        }

        // Vertical overflow protection
        if (top + popRect.height > window.innerHeight - 10) {
          top = btnRect.top - popRect.height - 8;
        }

        setCoords({ top, left });
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    const handleOutsideClick = (e: MouseEvent) => {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    window.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleEscape);
    
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <div className={`relative inline-flex items-center shrink-0 ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        title={`Information: ${title}`}
        className="w-4 h-4 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors focus:outline-none"
      >
        <Info className="w-3 h-3" />
      </button>

      {isOpen && createPortal(
        <div
          ref={popoverRef}
          onClick={(e) => e.stopPropagation()}
          style={{ top: coords.top, left: coords.left }}
          className="fixed z-[99999] w-[90vw] max-w-[256px] sm:w-64 p-3 rounded-2xl bg-zinc-950/95 border border-white/15 shadow-2xl backdrop-blur-3xl text-left select-none animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.08] mb-1.5">
            <span className="font-semibold text-xs text-white tracking-tight">{title}</span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-zinc-400 hover:text-white p-0.5 rounded-md hover:bg-white/10 focus:outline-none"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <p className="text-[11px] text-zinc-300 leading-relaxed font-sans">{description}</p>
          {details && (
            <div className="mt-2 pt-1.5 border-t border-white/[0.06] text-[10px] text-rose-400 font-mono">
              {details}
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};
