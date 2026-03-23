'use client';
import { ChevronDown, X } from 'lucide-react';

import { useState } from 'react';

import styles from './controls.module.css';

export const Toggle = ({ checked, onChange, id }) => {
  return (
    <div 
      className={`${styles.toggleTrack} ${checked ? styles.toggleTrackActive : ''}`}
      onClick={() => onChange(!checked)}
      id={id}
    >
      <div className={`${styles.toggleThumb} ${checked ? styles.toggleThumbActive : ''}`} />
    </div>
  );
};

export const Select = ({ options, value, onChange, id }) => {
  return (
    <div className={styles.selectWrapper}>
      <select 
        className={styles.select} 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        id={id}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <ChevronDown className={styles.selectIcon} size={14} />
    </div>
  );
};

export const Input = ({ value, onChange, placeholder, type = 'text', id, width }) => {
  return (
    <input 
      type={type}
      className={styles.input}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      id={id}
      style={{ width }}
    />
  );
};

export const Textarea = ({ value, onChange, placeholder, id, maxLength }) => {
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <textarea
        className={styles.textarea}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        id={id}
        maxLength={maxLength}
      />
      {maxLength && (
        <div style={{ 
          position: 'absolute', 
          right: '12px', 
          bottom: '8px', 
          fontSize: '10px', 
          color: 'var(--aura-muted)' 
        }}>
          {value.length}/{maxLength}
        </div>
      )}
    </div>
  );
};

export const SegmentedControl = ({ options, value, onChange }) => {
  return (
    <div className={styles.segmentedControl}>
      {options.map(opt => (
        <div 
          key={opt.value}
          className={`${styles.segmentedOption} ${value === opt.value ? styles.segmentedOptionActive : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </div>
      ))}
    </div>
  );
};

export const Slider = ({ min = 0, max = 100, step = 1, value, onChange }) => {
  return (
    <input 
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className={styles.slider}
      style={{
        background: `linear-gradient(to right, var(--aura-aurora-1) 0%, var(--aura-aurora-1) ${(value - min) / (max - min) * 100}%, var(--aura-surface) ${(value - min) / (max - min) * 100}%, var(--aura-surface) 100%)`
      }}
    />
  );
};

export const Chip = ({ label, active, onClick, onRemove }) => {
  return (
    <button 
      className={`${styles.chip} ${active ? styles.chipActive : ''}`}
      onClick={onClick}
    >
      {label}
      {onRemove ? (
        <X size={12} onClick={(e) => { e.stopPropagation(); onRemove(); }} />
      ) : active ? (
        <X size={12} />
      ) : null}
    </button>
  );
};

export const TagInput = ({ tags, onAdd, onRemove }) => {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      onAdd(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
      <div className={styles.chipsContainer} style={{ marginTop: 0 }}>
        {tags.map(tag => (
          <Chip key={tag} label={tag} active onRemove={() => onRemove(tag)} />
        ))}
      </div>
      <input 
        className={styles.input}
        style={{ width: '100%' }}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type and press Enter..."
      />
    </div>
  );
};

export const DualSlider = ({ min, max, value, onChange }) => {
  // Simple dual slider mockup using two range inputs
  return (
    <div className={styles.dualSliderWrapper}>
      <div className={styles.dualSliderTrack} />
      <div 
        className={styles.dualSliderRange} 
        style={{ 
          left: `${(value[0]-min)/(max-min)*100}%`, 
          right: `${100 - (value[1]-min)/(max-min)*100}%` 
        }} 
      />
      <input 
        type="range" 
        min={min} 
        max={max} 
        step={0.5} 
        value={value[0]} 
        onChange={(e) => onChange([Math.min(Number(e.target.value), value[1] - 0.5), value[1]])}
        className={`${styles.slider} ${styles.dualSliderInput}`}
      />
      <input 
        type="range" 
        min={min} 
        max={max} 
        step={0.5} 
        value={value[1]} 
        onChange={(e) => onChange([value[0], Math.max(Number(e.target.value), value[0] + 0.5)])}
        className={`${styles.slider} ${styles.dualSliderInput}`}
      />
    </div>
  );
};

export const SettingRow = ({ label, description, control, last, id }) => {
  return (
    <div className={`${styles.settingRow} ${last ? styles.settingRowNoBorder : ''}`} id={id}>
      <div className={styles.labelWrapper}>
        <span className={styles.label}>{label}</span>
        {description && <span className={styles.description}>{description}</span>}
      </div>
      <div className={styles.controlWrapper}>
        {control}
      </div>
    </div>
  );
};

export const SettingCard = ({ title, children }) => {
  return (
    <div className={styles.settingCard}>
      {title && <div className={styles.cardTitle}>{title}</div>}
      <div className={styles.cardStack}>
        {children}
      </div>
    </div>
  );
};
