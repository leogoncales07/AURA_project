import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/appError.js';
import pool from '../db/db.js';
import { cache } from '../services/cacheService.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import sharp from 'sharp';
import supabase from '../services/supabaseService.js';

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
  const userId = req.user.id;
  
  // 1) Validate body
  const validatedData = profileSchema.parse(req.body);
  
  // 2) Check if username is taken
  if (validatedData.username) {
    const existing = await pool.query(
      'SELECT id FROM users WHERE username = $1 AND id != $2',
      [validatedData.username, userId]
    );
    if (existing.rows.length > 0) {
      return next(new AppError('Username already in use', 422));
    }
  }

  // 3) Update DB
  const fields = Object.keys(validatedData);
  const values = Object.values(validatedData);
  
  if (fields.length === 0) {
    return next(new AppError('No data provided to update', 400));
  }

  const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
  const query = `UPDATE users SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`;
  
  const result = await pool.query(query, [userId, ...values]);
  
  // 4) Cleanup and Audit
  const updatedUser = result.rows[0];
  delete updatedUser.password_hash;
  
  await cache.del(`user_profile:${userId}`);
  
  await pool.query(
    'INSERT INTO audit_log (user_id, action, metadata) VALUES ($1, $2, $3)',
    [userId, 'profile.updated', JSON.stringify(validatedData)]
  );

  res.status(200).json({
    status: 'success',
    data: updatedUser
  });
});

export const changeEmailRequest = catchAsync(async (req, res, next) => {
  const { new_email, current_password } = req.body;
  const userId = req.user.id;

  // 1) Verify password
  const userRes = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
  const isMatch = await bcrypt.compare(current_password, userRes.rows[0].password_hash);
  if (!isMatch) return next(new AppError('Invalid password', 401));

  // 2) Check if email taken
  const emailRes = await pool.query('SELECT id FROM users WHERE email = $1', [new_email]);
  if (emailRes.rows.length > 0) return next(new AppError('Email already registered', 422));

  // 3) Store in Redis and Send Verification (Mocked email)
  const token = jwt.sign({ userId, new_email }, process.env.JWT_SECRET, { expiresIn: '24h' });
  await cache.set(`email_change:${userId}`, new_email, 86400); // 24h

  // Mock sending email
  console.log(`Verification email sent to ${new_email} with token: ${token}`);

  await pool.query(
    'INSERT INTO audit_log (user_id, action, metadata) VALUES ($1, $2, $3)',
    [userId, 'email.change_requested', JSON.stringify({ new_email })]
  );

  res.status(200).json({
    status: 'success',
    message: 'Verification sent to new email'
  });
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
