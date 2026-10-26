import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/appError.js';
import pool from '../db/db.js';
import { cache } from '../services/cacheService.js';
import { z } from 'zod';
import sharp from 'sharp';
import supabase, { createAuthClient, updateAuthUser } from '../services/supabaseService.js';

const profileSchema = z.object({
  display_name: z.string().max(100).optional(),
  username: z.string().regex(/^[a-z0-9_]{3,30}$/).optional(),
  bio: z.string().max(120).optional(),
  date_of_birth: z.string().optional(), // In production, add date validation
  timezone: z.string().optional(),
  country_code: z.string().length(2).optional(),
  language: z.string().max(10).optional(),
  gender: z.string().max(30).optional(),
  phone: z.string().max(20).optional()
});

export const getProfile = catchAsync(async (req, res, next) => {
  // req.user is populated from Supabase by the protect middleware
  // No local DB query needed — return user data directly
  const { current_token_hash, ...profile } = req.user;

  res.status(200).json({
    status: 'success',
    data: profile
  });
});

export const updateProfile = catchAsync(async (req, res, next) => {
  const validatedData = profileSchema.parse(req.body);
  if (!Object.keys(validatedData).length) return next(new AppError('No data provided to update', 400));
  if (validatedData.display_name !== undefined) validatedData.name = validatedData.display_name;
  const { data, error } = await updateAuthUser(req.accessToken, { data: validatedData });
  if (error) return next(new AppError(error.message, error.status || 400));
  res.json({ status: 'success', data: { ...data.user.user_metadata, id: data.user.id, email: data.user.email } });
});

export const changeEmailRequest = catchAsync(async (req, res, next) => {
  const { new_email, current_password } = z.object({ new_email: z.string().email(), current_password: z.string().min(1) }).parse(req.body);
  const { error: authError } = await createAuthClient().auth.signInWithPassword({ email: req.user.email, password: current_password });
  if (authError) return next(new AppError('Invalid password', 403));
  const { error } = await updateAuthUser(req.accessToken, { email: new_email });
  if (error) return next(new AppError(error.message, error.status || 400));
  res.json({ status: 'success', message: 'Confirm the email change using the verification email.' });
});

export const resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.webp`;

  const processedBuffer = await sharp(req.file.buffer)
    .resize(400, 400)
    .toFormat('webp')
    .webp({ quality: 90 })
    .toBuffer();

  req.file.buffer = processedBuffer;
  next();
});

export const uploadAvatar = catchAsync(async (req, res, next) => {
  if (!req.file) return next(new AppError('Please upload a file', 400));

  const userId = req.user.id;
  const fileName = req.file.filename;

  // 1) Get old avatar to delete
  const userRes = await pool.query('SELECT avatar_url FROM users WHERE id = $1', [userId]);
  const oldAvatarUrl = userRes.rows[0].avatar_url;

  // 2) Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(fileName, req.file.buffer, {
      contentType: 'image/webp',
      upsert: true
    });

  if (error) return next(new AppError(`Upload failed: ${error.message}`, 500));

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName);

  // 3) Update User in DB
  await pool.query('UPDATE users SET avatar_url = $1 WHERE id = $2', [publicUrl, userId]);

  // 4) Delete old avatar from storage if exists
  if (oldAvatarUrl) {
    const oldFileName = oldAvatarUrl.split('/').pop();
    await supabase.storage.from('avatars').remove([oldFileName]);
  }

  await cache.del(`user_profile:${userId}`);

  res.status(200).json({
    status: 'success',
    data: { avatar_url: publicUrl }
  });
});

export const deleteAvatar = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  const userRes = await pool.query('SELECT avatar_url FROM users WHERE id = $1', [userId]);
  const avatarUrl = userRes.rows[0].avatar_url;

  if (avatarUrl) {
    const fileName = avatarUrl.split('/').pop();
    await supabase.storage.from('avatars').remove([fileName]);
    await pool.query('UPDATE users SET avatar_url = NULL WHERE id = $1', [userId]);
    await cache.del(`user_profile:${userId}`);
  }

  res.status(204).json({ status: 'success', data: null });
});
