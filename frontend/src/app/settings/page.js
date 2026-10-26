'use client';
import { AlertTriangle, Bell, Camera, Check, ChevronRight, Clock, Database, ExternalLink, Eye, Loader2, Lock, LogOut, Mail, Moon, Puzzle, Shield, Smartphone, User } from 'lucide-react';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

import styles from './page.module.css';
import { api } from '@/lib/api';
import { useTheme } from '@/context/ThemeContext';
import AppShell from '@/components/AppShell';
import { useI18n } from '@/i18n';
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


const INITIAL_STATE = {
  profile: {
    name: '',
    bio: '',
    dob: '',
    timezone: 'Europe/Lisbon',
    avatar: null
  },
  account: {
    email: '',
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
    checkInDay: 0
  },
  sleep: {
    bedtime: [22.5, 23.5], // 10:30 PM - 11:30 PM
    windDown: '30',
    sound: 'Rain',
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

import { useAuth } from '@/context/AuthContext';

export default function SettingsPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { user, updateUser, logout } = useAuth();
  const [activeSection, setActiveSection] = useState('profile');

  const SECTIONS = [
    { id: 'profile', label: t('settings.navProfile'), icon: User, group: 'Personal' },
    { id: 'account', label: t('settings.navAccountSecurity'), icon: Shield, group: 'Account' },
    { id: 'notifications', label: t('settings.navNotifications'), icon: Bell, group: 'Account' },
    { id: 'wellness', label: t('settings.navWellness'), icon: Check, group: 'Wellness' },
    { id: 'sleep', label: t('settings.navSleep'), icon: Moon, group: 'Wellness' },
    { id: 'appearance', label: t('settings.navAppearance'), icon: Eye, group: 'System' },
    { id: 'data', label: t('settings.navDataPrivacy'), icon: Database, group: 'System' },
    { id: 'danger', label: t('settings.navDangerZone'), icon: AlertTriangle, group: 'Danger' }
  ];

  const groupLabels = {
    Personal: t('settings.navGroupPersonal'),
    Account: t('settings.navGroupAccount'),
    Wellness: t('settings.navGroupWellness'),
    System: t('settings.navGroupSystem'),
    Danger: t('settings.navGroupDanger')
  };
  const { setTheme } = useTheme();
  const [settings, setSettings] = useState(INITIAL_STATE);
  const [baseline, setBaseline] = useState(INITIAL_STATE);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null); // 'email' or 'password'
  const [highlightEmail, setHighlightEmail] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const [profile, preferences] = await Promise.all([api.getUser(user.id), api.getUserSettings()]);
      if (cancelled) return;
      if (profile.error || preferences.error) { setSaveError(profile.error || preferences.error); return; }
      const u = profile.data.data;
      const p = preferences.data.data;
      const loaded = structuredClone(INITIAL_STATE);
      loaded.profile = { ...loaded.profile, name: u.display_name || u.name || '', bio: u.bio || '', dob: u.date_of_birth || '', timezone: u.timezone || 'Europe/Lisbon' };
      loaded.account.email = u.email || '';
      if (p.push_enabled !== undefined) loaded.notifications.pushMaster = p.push_enabled;
      if (p.daily_reminder_time !== undefined) loaded.notifications.reminderTime = p.daily_reminder_time;
      if (p.weekly_report_day !== undefined) loaded.notifications.weeklyReportDay = p.weekly_report_day;
      if (p.streak_alerts !== undefined) loaded.notifications.streakAlerts = p.streak_alerts;
      if (p.milestone_alerts !== undefined) loaded.notifications.milestones = p.milestone_alerts;
      if (p.email_weekly_summary !== undefined) loaded.notifications.emailSummary = p.email_weekly_summary;
      if (p.email_tips !== undefined) loaded.notifications.emailTips = p.email_tips;
      if (p.email_product !== undefined) loaded.notifications.emailProduct = p.email_product;
      if (p.notif_intensity !== undefined) loaded.notifications.intensity = p.notif_intensity;
      if (p.wellness_goals !== undefined) loaded.wellness.goals = p.wellness_goals;
      if (p.target_wake_time !== undefined) loaded.wellness.wakeTime = p.target_wake_time;
      if (p.stress_triggers !== undefined) loaded.wellness.stressTriggers = p.stress_triggers;
      if (p.weekly_checkin_day !== undefined) loaded.wellness.checkInDay = p.weekly_checkin_day;
      if (p.sleep_sound_pref !== undefined) loaded.sleep.sound = p.sleep_sound_pref;
      if (p.sleep_debt_tracking !== undefined) loaded.sleep.debtTracking = p.sleep_debt_tracking;
      if (p.theme !== undefined) loaded.appearance.theme = p.theme;
      if (p.accent_color !== undefined) loaded.appearance.accent = p.accent_color;
      if (p.reduce_motion !== undefined) loaded.appearance.reduceMotion = p.reduce_motion;
      if (p.text_size !== undefined) loaded.appearance.fontSize = p.text_size;
      if (p.dense_mode !== undefined) loaded.appearance.denseMode = p.dense_mode;
      if (p.personalization !== undefined) loaded.privacy.personalization = p.personalization;
      if (p.sleep_target_hours !== undefined) loaded.wellness.sleepTarget = p.sleep_target_hours + 'h';
      if (p.wind_down_minutes !== undefined) loaded.sleep.windDown = String(p.wind_down_minutes);
      if (p.target_bedtime_start !== undefined) loaded.sleep.bedtime = [p.target_bedtime_start, p.target_bedtime_end];
      setSettingsLoaded(true);
      setSettings(loaded); setBaseline(structuredClone(loaded)); setTheme(loaded.appearance.theme);
    })();
    return () => { cancelled = true; };
  }, [user?.id, setTheme]);

  const handleLogout = () => {
    logout();
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

  const hasChanges = settingsLoaded && JSON.stringify(settings) !== JSON.stringify(baseline);

  const handleSave = async () => {
    setIsSaving(true); setSaveError('');
    try {
      const profile = await api.updateUser(user.id, { display_name: settings.profile.name, bio: settings.profile.bio,
        date_of_birth: settings.profile.dob, timezone: settings.profile.timezone });
      if (profile.error) throw new Error(profile.error);
      const saved = await api.updateUserSettings({
      push_enabled: settings.notifications.pushMaster,
      daily_reminder_time: settings.notifications.reminderTime,
      weekly_report_day: settings.notifications.weeklyReportDay,
      streak_alerts: settings.notifications.streakAlerts,
      milestone_alerts: settings.notifications.milestones,
      email_weekly_summary: settings.notifications.emailSummary,
      email_tips: settings.notifications.emailTips,
      email_product: settings.notifications.emailProduct,
      notif_intensity: settings.notifications.intensity,
      wellness_goals: settings.wellness.goals,
      target_wake_time: settings.wellness.wakeTime,
      stress_triggers: settings.wellness.stressTriggers,
      weekly_checkin_day: settings.wellness.checkInDay,
      sleep_sound_pref: settings.sleep.sound,
      sleep_debt_tracking: settings.sleep.debtTracking,
      theme: settings.appearance.theme,
      accent_color: settings.appearance.accent,
      reduce_motion: settings.appearance.reduceMotion,
      text_size: settings.appearance.fontSize,
      dense_mode: settings.appearance.denseMode,
      personalization: settings.privacy.personalization,
        sleep_target_hours: parseFloat(settings.wellness.sleepTarget), wind_down_minutes: Number(settings.sleep.windDown),
        target_bedtime_start: settings.sleep.bedtime[0], target_bedtime_end: settings.sleep.bedtime[1],
      });
      if (saved.error) throw new Error(saved.error);
      updateUser(profile.data.data);
      setTheme(settings.appearance.theme);
      localStorage.setItem('aura_accent', settings.appearance.accent);
      if (settings.appearance.accent.startsWith('#')) document.documentElement.style.setProperty('--brand-primary', settings.appearance.accent);
      setBaseline(structuredClone(settings)); setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) { setSaveError(error.message); }
    finally { setIsSaving(false); }
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
            <div className={styles.navGroupLabel}>{groupLabels[group] || group}</div>
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
                {t('settings.navLogOut')}
              </div>
            )}
          </div>
        ))}
      </nav>
    );
  };

  return (
    <AppShell title={t('settings.title')}>
      <div role="alert" style={{ color: '#ef4444' }}>{saveError}</div>
      <div className={styles.settingsContainer}>
        {renderNav()}

        <main className={styles.contentArea}>
          {/* PROFILE */}
          <section id="profile" ref={sectionRefs.profile} className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>{t('settings.profileTitle')}</h2>
              <p className={styles.sectionSubtitle}>{t('settings.profileSubtitle')}</p>
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
                  <span className={styles.label}>{t('settings.avatarLabel')}</span>
                  <p className={styles.description}>{t('settings.avatarDesc')}</p>
                </div>
              </div>

              <AuraSettingRow label={t('settings.displayName')}>
                <Input 
                  value={settings.profile.name} 
                  onChange={(val) => updateSetting('profile', 'name', val)}
                />
              </AuraSettingRow>
              <AuraSettingRow label={t('settings.bio')}>
                <Textarea 
                  value={settings.profile.bio} 
                  onChange={(val) => updateSetting('profile', 'bio', val)}
                  maxLength={120}
                />
              </AuraSettingRow>
              <AuraSettingRow label={t('settings.dateOfBirth')}>
                <Input 
                  type="date"
                  value={settings.profile.dob} 
                  onChange={(val) => updateSetting('profile', 'dob', val)}
                />
              </AuraSettingRow>
              <AuraSettingRow label={t('settings.timezone')}>
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
              <h2 className={styles.sectionTitle}>{t('settings.accountTitle')}</h2>
              <p className={styles.sectionSubtitle}>{t('settings.accountSubtitle')}</p>
            </div>

            <div className={styles.inlineEditContainer}>
              <div 
                className={styles.inlineEditHeader}
                onClick={() => setExpandedRow(expandedRow === 'email' ? null : 'email')}
              >
                <div className={styles.inlineEditLabel}>
                  <span className={styles.label}>{t('settings.emailAddress')}</span>
                  <span className={`${styles.inlineEditValue} ${highlightEmail ? styles.valueHighlight : ''}`}>
                    {settings.account.email}
                  </span>
                </div>
                <button className={styles.destructiveButton}>{t('settings.edit')}</button>
              </div>
              {expandedRow === 'email' && (
                <div className={styles.inlineEditContent}>
                  <Input 
                    placeholder={t('settings.newEmailPlaceholder')} 
                    width="100%"
                    value={newEmail} onChange={setNewEmail}
                  />
                  <input type="password" autoComplete="current-password" placeholder="Palavra-passe atual / Current password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
                  <div className={styles.inlineEditActions}>
                    <button className={styles.destructiveButton} onClick={() => setExpandedRow(null)}>{t('settings.cancel')}</button>
                    <button 
                      className={styles.saveButton} 
                      onClick={async () => {
                        const result = await api.changeEmail(newEmail, currentPassword);
                        if (result.error) setSaveError(result.error);
                        else {
                          setExpandedRow(null); setCurrentPassword('');
                          window.alert('Confirme a alteração no seu e-mail. / Confirm the change in your email.');
                        }
                      }}
                    >
                      {t('settings.confirm')}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <AuraSettingRow label={t('settings.password')}>
              <button className={styles.destructiveButton} onClick={async () => {
                const result = await api.forgotPassword(user.email);
                if (result.error) setSaveError(result.error);
                else window.alert('Instruções enviadas por e-mail. / Instructions sent by email.');
              }}>{t('settings.change')}</button>
            </AuraSettingRow>
            
          </section>

          {/* NOTIFICATIONS */}
          <section id="notifications" ref={sectionRefs.notifications} className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>{t('settings.notificationsTitle')}</h2>
              <p className={styles.sectionSubtitle}>{t('settings.notificationsSubtitle')}</p>
            </div>

            <SettingCard title={t('settings.pushNotifications')}>
              <AuraToggleRow 
                label={t('settings.masterPushToggle')} 
                checked={settings.notifications.pushMaster} 
                onChange={(val) => updateSetting('notifications', 'pushMaster', val)} 
              />
              {settings.notifications.pushMaster && (
                <>
                  <AuraSettingRow label={t('settings.dailyReminder')}>
                    <Input 
                      type="time" 
                      value={settings.notifications.reminderTime}
                      onChange={(val) => updateSetting('notifications', 'reminderTime', val)}
                    />
                  </AuraSettingRow>
                  <AuraSettingRow label={t('settings.weeklyReport')}>
                    <AuraSelect 
                      value={settings.notifications.weeklyReportDay}
                      onChange={(val) => updateSetting('notifications', 'weeklyReportDay', val)}
                      options={[
                        { value: 'Monday', label: t('settings.monday') },
                        { value: 'Sunday', label: t('settings.sunday') }
                      ]}
                      width="140px"
                    />
                  </AuraSettingRow>
                  <AuraToggleRow 
                    label={t('settings.streakAlerts')} 
                    checked={settings.notifications.streakAlerts} 
                    onChange={(val) => updateSetting('notifications', 'streakAlerts', val)} 
                  />
                </>
              )}
            </SettingCard>

            <SettingCard title={t('settings.reminderIntensity')}>
              <div style={{ padding: '8px 0' }}>
                <AuraSlider 
                  min={1} 
                  max={3} 
                  step={1}
                  value={settings.notifications.intensity} 
                  onChange={(val) => updateSetting('notifications', 'intensity', val)} 
                  leftLabel={t('settings.gentle')}
                  rightLabel={t('settings.consistent')}
                  showValue={true}
                  stops={[1, 2, 3]}
                />
              </div>
            </SettingCard>

            <SettingCard title={t('settings.emailNotifications')}>
              <AuraToggleRow 
                label={t('settings.weeklySummary')} 
                checked={settings.notifications.emailSummary} 
                onChange={(val) => updateSetting('notifications', 'emailSummary', val)} 
              />
              <AuraToggleRow 
                label={t('settings.productUpdates')} 
                checked={settings.notifications.emailProduct} 
                onChange={(val) => updateSetting('notifications', 'emailProduct', val)} 
              />
            </SettingCard>
          </section>

          {/* WELLNESS PREFERENCES */}
          <section id="wellness" ref={sectionRefs.wellness} className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>{t('settings.wellnessTitle')}</h2>
              <p className={styles.sectionSubtitle}>{t('settings.wellnessSubtitle')}</p>
            </div>

            <SettingCard title={t('settings.primaryGoals')}>
              <div className={styles.chipsContainer}>
                {[
                  { id: 'Better sleep', label: t('settings.goalBetterSleep') },
                  { id: 'Stress reduction', label: t('settings.goalStressReduction') },
                  { id: 'Focus', label: t('settings.goalFocus') },
                  { id: 'Mood tracking', label: t('settings.goalMoodTracking') },
                  { id: 'Mindfulness', label: t('settings.goalMindfulness') },
                  { id: 'Energy', label: t('settings.goalEnergy') }
                ].map(goal => (
                  <Chip 
                    key={goal.id} 
                    label={goal.label} 
                    active={settings.wellness.goals.includes(goal.id)}
                    onClick={() => {
                      const newGoals = settings.wellness.goals.includes(goal.id)
                        ? settings.wellness.goals.filter(g => g !== goal.id)
                        : [...settings.wellness.goals, goal.id];
                      updateSetting('wellness', 'goals', newGoals);
                    }}
                  />
                ))}
              </div>
            </SettingCard>

            <SettingCard title={t('settings.stressTriggers')}>
              <TagInput 
                tags={settings.wellness.stressTriggers}
                onAdd={(tag) => updateSetting('wellness', 'stressTriggers', [...settings.wellness.stressTriggers, tag])}
                onRemove={(tag) => updateSetting('wellness', 'stressTriggers', settings.wellness.stressTriggers.filter(t => t !== tag))}
              />
            </SettingCard>

            <SettingCard>
              <AuraSettingRow label={t('settings.wakeTime')}>
                <Input type="time" value={settings.wellness.wakeTime} onChange={(val) => updateSetting('wellness', 'wakeTime', val)} />
              </AuraSettingRow>
              <AuraSettingRow label={t('settings.avgSleepTarget')}>
                  <SegmentedControl 
                    options={[{value:'6h',label:'6h'},{value:'7h',label:'7h'},{value:'8h',label:'8h'},{value:'9h+',label:'9h+'}]} 
                    value={settings.wellness.sleepTarget}
                    onChange={(val) => updateSetting('wellness', 'sleepTarget', val)}
                  />
              </AuraSettingRow>
              <AuraSettingRow label={t('settings.weeklyCheckIn')}>
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
              <h2 className={styles.sectionTitle}>{t('settings.sleepTitle')}</h2>
              <p className={styles.sectionSubtitle}>{t('settings.sleepSubtitle')}</p>
            </div>

            <SettingCard>
              <AuraSettingRow 
                label={t('settings.bedtimeWindow')} 
                description={`Target: ${Math.floor(settings.sleep.bedtime[0])}:${(settings.sleep.bedtime[0]%1)*60 || '00'} - ${Math.floor(settings.sleep.bedtime[1])}:${(settings.sleep.bedtime[1]%1)*60 || '00'}`}
              >
                  <DualSlider 
                    min={18} 
                    max={28} 
                    value={settings.sleep.bedtime} 
                    onChange={(val) => updateSetting('sleep', 'bedtime', val)} 
                  />
              </AuraSettingRow>
              <AuraSettingRow label={t('settings.sleepSoundPref')}>
                  <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
                    {[
                      { id: 'Rain', label: t('settings.soundRain') },
                      { id: 'Brown noise', label: t('settings.soundBrownNoise') },
                      { id: 'Silence', label: t('settings.soundSilence') },
                      { id: 'Ocean', label: t('settings.soundOcean') }
                    ].map(s => (
                      <div 
                        key={s.id}
                        className={`${styles.chip} ${settings.sleep.sound === s.id ? styles.chipActive : ''}`}
                        onClick={() => updateSetting('sleep', 'sound', s.id)}
                      >
                        {s.label}
                      </div>
                    ))}
                  </div>
              </AuraSettingRow>
            </SettingCard>

          </section>

          {/* APPEARANCE */}
          <section id="appearance" ref={sectionRefs.appearance} className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>{t('settings.appearanceTitle')}</h2>
              <p className={styles.sectionSubtitle}>{t('settings.appearanceSubtitle')}</p>
            </div>

            <AuraSettingRow label={t('settings.theme')}>
                <SegmentedControl 
                  options={[
                    {value:'system',label:t('settings.themeSystem')},
                    {value:'light',label:t('settings.themeLight')},
                    {value:'dark',label:t('settings.themeDark')}
                  ]} 
                  value={settings.appearance.theme}
                  onChange={(val) => updateSetting('appearance', 'theme', val)}
                />
            </AuraSettingRow>

            <AuraSettingRow label={t('settings.accentColor')}>
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
              label={t('settings.reduceMotion')} 
              checked={settings.appearance.reduceMotion} 
              onChange={(val) => updateSetting('appearance', 'reduceMotion', val)} 
            />

            <AuraToggleRow 
              label={t('settings.denseMode')} 
              checked={settings.appearance.denseMode} 
              onChange={(val) => updateSetting('appearance', 'denseMode', val)} 
            />
          </section>

          {/* DATA & PRIVACY */}
          <section id="data" ref={sectionRefs.data} className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>{t('settings.dataTitle')}</h2>
              <p className={styles.sectionSubtitle}>{t('settings.dataSubtitle')}</p>
            </div>

            <AuraSettingRow 
              label={t('settings.dataExport')} 
              description={t('settings.dataExportDesc')}
            >
              <button 
                className={styles.destructiveButton}
                onClick={async () => {
                  try {
                    const res = await api.requestDataExport();
                    if (res.error) throw new Error(res.error);
                    if (res.data?.data) {
                      const blob = new Blob([JSON.stringify(res.data.data, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `aura_export_${new Date().toISOString().split('T')[0]}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }
                  } catch (e) {
                    setSaveError(e.message);
                  }
                }}
              >
                {t('settings.downloadJson')}
              </button>
            </AuraSettingRow>
            
            <AuraToggleRow 
              label={t('settings.aiPersonalization')} 
              description={t('settings.aiPersonalizationDesc')}
              checked={settings.privacy.personalization} 
              onChange={(val) => updateSetting('privacy', 'personalization', val)} 
            />


          </section>

          {/* DANGER ZONE */}
          <section id="danger" ref={sectionRefs.danger} className={styles.section}>
            <div className={styles.dangerZone}>
              <h2 className={styles.dangerTitle}>{t('settings.dangerTitle')}</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span className={styles.label} style={{ color: '#ef4444' }}>{t('settings.deleteAccount')}</span>
                    <p className={styles.description}>{t('settings.deleteDesc')}</p>
                  </div>
                  {expandedRow !== 'delete' && (
                    <button 
                      className={styles.destructiveButton} 
                      style={{ borderColor: '#ef4444', color: '#ef4444' }}
                      onClick={() => setExpandedRow('delete')}
                    >
                      {t('settings.deleteAccountBtn')}
                    </button>
                  )}
                </div>

                {expandedRow === 'delete' && (
                  <div className={styles.confirmContainer} style={{ width: '100%', animation: 'expandWidth 400ms var(--ease-spring)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <span style={{ fontSize: '14px', fontWeight: 500 }}>{t('settings.deleteConfirmMsg')}</span>
                      <div className={styles.inlineEditActions}>
                        <button className={styles.destructiveButton} onClick={() => setExpandedRow(null)}>{t('settings.cancel')}</button>
                        <button 
                          className={styles.saveButton} 
                          style={{ background: '#ef4444' }} 
                          disabled={settings.deleteConfirm !== 'DELETE'}
                          onClick={async () => {
                            try {
                              const result = await api.deleteAccount('DELETE');
                              if (result.error) throw new Error(result.error);
                              logout();
                            } catch (e) {
                              setSaveError(e.message);
                            }
                          }}
                        >
                          {t('settings.confirmDelete')}
                        </button>
                      </div>
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <p style={{ fontSize: '12px', color: 'var(--aura-muted)', marginBottom: 8 }}>{t('settings.typeDelete')}</p>
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
              <span>{t('settings.unsavedChanges')}</span>
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
                  <span>{t('settings.saved')}</span>
                </>
              ) : (
                t('settings.saveChanges')
              )}
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
