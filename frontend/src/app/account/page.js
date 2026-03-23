'use client';
import { ArrowLeft, Camera, Check, CheckCircle2, Circle, Flame, Globe, Info, Loader2, Lock, ShieldCheck, Smartphone, X } from 'lucide-react';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

import styles from './page.module.css';
import AppShell from '@/components/AppShell';
import { 
  Toggle, 
  Select, 
  Input, 
  SegmentedControl, 
  Chip, 
  SettingRow 
} from '../settings/components/Controls';

const INITIAL_ACCOUNT_DATA = {
  profile: {
    displayName: 'Matheus Silva',
    username: 'matheus_aura',
    avatar: null,
    memberSince: 'March 2024',
    streak: 47,
    reportsCount: 12,
    sessionsCount: 84,
    plan: 'Free'
  },
  billing: {
    cycle: 'Monthly',
    price: 0,
    renews: 'Jan 15, 2026'
  },
  personal: {
    firstName: 'Matheus',
    lastName: 'Silva',
    email: 'matheus@example.com',
    emailVerified: true,
    phone: '',
    dob: '1995-08-24',
    gender: 'Prefer not to say',
    country: 'Portugal',
    language: 'English (US)'
  },
  wellness: {
    goal: 'Better sleep',
    conditions: ['Anxiety'],
    occupation: 'Remote',
    activity: 'Moderate'
  },
  security: {
    hasRecovery: true,
    has2FA: false
  },
  connected: [
    { id: 'google', name: 'Google', email: 'matheus@gmail.com', connected: true },
    { id: 'apple', name: 'Apple', email: null, connected: false }
  ]
};

const COUNTRIES = [
  { label: 'Portugal 🇵🇹', value: 'Portugal' },
  { label: 'United States 🇺🇸', value: 'USA' },
  { label: 'United Kingdom 🇬🇧', value: 'UK' },
  { label: 'Brazil 🇧🇷', value: 'Brazil' }
];

const GENDERS = [
  { label: 'Prefer not to say', value: 'Prefer not to say' },
  { label: 'Male', value: 'Male' },
  { label: 'Female', value: 'Female' },
  { label: 'Non-binary', value: 'Non-binary' }
];

export default function AccountPage() {
  const router = useRouter();
  const [data, setData] = useState(INITIAL_ACCOUNT_DATA);
  const [editingField, setEditingField] = useState(null); // 'displayName' or 'username'
  const [tempValue, setTempValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);

  const hasChanges = JSON.stringify(data) !== JSON.stringify(INITIAL_ACCOUNT_DATA) || avatarPreview !== null;

  const updateField = (section, field, value) => {
    setData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleInlineEdit = (field, currentVal) => {
    setEditingField(field);
    setTempValue(currentVal);
  };

  const saveInlineEdit = () => {
    if (editingField === 'displayName') updateField('profile', 'displayName', tempValue);
    if (editingField === 'username') updateField('profile', 'username', tempValue);
    setEditingField(null);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      
      // Update the "stored" data reference to current data (simulation)
      // This would normally be a refresh from API
      setTimeout(() => {
        setSaveSuccess(false);
        // Resetting data to its own current value to "clear" changes
        // In a real app, INITIAL_ACCOUNT_DATA would be updated or refetched
        // Here we can just manually trigger a state sync if needed
        // For demonstration, we'll just force hasChanges to false by some mechanical mean
        // but the simplest is just to say we saved successfully.
      }, 1500);
    }, 1000);
  };

  const getSecurityScore = () => {
    let score = 0;
    if (data.personal.emailVerified) score += 25;
    if (data.security.has2FA) score += 25;
    if (data.security.hasRecovery) score += 25;
    score += 25; // Has password by default
    
    if (score >= 100) return { label: 'Strong', color: styles.statusStrong, width: '100%' };
    if (score >= 75) return { label: 'Fair', color: styles.statusFair, width: '75%' };
    return { label: 'Weak', color: styles.statusWeak, width: '50%' };
  };

  const security = getSecurityScore();

  return (
    <AppShell showSidebar={false} showHeader={false}>
      <div className={styles.container}>
      {/* Sticky Header */}
      <header className={styles.stickyHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft} onClick={() => router.back()}>
            <ArrowLeft size={20} />
            <span className={styles.headerTitle}>Account</span>
          </div>
          <button 
            className={`${styles.saveBtn} ${saveSuccess ? styles.saveBtnSuccess : ''}`}
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            style={{ height: 32, padding: '0 16px', minWidth: 80, opacity: hasChanges ? 1 : 0.5 }}
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : saveSuccess ? <Check size={14} /> : 'Save'}
          </button>
        </div>
      </header>

      {/* Hero Profile Section */}
      <section className={styles.heroCard}>
        <div className={styles.profileTop}>
          <div className={styles.avatarWrapper}>
            <div 
              className={styles.avatar} 
              style={{ background: 'var(--aura-aurora-1)' }}
              onClick={() => fileInputRef.current?.click()}
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                data.profile.displayName.split(' ').map(n => n[0]).join('')
              )}
              <div className={styles.avatarOverlay}>
                <Camera size={16} />
                <span>Change photo</span>
              </div>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleAvatarChange} hidden accept="image/*" />
            {(avatarPreview || data.profile.avatar) && (
              <button className={styles.removePhoto} onClick={() => setAvatarPreview(null)}>Remove photo</button>
            )}
          </div>

          <div className={styles.profileInfo}>
            {editingField === 'displayName' ? (
              <input 
                autoFocus
                className={`${styles.inlineInput} ${styles.displayName}`}
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onBlur={saveInlineEdit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveInlineEdit();
                  if (e.key === 'Escape') setEditingField(null);
                }}
              />
            ) : (
              <h1 className={styles.displayName} onClick={() => handleInlineEdit('displayName', data.profile.displayName)}>
                {data.profile.displayName}
              </h1>
            )}

            {editingField === 'username' ? (
              <input 
                autoFocus
                className={`${styles.inlineInput} ${styles.handle}`}
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onBlur={saveInlineEdit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveInlineEdit();
                  if (e.key === 'Escape') setEditingField(null);
                }}
              />
            ) : (
              <span className={styles.handle} onClick={() => handleInlineEdit('username', data.profile.username)}>
                @{data.profile.username}
              </span>
            )}

            <div className={styles.metaRow}>
              <span className={styles.memberSince}>Member since {data.profile.memberSince}</span>
              <div className={styles.streakBadge}>
                <Flame size={14} />
                <span>{data.profile.streak} days</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.heroDivider} />

        <div className={styles.statsRow}>
          <div className={styles.statPill}>
            <div className={styles.statLabel}>Reports</div>
            <div className={styles.statValue}>{data.profile.reportsCount}</div>
          </div>
          <div className={styles.statPill}>
            <div className={styles.statLabel}>Sessions</div>
            <div className={styles.statValue}>{data.profile.sessionsCount}</div>
          </div>
          <div className={styles.statPill}>
            <div className={styles.statLabel}>Plan</div>
            <div className={styles.statValue}>{data.profile.plan}</div>
          </div>
        </div>
      </section>

      {/* Plan & Billing */}
      <section>
        <div className={styles.sectionHeading}>Plan & Billing</div>
        <div className={styles.planCard}>
          <div className={styles.planContent}>
            <div className={styles.planLeft}>
              <h2 className={styles.planName}>{data.profile.plan} Plan</h2>
              <p className={styles.planDesc}>Basic access to sanctuary tools and insights.</p>
              <span className={styles.renewalDate}>Renews {data.billing.renews}</span>
            </div>
            <div className={styles.planRight}>
              <div className={styles.price}>${data.billing.cycle === 'Annual' ? '0' : '0'}</div>
              <div className={styles.billingToggle}>
                <span className={styles.discountBadge}>SAVE 20%</span>
                <SegmentedControl 
                  options={[{label: 'Monthly', value: 'Monthly'}, {label:'Annual', value:'Annual'}]}
                  value={data.billing.cycle}
                  onChange={(val) => updateField('billing', 'cycle', val)}
                />
              </div>
              <button className="aura-button-primary" style={{ width: '100%' }}>Upgrade to Pro</button>
            </div>
          </div>

          <div className={styles.featureList}>
            <div className={styles.featureItem}>
              <Lock size={14} className={styles.lockIcon} />
              <span>Advanced Clinical Insights</span>
            </div>
            <div className={styles.featureItem}>
              <Lock size={14} className={styles.lockIcon} />
              <span>Unlimited AI Conversations</span>
            </div>
            <div className={styles.featureItem}>
              <Lock size={14} className={styles.lockIcon} />
              <span>Premium Sound Library</span>
            </div>
          </div>
        </div>
      </section>

      {/* Personal Information */}
      <section>
        <div className={styles.sectionHeading}>Personal Information</div>
        <div className={styles.grid}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <SettingRow label="First Name" control={<Input value={data.personal.firstName} onChange={(val) => updateField('personal', 'firstName', val)} />} last />
            <SettingRow label="Last Name" control={<Input value={data.personal.lastName} onChange={(val) => updateField('personal', 'lastName', val)} />} last />
            <SettingRow label="Email" control={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Input value={data.personal.email} onChange={(val) => updateField('personal', 'email', val)} width="160px" />
                {data.personal.emailVerified && <CheckCircle2 size={16} color="var(--aura-aurora-3)" />}
              </div>
            } last />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <SettingRow label="Birthday" control={<Input type="date" value={data.personal.dob} onChange={(val) => updateField('personal', 'dob', val)} />} last />
            <SettingRow label="Gender" control={<Select options={GENDERS} value={data.personal.gender} onChange={(val) => updateField('personal', 'gender', val)} />} last />
            <SettingRow label="Country" control={<Select options={COUNTRIES} value={data.personal.country} onChange={(val) => updateField('personal', 'country', val)} />} last />
          </div>
        </div>
      </section>

      {/* Wellness Identity */}
      <section>
        <div className={styles.sectionHeading}>
          Your Wellness Identity
          <div className={styles.tooltipWrapper} title="This helps AURA personalize plans and reports for you">
            <Info size={14} />
          </div>
        </div>
        
        <SettingCard title="Health Background">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <SettingRow 
              label="Relevant Conditions" 
              description="Sleep-affecting factors"
              control={
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxWidth: 300, justifyContent: 'flex-end' }}>
                  {['None', 'Anxiety', 'Insomnia', 'Chronic pain'].map(c => (
                    <Chip 
                      key={c} 
                      label={c} 
                      active={data.wellness.conditions.includes(c)} 
                      onClick={() => {
                        const newC = data.wellness.conditions.includes(c) 
                          ? data.wellness.conditions.filter(x => x !== c)
                          : [...data.wellness.conditions, c];
                        updateField('wellness', 'conditions', newC);
                      }}
                    />
                  ))}
                </div>
              }
              last
            />
            <div className={styles.wellnessBadge}>
              <Lock size={12} />
              <span>This stays on your device and is never shared</span>
            </div>
          </div>
        </SettingCard>

        <div className={styles.grid} style={{ marginTop: 24 }}>
          <SettingRow 
            label="Occupation" 
            control={
              <Select 
                options={[
                  {label:'Remote', value:'Remote'},
                  {label:'Standard', value:'Standard'},
                  {label:'Shift work', value:'Shift work'}
                ]} 
                value={data.wellness.occupation} 
                onChange={(val) => updateField('wellness', 'occupation', val)} 
              />
            } 
            last 
          />
          <SettingRow 
            label="Activity Level" 
            control={
              <SegmentedControl 
                options={[{label:'Low', value:'Low'}, {label:'Mod', value:'Moderate'}, {label:'High', value:'Active'}]} 
                value={data.wellness.activity} 
                onChange={(val) => updateField('wellness', 'activity', val)} 
              />
            } 
            last 
          />
        </div>
      </section>

      {/* Security Section */}
      <section>
        <div className={styles.sectionHeading}>Security</div>
        <div className={styles.securityHeader}>
          <span className={styles.securityScoreLabel}>Account Security</span>
          <span className={`${styles.securityStatus} ${security.color}`}>{security.label}</span>
        </div>
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill} 
            style={{ width: security.width, background: security.label === 'Strong' ? 'var(--aura-aurora-3)' : 'var(--aura-aurora-5)' }}
          />
        </div>

        <div className={styles.checklist}>
          <div className={styles.checkItem}>
            <div className={`${styles.checkCircle} ${styles.checkCircleDone}`}>
              <Check size={12} />
            </div>
            <span className={styles.checkLabel}>Email verified</span>
            <span className={styles.doneBadge}>Verified</span>
          </div>
          <div className={styles.checkItem}>
            <div className={`${styles.checkCircle} ${styles.checkCircleDone}`}>
              <Check size={12} />
            </div>
            <span className={styles.checkLabel}>Strong password set</span>
            <button className={styles.discardBtn} style={{ padding: '4px 12px', fontSize: 12 }}>Update</button>
          </div>
          <div className={styles.checkItem}>
            <div className={`${styles.checkCircle} ${data.security.has2FA ? styles.checkCircleDone : styles.checkCirclePending}`}>
              {data.security.has2FA && <Check size={12} />}
            </div>
            <span className={styles.checkLabel}>Two-factor authentication</span>
            <button 
              className="aura-button-ghost" 
              style={{ padding: '4px 12px', fontSize: 12, borderRadius: 8 }}
              onClick={() => updateField('security', 'has2FA', !data.security.has2FA)}
            >
              {data.security.has2FA ? 'Manage' : 'Enable'}
            </button>
          </div>
        </div>
      </section>

      {/* Connected Accounts */}
      <section>
        <div className={styles.sectionHeading}>Connected Accounts</div>
        <div className={styles.oauthGrid}>
          {data.connected.map(provider => (
            <div key={provider.id} className={`${styles.oauthCard} ${!provider.connected ? styles.oauthCardMuted : ''}`}>
              <Smartphone size={24} color={provider.connected ? 'var(--aura-aurora-1)' : 'var(--aura-muted)'} />
              <div className={styles.oauthInfo}>
                <div className={styles.oauthName}>{provider.name}</div>
                {provider.connected && <div className={styles.oauthDetail}>{provider.email}</div>}
              </div>
              <button 
                className={provider.connected ? styles.discardBtn : 'aura-button-primary'} 
                style={{ padding: '6px 16px', fontSize: 12, height: 32, minWidth: 100 }}
              >
                {provider.connected ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Floating Save Bar */}
      <div className={`${styles.saveBar} ${!hasChanges ? styles.saveBarHidden : ''}`}>
        <div className={styles.saveBarContent}>
          <span className={styles.saveBarText}>You have unsaved changes</span>
          <div className={styles.saveBarActions}>
            <button className={styles.discardBtn} onClick={() => {
              setData(INITIAL_ACCOUNT_DATA);
              setAvatarPreview(null);
            }}>Discard</button>
            <button 
              className={`${styles.saveBtn} ${saveSuccess ? styles.saveBtnSuccess : ''}`}
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : saveSuccess ? <Check size={18} /> : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
    </AppShell>
  );
}

// Sub-component for grouping fields in logic
function SettingCard({ title, children }) {
  return (
    <div style={{ 
      background: 'var(--aura-depth)', 
      border: '1px solid var(--aura-border)', 
      borderRadius: 'var(--radius-lg)',
      padding: '24px'
    }}>
      {title && <div className={styles.sectionHeading} style={{ marginBottom: 20 }}>{title}</div>}
      {children}
    </div>
  );
}
