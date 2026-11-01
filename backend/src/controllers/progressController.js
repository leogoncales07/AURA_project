import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/appError.js';
import { checked, wellness } from '../services/wellnessService.js';
import { calendarDay, journeyEntries, monthlySnapshot, readProgress } from '../services/progressService.js';

const timezone = z.string().max(64).default('UTC').refine(value => {
  try { new Intl.DateTimeFormat('en', { timeZone: value }); return true; } catch { return false; }
}, 'Invalid time zone');
const reportOptions = z.object({ period: z.string().regex(/^20\d{2}-(0[1-9]|1[0-2])$/), time_zone: timezone });
export const newRecordId = (req, res) => res.set('Cache-Control', 'no-store').json({ id: randomUUID() });
function reportInput(input) {
  const parsed = reportOptions.parse(input);
  if (parsed.period > calendarDay({ created_at: new Date().toISOString() }, parsed.time_zone).slice(0, 7)) throw new AppError('Select a current or past month', 400);
  return parsed;
}

export const getProgress = catchAsync(async (req, res) => {
  const timeZone = timezone.parse(req.query.time_zone);
  const [data, reports] = await Promise.all([readProgress(req.supabase, req.user.id), wellness(req.supabase, req.user.id).reports()]);
  res.set('Cache-Control', 'no-store').json({ entries: journeyEntries(data, timeZone), reports });
});

export const previewReport = catchAsync(async (req, res) => {
  const { period, time_zone } = reportInput(req.query);
  const data = await readProgress(req.supabase, req.user.id);
  res.set('Cache-Control', 'no-store').json({ snapshot: monthlySnapshot(data, period, time_zone) });
});

export const saveReport = catchAsync(async (req, res) => {
  const body = reportOptions.extend({ id: z.string().uuid() }).strict().parse(req.body);
  const { period, time_zone } = reportInput(body);
  const table = () => req.supabase.from('wellness_reports');
  const existing = await checked(table().select('*').eq('user_id', req.user.id).eq('id', body.id).maybeSingle());
  if (existing) return res.json({ report: existing });
  const data = await readProgress(req.supabase, req.user.id);
  const snapshot = monthlySnapshot(data, period, time_zone);
  await checked(table().upsert({ id: body.id, user_id: req.user.id, period, snapshot }, { onConflict: 'id', ignoreDuplicates: true }));
  const report = await checked(table().select('*').eq('user_id', req.user.id).eq('id', body.id).maybeSingle());
  if (!report) throw new AppError('Report could not be saved. Please try again.', 409);
  res.status(201).json({ report });
});

export const deleteReport = catchAsync(async (req, res) => {
  const id = z.string().uuid().parse(req.params.id);
  const rows = await checked(req.supabase.from('wellness_reports').delete().eq('user_id', req.user.id).eq('id', id).select('id'));
  if (!rows.length) throw new AppError('Report not found', 404);
  res.json({ success: true });
});

export const completeMeditation = catchAsync(async (req, res) => {
  const input = z.object({
    id: z.string().uuid(), user_id: z.string().optional(),
    practice_id: z.enum(['box_breathing', '478_breathing', 'body_scan', '54321_grounding', 'military_method', 'stimulus_control']),
    title: z.string().trim().min(1).max(200),
    duration_seconds: z.number().int().min(30).max(7200),
    practiced_seconds: z.number().int().min(27).max(7202),
  }).strict().refine(value => value.practiced_seconds >= value.duration_seconds * .9 && value.practiced_seconds <= value.duration_seconds + 2,
    'Complete the practice before saving it').parse(req.body);
  const { user_id, ...record } = input;
  await checked(req.supabase.from('meditation_sessions').upsert({ ...record, user_id: req.user.id }, { onConflict: 'id', ignoreDuplicates: true }));
  const session = await checked(req.supabase.from('meditation_sessions').select('*').eq('user_id', req.user.id).eq('id', record.id).maybeSingle());
  if (!session) throw new AppError('Practice could not be saved. Please try again.', 409);
  res.status(201).json({ session });
});

export const editReflection = catchAsync(async (req, res) => {
  const id = z.string().uuid().parse(req.params.id);
  const { text } = z.object({ text: z.string().trim().min(1).max(6000) }).strict().parse(req.body);
  const reflection = await checked(req.supabase.from('reflections').update({ text }).eq('user_id', req.user.id).eq('id', id).select('*').maybeSingle());
  if (!reflection) throw new AppError('Reflection not found', 404);
  res.json({ reflection });
});
export const deleteReflection = catchAsync(async (req, res) => {
  const id = z.string().uuid().parse(req.params.id);
  const rows = await checked(req.supabase.from('reflections').delete().eq('user_id', req.user.id).eq('id', id).select('id'));
  if (!rows.length) throw new AppError('Reflection not found', 404);
  res.json({ success: true });
});
