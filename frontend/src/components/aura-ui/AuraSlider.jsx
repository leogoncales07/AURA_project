'use client';

import React, { useState, useRef, useEffect } from 'react';

/**
 * AuraSlider - A premium, high-interaction slider component.
 */
export default function AuraSlider({
  min = 0,
  max = 100,
  step = 1,
  value = 0,
  onChange,
  label,
  showValue = false,
  leftLabel,
  rightLabel,
  stops = []
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const trackRef = useRef(null);
  const tooltipTimeoutRef = useRef(null);

  const percentage = ((value - min) / (max - min)) * 100;

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    updateValue(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (!isDragging) {
      // If we weren't dragging, just a click, we hide tooltip after a bit
      hideTooltipWithDelay();
    }
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      setShowTooltip(true);
      if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const updateValue = (clientX) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const pos = (clientX - rect.left) / rect.width;
    const clampedPos = Math.max(0, Math.min(1, pos));
    const rawValue = min + clampedPos * (max - min);
    const steppedValue = Math.round(rawValue / step) * step;
    const finalValue = Math.min(max, Math.max(min, steppedValue));
    
    if (onChange) onChange(finalValue);
  };

  const handleTrackMouseDown = (e) => {
    updateValue(e.clientX);
    setIsDragging(true);
  };

  const handleKeyDown = (e) => {
    let newValue = value;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      newValue = Math.min(max, value + step);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      newValue = Math.max(min, value - step);
    } else if (e.key === 'Home') {
      newValue = min;
    } else if (e.key === 'End') {
      newValue = max;
    } else {
      return;
    }
    e.preventDefault();
    if (onChange) onChange(newValue);
    setShowTooltip(true);
    hideTooltipWithDelay();
  };

  const hideTooltipWithDelay = () => {
    if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
    tooltipTimeoutRef.current = setTimeout(() => {
      if (!isDragging) setShowTooltip(false);
    }, 1500);
  };

  const handleMouseEnter = () => {
    if (showValue) {
      tooltipTimeoutRef.current = setTimeout(() => {
         setShowTooltip(true);
      }, 300);
    }
  };

  const handleMouseLeave = () => {
    if (!isDragging) {
      if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
      setShowTooltip(false);
    }
  };

  return (
    <div className="aura-slider-wrapper">
      {label && <div className="slider-label">{label}</div>}
      
      <div 
        className="slider-container"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div 
          className="slider-track" 
          ref={trackRef}
          onMouseDown={handleTrackMouseDown}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          role="slider"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
        >
          {/* Stops */}
          {stops.map(stop => {
            const stopPos = ((stop - min) / (max - min)) * 100;
            const isFilled = stop <= value;
            return (
              <div 
                key={stop} 
                className={`slider-stop ${isFilled ? 'filled' : ''}`}
                style={{ left: `${stopPos}%` }}
              />
            );
          })}

          <div 
            className="slider-fill" 
            style={{ width: `${percentage}%` }} 
          />
          
          <div 
            className={`slider-thumb ${isDragging ? 'active' : ''}`}
            style={{ left: `${percentage}%` }}
          >
            {showValue && showTooltip && (
              <div className="slider-tooltip">
                {Number(value).toFixed(step < 1 ? 1 : 0)}
              </div>
            )}
          </div>
        </div>

        {(leftLabel || rightLabel) && (
          <div className="slider-footer">
            <span className="footer-label">{leftLabel}</span>
            <span className="footer-label">{rightLabel}</span>
          </div>
        )}
      </div>

      <style jsx>{`
        .aura-slider-wrapper {
          width: 100%;
          user-select: none;
        }

        .slider-label {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 13px;
          font-weight: 500;
          color: var(--aura-white);
          margin-bottom: 12px;
        }

        .slider-container {
          padding: 10px 0;
        }

        .slider-track {
          height: 4px;
          background: var(--aura-surface);
          border-radius: 2px;
          position: relative;
          cursor: pointer;
          outline: none;
        }

        .slider-fill {
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          background: linear-gradient(90deg, var(--aura-aurora-1), var(--aura-aurora-2));
          border-radius: 2px;
          pointer-events: none;
        }

        .slider-stop {
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: var(--aura-border-hover);
          z-index: 1;
          pointer-events: none;
          transition: background 200ms ease;
        }

        .slider-stop.filled {
          background: var(--aura-aurora-1);
        }

        .slider-thumb {
          position: absolute;
          top: 50%;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          border: 2px solid var(--aura-aurora-1);
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
          transform: translate(-50%, -50%);
          z-index: 10;
          transition: box-shadow 150ms, transform 150ms;
        }

        .slider-container:hover .slider-thumb {
          box-shadow: 0 0 0 5px rgba(16, 185, 129, 0.20);
        }

        .slider-thumb.active {
          transform: translate(-50%, -50%) scale(1.15);
          box-shadow: 0 0 0 6px rgba(16, 185, 129, 0.25);
          transition: none;
        }

        .slider-tooltip {
          position: absolute;
          bottom: calc(100% + 10px);
          left: 50%;
          transform: translateX(-50%);
          background: var(--aura-surface);
          border: 1px solid var(--aura-border);
          border-radius: 6px;
          padding: 4px 8px;
          font-family: var(--font-jetbrains-mono), monospace;
          font-size: 12px;
          color: var(--aura-white);
          pointer-events: none;
          white-space: nowrap;
          animation: tooltipEntrance 120ms ease forwards;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }

        @keyframes tooltipEntrance {
          from { opacity: 0; transform: translateX(-50%) translateY(4px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }

        .slider-footer {
          display: flex;
          justify-content: space-between;
          margin-top: 12px;
        }

        .footer-label {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 12px;
          color: var(--aura-muted);
        }

        .slider-track:focus-visible {
          box-shadow: 0 0 0 2px var(--aura-void), 0 0 0 4px var(--aura-aurora-1);
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
}
