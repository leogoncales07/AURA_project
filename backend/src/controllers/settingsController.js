import { catchAsync } from '../utils/catchAsync.js';
import { checked } from '../services/wellnessService.js';
import { z } from 'zod';

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const settingsSchema = z.object({
  primary_goal: z.string().max(100), occupation_type: z.string().max(100), activity_level: z.string().max(100),
  sleep_target_hours: z.number().min(4).max(12), wind_down_minutes: z.number().min(0).max(180),
  sleep_sound_pref: z.string().max(50), theme: z.enum(['system', 'light', 'dark']),
  accent_color: z.union([z.enum(['violet', 'blue', 'sage', 'lavender', 'amber', 'rose']), z.string().regex(/^#[0-9a-fA-F]{6}$/)]),
  daily_reminder_time: time, notif_intensity: z.number().int().min(1).max(3),
  push_enabled: z.boolean(), streak_alerts: z.boolean(), milestone_alerts: z.boolean(),
  email_weekly_summary: z.boolean(), email_tips: z.boolean(), email_product: z.boolean(),
  weekly_report_day: z.string().max(20), weekly_checkin_day: z.union([z.string().max(20), z.number().int().min(0).max(6)]),
  wellness_goals: z.array(z.string().max(100)).max(30), stress_triggers: z.array(z.string().max(100)).max(30),
  target_wake_time: time, target_bedtime_start: z.number().min(0).max(24), target_bedtime_end: z.number().min(0).max(24),
  sleep_debt_tracking: z.boolean(), reduce_motion: z.boolean(), text_size: z.enum(['small', 'default', 'large']),
  dense_mode: z.boolean(), analytics_opt_out: z.boolean(), personalization: z.boolean(),
  data_retention: z.string().max(30), language: z.enum(['pt', 'en', 'es', 'fr', 'de']),
}).partial().strict();

const defaults = { theme: 'dark', accent_color: 'violet', sleep_target_hours: 8, wind_down_minutes: 30,
  daily_reminder_time: '21:00', notif_intensity: 2, push_enabled: false };

export const getSettings = catchAsync(async (req, res) => {
  const row = await checked(req.supabase.from('app_settings').select('preferences').eq('user_id', req.user.id).maybeSingle());
  res.json({ status: 'success', data: { ...defaults, ...row?.preferences } });
});

export const updateSettings = catchAsync(async (req, res) => {
  const payload = settingsSchema.parse(req.body);
  const preferences = await checked(req.supabase.rpc('save_app_settings', { payload }));
  res.json({ status: 'success', data: { ...defaults, ...preferences } });
});
