import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/appError.js';
import supabase from '../services/supabaseService.js';
import pool from '../db/db.js';

export const signup = catchAsync(async (req, res, next) => {
  const { email, password, name } = req.body;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name
      }
    }
  });

  if (error) {
    return next(new AppError(error.message, error.status || 400));
  }

  // Create user in our DB if required
  if (data.user) {
    try {
      const check = await pool.query('SELECT id FROM users WHERE id = $1', [data.user.id]);
      if (check.rows.length === 0) {
        await pool.query('INSERT INTO users (id, name, email) VALUES ($1, $2, $3)', [data.user.id, name, email]);
      }
    } catch (dbErr) {
      console.error('Failed to create user in DB:', dbErr);
    }
  }

  res.status(200).json(data.session ? { ...data.session, user: data.user } : data);
});

export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    return next(new AppError(error.message, 401));
  }

  res.status(200).json({ ...data.session, user: data.user });
});

export const refresh = catchAsync(async (req, res, next) => {
  const { refresh_token } = req.body;
  
  const { data, error } = await supabase.auth.refreshSession({ refresh_token });
  if (error) return next(new AppError(error.message, 401));

  res.status(200).json({ ...data.session, user: data.user });
});

export const getMe = catchAsync(async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return next(new AppError('No token provided', 401));

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return next(new AppError(error?.message || 'Invalid token', 401));
  }

  res.status(200).json({ user });
});

export const logout = catchAsync(async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return next(new AppError('No token provided', 401));

  const { error } = await supabase.auth.signOut(token);
  if (error) return next(new AppError(error.message, 400));

  res.status(200).json({ success: true, message: 'Logged out successfully' });
});
