import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/appError.js';
import { createAuthClient, updateAuthUser } from '../services/supabaseService.js';
import { z } from 'zod';

const credentials = z.object({ email: z.string().email(), password: z.string().min(1).max(200) });
export const signup = catchAsync(async (req, res, next) => {
  const { email, password, name } = credentials.extend({ password: z.string().min(8).max(200), name: z.string().trim().min(1).max(100) }).parse(req.body);
  const { data, error } = await createAuthClient().auth.signUp({ email, password, options: { data: { name } } });
  if (error) return next(new AppError(error.message, error.status || 400));
  res.json(data.session ? { ...data.session, user: data.user } : { ...data, confirmation_required: true });
});
export const login = catchAsync(async (req, res, next) => {
  const input = credentials.parse(req.body);
  const { data, error } = await createAuthClient().auth.signInWithPassword(input);
  if (error) return next(new AppError(error.message, 401));
  res.json({ ...data.session, user: data.user });
});
export const refresh = catchAsync(async (req, res, next) => {
  const input = z.object({ refresh_token: z.string().min(1).max(4000) }).parse(req.body);
  const { data, error } = await createAuthClient().auth.refreshSession(input);
  if (error) return next(new AppError('Session expired. Please sign in again.', 401));
  res.json({ ...data.session, user: data.user });
});
export const getMe = catchAsync(async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return next(new AppError('No token provided', 401));
  const { data: { user }, error } = await createAuthClient().auth.getUser(token);
  if (error || !user) return next(new AppError('Invalid token', 401));
  res.json({ user });
});
export const logout = catchAsync(async (req, res, next) => {
  const { default: admin } = await import('../services/supabaseService.js');
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return next(new AppError('No token provided', 401));
  const { error } = await admin.auth.admin.signOut(token, 'local');
  if (error) return next(new AppError(error.message, 400));
  res.json({ success: true });
});
export const forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = z.object({ email: z.string().email() }).parse(req.body);
  const redirectTo = process.env.PASSWORD_RESET_URL;
  if (!redirectTo) return next(new AppError('Password recovery is not configured. Please contact support.', 503));
  const { error } = await createAuthClient().auth.resetPasswordForEmail(email, { redirectTo });
  if (error) {
    // Log provider codes only; emails, links and tokens never belong in diagnostics.
    console.warn('[Password recovery]', { status: error.status, code: error.code });
    const isConfiguration = error.code === 'email_address_not_authorized' || error.status === 403 || error.status >= 500;
    const failure = new AppError(isConfiguration ? 'Recovery email delivery is unavailable. Please contact support.' : 'Unable to send recovery email. Please try again.', error.status === 429 ? 429 : isConfiguration ? 503 : 400);
    failure.errorCode = isConfiguration ? 'RECOVERY_DELIVERY_UNAVAILABLE' : error.status === 429 ? 'RECOVERY_RATE_LIMITED' : 'RECOVERY_REQUEST_FAILED';
    return next(failure);
  }
  res.json({ status: 'success', message: 'If this account exists, password reset instructions will be sent.' });
});
export const resetPassword = catchAsync(async (req, res, next) => {
  const { password } = z.object({ password: z.string().min(8).max(200) }).parse(req.body);
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return next(new AppError('Recovery session required', 401));
  const { error } = await updateAuthUser(token, { password });
  if (error) return next(new AppError(error.message, error.status || 400));
  res.json({ status: 'success' });
});
