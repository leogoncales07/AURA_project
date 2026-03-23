'use client';
import { Check, ChevronDown, Search } from 'lucide-react';

import React, { useState, useRef, useEffect } from 'react';

/**
 * AuraSelect - A premium, searchable select component.
 */
export default function AuraSelect({ 
  options = [], 
  value, 
  onChange, 
  placeholder = 'Select...', 
  searchable = false, 
  width = '100%' 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);

  const selectedOption = options.find(opt => opt.value === value);

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  const handleSelect = (val) => {
    if (onChange) onChange(val);
    setIsOpen(false);
  };

  return (
    <div className="aura-select-container" ref={containerRef} style={{ width }}>
      <div 
        className={`select-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        tabIndex={0}
      >
        <span className={`trigger-text ${!selectedOption ? 'placeholder' : ''}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown 
          size={14} 
          className={`chevron-icon ${isOpen ? 'rotate' : ''}`} 
        />
      </div>

      {isOpen && (
        <div className="select-dropdown" ref={dropdownRef}>
          {searchable && (
            <div className="search-container">
              <Search size={14} className="search-icon" />
              <input 
                type="text"
                autoFocus
                placeholder="Search..."
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          <div className="options-list">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div 
                  key={opt.value}
                  className={`option-item ${opt.value === value ? 'selected' : ''}`}
                  onClick={() => handleSelect(opt.value)}
                >
                  <span className="option-label">{opt.label}</span>
                  {opt.value === value && <Check size={14} className="check-icon" />}
                </div>
              ))
            ) : (
              <div className="no-results">Nothing found</div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .aura-select-container {
          position: relative;
          font-family: var(--font-dm-sans), sans-serif;
        }

        .select-trigger {
          background: var(--aura-surface);
          border: 1px solid var(--aura-border);
          border-radius: 10px;
          padding: 10px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: all 200ms ease;
          min-width: 160px;
        }

        .select-trigger:hover {
          border-color: var(--aura-border-hover);
        }

        .select-trigger.open,
        .select-trigger:focus {
          border-color: var(--aura-aurora-1);
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.12);
          outline: none;
        }

        .trigger-text {
          font-size: 14px;
          color: var(--aura-white);
        }

        .trigger-text.placeholder {
          color: var(--aura-ghost);
        }

        .chevron-icon {
          color: var(--aura-muted);
          transition: transform 200ms ease;
        }

        .chevron-icon.rotate {
          transform: rotate(180deg);
        }

        .select-dropdown {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          min-width: 100%;
          background: var(--aura-depth);
          border: 1px solid var(--aura-border);
          border-radius: 12px;
          padding: 4px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px var(--aura-border);
          z-index: 100;
          animation: entrance 180ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
          max-height: 240px;
          display: flex;
          flex-direction: column;
        }

        @keyframes entrance {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .search-container {
          display: flex;
          align-items: center;
          background: var(--aura-depth);
          border-bottom: 1px solid var(--aura-border);
          border-radius: 8px 8px 0 0;
          padding: 0 12px;
          margin: -4px -4px 4px -4px;
        }

        .search-icon {
          color: var(--aura-muted);
        }

        .search-input {
          background: transparent;
          border: none;
          padding: 10px 12px;
          color: var(--aura-white);
          font-size: 14px;
          width: 100%;
          outline: none;
        }

        .options-list {
          overflow-y: auto;
          flex: 1;
        }

        /* Custom scrollbar */
        .options-list::-webkit-scrollbar {
          width: 3px;
        }
        .options-list::-webkit-scrollbar-thumb {
          background: var(--aura-border-hover);
          border-radius: 3px;
        }

        .option-item {
          padding: 8px 10px;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: rgba(248, 250, 252, 0.85); /* aura-white at 85% */
          transition: background 100ms;
        }

        .option-item:hover {
          background: rgba(255, 255, 255, 0.05);
          color: var(--aura-white);
        }

        .option-item.selected {
          background: rgba(16, 185, 129, 0.10);
          color: var(--aura-aurora-1);
        }

        .no-results {
          padding: 16px;
          text-align: center;
          color: var(--aura-muted);
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}

export function AuraSettingRow({ label, children }) {
  return (
    <div className="setting-row">
      <span className="setting-label">{label}</span>
      <div className="setting-control">
        {children}
      </div>

      <style jsx>{`
        .setting-row {
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--aura-border);
        }

        .setting-label {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: var(--aura-white);
        }

        .setting-control {
          display: flex;
          align-items: center;
        }
      `}</style>
    </div>
  );
}
