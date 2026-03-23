'use client';

import React from 'react';

/**
 * AuraToggle - A premium, spring-animated toggle switch.
 */
export function AuraToggle({ checked, onChange, disabled, id }) {
  const handleToggle = () => {
    if (!disabled && onChange) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <div 
      className={`toggle-track ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}`}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? -1 : 0}
      role="switch"
      aria-checked={checked}
      id={id}
    >
      <div className="toggle-thumb" />

      <style jsx>{`
        .toggle-track {
          width: 44px;
          height: 24px;
          border-radius: 12px;
          background: var(--aura-surface);
          border: 1px solid var(--aura-border);
          position: relative;
          cursor: pointer;
          transition: background 200ms ease, border-color 200ms ease, box-shadow 200ms ease;
          display: flex;
          align-items: center;
          padding: 0 3px;
        }

        .toggle-track.checked {
          background: var(--aura-aurora-1);
          border-color: transparent;
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.3);
        }

        .toggle-track.disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .toggle-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--aura-muted);
          transition: transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1), background 200ms ease;
          transform: translateX(0);
        }

        .checked .toggle-thumb {
          background: white;
          transform: translateX(20px);
        }

        .toggle-track:active:not(.disabled) .toggle-thumb {
          transform: ${checked ? 'translateX(20px) scale(0.85)' : 'translateX(0) scale(0.85)'};
        }

        .toggle-track:focus-visible {
          outline: none;
          box-shadow: 0 0 0 2px var(--aura-void), 0 0 0 4px var(--aura-aurora-1);
        }
      `}</style>
    </div>
  );
}

export function AuraToggleRow({ label, description, checked, onChange, disabled }) {
  const toggleId = React.useId();

  return (
    <div className={`toggle-row ${disabled ? 'disabled' : ''}`}>
      <div className="label-container" onClick={() => !disabled && onChange(!checked)}>
        <label htmlFor={toggleId} className="toggle-label">{label}</label>
        {description && <span className="toggle-desc">{description}</span>}
      </div>
      
      <AuraToggle 
        id={toggleId}
        checked={checked} 
        onChange={onChange} 
        disabled={disabled} 
      />

      <style jsx>{`
        .toggle-row {
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--aura-border);
          transition: opacity 200ms ease;
        }

        .toggle-row.disabled {
          opacity: 0.5;
        }

        .label-container {
          display: flex;
          flex-direction: column;
          cursor: pointer;
          flex: 1;
          padding-right: 16px;
        }

        .toggle-label {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: var(--aura-white);
          cursor: pointer;
        }

        .toggle-desc {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 12px;
          color: var(--aura-muted);
          display: block;
          margin-top: 2px;
        }
      `}</style>
    </div>
  );
}
