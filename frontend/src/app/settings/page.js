'use client';
import { AlertTriangle, Bell, Camera, Check, ChevronRight, Clock, Database, ExternalLink, Eye, Loader2, Lock, LogOut, Mail, Moon, Puzzle, Shield, Smartphone, User } from 'lucide-react';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

import styles from './page.module.css';
import AppShell from '@/components/AppShell';
import { 
  AuraToggle, 
  AuraToggleRow,
  AuraSelect, 
  AuraSlider,
  AuraSettingRow 
} from '@/components/aura-ui';
import { 
  Input, 
  Textarea, 
  SegmentedControl, 
  Chip, 
  SettingCard,
  TagInput,
  DualSlider
} from './components/Controls';

const SECTIONS = [
  { id: 'profile', label: 'Profile', icon: User, group: 'Personal' },
  { id: 'account', label: 'Account & Security', icon: Shield, group: 'Account' },
  { id: 'notifications', label: 'Notifications', icon: Bell, group: 'Account' },
  { id: 'wellness', label: 'Wellness Preferences', icon: Check, group: 'Wellness' },
  { id: 'sleep', label: 'Sleep Settings', icon: Moon, group: 'Wellness' },
  { id: 'appearance', label: 'Appearance', icon: Eye, group: 'System' },
  { id: 'data', label: 'Data & Privacy', icon: Database, group: 'System' },
  { id: 'integrations', label: 'Integrations', icon: Puzzle, group: 'System' },
  { id: 'danger', label: 'Danger Zone', icon: AlertTriangle, group: 'Danger' }
];

const INITIAL_STATE = {
  profile: {
    name: 'Matheus Silva',
    bio: 'Finding peace in the code and clarity in the mind.',
    dob: '1995-08-24',
    timezone: 'Europe/Lisbon',
    avatar: null
  },
  account: {
    email: 'matheus@example.com',
    twoFactor: false
  },
  notifications: {
    pushMaster: true,
    reminderTime: '08:00',
    weeklyReportDay: 'Monday',
    streakAlerts: true,
    milestones: true,
    emailSummary: true,
    emailTips: false,
    emailProduct: true,
    intensity: 2 // 1: minimal, 2: balanced, 3: full
  },
  wellness: {
    goals: ['Better sleep', 'Stress reduction'],
    wakeTime: '07:30',
    sleepTarget: '8h',
    stressTriggers: ['Deadlines', 'Screen time'],
    checkInDay: 'Sunday'
  },
  sleep: {
    bedtime: [22.5, 23.5], // 10:30 PM - 11:30 PM
    windDown: '30',
    sound: 'Rain',
    smartAlarm: true,
    alarmWindow: '30',
    debtTracking: true
  },
  appearance: {
    theme: 'dark',
    accent: 'violet',
    reduceMotion: false,
    fontSize: 'default',
    denseMode: false
  },
  privacy: {
    analytics: true,
    personalization: true,
    retention: 'Forever'
  }
};

export default function SettingsPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('profile');
  const [settings, setSettings] = useState(INITIAL_STATE);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null); // 'email' or 'password'
  const [highlightEmail, setHighlightEmail] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = (localStorage.getItem('aura_user') || sessionStorage.getItem('aura_user')) || sessionStorage.getItem('aura_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      // Optionally sync profile name from stored user
      const userData = JSON.parse(storedUser);
      if (userData.name) {
        setSettings(prev => ({
          ...prev,
          profile: { ...prev.profile, name: userData.name }
        }));
      }
    } else {
      router.push('/login');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('aura_user');
    localStorage.removeItem('aura_token');
    sessionStorage.removeItem('aura_user');
    sessionStorage.removeItem('aura_token');
    router.push('/login');
  };
  
  // Refs for scrolling to sections
  const sectionRefs = {
    profile: useRef(null),
    account: useRef(null),
    notifications: useRef(null),
    wellness: useRef(null),
    sleep: useRef(null),
    appearance: useRef(null),
    data: useRef(null),
    integrations: useRef(null),
    danger: useRef(null)
  };

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(INITIAL_STATE);

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }, 1500);
  };

  const updateSetting = (section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const scrollToSection = (id) => {
    setActiveSection(id);
    sectionRefs[id].current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Intersection Observer to update active nav item on scroll
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    }, { threshold: 0.5 });

    Object.values(sectionRefs).forEach(ref => {
      if (ref.current) observer.observe(ref.current);
    });

    return () => observer.disconnect();
  }, []);

  const renderNav = () => {
    const groups = ['Personal', 'Account', 'Wellness', 'System', 'Danger'];
    return (
      <nav className={styles.sidebar}>
        {groups.map(group => (
          <div key={group} className={styles.navGroup}>
            <div className={styles.navGroupLabel}>{group}</div>
            {SECTIONS.filter(s => s.group === group).map(section => (
              <div 
                key={section.id} 
                className={`${styles.navItem} ${activeSection === section.id ? styles.navItemActive : ''}`}
                onClick={() => scrollToSection(section.id)}
              >
                {section.label}
              </div>
            ))}
            {group === 'Danger' && (
              <div 
                className={styles.navItem} 
                onClick={handleLogout}
                style={{ marginTop: 8 }}
              >
                <LogOut size={14} style={{ marginRight: 8 }} />
                Log Out
              </div>
            )}
          </div>
        ))}
      </nav>
    );
  };

  return (
    <AppShell title="settings & preferences">
      <div className={styles.settingsContainer}>
        {renderNav()}

        <main className={styles.contentArea}>
          {/* PROFILE */}
          <section id="profile" ref={sectionRefs.profile} className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Profile</h2>
              <p className={styles.sectionSubtitle}>Manage your public identity and personal details.</p>
            </div>
            
            <SettingCard>
              <div className={styles.avatarSection}>
                <div className={styles.avatarUpload}>
                  <User size={32} color="var(--aura-muted)" />
                  <div className={styles.avatarHover}>
                    <Camera size={20} color="white" />
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <span className={styles.label}>Avatar Image</span>
                  <p className={styles.description}>JPG, PNG or GIF. Max 2MB.</p>
                </div>
              </div>

              <AuraSettingRow label="Display Name">
                <Input 
                  value={settings.profile.name} 
                  onChange={(val) => updateSetting('profile', 'name', val)}
                />
              </AuraSettingRow>
              <AuraSettingRow label="Bio">
                <Textarea 
                  value={settings.profile.bio} 
                  onChange={(val) => updateSetting('profile', 'bio', val)}
                  maxLength={120}
                />
              </AuraSettingRow>
              <AuraSettingRow label="Date of Birth">
                <Input 
                  type="date"
                  value={settings.profile.dob} 
                  onChange={(val) => updateSetting('profile', 'dob', val)}
                />
              </AuraSettingRow>
              <AuraSettingRow label="Timezone">
                <AuraSelect 
                  value={settings.profile.timezone}
                  onChange={(val) => updateSetting('profile', 'timezone', val)}
                  options={[
                    { value: 'Europe/Lisbon', label: '(GMT+0) Lisbon' },
                    { value: 'America/New_York', label: '(GMT-5) New York' },
                    { value: 'Asia/Tokyo', label: '(GMT+9) Tokyo' }
                  ]}
                  width="180px"
                />
              </AuraSettingRow>
            </SettingCard>
          </section>

          {/* ACCOUNT & SECURITY */}
          <section id="account" ref={sectionRefs.account} className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Account & Security</h2>
              <p className={styles.sectionSubtitle}>Secure your access and connected services.</p>
            </div>

            <div className={styles.inlineEditContainer}>
              <div 
                className={styles.inlineEditHeader}
                onClick={() => setExpandedRow(expandedRow === 'email' ? null : 'email')}
              >
                <div className={styles.inlineEditLabel}>
                  <span className={styles.label}>Email Address</span>
                  <span className={`${styles.inlineEditValue} ${highlightEmail ? styles.valueHighlight : ''}`}>
                    {settings.account.email}
                  </span>
                </div>
                <button className={styles.destructiveButton}>Edit</button>
              </div>
              {expandedRow === 'email' && (
                <div className={styles.inlineEditContent}>
                  <Input 
                    placeholder="New email address" 
                    width="100%"
                    onChange={(val) => {/* temp logic */}} 
                  />
                  <div className={styles.inlineEditActions}>
                    <button className={styles.destructiveButton} onClick={() => setExpandedRow(null)}>Cancel</button>
                    <button 
                      className={styles.saveButton} 
                      onClick={() => {
                        setHighlightEmail(true);
                        setExpandedRow(null);
                        setTimeout(() => setHighlightEmail(false), 1500);
                      }}
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              )}
            </div>

            <AuraSettingRow label="Password">
              <button className={styles.destructiveButton}>Change</button>
            </AuraSettingRow>
            
            <AuraToggleRow 
              label="Two-factor Authentication" 
              description="Add an extra layer of security"
              checked={settings.account.twoFactor} 
              onChange={(val) => updateSetting('account', 'twoFactor', val)} 
            />

            <AuraSettingRow label="Connected Accounts">
              <div style={{ display: 'flex', gap: 8 }}>
                <div className={styles.chip}><Smartphone size={14} /> Google</div>
                <div className={styles.chip}><Smartphone size={14} /> Apple</div>
              </div>
            </AuraSettingRow>
          </section>

          {/* NOTIFICATIONS */}
          <section id="notifications" ref={sectionRefs.notifications} className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Notifications</h2>
              <p className={styles.sectionSubtitle}>Stay balanced with mindful alerts.</p>
            </div>

            <SettingCard title="Push Notifications">
              <AuraToggleRow 
                label="Master Push Toggle" 
                checked={settings.notifications.pushMaster} 
                onChange={(val) => updateSetting('notifications', 'pushMaster', val)} 
              />
              {settings.notifications.pushMaster && (
                <>
                  <AuraSettingRow label="Daily Reminder">
                    <Input 
                      type="time" 
                      value={settings.notifications.reminderTime}
                      onChange={(val) => updateSetting('notifications', 'reminderTime', val)}
                    />
                  </AuraSettingRow>
                  <AuraSettingRow label="Weekly Report">
                    <AuraSelect 
                      value={settings.notifications.weeklyReportDay}
                      onChange={(val) => updateSetting('notifications', 'weeklyReportDay', val)}
                      options={[
                        { value: 'Monday', label: 'Monday' },
                        { value: 'Sunday', label: 'Sunday' }
                      ]}
                      width="140px"
                    />
                  </AuraSettingRow>
                  <AuraToggleRow 
                    label="Streak Alerts" 
                    checked={settings.notifications.streakAlerts} 
                    onChange={(val) => updateSetting('notifications', 'streakAlerts', val)} 
                  />
                </>
              )}
            </SettingCard>

            <SettingCard title="Reminder Intensity">
              <div style={{ padding: '8px 0' }}>
                <AuraSlider 
                  min={1} 
                  max={3} 
                  step={1}
                  value={settings.notifications.intensity} 
                  onChange={(val) => updateSetting('notifications', 'intensity', val)} 
                  leftLabel="Gentle"
                  rightLabel="Consistent"
                  showValue={true}
                  stops={[1, 2, 3]}
                />
              </div>
            </SettingCard>

            <SettingCard title="Email Notifications">
              <AuraToggleRow 
                label="Weekly Summary" 
                checked={settings.notifications.emailSummary} 
                onChange={(val) => updateSetting('notifications', 'emailSummary', val)} 
              />
              <AuraToggleRow 
                label="Product Updates" 
                checked={settings.notifications.emailProduct} 
                onChange={(val) => updateSetting('notifications', 'emailProduct', val)} 
              />
            </SettingCard>
          </section>

          {/* WELLNESS PREFERENCES */}
          <section id="wellness" ref={sectionRefs.wellness} className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Wellness Preferences</h2>
              <p className={styles.sectionSubtitle}>Tailor the AI to your lifestyle goals.</p>
            </div>

            <SettingCard title="Primary Goals">
              <div className={styles.chipsContainer}>
                {['Better sleep', 'Stress reduction', 'Focus', 'Mood tracking', 'Mindfulness', 'Energy'].map(goal => (
                  <Chip 
                    key={goal} 
                    label={goal} 
                    active={settings.wellness.goals.includes(goal)}
                    onClick={() => {
                      const newGoals = settings.wellness.goals.includes(goal)
                        ? settings.wellness.goals.filter(g => g !== goal)
                        : [...settings.wellness.goals, goal];
                      updateSetting('wellness', 'goals', newGoals);
                    }}
                  />
                ))}
              </div>
            </SettingCard>

            <SettingCard title="Stress Triggers">
              <TagInput 
                tags={settings.wellness.stressTriggers}
                onAdd={(tag) => updateSetting('wellness', 'stressTriggers', [...settings.wellness.stressTriggers, tag])}
                onRemove={(tag) => updateSetting('wellness', 'stressTriggers', settings.wellness.stressTriggers.filter(t => t !== tag))}
              />
            </SettingCard>

            <SettingCard>
              <AuraSettingRow label="Wake Time">
                <Input type="time" value={settings.wellness.wakeTime} onChange={(val) => updateSetting('wellness', 'wakeTime', val)} />
              </AuraSettingRow>
              <AuraSettingRow label="Average Sleep Target">
                  <SegmentedControl 
                    options={[{value:'6h',label:'6h'},{value:'7h',label:'7h'},{value:'8h',label:'8h'},{value:'9h+',label:'9h+'}]} 
                    value={settings.wellness.sleepTarget}
                    onChange={(val) => updateSetting('wellness', 'sleepTarget', val)}
                  />
              </AuraSettingRow>
              <AuraSettingRow label="Weekly Check-in Day">
                  <div style={{ display: 'flex', gap: 4 }}>
                    {['S','M','T','W','T','F','S'].map((d, i) => (
                      <div 
                        key={i}
                        className={`${styles.chip} ${settings.wellness.checkInDay === i ? styles.chipActive : ''}`}
                        style={{ width: 32, height: 32, padding: 0, justifyContent: 'center', borderRadius: '50%' }}
                        onClick={() => updateSetting('wellness', 'checkInDay', i)}
                      >
                        {d}
                      </div>
                    ))}
                  </div>
              </AuraSettingRow>
            </SettingCard>
          </section>

          {/* SLEEP SETTINGS */}
          <section id="sleep" ref={sectionRefs.sleep} className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Sleep Settings</h2>
              <p className={styles.sectionSubtitle}>Fine-tune your nightly restoration cycles.</p>
            </div>

            <SettingCard>
              <AuraSettingRow 
                label="Bedtime Window" 
                description={`Target: ${Math.floor(settings.sleep.bedtime[0])}:${(settings.sleep.bedtime[0]%1)*60 || '00'} - ${Math.floor(settings.sleep.bedtime[1])}:${(settings.sleep.bedtime[1]%1)*60 || '00'}`}
              >
                  <DualSlider 
                    min={18} 
                    max={28} 
                    value={settings.sleep.bedtime} 
                    onChange={(val) => updateSetting('sleep', 'bedtime', val)} 
                  />
              </AuraSettingRow>
              <AuraSettingRow label="Sleep sound preference">
                  <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
                    {['Rain', 'Brown noise', 'Silence', 'Ocean'].map(s => (
                      <div 
                        key={s}
                        className={`${styles.chip} ${settings.sleep.sound === s ? styles.chipActive : ''}`}
                        onClick={() => updateSetting('sleep', 'sound', s)}
                      >
                        {s}
                      </div>
                    ))}
                  </div>
              </AuraSettingRow>
            </SettingCard>

            <SettingCard title="Smart Alarms">
              <AuraToggleRow 
                label="Sleep Debt Tracking" 
                checked={settings.sleep.debtTracking} 
                onChange={(val) => updateSetting('sleep', 'debtTracking', val)} 
              />
              <AuraSettingRow label="Smart Alarm Window">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AuraToggle checked={settings.sleep.smartAlarm} onChange={(val) => updateSetting('sleep', 'smartAlarm', val)} />
                    <AuraSelect 
                      value={settings.sleep.alarmWindow}
                      onChange={(val) => updateSetting('sleep', 'alarmWindow', val)}
                      options={[
                        {value:'15',label:'±15 min'},
                        {value:'30',label:'±30 min'}
                      ]}
                      width="120px"
                    />
                  </div>
              </AuraSettingRow>
            </SettingCard>
          </section>

          {/* APPEARANCE */}
          <section id="appearance" ref={sectionRefs.appearance} className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Appearance</h2>
              <p className={styles.sectionSubtitle}>Customize the UI to your aesthetic preference.</p>
            </div>

            <AuraSettingRow label="Theme">
                <SegmentedControl 
                  options={[{value:'system',label:'System'},{value:'light',label:'Light'},{value:'dark',label:'Dark'}]} 
                  value={settings.appearance.theme}
                  onChange={(val) => updateSetting('appearance', 'theme', val)}
                />
            </AuraSettingRow>

            <AuraSettingRow label="Accent Color">
                <div style={{ display: 'flex', gap: 12 }}>
                  {['#10b981', '#06b6d4', '#14b8a6', '#3b82f6', '#f59e0b', '#fb7185'].map(c => (
                    <div 
                      key={c}
                      style={{ 
                        width: 24, 
                        height: 24, 
                        borderRadius: '50%', 
                        background: c, 
                        cursor: 'pointer',
                        border: settings.appearance.accent === c ? '2px solid white' : 'none',
                        transform: settings.appearance.accent === c ? 'scale(1.15)' : 'none',
                        transition: 'all 200ms ease'
                      }}
                      onClick={() => updateSetting('appearance', 'accent', c)}
                    />
                  ))}
                </div>
            </AuraSettingRow>

            <AuraToggleRow 
              label="Reduce Motion" 
              checked={settings.appearance.reduceMotion} 
              onChange={(val) => updateSetting('appearance', 'reduceMotion', val)} 
            />

            <AuraToggleRow 
              label="Dense Mode" 
              checked={settings.appearance.denseMode} 
              onChange={(val) => updateSetting('appearance', 'denseMode', val)} 
            />
          </section>

          {/* DATA & PRIVACY */}
          <section id="data" ref={sectionRefs.data} className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Data & Privacy</h2>
              <p className={styles.sectionSubtitle}>Control your data and how it's used.</p>
            </div>

            <AuraSettingRow 
              label="Data Export" 
              description="Download all your wellness history."
            >
              <button className={styles.destructiveButton}>Download .JSON</button>
            </AuraSettingRow>
            
            <AuraToggleRow 
              label="AI Personalization" 
              description="Allow AI to use history for personalized plans."
              checked={settings.privacy.personalization} 
              onChange={(val) => updateSetting('privacy', 'personalization', val)} 
            />

            <AuraSettingRow label="Data Retention">
                <AuraSelect 
                  value={settings.privacy.retention}
                  onChange={(val) => updateSetting('privacy', 'retention', val)}
                  options={[
                    {value:'1 year', label:'1 year'},
                    {value:'Forever', label:'Forever'}
                  ]}
                  width="140px"
                />
            </AuraSettingRow>
          </section>

          {/* INTEGRATIONS */}
          <section id="integrations" ref={sectionRefs.integrations} className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Integrations</h2>
              <p className={styles.sectionSubtitle}>Connect with your favorite health apps.</p>
            </div>

            <SettingCard>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 40, height: 40, background: 'var(--aura-surface)', borderRadius: 10, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Smartphone color="var(--aura-aurora-1)" />
                </div>
                <div style={{ flex: 1 }}>
                  <span className={styles.label}>Apple Health / Google Fit</span>
                  <p className={styles.description}>Sync sleep and activity data automatically.</p>
                </div>
                <AuraToggle checked={true} onChange={()=>{}} />
              </div>
            </SettingCard>

            <SettingCard>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 40, height: 40, background: 'var(--aura-surface)', borderRadius: 10, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Database color="var(--aura-aurora-3)" />
                </div>
                <div style={{ flex: 1 }}>
                  <span className={styles.label}>Spotify</span>
                  <p className={styles.description}>Music for your meditations.</p>
                </div>
                <button className={styles.destructiveButton}>Connect</button>
              </div>
            </SettingCard>
          </section>

          {/* DANGER ZONE */}
          <section id="danger" ref={sectionRefs.danger} className={styles.section}>
            <div className={styles.dangerZone}>
              <h2 className={styles.dangerTitle}>Danger Zone</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span className={styles.label}>Deactivate Account</span>
                    <p className={styles.description}>Temporarily disable your profile.</p>
                  </div>
                  <button className={styles.destructiveButton}>Deactivate</button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span className={styles.label} style={{ color: '#ef4444' }}>Delete Account</span>
                    <p className={styles.description}>Permanently remove all data. This cannot be undone.</p>
                  </div>
                  {expandedRow !== 'delete' && (
                    <button 
                      className={styles.destructiveButton} 
                      style={{ borderColor: '#ef4444', color: '#ef4444' }}
                      onClick={() => setExpandedRow('delete')}
                    >
                      Delete Account
                    </button>
                  )}
                </div>

                {expandedRow === 'delete' && (
                  <div className={styles.confirmContainer} style={{ width: '100%', animation: 'expandWidth 400ms var(--ease-spring)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <span style={{ fontSize: '14px', fontWeight: 500 }}>Are you sure? This cannot be undone.</span>
                      <div className={styles.inlineEditActions}>
                        <button className={styles.destructiveButton} onClick={() => setExpandedRow(null)}>Cancel</button>
                        <button className={styles.saveButton} style={{ background: '#ef4444' }} disabled={settings.deleteConfirm !== 'DELETE'}>Confirm Delete</button>
                      </div>
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <p style={{ fontSize: '12px', color: 'var(--aura-muted)', marginBottom: 8 }}>Type "DELETE" to confirm:</p>
                      <Input 
                        placeholder="DELETE" 
                        width="100%" 
                        value={settings.deleteConfirm || ''} 
                        onChange={(val) => setSettings(prev => ({ ...prev, deleteConfirm: val }))} 
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          <div style={{ height: 100 }} /> {/* Space for footer */}
        </main>
      </div>

      {hasChanges && (
        <div className={styles.footer}>
          <div className={styles.footerContent}>
            <div className={styles.unsavedIndicator}>
              <div className={styles.unsavedDot} />
              <span>Unsaved changes</span>
            </div>
            <button 
              className={styles.saveButton} 
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="animate-spin" size={18} />
              ) : saveSuccess ? (
                <>
                  <Check size={18} />
                  <span>Saved</span>
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
