import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/appError.js';
import supabase from '../services/supabaseService.js';
import { checked, wellness } from '../services/wellnessService.js';
import { purgeLegacyData } from '../services/legacyDataService.js';

export const requestDataExport = catchAsync(async (req, res) => {
  const data = wellness(req.supabase, req.user.id);
  const [moodLogs, sleepLogs, assessments, reflections, conversations, settings] = await Promise.all([
    data.logs(), data.sleep(), data.assessments(), data.reflections(), data.threads(),
    checked(req.supabase.from('app_settings').select('preferences').eq('user_id', req.user.id).maybeSingle()),
  ]);
  const { current_token_hash, ...user } = req.user;
  res.json({ status: 'success', data: {
    exportedAt: new Date().toISOString(), user, moodLogs, sleepLogs, assessments, reflections,
    conversations, settings: settings?.preferences || {},
  } });
});

export const deleteWellnessData = catchAsync(async (req, res, next) => {
  if (req.body.confirm !== 'DELETE') return next(new AppError('Please confirm by typing DELETE', 400));
  await checked(req.supabase.rpc('delete_wellness_data'));
  await purgeLegacyData(req.user.id);
  res.json({ status: 'success', message: 'Wellness data deleted successfully' });
});

export const deleteAccount = catchAsync(async (req, res, next) => {
  if (req.body.confirm !== 'DELETE') return next(new AppError('Please confirm by typing DELETE', 400));
  if (!process.env.S_SERV) return next(new AppError('Account deletion is not configured. Please contact support.', 503));
  const version = await checked(req.supabase.rpc('aura_storage_version'));
  if (version !== 1) return next(new AppError('Account deletion requires the database migration.', 503));
  await purgeLegacyData(req.user.id, true);
  // The database trigger removes application records in the Auth deletion transaction.
  const { error } = await supabase.auth.admin.deleteUser(req.user.id);
  if (error) return next(new AppError('Unable to delete account. Please try again or contact support.', 503));
  res.json({ status: 'success', message: 'Account deleted successfully' });
});
